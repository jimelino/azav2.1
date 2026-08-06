<?php
namespace App\Models;
use App\Services\DatabaseService;

class NeuroFase {
    private static $table = 'neuro_fases_historial';

    /**
     * Fase vigente del paciente = su fila más reciente. Sin fila, fase 1
     * (Consulta inicial) por defecto.
     */
    public static function getActual($pacienteId) {
        $db = DatabaseService::getInstance();

        $ultima = $db->query(
            "SELECT h.*, u.nombre_completo AS especialista_nombre
             FROM " . self::$table . " h
             INNER JOIN usuarios u ON u.id = h.especialista_id
             WHERE h.paciente_id = ?
             ORDER BY h.created_at DESC
             LIMIT 1",
            [$pacienteId]
        )->fetch();

        if ($ultima) {
            return $ultima;
        }

        return [
            'id' => null,
            'paciente_id' => (int) $pacienteId,
            'fase_numero' => 1,
            'especialista_id' => null,
            'especialista_nombre' => null,
            'notas' => null,
            'created_at' => null,
        ];
    }

    public static function getHistorial($pacienteId) {
        $db = DatabaseService::getInstance();

        return $db->query(
            "SELECT h.*, u.nombre_completo AS especialista_nombre
             FROM " . self::$table . " h
             INNER JOIN usuarios u ON u.id = h.especialista_id
             WHERE h.paciente_id = ?
             ORDER BY h.created_at DESC",
            [$pacienteId]
        )->fetchAll();
    }

    public static function cambiarFase($pacienteId, $especialistaId, $faseNumero, $notas = null) {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO " . self::$table . " (paciente_id, fase_numero, especialista_id, notas, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [$pacienteId, $faseNumero, $especialistaId, $notas]
        );

        $id = $db->lastInsertId();

        return $db->query(
            "SELECT h.*, u.nombre_completo AS especialista_nombre
             FROM " . self::$table . " h
             INNER JOIN usuarios u ON u.id = h.especialista_id
             WHERE h.id = ?",
            [$id]
        )->fetch();
    }
}
