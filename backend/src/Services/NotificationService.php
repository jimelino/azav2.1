<?php
namespace App\Services;

class NotificationService {
    /**
     * Crea una notificación persistente para un usuario. Columnas reales de
     * la tabla `notificaciones`: usuario_id, leida (NO user_id/leido).
     */
    public function crear($usuarioId, $tipo, $titulo, $mensaje, $datos = [], $referenciaTipo = null, $referenciaId = null) {
        $db = DatabaseService::getInstance();
        $db->query(
            "INSERT INTO notificaciones
                (usuario_id, tipo, titulo, mensaje, datos, leida, referencia_tipo, referencia_id, created_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())",
            [
                $usuarioId,
                $tipo,
                $titulo,
                $mensaje,
                !empty($datos) ? json_encode($datos) : null,
                $referenciaTipo,
                $referenciaId
            ]
        );
        return $db->lastInsertId();
    }

    public function markAsRead($notificationId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "UPDATE notificaciones SET leida = 1, leida_en = NOW() WHERE id = ?",
            [$notificationId]
        );
    }
}
