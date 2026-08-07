<?php
namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\OrtesisFase;
use App\Services\DatabaseService;
use App\Utils\Response;

class OrtesisFaseController
{
    private $db;

    public function __construct() { $this->db = DatabaseService::getInstance(); }

    private function usuarioPuedeAccederPaciente($pacienteId, $user)
    {
        if ((int) $user['rol_id'] === 3) { // paciente
            return (int) ($user['paciente_id'] ?? 0) === (int) $pacienteId;
        }
        if ((int) $user['rol_id'] === 2) { // especialista
            $asignacion = $this->db->query(
                "SELECT a.id
                 FROM asignaciones_especialista a
                 INNER JOIN areas_medicas am ON am.id = a.area_medica_id
                 WHERE a.paciente_id = ? AND a.especialista_id = ? AND a.activo = 1
                   AND (LOWER(am.nombre) LIKE '%ortesis%' OR LOWER(am.nombre) LIKE '%prótesis%' OR LOWER(am.nombre) LIKE '%protesis%')",
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
        $fase = OrtesisFase::getActual($pacienteId);
        return Response::success(['fase' => $fase, 'catalogo' => ORTESIS_FASES]);
    }

    public function getHistorial($pacienteId)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }
        $historial = OrtesisFase::getHistorial($pacienteId);
        return Response::success(['historial' => $historial]);
    }

    public function cambiarFase($pacienteId, $data)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) { return Response::error('No autorizado', 401); }
        if ((int) $user['rol_id'] !== 2) { return Response::error('Solo un especialista puede cambiar la fase', 403); }
        if (!$this->usuarioPuedeAccederPaciente($pacienteId, $user)) { return Response::error('No autorizado', 403); }

        $faseNumero = (int) ($data['fase_numero'] ?? 0);
        if (!isset(ORTESIS_FASES[$faseNumero])) { return Response::error('fase_numero inválido', 422); }

        $fase = OrtesisFase::cambiarFase($pacienteId, $user['id'], $faseNumero, $data['notas'] ?? null);
        OrtesisFase::notificarCambio($pacienteId, $faseNumero);

        return Response::success(['fase' => $fase], 'Fase actualizada exitosamente');
    }
}
