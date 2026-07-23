<?php
// Limpiar cualquier salida previa
if (ob_get_length()) ob_clean();

// Encabezados CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Desactivar impresión de errores de PHP en pantalla
error_reporting(0);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -------------------------------------------------------------
// INCLUSIÓN ROBUSTA DE LA CONEXIÓN A LA BASE DE DATOS
// -------------------------------------------------------------

// 1. Intentar cargar config.inc.php buscando desde la raíz y directorios superiores
$possible_paths = [
    $_SERVER['DOCUMENT_ROOT'] . '/config/config.inc.php',
    __DIR__ . '/config/config.inc.php',
    __DIR__ . '/../config/config.inc.php',
    __DIR__ . '/../../config/config.inc.php',
    dirname(__DIR__, 2) . '/config/config.inc.php',
    dirname(__DIR__, 1) . '/config/config.inc.php'
];

foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

// 2. Mapear la variable de conexión global
if (!isset($conn) && isset($conexion)) {
    $conn = $conexion;
}

// 3. Fallback: Conexión directa mediante variables de entorno de Railway si no existe $conn
if (!isset($conn) || !$conn || (method_exists($conn, 'connect_error') && $conn->connect_error)) {
    $host = getenv('MYSQLHOST') ?: getenv('DB_HOST') ?: 'localhost';
    $user = getenv('MYSQLUSER') ?: getenv('DB_USER') ?: 'root';
    $pass = getenv('MYSQLPASSWORD') ?: getenv('DB_PASS') ?: '';
    $db   = getenv('MYSQLDATABASE') ?: getenv('DB_NAME') ?: '';
    $port = getenv('MYSQLPORT') ?: getenv('DB_PORT') ?: 3306;

    if (!empty($db)) {
        $conn = new mysqli($host, $user, $pass, $db, (int)$port);
        if ($conn->connect_error) {
            $conn = null;
        } else {
            $conn->set_charset("utf8mb4");
        }
    }
}

// 4. Si tras las comprobaciones sigue sin haber conexión, retornar error
if (!isset($conn) || !$conn) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Error de conexión a la base de datos (No se pudo establecer la conexión mysqli)."
    ]);
    exit();
}
// -------------------------------------------------------------

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["status" => "error", "message" => "Datos de entrada no válidos"]);
    exit();
}

$paciente_id     = isset($input['paciente_id']) ? intval($input['paciente_id']) : 0;
$especialista_id = isset($input['especialista_id']) ? intval($input['especialista_id']) : 1;
$observaciones   = isset($input['observaciones']) ? trim($input['observaciones']) : '';
$grupos          = isset($input['grupos']) && is_array($input['grupos']) ? $input['grupos'] : [];

if ($paciente_id === 0 || empty($grupos)) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["status" => "error", "message" => "Selecciona un paciente y al menos un grupo de alimento"]);
    exit();
}

$fechaActual = date('Y-m-d');

try {
    // 1. Insertar o actualizar asignación diaria
    $stmt = $conn->prepare("
        INSERT INTO paciente_porciones_diarias (paciente_id, especialista_id, fecha_asignacion, observaciones)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            observaciones = VALUES(observaciones),
            id = LAST_INSERT_ID(id)
    ");
    $stmt->bind_param("iiss", $paciente_id, $especialista_id, $fechaActual, $observaciones);
    $stmt->execute();

    $porciones_diarias_id = $stmt->insert_id;
    $stmt->close();

    // 2. Limpiar detalle previo para este registro
    $stmtClean = $conn->prepare("DELETE FROM paciente_porciones_detalle WHERE porciones_diarias_id = ?");
    $stmtClean->bind_param("i", $porciones_diarias_id);
    $stmtClean->execute();
    $stmtClean->close();

    // 3. Insertar nuevo detalle
    $stmtDetail = $conn->prepare("
        INSERT INTO paciente_porciones_detalle (porciones_diarias_id, grupo_id, numero_porciones, opciones_sugeridas)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($grupos as $item) {
        $grupo_id           = intval($item['grupo_id']);
        $numero_porciones   = floatval($item['numero_porciones']);
        $opciones_sugeridas = isset($item['opciones_sugeridas']) ? trim($item['opciones_sugeridas']) : '';

        if ($grupo_id > 0 && $numero_porciones > 0) {
            $stmtDetail->bind_param("iids", $porciones_diarias_id, $grupo_id, $numero_porciones, $opciones_sugeridas);
            $stmtDetail->execute();
        }
    }
    $stmtDetail->close();

    if (ob_get_length()) ob_clean();
    echo json_encode([
        "status" => "success",
        "message" => "Plan de porciones guardado correctamente",
        "porciones_diarias_id" => $porciones_diarias_id
    ]);

} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al guardar en BD: " . $e->getMessage()
    ]);
}
?>