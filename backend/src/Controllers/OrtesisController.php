<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Models\ChecklistProtesis;
use App\Utils\Response;
use App\Utils\Validator;

class OrtesisController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // =====================================================
    // NIVELES K
    // =====================================================

    /**
     * Obtener todos los niveles K
     */
    public function getNivelesK()
    {
        try {
            $niveles = $this->db->query(
                "SELECT * FROM niveles_k ORDER BY nivel"
            )->fetchAll();

            // Decodificar JSON
            foreach ($niveles as &$nivel) {
                $nivel['caracteristicas'] = json_decode($nivel['caracteristicas'], true);
                $nivel['actividades_permitidas'] = json_decode($nivel['actividades_permitidas'], true);
                $nivel['tipo_protesis_recomendada'] = json_decode($nivel['tipo_protesis_recomendada'], true);
            }

            return Response::success($niveles);
        } catch (\Exception $e) {
            error_log('Error getting niveles K: ' . $e->getMessage());
            return Response::error('Error al obtener niveles K', 500);
        }
    }

    /**
     * Obtener un nivel K específico
     */
    public function getNivelK($nivel)
    {
        try {
            $nivelData = $this->db->query(
                "SELECT * FROM niveles_k WHERE nivel = ?",
                [$nivel]
            )->fetch();

            if (!$nivelData) {
                return Response::error('Nivel K no encontrado', 404);
            }

            $nivelData['caracteristicas'] = json_decode($nivelData['caracteristicas'], true);
            $nivelData['actividades_permitidas'] = json_decode($nivelData['actividades_permitidas'], true);
            $nivelData['tipo_protesis_recomendada'] = json_decode($nivelData['tipo_protesis_recomendada'], true);

            return Response::success($nivelData);
        } catch (\Exception $e) {
            error_log('Error getting nivel K: ' . $e->getMessage());
            return Response::error('Error al obtener nivel K', 500);
        }
    }

    // =====================================================
    // TIPOS DE PRÓTESIS
    // =====================================================

    /**
     * Obtener todos los tipos de prótesis (usa tabla existente tipos_dispositivo)
     */
    public function getTiposProtesis($categoria = null)
    {
        try {
            $sql = "SELECT * FROM tipos_dispositivo WHERE categoria = 'protesis'";
            $params = [];

            $sql .= " ORDER BY nombre";

            $tipos = $this->db->query($sql, $params)->fetchAll();

            // Decodificar JSON si existen los campos
            foreach ($tipos as &$tipo) {
                if (isset($tipo['componentes'])) {
                    $tipo['componentes'] = json_decode($tipo['componentes'], true);
                }
                if (isset($tipo['ventajas'])) {
                    $tipo['ventajas'] = json_decode($tipo['ventajas'], true);
                }
                if (isset($tipo['desventajas'])) {
                    $tipo['desventajas'] = json_decode($tipo['desventajas'], true);
                }
                if (isset($tipo['cuidados_especificos'])) {
                    $tipo['cuidados_especificos'] = json_decode($tipo['cuidados_especificos'], true);
                }
            }

            return Response::success($tipos);
        } catch (\Exception $e) {
            error_log('Error getting tipos protesis: ' . $e->getMessage());
            return Response::error('Error al obtener tipos de prótesis', 500);
        }
    }

    /**
     * Obtener un tipo de prótesis específico (usa tabla existente tipos_dispositivo)
     */
    public function getTipoProtesis($id)
    {
        try {
            $tipo = $this->db->query(
                "SELECT * FROM tipos_dispositivo WHERE id = ? AND categoria = 'protesis'",
                [$id]
            )->fetch();

            if (!$tipo) {
                return Response::error('Tipo de prótesis no encontrado', 404);
            }

            if (isset($tipo['componentes'])) {
                $tipo['componentes'] = json_decode($tipo['componentes'], true);
            }
            if (isset($tipo['ventajas'])) {
                $tipo['ventajas'] = json_decode($tipo['ventajas'], true);
            }
            if (isset($tipo['desventajas'])) {
                $tipo['desventajas'] = json_decode($tipo['desventajas'], true);
            }
            if (isset($tipo['cuidados_especificos'])) {
                $tipo['cuidados_especificos'] = json_decode($tipo['cuidados_especificos'], true);
            }

            return Response::success($tipo);
        } catch (\Exception $e) {
            error_log('Error getting tipo protesis: ' . $e->getMessage());
            return Response::error('Error al obtener tipo de prótesis', 500);
        }
    }

    /**
     * Obtener categorías de prótesis disponibles
     */
    public function getCategoriasProtesis()
    {
        $categorias = [
            ['id' => 'transtibial', 'nombre' => 'Transtibial (Debajo de rodilla)', 'descripcion' => 'Amputaciones por debajo de la rodilla'],
            ['id' => 'transfemoral', 'nombre' => 'Transfemoral (Arriba de rodilla)', 'descripcion' => 'Amputaciones por encima de la rodilla'],
            ['id' => 'desarticulacion_rodilla', 'nombre' => 'Desarticulación de Rodilla', 'descripcion' => 'Amputación a nivel de la articulación de rodilla'],
            ['id' => 'desarticulacion_cadera', 'nombre' => 'Desarticulación de Cadera', 'descripcion' => 'Amputación a nivel de la cadera'],
            ['id' => 'parcial_pie', 'nombre' => 'Pie Parcial', 'descripcion' => 'Amputaciones parciales del pie'],
            ['id' => 'miembro_superior', 'nombre' => 'Miembro Superior', 'descripcion' => 'Prótesis de brazo y mano']
        ];

        return Response::success($categorias);
    }

    // =====================================================
    // GUÍAS DE CUIDADO
    // =====================================================

    /**
     * Obtener todas las guías de cuidado (usa tabla existente guias_cuidado)
     */
    public function getGuias($categoria = null)
    {
        try {
            $sql = "SELECT * FROM guias_cuidado WHERE 1=1";
            $params = [];

            if ($categoria) {
                $sql .= " AND categoria = ?";
                $params[] = $categoria;
            }

            $sql .= " ORDER BY orden, titulo";

            $guias = $this->db->query($sql, $params)->fetchAll();

            // Decodificar JSON si existen los campos
            foreach ($guias as &$guia) {
                if (isset($guia['pasos'])) {
                    $guia['pasos'] = json_decode($guia['pasos'], true);
                }
                if (isset($guia['tips'])) {
                    $guia['tips'] = json_decode($guia['tips'], true);
                }
                if (isset($guia['advertencias'])) {
                    $guia['advertencias'] = json_decode($guia['advertencias'], true);
                }
                if (isset($guia['nivel_k_aplicable'])) {
                    $guia['nivel_k_aplicable'] = json_decode($guia['nivel_k_aplicable'], true);
                }
            }

            return Response::success($guias);
        } catch (\Exception $e) {
            error_log('Error getting guias: ' . $e->getMessage());
            return Response::error('Error al obtener guías', 500);
        }
    }

    /**
     * Obtener una guía específica (usa tabla existente guias_cuidado)
     */
    public function getGuia($id)
    {
        try {
            $guia = $this->db->query(
                "SELECT * FROM guias_cuidado WHERE id = ?",
                [$id]
            )->fetch();

            if (!$guia) {
                return Response::error('Guía no encontrada', 404);
            }

            if (isset($guia['pasos'])) {
                $guia['pasos'] = json_decode($guia['pasos'], true);
            }
            if (isset($guia['tips'])) {
                $guia['tips'] = json_decode($guia['tips'], true);
            }
            if (isset($guia['advertencias'])) {
                $guia['advertencias'] = json_decode($guia['advertencias'], true);
            }
            if (isset($guia['nivel_k_aplicable'])) {
                $guia['nivel_k_aplicable'] = json_decode($guia['nivel_k_aplicable'], true);
            }

            return Response::success($guia);
        } catch (\Exception $e) {
            error_log('Error getting guia: ' . $e->getMessage());
            return Response::error('Error al obtener guía', 500);
        }
    }

    /**
     * Obtener categorías de guías disponibles
     */
    public function getCategoriasGuias()
    {
        $categorias = [
            ['id' => 'cuidado_munon', 'nombre' => 'Cuidado del Muñón', 'icon' => '🦵'],
            ['id' => 'limpieza_protesis', 'nombre' => 'Limpieza de Prótesis', 'icon' => '🧼'],
            ['id' => 'colocacion', 'nombre' => 'Colocación', 'icon' => '👟'],
            ['id' => 'uso_diario', 'nombre' => 'Uso Diario', 'icon' => '📅'],
            ['id' => 'mantenimiento', 'nombre' => 'Mantenimiento', 'icon' => '🔧'],
            ['id' => 'emergencias', 'nombre' => 'Emergencias y Alertas', 'icon' => '⚠️'],
            ['id' => 'ejercicios', 'nombre' => 'Ejercicios', 'icon' => '💪'],
            ['id' => 'general', 'nombre' => 'General', 'icon' => '📚']
        ];

        return Response::success($categorias);
    }

    // =====================================================
    // PREGUNTAS FRECUENTES
    // =====================================================

    /**
     * Obtener todas las FAQs de prótesis
     */
    public function getFAQs($categoria = null)
    {
        try {
            $sql = "SELECT * FROM faq_protesis WHERE activo = 1";
            $params = [];

            if ($categoria) {
                $sql .= " AND categoria = ?";
                $params[] = $categoria;
            }

            $sql .= " ORDER BY orden, pregunta";

            $faqs = $this->db->query($sql, $params)->fetchAll();

            return Response::success($faqs);
        } catch (\Exception $e) {
            error_log('Error getting FAQs: ' . $e->getMessage());
            return Response::error('Error al obtener preguntas frecuentes', 500);
        }
    }

    // =====================================================
    // VIDEOS EDUCATIVOS
    // =====================================================

    /**
     * Obtener todos los videos educativos
     */
    public function getVideos($categoria = null)
    {
        try {
            $sql = "SELECT * FROM videos_educativos_protesis WHERE activo = 1";
            $params = [];

            if ($categoria) {
                $sql .= " AND categoria = ?";
                $params[] = $categoria;
            }

            $sql .= " ORDER BY orden, titulo";

            $videos = $this->db->query($sql, $params)->fetchAll();

            foreach ($videos as &$video) {
                $video['nivel_k_aplicable'] = json_decode($video['nivel_k_aplicable'], true);
            }

            return Response::success($videos);
        } catch (\Exception $e) {
            error_log('Error getting videos: ' . $e->getMessage());
            return Response::error('Error al obtener videos', 500);
        }
    }

    // =====================================================
    // INFORMACIÓN DEL DISPOSITIVO DEL PACIENTE
    // =====================================================

    /**
     * Obtener información del dispositivo de un paciente (usa tablas existentes)
     */
    public function getDispositivo($pacienteId)
    {
        try {
            $dispositivo = $this->db->query(
                "SELECT dp.*, td.nombre as tipo_protesis_nombre, td.categoria,
                        td.cuidados_especificos, td.componentes, td.ventajas, td.desventajas
                 FROM dispositivos_paciente dp
                 LEFT JOIN tipos_dispositivo td ON dp.tipo_dispositivo_id = td.id
                 WHERE dp.paciente_id = ? AND dp.activo = 1
                 LIMIT 1",
                [$pacienteId]
            )->fetch();

            if (!$dispositivo) {
                // Retornar datos por defecto si no tiene dispositivo registrado
                return Response::success([
                    'tiene_dispositivo' => false,
                    'mensaje' => 'No hay dispositivo registrado. Tu especialista registrará tu prótesis.'
                ]);
            }

            if (!empty($dispositivo['cuidados_especificos'])) {
                $dispositivo['cuidados_especificos'] = json_decode($dispositivo['cuidados_especificos'], true);
            }
            if (!empty($dispositivo['componentes'])) {
                $dispositivo['componentes'] = json_decode($dispositivo['componentes'], true);
            }
            if (!empty($dispositivo['ventajas'])) {
                $dispositivo['ventajas'] = json_decode($dispositivo['ventajas'], true);
            }
            if (!empty($dispositivo['desventajas'])) {
                $dispositivo['desventajas'] = json_decode($dispositivo['desventajas'], true);
            }

            $dispositivo['tiene_dispositivo'] = true;

            return Response::success($dispositivo);
        } catch (\Exception $e) {
            error_log('Error getting dispositivo: ' . $e->getMessage());
            return Response::error('Error al obtener información del dispositivo', 500);
        }
    }

    /**
     * Actualizar nivel K del paciente (solo especialista)
     */
    public function actualizarNivelK($pacienteId, $data)
    {
        try {
            $validator = new Validator($data);
            $validator->required(['nivel_k'])->in('nivel_k', ['K0', 'K1', 'K2', 'K3', 'K4']);

            if (!$validator->passes()) {
                return Response::error($validator->errors(), 422);
            }

            $this->db->query(
                "UPDATE dispositivos_paciente
                 SET nivel_k = ?, fecha_evaluacion_k = CURDATE(), updated_at = NOW()
                 WHERE paciente_id = ?",
                [$data['nivel_k'], $pacienteId]
            );

            return Response::success(null, 'Nivel K actualizado exitosamente');
        } catch (\Exception $e) {
            error_log('Error updating nivel K: ' . $e->getMessage());
            return Response::error('Error al actualizar nivel K', 500);
        }
    }

    // =====================================================
    // CHECKLIST DE PRÓTESIS
    // =====================================================

    public function getChecklist($pacienteId, $fecha = null)
    {
        $checklist = ChecklistProtesis::getByPaciente($pacienteId, $fecha);
        return Response::success($checklist);
    }

    // =====================================================
    // HISTORIAL DE AJUSTES
    // =====================================================

    public function getAjustes($pacienteId)
    {
        try {
            $ajustes = $this->db->query(
                "SELECT ha.*, u.nombre_completo as especialista_nombre
                 FROM historial_ajustes ha
                 INNER JOIN dispositivos_paciente dp ON ha.dispositivo_id = dp.id
                 LEFT JOIN usuarios u ON ha.realizado_por = u.id
                 WHERE dp.paciente_id = ?
                 ORDER BY ha.fecha_ajuste DESC",
                [$pacienteId]
            )->fetchAll();

            return Response::success($ajustes);
        } catch (\Exception $e) {
            error_log('Error getting ajustes: ' . $e->getMessage());
            return Response::error('Error al obtener ajustes', 500);
        }
    }

    /**
     * Crear un nuevo ajuste (solo especialista)
     */
    public function crearAjuste($pacienteId, $data)
    {
        try {
            $validator = new Validator($data);
            $validator->required(['tipo_ajuste', 'descripcion']);

            if (!$validator->passes()) {
                return Response::error($validator->errors(), 422);
            }

            // Obtener dispositivo del paciente
            $dispositivo = $this->db->query(
                "SELECT id FROM dispositivos_paciente WHERE paciente_id = ? AND activo = 1 LIMIT 1",
                [$pacienteId]
            )->fetch();

            if (!$dispositivo) {
                return Response::error('El paciente no tiene un dispositivo registrado', 404);
            }

            $user = \App\Middleware\AuthMiddleware::getCurrentUser();

            $this->db->query(
                "INSERT INTO historial_ajustes (dispositivo_id, tipo_ajuste, descripcion, realizado_por, fecha_ajuste, notas)
                 VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $dispositivo['id'],
                    $data['tipo_ajuste'],
                    $data['descripcion'],
                    $user['id'],
                    $data['fecha_ajuste'] ?? date('Y-m-d'),
                    $data['notas'] ?? null
                ]
            );

            $id = $this->db->lastInsertId();

            return Response::success(['id' => $id], 'Ajuste registrado exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error creating ajuste: ' . $e->getMessage());
            return Response::error('Error al registrar ajuste', 500);
        }
    }

    // =====================================================
    // REPORTAR PROBLEMAS
    // =====================================================

    public function getProblemas($pacienteId)
    {
        try {
            $problemas = $this->db->query(
                "SELECT rp.*, u.nombre_completo as atendido_por_nombre
                 FROM reportes_problemas rp
                 LEFT JOIN usuarios u ON rp.atendido_por = u.id
                 WHERE rp.paciente_id = ?
                 ORDER BY rp.created_at DESC",
                [$pacienteId]
            )->fetchAll();

            return Response::success($problemas);
        } catch (\Exception $e) {
            error_log('Error getting problemas: ' . $e->getMessage());
            return Response::error('Error al obtener problemas', 500);
        }
    }

    public function reportarProblema($data)
    {
        try {
            $validator = new Validator($data);
            $validator->required(['paciente_id', 'descripcion', 'severidad']);

            if (!$validator->passes()) {
                return Response::error($validator->errors(), 422);
            }

            // Obtener dispositivo del paciente
            $dispositivo = $this->db->query(
                "SELECT id FROM dispositivos_paciente WHERE paciente_id = ? AND activo = 1 LIMIT 1",
                [$data['paciente_id']]
            )->fetch();

            $this->db->query(
                "INSERT INTO reportes_problemas (dispositivo_id, paciente_id, descripcion, severidad, estado, fecha_reporte)
                 VALUES (?, ?, ?, ?, 'pendiente', CURDATE())",
                [
                    $dispositivo['id'] ?? null,
                    $data['paciente_id'],
                    $data['descripcion'],
                    $data['severidad'] ?? 'leve'
                ]
            );

            $id = $this->db->lastInsertId();

            return Response::success(['id' => $id], 'Problema reportado exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error reporting problema: ' . $e->getMessage());
            return Response::error('Error al reportar problema', 500);
        }
    }

    /**
     * Resolver un problema reportado (solo especialista)
     */
    public function resolverProblema($problemaId, $data)
    {
        try {
            $user = \App\Middleware\AuthMiddleware::getCurrentUser();

            $this->db->query(
                "UPDATE reportes_problemas
                 SET estado = 'resuelto', fecha_resolucion = CURDATE(), notas_resolucion = ?, atendido_por = ?, updated_at = NOW()
                 WHERE id = ?",
                [
                    $data['notas_resolucion'] ?? null,
                    $user['id'],
                    $problemaId
                ]
            );

            return Response::success(null, 'Problema marcado como resuelto');
        } catch (\Exception $e) {
            error_log('Error resolving problema: ' . $e->getMessage());
            return Response::error('Error al resolver problema', 500);
        }
    }

    /**
     * Obtener historial de checklist de un paciente
     */
    public function getChecklistHistorial($pacienteId)
    {
        try {
            $checklist = $this->db->query(
                "SELECT * FROM checklist_protesis
                 WHERE paciente_id = ?
                 ORDER BY fecha DESC
                 LIMIT 30",
                [$pacienteId]
            )->fetchAll();

            return Response::success($checklist);
        } catch (\Exception $e) {
            error_log('Error getting checklist historial: ' . $e->getMessage());
            return Response::error('Error al obtener historial de checklist', 500);
        }
    }

    // =====================================================
    // MEDICIONES DEL MUÑÓN
    // =====================================================

    public function getMedicionesMunon($pacienteId)
    {
        try {
            $mediciones = $this->db->query(
                "SELECT mm.*, u.nombre_completo as especialista_nombre
                 FROM mediciones_munon mm
                 LEFT JOIN usuarios u ON mm.registrado_por = u.id
                 WHERE mm.paciente_id = ?
                 ORDER BY mm.fecha DESC",
                [$pacienteId]
            )->fetchAll();

            return Response::success($mediciones);
        } catch (\Exception $e) {
            error_log('Error getting mediciones munon: ' . $e->getMessage());
            return Response::error('Error al obtener mediciones', 500);
        }
    }

    public function crearMedicionMunon($pacienteId, $data)
    {
        try {
            $user = \App\Middleware\AuthMiddleware::getCurrentUser();

            $this->db->query(
                "INSERT INTO mediciones_munon
                 (paciente_id, fecha, circunferencia_proximal, circunferencia_media, circunferencia_distal,
                  longitud, condicion_piel, temperatura_local, sensibilidad, notas, registrado_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $pacienteId,
                    $data['fecha'] ?? date('Y-m-d'),
                    $data['circunferencia_proximal'] ?? null,
                    $data['circunferencia_media'] ?? null,
                    $data['circunferencia_distal'] ?? null,
                    $data['longitud'] ?? null,
                    $data['condicion_piel'] ?? 'sana',
                    $data['temperatura_local'] ?? null,
                    $data['sensibilidad'] ?? 'normal',
                    $data['notas'] ?? null,
                    $user['id']
                ]
            );

            $id = $this->db->lastInsertId();
            return Response::success(['id' => $id], 'Medición registrada exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error creating medicion munon: ' . $e->getMessage());
            return Response::error('Error al registrar medición', 500);
        }
    }

    // =====================================================
    // PROTOCOLO DE USO PROGRESIVO
    // =====================================================

    public function getProtocoloUsoRegistros($pacienteId)
    {
        try {
            $registros = $this->db->query(
                "SELECT * FROM protocolo_uso_registros
                 WHERE paciente_id = ?
                 ORDER BY fecha DESC
                 LIMIT 60",
                [$pacienteId]
            )->fetchAll();

            return Response::success($registros);
        } catch (\Exception $e) {
            error_log('Error getting protocolo uso: ' . $e->getMessage());
            return Response::error('Error al obtener registros de uso', 500);
        }
    }

    public function crearRegistroUso($pacienteId, $data)
    {
        try {
            $this->db->query(
                "INSERT INTO protocolo_uso_registros
                 (paciente_id, fecha, horas_uso, dolor_nivel, molestias, actividades_realizadas, tolerancia)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 horas_uso = VALUES(horas_uso), dolor_nivel = VALUES(dolor_nivel),
                 molestias = VALUES(molestias), actividades_realizadas = VALUES(actividades_realizadas),
                 tolerancia = VALUES(tolerancia), updated_at = NOW()",
                [
                    $pacienteId,
                    $data['fecha'] ?? date('Y-m-d'),
                    $data['horas_uso'],
                    $data['dolor_nivel'] ?? 0,
                    $data['molestias'] ?? null,
                    $data['actividades_realizadas'] ?? null,
                    $data['tolerancia'] ?? 'buena'
                ]
            );

            $id = $this->db->lastInsertId();
            return Response::success(['id' => $id], 'Registro guardado exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error creating registro uso: ' . $e->getMessage());
            return Response::error('Error al guardar registro', 500);
        }
    }

    public function getProtocoloConfig($pacienteId)
    {
        try {
            $config = $this->db->query(
                "SELECT * FROM protocolo_uso_config WHERE paciente_id = ? LIMIT 1",
                [$pacienteId]
            )->fetch();

            return Response::success($config);
        } catch (\Exception $e) {
            error_log('Error getting protocolo config: ' . $e->getMessage());
            return Response::error('Error al obtener configuración', 500);
        }
    }

    public function guardarProtocoloConfig($pacienteId, $data)
    {
        try {
            $user = \App\Middleware\AuthMiddleware::getCurrentUser();

            $this->db->query(
                "INSERT INTO protocolo_uso_config
                 (paciente_id, semana_actual, horas_objetivo, incremento_semanal, horas_maximo, notas, creado_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 semana_actual = VALUES(semana_actual), horas_objetivo = VALUES(horas_objetivo),
                 incremento_semanal = VALUES(incremento_semanal), horas_maximo = VALUES(horas_maximo),
                 notas = VALUES(notas), updated_at = NOW()",
                [
                    $pacienteId,
                    $data['semana_actual'] ?? 1,
                    $data['horas_objetivo'] ?? 2,
                    $data['incremento_semanal'] ?? 1,
                    $data['horas_maximo'] ?? 12,
                    $data['notas'] ?? null,
                    $user['id']
                ]
            );

            return Response::success(null, 'Protocolo guardado exitosamente');
        } catch (\Exception $e) {
            error_log('Error saving protocolo config: ' . $e->getMessage());
            return Response::error('Error al guardar protocolo', 500);
        }
    }

    // =====================================================
    // CONTENIDO EDUCATIVO COMPLETO
    // =====================================================

    /**
     * Obtener todo el contenido educativo organizado (usa tablas existentes adaptadas)
     */
    public function getContenidoEducativo()
    {
        try {
            // Niveles K (tabla nueva)
            $nivelesK = $this->db->query("SELECT * FROM niveles_k ORDER BY nivel")->fetchAll();
            foreach ($nivelesK as &$nivel) {
                $nivel['caracteristicas'] = json_decode($nivel['caracteristicas'], true);
                $nivel['actividades_permitidas'] = json_decode($nivel['actividades_permitidas'], true);
                $nivel['tipo_protesis_recomendada'] = json_decode($nivel['tipo_protesis_recomendada'], true);
            }

            // Tipos de prótesis (usa tabla existente tipos_dispositivo)
            $tiposProtesis = $this->db->query(
                "SELECT * FROM tipos_dispositivo WHERE categoria = 'protesis' ORDER BY nombre"
            )->fetchAll();

            $tiposList = [];
            foreach ($tiposProtesis as $tipo) {
                if (isset($tipo['componentes'])) {
                    $tipo['componentes'] = json_decode($tipo['componentes'], true);
                }
                if (isset($tipo['ventajas'])) {
                    $tipo['ventajas'] = json_decode($tipo['ventajas'], true);
                }
                if (isset($tipo['desventajas'])) {
                    $tipo['desventajas'] = json_decode($tipo['desventajas'], true);
                }
                if (isset($tipo['cuidados_especificos'])) {
                    $tipo['cuidados_especificos'] = json_decode($tipo['cuidados_especificos'], true);
                }
                $tiposList[] = $tipo;
            }

            // Guías de cuidado (usa tabla existente guias_cuidado)
            $guias = $this->db->query(
                "SELECT * FROM guias_cuidado ORDER BY orden, titulo"
            )->fetchAll();

            $guiasPorCategoria = [];
            foreach ($guias as $guia) {
                if (isset($guia['pasos'])) {
                    $guia['pasos'] = json_decode($guia['pasos'], true);
                }
                if (isset($guia['tips'])) {
                    $guia['tips'] = json_decode($guia['tips'], true);
                }
                if (isset($guia['advertencias'])) {
                    $guia['advertencias'] = json_decode($guia['advertencias'], true);
                }
                if (isset($guia['nivel_k_aplicable'])) {
                    $guia['nivel_k_aplicable'] = json_decode($guia['nivel_k_aplicable'], true);
                }
                $cat = $guia['categoria'] ?? 'general';
                $guiasPorCategoria[$cat][] = $guia;
            }

            // FAQs (tabla nueva)
            $faqs = $this->db->query(
                "SELECT * FROM faq_protesis WHERE activo = 1 ORDER BY orden"
            )->fetchAll();

            // Videos (tabla nueva)
            $videos = $this->db->query(
                "SELECT * FROM videos_educativos_protesis WHERE activo = 1 ORDER BY orden"
            )->fetchAll();
            foreach ($videos as &$video) {
                $video['nivel_k_aplicable'] = json_decode($video['nivel_k_aplicable'], true);
            }

            return Response::success([
                'niveles_k' => $nivelesK,
                'tipos_protesis' => $tiposList,
                'guias_cuidado' => $guiasPorCategoria,
                'faqs' => $faqs,
                'videos' => $videos
            ]);
        } catch (\Exception $e) {
            error_log('Error getting contenido educativo: ' . $e->getMessage());
            return Response::error('Error al obtener contenido educativo', 500);
        }
    }
}
