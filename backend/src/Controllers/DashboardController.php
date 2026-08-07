<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;

class DashboardController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    public function getResumen($userId)
    {
        // Obtener usuario
        $user = $this->db->query(
            "SELECT * FROM usuarios WHERE id = ?",
            [$userId]
        )->fetch();

        if (!$user) {
            return Response::error('Usuario no encontrado', 404);
        }

        // Si es paciente, obtener paciente_id
        $pacienteId = null;
        if ($user['rol_id'] == 3) {
            $paciente = $this->db->query(
                "SELECT id FROM pacientes WHERE usuario_id = ?",
                [$userId]
            )->fetch();
            $pacienteId = $paciente ? $paciente['id'] : null;
        }

        // Citas próximas (próximos 7 días)
        $citasProximas = 0;
        if ($pacienteId) {
            $citas = $this->db->query(
                "SELECT COUNT(*) as total FROM citas
                 WHERE paciente_id = ?
                 AND fecha >= CURDATE()
                 AND fecha <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                 AND estado IN ('programada', 'confirmada')",
                [$pacienteId]
            )->fetch();
            $citasProximas = $citas['total'] ?? 0;
        }

        // Recordatorios de hoy
        $diaActual = strtolower(date('l'));
        $diasMap = [
            'monday' => 'lunes', 'tuesday' => 'martes', 'wednesday' => 'miercoles',
            'thursday' => 'jueves', 'friday' => 'viernes', 'saturday' => 'sabado', 'sunday' => 'domingo'
        ];
        $diaSemana = $diasMap[$diaActual] ?? $diaActual;

        $recordatoriosHoy = $this->db->query(
            "SELECT COUNT(*) as total FROM recordatorios
             WHERE usuario_id = ? AND activo = 1
             AND JSON_CONTAINS(dias_semana, ?)",
            [$userId, '"' . $diaSemana . '"']
        )->fetch();

        // Ejercicios pendientes (videos asignados)
        $ejerciciosPendientes = 0;
        if ($pacienteId) {
            $ejercicios = $this->db->query(
                "SELECT COUNT(*) as total FROM videos_asignados
                 WHERE paciente_id = ? AND activo = 1",
                [$pacienteId]
            )->fetch();
            $ejerciciosPendientes = $ejercicios['total'] ?? 0;
        }

        // Mensajes no leídos (mensajes en conversaciones donde el usuario participa, que no fueron enviados por él)
        // Usa participante_1_id/participante_2_id (no el JOIN viejo contra pacientes) para
        // que también cuente conversaciones especialista<->especialista, que no tienen paciente_id.
        $mensajesNoLeidos = $this->db->query(
            "SELECT COUNT(*) as total FROM mensajes_chat mc
             INNER JOIN conversaciones c ON mc.conversacion_id = c.id
             WHERE mc.leido = 0
             AND mc.remitente_id != ?
             AND (c.participante_1_id = ? OR c.participante_2_id = ?)",
            [$userId, $userId, $userId]
        )->fetch();

        return Response::success([
            'citas_proximas' => (int)$citasProximas,
            'recordatorios_hoy' => (int)($recordatoriosHoy['total'] ?? 0),
            'ejercicios_pendientes' => (int)$ejerciciosPendientes,
            'mensajes_no_leidos' => (int)($mensajesNoLeidos['total'] ?? 0)
        ]);
    }
}
