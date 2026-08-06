<?php
namespace App\Models;
use App\Services\DatabaseService;

class Video {
    private static $table = 'videos_ejercicios';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT v.*, n.nombre as nivel_nombre, c.nombre as categoria_nombre
             FROM " . self::$table . " v
             LEFT JOIN niveles_ejercicio n ON v.nivel_id = n.id
             LEFT JOIN categorias_ejercicio c ON v.categoria_id = c.id
             WHERE v.id = ?",
            [$id]
        )->fetch();
    }

    public static function getAll($fase = null) {
        $db = DatabaseService::getInstance();

        $query = "SELECT v.*, n.nombre as nivel_nombre, c.nombre as categoria_nombre
                  FROM " . self::$table . " v
                  LEFT JOIN niveles_ejercicio n ON v.nivel_id = n.id
                  LEFT JOIN categorias_ejercicio c ON v.categoria_id = c.id
                  WHERE v.publicado = 1";

        $params = [];

        if ($fase) {
            $query .= " AND v.nivel_id = ?";
            $params[] = $fase;
        }

        $query .= " ORDER BY v.created_at DESC";

        return $db->query($query, $params)->fetchAll();
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO " . self::$table . "
             (titulo, descripcion, youtube_url, youtube_video_id, duracion_minutos,
              nivel_id, categoria_id, instrucciones, precauciones, creado_por, publicado, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())",
            [
                $data['titulo'],
                $data['descripcion'] ?? null,
                $data['youtube_url'] ?? $data['url'],
                $data['youtube_video_id'] ?? self::extractYoutubeId($data['url'] ?? ''),
                $data['duracion_minutos'] ?? 5,
                $data['nivel_id'] ?? $data['fase'] ?? 1,
                $data['categoria_id'] ?? 1,
                $data['instrucciones'] ?? null,
                $data['precauciones'] ?? null,
                $data['creado_por'] ?? null
            ]
        );

        return $db->lastInsertId();
    }

    public static function update($id, $data) {
        $db = DatabaseService::getInstance();

        $fields = [];
        $values = [];

        $allowedFields = ['titulo', 'descripcion', 'youtube_url', 'duracion_minutos',
                         'nivel_id', 'categoria_id', 'instrucciones', 'precauciones', 'publicado'];

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

    public static function getAsignados($pacienteId, $fecha = null) {
        $db = DatabaseService::getInstance();
        $fecha = $fecha ?? date('Y-m-d');
        return $db->query(
            "SELECT v.*, va.frecuencia_recomendada, va.repeticiones, va.notas as nota_asignacion,
                    n.nombre as nivel_nombre, c.nombre as categoria_nombre,
                    COALESCE(rv.completado, 0) as completado
             FROM videos_asignados va
             JOIN " . self::$table . " v ON va.video_id = v.id
             LEFT JOIN niveles_ejercicio n ON v.nivel_id = n.id
             LEFT JOIN categorias_ejercicio c ON v.categoria_id = c.id
             LEFT JOIN registro_videos rv ON rv.paciente_id = va.paciente_id
                    AND rv.video_id = va.video_id AND rv.fecha = ?
             WHERE va.paciente_id = ? AND va.activo = 1",
            [$fecha, $pacienteId]
        )->fetchAll();
    }

    public static function assign($pacienteId, $videoId, $asignadoPor = null, $frecuencia = null, $repeticiones = null) {
        $db = DatabaseService::getInstance();

        $db->query(
            "INSERT INTO videos_asignados (paciente_id, video_id, asignado_por, frecuencia_recomendada, repeticiones, activo, created_at)
             VALUES (?, ?, ?, ?, ?, 1, NOW())",
            [$pacienteId, $videoId, $asignadoPor, $frecuencia, $repeticiones]
        );

        return $db->lastInsertId();
    }

    public static function registrarVisualizacion($pacienteId, $videoId, $porcentajeVisto = 100) {
        $db = DatabaseService::getInstance();

        // Incrementar vistas en el video
        $db->query(
            "UPDATE " . self::$table . " SET vistas = vistas + 1 WHERE id = ?",
            [$videoId]
        );

        // Registrar en historial
        $db->query(
            "INSERT INTO registro_videos (paciente_id, video_id, porcentaje_visto, created_at)
             VALUES (?, ?, ?, NOW())",
            [$pacienteId, $videoId, $porcentajeVisto]
        );

        return true;
    }

    private static function extractYoutubeId($url) {
        preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/', $url, $matches);
        return $matches[1] ?? null;
    }
}
