<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\NeuroFase;
use App\Services\DatabaseService;
use App\Services\NotificationService;
use App\Utils\Response;

class NeuroFaseController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    /**
     * ¿Puede este usuario ver la fase de este paciente? Sí, si es el propio
     * paciente, o si es un especialista de Neuropsicología asignado a él.
     */
    private function usuarioPuedeAccederPaciente($pacienteId, $user)
    {
        if ((int) $user['rol_id'] === 3) {
            return (int) ($user['paciente_id'] ?? 0) === (int) $pacienteId;
        }

        if ((int) $user['rol_id'] === 2) {
            $asignacion = $this->db->query(
                "SELECT a.id
                 FROM asignaciones_especialista a
                 INNER JOIN areas_medicas am ON am.id = a.area_medica_id
                 WHERE a.paciente_id = ? AND a.especialista_id = ? AND a.activo = 1
                   AND am.nombre = 'neuropsicologia'",
                [$pacienteId, $user['id']]
            )->fetch();
            return (bool) $asignacion;
        }

        return false;
    }

    public function getFaseActual($pacienteId)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }

        $fase = NeuroFase::getActual($pacienteId);
        return Response::success(['fase' => $fase, 'catalogo' => NEURO_FASES]);
    }

    public function getHistorial($pacienteId)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }

        $historial = NeuroFase::getHistorial($pacienteId);
        return Response::success(['historial' => $historial]);
    }

    public function cambiarFase($pacienteId, $data)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) {
            return Response::error('No autorizado', 401);
        }

        if ((int) $user['rol_id'] !== 2) {
            return Response::error('Solo un especialista puede cambiar la fase', 403);
        }

        if (!$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }

        $faseNumero = (int) ($data['fase_numero'] ?? 0);
        if (!isset(NEURO_FASES[$faseNumero])) {
            return Response::error('fase_numero inválido', 422);
        }

        $fase = NeuroFase::cambiarFase($pacienteId, $user['id'], $faseNumero, $data['notas'] ?? null);

        $this->notificarCambioFase($pacienteId, $faseNumero);

        return Response::success(['fase' => $fase], 'Fase actualizada exitosamente');
    }

    private function notificarCambioFase($pacienteId, $faseNumero)
    {
        $paciente = $this->db->query(
            "SELECT usuario_id FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();

        if (!$paciente) {
            return;
        }

        $nombreFase = NEURO_FASES[$faseNumero];

        $titulos = [
            1 => 'Bienvenido al Servicio de Neuropsicología',
            2 => 'Concluiste tu evaluación inicial',
            3 => 'Comenzaste tu intervención neuropsicológica',
            4 => '¡Concluiste tu proceso en Neuropsicología!',
        ];

        $mensajes = [
            1 => 'Enhorabuena, usted ingresó al Servicio de Neuropsicología. En este servicio tenemos cuatro etapas. En breve programaremos su evaluación.',
            2 => 'Usted concluyó la evaluación inicial del Servicio de Neuropsicología.',
            3 => 'Usted comenzó la intervención neuropsicológica. Tendrá sesiones periódicas de entrenamiento mental hasta su alta.',
            4 => 'Felicidades, usted ha concluido su entrenamiento mental con el Servicio de Neuropsicología. Recuerde practicar las habilidades aprendidas; con gusto puede agendar una sesión de seguimiento.',
        ];

        (new NotificationService())->crear(
            $paciente['usuario_id'],
            NOTIF_NEURO_FASE,
            $titulos[$faseNumero] ?? 'Cambio de fase - Neuropsicología',
            $mensajes[$faseNumero] ?? "Tu fase de tratamiento en Neuropsicología cambió a: {$nombreFase}",
            ['fase_numero' => $faseNumero, 'fase_nombre' => $nombreFase],
            'neuro_fase',
            $pacienteId
        );
    }
}
