<?php

namespace App\Models;

use App\Services\DatabaseService;

class Fase
{
    public static function getCurrentFase($pacienteId)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.fase_actual_id, ft.id, ft.numero, ft.nombre, ft.descripcion,
                    p.progreso_general, p.fecha_cambio_fase
             FROM pacientes p
             JOIN fases_tratamiento ft ON p.fase_actual_id = ft.id
             WHERE p.id = ?",
            [$pacienteId]
        )->fetch();
    }

    public static function getByNumero($numero)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT * FROM fases_tratamiento WHERE numero = ?",
            [$numero]
        )->fetch();
    }

    public static function getProgreso($pacienteId)
    {
        $db = DatabaseService::getInstance();

        // Obtener fase actual del paciente
        $paciente = $db->query(
            "SELECT p.*, ft.numero as fase_numero, ft.nombre as fase_nombre
             FROM pacientes p
             JOIN fases_tratamiento ft ON p.fase_actual_id = ft.id
             WHERE p.id = ?",
            [$pacienteId]
        )->fetch();

        // Total de fases
        $totalFases = $db->query("SELECT COUNT(*) as total FROM fases_tratamiento")->fetch();

        // Historial de cambios
        $historial = self::getHistorial($pacienteId);

        return [
            'fase_actual' => [
                'id' => $paciente['fase_actual_id'],
                'numero' => $paciente['fase_numero'],
                'nombre' => $paciente['fase_nombre']
            ],
            'fases_completadas' => $paciente['fase_numero'] - 1,
            'total_fases' => $totalFases['total'],
            'progreso_porcentaje' => $paciente['progreso_general'] ?? 0,
            'historial' => $historial
        ];
    }

    public static function cambiarFase($pacienteId, $nuevaFaseId, $motivo, $especialistaId = null)
    {
        $db = DatabaseService::getInstance();

        $db->beginTransaction();

        try {
            // Obtener fase actual
            $paciente = $db->query(
                "SELECT fase_actual_id FROM pacientes WHERE id = ?",
                [$pacienteId]
            )->fetch();

            // Registrar en historial
            $db->query(
                "INSERT INTO historial_fases
                 (paciente_id, fase_anterior_id, fase_nueva_id, especialista_id, notas, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())",
                [$pacienteId, $paciente['fase_actual_id'], $nuevaFaseId, $especialistaId, $motivo]
            );

            // Actualizar fase en tabla pacientes
            $db->query(
                "UPDATE pacientes SET fase_actual_id = ?, fecha_cambio_fase = CURDATE(), updated_at = NOW()
                 WHERE id = ?",
                [$nuevaFaseId, $pacienteId]
            );

            $db->commit();
            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            return false;
        }
    }

    public static function getHistorial($pacienteId)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT hf.*, fa.nombre as fase_anterior_nombre, fn.nombre as fase_nueva_nombre,
                    u.nombre_completo as especialista_nombre
             FROM historial_fases hf
             LEFT JOIN fases_tratamiento fa ON hf.fase_anterior_id = fa.id
             LEFT JOIN fases_tratamiento fn ON hf.fase_nueva_id = fn.id
             LEFT JOIN usuarios u ON hf.especialista_id = u.id
             WHERE hf.paciente_id = ?
             ORDER BY hf.created_at DESC",
            [$pacienteId]
        )->fetchAll();
    }

    public static function getEstadisticas($pacienteId)
    {
        $db = DatabaseService::getInstance();

        // Obtener datos del paciente
        $paciente = $db->query(
            "SELECT p.*, ft.nombre as fase_nombre, ft.numero as fase_numero
             FROM pacientes p
             JOIN fases_tratamiento ft ON p.fase_actual_id = ft.id
             WHERE p.id = ?",
            [$pacienteId]
        )->fetch();

        // Contar cambios de fase
        $cambios = $db->query(
            "SELECT COUNT(*) as total FROM historial_fases WHERE paciente_id = ?",
            [$pacienteId]
        )->fetch();

        // Calcular días desde inicio
        $diasEnRehabilitacion = $db->query(
            "SELECT DATEDIFF(NOW(), created_at) as dias FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();

        return [
            'fase_actual' => $paciente['fase_nombre'],
            'fase_numero' => $paciente['fase_numero'],
            'progreso_general' => $paciente['progreso_general'],
            'total_cambios_fase' => $cambios['total'],
            'dias_en_rehabilitacion' => $diasEnRehabilitacion['dias']
        ];
    }

    public static function getAllFases()
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT * FROM fases_tratamiento ORDER BY numero"
        )->fetchAll();
    }
}
