<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;

class AlertasClinicasController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    /**
     * Obtener alertas pendientes por área
     */
    public function obtenerPorArea($area)
    {
        $alertas = $this->db->query(
            "SELECT

                ac.id,
                ac.tipo_alerta,
                ac.titulo,
                ac.descripcion,
                ac.prioridad,
                ac.created_at,

                p.id AS paciente_id,

                u.nombre_completo AS paciente

            FROM alertas_clinicas ac

            INNER JOIN pacientes p
                ON ac.paciente_id = p.id

            INNER JOIN usuarios u
                ON p.usuario_id = u.id

            WHERE ac.area_destino = ?
            AND ac.estado = 'pendiente'

            ORDER BY

                FIELD(ac.prioridad,'critica','alta','media','baja'),

                ac.created_at DESC

            ",
            [$area]
        )->fetchAll();

        return Response::success($alertas);
    }

    /**
     * Marcar alerta como atendida
     */
    public function atender($id)
    {
        $this->db->query(

            "UPDATE alertas_clinicas

            SET

                estado='atendida',

                fecha_atendida=NOW()

            WHERE id=?",

            [$id]

        );

        return Response::success(

            null,

            "Alerta atendida correctamente."

        );
    }
}