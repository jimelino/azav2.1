<?php
/**
 * Router definitivo para Azaria - Sincronización Completa
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// BLOQUE ÚNICO DE MIGRACIONES Y REPARACIÓN
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    // ... (Carga de variables y conexión PDO igual que antes)
    try {
        // ... (Conexión $pdo)
        echo "=== REPARACIÓN ESTRUCTURAL DE SESIONES ===\n";
        
        // 1. Eliminar la tabla que está mal definida para recrearla bien
        $pdo->exec("DROP TABLE IF EXISTS sesiones_activas;");
        
        // 2. Crear la tabla con todas las columnas necesarias que espera el código
        $pdo->exec("CREATE TABLE sesiones_activas (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT UNSIGNED NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            dispositivo VARCHAR(255),
            navegador VARCHAR(100),
            ip_address VARCHAR(45),
            expira_en TIMESTAMP NOT NULL,
            ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        
        echo " - Tabla 'sesiones_activas' creada con esquema completo. ✅\n";
        
        // 3. Reset administrador
        $pdo->exec("DELETE FROM usuarios WHERE email = 'admin@vitalia.app'");
        $stmt = $pdo->prepare("INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, activo, primer_acceso, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['admin@vitalia.app', password_hash('admin123', PASSWORD_BCRYPT), 'Administrador Azaria', 1, 1, 0, 1]);
        
        echo " - Usuario 'admin@vitalia.app' restaurado. ✅\n";
        
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