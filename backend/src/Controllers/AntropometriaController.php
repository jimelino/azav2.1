<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class AntropometriaController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    /**
     * ¿El usuario autenticado puede ver/editar mediciones de este paciente?
     * Sí, si es el propio paciente, o si es un especialista con asignación activa.
     */
    private function usuarioPuedeAccederPaciente($pacienteId, $user)
    {
        if ((int)$user['rol_id'] === 3) {
            return (int)($user['paciente_id'] ?? 0) === (int)$pacienteId;
        }

        if ((int)$user['rol_id'] === 2) {
            $asignacion = $this->db->query(
                "SELECT id FROM asignaciones_especialista WHERE paciente_id = ? AND especialista_id = ? AND activo = 1",
                [$pacienteId, $user['id']]
            )->fetch();
            return (bool)$asignacion;
        }

        return false;
    }

    /**
     * Registrar una nueva medición antropométrica
     */
    public function registrarMedicion($pacienteId)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();
            if (!$user) {
                return Response::error('No autorizado', 401);
            }

            if (!$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
                return Response::error('No autorizado', 403);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['peso']) || empty($data['talla'])) {
                return Response::error('Los campos peso y talla son requeridos', 422);
            }

            $this->db->query(
                "INSERT INTO mediciones_antropometricas
                    (paciente_id, especialista_id, peso, talla, circunferencia_cintura, circunferencia_cadera, notas, fecha_medicion)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $pacienteId,
                    $user['id'],
                    $data['peso'],
                    $data['talla'],
                    $data['circunferencia_cintura'] ?? null,
                    $data['circunferencia_cadera'] ?? null,
                    $data['notas'] ?? null,
                    $data['fecha_medicion'] ?? date('Y-m-d')
                ]
            );

            $id = $this->db->lastInsertId();

            return Response::success(['id' => $id], 'Medición registrada exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error al registrar medición antropométrica: ' . $e->getMessage());
            return Response::error('Error al registrar la medición', 500);
        }
    }

    /**
     * Obtener todas las mediciones de un paciente
     */
    public function getMediciones($pacienteId)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();
            if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
                return Response::error('No autorizado', 403);
            }

            $mediciones = $this->db->query(
                "SELECT m.*, u.nombre_completo AS especialista_nombre
                 FROM mediciones_antropometricas m
                 LEFT JOIN usuarios u ON u.id = m.especialista_id
                 WHERE m.paciente_id = ?
                 ORDER BY m.fecha_medicion DESC",
                [$pacienteId]
            )->fetchAll();

            return Response::success(['mediciones' => $mediciones]);
        } catch (\Exception $e) {
            error_log('Error al obtener mediciones antropométricas: ' . $e->getMessage());
            return Response::error('Error al obtener las mediciones', 500);
        }
    }

    /**
     * Obtener la última medición de un paciente
     */
    public function getUltimaMedicion($pacienteId)
    {
        try {
            $medicion = $this->db->query(
                "SELECT m.*, u.nombre_completo AS especialista_nombre
                 FROM mediciones_antropometricas m
                 LEFT JOIN usuarios u ON u.id = m.especialista_id
                 WHERE m.paciente_id = ?
                 ORDER BY m.fecha_medicion DESC
                 LIMIT 1",
                [$pacienteId]
            )->fetch();

            if (!$medicion) {
                return Response::success(['medicion' => null], 'No se encontraron mediciones para este paciente');
            }

            return Response::success(['medicion' => $medicion]);
        } catch (\Exception $e) {
            error_log('Error al obtener última medición: ' . $e->getMessage());
            return Response::error('Error al obtener la última medición', 500);
        }
    }

    /**
     * Obtener evolución de peso para gráficas
     */
    public function getEvolucionPeso($pacienteId)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();
            if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
                return Response::error('No autorizado', 403);
            }

            $evolucion = $this->db->query(
                "SELECT fecha_medicion AS fecha, peso, imc
                 FROM mediciones_antropometricas
                 WHERE paciente_id = ?
                 ORDER BY fecha_medicion ASC",
                [$pacienteId]
            )->fetchAll();

            return Response::success(['evolucion' => $evolucion]);
        } catch (\Exception $e) {
            error_log('Error al obtener evolución de peso: ' . $e->getMessage());
            return Response::error('Error al obtener la evolución de peso', 500);
        }
    }

    /**
     * Eliminar una medición antropométrica
     */
    public function eliminarMedicion($id)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();
            if (!$user) {
                return Response::error('No autorizado', 401);
            }

            $medicion = $this->db->query(
                "SELECT id, especialista_id FROM mediciones_antropometricas WHERE id = ?",
                [$id]
            )->fetch();

            if (!$medicion) {
                return Response::error('Medición no encontrada', 404);
            }

            if ((int) $medicion['especialista_id'] !== (int) $user['id']) {
                return Response::error('No tiene permiso para eliminar esta medición', 403);
            }

            $this->db->query(
                "DELETE FROM mediciones_antropometricas WHERE id = ?",
                [$id]
            );

            return Response::success(null, 'Medición eliminada exitosamente');
        } catch (\Exception $e) {
            error_log('Error al eliminar medición antropométrica: ' . $e->getMessage());
            return Response::error('Error al eliminar la medición', 500);
        }
    }
}