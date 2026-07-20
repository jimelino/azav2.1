<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;

class MensajesController
{
    private $db;
    private $usaChatUniversal = null;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    private function soportaChatUniversal()
    {
        if ($this->usaChatUniversal !== null) {
            return $this->usaChatUniversal;
        }

        try {
            $columna = $this->db->query("SHOW COLUMNS FROM conversaciones LIKE 'participante_1_id'")->fetch();
            $this->usaChatUniversal = (bool)$columna;
        } catch (\Exception $e) {
            $this->usaChatUniversal = false;
        }

        return $this->usaChatUniversal;
    }

    private function getUsuario($usuarioId)
    {
        return $this->db->query(
            "SELECT id, nombre_completo, rol_id FROM usuarios WHERE id = ?",
            [$usuarioId]
        )->fetch();
    }

    private function getPacienteIdPorUsuario($usuarioId)
    {
        $paciente = $this->db->query(
            "SELECT id FROM pacientes WHERE usuario_id = ?",
            [$usuarioId]
        )->fetch();

        return $paciente['id'] ?? null;
    }

    private function getTipoConversacion($usuarioA, $usuarioB)
    {
        $roles = [(int)$usuarioA['rol_id'], (int)$usuarioB['rol_id']];

        if (in_array(3, $roles, true) && in_array(2, $roles, true)) {
            return 'paciente_especialista';
        }

        if ((int)$usuarioA['rol_id'] === 2 && (int)$usuarioB['rol_id'] === 2) {
            return 'especialista_especialista';
        }

        return null;
    }

    private function ordenarParticipantes($usuarioId, $otroUsuarioId)
    {
        $participantes = [(int)$usuarioId, (int)$otroUsuarioId];
        sort($participantes, SORT_NUMERIC);
        return $participantes;
    }

    private function getDatosCompatibles($usuarioA, $usuarioB, $tipo)
    {
        if ($tipo === 'especialista_especialista') {
            return [null, null];
        }

        $pacienteUsuarioId = (int)$usuarioA['rol_id'] === 3 ? $usuarioA['id'] : $usuarioB['id'];
        $especialistaId = (int)$usuarioA['rol_id'] === 2 ? $usuarioA['id'] : $usuarioB['id'];

        return [$this->getPacienteIdPorUsuario($pacienteUsuarioId), $especialistaId];
    }

