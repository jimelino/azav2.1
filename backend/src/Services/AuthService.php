<?php

namespace App\Services;

use App\Models\User;

class AuthService
{
    private $pinService;

    public function __construct()
    {
        $this->pinService = new PINService();
    }

    public function registerUser($data)
    {
        // Generar contraseña temporal simple
        $temporalPassword = $this->generateTemporalPassword();

        $userData = [
            'email' => $data['email'],
            'password' => $temporalPassword,
            'nombre_completo' => $data['nombre_completo'],
            'rol' => $data['rol'],
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null
        ];

        $user = User::create($userData);

        return [
            'success' => true,
            'user' => $user,
            'credentials' => [
                'email' => $data['email'],
                'password' => $temporalPassword
            ]
        ];
    }

  public function login($email, $credential, $remember = false)
{
    $user = User::findByEmail($email);

    error_log("========== LOGIN ==========");
    error_log("EMAIL: " . $email);

    if (!$user) {
        error_log("USUARIO NO ENCONTRADO");
        return ['success' => false];
    }

    error_log("USUARIO ENCONTRADO:");
    error_log(print_r($user, true));

    error_log("PASSWORD RECIBIDO:");
    error_log($credential);

    $passwordField = $user['password_hash'] ?? null;

    error_log("HASH BD:");
    error_log($passwordField);

    if (!$passwordField) {
        error_log("NO EXISTE password_hash");
        return ['success' => false];
    }

    $verify = password_verify($credential, $passwordField);

    error_log("RESULTADO PASSWORD_VERIFY:");
    error_log($verify ? "SI" : "NO");

    if ($verify) {

        $this->resetFailedAttempts($email);
        $this->logAccess($user['id'], $email, 'login_exitoso');
        $this->updateLastAccess($user['id']);

        return [
            'success' => true,
            'user' => $this->sanitizeUser($user)
        ];
    }

    // Intentar con PIN
    if (
        !empty($user['usar_pin']) &&
        !empty($user['pin_hash']) &&
        password_verify($credential, $user['pin_hash'])
    ) {

        $this->resetFailedAttempts($email);
        $this->logAccess($user['id'], $email, 'login_exitoso');
        $this->updateLastAccess($user['id']);

        return [
            'success' => true,
            'user' => $this->sanitizeUser($user)
        ];
    }

    error_log("LOGIN FALLIDO");

    return ['success' => false];
}

    public function isLocked($email)
    {
        // Verificar si la cuenta está bloqueada por intentos fallidos
        $user = User::findByEmail($email);

        if ($user && $user['bloqueado_hasta']) {
            $bloqueadoHasta = strtotime($user['bloqueado_hasta']);
            if ($bloqueadoHasta > time()) {
                return true;
            }
        }

        // Verificar intentos fallidos recientes
        $attempts = $this->getFailedAttempts($email);
        return $attempts >= 5;
    }

    public function getLockoutTime($email)
    {
        $user = User::findByEmail($email);

        if ($user && $user['bloqueado_hasta']) {
            $bloqueadoHasta = strtotime($user['bloqueado_hasta']);
            $remaining = ceil(($bloqueadoHasta - time()) / 60);
            return max(1, $remaining);
        }

        return 15; // minutos por defecto
    }

    public function recordFailedAttempt($email)
    {
        $db = DatabaseService::getInstance();
        $user = User::findByEmail($email);
        $userId = $user ? $user['id'] : null;

        // Registrar en log_accesos
        $db->query(
            "INSERT INTO log_accesos (usuario_id, email_intento, accion, ip_address, created_at)
             VALUES (?, ?, 'login_fallido', ?, NOW())",
            [$userId, $email, $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']
        );

        // Incrementar contador de intentos fallidos en usuario
        if ($user) {
            $newAttempts = ($user['intentos_fallidos'] ?? 0) + 1;

            if ($newAttempts >= 5) {
                // Bloquear por 15 minutos
                $db->query(
                    "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                     WHERE id = ?",
                    [$newAttempts, $user['id']]
                );
                $this->logAccess($user['id'], $email, 'bloqueo_cuenta');
            } else {
                $db->query(
                    "UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?",
                    [$newAttempts, $user['id']]
                );
            }
        }
    }

    public function getFailedAttempts($email)
    {
        $user = User::findByEmail($email);

        if ($user) {
            return $user['intentos_fallidos'] ?? 0;
        }

        // Contar intentos por email en log_accesos
        $db = DatabaseService::getInstance();
        $result = $db->query(
            "SELECT COUNT(*) as count FROM log_accesos
             WHERE email_intento = ? AND accion = 'login_fallido'
             AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)",
            [$email]
        )->fetch();

        return $result ? $result['count'] : 0;
    }

    public function getAttemptsLeft($email)
    {
        return max(0, 5 - $this->getFailedAttempts($email));
    }

    public function resetFailedAttempts($email)
    {
        $user = User::findByEmail($email);

        if ($user) {
            $db = DatabaseService::getInstance();
            $db->query(
                "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
                [$user['id']]
            );
        }
    }

    public function sendRecoveryCode($email)
    {
        $user = User::findByEmail($email);

        if (!$user) {
            return false;
        }

        $code = $this->generateRecoveryCode();

        // Guardar código en tokens_recuperacion
        $db = DatabaseService::getInstance();
        $db->query(
            "INSERT INTO tokens_recuperacion (usuario_id, codigo, tipo, expira_en, created_at)
             VALUES (?, ?, 'password', DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())",
            [$user['id'], $code]
        );

        // Registrar solicitud
        $this->logAccess($user['id'], $email, 'recuperacion_solicitada');

        // Enviar email con código
        $emailService = new EmailService();
        $emailService->sendRecoveryCode($email, $code);

        return true;
    }

