<?php
namespace App\Models;
use App\Services\DatabaseService;

class Publicacion {
    private static $table = 'publicaciones_comunidad';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.*, u.nombre_completo as autor_nombre, t.nombre as tema_nombre, t.icono as tema_icono
             FROM " . self::$table . " p
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN temas_comunidad t ON p.tema_id = t.id
             WHERE p.id = ?",
            [$id]
        )->fetch();
    }

    public static function getAll() {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.*, u.nombre_completo as autor_nombre, t.nombre as tema_nombre
             FROM " . self::$table . " p
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN temas_comunidad t ON p.tema_id = t.id
             WHERE p.estado = 'aprobada'
             ORDER BY p.created_at DESC"
        )->fetchAll();
    }

    public static function getFeed($userId, $filters = []) {
        $db = DatabaseService::getInstance();

        $query = "SELECT p.*, u.nombre_completo as autor_nombre, t.nombre as tema_nombre, t.icono as tema_icono,
                         (SELECT tr.nombre FROM reacciones_publicacion r
                          LEFT JOIN tipos_reaccion tr ON r.tipo_reaccion_id = tr.id
                          WHERE r.publicacion_id = p.id AND r.usuario_id = ? LIMIT 1) AS mi_reaccion
                  FROM " . self::$table . " p
                  LEFT JOIN usuarios u ON p.usuario_id = u.id
                  LEFT JOIN temas_comunidad t ON p.tema_id = t.id
                  WHERE p.estado = 'aprobada'";
        $params = [$userId];

        if (!empty($filters['tema_id'])) {
            $query .= " AND p.tema_id = ?";
            $params[] = $filters['tema_id'];
        }

        $query .= " ORDER BY p.destacada DESC, p.created_at DESC LIMIT 50";

        return $db->query($query, $params)->fetchAll();
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        // Mapear estado: la constante dice 'aprobado' pero la tabla espera 'aprobada'
        $estado = $data['estado'] ?? 'aprobada';
        if ($estado === 'aprobado') $estado = 'aprobada';
        if ($estado === 'rechazado') $estado = 'rechazada';

        $db->query(
            "INSERT INTO " . self::$table . " (usuario_id, tema_id, titulo, contenido, imagen_url, es_anonimo, estado, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $data['usuario_id'],
                $data['tema_id'] ?? 9,
                $data['titulo'] ?? null,
                $data['contenido'],
                $data['imagen'] ?? null,
                $data['es_anonimo'] ?? 0,
                $estado
            ]
        );

        $id = $db->lastInsertId();
        return self::find($id);
    }

    public static function update($id, $data) {
        $db = DatabaseService::getInstance();

        $fields = [];
        $values = [];

        $allowedFields = ['titulo', 'contenido', 'tema_id', 'es_anonimo'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $values[] = $id;
        $query = "UPDATE " . self::$table . " SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?";

        return $db->query($query, $values);
    }

    public static function delete($id) {
        $db = DatabaseService::getInstance();
        return $db->query("DELETE FROM " . self::$table . " WHERE id = ?", [$id]);
    }

    public static function getByUsuario($usuarioId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.*, t.nombre as tema_nombre, t.icono as tema_icono
             FROM " . self::$table . " p
             LEFT JOIN temas_comunidad t ON p.tema_id = t.id
             WHERE p.usuario_id = ?
             ORDER BY p.created_at DESC",
            [$usuarioId]
        )->fetchAll();
    }

    public static function getByTema($temaId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.*, u.nombre_completo as autor_nombre
             FROM " . self::$table . " p
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.tema_id = ? AND p.estado = 'aprobada'
             ORDER BY p.created_at DESC",
            [$temaId]
        )->fetchAll();
    }

    public static function getPendientes() {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT p.*, u.nombre_completo as autor_nombre
             FROM " . self::$table . " p
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.estado = 'pendiente'
             ORDER BY p.created_at ASC"
        )->fetchAll();
    }

    public static function approve($id) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "UPDATE " . self::$table . " SET estado = 'aprobada', moderado_en = NOW() WHERE id = ?",
            [$id]
        );
    }

    public static function reject($id, $motivo = null) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "UPDATE " . self::$table . " SET estado = 'rechazada', motivo_rechazo = ?, moderado_en = NOW() WHERE id = ?",
            [$motivo, $id]
        );
    }
}
