<?php

namespace App\Controllers;

use App\Services\DatabaseService;

class IndicacionesController
{
    /**
     * Obtener todos los pacientes registrados
     */
    public function obtenerPacientes()
    {
        $db = DatabaseService::getInstance();

        $pacientes = $db->query("
            SELECT
                p.id,
                u.nombre_completo
            FROM pacientes p
            INNER JOIN usuarios u
                ON u.id = p.usuario_id
            WHERE u.rol_id = 3
            ORDER BY u.nombre_completo
        ")->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $pacientes
        ]);
    }

    /**
     * Guardar indicación
     */
    public function guardar($data)
    {
        $db = DatabaseService::getInstance();

        $db->query("
            INSERT INTO indicaciones
            (
                paciente_id,
                especialista_id,
                titulo,
                descripcion,
                prioridad,
                visible_paciente,
                fecha_vencimiento,
                created_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, NOW())
        ", [

            $data["paciente_id"],
            $data["especialista_id"],
            $data["titulo"],
            $data["descripcion"],
            $data["prioridad"],
            1,
            $data["fecha_vencimiento"]

        ]);

        echo json_encode([
            "success" => true,
            "message" => "Indicación guardada correctamente."
        ]);
    }

    /**
     * Obtener indicaciones de un paciente
     */
    public function obtenerPorPaciente($pacienteId)
    {
        $db = DatabaseService::getInstance();

        $indicaciones = $db->query("
            SELECT
                i.*,
                u.nombre_completo AS especialista
            FROM indicaciones i
            INNER JOIN usuarios u
                ON u.id = i.especialista_id
            WHERE i.paciente_id = ?
            ORDER BY i.created_at DESC
        ", [$pacienteId])->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $indicaciones
        ]);
    }
}