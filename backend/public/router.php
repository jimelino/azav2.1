<?php
/**
 * Router definitivo - Sincronización de Sesiones (Alcance PDO corregido)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    echo "=== INICIANDO MIGRACIÓN CON CONEXIÓN DIRECTA ===\n";

    try {
        // Obtenemos las variables directamente del entorno de Railway
        $host = getenv('DB_HOST') ?: 'localhost';
        $db   = getenv('DB_NAME') ?: 'railway';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $port = getenv('DB_PORT') ?: '3306';

        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
        
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo " - Conexión establecida con éxito a la base: $db ✅\n";

        // Ahora ejecutamos el contenido de tu archivo .sql maestro
        $archivoSql = __DIR__ . '/migrations/001_azaria_full_schema.sql';
        
        if (file_exists($archivoSql)) {
            $sql = file_get_contents($archivoSql);
            // Ejecutamos (usamos exec para scripts completos)
            $pdo->exec($sql);
            echo " - Esquema maestro aplicado correctamente. ✅\n";
            
            // Re-aseguramos acceso de admin
            $pdo->exec("INSERT IGNORE INTO usuarios (email, password_hash, nombre_completo, rol_id) VALUES ('admin@vitalia.app', '" . password_hash('admin123', PASSWORD_BCRYPT) . "', 'Administrador Azaria', 1)");
            echo " - Administrador verificado. ✅\n";
        } else {
            echo " [!] ERROR: No se encuentra el archivo en $archivoSql\n";
        }

    } catch (PDOException $e) {
        echo "[ERROR DE CONEXIÓN]: " . $e->getMessage() . "\n";
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