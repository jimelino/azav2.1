<?php

namespace App\Models;

use App\Services\DatabaseService;
use PDOException;

class PlanEquivalente
{
    private $db;

    public function __construct()
    {
        // Conectamos con tu base de datos local usando el Singleton corregido
        $this->db = DatabaseService::getInstance();
    }

    /**
     * Guarda o actualiza el encabezado del plan por equivalentes
     */
    public function guardarEncabezado($pacienteId, $especialistaId, $calorias, $proteinas, $carbohidratos, $grasas, $recomendaciones)
    {
        try {
            // Desactivamos planes viejos para que solo exista un plan 'Activo' a la vez
            $this->db->query(
                "UPDATE planes_equivalentes_periodo SET status = 'Inactivo' WHERE paciente_id = ?",
                [$pacienteId]
            );

            // Insertamos el nuevo plan
            $sql = "INSERT INTO planes_equivalentes_periodo 
                    (paciente_id, especialista_id, calorias_totales, proteinas_g, carbohidratos_g, grasas_g, recomendaciones, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')";
            
            $this->db->query($sql, [
                $pacienteId,
                $especialistaId,
                $calorias,
                $proteinas,
                $carbohidratos,
                $grasas,
                $recomendaciones
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error al guardar encabezado de equivalentes: " . $e->getMessage());
            throw new \Exception("Error en Modelo PlanEquivalente (Encabezado): " . $e->getMessage());
        }
    }

    /**
     * Guarda las porciones asignadas a un grupo específico en un plan
     */
    public function guardarPorcionDetalle($planEquivalenteId, $grupoAlimenticioId, $desayuno, $colacionMat, $comida, $colacionVesp, $cena)
    {
        try {
            $sql = "INSERT INTO plan_porciones_equivalentes 
                    (plan_equivalente_id, grupo_alimenticio_id, desayuno, colacion_matutina, comida, colacion_vespertina, cena) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $this->db->query($sql, [
                $planEquivalenteId,
                $grupoAlimenticioId,
                $desayuno,
                $colacionMat,
                $comida,
                $colacionVesp,
                $cena
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Error al guardar porciones detalle: " . $e->getMessage());
            throw new \Exception("Error en Modelo PlanEquivalente (Detalle): " . $e->getMessage());
        }
    }

    /**
     * Obtiene el plan por equivalentes activo de un paciente con todo su desglose
     */
    public function obtenerPlanActivoPorPaciente($pacienteId)
    {
        try {
            // 1. Obtener encabezado activo
            $sqlPlan = "SELECT * FROM planes_equivalentes_periodo WHERE paciente_id = ? AND status = 'Activo' LIMIT 1";
            $stmtPlan = $this->db->query($sqlPlan, [$pacienteId]);
            $plan = $stmtPlan->fetch(\PDO::FETCH_ASSOC);

            if (!$plan) {
                return null;
            }

            // 2. Obtener la cuadrícula de porciones ligada a ese plan
            $sqlDetalle = "SELECT p.*, g.nombre as nombre_grupo 
                           FROM plan_porciones_equivalentes p
                           -- Vinculamos con tu tabla existente de grupos (catálogo)
                           INNER JOIN equivalentes_planes g ON g.id = p.grupo_alimenticio_id
                           WHERE p.plan_equivalente_id = ?";
            
            $stmtDetalle = $this->db->query($sqlDetalle, [$plan['id']]);
            $plan['porciones'] = $stmtDetalle->fetchAll(\PDO::FETCH_ASSOC);

            return $plan;
        } catch (PDOException $e) {
            error_log("Error al obtener plan activo: " . $e->getMessage());
            throw new \Exception("Error al consultar el plan en el modelo: " . $e->getMessage());
        }
    }
}