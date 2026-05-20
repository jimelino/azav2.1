<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;

class AdminController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // ===== MÉTRICAS GENERALES =====
    public function getMetricas()
    {
        // Total usuarios
        $totalUsuarios = $this->db->query(
            "SELECT COUNT(*) as total FROM usuarios"
        )->fetch();

        // Pacientes activos
        $pacientesActivos = $this->db->query(
            "SELECT COUNT(*) as total FROM usuarios WHERE rol_id = 3 AND activo = 1"
        )->fetch();

        // Total especialistas
        $totalEspecialistas = $this->db->query(
            "SELECT COUNT(*) as total FROM usuarios WHERE rol_id = 2"
        )->fetch();

        // Citas de hoy
        $citasHoy = $this->db->query(
            "SELECT COUNT(*) as total FROM citas WHERE fecha = CURDATE()"
        )->fetch();

        // Nuevos usuarios este mes
        $nuevosEsteMes = $this->db->query(
            "SELECT COUNT(*) as total FROM usuarios
             WHERE MONTH(created_at) = MONTH(CURDATE())
             AND YEAR(created_at) = YEAR(CURDATE())"
        )->fetch();

        // Especialistas por área
        $especialistasPorArea = $this->db->query(
            "SELECT am.id, am.nombre, am.icono, am.color, COUNT(u.id) as total
             FROM areas_medicas am
             LEFT JOIN usuarios u ON u.area_medica_id = am.id AND u.rol_id = 2
             GROUP BY am.id, am.nombre, am.icono, am.color"
        )->fetchAll();

        return Response::success([
            'total_usuarios' => (int)($totalUsuarios['total'] ?? 0),
            'pacientes_activos' => (int)($pacientesActivos['total'] ?? 0),
            'total_especialistas' => (int)($totalEspecialistas['total'] ?? 0),
            'citas_hoy' => (int)($citasHoy['total'] ?? 0),
            'nuevos_mes' => (int)($nuevosEsteMes['total'] ?? 0),
            'especialistas_por_area' => $especialistasPorArea
        ]);
    }

    // ===== USUARIOS =====
    public function getUsuarios()
    {
        $usuarios = $this->db->query(
            "SELECT u.id, u.email, u.nombre_completo as nombre, u.fecha_nacimiento,
                    u.rol_id, r.nombre as rol, u.activo, u.ultimo_acceso,
                    DATE(u.created_at) as fecha_registro,
                    am.nombre as area_medica
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             LEFT JOIN areas_medicas am ON u.area_medica_id = am.id
             ORDER BY u.created_at DESC"
        )->fetchAll();

        return Response::success(['usuarios' => $usuarios]);
    }

    public function createUsuario($data)
    {
        // Validar datos requeridos
        if (empty($data['email']) || empty($data['nombre_completo']) || empty($data['rol_id'])) {
            return Response::error('Faltan datos requeridos', 422);
        }

        // La contraseña la define el administrador en el formulario.
        // (El flujo de generación aleatoria vive solo en AdmisionesController::admitirPaciente,
        //  cuando se admite a un paciente a partir de una solicitud externa.)
        if (empty($data['password'])) {
            return Response::error('La contraseña es requerida', 422);
        }
        if (strlen($data['password']) < 6) {
            return Response::error('La contraseña debe tener al menos 6 caracteres', 422);
        }

        // Verificar que el email no exista
        $exists = $this->db->query(
            "SELECT id FROM usuarios WHERE email = ?",
            [$data['email']]
        )->fetch();

        if ($exists) {
            return Response::error('El email ya está registrado', 422);
        }

        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        $this->db->query(
            "INSERT INTO usuarios (email, password_hash, nombre_completo, fecha_nacimiento, rol_id, area_medica_id, activo, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW())",
            [
                $data['email'],
                $passwordHash,
                $data['nombre_completo'],
                $data['fecha_nacimiento'] ?? null,
                $data['rol_id'],
                $data['area_medica_id'] ?? null
            ]
        );

        $userId = $this->db->lastInsertId();

        // Si es paciente, crear registro en tabla pacientes
        if ($data['rol_id'] == 3) {
            $this->db->query(
                "INSERT INTO pacientes (usuario_id, fase_actual_id, created_at) VALUES (?, 1, NOW())",
                [$userId]
            );
        }

        return Response::success([
            'id' => $userId
        ], 'Usuario creado exitosamente', 201);
    }

    public function updateUsuario($id, $data)
    {
        // Construir query dinámicamente
        $fields = [];
        $values = [];

        if (isset($data['nombre_completo'])) {
            $fields[] = 'nombre_completo = ?';
            $values[] = $data['nombre_completo'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = ?';
            $values[] = $data['email'];
        }
        if (isset($data['fecha_nacimiento'])) {
            $fields[] = 'fecha_nacimiento = ?';
            $values[] = $data['fecha_nacimiento'];
        }
        if (isset($data['activo'])) {
            $fields[] = 'activo = ?';
            $values[] = $data['activo'] ? 1 : 0;
        }
        if (isset($data['rol_id'])) {
            $fields[] = 'rol_id = ?';
            $values[] = $data['rol_id'];
        }
        if (isset($data['area_medica_id'])) {
            $fields[] = 'area_medica_id = ?';
            $values[] = $data['area_medica_id'];
        }

        if (empty($fields)) {
            return Response::error('No hay datos para actualizar', 422);
        }

        $values[] = $id;
        $sql = "UPDATE usuarios SET " . implode(', ', $fields) . " WHERE id = ?";

        $this->db->query($sql, $values);

        return Response::success(null, 'Usuario actualizado exitosamente');
    }

    public function deleteUsuario($id)
    {
        // No permitir eliminar al admin principal (id = 1)
        if ($id == 1) {
            return Response::error('No se puede eliminar al administrador principal', 403);
        }

        $this->db->query("DELETE FROM usuarios WHERE id = ?", [$id]);

        return Response::success(null, 'Usuario eliminado exitosamente');
    }

    public function toggleUsuarioActivo($id)
    {
        $this->db->query(
            "UPDATE usuarios SET activo = NOT activo WHERE id = ?",
            [$id]
        );

        return Response::success(null, 'Estado del usuario actualizado');
    }

    // ===== ESPECIALISTAS =====
    public function getEspecialistas()
    {
        $especialistas = $this->db->query(
            "SELECT u.id, u.email, u.nombre_completo as nombre, u.activo, u.ultimo_acceso,
                    am.id as area_medica_id, am.nombre as area_medica, am.color as area_color,
                    (SELECT COUNT(*) FROM asignaciones_especialista ae
                     WHERE ae.especialista_id = u.id AND ae.activo = 1) as pacientes
             FROM usuarios u
             INNER JOIN areas_medicas am ON u.area_medica_id = am.id
             WHERE u.rol_id = 2
             ORDER BY am.nombre, u.nombre_completo"
        )->fetchAll();

        return Response::success(['especialistas' => $especialistas]);
    }

    // ===== ASIGNACIONES ESPECIALISTA-PACIENTE =====

    /**
     * GET /api/admin/pacientes
     * Lista todos los pacientes para usarse como catálogo en el panel de asignación.
     */
    public function getPacientes()
    {
        $pacientes = $this->db->query(
            "SELECT p.id AS paciente_id, u.id AS usuario_id, u.email, u.nombre_completo AS nombre,
                    u.fecha_nacimiento, u.activo,
                    f.nombre AS fase_actual,
                    (SELECT COUNT(*) FROM asignaciones_especialista ae
                     WHERE ae.paciente_id = p.id AND ae.activo = 1) AS especialistas_asignados
             FROM pacientes p
             INNER JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN fases_tratamiento f ON p.fase_actual_id = f.id
             ORDER BY u.nombre_completo"
        )->fetchAll();

        return Response::success(['pacientes' => $pacientes]);
    }

    /**
     * GET /api/admin/especialistas/{id}/asignaciones
     * Devuelve los pacientes actualmente asignados (activos) a un especialista.
     */
    public function getAsignacionesEspecialista($especialistaId)
    {
        $asignaciones = $this->db->query(
            "SELECT ae.id, ae.paciente_id, ae.especialista_id, ae.area_medica_id,
                    ae.fecha_asignacion, ae.notas,
                    u.nombre_completo AS paciente_nombre, u.email AS paciente_email
             FROM asignaciones_especialista ae
             INNER JOIN pacientes p ON ae.paciente_id = p.id
             INNER JOIN usuarios u ON p.usuario_id = u.id
             WHERE ae.especialista_id = ? AND ae.activo = 1
             ORDER BY u.nombre_completo",
            [$especialistaId]
        )->fetchAll();

        return Response::success(['asignaciones' => $asignaciones]);
    }

    /**
     * POST /api/admin/asignaciones
     * Body: { paciente_id, especialista_id, notas? }
     * El area_medica_id se toma del especialista. Si ya existe una asignación activa
     * para esa tupla (paciente, especialista), devuelve conflict 409.
     */
    public function crearAsignacion($data)
    {
        if (empty($data['paciente_id']) || empty($data['especialista_id'])) {
            return Response::error('paciente_id y especialista_id son requeridos', 422);
        }

        $pacienteId     = (int) $data['paciente_id'];
        $especialistaId = (int) $data['especialista_id'];

        // El especialista debe existir y tener area_medica_id asignada
        $especialista = $this->db->query(
            "SELECT id, area_medica_id FROM usuarios WHERE id = ? AND rol_id = 2",
            [$especialistaId]
        )->fetch();
        if (!$especialista) {
            return Response::error('Especialista no encontrado', 404);
        }
        if (empty($especialista['area_medica_id'])) {
            return Response::error('El especialista no tiene área médica asignada', 422);
        }

        // El paciente debe existir
        $paciente = $this->db->query(
            "SELECT id FROM pacientes WHERE id = ?",
            [$pacienteId]
        )->fetch();
        if (!$paciente) {
            return Response::error('Paciente no encontrado', 404);
        }

        // Regla de negocio (unique key): un paciente solo puede tener UN especialista
        // activo por área médica. Si ya hay otro especialista activo en la misma área,
        // lo transferimos (desactivamos el anterior) y creamos la nueva asignación.
        $areaId = (int) $especialista['area_medica_id'];
        $existente = $this->db->query(
            "SELECT id, especialista_id FROM asignaciones_especialista
             WHERE paciente_id = ? AND area_medica_id = ? AND activo = 1",
            [$pacienteId, $areaId]
        )->fetch();

        if ($existente) {
            if ((int) $existente['especialista_id'] === $especialistaId) {
                return Response::error('Esta asignación ya existe', 409);
            }
            // Transferencia: desactivamos la anterior
            $this->db->query(
                "UPDATE asignaciones_especialista
                 SET activo = 0, fecha_fin = CURDATE()
                 WHERE id = ?",
                [(int) $existente['id']]
            );
        }

        $adminId = $GLOBALS['current_user']['id'] ?? null;

        $this->db->query(
            "INSERT INTO asignaciones_especialista
                (paciente_id, especialista_id, area_medica_id, activo, fecha_asignacion, asignado_por, notas)
             VALUES (?, ?, ?, 1, CURDATE(), ?, ?)",
            [
                $pacienteId,
                $especialistaId,
                $areaId,
                $adminId,
                $data['notas'] ?? null,
            ]
        );

        return Response::success([
            'id' => (int) $this->db->lastInsertId(),
            'paciente_id'     => $pacienteId,
            'especialista_id' => $especialistaId,
            'area_medica_id'  => $areaId,
            'transferido_de'  => $existente ? (int) $existente['especialista_id'] : null,
        ], $existente ? 'Paciente transferido al nuevo especialista' : 'Asignación creada', 201);
    }

    /**
     * DELETE /api/admin/asignaciones/{id}
     * Soft delete: activo=0, fecha_fin=hoy. Preserva el histórico.
     */
    public function eliminarAsignacion($id)
    {
        $existe = $this->db->query(
            "SELECT id FROM asignaciones_especialista WHERE id = ? AND activo = 1",
            [$id]
        )->fetch();
        if (!$existe) {
            return Response::error('Asignación no encontrada o ya inactiva', 404);
        }

        $this->db->query(
            "UPDATE asignaciones_especialista
             SET activo = 0, fecha_fin = CURDATE()
             WHERE id = ?",
            [$id]
        );

        return Response::success(null, 'Asignación eliminada');
    }

    // ===== MÉTRICAS DE BLOG/COMUNIDAD =====
    public function getBlogMetricas()
    {
        // Total artículos
        $totalArticulos = $this->db->query(
            "SELECT COUNT(*) as total FROM articulos WHERE publicado = 1"
        )->fetch();

        // Total vistas
        $totalVistas = $this->db->query(
            "SELECT COALESCE(SUM(vistas), 0) as total FROM articulos"
        )->fetch();

        // Total likes
        $totalLikes = $this->db->query(
            "SELECT COUNT(*) as total FROM likes_articulo"
        )->fetch();

        // Publicaciones de comunidad
        $totalPublicaciones = $this->db->query(
            "SELECT COUNT(*) as total FROM publicaciones_comunidad WHERE estado = 'aprobada'"
        )->fetch();

        // Artículos más populares
        $articulosPopulares = $this->db->query(
            "SELECT a.id, a.titulo, a.vistas, a.likes, u.nombre_completo as autor,
                    DATE(a.created_at) as fecha
             FROM articulos a
             INNER JOIN usuarios u ON a.autor_id = u.id
             WHERE a.publicado = 1
             ORDER BY a.vistas DESC
             LIMIT 5"
        )->fetchAll();

        // Engagement rate (reacciones + comentarios / publicaciones)
        $totalReacciones = $this->db->query(
            "SELECT COUNT(*) as total FROM reacciones_publicacion"
        )->fetch();
        $totalComentarios = $this->db->query(
            "SELECT COUNT(*) as total FROM comentarios_comunidad"
        )->fetch();

        $engagementRate = 0;
        if ($totalPublicaciones['total'] > 0) {
            $engagementRate = round(
                (($totalReacciones['total'] + $totalComentarios['total']) / $totalPublicaciones['total']) * 100,
                1
            );
        }

        return Response::success([
            'total_articulos' => (int)($totalArticulos['total'] ?? 0),
            'visitas_blog' => (int)($totalVistas['total'] ?? 0),
            'total_posts' => (int)($totalArticulos['total'] ?? 0),
            'total_likes' => (int)($totalLikes['total'] ?? 0),
            'total_publicaciones' => (int)($totalPublicaciones['total'] ?? 0),
            'engagement' => $engagementRate,
            'blogs' => $articulosPopulares
        ]);
    }

    // ===== FAQs =====
    public function getFAQs()
    {
        $faqs = $this->db->query(
            "SELECT f.id, f.pregunta, f.respuesta, f.publicada as activo, f.vistas,
                    am.nombre as categoria, am.id as area_medica_id
             FROM faqs f
             LEFT JOIN areas_medicas am ON f.area_medica_id = am.id
             ORDER BY f.orden, f.id"
        )->fetchAll();

        return Response::success(['faqs' => $faqs]);
    }

    public function createFAQ($data)
    {
        if (empty($data['pregunta']) || empty($data['respuesta'])) {
            return Response::error('Pregunta y respuesta son requeridos', 422);
        }

        $this->db->query(
            "INSERT INTO faqs (pregunta, respuesta, area_medica_id, publicada, creado_por, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())",
            [
                $data['pregunta'],
                $data['respuesta'],
                $data['area_medica_id'] ?? null,
                $data['publicada'] ?? 1,
                $data['creado_por'] ?? 1
            ]
        );

        return Response::success(['id' => $this->db->lastInsertId()], 'FAQ creada exitosamente', 201);
    }

    public function updateFAQ($id, $data)
    {
        $fields = [];
        $values = [];

        if (isset($data['pregunta'])) {
            $fields[] = 'pregunta = ?';
            $values[] = $data['pregunta'];
        }
        if (isset($data['respuesta'])) {
            $fields[] = 'respuesta = ?';
            $values[] = $data['respuesta'];
        }
        if (isset($data['area_medica_id'])) {
            $fields[] = 'area_medica_id = ?';
            $values[] = $data['area_medica_id'];
        }
        if (isset($data['publicada'])) {
            $fields[] = 'publicada = ?';
            $values[] = $data['publicada'] ? 1 : 0;
        }

        if (empty($fields)) {
            return Response::error('No hay datos para actualizar', 422);
        }

        $values[] = $id;
        $sql = "UPDATE faqs SET " . implode(', ', $fields) . " WHERE id = ?";

        $this->db->query($sql, $values);

        return Response::success(null, 'FAQ actualizada exitosamente');
    }

    public function deleteFAQ($id)
    {
        $this->db->query("DELETE FROM faqs WHERE id = ?", [$id]);
        return Response::success(null, 'FAQ eliminada exitosamente');
    }
}
