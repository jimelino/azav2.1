<?php
namespace App\Models;
use App\Services\DatabaseService;

class Recordatorio {
    private static $table = 'recordatorios';

    public static function find($id) {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT r.*, tr.nombre as tipo_nombre
             FROM " . self::$table . " r
             LEFT JOIN tipos_recordatorio tr ON r.tipo_id = tr.id
             WHERE r.id = ?",
            [$id]
        )->fetch();
    }

    public static function getAll() {
        $db = DatabaseService::getInstance();
        return $db->query(
            "SELECT r.*, tr.nombre as tipo_nombre
             FROM " . self::$table . " r
             LEFT JOIN tipos_recordatorio tr ON r.tipo_id = tr.id
             ORDER BY r.hora"
        )->fetchAll();
    }

    public static function getByPaciente($pacienteId, $activos = null) {
        $db = DatabaseService::getInstance();

        // Mapeo inverso de tipo_id a tipo string para el frontend
        $tiposInverso = [
            1 => 'medicina',
            2 => 'nutricion',
            3 => 'fisioterapia',
            4 => 'cita',
            5 => 'cuestionario',
            6 => 'medicamento'
        ];

        // La tabla usa usuario_id, no paciente_id
        // Necesitamos obtener el usuario_id desde pacientes
        $paciente = $db->query(
            "SELECT usuario_id FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();

        if (!$paciente) {
            return [];
        }

        $query = "SELECT r.*, tr.nombre as tipo_nombre
                  FROM " . self::$table . " r
                  LEFT JOIN tipos_recordatorio tr ON r.tipo_id = tr.id
                  WHERE r.usuario_id = ?";
        $params = [$paciente['usuario_id']];

        if ($activos !== null) {
            $query .= " AND r.activo = ?";
            $params[] = $activos ? 1 : 0;
        }

        $query .= " ORDER BY r.hora";

        $recordatorios = $db->query($query, $params)->fetchAll();

        // Transformar para el frontend
        return array_map(function($r) use ($tiposInverso) {
            $diasSemana = json_decode($r['dias_semana'] ?? '[]', true);
            // Convertir nombres de días a números
            $diasNombresANum = [
                'domingo' => 0, 'lunes' => 1, 'martes' => 2, 'miercoles' => 3,
                'jueves' => 4, 'viernes' => 5, 'sabado' => 6
            ];
            $diasNumeros = array_map(function($d) use ($diasNombresANum) {
                return $diasNombresANum[$d] ?? 0;
            }, $diasSemana);

            return [
                'id' => $r['id'],
                'tipo' => $tiposInverso[$r['tipo_id']] ?? 'otro',
                'titulo' => $r['mensaje_personalizado'] ?? '',
                'descripcion' => '',
                'hora' => $r['hora'],
                'dias_semana' => implode(',', $diasNumeros),
                'activo' => (bool)$r['activo']
            ];
        }, $recordatorios);
    }

    public static function getUsuarioIdByPaciente($pacienteId) {
        $db = DatabaseService::getInstance();
        $paciente = $db->query("SELECT usuario_id FROM pacientes WHERE id = ?", [$pacienteId])->fetch();
        return $paciente['usuario_id'] ?? null;
    }

    public static function getByUsuario($usuarioId, $activos = null) {
        $db = DatabaseService::getInstance();

        $query = "SELECT r.*, tr.nombre as tipo_nombre
                  FROM " . self::$table . " r
                  LEFT JOIN tipos_recordatorio tr ON r.tipo_id = tr.id
                  WHERE r.usuario_id = ?";
        $params = [$usuarioId];

        if ($activos !== null) {
            $query .= " AND r.activo = ?";
            $params[] = $activos ? 1 : 0;
        }

        $query .= " ORDER BY r.hora";

        return $db->query($query, $params)->fetchAll();
    }

    public static function create($data) {
        $db = DatabaseService::getInstance();

        // Mapear tipo string a tipo_id
        $tiposMap = [
            'medicina' => 1,
            'medicamento' => 6,
            'nutricion' => 2,
            'fisioterapia' => 3,
            'ejercicio' => 3,
            'cita' => 4,
            'cuestionario' => 5,
            'medicion' => 1,
            'hidratacion' => 2,
            'protesis' => 3,
            'otro' => 1
        ];

        $tipoId = $data['tipo_id'] ?? ($tiposMap[$data['tipo'] ?? 'otro'] ?? 1);

        // Si viene paciente_id, convertir a usuario_id
        $usuarioId = $data['usuario_id'] ?? null;
        if (!$usuarioId && isset($data['paciente_id'])) {
            $paciente = $db->query(
                "SELECT usuario_id FROM pacientes WHERE id = ?",
                [$data['paciente_id']]
            )->fetch();
            $usuarioId = $paciente ? $paciente['usuario_id'] : null;
        }

        // Parsear dias_semana - puede venir como string "0,1,2" o como array
        $diasSemana = $data['dias_semana'] ?? [];
        if (is_string($diasSemana)) {
            // Convertir "0,1,2,3" a array de nombres de días
            $diasNum = array_map('intval', explode(',', $diasSemana));
            $diasNombres = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            $diasSemana = array_map(function($num) use ($diasNombres) {
                return $diasNombres[$num] ?? 'lunes';
            }, $diasNum);
        }
        if (empty($diasSemana)) {
            $diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        }

        $db->query(
            "INSERT INTO " . self::$table . "
             (usuario_id, tipo_id, hora, dias_semana, mensaje_personalizado, activo, referencia_tipo, referencia_id, created_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, NOW())",
            [
                $usuarioId,
                $tipoId,
                $data['hora'] ?? '08:00',
                json_encode($diasSemana),
                $data['mensaje_personalizado'] ?? $data['titulo'] ?? null,
                $data['referencia_tipo'] ?? null,
                $data['referencia_id'] ?? null
            ]
        );

        return $db->lastInsertId();
    }

    public static function update($id, $data) {
        $db = DatabaseService::getInstance();

        $fields = [];
        $values = [];

        $allowedFields = ['tipo_id', 'hora', 'dias_semana', 'mensaje_personalizado', 'activo', 'referencia_tipo', 'referencia_id'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $value = $data[$field];
                if ($field === 'dias_semana' && is_array($value)) {
                    $value = json_encode($value);
                }
                $values[] = $value;
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

    public static function toggleActive($id) {
        $db = DatabaseService::getInstance();
        $db->query(
            "UPDATE " . self::$table . " SET activo = NOT activo, updated_at = NOW() WHERE id = ?",
            [$id]
        );
        return self::find($id);
    }

    public static function markCompleted($id) {
        $db = DatabaseService::getInstance();

        // Registrar en historial
        $recordatorio = self::find($id);
        if ($recordatorio) {
            $db->query(
                "INSERT INTO historial_recordatorios (recordatorio_id, usuario_id, enviado_en, completado, completado_en, created_at)
                 VALUES (?, ?, NOW(), 1, NOW(), NOW())",
                [$id, $recordatorio['usuario_id']]
            );
        }

        return true;
    }

    public static function registrarEnvio($recordatorioId, $usuarioId) {
        $db = DatabaseService::getInstance();
        $db->query(
            "INSERT INTO historial_recordatorios (recordatorio_id, usuario_id, enviado_en, created_at)
             VALUES (?, ?, NOW(), NOW())",
            [$recordatorioId, $usuarioId]
        );
    }

    public static function getHistorial($pacienteId, $filters = []) {
        $db = DatabaseService::getInstance();

        // Obtener usuario_id desde paciente
        $paciente = $db->query(
            "SELECT usuario_id FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();

        if (!$paciente) {
            return [];
        }

        return $db->query(
            "SELECT hr.*, r.mensaje_personalizado, tr.nombre as tipo_nombre
             FROM historial_recordatorios hr
             JOIN " . self::$table . " r ON hr.recordatorio_id = r.id
             LEFT JOIN tipos_recordatorio tr ON r.tipo_id = tr.id
             WHERE hr.usuario_id = ?
             ORDER BY hr.created_at DESC
             LIMIT 100",
            [$paciente['usuario_id']]
        )->fetchAll();
    }

    public static function getPendientes() {
        $db = DatabaseService::getInstance();

        $horaActual = date('H:i:00');
        $diaActual = strtolower(date('l'));
        $diasMap = [
            'monday' => 'lunes',
            'tuesday' => 'martes',
            'wednesday' => 'miercoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sabado',
            'sunday' => 'domingo'
        ];
        $diaActual = $diasMap[$diaActual] ?? $diaActual;

        return $db->query(
            "SELECT r.*, u.email, u.nombre_completo
             FROM " . self::$table . " r
             JOIN usuarios u ON r.usuario_id = u.id
             WHERE r.activo = 1
             AND r.hora = ?
             AND JSON_CONTAINS(r.dias_semana, ?)",
            [$horaActual, '"' . $diaActual . '"']
        )->fetchAll();
    }
}
