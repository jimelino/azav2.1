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

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    if (class_exists('App\Services\DatabaseService')) {
        $db = \App\Services\DatabaseService::getInstance()->getConnection();
    } else {
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
    $recomendaciones = isset($input['recomendaciones']) ? trim($input['recomendaciones']) : '';
    
    // Macros
    $calorias        = isset($input['calorias']) ? floatval($input['calorias']) : 0;
    $proteinas       = isset($input['proteinas']) ? floatval($input['proteinas']) : 0;
    $carbohidratos   = isset($input['carbohidratos']) ? floatval($input['carbohidratos']) : 0;
    $grasas          = isset($input['grasas']) ? floatval($input['grasas']) : 0;

    $grupos          = isset($input['grupos']) && is_array($input['grupos']) ? $input['grupos'] : [];

    if ($paciente_id === 0 || empty($grupos)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Selecciona un paciente y al menos un grupo de alimento"]);
        exit();
    }

    $fechaActual = date('Y-m-d');

    $db->beginTransaction();

    // 1. Verificar si ya existe un registro para este paciente en la fecha actual (respetando la estructura relacional)
    $sqlCheck = "SELECT id FROM paciente_porciones_diarias WHERE paciente_id = :paciente_id AND fecha_asignacion = :fecha LIMIT 1";
    $stmtCheck = $db->prepare($sqlCheck);
    $stmtCheck->execute([
        ':paciente_id' => $paciente_id,
        ':fecha'       => $fechaActual
    ]);
    $existingPlan = $stmtCheck->fetch(\PDO::FETCH_ASSOC);

    if ($existingPlan) {
        // Si ya existe, actualizamos la cabecera existente
        $porciones_diarias_id = $existingPlan['id'];
        
        $sqlCabecera = "
            UPDATE paciente_porciones_diarias 
            SET especialista_id = :especialista_id,
                observaciones = :observaciones, 
                calorias = :calorias, 
                proteinas = :proteinas, 
                carbohidratos = :carbohidratos, 
                grasas = :grasas, 
                recomendaciones = :recomendaciones
            WHERE id = :id
        ";
        $stmt = $db->prepare($sqlCabecera);
        $stmt->execute([
            ':especialista_id' => $especialista_id,
            ':observaciones'   => $observaciones,
            ':calorias'        => $calorias,
            ':proteinas'       => $proteinas,
            ':carbohidratos'   => $carbohidratos,
            ':grasas'          => $grasas,
            ':recomendaciones' => $recomendaciones,
            ':id'              => $porciones_diarias_id
        ]);
    } else {
        // Si no existe, insertamos un registro nuevo
        $sqlCabecera = "
            INSERT INTO paciente_porciones_diarias 
            (paciente_id, especialista_id, fecha_asignacion, observaciones, calorias, proteinas, carbohidratos, grasas, recomendaciones)
            VALUES 
            (:paciente_id, :especialista_id, :fecha, :observaciones, :calorias, :proteinas, :carbohidratos, :grasas, :recomendaciones)
        ";
        $stmt = $db->prepare($sqlCabecera);
        $stmt->execute([
            ':paciente_id'     => $paciente_id,
            ':especialista_id' => $especialista_id,
            ':fecha'           => $fechaActual,
            ':observaciones'   => $observaciones,
            ':calorias'        => $calorias,
            ':proteinas'       => $proteinas,
            ':carbohidratos'   => $carbohidratos,
            ':grasas'          => $grasas,
            ':recomendaciones' => $recomendaciones
        ]);

        $porciones_diarias_id = $db->lastInsertId();
    }

    // 2. Limpiar detalle previo para asegurarnos de guardar la estructura limpia enviada
    $stmtClean = $db->prepare("DELETE FROM paciente_porciones_detalle WHERE porciones_diarias_id = :id");
    $stmtClean->execute([':id' => $porciones_diarias_id]);

    // 3. Insertar el nuevo detalle de porciones
    $sqlDetalle = "
        INSERT INTO paciente_porciones_detalle (porciones_diarias_id, grupo_id, numero_porciones, opciones_sugeridas)
        VALUES (:porciones_id, :grupo_id, :porciones, :opciones)
    ";
    $stmtDetail = $db->prepare($sqlDetalle);

    foreach ($grupos as $item) {
        $grupo_id           = intval($item['grupo_id'] ?? 0);
        $numero_porciones   = floatval($item['numero_porciones']  ?? 0);
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

    $db->commit();

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Plan de porciones guardado y estructura actualizada correctamente",
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