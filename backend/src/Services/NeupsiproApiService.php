<?php

namespace App\Services;

use RuntimeException;

/**
 * Cliente de integración con neupsipro (https://neurogolondrina.com).
 *
 * IMPORTANTE: este servicio SOLO usa endpoints que ya existen hoy en
 * neupsipro. No requiere ni asume ningún cambio en ese proyecto.
 *
 * Estrategia de autenticación:
 *   - Se usa UNA cuenta de servicio (NEUPSIPRO_SERVICE_USERNAME /
 *     NEUPSIPRO_SERVICE_PASSWORD) con permisos de 'user management:consultation'
 *     y 'Tests:consultation' en neupsipro.
 *   - Se hace login una vez, el JWT se cachea en la tabla
 *     neupsipro_service_session y se reutiliza hasta que expira.
 *   - No se le pide credenciales de neupsipro a cada paciente.
 *
 * Vinculación entre plataformas:
 *   - neupsipro NO expone ningún endpoint JSON para buscar un paciente
 *     por correo. Solo se puede ir de id_user -> correo (vía
 *     GET /users/:id_user), nunca de correo -> id_user directamente.
 *   - Por eso existe syncAll(): recorre /api/users (paginado) y por cada
 *     paciente resuelve su correo, folio y colaborador, guardándolo en
 *     neupsipro_vinculos. Después de la primera sincronización, resolver
 *     un paciente por correo es una simple lectura en la BD de azav2.1.
 *
 * Nota sobre "evaluaciones": neupsipro no tiene un endpoint JSON que
 * liste las aplicaciones/evaluaciones de un paciente. La única fuente de
 * ese listado es el HTML de GET /users/:id_user, que incrusta el objeto
 * completo del usuario en `window.__USER_DATA__ = {...};`. Este servicio
 * parsea ese bloque. Si neupsipro llegara a cambiar esa vista, solo se
 * rompe el parseo aquí adentro (extractUserDataFromHtml) y no el resto
 * de la integración.
 */
