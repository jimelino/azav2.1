<?php
/**
 * Router definitivo - Sincronización de Sesiones (Alcance PDO corregido)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    // Conexión PDO (mismo código que ya tienes)
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS']);

    echo "=== APLICANDO ESQUEMA MAESTRO AZARIA ===\n";
    
    $archivoSql = __DIR__ . '/../migrations/001_azaria_full_schema.sql';
    
    if (file_exists($archivoSql)) {
        $sql = file_get_contents($archivoSql);
        
        // Ejecutamos el script
        $pdo->exec($sql);
        echo " - Esquema aplicado con éxito. ✅\n";
        
        // Restauramos el usuario admin para no perder el acceso
        $pdo->exec("INSERT IGNORE INTO usuarios (email, password_hash, nombre_completo, rol_id) VALUES ('admin@vitalia.app', '" . password_hash('admin123', PASSWORD_BCRYPT) . "', 'Administrador Azaria', 1)");
        echo " - Usuario Administrador verificado. ✅\n";
    } else {
        echo " [!] No se encontró el archivo SQL en " . $archivoSql . "\n";
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