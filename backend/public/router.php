<?php
/**
 * Router de Emergencia - Inyección de Módulos de Autenticación Faltantes
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    $projectRoot = dirname(__DIR__);
    $envFile = $projectRoot . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }

    try {
        $dsn = "mysql:host=" . ($_ENV['DB_HOST'] ?? 'localhost') . ";dbname=" . ($_ENV['DB_NAME'] ?? 'railway') . ";port=" . ($_ENV['DB_PORT'] ?? '3306') . ";charset=utf8mb4";
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo "=== INYECTANDO MÓDULO DE AUTENTICACIÓN Y LOGS ===\n";
        
        $sqlAutenticacion = <<<'SQL'
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de sesiones persistentes
CREATE TABLE IF NOT EXISTS sesiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    dispositivo VARCHAR(255),
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    ip_address VARCHAR(45),
    ubicacion_aproximada VARCHAR(255),
    es_confiable TINYINT(1) DEFAULT 0,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla de tokens de recuperación
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    tipo ENUM('password', 'pin', 'email_verificacion') NOT NULL,
    intentos INT UNSIGNED DEFAULT 0,
    usado TINYINT(1) DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de log de accesos (La que causó el error)
CREATE TABLE IF NOT EXISTS log_accesos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    email_intento VARCHAR(255),
    accion ENUM('login_exitoso', 'login_fallido', 'logout', 'recuperacion_solicitada', 'recuperacion_exitosa', 'bloqueo_cuenta', 'cambio_password', 'cambio_pin') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Crear un usuario Administrador de prueba si no existe para que puedas loguearte
-- Nota: Asegúrate de que las contraseñas coincidan con el hash de tu sistema o cámbialo en el login
INSERT IGNORE INTO usuarios (id, email, password_hash, nombre_completo, rol_id, activo, primer_acceso) VALUES
(1, 'admin@vitalia.app', '$2y$10$oR1G3H4S5H6a7b8c9d0e1uF...TuHashAqui...', 'Administrador Azaria', 1, 1, 0);

SET FOREIGN_KEY_CHECKS = 1;
SQL;

        $pdo->exec($sqlAutenticacion);
        echo "¡Tablas 'log_accesos', 'sesiones' y 'tokens_recuperacion' creadas exitosamente! ✅\n";
        
    } catch (Exception $e) {
        echo "[ERROR]: " . $e->getMessage() . "\n";
    }
    exit;
}

if (strpos($uri, '/api/') === 0) {
    require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
    exit;
}

$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false;
}

$reactIndex = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
if (file_exists($reactIndex)) {
    header("Content-Type: text/html; charset=UTF-8");
    readfile($reactIndex);
    exit;
}

require $_SERVER['DOCUMENT_ROOT'] . '/index.php';