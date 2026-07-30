<?php
namespace App\Models;
use App\Services\DatabaseService;

class EstadoAnimo {
    // Tabla correcta según el schema de la base de datos
    private static $table = 'registro_animo';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT * FROM " . self::$table . " WHERE id = ?", [$id])->fetch();
    }

    public static function getAll() {
        $db = DatabaseService::getInstance();
        return $db->query("SELECT * FROM " . self::$table . " ORDER BY created_at DESC")->fetchAll();
    }

    public static function getByPaciente($pacienteId, $filters = []) {
        $db = DatabaseService::getInstance();
        $limit = $filters['limit'] ?? 30;

        return $db->query(
            "SELECT ra.*, GROUP_CONCAT(e.nombre) as emociones_nombres
             FROM " . self::$table . " ra
             LEFT JOIN registro_animo_emociones rae ON ra.id = rae.registro_animo_id
             LEFT JOIN emociones e ON rae.emocion_id = e.id
             WHERE ra.paciente_id = ?
             GROUP BY ra.id
             ORDER BY ra.fecha DESC, ra.created_at DESC
             LIMIT ?",
            [$pacienteId, $limit]
        )->fetchAll();
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        $fecha = isset($data['fecha_hora']) ? date('Y-m-d', strtotime($data['fecha_hora'])) : date('Y-m-d');
        $notas = $data['notas'] ?? null;
        $emocion = $data['emocion'] ?? null;

        // Insertar en registro_animo
        $db->query(
            "INSERT INTO " . self::$table . " (paciente_id, nivel_animo, notas, fecha, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [
                $data['paciente_id'],
                $data['nivel_animo'],
                $notas,
                $fecha
            ]
        );

        $id = $db->lastInsertId();

        // Si hay una emoción, buscar o crear en la tabla emociones y registrar en registro_animo_emociones
        if ($emocion) {
            // Mapear emocion del frontend a nombre de emocion en la base de datos
            $emocionMap = [
                'feliz' => 'alegria',
                'tranquilo' => 'calma',
                'agradecido' => 'gratitud',
                'neutral' => 'confusion',
                'ansioso' => 'ansiedad',
                'triste' => 'tristeza',
                'frustrado' => 'frustracion',
                'enojado' => 'enojo'
            ];

            $nombreEmocion = $emocionMap[strtolower($emocion)] ?? strtolower($emocion);

            // Buscar la emoción en el catálogo
            $emocionRow = $db->query(
                "SELECT id FROM emociones WHERE nombre = ?",
                [$nombreEmocion]
            )->fetch();

            if ($emocionRow) {
                $db->query(
                    "INSERT INTO registro_animo_emociones (registro_animo_id, emocion_id) VALUES (?, ?)",
                    [$id, $emocionRow['id']]
                );
            }
        }

        // Retornar el registro con la emoción incluida
        $result = self::find($id);
        if ($result) {
            $result['emocion'] = $emocion;
            $result['fecha_hora'] = $result['fecha'] . ' ' . date('H:i:s', strtotime($result['created_at']));
        }

        return $result;
    }

    public static function update($id, $data) {
        $db = DatabaseService::getInstance();

        $fields = [];
        $values = [];

        if (isset($data['nivel_animo'])) {
            $fields[] = 'nivel_animo = ?';
            $values[] = $data['nivel_animo'];
        }
        if (isset($data['notas'])) {
            $fields[] = 'notas = ?';
            $values[] = $data['notas'];
        }

        if (empty($fields)) return false;

        $values[] = $id;

        return $db->query(
            "UPDATE " . self::$table . " SET " . implode(', ', $fields) . " WHERE id = ?",
            $values
        );
    }

    public static function delete($id) {
        $db = DatabaseService::getInstance();
        return $db->query("DELETE FROM " . self::$table . " WHERE id = ?", [$id]);
    }

    public static function getRecientes($pacienteId, $limit = 3) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT * FROM " . self::$table . " WHERE paciente_id = ? ORDER BY fecha DESC, created_at DESC LIMIT ?",
            [$pacienteId, $limit]
        )->fetchAll();
    }

    public static function getTendencias($pacienteId, $periodo = '30d') {
        $db = DatabaseService::getInstance();
        $dias = intval($periodo);

        return $db->query(
            "SELECT fecha, AVG(nivel_animo) as promedio, COUNT(*) as registros
             FROM " . self::$table . "
             WHERE paciente_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY fecha
             ORDER BY fecha ASC",
            [$pacienteId, $dias]
        )->fetchAll();
    }

    public static function getEmocionesFrecuentes($pacienteId, $periodo = '30d') {
        $db = DatabaseService::getInstance();
        $dias = intval($periodo);

        return $db->query(
            "SELECT e.nombre as emocion, COUNT(*) as cantidad
             FROM registro_animo_emociones rae
             JOIN " . self::$table . " ra ON rae.registro_animo_id = ra.id
             JOIN emociones e ON rae.emocion_id = e.id
             WHERE ra.paciente_id = ? AND ra.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY e.nombre
             ORDER BY cantidad DESC",
            [$pacienteId, $dias]
        )->fetchAll();
    }

    public static function getNubeEmociones($pacienteId, $periodo = '30d') {
        return self::getEmocionesFrecuentes($pacienteId, $periodo);
    }

    public static function getAlertas($especialistaId = null) {
        $db = DatabaseService::getInstance();

        // Usar alertas_medicas con tipo apropiado
        $sql = "SELECT a.*, u.nombre_completo as paciente_nombre
                FROM alertas_medicas a
                JOIN pacientes p ON a.paciente_id = p.id
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE a.atendida = 0 AND a.tipo = 'patron_olvido'";

        $params = [];

        if ($especialistaId) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM asignaciones_especialista ae
                JOIN areas_medicas am ON am.id = ae.area_medica_id
                WHERE ae.paciente_id = a.paciente_id AND ae.especialista_id = ? AND ae.activo = 1
                  AND (LOWER(am.nombre) LIKE '%neuro%' OR LOWER(am.nombre) LIKE '%psic%')
            )";
            $params[] = $especialistaId;
        }

        $sql .= " ORDER BY a.created_at DESC";

        return $db->query($sql, $params)->fetchAll();
    }

    public static function crearAlerta($pacienteId, $severidad = 'media', $mensaje = null) {
        $db = DatabaseService::getInstance();

        return $db->query(
            "INSERT INTO alertas_medicas (paciente_id, tipo, severidad, mensaje, atendida, created_at)
             VALUES (?, 'patron_olvido', 'media', 'El paciente ha registrado 3 o más estados de ánimo negativos consecutivos', 0, NOW())",
            [$pacienteId]
        );
    }

    public static function crearAlertaCritica($pacienteId) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "INSERT INTO alertas_medicas (paciente_id, tipo, severidad, mensaje, atendida, created_at)
             VALUES (?, 'patron_olvido', 'alta', 'Alerta urgente: el paciente registro un estado de animo critico.', 0, NOW())",
            [$pacienteId]
        );
    }

    public static function marcarAlertaAtendida($alertaId) {
        $db = DatabaseService::getInstance();

        return $db->query(
            "UPDATE alertas_medicas SET atendida = 1, atendida_en = NOW() WHERE id = ?",
            [$alertaId]
        );
    }
}
