<?php

namespace App\Controllers;

use App\Models\Video;
use App\Models\GuiaProtesis;
use App\Models\ChecklistProtesis;
use App\Models\EvaluacionFisica;
use App\Models\PlanTratamiento;
use App\Services\DatabaseService;
use App\Services\FileUploadService;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Utils\Validator;
use App\Models\IndicacionFisioterapia;
use App\Models\Paciente;

class FisioterapiaController
{
    private $fileUploadService;

    public function __construct()
    {
        $this->fileUploadService = new FileUploadService();
    }

    // VIDEOS DE EJERCICIOS
    public function getVideos($fase = null)
    {
        $videos = Video::getAll($fase);
        return Response::success($videos);
    }

    public function getVideo($id)
    {
        $video = Video::find($id);

        if (!$video) {
            return Response::error('Video no encontrado', 404);
        }

        return Response::success($video);
    }

    public function crearVideo($data)
    {
        $validator = new Validator($data);
        $validator->required(['titulo', 'descripcion', 'url', 'fase']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = Video::create($data);

        if ($result) {
            return Response::success($result, 'Video creado exitosamente', 201);
        }

        return Response::error('Error al crear video', 500);
    }

    public function getVideosAsignados($pacienteId)
    {
        $videos = Video::getAsignados($pacienteId);
        return Response::success($videos);
    }

    public function asignarVideo($pacienteId, $videoId)
    {
        $user = AuthMiddleware::getCurrentUser();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $result = Video::assign(
                $pacienteId,
                $videoId,
                $user['id'],
                $data['frecuencia'] ?? null,
                $data['repeticiones'] ?? null
            );

            if ($result) {
                return Response::success(null, 'Video asignado exitosamente');
            }
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                return Response::error('Este video ya está asignado al paciente', 409);
            }
            return Response::error('Error al asignar video', 500);
        }

