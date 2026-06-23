<?php
/**
 * Router definitivo para Azaria - Sincronización Completa
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// BLOQUE ÚNICO DE MIGRACIONES Y REPARACIÓN
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    // Carga de variables de entorno
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
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        
        echo "=== INICIANDO SINCRONIZACIÓN TOTAL ===\n";
        
        // 1. Crear espejo de sesiones
        $pdo->exec("CREATE TABLE IF NOT EXISTS sesiones_activas LIKE sesiones;");
        echo " - Tabla 'sesiones_activas' verificada. ✅\n";
        
        // 2. Crear/Resetear Administrador
        $pdo->exec("DELETE FROM usuarios WHERE email = 'admin@vitalia.app'");
        $stmt = $pdo->prepare("INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, activo, primer_acceso, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'admin@vitalia.app',
            password_hash('admin123', PASSWORD_BCRYPT),
            'Administrador Azaria',
            1, 1, 0, 1
        ]);
        echo " - Usuario 'admin@vitalia.app' restaurado (Pass: admin123). ✅\n";
        
        echo "\n¡Sincronización completada con éxito! Ahora puedes iniciar sesión. 🚀\n";
        
    } catch (Exception $e) {
        echo "[ERROR]: " . $e->getMessage() . "\n";
    }
    exit;
}

// RESTO DEL ENRUTADOR
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