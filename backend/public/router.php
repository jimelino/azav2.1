<?php
/**
 * Router definitivo - Sincronización de Sesiones (Alcance PDO corregido)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    // 1. Cargar variables de entorno
    $projectRoot = dirname(__DIR__);
    $envFile = $projectRoot . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }

    try {
        // 2. Conectar a la base de datos
        $dsn = "mysql:host=" . ($_ENV['DB_HOST'] ?? 'localhost') . ";dbname=" . ($_ENV['DB_NAME'] ?? 'railway') . ";port=" . ($_ENV['DB_PORT'] ?? '3306') . ";charset=utf8mb4";
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo "=== REPARACIÓN ESTRUCTURAL DE SESIONES (CORREGIDA) ===\n";
        
        // 3. Ejecutar operaciones con la variable $pdo definida correctamente
        // ... dentro de tu bloque try, reemplaza la creación de la tabla por esta:

        $pdo->exec("DROP TABLE IF EXISTS sesiones_activas;");
        $pdo->exec("CREATE TABLE sesiones_activas (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT UNSIGNED NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            dispositivo VARCHAR(255),
            navegador TEXT,               -- Cambiado de VARCHAR(100) a TEXT
            ip_address VARCHAR(45),
            expira_en TIMESTAMP NOT NULL,
            ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        echo " - Tabla 'sesiones_activas' creada con columna 'navegador' tipo TEXT. ✅\n";
        
        $pdo->exec("DELETE FROM usuarios WHERE email = 'admin@vitalia.app'");
        $stmt = $pdo->prepare("INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, activo, primer_acceso, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['admin@vitalia.app', password_hash('admin123', PASSWORD_BCRYPT), 'Administrador Azaria', 1, 1, 0, 1]);
        
        echo " - Usuario 'admin@vitalia.app' restaurado. ✅\n";
        
    } catch (Exception $e) {
        echo "[ERROR FATAL]: " . $e->getMessage() . "\n";
    }
    exit;
}

// RESTO DEL ENRUTADOR (API y SPA)
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