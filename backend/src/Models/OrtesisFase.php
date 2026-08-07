<?php
namespace App\Models;
use App\Services\DatabaseService;
use App\Services\NotificationService;

class OrtesisFase {
    private static $table = 'ortesis_fases_historial';

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

    public static function getEspecialistaAsignado($pacienteId) {
        $db = DatabaseService::getInstance();
        $asignacion = $db->query(
            "SELECT a.especialista_id
             FROM asignaciones_especialista a
             INNER JOIN areas_medicas am ON am.id = a.area_medica_id
             WHERE a.paciente_id = ? AND a.activo = 1
               AND (LOWER(am.nombre) LIKE '%ortesis%' OR LOWER(am.nombre) LIKE '%prótesis%' OR LOWER(am.nombre) LIKE '%protesis%')
             ORDER BY a.fecha_asignacion DESC
             LIMIT 1",
            [$pacienteId]
        )->fetch();

        return $asignacion ? (int) $asignacion['especialista_id'] : null;
    }

    public static function notificarCambio($pacienteId, $faseNumero) {
        $db = DatabaseService::getInstance();
        $paciente = $db->query("SELECT usuario_id FROM pacientes WHERE id = ?", [$pacienteId])->fetch();
        if (!$paciente) {
            return;
        }

        $nombreFase = ORTESIS_FASES[$faseNumero] ?? "Fase $faseNumero";

        $titulos = [
            1 => 'Iniciamos la valoración de tu caso',
            2 => 'Tu dispositivo está en cotización',
            3 => 'En espera de componentes',
            4 => 'Se tomaron tus medidas',
            5 => 'Tu dispositivo está en prueba y ajustes',
            6 => '¡Tu dispositivo está listo!',
            7 => 'Estás en seguimiento',
        ];

        $mensajes = [
            1 => 'Comenzamos la valoración de tu caso para determinar el dispositivo más adecuado para ti.',
            2 => 'Estamos cotizando los componentes necesarios para tu órtesis o prótesis.',
            3 => 'Ya se solicitaron los componentes de tu dispositivo, están en camino.',
            4 => 'Se realizó la toma de medidas o molde para la fabricación de tu dispositivo.',
            5 => 'Estamos probando y ajustando tu dispositivo para asegurar un uso cómodo y seguro.',
            6 => 'Tu órtesis o prótesis ha sido entregada. Recuerda seguir las indicaciones de uso y cuidado.',
            7 => 'Daremos seguimiento periódico al uso de tu dispositivo para asegurar tu bienestar.',
        ];

        (new NotificationService())->crear(
            $paciente['usuario_id'],
            NOTIF_ORTESIS_FASE,
            $titulos[$faseNumero] ?? 'Cambio de fase - Órtesis y Prótesis',
            $mensajes[$faseNumero] ?? "Tu fase de tratamiento en Órtesis y Prótesis cambió a: {$nombreFase}",
            ['fase_numero' => $faseNumero, 'fase_nombre' => $nombreFase],
            'ortesis_fase',
            $pacienteId
        );
    }
}
