<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Recordatorio;
use App\Services\RecordatorioService;
use App\Utils\Response;
use App\Utils\Validator;

class RecordatoriosController
{
    private $recordatorioService;

    public function __construct()
    {
        $this->recordatorioService = new RecordatorioService();
    }

    // OBTENER RECORDATORIOS
    public function getRecordatorios($pacienteId, $activos = null)
    {
        $user = AuthMiddleware::getCurrentUser();
        if ((int)Recordatorio::getUsuarioIdByPaciente($pacienteId) !== (int)$user['id']) {
            return Response::error('No autorizado', 403);
        }

        $recordatorios = Recordatorio::getByPaciente($pacienteId, $activos);
        return Response::success($recordatorios);
    }

    // CREAR RECORDATORIO
    public function crearRecordatorio($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'tipo', 'titulo', 'hora']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $user = AuthMiddleware::getCurrentUser();
        if ((int)Recordatorio::getUsuarioIdByPaciente($data['paciente_id']) !== (int)$user['id']) {
            return Response::error('No autorizado', 403);
        }

        $result = Recordatorio::create($data);

        if ($result) {
            // Programar el recordatorio si el servicio existe
            if ($this->recordatorioService) {
                try {
                    $this->recordatorioService->schedule($result);
                } catch (\Exception $e) {
                    // Ignorar si el servicio falla
                }
            }

            return Response::success(['id' => $result], 'Recordatorio creado exitosamente', 201);
        }

        return Response::error('Error al crear recordatorio', 500);
    }

    // ACTUALIZAR RECORDATORIO
    public function actualizarRecordatorio($id, $data)
    {
        if (!$this->usuarioEsDuenoDelRecordatorio($id)) {
            return Response::error('No autorizado', 403);
        }

        $result = Recordatorio::update($id, $data);

        if ($result) {
            // Reprogramar el recordatorio
            $this->recordatorioService->reschedule($id);

            return Response::success(null, 'Recordatorio actualizado exitosamente');
        }

        return Response::error('Error al actualizar recordatorio', 500);
    }

    // ELIMINAR RECORDATORIO
    public function eliminarRecordatorio($id)
    {
        if (!$this->usuarioEsDuenoDelRecordatorio($id)) {
            return Response::error('No autorizado', 403);
        }

        $result = Recordatorio::delete($id);

        if ($result) {
            return Response::success(null, 'Recordatorio eliminado exitosamente');
        }

        return Response::error('Error al eliminar recordatorio', 500);
    }

    private function usuarioEsDuenoDelRecordatorio($id)
    {
        $user = AuthMiddleware::getCurrentUser();
        $recordatorio = Recordatorio::find($id);

        return $recordatorio && (int)$recordatorio['usuario_id'] === (int)$user['id'];
    }

    // MARCAR COMO COMPLETADO
    public function marcarCompletado($id)
    {
        $result = Recordatorio::markCompleted($id);

        if ($result) {
            return Response::success(null, 'Recordatorio marcado como completado');
        }

        return Response::error('Error al marcar recordatorio', 500);
    }

    // ACTIVAR/DESACTIVAR
    public function toggleActivo($id)
    {
        $result = Recordatorio::toggleActive($id);

        if ($result) {
            return Response::success($result, 'Estado actualizado exitosamente');
        }

        return Response::error('Error al cambiar estado', 500);
    }

    // HISTORIAL
    public function getHistorial($pacienteId, $filters = [])
    {
        $historial = Recordatorio::getHistorial($pacienteId, $filters);
        return Response::success($historial);
    }

    // ENVIAR RECORDATORIOS PENDIENTES (para cron)
    public function enviarRecordatoriosPendientes()
    {
        $recordatorios = Recordatorio::getPendientes();
        $enviados = 0;

        foreach ($recordatorios as $recordatorio) {
            if ($this->recordatorioService->send($recordatorio)) {
                Recordatorio::registrarEnvio($recordatorio['id'], $recordatorio['usuario_id']);
                $enviados++;
            }
        }

        return Response::success(['enviados' => $enviados]);
    }
}
