<?php

namespace App\Models;

use App\Services\DatabaseService;

class Paciente
{
    private static $table = 'pacientes';

    public static function find($id)
    {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT * FROM " . self::$table . " WHERE id = ?", [$id])->fetch();
    }

    public static function findByUserId($userId)
    {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT p.*, u.* FROM " . self::$table . " p
                          JOIN usuarios u ON p.usuario_id = u.id
                          WHERE p.usuario_id = ?", [$userId])->fetch();
    }

    public static function create($data)
    {
        $db = DatabaseService::getInstance();

        $query = "INSERT INTO " . self::$table . "
                  (user_id, fase_actual, fecha_amputacion, tipo_amputacion, causa_amputacion,
                   enfermedades_cronicas, alergias, medicamentos_actuales, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";

        $db->query($query, [
            $data['user_id'],
            $data['fase_actual'] ?? FASE_PRECONSULTA,
            $data['fecha_amputacion'] ?? null,
            $data['tipo_amputacion'] ?? null,
            $data['causa_amputacion'] ?? null,
            $data['enfermedades_cronicas'] ?? null,
            $data['alergias'] ?? null,
            $data['medicamentos_actuales'] ?? null
        ]);

        return self::findByUserId($data['user_id']);
    }

    public static function update($id, $data)
    {
        $db = DatabaseService::getInstance();

        $fields = [];
        $values = [];

        foreach ($data as $key => $value) {
            if ($key !== 'id' && $key !== 'user_id') {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }

        $values[] = $id;

        $query = "UPDATE " . self::$table . " SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?";

        return $db->query($query, $values);
    }

    public static function getAll()
    {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT p.*, u.nombre_completo, u.email
                          FROM " . self::$table . " p
                          JOIN usuarios u ON p.usuario_id = u.id
                          ORDER BY p.created_at DESC")->fetchAll();
    }

    public static function getEspecialistasAsignados($pacienteId)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT u.nombre_completo, u.email, am.nombre as especialidad
             FROM asignaciones_especialista ae
             JOIN usuarios u ON ae.especialista_id = u.id
             LEFT JOIN areas_medicas am ON ae.area_medica_id = am.id
             WHERE ae.paciente_id = ?",
            [$pacienteId]
        )->fetchAll();
    }

    public static function assignEspecialista($pacienteId, $especialistaId, $especialidad)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "INSERT INTO asignaciones_especialista (paciente_id, especialista_id, especialidad, created_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE updated_at = NOW()",
            [$pacienteId, $especialistaId, $especialidad]
        );
    }

    public static function removeEspecialista($pacienteId, $especialistaId)
    {
        $db = DatabaseService::getInstance();
        return $db->query(
            "DELETE FROM asignaciones_especialista WHERE paciente_id = ? AND especialista_id = ?",
            [$pacienteId, $especialistaId]
        );
    }
    public static function obtenerInformacion($pacienteId)
{
    $db = DatabaseService::getInstance();

    return $db->query(

        "SELECT

            p.id,
            u.nombre_completo,
            u.email,
            am.nombre AS area,
            esp.nombre_completo AS especialista

        FROM pacientes p

        INNER JOIN usuarios u
            ON p.usuario_id = u.id

        LEFT JOIN asignaciones_especialista ae
            ON ae.paciente_id = p.id
            AND ae.activo = 1

        LEFT JOIN usuarios esp
            ON ae.especialista_id = esp.id

        LEFT JOIN areas_medicas am
            ON ae.area_medica_id = am.id

        WHERE p.id = ?",

        [

            $pacienteId

        ]

    )->fetch();

}
}