    public function verifyRecoveryCode($email, $code)
    {
        $user = User::findByEmail($email);

        if (!$user) {
            return ['valid' => false];
        }

        $db = DatabaseService::getInstance();
        $result = $db->query(
            "SELECT * FROM tokens_recuperacion
             WHERE usuario_id = ? AND codigo = ? AND expira_en > NOW() AND usado = 0
             ORDER BY created_at DESC LIMIT 1",
            [$user['id'], $code]
        )->fetch();

        if ($result) {
            // Marcar como usado
            $db->query(
                "UPDATE tokens_recuperacion SET usado = 1, intentos = intentos + 1 WHERE id = ?",
                [$result['id']]
            );

            // Generar token de reset firmado: base64(userId:randomBytes:hmac)
            $random = bin2hex(random_bytes(16));
            $payload = $user['id'] . ':' . $random;
            $secret = getenv('APP_KEY') ?: 'azaria_secret_key_2026';
            $hmac = hash_hmac('sha256', $payload, $secret);
            $resetToken = base64_encode($payload . ':' . $hmac);

            return ['valid' => true, 'reset_token' => $resetToken];
        }

        return ['valid' => false];
    }

    public function resetCredential($resetToken, $newCredential)
    {
        try {
            $decoded = base64_decode($resetToken);
            $parts = explode(':', $decoded);

            if (count($parts) !== 3) {
                return false;
            }

            $userId = $parts[0];
            $random = $parts[1];
            $hmac = $parts[2];

            // Verificar firma
            $payload = $userId . ':' . $random;
            $secret = getenv('APP_KEY') ?: 'azaria_secret_key_2026';
            $expectedHmac = hash_hmac('sha256', $payload, $secret);

            if (!hash_equals($expectedHmac, $hmac)) {
                return false;
            }

            // Actualizar contraseña
            $db = DatabaseService::getInstance();
            $passwordHash = password_hash($newCredential, PASSWORD_DEFAULT);

            $db->query(
                "UPDATE usuarios SET password_hash = ?, updated_at = NOW() WHERE id = ?",
                [$passwordHash, $userId]
            );

            return true;
        } catch (\Exception $e) {
            error_log('Error resetting credential: ' . $e->getMessage());
            return false;
        }
    }

    public function markOnboardingComplete($userId)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "UPDATE usuarios SET primer_acceso = 0 WHERE id = ?",
            [$userId]
        );
    }

    public function hasExceededRecoveryLimit($email)
    {
        $user = User::findByEmail($email);

        if (!$user) {
            return false;
        }

        $db = DatabaseService::getInstance();
        $result = $db->query(
            "SELECT COUNT(*) as count FROM tokens_recuperacion
             WHERE usuario_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            [$user['id']]
        )->fetch();

        return $result && $result['count'] >= 5;
    }

    private function generateTemporalPassword()
    {
        $words = ['Salud', 'Vida', 'Fuerza', 'Animo', 'Bienestar'];
        return $words[array_rand($words)] . rand(1000, 9999);
    }

    private function generateRecoveryCode()
    {
        return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function logAccess($userId, $email, $accion)
    {
        $db = DatabaseService::getInstance();
        $db->query(
            "INSERT INTO log_accesos (usuario_id, email_intento, accion, ip_address, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [$userId, $email, $accion, $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']
        );
    }

    private function updateLastAccess($userId)
    {
        $db = DatabaseService::getInstance();
        $db->query(
            "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?",
            [$userId]
        );
    }

    private function sanitizeUser($user)
    {
        // Remover campos sensibles antes de devolver
        unset($user['password_hash']);
        unset($user['pin_hash']);
        unset($user['password']);
        unset($user['pin']);

        // Agregar campo para compatibilidad con frontend
        $user['first_login'] = $user['primer_acceso'] ?? false;

        // Obtener nombre del rol desde la tabla roles
        $db = DatabaseService::getInstance();
        $rol = $db->query(
            "SELECT nombre FROM roles WHERE id = ?",
            [$user['rol_id']]
        )->fetch();
        $user['rol'] = $rol ? $rol['nombre'] : 'paciente';

        // Si es paciente (rol_id = 3), obtener el paciente_id
        if ($user['rol_id'] == 3) {
            $paciente = $db->query(
                "SELECT id FROM pacientes WHERE usuario_id = ?",
                [$user['id']]
            )->fetch();
            $user['paciente_id'] = $paciente ? $paciente['id'] : null;
        }

        // Si es especialista, agregar su área
        if ($user['rol_id'] == 2 && $user['area_medica_id']) {
            $area = $db->query(
                "SELECT nombre, color, icono FROM areas_medicas WHERE id = ?",
                [$user['area_medica_id']]
            )->fetch();
            // area_medica es el código usado por el frontend (fisioterapia, nutricion, medicina, etc.)
            $user['area_medica'] = $area ? $area['nombre'] : 'medicina';
            $user['area_nombre'] = $area ? ucfirst($area['nombre']) : 'Medicina General';
            $user['area_color'] = $area ? $area['color'] : '#F44336';
            $user['area_icono'] = $area ? $area['icono'] : 'medical_services';
            // También guardar el id del especialista para uso en el dashboard
            $user['especialista_id'] = $user['id'];
        }

        return $user;
    }
}
