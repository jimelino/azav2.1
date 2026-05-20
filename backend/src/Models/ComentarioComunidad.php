<?php
namespace App\Models;
use App\Services\DatabaseService;

class ComentarioComunidad {
    private static $table = 'comentarios_comunidad';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT c.*, u.nombre_completo as autor_nombre, u.nombre_anonimo
             FROM " . self::$table . " c
             LEFT JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.id = ?",
            [$id]
        )->fetch();
    }

    public static function getAll() {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT c.*, u.nombre_completo as autor_nombre
             FROM " . self::$table . " c
             LEFT JOIN usuarios u ON c.usuario_id = u.id
             ORDER BY c.created_at DESC"
        )->fetchAll();
    }

    public static function getByPublicacion($publicacionId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT c.*, u.nombre_completo as autor_nombre, u.nombre_anonimo
             FROM " . self::$table . " c
             LEFT JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.publicacion_id = ? AND c.estado = 'aprobado'
             ORDER BY c.created_at DESC",
            [$publicacionId]
        )->fetchAll();
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO " . self::$table . " (publicacion_id, usuario_id, contenido, es_anonimo, estado, created_at)
             VALUES (?, ?, ?, ?, 'aprobado', NOW())",
            [
                $data['publicacion_id'],
                $data['usuario_id'],
                $data['contenido'],
                $data['es_anonimo'] ?? 0
            ]
        );

        $id = $db->lastInsertId();

        // Actualizar contador de comentarios en la publicación
        $db->query(
            "UPDATE publicaciones_comunidad SET total_comentarios = total_comentarios + 1 WHERE id = ?",
            [$data['publicacion_id']]
        );

        return self::find($id);
    }

    public static function update($id, $data) {
        $db = DatabaseService::getInstance();

        $db->query(
            "UPDATE " . self::$table . " SET contenido = ? WHERE id = ?",
            [$data['contenido'], $id]
        );

        return true;
    }

    public static function delete($id) {
        $db = DatabaseService::getInstance();

        // Obtener publicacion_id antes de eliminar
        $comentario = self::find($id);
        if ($comentario) {
            $db->query("DELETE FROM " . self::$table . " WHERE id = ?", [$id]);
            // Decrementar contador
            $db->query(
                "UPDATE publicaciones_comunidad SET total_comentarios = GREATEST(0, total_comentarios - 1) WHERE id = ?",
                [$comentario['publicacion_id']]
            );
        }

        return true;
    }
}
