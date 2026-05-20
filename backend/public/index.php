<?php

// Detectar directorio base del proyecto
// En desarrollo: index.php esta en backend/public/, src/ y config/ estan en backend/
// En produccion: index.php, src/ y config/ estan todos en ~/public_html/api/
if (is_dir(__DIR__ . '/../src') && file_exists(__DIR__ . '/../config/constants.php')) {
    $projectRoot = realpath(__DIR__ . '/..');
} else {
    $projectRoot = __DIR__;
}

// Autoload: Composer si existe, sino manual
$composerAutoload = $projectRoot . '/vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} else {
    // Autoload manual (fallback sin Composer)
    spl_autoload_register(function ($class) use ($projectRoot) {
        $prefix = 'App\\';
        $baseDir = $projectRoot . '/src/';

        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) {
            return;
        }

        $relativeClass = substr($class, $len);
        $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

        if (file_exists($file)) {
            require $file;
        }
    });
}

// Cargar configuracion
require_once $projectRoot . '/config/constants.php';

// Configurar logging a archivo personalizado
ini_set('log_errors', 1);
$logDir = $projectRoot . '/storage/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
ini_set('error_log', $logDir . '/error.log');

// Cargar variables de entorno manualmente
$envFile = $projectRoot . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Configurar headers CORS (whitelist de origenes permitidos)
\App\Middleware\CorsMiddleware::handle();

// Proteccion CSRF para requests mutantes (POST/PUT/DELETE)
\App\Middleware\CsrfMiddleware::handle();

// Servir archivos estaticos de uploads/
$requestUri = $_SERVER['REQUEST_URI'];
$cleanUri = strtok($requestUri, '?');

// Remover base path si existe (ej: /~azaria/api/)
$basePaths = ['/~azaria/api', '/api'];
$normalizedUri = $cleanUri;
foreach ($basePaths as $bp) {
    if (strpos($cleanUri, $bp) === 0) {
        $normalizedUri = substr($cleanUri, strlen($bp));
        break;
    }
}

// Si la URI quedo vacia, usar /
if ($normalizedUri === '' || $normalizedUri === false) {
    $normalizedUri = '/';
}

if (preg_match('#^/uploads/.+\.(jpg|jpeg|png|gif|bmp|pdf|webp|doc|docx)$#i', $normalizedUri)) {
    $filePath = __DIR__ . '/' . ltrim($normalizedUri, '/');
    if (!file_exists($filePath)) {
        $filePath = $projectRoot . '/' . ltrim($normalizedUri, '/');
    }
    if (file_exists($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'bmp' => 'image/bmp', 'webp' => 'image/webp', 'pdf' => 'application/pdf',
            'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=86400');
        readfile($filePath);
        exit;
    }
}

// Router simple
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Usar la URI normalizada (sin prefijo /~azaria) para el routing
// Las rutas en api.php usan /api/... asi que re-agregar /api
$requestUri = '/api' . $normalizedUri;

// Cargar rutas
require_once $projectRoot . '/src/Routes/api.php';

// Si no se encontro ruta, 404
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);