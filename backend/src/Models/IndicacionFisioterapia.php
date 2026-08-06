<?php

namespace App\Models;

use App\Services\DatabaseService;

class IndicacionFisioterapia
{

    public static function guardar($datos)
    {
        $db = DatabaseService::getInstance();
        // Actualizar la fase actual del paciente
$db->query(

    "UPDATE pacientes

    SET

        fase_actual_id = ?,
        fecha_cambio_fase = CURDATE()

    WHERE id = ?",

    [

        $datos["fase_actual"],
        $datos["paciente_id"]

    ]

);

        $existe = $db->query(
            "SELECT id
             FROM indicaciones_fisioterapia
             WHERE paciente_id = ?",
            [
                $datos['paciente_id']
            ]
        )->fetch();

        if ($existe) {

            return $db->query(

                "UPDATE indicaciones_fisioterapia

                SET

                    fase_actual = ?,
                    indicaciones = ?,
                    especialista_id = ?,
                    updated_at = NOW()

                WHERE paciente_id = ?",

                [

                    $datos['fase_actual'],
                    $datos['indicaciones'],
                    $datos['especialista_id'],
                    $datos['paciente_id']

                ]

            );

        }

        return $db->query(

            "INSERT INTO indicaciones_fisioterapia(

                paciente_id,
                especialista_id,
                fase_actual,
                indicaciones

            )

            VALUES(?,?,?,?)",

            [

                $datos['paciente_id'],
                $datos['especialista_id'],
                $datos['fase_actual'],
                $datos['indicaciones']

            ]

        );

    }

    public static function obtener($pacienteId)
    {

        $db = DatabaseService::getInstance();

        return $db->query(

            "SELECT *

            FROM indicaciones_fisioterapia

            WHERE paciente_id=?",

            [

                $pacienteId

            ]

        )->fetch();

    }

}