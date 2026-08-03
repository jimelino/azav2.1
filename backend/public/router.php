<?php
/**
 * Router definitivo - Azaria 2.0
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// BLOQUE DE MIGRACIÓN INTELIGENTE
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    echo "=== PROCESO DE SINCRONIZACIÓN INICIADO ===\n";

    try {
        $config = require __DIR__ . '/../config/database.php';
        $dsn = "{$config['driver']}:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
        $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        
        echo " - Conectado a: {$config['database']} ✅\n";

        $archivoSql = __DIR__ . '/migrations/001_azaria_full_schema.sql';
        
        if (file_exists($archivoSql)) {
            $sql = file_get_contents($archivoSql);
            // Ejecutamos línea por línea ignorando duplicados
            $queries = explode(';', $sql);
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    try {
                        $pdo->exec($query);
                    } catch (PDOException $e) {
                        // Silenciamos errores de tablas existentes
                        continue; 
                    }
                }
            }
            echo " - Esquema aplicado con éxito. ✅\n";
            
            // Asegurar Admin
            $pdo->exec("INSERT IGNORE INTO usuarios (email, password_hash, nombre_completo, rol_id) VALUES ('admin@vitalia.app', '" . password_hash('admin123', PASSWORD_BCRYPT) . "', 'Administrador Azaria', 1)");
            echo " - Administrador verificado. ✅\n";
        } else {
            echo " [!] ERROR: No se encontró el archivo SQL en $archivoSql\n";
        }

    } catch (Exception $e) {
        echo "[ERROR FATAL]: " . $e->getMessage() . "\n";
    }
    exit;
}

// RESTO DEL ENRUTADOR (API y React SPA)
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

