<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Services\FileUploadService;
use App\Utils\Response;

/**
 * Recibe información empujada por el sistema clínico externo de
 * Neuropsicología (pacientes, especialistas, asignaciones, citas y
 * resultados de evaluación). Protegido por ApiKeyMiddleware, no por sesión
 * de usuario: quien llama es el otro sistema, no una persona logueada.
 */
class IngestNeuroController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    private function areaNeuroId()
    {
        $area = $this->db->query("SELECT id FROM areas_medicas WHERE nombre = 'neuropsicologia'")->fetch();
        return $area ? (int) $area['id'] : null;
    }

    private function generarPasswordTemporal()
    {
        return 'Azaria' . rand(1000, 9999);
    }

    /**
     * Busca un usuario por correo; si no existe lo crea con una contraseña
     * temporal (mismo patrón que AdmisionesController::admitirPaciente). Si
     * ya existe, actualiza nombre/foto sin tocar la contraseña.
     */
    private function resolverOCrearUsuario($email, $nombreCompleto, $rolId, $fotoUrl = null, $fechaNacimiento = null)
    {
        $existente = $this->db->query("SELECT id FROM usuarios WHERE email = ?", [$email])->fetch();

        if ($existente) {
            $this->db->query(
                "UPDATE usuarios SET nombre_completo = ?, foto_perfil_url = COALESCE(?, foto_perfil_url) WHERE id = ?",
                [$nombreCompleto, $fotoUrl, $existente['id']]
            );
            return ['usuario_id' => (int) $existente['id'], 'es_nuevo' => false, 'password_temporal' => null];
        }

        $passwordTemporal = $this->generarPasswordTemporal();
        $passwordHash = password_hash($passwordTemporal, PASSWORD_DEFAULT);
        $areaMedicaId = $rolId == 2 ? $this->areaNeuroId() : null;

        $this->db->query(
            "INSERT INTO usuarios (email, password_hash, nombre_completo, fecha_nacimiento, rol_id, area_medica_id, foto_perfil_url, activo, primer_acceso, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())",
            [$email, $passwordHash, $nombreCompleto, $fechaNacimiento, $rolId, $areaMedicaId, $fotoUrl]
        );

        return ['usuario_id' => (int) $this->db->lastInsertId(), 'es_nuevo' => true, 'password_temporal' => $passwordTemporal];
    }

    public function postPaciente($data)
    {
        if (empty($data['email']) || empty($data['nombre_completo'])) {
            return Response::error('email y nombre_completo son requeridos', 422);
        }

        $resultado = $this->resolverOCrearUsuario(
            $data['email'],
            $data['nombre_completo'],
            3,
            $data['foto_perfil_url'] ?? null,
            $data['fecha_nacimiento'] ?? null
        );

        $paciente = $this->db->query("SELECT id FROM pacientes WHERE usuario_id = ?", [$resultado['usuario_id']])->fetch();
        if (!$paciente) {
            $this->db->query(
                "INSERT INTO pacientes (usuario_id, fase_actual_id, created_at) VALUES (?, 1, NOW())",
                [$resultado['usuario_id']]
            );
            $pacienteId = (int) $this->db->lastInsertId();
        } else {
            $pacienteId = (int) $paciente['id'];
        }

        return Response::success([
            'paciente_id' => $pacienteId,
            'usuario_id' => $resultado['usuario_id'],
            'email' => $data['email'],
            'password_temporal' => $resultado['password_temporal'],
        ], $resultado['es_nuevo'] ? 'Paciente creado' : 'Paciente actualizado', $resultado['es_nuevo'] ? 201 : 200);
    }

    public function postEspecialista($data)
    {
        if (empty($data['email']) || empty($data['nombre_completo'])) {
            return Response::error('email y nombre_completo son requeridos', 422);
        }

        $resultado = $this->resolverOCrearUsuario(
            $data['email'],
            $data['nombre_completo'],
            2,
            $data['foto_perfil_url'] ?? null
        );

        return Response::success([
            'especialista_id' => $resultado['usuario_id'],
            'email' => $data['email'],
            'password_temporal' => $resultado['password_temporal'],
        ], $resultado['es_nuevo'] ? 'Especialista creado' : 'Especialista actualizado', $resultado['es_nuevo'] ? 201 : 200);
    }

    public function postAsignacion($data)
    {
        if (empty($data['paciente_email']) || empty($data['especialista_email'])) {
            return Response::error('paciente_email y especialista_email son requeridos', 422);
        }

        $paciente = $this->db->query(
            "SELECT p.id FROM pacientes p INNER JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = ?",
            [$data['paciente_email']]
        )->fetch();
        if (!$paciente) {
            return Response::error('No se encontró un paciente con ese correo. Regístralo primero con /pacientes.', 404);
        }
        $pacienteId = (int) $paciente['id'];

        $especialista = $this->db->query(
            "SELECT id FROM usuarios WHERE email = ? AND rol_id = 2",
            [$data['especialista_email']]
        )->fetch();
        if (!$especialista) {
            return Response::error('No se encontró un especialista con ese correo. Regístralo primero con /especialistas.', 404);
        }
        $especialistaId = (int) $especialista['id'];

        $areaId = $this->areaNeuroId();
        if (!$areaId) {
            return Response::error('No se encontró el área de neuropsicología en el catálogo', 500);
        }

        $existente = $this->db->query(
            "SELECT id, especialista_id FROM asignaciones_especialista WHERE paciente_id = ? AND area_medica_id = ? AND activo = 1",
            [$pacienteId, $areaId]
        )->fetch();

        if ($existente && (int) $existente['especialista_id'] === $especialistaId) {
            return Response::success(['asignacion_id' => (int) $existente['id']], 'La asignación ya existía');
        }

        if ($existente) {
            $this->db->query(
                "UPDATE asignaciones_especialista SET activo = 0, fecha_fin = CURDATE() WHERE id = ?",
                [(int) $existente['id']]
            );
        }

        // asignado_por es NOT NULL y debe referenciar un usuario válido; al
        // no haber una sesión humana detrás de esta llamada, se registra al
        // propio especialista asignado como responsable del alta.
        $this->db->query(
            "INSERT INTO asignaciones_especialista (paciente_id, especialista_id, area_medica_id, activo, fecha_asignacion, asignado_por, notas)
             VALUES (?, ?, ?, 1, CURDATE(), ?, 'Asignado vía integración con sistema externo')",
            [$pacienteId, $especialistaId, $areaId, $especialistaId]
        );

        return Response::success([
            'asignacion_id' => (int) $this->db->lastInsertId(),
            'transferido_de' => $existente ? (int) $existente['especialista_id'] : null,
        ], 'Asignación creada', 201);
    }

    public function postCita($data)
    {
        foreach (['paciente_email', 'especialista_email', 'fecha', 'hora_inicio', 'hora_fin'] as $campo) {
            if (empty($data[$campo])) {
                return Response::error("El campo {$campo} es requerido", 422);
            }
        }

        $paciente = $this->db->query(
            "SELECT p.id FROM pacientes p INNER JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = ?",
            [$data['paciente_email']]
        )->fetch();
        if (!$paciente) {
            return Response::error('No se encontró un paciente con ese correo', 404);
        }

        $especialista = $this->db->query(
            "SELECT id FROM usuarios WHERE email = ? AND rol_id = 2",
            [$data['especialista_email']]
        )->fetch();
        if (!$especialista) {
            return Response::error('No se encontró un especialista con ese correo', 404);
        }

        $areaId = $this->areaNeuroId();

        $tipo = $this->db->query("SELECT id FROM tipos_cita WHERE nombre = ?", [$data['tipo'] ?? 'seguimiento'])->fetch()
            ?: $this->db->query("SELECT id FROM tipos_cita WHERE nombre = 'seguimiento'")->fetch();
        $tipoCitaId = (int) $tipo['id'];

        $idExterno = $data['id_externo'] ?? null;
        $existente = $idExterno
            ? $this->db->query("SELECT id FROM citas WHERE id_externo = ?", [$idExterno])->fetch()
            : null;

        $params = [
            (int) $paciente['id'], (int) $especialista['id'], $areaId, $tipoCitaId,
            $data['fecha'], $data['hora_inicio'], $data['hora_fin'], $data['motivo'] ?? null,
        ];

        if ($existente) {
            $this->db->query(
                "UPDATE citas SET paciente_id = ?, especialista_id = ?, area_medica_id = ?, tipo_cita_id = ?,
                                  fecha = ?, hora_inicio = ?, hora_fin = ?, motivo = ?
                 WHERE id = ?",
                [...$params, (int) $existente['id']]
            );
            return Response::success(['cita_id' => (int) $existente['id']], 'Cita actualizada');
        }

        $this->db->query(
            "INSERT INTO citas (paciente_id, especialista_id, area_medica_id, tipo_cita_id, fecha, hora_inicio, hora_fin, motivo, id_externo, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [...$params, $idExterno]
        );

        return Response::success(['cita_id' => (int) $this->db->lastInsertId()], 'Cita creada', 201);
    }

    public function postResultado($data, $files)
    {
        if (empty($data['paciente_email'])) {
            return Response::error('paciente_email es requerido', 422);
        }
        if (empty($files['archivo']) || $files['archivo']['error'] !== UPLOAD_ERR_OK) {
            return Response::error('Se requiere el archivo PDF del resultado', 422);
        }

        $paciente = $this->db->query(
            "SELECT p.id FROM pacientes p INNER JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = ?",
            [$data['paciente_email']]
        )->fetch();
        if (!$paciente) {
            return Response::error('No se encontró un paciente con ese correo', 404);
        }

        $archivoUrl = (new FileUploadService())->upload($files['archivo'], 'neuro-resultados', ['pdf']);

        $this->db->query(
            "INSERT INTO neuro_resultados_evaluacion (paciente_id, id_externo, archivo_url, titulo, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [(int) $paciente['id'], $data['id_externo'] ?? null, $archivoUrl, $data['titulo'] ?? null]
        );

        return Response::success([
            'resultado_id' => (int) $this->db->lastInsertId(),
            'archivo_url' => $archivoUrl,
        ], 'Resultado guardado', 201);
    }
}
