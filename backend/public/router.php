<?php
/**
 * Router de Emergencia - Creación de Administrador Real
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
        
        echo "=== CREANDO USUARIO ADMINISTRADOR REAL ===\n";
        
        // 1. Limpiamos el registro incompleto anterior si existe
        $pdo->exec("DELETE FROM usuarios WHERE email = 'admin@vitalia.app'");
        
        // 2. Generamos el hash real de PHP para la contraseña "admin123" (Cámbiala aquí si prefieres otra)
        $passwordPlana = 'admin123';
        $passwordHash = password_hash($passwordPlana, PASSWORD_BCRYPT);
        
        // 3. Insertar el usuario con el rol 1 (administrador)
        $stmt = $pdo->prepare("INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, activo, primer_acceso, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'admin@vitalia.app',
            $passwordHash,
            'Administrador Azaria',
            1, // ID del rol administrador
            1, // Activo
            0, // Primer acceso completado
            1  // Email verificado
        ]);
        
        echo "¡Usuario 'admin@vitalia.app' creado con éxito! 🎉\n";
        echo "Contraseña asignada de forma segura: $passwordPlana\n";
        
    } catch (Exception $e) {
        echo "[ERROR AL CREAR USUARIO]: " . $e->getMessage() . "\n";
    }
    exit;
}

// El resto de tus rutas normales de la API y React se quedan igual abajo...
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