<?php

namespace App\Controllers;

use App\Models\Indicacion;
use App\Services\DatabaseService;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class IndicacionesController
{
    /**
     * Obtener pacientes para el selector del especialista
     */
    public function getPacientes()
    {
        $db = DatabaseService::getInstance();

        $pacientes = $db->query(
            "SELECT
                p.id,
                u.nombre_completo
            FROM pacientes p
            INNER JOIN usuarios u
                ON p.usuario_id = u.id
            WHERE u.activo = 1
            ORDER BY u.nombre_completo"
        )->fetchAll();

        return Response::success($pacientes);
    }

    /**
     * Obtener indicaciones de un paciente
     */
    public function getIndicaciones($pacienteId)
    {
        return Response::success(
            Indicacion::getByPaciente($pacienteId)
        );
    }

    /**
     * Crear indicación
     */
    public function crearIndicacion($data)
    {
        $usuario = AuthMiddleware::getCurrentUser();

        if (!$usuario) {
            return Response::error("No autorizado",401);
        }

        if (
            empty($data["paciente_id"]) ||
            empty($data["descripcion"])
        ) {
            return Response::error(
                "Faltan datos obligatorios",
                422
            );
        }

        $id = Indicacion::crear([

            "paciente_id"=>$data["paciente_id"],

            "especialista_id"=>$usuario["id"],

            "titulo"=>$data["titulo"] ?? null,

            "descripcion"=>$data["descripcion"],

            "prioridad"=>$data["prioridad"] ?? "media",

            "visible_paciente"=>$data["visible_paciente"] ?? 1,

        ]);

        return Response::success(
            ["id"=>$id],
            "Indicación registrada",
            201
        );
    }

    /**
     * Eliminar
     */
    public function eliminarIndicacion($id)
    {
        Indicacion::eliminar($id);

        return Response::success(
            null,
            "Indicación eliminada"
        );
    }
}