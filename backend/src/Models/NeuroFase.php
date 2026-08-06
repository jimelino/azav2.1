<?php
namespace App\Models;
use App\Services\DatabaseService;
use App\Services\NotificationService;

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

    /**
     * Especialista de Neuropsicología asignado activamente a este paciente,
     * o null si todavía no tiene ninguno. Se usa tanto para autorizar como
     * para resolver el especialista_id de un avance automático de fase
     * (donde quien dispara el cambio es el paciente, no un especialista).
     */
    public static function getEspecialistaAsignado($pacienteId) {
        $db = DatabaseService::getInstance();
        $asignacion = $db->query(
            "SELECT a.especialista_id
             FROM asignaciones_especialista a
             INNER JOIN areas_medicas am ON am.id = a.area_medica_id
             WHERE a.paciente_id = ? AND a.activo = 1 AND am.nombre = 'neuropsicologia'
             ORDER BY a.fecha_asignacion DESC
             LIMIT 1",
            [$pacienteId]
        )->fetch();

        return $asignacion ? (int) $asignacion['especialista_id'] : null;
    }

    /**
     * Avanza la fase solo si el paciente está exactamente en la fase
     * anterior (evita re-disparar en registros repetidos) y notifica al
     * paciente. Usado tanto por cambios manuales del especialista como por
     * avances automáticos al completar cuestionarios/evaluaciones.
     */
    public static function avanzarSiCorresponde($pacienteId, $especialistaId, $faseNumero, $notas = null) {
        if (!$especialistaId) {
            return null;
        }

        $actual = self::getActual($pacienteId);
        if ((int) $actual['fase_numero'] !== $faseNumero - 1) {
            return null;
        }

        $fase = self::cambiarFase($pacienteId, $especialistaId, $faseNumero, $notas);
        self::notificarCambio($pacienteId, $faseNumero);

        return $fase;
    }

    public static function notificarCambio($pacienteId, $faseNumero) {
        $db = DatabaseService::getInstance();

        $paciente = $db->query(
            "SELECT usuario_id FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();

        if (!$paciente) {
            return;
        }

        $nombreFase = NEURO_FASES[$faseNumero] ?? "Fase $faseNumero";

        $titulos = [
            1 => 'Bienvenido al Servicio de Neuropsicología',
            2 => 'Concluiste tu evaluación inicial',
            3 => 'Comenzaste tu intervención neuropsicológica',
            4 => '¡Concluiste tu proceso en Neuropsicología!',
        ];

        $mensajes = [
            1 => 'Enhorabuena, usted ingresó al Servicio de Neuropsicología. En este servicio tenemos cuatro etapas. En breve programaremos su evaluación.',
            2 => 'Usted concluyó la evaluación inicial del Servicio de Neuropsicología.',
            3 => 'Usted comenzó la intervención neuropsicológica. Tendrá sesiones periódicas de entrenamiento mental hasta su alta.',
            4 => 'Felicidades, usted ha concluido su entrenamiento mental con el Servicio de Neuropsicología. Recuerde practicar las habilidades aprendidas; con gusto puede agendar una sesión de seguimiento.',
        ];

        (new NotificationService())->crear(
            $paciente['usuario_id'],
            NOTIF_NEURO_FASE,
            $titulos[$faseNumero] ?? 'Cambio de fase - Neuropsicología',
            $mensajes[$faseNumero] ?? "Tu fase de tratamiento en Neuropsicología cambió a: {$nombreFase}",
            ['fase_numero' => $faseNumero, 'fase_nombre' => $nombreFase],
            'neuro_fase',
            $pacienteId
        );
    }
}
