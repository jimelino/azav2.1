<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Services\DatabaseService;
use App\Utils\Response;

class NotificacionesController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    public function getMisNotificaciones()
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) {
            return Response::error('No autorizado', 401);
        }

        $notificaciones = $this->db->query(
            "SELECT id, tipo, titulo, mensaje, datos, leida, leida_en, referencia_tipo, referencia_id, created_at
             FROM notificaciones
             WHERE usuario_id = ?
             ORDER BY created_at DESC
             LIMIT 30",
            [$user['id']]
        )->fetchAll();

        $noLeidas = $this->db->query(
            "SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND leida = 0",
            [$user['id']]
        )->fetch();

        return Response::success([
            'notificaciones' => $notificaciones,
            'no_leidas' => (int) ($noLeidas['total'] ?? 0)
        ]);
    }

    public function marcarLeida($id)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) {
            return Response::error('No autorizado', 401);
        }

        $notificacion = $this->db->query(
            "SELECT id FROM notificaciones WHERE id = ? AND usuario_id = ?",
            [$id, $user['id']]
        )->fetch();

        if (!$notificacion) {
            return Response::error('Notificación no encontrada', 404);
        }

        $this->db->query(
            "UPDATE notificaciones SET leida = 1, leida_en = NOW() WHERE id = ?",
            [$id]
        );

        return Response::success(null, 'Notificación marcada como leída');
    }

    public function marcarTodasLeidas()
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) {
            return Response::error('No autorizado', 401);
        }

        $this->db->query(
            "UPDATE notificaciones SET leida = 1, leida_en = NOW() WHERE usuario_id = ? AND leida = 0",
            [$user['id']]
        );

        return Response::success(null, 'Notificaciones marcadas como leídas');
    }
}