        return Response::error('Error al asignar video', 500);
    }

    // GUÍAS DE CUIDADO DE PRÓTESIS
    public function getGuias($fase = null)
    {
        $guias = GuiaProtesis::getAll($fase);
        return Response::success($guias);
    }

    public function getGuia($id)
    {
        $guia = GuiaProtesis::find($id);

        if (!$guia) {
            return Response::error('Guía no encontrada', 404);
        }

        return Response::success($guia);
    }

    public function crearGuia($data)
    {
        $validator = new Validator($data);
        $validator->required(['titulo', 'contenido', 'fase']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = GuiaProtesis::create($data);

        if ($result) {
            return Response::success($result, 'Guía creada exitosamente', 201);
        }

        return Response::error('Error al crear guía', 500);
    }

    // CHECKLIST DE INSPECCIÓN
    public function getChecklist($pacienteId, $fecha = null)
    {
        $checklist = ChecklistProtesis::getByPaciente($pacienteId, $fecha);
        return Response::success($checklist);
    }

    public function guardarChecklist($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'items']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        if (isset($_FILES['foto'])) {
            $fotoPath = $this->fileUploadService->upload($_FILES['foto'], 'protesis');
            $data['foto'] = $fotoPath;
        }

        $result = ChecklistProtesis::save($data);

        if ($result) {
            return Response::success($result, 'Checklist guardado exitosamente', 201);
        }

        return Response::error('Error al guardar checklist', 500);
    }

    public function getHistorialChecklist($pacienteId, $filters = [])
    {
        $historial = ChecklistProtesis::getHistorial($pacienteId, $filters);
        return Response::success($historial);
    }

    // ==========================================
    // EVALUACIONES FÍSICAS
    // ==========================================

    public function getEvaluaciones($pacienteId)
    {
        $evaluaciones = EvaluacionFisica::getByPaciente($pacienteId);
        return Response::success($evaluaciones);
    }

    public function getEvaluacion($id)
    {
        $evaluacion = EvaluacionFisica::find($id);

        if (!$evaluacion) {
            return Response::error('Evaluación no encontrada', 404);
        }

        return Response::success($evaluacion);
    }

    public function crearEvaluacion()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $user = AuthMiddleware::getCurrentUser();

        $validator = new Validator($data);
        $validator->required(['paciente_id', 'fecha']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $data['especialista_id'] = $user['id'];
        $result = EvaluacionFisica::create($data);

        if ($result) {
            return Response::success(['id' => $result], 'Evaluación creada exitosamente', 201);
        }

        return Response::error('Error al crear evaluación', 500);
    }

    public function actualizarEvaluacion($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $evaluacion = EvaluacionFisica::find($id);
        if (!$evaluacion) {
            return Response::error('Evaluación no encontrada', 404);
        }

        $result = EvaluacionFisica::update($id, $data);

        if ($result) {
            return Response::success(null, 'Evaluación actualizada exitosamente');
        }

        return Response::error('Error al actualizar evaluación', 500);
    }

    public function eliminarEvaluacion($id)
    {
        $evaluacion = EvaluacionFisica::find($id);
        if (!$evaluacion) {
            return Response::error('Evaluación no encontrada', 404);
        }

        EvaluacionFisica::delete($id);
        return Response::success(null, 'Evaluación eliminada exitosamente');
    }

    // ==========================================
    // PLANES DE TRATAMIENTO
    // ==========================================

    public function getPlanes($pacienteId)
    {
        $planes = PlanTratamiento::getByPaciente($pacienteId);
        return Response::success($planes);
    }

    public function getPlan($id)
    {
        $plan = PlanTratamiento::find($id);

        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        return Response::success($plan);
    }

    public function crearPlan()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $user = AuthMiddleware::getCurrentUser();

        $validator = new Validator($data);
        $validator->required(['paciente_id', 'nombre', 'fecha_inicio']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $data['especialista_id'] = $user['id'];
        $result = PlanTratamiento::create($data);

        if ($result) {
            return Response::success(['id' => $result], 'Plan creado exitosamente', 201);
        }

        return Response::error('Error al crear plan', 500);
    }

    public function actualizarPlan($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $plan = PlanTratamiento::find($id);
        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        $result = PlanTratamiento::update($id, $data);

        if ($result) {
            return Response::success(null, 'Plan actualizado exitosamente');
        }

        return Response::error('Error al actualizar plan', 500);
    }

    public function cambiarEstadoPlan($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['estado'])) {
            return Response::error('Estado requerido', 422);
        }

        $result = PlanTratamiento::updateEstado($id, $data['estado']);

        if ($result) {
            return Response::success(null, 'Estado del plan actualizado');
        }

        return Response::error('Estado no válido', 422);
    }

    // ==========================================
    // ESTADÍSTICAS PARA ESPECIALISTA
    // ==========================================

    public function completarEjercicio($data)
    {
        $pacienteId = $data['paciente_id'] ?? null;
        $ejercicioId = $data['ejercicio_id'] ?? null;
        $fecha = $data['fecha'] ?? date('Y-m-d');

        if (!$pacienteId || !$ejercicioId) {
            return Response::error('paciente_id y ejercicio_id son requeridos', 422);
        }

        $db = DatabaseService::getInstance();

        $user = AuthMiddleware::getCurrentUser();
        $paciente = $db->query("SELECT usuario_id FROM pacientes WHERE id = ?", [$pacienteId])->fetch();
        if (!$paciente || (int)$paciente['usuario_id'] !== (int)$user['id']) {
            return Response::error('No autorizado', 403);
        }

        // Insertar o actualizar registro de completado
        $db->query(
            "INSERT INTO registro_videos (paciente_id, video_id, porcentaje_visto, completado, fecha)
             VALUES (?, ?, 100, 1, ?)
             ON DUPLICATE KEY UPDATE porcentaje_visto = 100, completado = 1",
            [$pacienteId, $ejercicioId, $fecha]
        );

        return Response::success(null, 'Ejercicio marcado como completado');
    }

    public function getEstadisticasPaciente($pacienteId)
    {
        $db = DatabaseService::getInstance();

        // Videos completados (últimos 30 días)
        $videosCompletados = $db->query(
            "SELECT COUNT(*) as total FROM registro_videos
             WHERE paciente_id = ? AND completado = 1 AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
            [$pacienteId]
        )->fetch();

        // Total videos asignados
        $videosAsignados = $db->query(
            "SELECT COUNT(*) as total FROM videos_asignados WHERE paciente_id = ? AND activo = 1",
            [$pacienteId]
        )->fetch();

        // Registros por día (últimos 14 días)
        $actividadDiaria = $db->query(
            "SELECT fecha, COUNT(*) as videos_vistos, SUM(completado) as completados
             FROM registro_videos
             WHERE paciente_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
             GROUP BY fecha ORDER BY fecha ASC",
            [$pacienteId]
        )->fetchAll();

        // Racha actual
        $racha = 0;
        $fechaCheck = date('Y-m-d');
        for ($i = 0; $i < 30; $i++) {
            $count = $db->query(
                "SELECT COUNT(*) as c FROM registro_videos WHERE paciente_id = ? AND fecha = ? AND completado = 1",
                [$pacienteId, $fechaCheck]
            )->fetch();
            if ($count['c'] > 0) {
                $racha++;
                $fechaCheck = date('Y-m-d', strtotime($fechaCheck . ' -1 day'));
            } else {
                break;
            }
        }

        // Última evaluación
        $ultimaEval = EvaluacionFisica::getUltima($pacienteId);

        // Plan activo
        $planActivo = $db->query(
            "SELECT id, nombre, estado, fecha_inicio, duracion_semanas FROM planes_tratamiento
             WHERE paciente_id = ? AND estado = 'activo' ORDER BY created_at DESC LIMIT 1",
            [$pacienteId]
        )->fetch();

        return Response::success([
            'videos_completados_30d' => (int)($videosCompletados['total'] ?? 0),
            'videos_asignados' => (int)($videosAsignados['total'] ?? 0),
            'racha_actual' => $racha,
            'actividad_diaria' => $actividadDiaria,
            'ultima_evaluacion' => $ultimaEval,
            'plan_activo' => $planActivo
        ]);
    }
    // ==========================================
