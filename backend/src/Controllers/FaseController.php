<?php

namespace App\Controllers;

use App\Models\Fase;
use App\Models\Paciente;
use App\Utils\Response;
use App\Utils\Validator;

class FaseController
{
    public function getFaseActual($pacienteId)
    {
        $fase = Fase::getCurrentFase($pacienteId);

        if (!$fase) {
            return Response::error('No se encontró fase activa', 404);
        }

        return Response::success($fase);
    }

    public function getProgreso($pacienteId)
    {
        $progreso = Fase::getProgreso($pacienteId);
        return Response::success($progreso);
    }

    public function cambiarFase($pacienteId, $data, $especialistaId = null)
    {
        $validator = new Validator($data);
        $validator->required(['nueva_fase', 'motivo'])
                  ->numeric('nueva_fase');

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $motivo = trim((string) $data['motivo']);
        if ($motivo === '') {
            return Response::error(['motivo' => 'El motivo del cambio es requerido'], 422);
        }

        $nuevaFaseNumero = filter_var($data['nueva_fase'], FILTER_VALIDATE_INT);
        if ($nuevaFaseNumero === false) {
            return Response::error(['nueva_fase' => 'La fase seleccionada debe ser un número entero'], 422);
        }

        $nuevaFase = Fase::getByNumero($nuevaFaseNumero);
        if (!$nuevaFase) {
            return Response::error(['nueva_fase' => 'La fase seleccionada no existe'], 422);
        }

        $result = Fase::cambiarFase(
            $pacienteId,
            $nuevaFase['id'],
            $motivo,
            $especialistaId
        );

        if ($result) {
            return Response::success(null, 'Fase actualizada exitosamente');
        }

        return Response::error('Error al cambiar fase', 500);
    }

    public function getHistorialFases($pacienteId)
    {
        $historial = Fase::getHistorial($pacienteId);
        return Response::success($historial);
    }

    public function getDashboard($pacienteId)
    {
        $dashboard = [
            'fase_actual' => Fase::getCurrentFase($pacienteId),
            'progreso' => Fase::getProgreso($pacienteId),
            'estadisticas' => Fase::getEstadisticas($pacienteId)
        ];

        return Response::success($dashboard);
    }
}
