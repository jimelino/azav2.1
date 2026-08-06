<?php

namespace App\Controllers;

use App\Models\EstadoAnimo;
use App\Models\CuestionarioBienestar;
use App\Models\NeuroFase;
use App\Services\DatabaseService;
use App\Utils\Response;
use App\Utils\Validator;

class NeuropsicologiaController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // Mapeo de emociones textuales a nivel numérico
    private $emocionesMap = [
        'feliz' => ANIMO_MUY_BIEN,
        'tranquilo' => ANIMO_BIEN,
        'agradecido' => ANIMO_BIEN,
        'neutral' => ANIMO_NEUTRAL,
        'ansioso' => ANIMO_MAL,
        'triste' => ANIMO_MAL,
        'frustrado' => ANIMO_MAL,
        'enojado' => ANIMO_MUY_MAL,
        'enojo' => ANIMO_MUY_MAL,
        'tristeza' => ANIMO_MAL,
        'miedo' => ANIMO_MAL,
        'desprecio' => ANIMO_MUY_MAL,
        'asco' => ANIMO_MAL,
        'sorpresa' => ANIMO_NEUTRAL,
        'disfrute' => ANIMO_BIEN
    ];

    // REGISTRO DE ESTADO DE ÁNIMO
    public function getEstadosAnimo($pacienteId, $filters = [])
    {
        $estados = EstadoAnimo::getByPaciente($pacienteId, $filters);
        return Response::success($estados);
    }

    public function registrarEstadoAnimo($data)
    {
        // Si viene 'emocion' en lugar de 'nivel_animo', convertir
        if (isset($data['emocion']) && !isset($data['nivel_animo'])) {
            $emocion = strtolower($data['emocion']);
            $data['nivel_animo'] = $this->emocionesMap[$emocion] ?? ANIMO_NEUTRAL;
        }

        $validator = new Validator($data);
        $validator->required(['paciente_id', 'nivel_animo'])
                  ->in('nivel_animo', [ANIMO_MUY_MAL, ANIMO_MAL, ANIMO_NEUTRAL, ANIMO_BIEN, ANIMO_MUY_BIEN]);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = EstadoAnimo::create($data);

        if ($result) {
            // Verificar si requiere alerta psicológica
            $this->checkAlertaPsicologica($data['paciente_id'], $data['nivel_animo']);

            if ((int)$data['nivel_animo'] === ANIMO_MUY_MAL) {
                EstadoAnimo::crearAlertaCritica($data['paciente_id']);
            }

            return Response::success($result, 'Estado de ánimo registrado', 201);
        }

        return Response::error('Error al registrar estado de ánimo', 500);
    }

    // EJERCICIOS DE NEUROPSICOLOGÍA
    public function getEjercicios()
    {
        // Ejercicios predefinidos para bienestar mental
        $ejercicios = [
            [
                'id' => 1,
                'nombre' => 'Respiración 4-7-8',
                'descripcion' => 'Técnica de respiración para reducir ansiedad',
                'duracion' => 5,
                'tipo' => 'respiracion',
                'instrucciones' => 'Inhala por 4 segundos, mantén por 7, exhala por 8. Repite 4 veces.'
            ],
            [
                'id' => 2,
                'nombre' => 'Mindfulness de 5 sentidos',
                'descripcion' => 'Ejercicio de atención plena para conectar con el presente',
                'duracion' => 10,
                'tipo' => 'mindfulness',
                'instrucciones' => 'Identifica: 5 cosas que ves, 4 que tocas, 3 que escuchas, 2 que hueles, 1 que saboreas.'
            ],
            [
                'id' => 3,
                'nombre' => 'Relajación muscular progresiva',
                'descripcion' => 'Reduce la tensión física y mental',
                'duracion' => 15,
                'tipo' => 'relajacion',
                'instrucciones' => 'Tensa cada grupo muscular por 5 segundos, luego relaja por 10 segundos.'
            ],
            [
                'id' => 4,
                'nombre' => 'Visualización positiva',
                'descripcion' => 'Imagina tu recuperación exitosa',
                'duracion' => 10,
                'tipo' => 'visualizacion',
                'instrucciones' => 'Cierra los ojos e imagina detalladamente un día después de tu recuperación completa.'
            ]
        ];

        return Response::success($ejercicios);
    }

    // CUESTIONARIOS DE BIENESTAR
    public function getCuestionarios($pacienteId)
    {
        $cuestionarios = CuestionarioBienestar::getByPaciente($pacienteId);
        return Response::success($cuestionarios);
    }

    public function guardarCuestionario($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'respuestas']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = CuestionarioBienestar::save($data);

        if ($result) {
            // Calcular puntuación y verificar alertas
            $puntuacion = CuestionarioBienestar::calcularPuntuacion($result['id']);
            $this->checkAlertaPuntuacion($data['paciente_id'], $puntuacion);

            return Response::success($result, 'Cuestionario guardado exitosamente', 201);
        }

        return Response::error('Error al guardar cuestionario', 500);
    }

    // TENDENCIAS Y ANÁLISIS
    public function getTendencias($pacienteId, $periodo = '30d')
    {
        $tendencias = [
            'estados_animo' => EstadoAnimo::getTendencias($pacienteId, $periodo),
            'emociones_frecuentes' => EstadoAnimo::getEmocionesFrecuentes($pacienteId, $periodo),
            'puntuaciones' => CuestionarioBienestar::getTendenciasPuntuacion($pacienteId, $periodo)
        ];

        return Response::success($tendencias);
    }

    public function getNubeEmociones($pacienteId, $periodo = '30d')
    {
        $nube = EstadoAnimo::getNubeEmociones($pacienteId, $periodo);
        return Response::success($nube);
    }

    // ALERTAS PSICOLÓGICAS
    public function getAlertas($especialistaId = null)
    {
        $currentUser = \App\Middleware\AuthMiddleware::getCurrentUser();
        $role = strtolower((string)($currentUser['rol'] ?? $currentUser['role'] ?? ''));
        if ($role && !in_array($role, ['especialista', 'admin', 'administrador'], true)) {
            return Response::error('Solo un especialista puede consultar alertas', 403);
        }
        if (!$especialistaId) {
            $especialistaId = $currentUser['id'] ?? null;
        }
        $alertas = EstadoAnimo::getAlertas($especialistaId);
        return Response::success($alertas);
    }

    private function checkAlertaPsicologica($pacienteId, $nivelAnimo)
    {
        // Verificar si hay 3 registros consecutivos con nivel bajo
        $registrosRecientes = EstadoAnimo::getRecientes($pacienteId, 3);

        $todosNegativos = true;
        foreach ($registrosRecientes as $registro) {
            if ($registro['nivel_animo'] >= ANIMO_NEUTRAL) {
                $todosNegativos = false;
                break;
            }
        }

        if ($todosNegativos && count($registrosRecientes) >= 3) {
            EstadoAnimo::crearAlerta($pacienteId);
        }
    }

    private function checkAlertaPuntuacion($pacienteId, $puntuacion)
    {
        // Si la puntuación es menor a cierto umbral, crear alerta
        if ($puntuacion < 50) {
            CuestionarioBienestar::crearAlerta($pacienteId, $puntuacion);
        }
    }

    public function marcarAlertaAtendida($alertaId)
    {
        $result = EstadoAnimo::marcarAlertaAtendida($alertaId);

        if ($result) {
            return Response::success(null, 'Alerta marcada como atendida');
        }

        return Response::error('Error al actualizar alerta', 500);
    }

    // ===== CUESTIONARIOS ACT =====

    public function guardarResultadoCuestionario($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'tipo_cuestionario', 'puntuacion_total', 'puntuacion_detalle']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $tiposValidos = ['AAQ2', 'AADQ', 'CANCER_AAQ', 'VLQ'];
        if (!in_array($data['tipo_cuestionario'], $tiposValidos)) {
            return Response::error('Tipo de cuestionario no válido', 422);
        }

        $result = $this->db->query(
            "INSERT INTO resultados_cuestionarios (paciente_id, tipo_cuestionario, puntuacion_total, puntuacion_detalle, interpretacion, fecha)
             VALUES (?, ?, ?, ?, ?, CURDATE())",
            [
                $data['paciente_id'],
                $data['tipo_cuestionario'],
                $data['puntuacion_total'],
                json_encode($data['puntuacion_detalle']),
                $data['interpretacion'] ?? null
            ]
        );

        if ($result) {
            // Avance automático 1→2: completar el primer cuestionario marca
            // el paso de "Consulta inicial" a "Evaluación". Solo avanza si
            // el paciente ya tiene un especialista de neuro asignado (si no,
            // no hay a quién atribuir el cambio y se omite).
            $especialistaId = NeuroFase::getEspecialistaAsignado($data['paciente_id']);
            NeuroFase::avanzarSiCorresponde($data['paciente_id'], $especialistaId, 2, 'Avance automático: primer cuestionario completado');

            return Response::success([
                'id' => $this->db->lastInsertId(),
                'tipo_cuestionario' => $data['tipo_cuestionario'],
                'puntuacion_total' => $data['puntuacion_total'],
                'interpretacion' => $data['interpretacion'] ?? null
            ], 'Resultado guardado', 201);
        }

        return Response::error('Error al guardar resultado', 500);
    }

    public function getHistorialCuestionarios($pacienteId)
    {
        $resultados = $this->db->query(
            "SELECT id, tipo_cuestionario, puntuacion_total, interpretacion, fecha, created_at
             FROM resultados_cuestionarios
             WHERE paciente_id = ?
             ORDER BY created_at DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        return Response::success($resultados ?? []);
    }

    // ===== SESIONES ACT =====

    public function guardarSesionACT($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'categoria', 'herramienta']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = $this->db->query(
            "INSERT INTO act_sesiones (paciente_id, categoria, herramienta, notas_usuario, fecha)
             VALUES (?, ?, ?, ?, CURDATE())",
            [
                $data['paciente_id'],
                $data['categoria'],
                $data['herramienta'],
                $data['notas_usuario'] ?? null
            ]
        );

        if ($result) {
            return Response::success([
                'id' => $this->db->lastInsertId(),
                'categoria' => $data['categoria'],
                'herramienta' => $data['herramienta']
            ], 'Sesión ACT registrada', 201);
        }

        return Response::error('Error al guardar sesión ACT', 500);
    }

    public function getHistorialACT($pacienteId)
    {
        $sesiones = $this->db->query(
            "SELECT id, categoria, herramienta, notas_usuario, fecha, created_at
             FROM act_sesiones
             WHERE paciente_id = ?
             ORDER BY created_at DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        return Response::success($sesiones ?? []);
    }

    // ===== ASIGNACIONES ACT (ESPECIALISTA) =====

    public function getAsignacionesACT($pacienteId)
    {
        try {
            $asignaciones = $this->db->query(
                "SELECT aa.*, u.nombre_completo as especialista_nombre
                 FROM act_asignaciones aa
                 LEFT JOIN usuarios u ON aa.especialista_id = u.id
                 WHERE aa.paciente_id = ?
                 ORDER BY aa.created_at DESC",
                [$pacienteId]
            )->fetchAll();

            return Response::success($asignaciones ?? []);
        } catch (\Exception $e) {
            error_log('Error getting ACT asignaciones: ' . $e->getMessage());
            return Response::success([]);
        }
    }

    public function asignarHerramientaACT($data)
    {
        try {
            $user = \App\Middleware\AuthMiddleware::getCurrentUser();

            $this->db->query(
                "INSERT INTO act_asignaciones
                 (paciente_id, especialista_id, herramienta_id, herramienta_nombre, categoria, notas_especialista, prioridad, estado, contenido, es_personalizada, tipo_actividad)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)",
                [
                    $data['paciente_id'],
                    $user['id'],
                    $data['herramienta_id'],
                    $data['herramienta_nombre'] ?? '',
                    $data['categoria'] ?? '',
                    $data['notas_especialista'] ?? null,
                    $data['prioridad'] ?? 'normal',
                    $data['contenido'] ?? null,
                    !empty($data['es_personalizada']) ? 1 : 0,
                    $data['tipo_actividad'] ?? null
                ]
            );

            $id = $this->db->lastInsertId();
            return Response::success(['id' => $id], 'Herramienta ACT asignada exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error assigning ACT tool: ' . $e->getMessage());
            return Response::error('Error al asignar herramienta', 500);
        }
    }

    public function eliminarAsignacionACT($asignacionId)
    {
        try {
            $this->db->query("DELETE FROM act_asignaciones WHERE id = ?", [$asignacionId]);
            return Response::success(null, 'Asignación eliminada');
        } catch (\Exception $e) {
            error_log('Error deleting ACT assignment: ' . $e->getMessage());
            return Response::error('Error al eliminar asignación', 500);
        }
    }

    public function completarAsignacionACT($asignacionId)
    {
        try {
            $this->db->query(
                "UPDATE act_asignaciones SET estado = 'completada', fecha_completada = NOW(), updated_at = NOW() WHERE id = ?",
                [$asignacionId]
            );
            return Response::success(null, 'Asignación completada');
        } catch (\Exception $e) {
            error_log('Error completing ACT assignment: ' . $e->getMessage());
            return Response::error('Error al completar asignación', 500);
        }
    }

    public function cambiarEstadoAsignacionACT($asignacionId, $data)
    {
        try {
            $estado = $data['estado'] ?? 'pendiente';
            if (!in_array($estado, ['pendiente', 'completada', 'cancelada'])) {
                return Response::error('Estado no válido', 422);
            }
            $fechaCompletada = $estado === 'completada' ? 'NOW()' : 'NULL';
            $this->db->query(
                "UPDATE act_asignaciones SET estado = ?, fecha_completada = {$fechaCompletada}, updated_at = NOW() WHERE id = ?",
                [$estado, $asignacionId]
            );
            return Response::success(null, 'Estado actualizado');
        } catch (\Exception $e) {
            error_log('Error changing ACT assignment status: ' . $e->getMessage());
            return Response::error('Error al cambiar estado', 500);
        }
    }

    // ===== EVALUACIÓN NEUROPSICOLÓGICA =====

    private $funcionesCognitivas = [
        'atencion_visual', 'atencion_auditiva', 'memoria_visual', 'memoria_auditiva',
        'memoria_trabajo', 'funciones_ejecutivas', 'velocidad_procesamiento', 'orientacion',
        'lenguaje', 'razonamiento', 'flexibilidad_cognitiva', 'planificacion',
        'control_inhibitorio', 'praxias', 'gnosias', 'calculo',
        'comprension_verbal', 'habilidades_visuoespaciales'
    ];

    public function getEvaluacion($pacienteId)
    {
        $evaluacion = $this->db->query(
            "SELECT e.*,
                    u.nombre_completo as especialista_nombre
             FROM evaluaciones_neuropsicologicas e
             LEFT JOIN usuarios u ON e.especialista_id = u.id
             WHERE e.paciente_id = ?
             ORDER BY e.fecha DESC, e.id DESC
             LIMIT 1",
            [$pacienteId]
        )->fetch();

        if ($evaluacion && !empty($evaluacion['campos_personalizados']) && is_string($evaluacion['campos_personalizados'])) {
            $evaluacion['campos_personalizados'] = json_decode($evaluacion['campos_personalizados'], true);
        }

        return Response::success($evaluacion ?: null);
    }

    public function getHistorialEvaluaciones($pacienteId)
    {
        $evaluaciones = $this->db->query(
            "SELECT e.id, e.fecha, e.notas,
                    u.nombre_completo as especialista_nombre,
                    e.atencion_visual, e.atencion_auditiva, e.memoria_visual, e.memoria_auditiva,
                    e.memoria_trabajo, e.funciones_ejecutivas, e.velocidad_procesamiento,
                    e.orientacion, e.lenguaje, e.razonamiento, e.flexibilidad_cognitiva,
                    e.planificacion, e.control_inhibitorio, e.praxias, e.gnosias,
                    e.calculo, e.comprension_verbal, e.habilidades_visuoespaciales
             FROM evaluaciones_neuropsicologicas e
             LEFT JOIN usuarios u ON e.especialista_id = u.id
             WHERE e.paciente_id = ?
             ORDER BY e.fecha DESC, e.id DESC
             LIMIT 20",
            [$pacienteId]
        )->fetchAll();

        return Response::success($evaluaciones ?? []);
    }

    public function guardarEvaluacion($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'especialista_id']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        // Validar que al menos una función cognitiva tenga valor
        $tieneValores = false;
        foreach ($this->funcionesCognitivas as $funcion) {
            if (isset($data[$funcion]) && $data[$funcion] !== '' && $data[$funcion] !== null) {
                $val = floatval($data[$funcion]);
                if ($val < 0 || $val > 10) {
                    return Response::error("El valor de $funcion debe estar entre 0 y 10", 422);
                }
                $tieneValores = true;
            }
        }

        $tieneCamposPersonalizados = !empty($data['campos_personalizados']);

        if (!$tieneValores && !$tieneCamposPersonalizados) {
            return Response::error('Debe evaluar al menos una función cognitiva', 422);
        }

        $campos = ['paciente_id', 'especialista_id', 'fecha', 'notas', 'campos_personalizados'];
        $valores = [
            $data['paciente_id'],
            $data['especialista_id'],
            $data['fecha'] ?? date('Y-m-d'),
            $data['notas'] ?? null,
            $data['campos_personalizados'] ?? null
        ];
        $placeholders = ['?', '?', '?', '?', '?'];

        foreach ($this->funcionesCognitivas as $funcion) {
            $campos[] = $funcion;
            $valores[] = isset($data[$funcion]) && $data[$funcion] !== '' ? floatval($data[$funcion]) : null;
            $placeholders[] = '?';
        }

        $camposStr = implode(', ', $campos);
        $placeholdersStr = implode(', ', $placeholders);

        $result = $this->db->query(
            "INSERT INTO evaluaciones_neuropsicologicas ($camposStr) VALUES ($placeholdersStr)",
            $valores
        );

        if ($result) {
            // Avance automático 2→3: cuando el especialista concluye la
            // evaluación clínica formal, el paciente pasa a "Intervención".
            NeuroFase::avanzarSiCorresponde($data['paciente_id'], $data['especialista_id'], 3, 'Avance automático: evaluación clínica concluida');

            return Response::success([
                'id' => $this->db->lastInsertId()
            ], 'Evaluación neuropsicológica guardada', 201);
        }

        return Response::error('Error al guardar evaluación', 500);
    }

    // ===== CUESTIONARIOS PERSONALIZADOS (Gestión del especialista) =====

    public function getCuestionariosPersonalizados()
    {
        $user = \App\Middleware\AuthMiddleware::getCurrentUser();
        $espId = $user['especialista_id'] ?? $user['id'];

        $cuestionarios = $this->db->query(
            "SELECT * FROM cuestionarios_personalizados
             WHERE especialista_id = ?
             ORDER BY created_at DESC",
            [$espId]
        )->fetchAll();

        foreach ($cuestionarios as &$c) {
            if (!empty($c['archivo_url']) && !str_starts_with($c['archivo_url'], 'http')) {
                $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
                $c['archivo_url'] = $baseUrl . '/uploads/' . $c['archivo_url'];
            }
            if (!empty($c['preguntas']) && is_string($c['preguntas'])) {
                $c['preguntas'] = json_decode($c['preguntas'], true);
            }
            if (!empty($c['asignado_a']) && is_string($c['asignado_a'])) {
                $c['asignado_a'] = json_decode($c['asignado_a'], true);
            }
            // Contar respuestas
            $count = $this->db->query(
                "SELECT COUNT(*) as total FROM respuestas_cuestionarios WHERE cuestionario_id = ?",
                [$c['id']]
            )->fetch();
            $c['total_respuestas'] = (int)($count['total'] ?? 0);
        }

        return Response::success($cuestionarios ?? []);
    }

    public function crearCuestionarioPersonalizado()
    {
        $user = \App\Middleware\AuthMiddleware::getCurrentUser();
        $espId = $user['especialista_id'] ?? $user['id'];

        // Puede venir como JSON o FormData
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $data = json_decode(file_get_contents('php://input'), true);
            $titulo = $data['titulo'] ?? null;
            $descripcion = $data['descripcion'] ?? null;
            $tipo = $data['tipo'] ?? 'personalizado';
            $preguntas = isset($data['preguntas']) ? json_encode($data['preguntas']) : null;
        } else {
            $titulo = $_POST['titulo'] ?? null;
            $descripcion = $_POST['descripcion'] ?? null;
            $tipo = $_POST['tipo'] ?? 'personalizado';
            $preguntas = $_POST['preguntas'] ?? null;
        }

        if (!$titulo) {
            return Response::error('El título es obligatorio', 422);
        }

        $archivoUrl = null;
        $archivoNombre = null;

        if (isset($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['archivo'];
            $allowedExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) {
                return Response::error('Tipo de archivo no permitido.', 422);
            }
            $uploadDir = $_ENV['UPLOAD_PATH'] ?? (__DIR__ . '/../../public/uploads/');
            $subDir = 'cuestionarios/';
            if (!is_dir($uploadDir . $subDir)) @mkdir($uploadDir . $subDir, 0755, true);
            $fileName = 'cuest_' . time() . '_' . uniqid() . '.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $uploadDir . $subDir . $fileName)) {
                $archivoUrl = $subDir . $fileName;
                $archivoNombre = $file['name'];
            }
        }

        $result = $this->db->query(
            "INSERT INTO cuestionarios_personalizados (especialista_id, titulo, descripcion, tipo, preguntas, archivo_url, archivo_nombre)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [$espId, $titulo, $descripcion, $tipo, $preguntas, $archivoUrl, $archivoNombre]
        );

        if ($result) {
            return Response::success(['id' => $this->db->lastInsertId()], 'Cuestionario creado', 201);
        }
        return Response::error('Error al crear cuestionario', 500);
    }

    public function eliminarCuestionarioPersonalizado($id)
    {
        $user = \App\Middleware\AuthMiddleware::getCurrentUser();
        $espId = $user['especialista_id'] ?? $user['id'];
        $this->db->query("DELETE FROM cuestionarios_personalizados WHERE id = ? AND especialista_id = ?", [$id, $espId]);
        return Response::success(null, 'Cuestionario eliminado');
    }

    // Ver respuestas de un cuestionario específico
    public function getRespuestasCuestionario($cuestionarioId)
    {
        $respuestas = $this->db->query(
            "SELECT r.*, u.nombre_completo as paciente_nombre
             FROM respuestas_cuestionarios r
             LEFT JOIN usuarios u ON r.paciente_id = u.id
             WHERE r.cuestionario_id = ?
             ORDER BY r.created_at DESC",
            [$cuestionarioId]
        )->fetchAll();

        foreach ($respuestas as &$r) {
            if (!empty($r['respuestas']) && is_string($r['respuestas'])) {
                $r['respuestas'] = json_decode($r['respuestas'], true);
            }
        }

        return Response::success($respuestas ?? []);
    }

    // ===== ENDPOINTS PARA EL USUARIO (paciente) =====

    // Cuestionarios pendientes/disponibles para el usuario
    public function getCuestionariosPaciente($pacienteId)
    {
        // Traer cuestionarios donde el paciente está asignado o es para todos
        $cuestionarios = $this->db->query(
            "SELECT cp.id, cp.titulo, cp.descripcion, cp.tipo, cp.preguntas, cp.archivo_url, cp.archivo_nombre,
                    u.nombre_completo as especialista_nombre
             FROM cuestionarios_personalizados cp
             LEFT JOIN usuarios u ON cp.especialista_id = u.id
             WHERE cp.activo = 1
               AND cp.preguntas IS NOT NULL
               AND (cp.asignado_a IS NULL OR JSON_CONTAINS(cp.asignado_a, CAST(? AS JSON)))
             ORDER BY cp.created_at DESC",
            [$pacienteId]
        )->fetchAll();

        foreach ($cuestionarios as &$c) {
            if (!empty($c['preguntas']) && is_string($c['preguntas'])) {
                $c['preguntas'] = json_decode($c['preguntas'], true);
            }
            if (!empty($c['archivo_url']) && !str_starts_with($c['archivo_url'], 'http')) {
                $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
                $c['archivo_url'] = $baseUrl . '/uploads/' . $c['archivo_url'];
            }
            // Ver si ya lo respondió
            $resp = $this->db->query(
                "SELECT id, puntaje_total, created_at FROM respuestas_cuestionarios
                 WHERE cuestionario_id = ? AND paciente_id = ?
                 ORDER BY created_at DESC LIMIT 1",
                [$c['id'], $pacienteId]
            )->fetch();
            $c['respondido'] = $resp ? true : false;
            $c['ultima_respuesta'] = $resp ?: null;
        }

        return Response::success($cuestionarios ?? []);
    }

    // Guardar respuesta del usuario
    public function guardarRespuestaCuestionario($data)
    {
        $cuestionarioId = $data['cuestionario_id'] ?? null;
        $pacienteId = $data['paciente_id'] ?? null;
        $respuestas = $data['respuestas'] ?? null;
        $puntajeTotal = $data['puntaje_total'] ?? null;

        if (!$cuestionarioId || !$pacienteId || !$respuestas) {
            return Response::error('Datos incompletos', 422);
        }

        $result = $this->db->query(
            "INSERT INTO respuestas_cuestionarios (cuestionario_id, paciente_id, respuestas, puntaje_total)
             VALUES (?, ?, ?, ?)",
            [$cuestionarioId, $pacienteId, json_encode($respuestas), $puntajeTotal]
        );

        if ($result) {
            return Response::success(['id' => $this->db->lastInsertId()], 'Respuesta guardada', 201);
        }
        return Response::error('Error al guardar respuesta', 500);
    }

    // Historial de respuestas del paciente
    public function getHistorialRespuestas($pacienteId)
    {
        $respuestas = $this->db->query(
            "SELECT r.*, cp.titulo, cp.tipo, cp.preguntas
             FROM respuestas_cuestionarios r
             JOIN cuestionarios_personalizados cp ON r.cuestionario_id = cp.id
             WHERE r.paciente_id = ?
             ORDER BY r.created_at DESC",
            [$pacienteId]
        )->fetchAll();

        foreach ($respuestas as &$r) {
            if (!empty($r['respuestas']) && is_string($r['respuestas'])) {
                $r['respuestas'] = json_decode($r['respuestas'], true);
            }
            if (!empty($r['preguntas']) && is_string($r['preguntas'])) {
                $r['preguntas'] = json_decode($r['preguntas'], true);
            }
        }

        return Response::success($respuestas ?? []);
    }
}