class NeupsiproApiService
{
    private $baseUrl;
    private $serviceUsername;
    private $servicePassword;
    private $timeout;
    private $db;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) (getenv('NEUPSIPRO_BASE_URL') ?: ''), '/');
        $this->serviceUsername = (string) (getenv('NEUPSIPRO_SERVICE_USERNAME') ?: '');
        $this->servicePassword = (string) (getenv('NEUPSIPRO_SERVICE_PASSWORD') ?: '');
        $this->timeout = (int) (getenv('NEUPSIPRO_API_TIMEOUT') ?: 15);
        $this->db = DatabaseService::getInstance();
    }

    private function assertConfigured(): void
    {
        if ($this->baseUrl === '' || $this->serviceUsername === '' || $this->servicePassword === '') {
            throw new RuntimeException('La integración con neupsipro no está configurada (revisa NEUPSIPRO_BASE_URL / NEUPSIPRO_SERVICE_USERNAME / NEUPSIPRO_SERVICE_PASSWORD)');
        }
    }

    // =====================================================================
    // AUTENTICACIÓN (cuenta de servicio)
    // =====================================================================

    /**
     * Devuelve un JWT válido, reusando el cacheado si no ha expirado.
     */
    private function getServiceToken(bool $forceRefresh = false): string
    {
        $this->assertConfigured();

        if (!$forceRefresh) {
            $row = $this->db->query(
                'SELECT token, expires_at FROM neupsipro_service_session ORDER BY id DESC LIMIT 1'
            )->fetch(\PDO::FETCH_ASSOC);

            if ($row && strtotime($row['expires_at']) > time() + 30) {
                return $row['token'];
            }
        }

        return $this->login();
    }

    private function login(): string
    {
        $url = $this->baseUrl . '/auth/login';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'username' => $this->serviceUsername,
                'password' => $this->servicePassword,
            ]),
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $this->timeout,
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false || $error !== '') {
            throw new RuntimeException('No se pudo contactar a neupsipro para autenticar: ' . ($error ?: 'error de red'));
        }

        $decoded = json_decode($body, true);
        if ($status >= 400 || !is_array($decoded) || empty($decoded['token'])) {
            throw new RuntimeException('neupsipro rechazó el login de la cuenta de servicio (HTTP ' . $status . ')');
        }

        $token = $decoded['token'];
        $expiresAt = $this->extractJwtExpiry($token) ?? (time() + 2 * 3600 - 60);

        $this->db->query('DELETE FROM neupsipro_service_session');
        $this->db->query(
            'INSERT INTO neupsipro_service_session (token, expires_at) VALUES (?, ?)',
            [$token, date('Y-m-d H:i:s', $expiresAt)]
        );

        return $token;
    }

    /**
     * Lee el claim "exp" del JWT sin validar la firma (solo para saber
     * cuándo refrescar el caché; la validación real la hace neupsipro).
     */
    private function extractJwtExpiry(string $jwt): ?int
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        $b64 = strtr($parts[1], '-_', '+/');
        $padded = str_pad($b64, strlen($b64) + (4 - strlen($b64) % 4) % 4, '=');
        $payload = json_decode(base64_decode($padded), true);

        return isset($payload['exp']) ? (int) $payload['exp'] : null;
    }

    // =====================================================================
    // HTTP HELPERS
    // =====================================================================

    /**
     * Llamada JSON genérica. Reintenta una vez si el token cacheado ya
     * expiró en el servidor (401), forzando un relogin.
     */
    private function requestJson(string $method, string $path, array $query = [], bool $isRetry = false): array
    {
        [$status, $body] = $this->rawRequest($method, $path, $query, ['Accept: application/json']);

        if ($status === 401 && !$isRetry) {
            $this->getServiceToken(true);
            return $this->requestJson($method, $path, $query, true);
        }

        $decoded = json_decode($body, true);
        if ($status >= 400) {
            $msg = is_array($decoded) ? ($decoded['error'] ?? $decoded['message'] ?? 'Error desconocido') : 'Error desconocido';
            throw new RuntimeException("neupsipro respondió HTTP {$status} en {$path}: {$msg}");
        }
        if (!is_array($decoded)) {
            throw new RuntimeException("neupsipro devolvió una respuesta no válida en {$path}");
        }

        return $decoded;
    }

    /**
     * Llamada que espera HTML (las vistas server-rendered de neupsipro).
     */
    private function requestHtml(string $path, bool $isRetry = false): string
    {
        [$status, $body] = $this->rawRequest('GET', $path, [], ['Accept: text/html']);

        if ($status === 401 && !$isRetry) {
            $this->getServiceToken(true);
            return $this->requestHtml($path, true);
        }
        if ($status >= 400) {
            throw new RuntimeException("neupsipro respondió HTTP {$status} en {$path}");
        }

        return $body;
    }

    /**
     * Llamada binaria (para el proxy de descarga de PDF).
     * Devuelve [status, body, contentType, contentDisposition].
     */
    public function rawBinaryRequest(string $path, bool $isRetry = false): array
    {
        $token = $this->getServiceToken();
        $url = $this->baseUrl . '/' . ltrim($path, '/');

        $responseHeaders = [];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Accept: application/pdf',
            ],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HEADERFUNCTION => function ($curl, $headerLine) use (&$responseHeaders) {
                $parts = explode(':', $headerLine, 2);
                if (count($parts) === 2) {
                    $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
                }
                return strlen($headerLine);
            },
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false || $error !== '') {
            throw new RuntimeException('No se pudo descargar el archivo desde neupsipro: ' . ($error ?: 'error de red'));
        }

        if ($status === 401 && !$isRetry) {
            $this->getServiceToken(true);
            return $this->rawBinaryRequest($path, true);
        }
        if ($status >= 400) {
            throw new RuntimeException("neupsipro respondió HTTP {$status} al descargar {$path}");
        }

        return [
            $status,
            $body,
            $responseHeaders['content-type'] ?? 'application/pdf',
            $responseHeaders['content-disposition'] ?? null,
        ];
    }

    private function rawRequest(string $method, string $path, array $query, array $extraHeaders): array
    {
        $token = $this->getServiceToken();
        $url = $this->baseUrl . '/' . ltrim($path, '/');
        if ($query) {
            $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($query);
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => array_merge([
                'Authorization: Bearer ' . $token,
            ], $extraHeaders),
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $this->timeout,
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false || $error !== '') {
            throw new RuntimeException("No se pudo contactar a neupsipro ({$path}): " . ($error ?: 'error de red'));
        }

        return [$status, $body];
    }

    // =====================================================================
    // PARSEO DEL HTML DE /users/:id_user (única fuente del listado
    // de evaluaciones, folio, correo y colaborador asignado)
    // =====================================================================

    private function extractUserDataFromHtml(string $html): array
    {
        $marker = 'window.__USER_DATA__ = ';
        $start = strpos($html, $marker);
        if ($start === false) {
            throw new RuntimeException('No se encontró window.__USER_DATA__ en la vista de neupsipro (¿cambió la plantilla?)');
        }
        $start += strlen($marker);

        $end = strpos($html, '</script>', $start);
        if ($end === false) {
            throw new RuntimeException('No se pudo delimitar el bloque de datos del usuario en neupsipro');
        }

        $jsonChunk = rtrim(trim(substr($html, $start, $end - $start)), "; \t\r\n");
        $data = json_decode($jsonChunk, true);

        if (!is_array($data)) {
            throw new RuntimeException('El bloque de datos del usuario en neupsipro no es JSON válido');
        }

        return $data;
    }

    /**
     * Trae el detalle completo (perfil + folio + colaborador + lista de
     * evaluaciones) de un paciente de neupsipro por su id_user.
     */
    public function fetchPatientDetail(string $neupsiproIdUser): array
    {
        $html = $this->requestHtml('/users/' . rawurlencode($neupsiproIdUser));
        $usuario = $this->extractUserDataFromHtml($html);

        return [
            'idUser' => $usuario['idUser'] ?? $neupsiproIdUser,
            'nombreCompleto' => $usuario['name'] ?? null,
            'correo' => $usuario['email'] ?? null,
            'folio' => $usuario['referenceNumber'] ?? null,
            'colaboradorAsignado' => $usuario['assignedClinic'] ?? null,
            'protocolo' => $usuario['protocol'] ?? null,
            'estado' => $usuario['state'] ?? null,
            'proximaCita' => $usuario['nextAppointment'] ?? null,
            'evaluaciones' => array_map(function ($app) {
                return [
                    'idAplicacion' => $app['idApplication'] ?? null,
                    'nombre' => $app['applicationName'] ?? null,
                    'estatus' => $app['status'] ?? null,
                    'fechaCreacion' => $app['createdAt'] ?? null,
                ];
            }, $usuario['assignedApplications'] ?? []),
        ];
    }

    /**
     * Detalle de los tests dentro de una evaluación/aplicación puntual.
     * GET /api/users/:id_user/applications/:id_application/tests
     */
    public function fetchApplicationTests(string $neupsiproIdUser, string $idApplication): array
    {
        $path = '/api/users/' . rawurlencode($neupsiproIdUser) . '/applications/' . rawurlencode($idApplication) . '/tests';
        $result = $this->requestJson('GET', $path);

        $data = $result['data'] ?? [];
        return [
            'estatusAplicacion' => $data['applicationStatus'] ?? null,
            'tests' => array_map(function ($t) {
                return [
                    'idTest' => $t['idTest'] ?? null,
                    'nombre' => $t['testName'] ?? null,
                    'idResultados' => $t['idResults'] ?? null,
                    'estatus' => $t['status'] ?? null,
                    'fechaAplicacion' => $t['dateApplied'] ?? null,
                ];
            }, $data['tests'] ?? []),
        ];
    }

    /**
     * Ruta relativa del PDF de resultados de una evaluación puntual, lista
     * para pasarla a rawBinaryRequest(). No descarga nada por sí misma.
     */
    public function buildExportPath(string $neupsiproIdUser, string $idApplication): string
    {
        return '/users/' . rawurlencode($neupsiproIdUser) . '/applications/' . rawurlencode($idApplication) . '/export';
    }

    // =====================================================================
    // LISTADO PAGINADO (para la sincronización masiva)
    // =====================================================================

    /**
     * GET /api/users?page=&limit= — id, folio, nombre, estado, protocolo.
     * No trae correo (neupsipro no lo expone en el listado).
     */
    public function listPatients(int $page = 1, int $limit = 50): array
    {
        $result = $this->requestJson('GET', '/api/users', ['page' => $page, 'limit' => $limit]);

        return [
            'usuarios' => $result['users'] ?? [],
            'total' => $result['total'] ?? 0,
            'totalPaginas' => $result['totalPages'] ?? 1,
        ];
    }

    // =====================================================================
    // TABLA PUENTE (neupsipro_vinculos)
    // =====================================================================

    public function findLinkByEmail(string $email): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM neupsipro_vinculos WHERE azaria_email = ? LIMIT 1',
            [strtolower(trim($email))]
        )->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function upsertLink(array $detail): void
    {
        if (empty($detail['correo'])) {
            // Sin correo en neupsipro no podemos emparejar con azav2.1;
            // se registra para revisión manual y se sigue de largo.
            error_log('[NeupsiproApiService] Paciente sin correo en neupsipro, no se puede vincular: id_user=' . $detail['idUser']);
            return;
        }

        $email = strtolower(trim($detail['correo']));

        $this->db->query(
            'INSERT INTO neupsipro_vinculos
                (azaria_email, neupsipro_id_user, folio, nombre_completo, colaborador_asignado, protocolo, estatus, ultima_sincronizacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                neupsipro_id_user = VALUES(neupsipro_id_user),
                folio = VALUES(folio),
                nombre_completo = VALUES(nombre_completo),
                colaborador_asignado = VALUES(colaborador_asignado),
                protocolo = VALUES(protocolo),
                estatus = VALUES(estatus),
                ultima_sincronizacion = NOW()',
            [
                $email,
                $detail['idUser'],
                $detail['folio'],
                $detail['nombreCompleto'],
                $detail['colaboradorAsignado'],
                $detail['protocolo'],
                $detail['estado'],
            ]
        );
    }

    /**
     * Sincroniza un paciente puntual (por id_user de neupsipro) hacia la
     * tabla puente. Útil para refrescar a alguien en particular.
     */
    public function syncPatient(string $neupsiproIdUser): array
    {
        $detail = $this->fetchPatientDetail($neupsiproIdUser);
        $this->upsertLink($detail);
        return $detail;
    }

    /**
     * Recorre TODO /api/users (paginado) y por cada paciente resuelve su
     * correo/folio/colaborador vía GET /users/:id_user, guardando el
     * resultado en neupsipro_vinculos. Pensado para correrse por cron
     * (ej. una vez al día) o manualmente desde el panel de admin.
     *
     * $sleepMicroseconds da un pequeño respiro entre requests para no
     * saturar el rate limiter de neupsipro.
     */
    public function syncAll(int $pageSize = 50, int $sleepMicroseconds = 150000): array
    {
        $page = 1;
        $totalSincronizados = 0;
        $errores = [];

        do {
            $listado = $this->listPatients($page, $pageSize);

            foreach ($listado['usuarios'] as $resumen) {
                $idUser = $resumen['id'] ?? null;
                if (!$idUser) {
                    continue;
                }

                try {
                    $this->syncPatient((string) $idUser);
                    $totalSincronizados++;
                } catch (\Throwable $e) {
                    $errores[] = ['id_user' => $idUser, 'error' => $e->getMessage()];
                }

                usleep($sleepMicroseconds);
            }

            $page++;
        } while ($page <= ($listado['totalPaginas'] ?? 1));

        return [
            'sincronizados' => $totalSincronizados,
            'errores' => $errores,
        ];
    }
}
