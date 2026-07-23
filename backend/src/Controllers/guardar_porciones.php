<?php
// Limpiar cualquier salida previa o advertencia
ob_start();
ob_clean();

// Permitir peticiones desde cualquier origen (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Desactivar impresión de errores/warnings de PHP en pantalla
error_reporting(0);
ini_set('display_errors', 0);

// Si el navegador consulta las opciones previas (Preflight OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Intentar incluir la conexión a la BD
if (file_exists(__DIR__ . '/../../config/config.inc.php')) {
    require_once __DIR__ . '/../../config/config.inc.php';
} elseif (file_exists(__DIR__ . '/../config/config.inc.php')) {
    require_once __DIR__ . '/../config/config.inc.php';
} elseif (file_exists(__DIR__ . '/config/config.inc.php')) {
    require_once __DIR__ . '/config/config.inc.php';
}

// Asignar variable de conexión global
if (!isset($conn) && isset($conexion)) {
    $conn = $conexion;
}

// Verificar que la conexión a la BD esté disponible
if (!isset($conn) || !$conn) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error de conexión a la base de datos."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "Datos de entrada no válidos"]);
    exit();
}

$paciente_id     = isset($input['paciente_id']) ? intval($input['paciente_id']) : 0;
$especialista_id = isset($input['especialista_id']) ? intval($input['especialista_id']) : 1;
$observaciones   = isset($input['observaciones']) ? trim($input['observaciones']) : '';
$grupos          = isset($input['grupos']) && is_array($input['grupos']) ? $input['grupos'] : [];

if ($paciente_id === 0 || empty($grupos)) {
    ob_clean();
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

    ob_clean();
    echo json_encode([
        "status" => "success",
        "message" => "Plan de porciones guardado correctamente",
        "porciones_diarias_id" => $porciones_diarias_id
    ]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al guardar en BD: " . $e->getMessage()
    ]);
}
?>