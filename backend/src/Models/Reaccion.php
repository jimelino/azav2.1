<?php
namespace App\Models;
use App\Services\DatabaseService;

class Reaccion {
    private static $table = 'reacciones_publicacion';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT * FROM " . self::$table . " WHERE id = ?", [$id])->fetch();
    }

    public static function getAll() {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT * FROM " . self::$table . " ORDER BY created_at DESC")->fetchAll();
    }

    public static function getByPublicacion($publicacionId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT r.*, tr.nombre, tr.emoji, u.nombre_completo as usuario_nombre
             FROM " . self::$table . " r
             LEFT JOIN tipos_reaccion tr ON r.tipo_reaccion_id = tr.id
             LEFT JOIN usuarios u ON r.usuario_id = u.id
             WHERE r.publicacion_id = ?",
            [$publicacionId]
        )->fetchAll();
    }

    public static function toggle($data) {
        $db = DatabaseService::getInstance();

        // Mapear nombre de reaccion a ID (soportar ambos conjuntos de nombres)
        $tiposMap = [
            'me_gusta' => 1,
            'me_inspira' => 2,
            'me_identifico' => 3,
            'me_motiva' => 4,
            'apoyo' => 5,
            'gracias' => 5,
            'celebrar' => 4
        ];
        $tipoReaccionId = $tiposMap[$data['tipo_reaccion']] ?? 1;

        // Verificar si ya existe la reacción
        $existing = $db->query(
            "SELECT id FROM " . self::$table . " WHERE publicacion_id = ? AND usuario_id = ?",
            [$data['publicacion_id'], $data['usuario_id']]
        )->fetch();

        if ($existing) {
            // Quitar reacción
            $db->query(
                "DELETE FROM " . self::$table . " WHERE publicacion_id = ? AND usuario_id = ?",
                [$data['publicacion_id'], $data['usuario_id']]
            );
            // Decrementar contador
            $db->query(
                "UPDATE publicaciones_comunidad SET total_reacciones = GREATEST(0, total_reacciones - 1) WHERE id = ?",
                [$data['publicacion_id']]
            );
            return ['reacted' => false];
        } else {
            // Agregar reacción
            $db->query(
                "INSERT INTO " . self::$table . " (publicacion_id, usuario_id, tipo_reaccion_id, created_at) VALUES (?, ?, ?, NOW())",
                [$data['publicacion_id'], $data['usuario_id'], $tipoReaccionId]
            );
            // Incrementar contador
            $db->query(
                "UPDATE publicaciones_comunidad SET total_reacciones = total_reacciones + 1 WHERE id = ?",
                [$data['publicacion_id']]
            );
            return ['reacted' => true, 'tipo' => $data['tipo_reaccion']];
        }
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO " . self::$table . " (publicacion_id, usuario_id, tipo_reaccion_id, created_at) VALUES (?, ?, ?, NOW())",
            [$data['publicacion_id'], $data['usuario_id'], $data['tipo_reaccion_id']]
        );

        return $db->lastInsertId();
    }

    public static function delete($id) {
        $db = DatabaseService::getInstance();
        return $db->query("DELETE FROM " . self::$table . " WHERE id = ?", [$id]);
    }
}
