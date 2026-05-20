<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Services\EmailService;
use App\Utils\Validator;

class AdmisionesController
{
    private $db;
    private $emailService;
    private $uploadDir;
    private $docsOficialesDir;
    private $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc'];
    private $maxFileSize = 10485760; // 10MB

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
        $this->emailService = new EmailService();
        $this->uploadDir = __DIR__ . '/../../uploads/admisiones/';
        $this->docsOficialesDir = __DIR__ . '/../../uploads/documentos_oficiales/';
    }

    // =====================================================
    // MÉTODOS PÚBLICOS (sin auth)
    // =====================================================

    /**
     * Crear nueva solicitud de admisión (formulario público)
     */
    public function crearSolicitud($data)
    {
        $validator = new Validator($data);
        $validator->required([
            'nombre_completo', 'telefono', 'edad', 'sexo',
            'ciudad', 'estado_procedencia', 'tipo_servicio',
            'tipo_amputacion', 'causa_amputacion'
        ]);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        try {
            $mes = (int)date('m');
            $anio = date('Y');
            $semestre = $anio . '-' . ($mes <= 6 ? '1' : '2');

            $this->db->query(
                "INSERT INTO solicitudes_admision
                 (nombre_completo, telefono, email, edad, sexo, ciudad, estado_procedencia,
                  tipo_servicio, tipo_amputacion, causa_amputacion, tiene_protesis_previa,
                  tiempo_desde_amputacion, herida_consolidada, herida_infeccion, padece_cronico,
                  notas_clinicas, semestre)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $data['nombre_completo'],
                    $data['telefono'],
                    $data['email'] ?? null,
                    (int)$data['edad'],
                    $data['sexo'],
                    $data['ciudad'],
                    $data['estado_procedencia'],
                    $data['tipo_servicio'],
                    $data['tipo_amputacion'],
                    $data['causa_amputacion'],
                    $data['tiene_protesis_previa'] ?? 0,
                    $data['tiempo_desde_amputacion'] ?? null,
                    $data['herida_consolidada'] ?? null,
                    $data['herida_infeccion'] ?? null,
                    $data['padece_cronico'] ?? null,
                    $data['notas_clinicas'] ?? null,
                    $semestre
                ]
            );

            $id = $this->db->lastInsertId();
            $folio = 'SOL-' . str_pad($id, 5, '0', STR_PAD_LEFT);

            // Enviar correo de confirmación
            try {
                $this->emailService->sendAdmisionSolicitudRecibida([
                    'id' => $id,
                    'nombre_completo' => $data['nombre_completo'],
                    'email' => $data['email'] ?? null
                ]);
            } catch (\Exception $emailErr) {
                error_log('Error enviando email de solicitud recibida: ' . $emailErr->getMessage());
            }

            return Response::success([
                'id' => $id,
                'folio' => $folio
            ], 'Solicitud registrada exitosamente. Tu folio es ' . $folio, 201);
        } catch (\Exception $e) {
            error_log('Error creating solicitud: ' . $e->getMessage());
            return Response::error('Error al registrar la solicitud', 500);
        }
    }

    /**
     * Subir documento por token público
     */
    public function subirDocumentoPorToken($token)
    {
        try {
            $solicitud = $this->db->query(
                "SELECT id, estado FROM solicitudes_admision
                 WHERE token_documentos = ? AND token_expira_en > NOW()",
                [$token]
            )->fetch();

            if (!$solicitud) {
                return Response::error('Enlace inválido o expirado', 403);
            }

            if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
                return Response::error('No se recibió el archivo', 400);
            }

            $categoria = $_POST['categoria'] ?? 'otro';
            $file = $_FILES['archivo'];

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $this->allowedExtensions)) {
                return Response::error('Tipo de archivo no permitido. Usa: ' . implode(', ', $this->allowedExtensions), 400);
            }

            if ($file['size'] > $this->maxFileSize) {
                return Response::error('El archivo excede el tamaño máximo de 10MB', 400);
            }

            $dir = $this->uploadDir . $solicitud['id'] . '/';
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $nombreArchivo = 'adm_' . $solicitud['id'] . '_' . time() . '_' . uniqid() . '.' . $ext;
            $rutaDestino = $dir . $nombreArchivo;

            if (!move_uploaded_file($file['tmp_name'], $rutaDestino)) {
                return Response::error('Error al guardar el archivo', 500);
            }

            $this->db->query(
                "INSERT INTO documentos_admision (solicitud_id, nombre_original, nombre_archivo, tipo_archivo, tamano, categoria)
                 VALUES (?, ?, ?, ?, ?, ?)",
                [
                    $solicitud['id'],
                    $file['name'],
                    $nombreArchivo,
                    $ext,
                    $file['size'],
                    $categoria
                ]
            );

            // Verificar si ya se subieron las 3 categorías requeridas
            $categorias = $this->db->query(
                "SELECT DISTINCT categoria FROM documentos_admision WHERE solicitud_id = ?",
                [$solicitud['id']]
            )->fetchAll();

            $cats = array_column($categorias, 'categoria');
            $completo = in_array('laboratorios', $cats) && in_array('radiografias', $cats) && in_array('comprobante_domicilio', $cats);

            if ($completo && in_array($solicitud['estado'], ['documentos_pendientes', 'pago_confirmado'])) {
                $this->db->query(
                    "UPDATE solicitudes_admision SET estado = 'documentos_recibidos', updated_at = NOW() WHERE id = ?",
                    [$solicitud['id']]
                );
                // Enviar email de documentos recibidos
                $solCompleta = $this->db->query("SELECT * FROM solicitudes_admision WHERE id = ?", [$solicitud['id']])->fetch();
                if ($solCompleta) {
                    $this->emailService->sendAdmisionDocumentosRecibidos($solCompleta);
                }
            }

            return Response::success([
                'id' => $this->db->lastInsertId(),
                'documentos_completos' => $completo
            ], 'Documento subido exitosamente', 201);
        } catch (\Exception $e) {
            error_log('Error uploading document: ' . $e->getMessage());
            return Response::error('Error al subir el documento', 500);
        }
    }

    /**
     * Ver documentos ya subidos por token
     */
    public function getDocumentosPorToken($token)
    {
        try {
            $solicitud = $this->db->query(
                "SELECT id, nombre_completo, estado, token_expira_en FROM solicitudes_admision
                 WHERE token_documentos = ? AND token_expira_en > NOW()",
                [$token]
            )->fetch();

            if (!$solicitud) {
                return Response::error('Enlace inválido o expirado', 403);
            }

            $documentos = $this->db->query(
                "SELECT id, nombre_original, tipo_archivo, tamano, categoria, created_at
                 FROM documentos_admision WHERE solicitud_id = ?
                 ORDER BY created_at DESC",
                [$solicitud['id']]
            )->fetchAll();

            return Response::success([
                'solicitud' => [
                    'nombre' => $solicitud['nombre_completo'],
                    'estado' => $solicitud['estado'],
                    'expira_en' => $solicitud['token_expira_en']
                ],
                'documentos' => $documentos
            ]);
        } catch (\Exception $e) {
            error_log('Error getting documents: ' . $e->getMessage());
            return Response::error('Error al obtener documentos', 500);
        }
    }

    /**
     * Obtener documentos oficiales activos (público)
     */
    public function getDocumentosOficiales()
    {
        try {
            $docs = $this->db->query(
                "SELECT id, tipo, nombre_original, nombre_archivo, version
                 FROM documentos_oficiales WHERE activo = 1
                 ORDER BY FIELD(tipo, 'reglamento', 'aviso_privacidad', 'consentimiento')"
            )->fetchAll();

            return Response::success($docs);
        } catch (\Exception $e) {
            error_log('Error getting official docs: ' . $e->getMessage());
            return Response::error('Error al obtener documentos', 500);
        }
    }

    /**
     * Descargar documento oficial por ID (público)
     */
    public function descargarDocumentoOficial($id)
    {
        try {
            $doc = $this->db->query(
                "SELECT nombre_original, nombre_archivo FROM documentos_oficiales WHERE id = ? AND activo = 1",
                [$id]
            )->fetch();

            if (!$doc) {
                return Response::error('Documento no encontrado', 404);
            }

            $filePath = $this->docsOficialesDir . $doc['nombre_archivo'];

            if (!file_exists($filePath)) {
                return Response::error('Archivo no encontrado en el servidor', 404);
            }

            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
            header('Content-Length: ' . filesize($filePath));
            header('Content-Disposition: inline; filename="' . $doc['nombre_original'] . '"');
            header('Cache-Control: public, max-age=86400');
            readfile($filePath);
            exit;
        } catch (\Exception $e) {
            error_log('Error downloading doc oficial: ' . $e->getMessage());
            return Response::error('Error al descargar documento', 500);
        }
    }

    /**
     * Consultar estatus de solicitud (público - con folio + email o teléfono)
     */
    public function consultarEstatus($data)
    {
        $folio = $data['folio'] ?? '';
        $contacto = $data['contacto'] ?? '';

        if (empty($folio) || empty($contacto)) {
            return Response::error('Ingresa tu folio y correo o teléfono', 422);
        }

        // Extraer ID numérico del folio (SOL-00001 → 1)
        $id = (int)preg_replace('/[^0-9]/', '', $folio);

        if ($id <= 0) {
            return Response::error('Folio inválido', 422);
        }

        try {
            $solicitud = $this->db->query(
                "SELECT id, nombre_completo, estado, tipo_servicio,
                        token_documentos, token_expira_en,
                        fecha_preconsulta, hora_preconsulta,
                        created_at
                 FROM solicitudes_admision
                 WHERE id = ? AND (email = ? OR telefono = ?)",
                [$id, $contacto, $contacto]
            )->fetch();

            if (!$solicitud) {
                return Response::error('No se encontró una solicitud con esos datos', 404);
            }

            // Datos de documentos subidos
            $docs = $this->db->query(
                "SELECT categoria, nombre_original, created_at
                 FROM documentos_admision WHERE solicitud_id = ?",
                [$solicitud['id']]
            )->fetchAll();

            // Verificar si token de docs sigue vigente
            $tokenActivo = false;
            if ($solicitud['token_documentos'] && $solicitud['token_expira_en']) {
                $tokenActivo = strtotime($solicitud['token_expira_en']) > time();
            }

            $response = [
                'folio' => 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT),
                'nombre' => $solicitud['nombre_completo'],
                'estado' => $solicitud['estado'],
                'tipo_servicio' => $solicitud['tipo_servicio'],
                'fecha_solicitud' => $solicitud['created_at'],
                'documentos' => $docs,
                'token_documentos' => $tokenActivo ? $solicitud['token_documentos'] : null,
                'fecha_preconsulta' => $solicitud['fecha_preconsulta'],
                'hora_preconsulta' => $solicitud['hora_preconsulta']
            ];

            return Response::success($response);
        } catch (\Exception $e) {
            error_log('Error consultando estatus: ' . $e->getMessage());
            return Response::error('Error al consultar el estatus', 500);
        }
    }

    // =====================================================
    // MÉTODOS ADMIN
    // =====================================================

    /**
     * Listar solicitudes con filtros
     */
    public function getSolicitudes($filtros)
    {
        try {
            $sql = "SELECT sa.*,
                    (SELECT COUNT(*) FROM documentos_admision da WHERE da.solicitud_id = sa.id) as total_documentos,
                    (SELECT pa.estado FROM pagos_admision pa WHERE pa.solicitud_id = sa.id ORDER BY pa.id DESC LIMIT 1) as pago_estado
                    FROM solicitudes_admision sa WHERE 1=1";
            $params = [];

            if (!empty($filtros['estado']) && $filtros['estado'] !== 'todos') {
                $sql .= " AND sa.estado = ?";
                $params[] = $filtros['estado'];
            }

            if (!empty($filtros['semestre'])) {
                $sql .= " AND sa.semestre = ?";
                $params[] = $filtros['semestre'];
            }

            if (!empty($filtros['busqueda'])) {
                $sql .= " AND (sa.nombre_completo LIKE ? OR sa.telefono LIKE ? OR sa.email LIKE ?)";
                $busqueda = '%' . $filtros['busqueda'] . '%';
                $params[] = $busqueda;
                $params[] = $busqueda;
                $params[] = $busqueda;
            }

            $sql .= " ORDER BY sa.created_at DESC";

            $solicitudes = $this->db->query($sql, $params)->fetchAll();

            return Response::success($solicitudes);
        } catch (\Exception $e) {
            error_log('Error getting solicitudes: ' . $e->getMessage());
            return Response::error('Error al obtener solicitudes', 500);
        }
    }

    /**
     * Detalle de una solicitud
     */
    public function getSolicitud($id)
    {
        try {
            $solicitud = $this->db->query(
                "SELECT sa.*, u_scr.nombre_completo as screening_por_nombre,
                        u_dec.nombre_completo as decision_por_nombre
                 FROM solicitudes_admision sa
                 LEFT JOIN usuarios u_scr ON sa.screening_por = u_scr.id
                 LEFT JOIN usuarios u_dec ON sa.decision_por = u_dec.id
                 WHERE sa.id = ?",
                [$id]
            )->fetch();

            if (!$solicitud) {
                return Response::error('Solicitud no encontrada', 404);
            }

            $documentos = $this->db->query(
                "SELECT * FROM documentos_admision WHERE solicitud_id = ? ORDER BY created_at DESC",
                [$id]
            )->fetchAll();

            $pagos = $this->db->query(
                "SELECT pa.*, u_env.nombre_completo as enviado_por_nombre,
                        u_conf.nombre_completo as confirmado_por_nombre
                 FROM pagos_admision pa
                 LEFT JOIN usuarios u_env ON pa.enviado_por = u_env.id
                 LEFT JOIN usuarios u_conf ON pa.confirmado_por = u_conf.id
                 WHERE pa.solicitud_id = ?
                 ORDER BY pa.created_at DESC",
                [$id]
            )->fetchAll();

            return Response::success([
                'solicitud' => $solicitud,
                'documentos' => $documentos,
                'pagos' => $pagos
            ]);
        } catch (\Exception $e) {
            error_log('Error getting solicitud: ' . $e->getMessage());
            return Response::error('Error al obtener solicitud', 500);
        }
    }

    /**
     * Descargar/previsualizar documento de admisión (admin)
     */
    public function descargarDocumentoAdmision($docId)
    {
        try {
            $doc = $this->db->query(
                "SELECT da.*, sa.id as sol_id FROM documentos_admision da
                 JOIN solicitudes_admision sa ON da.solicitud_id = sa.id
                 WHERE da.id = ?",
                [$docId]
            )->fetch();

            if (!$doc) {
                return Response::error('Documento no encontrado', 404);
            }

            $filePath = $this->uploadDir . $doc['solicitud_id'] . '/' . $doc['nombre_archivo'];

            if (!file_exists($filePath)) {
                return Response::error('Archivo no encontrado en el servidor', 404);
            }

            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
            header('Content-Length: ' . filesize($filePath));
            header('Content-Disposition: inline; filename="' . $doc['nombre_original'] . '"');
            header('Cache-Control: public, max-age=3600');
            readfile($filePath);
            exit;
        } catch (\Exception $e) {
            error_log('Error downloading admission doc: ' . $e->getMessage());
            return Response::error('Error al descargar documento', 500);
        }
    }

    /**
     * Actualizar estado de solicitud
     */
    public function actualizarEstado($id, $data)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();
            $nuevoEstado = $data['estado'] ?? null;

            if (!$nuevoEstado) {
                return Response::error('Estado requerido', 422);
            }

            $sql = "UPDATE solicitudes_admision SET estado = ?";
            $params = [$nuevoEstado];

            if (in_array($nuevoEstado, ['screening_aprobado', 'screening_rechazado'])) {
                $sql .= ", screening_notas = ?, screening_por = ?, screening_fecha = NOW()";
                $params[] = $data['notas'] ?? null;
                $params[] = $user['id'];
            }

            if ($nuevoEstado === 'preconsulta_completada') {
                $sql .= ", preconsulta_notas = ?";
                $params[] = $data['notas'] ?? null;
            }

            $sql .= ", updated_at = NOW() WHERE id = ?";
            $params[] = $id;

            $this->db->query($sql, $params);

            // Enviar email según el nuevo estado
            $solicitud = $this->db->query("SELECT * FROM solicitudes_admision WHERE id = ?", [$id])->fetch();
            if ($solicitud) {
                if ($nuevoEstado === 'screening_aprobado') {
                    $this->emailService->sendAdmisionScreeningAprobado($solicitud);
                } elseif ($nuevoEstado === 'preconsulta_completada') {
                    // No email específico aquí, admin decide admitir o rechazar
                }
            }

            return Response::success(null, 'Estado actualizado');
        } catch (\Exception $e) {
            error_log('Error updating estado: ' . $e->getMessage());
            return Response::error('Error al actualizar estado', 500);
        }
    }

    /**
     * Generar token para subida de documentos (72h)
     */
    public function generarTokenDocumentos($id)
    {
        try {
            $token = bin2hex(random_bytes(32));
            $expira = date('Y-m-d H:i:s', strtotime('+72 hours'));

            $this->db->query(
                "UPDATE solicitudes_admision
                 SET token_documentos = ?, token_expira_en = ?, estado = 'documentos_pendientes', updated_at = NOW()
                 WHERE id = ?",
                [$token, $expira, $id]
            );

            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';
            $link = $frontendUrl . '/admisiones/documentos/' . $token;

            return Response::success([
                'token' => $token,
                'link' => $link,
                'expira_en' => $expira
            ], 'Enlace generado. Válido por 72 horas.');
        } catch (\Exception $e) {
            error_log('Error generating token: ' . $e->getMessage());
            return Response::error('Error al generar enlace', 500);
        }
    }

    /**
     * Marcar como pagado - confirma pago, genera link de documentos y envía email
     * Nuevo flujo: Screening → Pago → Documentos
     */
    public function marcarPagado($id)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();

            $solicitud = $this->db->query(
                "SELECT * FROM solicitudes_admision WHERE id = ?", [$id]
            )->fetch();

            if (!$solicitud) {
                return Response::error('Solicitud no encontrada', 404);
            }

            // Registrar pago como confirmado directamente
            $this->db->query(
                "INSERT INTO pagos_admision (solicitud_id, referencia_pago, estado, enviado_por, confirmado_por, fecha_confirmacion)
                 VALUES (?, 'Confirmado por admin', 'confirmado', ?, ?, NOW())",
                [$id, $user['id'], $user['id']]
            );

            // Generar token de documentos automáticamente (72h)
            $token = bin2hex(random_bytes(32));
            $expira = date('Y-m-d H:i:s', strtotime('+72 hours'));

            $this->db->query(
                "UPDATE solicitudes_admision
                 SET estado = 'pago_confirmado', token_documentos = ?, token_expira_en = ?, updated_at = NOW()
                 WHERE id = ?",
                [$token, $expira, $id]
            );

            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://dtai.uteq.edu.mx/~azaria';
            $link = $frontendUrl . '/admisiones/documentos/' . $token;

            // Enviar email con link de documentos
            $this->emailService->sendAdmisionPagoConfirmado($solicitud, $link);

            return Response::success([
                'token' => $token,
                'link' => $link,
                'expira_en' => $expira
            ], 'Pago confirmado. Se envió email con enlace de documentos.');
        } catch (\Exception $e) {
            error_log('Error marking as paid: ' . $e->getMessage());
            return Response::error('Error al confirmar pago', 500);
        }
    }

    /**
     * Programar preconsulta
     */
    public function programarPreconsulta($id, $data)
    {
        try {
            if (empty($data['fecha']) || empty($data['hora'])) {
                return Response::error('Fecha y hora requeridas', 422);
            }

            $this->db->query(
                "UPDATE solicitudes_admision
                 SET fecha_preconsulta = ?, hora_preconsulta = ?, estado = 'preconsulta_programada', updated_at = NOW()
                 WHERE id = ?",
                [$data['fecha'], $data['hora'], $id]
            );

            // Enviar email de preconsulta programada
            $solicitud = $this->db->query("SELECT * FROM solicitudes_admision WHERE id = ?", [$id])->fetch();
            if ($solicitud) {
                $this->emailService->sendAdmisionPreconsultaProgramada($solicitud, $data['fecha'], $data['hora']);
            }

            return Response::success(null, 'Preconsulta programada');
        } catch (\Exception $e) {
            error_log('Error scheduling preconsulta: ' . $e->getMessage());
            return Response::error('Error al programar preconsulta', 500);
        }
    }

    /**
     * Admitir paciente - crea usuario + paciente en el sistema
     */
    public function admitirPaciente($id, $data)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();

            $solicitud = $this->db->query(
                "SELECT * FROM solicitudes_admision WHERE id = ? AND estado = 'preconsulta_completada'",
                [$id]
            )->fetch();

            if (!$solicitud) {
                return Response::error('Solicitud no encontrada o no está en estado de preconsulta completada', 404);
            }

            $tempPassword = 'Azaria' . rand(1000, 9999);
            $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

            $email = $solicitud['email'];
            if (empty($email)) {
                $email = 'paciente_' . $id . '@vitalia.temporal';
            }

            $existing = $this->db->query("SELECT id FROM usuarios WHERE email = ?", [$email])->fetch();
            if ($existing) {
                $email = 'paciente_' . $id . '_' . time() . '@vitalia.temporal';
            }

            $this->db->query(
                "INSERT INTO usuarios (email, password_hash, nombre_completo, fecha_nacimiento, rol_id, activo, primer_acceso, created_at)
                 VALUES (?, ?, ?, ?, 3, 1, 1, NOW())",
                [
                    $email,
                    $passwordHash,
                    $solicitud['nombre_completo'],
                    $data['fecha_nacimiento'] ?? null
                ]
            );
            $usuarioId = $this->db->lastInsertId();

            $this->db->query(
                "INSERT INTO pacientes (usuario_id, fase_actual_id, created_at) VALUES (?, 1, NOW())",
                [$usuarioId]
            );
            $pacienteId = $this->db->lastInsertId();

            $this->db->query(
                "UPDATE solicitudes_admision
                 SET estado = 'admitido', decision_notas = ?, decision_por = ?, decision_fecha = NOW(),
                     usuario_id = ?, paciente_id = ?, updated_at = NOW()
                 WHERE id = ?",
                [
                    $data['notas'] ?? 'Paciente admitido al programa',
                    $user['id'],
                    $usuarioId,
                    $pacienteId,
                    $id
                ]
            );

            // Enviar email de bienvenida con credenciales
            $this->emailService->sendAdmisionAdmitido($solicitud, [
                'email' => $email,
                'password' => $tempPassword
            ]);

            return Response::success([
                'usuario_id' => $usuarioId,
                'paciente_id' => $pacienteId,
                'email' => $email,
                'password_temporal' => $tempPassword
            ], 'Paciente admitido exitosamente');
        } catch (\Exception $e) {
            error_log('Error admitting patient: ' . $e->getMessage());
            return Response::error('Error al admitir paciente', 500);
        }
    }

    /**
     * Rechazar solicitud
     */
    public function rechazarSolicitud($id, $data)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();

            // Obtener solicitud antes de actualizar para enviar email
            $solicitud = $this->db->query("SELECT * FROM solicitudes_admision WHERE id = ?", [$id])->fetch();

            $this->db->query(
                "UPDATE solicitudes_admision
                 SET estado = 'rechazado', decision_notas = ?, decision_por = ?, decision_fecha = NOW(), updated_at = NOW()
                 WHERE id = ?",
                [
                    $data['notas'] ?? 'Solicitud rechazada',
                    $user['id'],
                    $id
                ]
            );

            // Enviar email de rechazo
            if ($solicitud) {
                $this->emailService->sendAdmisionRechazado($solicitud, $data['notas'] ?? '');
            }

            return Response::success(null, 'Solicitud rechazada');
        } catch (\Exception $e) {
            error_log('Error rejecting solicitud: ' . $e->getMessage());
            return Response::error('Error al rechazar solicitud', 500);
        }
    }

    /**
     * Reporte semestral
     */
    public function getReporteSemestral($semestre = null)
    {
        try {
            if (!$semestre) {
                $mes = (int)date('m');
                $anio = date('Y');
                $semestre = $anio . '-' . ($mes <= 6 ? '1' : '2');
            }

            $porEstado = $this->db->query(
                "SELECT estado, COUNT(*) as total FROM solicitudes_admision
                 WHERE semestre = ? GROUP BY estado",
                [$semestre]
            )->fetchAll();

            $preconsultas = $this->db->query(
                "SELECT COUNT(*) as total FROM solicitudes_admision
                 WHERE semestre = ? AND estado IN ('preconsulta_programada','preconsulta_completada','admitido','rechazado')",
                [$semestre]
            )->fetch();

            // Preconsultas donde el paciente SÍ asistió (completada, admitido o rechazado post-preconsulta)
            $preconsultasAsistidas = $this->db->query(
                "SELECT COUNT(*) as total FROM solicitudes_admision
                 WHERE semestre = ? AND estado IN ('preconsulta_completada','admitido')",
                [$semestre]
            )->fetch();

            $admitidos = $this->db->query(
                "SELECT COUNT(*) as total FROM solicitudes_admision
                 WHERE semestre = ? AND estado = 'admitido'",
                [$semestre]
            )->fetch();

            $porSexo = $this->db->query(
                "SELECT sexo, COUNT(*) as total FROM solicitudes_admision
                 WHERE semestre = ? GROUP BY sexo",
                [$semestre]
            )->fetchAll();

            $porEdad = $this->db->query(
                "SELECT
                    CASE
                        WHEN edad BETWEEN 18 AND 29 THEN '18-29'
                        WHEN edad BETWEEN 30 AND 39 THEN '30-39'
                        WHEN edad BETWEEN 40 AND 49 THEN '40-49'
                        WHEN edad BETWEEN 50 AND 55 THEN '50-55'
                        WHEN edad BETWEEN 56 AND 60 THEN '56-60'
                        WHEN edad BETWEEN 61 AND 65 THEN '61-65'
                        WHEN edad BETWEEN 66 AND 70 THEN '66-70'
                        WHEN edad BETWEEN 71 AND 75 THEN '71-75'
                        WHEN edad BETWEEN 76 AND 80 THEN '76-80'
                        ELSE '80+'
                    END as grupo_edad,
                    COUNT(*) as total
                 FROM solicitudes_admision
                 WHERE semestre = ?
                 GROUP BY grupo_edad
                 ORDER BY MIN(edad)",
                [$semestre]
            )->fetchAll();

            $porProcedencia = $this->db->query(
                "SELECT estado_procedencia, ciudad, COUNT(*) as total
                 FROM solicitudes_admision
                 WHERE semestre = ?
                 GROUP BY estado_procedencia, ciudad
                 ORDER BY total DESC",
                [$semestre]
            )->fetchAll();

            $total = $this->db->query(
                "SELECT COUNT(*) as total FROM solicitudes_admision WHERE semestre = ?",
                [$semestre]
            )->fetch();

            $totalAsistidas = (int)($preconsultasAsistidas['total'] ?? 0);
            $costoPreconsulta = 500;

            return Response::success([
                'semestre' => $semestre,
                'total_solicitudes' => (int)($total['total'] ?? 0),
                'total_preconsultas' => (int)($preconsultas['total'] ?? 0),
                'preconsultas_asistidas' => $totalAsistidas,
                'ingresos_preconsultas' => $totalAsistidas * $costoPreconsulta,
                'costo_preconsulta' => $costoPreconsulta,
                'total_admitidos' => (int)($admitidos['total'] ?? 0),
                'tasa_admision' => $preconsultas['total'] > 0
                    ? round(($admitidos['total'] / $preconsultas['total']) * 100, 1) : 0,
                'por_estado' => $porEstado,
                'por_sexo' => $porSexo,
                'por_edad' => $porEdad,
                'por_procedencia' => $porProcedencia
            ]);
        } catch (\Exception $e) {
            error_log('Error getting reporte: ' . $e->getMessage());
            return Response::error('Error al generar reporte', 500);
        }
    }

    /**
     * Subir documento oficial (admin)
     */
    public function subirDocumentoOficial($data)
    {
        try {
            $user = AuthMiddleware::getCurrentUser();

            if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
                return Response::error('No se recibió el archivo', 400);
            }

            $tipo = $data['tipo'] ?? null;
            if (!in_array($tipo, ['reglamento', 'aviso_privacidad', 'consentimiento'])) {
                return Response::error('Tipo de documento inválido', 422);
            }

            $file = $_FILES['archivo'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            if ($ext !== 'pdf') {
                return Response::error('Solo se permiten archivos PDF', 400);
            }

            if (!is_dir($this->docsOficialesDir)) {
                mkdir($this->docsOficialesDir, 0755, true);
            }

            $nombreArchivo = $tipo . '_' . time() . '_' . uniqid() . '.pdf';
            $ruta = $this->docsOficialesDir . $nombreArchivo;

            if (!move_uploaded_file($file['tmp_name'], $ruta)) {
                return Response::error('Error al guardar el archivo', 500);
            }

            $this->db->query("UPDATE documentos_oficiales SET activo = 0 WHERE tipo = ?", [$tipo]);

            $this->db->query(
                "INSERT INTO documentos_oficiales (tipo, nombre_original, nombre_archivo, version, activo, subido_por)
                 VALUES (?, ?, ?, ?, 1, ?)",
                [$tipo, $file['name'], $nombreArchivo, $data['version'] ?? '1.0', $user['id']]
            );

            return Response::success(['id' => $this->db->lastInsertId()], 'Documento oficial subido');
        } catch (\Exception $e) {
            error_log('Error uploading official doc: ' . $e->getMessage());
            return Response::error('Error al subir documento', 500);
        }
    }

    /**
     * Eliminar documento oficial
     */
    public function eliminarDocumentoOficial($id)
    {
        try {
            $doc = $this->db->query("SELECT nombre_archivo FROM documentos_oficiales WHERE id = ?", [$id])->fetch();

            if (!$doc) {
                return Response::error('Documento no encontrado', 404);
            }

            $ruta = $this->docsOficialesDir . $doc['nombre_archivo'];
            if (file_exists($ruta)) {
                unlink($ruta);
            }

            $this->db->query("DELETE FROM documentos_oficiales WHERE id = ?", [$id]);

            return Response::success(null, 'Documento eliminado');
        } catch (\Exception $e) {
            error_log('Error deleting official doc: ' . $e->getMessage());
            return Response::error('Error al eliminar documento', 500);
        }
    }
}
