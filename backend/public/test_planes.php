<?php
/**
 * Script de diagnóstico para planes nutricionales
 * Acceder en: http://localhost:8000/test_planes.php
 */

header('Content-Type: application/json');

// Cargar .env
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

$results = [];

// 1. Test conexión a BD
try {
    $config = require __DIR__ . '/../config/database.php';
    $dsn = "{$config['driver']}:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $results['conexion_bd'] = 'OK';
} catch (Exception $e) {
    $results['conexion_bd'] = 'ERROR: ' . $e->getMessage();
    echo json_encode($results, JSON_PRETTY_PRINT);
    exit;
}

// 2. Verificar que la tabla existe
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'planes_nutricionales'");
    $exists = $stmt->fetch();
    $results['tabla_planes_nutricionales'] = $exists ? 'OK - Existe' : 'ERROR - No existe';
} catch (Exception $e) {
    $results['tabla_planes_nutricionales'] = 'ERROR: ' . $e->getMessage();
}

// 3. Verificar estructura de la tabla
try {
    $stmt = $pdo->query("DESCRIBE planes_nutricionales");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['columnas_tabla'] = $columns;
} catch (Exception $e) {
    $results['columnas_tabla'] = 'ERROR: ' . $e->getMessage();
}

// 4. Probar INSERT
try {
    $stmt = $pdo->prepare("INSERT INTO planes_nutricionales
        (nombre, descripcion, especialista_id, archivo_pdf, archivo_nombre, contenido_json,
         calorias_diarias, proteinas_g, carbohidratos_g, grasas_g, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrador')");

    $stmt->execute([
        'Plan de prueba ' . date('Y-m-d H:i:s'),
        'Descripción de prueba',
        3, // especialista_id
        'test.pdf',
        'test_original.pdf',
        json_encode(['test' => true]),
        1800,
        93.5,
        167.0,
        49.0
    ]);

    $insertId = $pdo->lastInsertId();
    $results['insert_test'] = 'OK - ID: ' . $insertId;

    // Eliminar el registro de prueba
    $pdo->exec("DELETE FROM planes_nutricionales WHERE id = " . $insertId);
    $results['cleanup'] = 'OK';

} catch (Exception $e) {
    $results['insert_test'] = 'ERROR: ' . $e->getMessage();
}

// 5. Verificar directorio de uploads
$uploadDir = __DIR__ . '/../uploads/planes_nutricionales/';
$results['upload_dir'] = $uploadDir;
$results['upload_dir_existe'] = is_dir($uploadDir) ? 'SI' : 'NO';

if (!is_dir($uploadDir)) {
    if (@mkdir($uploadDir, 0755, true)) {
        $results['crear_upload_dir'] = 'OK - Creado';
    } else {
        $results['crear_upload_dir'] = 'ERROR - No se pudo crear';
    }
}

$results['upload_dir_escribible'] = is_writable($uploadDir) || is_writable(dirname($uploadDir)) ? 'SI' : 'NO';

// 6. Verificar extensión finfo
$results['extension_finfo'] = extension_loaded('fileinfo') ? 'OK' : 'NO CARGADA';

// 7. Verificar otras tablas relacionadas
$tablas = ['plan_comidas', 'planes_nutricionales_paciente', 'seguimiento_plan_nutricional'];
foreach ($tablas as $tabla) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$tabla'");
        $exists = $stmt->fetch();
        $results['tabla_' . $tabla] = $exists ? 'OK' : 'NO EXISTE';
    } catch (Exception $e) {
        $results['tabla_' . $tabla] = 'ERROR: ' . $e->getMessage();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
