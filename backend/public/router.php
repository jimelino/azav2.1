<?php
/**
 * Router definitivo para Azaria en Railway (Soporte SPA React + API PHP + Migrador Seguro)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. EJECUTAR MIGRACIONES DESDE EL NAVEGADOR (Temporal)
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    // Cargar variables de entorno del backend
    $projectRoot = dirname(__DIR__);
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

    try {
        // Conexión PDO usando las credenciales mapeadas por Railway
        $dsn = "mysql:host=" . ($_ENV['DB_HOST'] ?? 'localhost') . ";dbname=" . ($_ENV['DB_NAME'] ?? 'railway') . ";port=" . ($_ENV['DB_PORT'] ?? '3306') . ";charset=utf8mb4";
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo "=== PASO 1: IMPORTANDO ESTRUCTURA ESQUEMA BASE (azaria_db.sql) ===\n";
        // Buscar el archivo SQL en las ubicaciones posibles
        $sqlFile = __DIR__ . '/azaria_db.sql';
        if (!file_exists($sqlFile)) {
            $sqlFile = $projectRoot . '/database/azaria_db.sql';
        }
        
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            // Ejecutar el volcado completo de tablas estructuradas
            $pdo->exec($sql);
            echo "¡Esquema base inyectado correctamente! ✅\n\n";
        } else {
            echo "[AVISO] No se encontró azaria_db.sql en public o raíz, procediendo directo al lote secuencial.\n\n";
        }
        
    } catch (Exception $e) {
        echo "[INFO/AVISO BD BASE]: " . $e->getMessage() . "\n(Si las tablas ya existían, esto es normal).\n\n";
    }

    echo "=== PASO 2: EJECUTANDO MIGRACIONES SECUENCIALES ===\n";
    $migrateScript = __DIR__ . '/migrate.php';
    if (file_exists($migrateScript)) {
        // Forzamos al script a entender que la acción por defecto es migrar
        $argv = [__FILE__, 'migrate']; 
        include $migrateScript;
    } else {
        echo "[ERROR] No se encontró migrate.php en la carpeta public.\n";
    }
    exit;
}

// 2. Si la petición es explícitamente para la API, mandarla directo al index.php del backend
if (strpos($uri, '/api/') === 0) {
    require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
    exit;
}

// 3. Si la petición apunta a un archivo físico real (imágenes, JS, CSS, etc.) dentro de public/
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false; // PHP sirve el archivo estático directamente de forma nativa
}

// 4. Para todo lo demás (Ruta raíz '/' o rutas visuales de React como '/login'):
$reactIndex = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
if (file_exists($reactIndex)) {
    header("Content-Type: text/html; charset=UTF-8");
    readfile($reactIndex);
    exit;
}

// Fallback por si acaso no encuentra el HTML
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';