// INDICACIONES DEL PACIENTE
// ==========================================

public function guardarIndicaciones()
{

    $data = json_decode(file_get_contents("php://input"), true);

    $user = AuthMiddleware::getCurrentUser();

    $validator = new Validator($data);

    $validator->required([

        "paciente_id",
        "fase_actual",
        "indicaciones"

    ]);

    if (!$validator->passes()) {

        return Response::error(
            $validator->errors(),
            422
        );

    }

    $data["especialista_id"] = $user["id"];

    IndicacionFisioterapia::guardar($data);

    return Response::success(

        null,

        "Indicaciones guardadas correctamente"

    );
    // ==========================================
// RQF8 - ALERTA AUTOMÁTICA A ORTESIS
// ==========================================

if ((int)$data["fase_actual"] === 4) {

    $db = DatabaseService::getInstance();

    // Verificar que no exista una alerta pendiente
    $existe = $db->query(

        "SELECT id
         FROM alertas_clinicas
         WHERE paciente_id = ?
         AND area_destino = 'ortesis'
         AND tipo_alerta = 'fin_fisioterapia'
         AND estado = 'pendiente'
         LIMIT 1",

        [

            $data["paciente_id"]

        ]

    )->fetch();

    if (!$existe) {

        $db->query(

            "INSERT INTO alertas_clinicas(

                paciente_id,

                area_destino,

                tipo_alerta,

                titulo,

                descripcion,

                prioridad

            )

            VALUES(

                ?,?,?,?,?,?

            )",

            [

                $data["paciente_id"],

                "ortesis",

                "fin_fisioterapia",

                "Paciente listo para valoración",

                "El paciente concluyó satisfactoriamente la fase de Fisioterapia y puede continuar con la valoración del área de Ortesis y Prótesis.",

                "alta"

            ]

        );

    }

}

}


//obtener indicacion
public function obtenerIndicaciones($pacienteId)
{

    $datos = IndicacionFisioterapia::obtener($pacienteId);

    return Response::success($datos);

}
// ==========================================
// ELIMINAR INDICACIÓN
// ==========================================

public function eliminarIndicacion($pacienteId)
{

    $db = DatabaseService::getInstance();

    $db->query(

        "DELETE FROM indicaciones_fisioterapia
         WHERE paciente_id = ?",

        [

            $pacienteId

        ]

    );

    return Response::success(

        null,

        "Indicación eliminada correctamente"

    );

}
// ==========================================
// INFORMACIÓN DEL PACIENTE
// ==========================================

public function obtenerInformacionPaciente($pacienteId)
{

    $datos = Paciente::obtenerInformacion($pacienteId);

    if (!$datos) {

        return Response::error(

            "Paciente no encontrado",

            404

        );

    }

    return Response::success($datos);

}
}
