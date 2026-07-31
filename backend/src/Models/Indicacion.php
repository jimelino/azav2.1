<?php

namespace App\Models;

use App\Services\DatabaseService;

class Indicacion
{
    private static $table = 'indicaciones';

    /**
     * Obtener todas las indicaciones de un paciente
     */
    public static function getByPaciente($pacienteId)
    {
        $db = DatabaseService::getInstance();

        return $db->query(
            "SELECT
                i.*,
                u.nombre_completo AS especialista
            FROM indicaciones i
            INNER JOIN usuarios u
                ON i.especialista_id = u.id
            WHERE i.paciente_id = ?
            ORDER BY
                i.created_at DESC",
            [$pacienteId]
        )->fetchAll();
    }

    /**
     * Crear una nueva indicación
     */
    public static function crear($data)
    {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO indicaciones
            (
                paciente_id,
                especialista_id,
                titulo,
                descripcion,
                prioridad,
                visible_paciente,
                fecha_vencimiento
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?)",
            [
                $data['paciente_id'],
                $data['especialista_id'],
                $data['titulo'],
                $data['descripcion'],
                $data['prioridad'],
                $data['visible_paciente'],
                $data['fecha_vencimiento']
            ]
        );

        return $db->lastInsertId();
    }

    /**
     * Eliminar indicación
     */
    public static function eliminar($id)
    {
        $db = DatabaseService::getInstance();

        return $db->query(
            "DELETE FROM indicaciones
            WHERE id=?",
            [$id]
        );
    }
}