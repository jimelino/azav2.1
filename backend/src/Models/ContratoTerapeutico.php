<?php
namespace App\Models;
use App\Services\DatabaseService;

class ContratoTerapeutico {
    private static $table = 'neuro_contratos_terapeuticos';

    public static function crear($pacienteId, $especialistaId, $archivoUrl) {
        $db = DatabaseService::getInstance();
        $db->query(
            "INSERT INTO " . self::$table . " (paciente_id, especialista_id, archivo_url, created_at) VALUES (?, ?, ?, NOW())",
            [$pacienteId, $especialistaId, $archivoUrl]
        );
        return self::getActual($pacienteId);
    }

    /**
     * Contrato vigente = fila más reciente para el paciente, o null si
     * todavía no le han subido ninguno.
     */
    public static function getActual($pacienteId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT c.*, u.nombre_completo AS especialista_nombre
             FROM " . self::$table . " c
             INNER JOIN usuarios u ON u.id = c.especialista_id
             WHERE c.paciente_id = ?
             ORDER BY c.created_at DESC
             LIMIT 1",
            [$pacienteId]
        )->fetch();
    }
}