    public function getConversaciones($usuarioId)
    {
        if (!$this->soportaChatUniversal()) {
            return $this->getConversacionesLegacy($usuarioId);
        }

        $usuario = $this->getUsuario($usuarioId);
        if (!$usuario) {
            return Response::error('Usuario no encontrado', 404);
        }

        $conversaciones = $this->db->query(
            "SELECT
                c.id,
                c.tipo,
                c.created_at,
                CASE WHEN c.participante_1_id = ? THEN c.participante_2_id ELSE c.participante_1_id END AS otro_usuario_id,
                u.nombre_completo AS otro_usuario_nombre,
                u.rol_id AS otro_usuario_rol,
                (SELECT contenido FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje,
                (SELECT created_at FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje_fecha,
                (SELECT COUNT(*) FROM mensajes_chat m WHERE m.conversacion_id = c.id AND m.remitente_id != ? AND m.leido = 0) AS no_leidos
             FROM conversaciones c
             INNER JOIN usuarios u ON u.id = CASE WHEN c.participante_1_id = ? THEN c.participante_2_id ELSE c.participante_1_id END
             WHERE c.participante_1_id = ? OR c.participante_2_id = ?
             ORDER BY COALESCE(ultimo_mensaje_fecha, c.created_at) DESC",
            [$usuarioId, $usuarioId, $usuarioId, $usuarioId, $usuarioId]
        )->fetchAll();

        return Response::success(['conversaciones' => $conversaciones]);
    }

    public function getMensajes($conversacionId, $usuarioId)
    {
        if (!$this->soportaChatUniversal()) {
            return $this->getMensajesLegacy($conversacionId, $usuarioId);
        }

        $conversacion = $this->db->query(
            "SELECT *
             FROM conversaciones
             WHERE id = ? AND (participante_1_id = ? OR participante_2_id = ?)",
            [$conversacionId, $usuarioId, $usuarioId]
        )->fetch();

        if (!$conversacion) {
            return Response::error('No tienes acceso a esta conversacion', 403);
        }

        $otroUsuarioId = (int)$conversacion['participante_1_id'] === (int)$usuarioId
            ? $conversacion['participante_2_id']
            : $conversacion['participante_1_id'];

        $this->db->query(
            "UPDATE mensajes_chat SET leido = 1, leido_at = NOW() WHERE conversacion_id = ? AND remitente_id != ?",
            [$conversacionId, $usuarioId]
        );

        $mensajes = $this->db->query(
            "SELECT m.id, m.remitente_id AS emisor_id, m.contenido AS mensaje, m.leido, m.created_at,
                    u.nombre_completo AS emisor_nombre
             FROM mensajes_chat m
             INNER JOIN usuarios u ON m.remitente_id = u.id
             WHERE m.conversacion_id = ?
             ORDER BY m.created_at ASC",
            [$conversacionId]
        )->fetchAll();

        return Response::success([
            'conversacion' => $conversacion,
            'mensajes' => $mensajes,
            'otro_usuario' => $this->getUsuario($otroUsuarioId)
        ]);
    }

    public function enviarMensaje($data)
    {
        if (!$this->soportaChatUniversal()) {
            return $this->enviarMensajeLegacy($data);
        }

        if (empty($data['receptor_id']) || empty($data['mensaje']) || empty($data['emisor_id'])) {
            return Response::error('Faltan datos requeridos', 422);
        }

        $emisor = $this->getUsuario($data['emisor_id']);
        $receptor = $this->getUsuario($data['receptor_id']);

        if (!$emisor || !$receptor) {
            return Response::error('Usuario no encontrado', 404);
        }

        $tipo = $this->getTipoConversacion($emisor, $receptor);
        if (!$tipo) {
            return Response::error('Tipo de conversacion no permitido para estos roles', 422);
        }

        $conversacionId = $this->obtenerOCrearConversacionUniversal($emisor, $receptor, $tipo);
        $expiraEn = date('Y-m-d H:i:s', strtotime('+24 hours'));

        $this->db->query(
            "INSERT INTO mensajes_chat (conversacion_id, remitente_id, contenido, leido, expira_en, created_at)
             VALUES (?, ?, ?, 0, ?, NOW())",
            [$conversacionId, $emisor['id'], trim($data['mensaje']), $expiraEn]
        );

        $mensajeId = $this->db->lastInsertId();

        $this->db->query(
            "UPDATE conversaciones SET ultimo_mensaje_at = NOW() WHERE id = ?",
            [$conversacionId]
        );

        return Response::success([
            'id' => $mensajeId,
            'conversacion_id' => $conversacionId
        ], 'Mensaje enviado', 201);
    }

    public function getNoLeidos($usuarioId)
    {
        if (!$this->soportaChatUniversal()) {
            return $this->getNoLeidosLegacy($usuarioId);
        }

        $result = $this->db->query(
            "SELECT COUNT(*) AS total
             FROM mensajes_chat m
             INNER JOIN conversaciones c ON c.id = m.conversacion_id
             WHERE m.remitente_id != ? AND m.leido = 0
               AND (c.participante_1_id = ? OR c.participante_2_id = ?)",
            [$usuarioId, $usuarioId, $usuarioId]
        )->fetch();

        return Response::success(['total' => (int)($result['total'] ?? 0)]);
    }

    public function iniciarConversacion($usuarioId, $otroUsuarioId)
    {
        if (!$this->soportaChatUniversal()) {
            return $this->iniciarConversacionLegacy($usuarioId, $otroUsuarioId);
        }

        $usuario = $this->getUsuario($usuarioId);
        $otroUsuario = $this->getUsuario($otroUsuarioId);

        if (!$usuario || !$otroUsuario) {
            return Response::error('Usuario no encontrado', 404);
        }

        $tipo = $this->getTipoConversacion($usuario, $otroUsuario);
        if (!$tipo) {
            return Response::error('Tipo de conversacion no permitido para estos roles', 422);
        }

        $conversacionId = $this->obtenerOCrearConversacionUniversal($usuario, $otroUsuario, $tipo);

        return Response::success([
            'conversacion_id' => $conversacionId,
            'tipo' => $tipo,
            'otro_usuario' => $otroUsuario
        ]);
    }

    public function getContactos($usuarioId)
    {
        $usuario = $this->getUsuario($usuarioId);
        if (!$usuario) {
            return Response::error('Usuario no encontrado', 404);
        }

        $email = trim($_GET['email'] ?? '');
        $emailLike = '%' . $email . '%';

        if ((int)$usuario['rol_id'] === 3) {
            $pacienteId = $this->getPacienteIdPorUsuario($usuarioId);
            $contactos = $pacienteId ? $this->db->query(
                "SELECT u.id, u.nombre_completo AS nombre, u.email
                 FROM asignaciones_especialista ae
                 INNER JOIN usuarios u ON ae.especialista_id = u.id
                 LEFT JOIN areas_medicas am ON ae.area_medica_id = am.id
                 WHERE ae.paciente_id = ? AND ae.activo = 1 AND u.activo = 1
                   AND (? = '' OR u.email LIKE ?)
                 ORDER BY am.nombre, u.nombre_completo
                 LIMIT 30",
                [$pacienteId, $email, $emailLike]
            )->fetchAll() : [];

            return Response::success(['contactos' => $contactos]);
        }

        if ((int)$usuario['rol_id'] === 2) {
            $contactos = $this->db->query(
                "SELECT DISTINCT u.id, u.nombre_completo AS nombre, u.email
                 FROM usuarios u
                 WHERE u.activo = 1
                   AND u.id != ?
                   AND u.rol_id IN (2, 3)
                   AND (? = '' OR u.email LIKE ?)
                 ORDER BY
                   CASE WHEN u.rol_id = 2 THEN 0 ELSE 1 END,
                   u.nombre_completo
                 LIMIT 30",
                [$usuarioId, $email, $emailLike]
            )->fetchAll();

            return Response::success(['contactos' => $contactos]);
        }

        return Response::success(['contactos' => []]);
    }

    private function obtenerOCrearConversacionUniversal($usuario, $otroUsuario, $tipo)
    {
        [$participante1, $participante2] = $this->ordenarParticipantes($usuario['id'], $otroUsuario['id']);

        $conversacion = $this->db->query(
            "SELECT id FROM conversaciones
             WHERE tipo = ? AND participante_1_id = ? AND participante_2_id = ?",
            [$tipo, $participante1, $participante2]
        )->fetch();

        if ($conversacion) {
            return $conversacion['id'];
        }

        [$pacienteId, $especialistaId] = $this->getDatosCompatibles($usuario, $otroUsuario, $tipo);
        if ($tipo === 'paciente_especialista' && !$pacienteId) {
            Response::error('No se pudo determinar el paciente', 422);
        }

        $this->db->query(
            "INSERT INTO conversaciones
                (tipo, participante_1_id, participante_2_id, paciente_id, especialista_id, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())",
            [$tipo, $participante1, $participante2, $pacienteId, $especialistaId]
        );

        return $this->db->lastInsertId();
    }

    private function getConversacionesLegacy($usuarioId)
    {
        $usuario = $this->db->query(
            "SELECT id, rol_id FROM usuarios WHERE id = ?",
            [$usuarioId]
        )->fetch();

        if (!$usuario) {
            return Response::error('Usuario no encontrado', 404);
        }

        $conversaciones = [];

        if ($usuario['rol_id'] == 3) {
            $paciente = $this->db->query(
                "SELECT id FROM pacientes WHERE usuario_id = ?",
                [$usuarioId]
            )->fetch();

            if ($paciente) {
                $conversaciones = $this->db->query(
                    "SELECT
                        c.id,
                        'paciente_especialista' AS tipo,
                        c.created_at,
                        c.especialista_id AS otro_usuario_id,
                        u.nombre_completo AS otro_usuario_nombre,
                        u.rol_id AS otro_usuario_rol,
                        (SELECT contenido FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje,
                        (SELECT created_at FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje_fecha,
                        (SELECT COUNT(*) FROM mensajes_chat m WHERE m.conversacion_id = c.id AND m.remitente_id != ? AND m.leido = 0) AS no_leidos
                     FROM conversaciones c
                     INNER JOIN usuarios u ON u.id = c.especialista_id
                     WHERE c.paciente_id = ?
                     ORDER BY ultimo_mensaje_fecha DESC",
                    [$usuarioId, $paciente['id']]
                )->fetchAll();
            }
        } else {
            $conversaciones = $this->db->query(
                "SELECT
                    c.id,
                    'paciente_especialista' AS tipo,
                    c.created_at,
                    p.usuario_id AS otro_usuario_id,
                    u.nombre_completo AS otro_usuario_nombre,
                    u.rol_id AS otro_usuario_rol,
                    (SELECT contenido FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje,
                    (SELECT created_at FROM mensajes_chat m WHERE m.conversacion_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS ultimo_mensaje_fecha,
                    (SELECT COUNT(*) FROM mensajes_chat m WHERE m.conversacion_id = c.id AND m.remitente_id != ? AND m.leido = 0) AS no_leidos
                 FROM conversaciones c
                 INNER JOIN pacientes p ON p.id = c.paciente_id
                 INNER JOIN usuarios u ON u.id = p.usuario_id
                 WHERE c.especialista_id = ?
                 ORDER BY ultimo_mensaje_fecha DESC",
                [$usuarioId, $usuarioId]
            )->fetchAll();
        }

        return Response::success(['conversaciones' => $conversaciones]);
    }

    private function getMensajesLegacy($conversacionId, $usuarioId)
    {
        $usuario = $this->db->query(
            "SELECT id, rol_id FROM usuarios WHERE id = ?",
            [$usuarioId]
        )->fetch();

        $conversacion = null;

        if ($usuario['rol_id'] == 3) {
            $paciente = $this->db->query(
                "SELECT id FROM pacientes WHERE usuario_id = ?",
                [$usuarioId]
            )->fetch();

            if ($paciente) {
                $conversacion = $this->db->query(
                    "SELECT c.*, p.usuario_id AS paciente_usuario_id
                     FROM conversaciones c
                     INNER JOIN pacientes p ON p.id = c.paciente_id
                     WHERE c.id = ? AND c.paciente_id = ?",
                    [$conversacionId, $paciente['id']]
                )->fetch();
            }
        } else {
            $conversacion = $this->db->query(
                "SELECT c.*, p.usuario_id AS paciente_usuario_id
                 FROM conversaciones c
                 INNER JOIN pacientes p ON p.id = c.paciente_id
                 WHERE c.id = ? AND c.especialista_id = ?",
                [$conversacionId, $usuarioId]
            )->fetch();
        }

        if (!$conversacion) {
            return Response::error('No tienes acceso a esta conversacion', 403);
        }

        $this->db->query(
            "UPDATE mensajes_chat SET leido = 1, leido_at = NOW() WHERE conversacion_id = ? AND remitente_id != ?",
            [$conversacionId, $usuarioId]
        );

        $mensajes = $this->db->query(
            "SELECT m.id, m.remitente_id AS emisor_id, m.contenido AS mensaje, m.leido, m.created_at,
                    u.nombre_completo AS emisor_nombre
             FROM mensajes_chat m
             INNER JOIN usuarios u ON m.remitente_id = u.id
             WHERE m.conversacion_id = ?
             ORDER BY m.created_at ASC",
            [$conversacionId]
        )->fetchAll();

        $otroUsuarioId = $usuario['rol_id'] == 3
            ? $conversacion['especialista_id']
            : $conversacion['paciente_usuario_id'];

        return Response::success([
            'conversacion' => $conversacion,
            'mensajes' => $mensajes,
            'otro_usuario' => $this->getUsuario($otroUsuarioId)
        ]);
    }

    private function enviarMensajeLegacy($data)
    {
        if (empty($data['receptor_id']) || empty($data['mensaje']) || empty($data['emisor_id'])) {
            return Response::error('Faltan datos requeridos', 422);
        }

        $emisorId = $data['emisor_id'];
        $receptorId = $data['receptor_id'];
        $mensaje = trim($data['mensaje']);

        $emisor = $this->db->query(
            "SELECT id, rol_id FROM usuarios WHERE id = ?",
            [$emisorId]
        )->fetch();

        $receptor = $this->db->query(
            "SELECT id, rol_id FROM usuarios WHERE id = ?",
            [$receptorId]
        )->fetch();

        if (!$emisor || !$receptor) {
            return Response::error('Usuario no encontrado', 404);
        }

        $pacienteId = null;
        $especialistaId = null;

        if ($emisor['rol_id'] == 3) {
            $pacienteId = $this->getPacienteIdPorUsuario($emisorId);
            $especialistaId = $receptorId;
        } else {
            $pacienteId = $this->getPacienteIdPorUsuario($receptorId);
            $especialistaId = $emisorId;
        }

        if (!$pacienteId) {
            return Response::error('No se pudo determinar el paciente', 422);
        }

        $conversacion = $this->db->query(
            "SELECT id FROM conversaciones WHERE paciente_id = ? AND especialista_id = ?",
            [$pacienteId, $especialistaId]
        )->fetch();

        if (!$conversacion) {
            $this->db->query(
                "INSERT INTO conversaciones (paciente_id, especialista_id, created_at) VALUES (?, ?, NOW())",
                [$pacienteId, $especialistaId]
            );
            $conversacionId = $this->db->lastInsertId();
        } else {
            $conversacionId = $conversacion['id'];
        }

        $expiraEn = date('Y-m-d H:i:s', strtotime('+24 hours'));

        $this->db->query(
            "INSERT INTO mensajes_chat (conversacion_id, remitente_id, contenido, leido, expira_en, created_at)
             VALUES (?, ?, ?, 0, ?, NOW())",
            [$conversacionId, $emisorId, $mensaje, $expiraEn]
        );

        $mensajeId = $this->db->lastInsertId();

        $this->db->query(
            "UPDATE conversaciones SET ultimo_mensaje_at = NOW() WHERE id = ?",
            [$conversacionId]
        );

        return Response::success([
            'id' => $mensajeId,
            'conversacion_id' => $conversacionId
        ], 'Mensaje enviado', 201);
    }

    private function getNoLeidosLegacy($usuarioId)
    {
        $result = $this->db->query(
            "SELECT COUNT(*) AS total FROM mensajes_chat WHERE remitente_id != ? AND leido = 0
             AND conversacion_id IN (
                SELECT c.id FROM conversaciones c
                INNER JOIN pacientes p ON p.id = c.paciente_id
                WHERE c.especialista_id = ? OR p.usuario_id = ?
             )",
            [$usuarioId, $usuarioId, $usuarioId]
        )->fetch();

        return Response::success(['total' => (int)($result['total'] ?? 0)]);
    }

    private function iniciarConversacionLegacy($usuarioId, $otroUsuarioId)
    {
        $otroUsuario = $this->getUsuario($otroUsuarioId);
        $usuario = $this->getUsuario($usuarioId);

        if (!$otroUsuario || !$usuario) {
            return Response::error('Usuario no encontrado', 404);
        }

        $pacienteId = null;
        $especialistaId = null;

        if ($usuario['rol_id'] == 3) {
            $pacienteId = $this->getPacienteIdPorUsuario($usuarioId);
            $especialistaId = $otroUsuarioId;
        } else {
            $pacienteId = $this->getPacienteIdPorUsuario($otroUsuarioId);
            $especialistaId = $usuarioId;
        }

        if (!$pacienteId) {
            return Response::error('No se pudo determinar el paciente. Aplica la migracion de chat universal para conversaciones especialista-especialista.', 422);
        }

        $conversacion = $this->db->query(
            "SELECT id FROM conversaciones WHERE paciente_id = ? AND especialista_id = ?",
            [$pacienteId, $especialistaId]
        )->fetch();

        if (!$conversacion) {
            $this->db->query(
                "INSERT INTO conversaciones (paciente_id, especialista_id, created_at) VALUES (?, ?, NOW())",
                [$pacienteId, $especialistaId]
            );
            $conversacionId = $this->db->lastInsertId();
        } else {
            $conversacionId = $conversacion['id'];
        }

        return Response::success([
            'conversacion_id' => $conversacionId,
            'tipo' => 'paciente_especialista',
            'otro_usuario' => $otroUsuario
        ]);
    }
}
