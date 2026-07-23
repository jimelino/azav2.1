<?php
// Limpiar cualquier búfer previo
while (ob_get_level()) {
    ob_end_clean();
}

// Encabezados CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Habilitar reporte de errores temporalmente si falla
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // 1. Obtener la conexión a la base de datos (PDO) de la arquitectura del proyecto
    if (class_exists('App\Services\DatabaseService')) {
        $db = \App\Services\DatabaseService::getInstance()->getConnection();
    } else {
        // Intentar autoloader / conexión manual PDO como fallback
        $possible_loaders = [
            __DIR__ . '/../vendor/autoload.php',
            __DIR__ . '/../../vendor/autoload.php',
            $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php'
        ];
        foreach ($possible_loaders as $loader) {
            if (file_exists($loader)) {
                require_once $loader;
                break;
            }
        }
        $db = \App\Services\DatabaseService::getInstance()->getConnection();
    }

    // 2. Leer JSON de entrada
    $inputRaw = file_get_contents("php://input");
    $input = json_decode($inputRaw, true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Datos de entrada no válidos"]);
        exit();
    }

    $paciente_id     = isset($input['paciente_id']) ? intval($input['paciente_id']) : 0;
    $especialista_id = isset($input['especialista_id']) ? intval($input['especialista_id']) : 1;
    $observaciones   = isset($input['observaciones']) ? trim($input['observaciones']) : '';
    $grupos          = isset($input['grupos']) && is_array($input['grupos']) ? $input['grupos'] : [];

    if ($paciente_id === 0 || empty($grupos)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Selecciona un paciente y al menos un grupo de alimento"]);
        exit();
    }

    $fechaActual = date('Y-m-d');

    // 3. Iniciar Transacción PDO
    $db->beginTransaction();

    // Insertar o Actualizar cabecera
    $sqlCabecera = "
        INSERT INTO paciente_porciones_diarias (paciente_id, especialista_id, fecha_asignacion, observaciones)
        VALUES (:paciente_id, :especialista_id, :fecha, :observaciones)
        ON DUPLICATE KEY UPDATE 
            observaciones = VALUES(observaciones),
            id = LAST_INSERT_ID(id)
    ";
    $stmt = $db->prepare($sqlCabecera);
    $stmt->execute([
        ':paciente_id'     => $paciente_id,
        ':especialista_id' => $especialista_id,
        ':fecha'           => $fechaActual,
        ':observaciones'   => $observaciones
    ]);

    $porciones_diarias_id = $db->lastInsertId();

    // Limpiar detalle previo
    $stmtClean = $db->prepare("DELETE FROM paciente_porciones_detalle WHERE porciones_diarias_id = :id");
    $stmtClean->execute([':id' => $porciones_diarias_id]);

    // Insertar el nuevo detalle
    $sqlDetalle = "
        INSERT INTO paciente_porciones_detalle (porciones_diarias_id, grupo_id, numero_porciones, opciones_sugeridas)
        VALUES (:porciones_id, :grupo_id, :porciones, :opciones)
    ";
    $stmtDetail = $db->prepare($sqlDetalle);

    foreach ($grupos as $item) {
        $grupo_id           = intval($item['grupo_id'] ?? 0);
        $numero_porciones   = floatval($item['numero_porciones'] ?? 0);
        $opciones_sugeridas = isset($item['opciones_sugeridas']) ? trim($item['opciones_sugeridas']) : '';

        if ($grupo_id > 0 && $numero_porciones > 0) {
            $stmtDetail->execute([
                ':porciones_id' => $porciones_diarias_id,
                ':grupo_id'     => $grupo_id,
                ':porciones'    => $numero_porciones,
                ':opciones'     => $opciones_sugeridas
            ]);
        }
    }

    // Confirmar cambios
    $db->commit();

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Plan de porciones guardado correctamente",
        "porciones_diarias_id" => $porciones_diarias_id
    ]);

} catch (\Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error interno en el servidor: " . $e->getMessage()
    ]);
}
?>