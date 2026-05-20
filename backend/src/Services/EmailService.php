<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * Servicio de Email con PHPMailer SMTP
 * Soporta Gmail, Outlook, SMTP genérico
 */
class EmailService
{
    private $config;
    private $smtpEnabled;

    public function __construct()
    {
        $this->config = [
            'from' => [
                'address' => getenv('MAIL_FROM') ?: getenv('MAIL_USERNAME') ?: 'noreply@vitalia.app',
                'name' => getenv('MAIL_FROM_NAME') ?: 'Azaria - UIOP'
            ],
            'support' => [
                'email' => 'unidadinvestigacionoyp_enesj@unam.mx',
                'phone' => '+52 1 442 436 9592'
            ],
            'smtp' => [
                'host' => getenv('MAIL_HOST') ?: 'smtp.gmail.com',
                'port' => (int)(getenv('MAIL_PORT') ?: 587),
                'username' => getenv('MAIL_USERNAME') ?: '',
                'password' => getenv('MAIL_PASSWORD') ?: '',
            ]
        ];

        // SMTP habilitado solo si hay credenciales configuradas
        $this->smtpEnabled = !empty($this->config['smtp']['username']) && !empty($this->config['smtp']['password']);
    }

    public function sendWelcomeEmail($user, $credentials)
    {
        $subject = 'Bienvenido a Vitalia';
        $body = $this->getWelcomeTemplate($user, $credentials);

        return $this->send($user['email'], $subject, $body);
    }

    public function sendRecoveryCode($email, $code)
    {
        $subject = 'Código de recuperación - Vitalia';
        $body = $this->getRecoveryTemplate($code);

        return $this->send($email, $subject, $body);
    }

    public function sendCitaConfirmacion($cita)
    {
        $paciente = $cita['paciente_nombre'] ?? 'Paciente';
        $especialista = $cita['especialista_nombre'] ?? $cita['especialista'] ?? 'Especialista';
        $fecha = $this->formatearFecha($cita['fecha'] ?? '');
        $hora = $cita['hora_inicio'] ?? $cita['hora'] ?? '';
        $tipo = $cita['tipo_cita_nombre'] ?? $cita['especialidad'] ?? 'Consulta';
        $email = $cita['paciente_email'] ?? null;

        if (!$email) {
            $this->log("Confirmacion de cita - sin email de paciente", $cita);
            return true;
        }

        $subject = "Cita confirmada - $tipo";
        $body = $this->getCitaTemplate('confirmacion', [
            'paciente' => $paciente,
            'especialista' => $especialista,
            'fecha' => $fecha,
            'hora' => $hora,
            'tipo' => $tipo,
            'motivo' => $cita['motivo'] ?? ''
        ]);

        return $this->send($email, $subject, $body);
    }

    public function sendCitaCancelacion($cita)
    {
        $paciente = $cita['paciente_nombre'] ?? 'Paciente';
        $especialista = $cita['especialista_nombre'] ?? 'Especialista';
        $fecha = $this->formatearFecha($cita['fecha'] ?? '');
        $hora = $cita['hora_inicio'] ?? '';
        $tipo = $cita['tipo_cita_nombre'] ?? 'Consulta';
        $email = $cita['paciente_email'] ?? null;

        if (!$email) {
            $this->log("Cancelacion de cita - sin email de paciente", $cita);
            return true;
        }

        $subject = "Cita cancelada - $tipo";
        $body = $this->getCitaTemplate('cancelacion', [
            'paciente' => $paciente,
            'especialista' => $especialista,
            'fecha' => $fecha,
            'hora' => $hora,
            'tipo' => $tipo,
            'motivo' => $cita['motivo_cancelacion'] ?? ''
        ]);

        return $this->send($email, $subject, $body);
    }

    public function sendCitaReagendada($cita, $newData)
    {
        $paciente = $cita['paciente_nombre'] ?? 'Paciente';
        $especialista = $cita['especialista_nombre'] ?? 'Especialista';
        $fechaAnterior = $this->formatearFecha($cita['fecha'] ?? '');
        $horaAnterior = $cita['hora_inicio'] ?? '';
        $fechaNueva = $this->formatearFecha($newData['nueva_fecha'] ?? '');
        $horaNueva = $newData['nueva_hora'] ?? '';
        $tipo = $cita['tipo_cita_nombre'] ?? 'Consulta';
        $email = $cita['paciente_email'] ?? null;

        if (!$email) {
            $this->log("Reagendamiento de cita - sin email de paciente", $cita);
            return true;
        }

        $subject = "Cita reagendada - $tipo";
        $body = $this->getCitaTemplate('reagendada', [
            'paciente' => $paciente,
            'especialista' => $especialista,
            'fecha_anterior' => $fechaAnterior,
            'hora_anterior' => $horaAnterior,
            'fecha_nueva' => $fechaNueva,
            'hora_nueva' => $horaNueva,
            'tipo' => $tipo
        ]);

        return $this->send($email, $subject, $body);
    }

    public function sendCitaRecordatorio($cita)
    {
        $paciente = $cita['paciente_nombre'] ?? 'Paciente';
        $especialista = $cita['especialista_nombre'] ?? 'Especialista';
        $fecha = $this->formatearFecha($cita['fecha'] ?? '');
        $hora = $cita['hora_inicio'] ?? '';
        $tipo = $cita['tipo_cita_nombre'] ?? 'Consulta';
        $email = $cita['paciente_email'] ?? null;

        if (!$email) {
            $this->log("Recordatorio de cita - sin email de paciente", $cita);
            return true;
        }

        $subject = "Recordatorio: Cita manana - $tipo";
        $body = $this->getCitaTemplate('recordatorio', [
            'paciente' => $paciente,
            'especialista' => $especialista,
            'fecha' => $fecha,
            'hora' => $hora,
            'tipo' => $tipo,
            'ubicacion' => $cita['ubicacion'] ?? ''
        ]);

        return $this->send($email, $subject, $body);
    }

    // =====================================================
    // EMAILS DE ADMISIONES
    // =====================================================

    /**
     * Email al aprobar screening - informar que debe esperar referencia de pago
     */
    /**
     * Email de confirmación al recibir la solicitud
     */
    public function sendAdmisionSolicitudRecibida($solicitud)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision solicitud recibida - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Solicitud recibida - $folio - Azaria UIOP";
        $body = $this->getAdmisionTemplate('solicitud_recibida', [
            'nombre' => $nombre,
            'folio' => $folio
        ]);

        return $this->send($email, $subject, $body);
    }

    public function sendAdmisionScreeningAprobado($solicitud)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision screening aprobado - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Solicitud aprobada - Siguiente paso: Pago - $folio";
        $body = $this->getAdmisionTemplate('screening_aprobado', [
            'nombre' => $nombre,
            'folio' => $folio
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Email al confirmar pago - solicitar documentos con link de subida
     */
    public function sendAdmisionPagoConfirmado($solicitud, $linkDocumentos = null)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision pago confirmado - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Pago confirmado - Sube tus documentos - $folio";
        $body = $this->getAdmisionTemplate('pago_confirmado', [
            'nombre' => $nombre,
            'folio' => $folio,
            'link_documentos' => $linkDocumentos
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Email al recibir documentos completos
     */
    public function sendAdmisionDocumentosRecibidos($solicitud)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision docs recibidos - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Documentos recibidos - $folio";
        $body = $this->getAdmisionTemplate('documentos_recibidos', [
            'nombre' => $nombre,
            'folio' => $folio
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Email al programar preconsulta
     */
    public function sendAdmisionPreconsultaProgramada($solicitud, $fecha, $hora)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision preconsulta - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Preconsulta programada - $folio";
        $body = $this->getAdmisionTemplate('preconsulta_programada', [
            'nombre' => $nombre,
            'folio' => $folio,
            'fecha' => $this->formatearFecha($fecha),
            'hora' => $hora
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Email al admitir al paciente
     */
    public function sendAdmisionAdmitido($solicitud, $credentials)
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision admitido - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "¡Bienvenido a Azaria! - Admisión confirmada - $folio";
        $body = $this->getAdmisionTemplate('admitido', [
            'nombre' => $nombre,
            'folio' => $folio,
            'email_acceso' => $credentials['email'],
            'password' => $credentials['password']
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Email al rechazar solicitud
     */
    public function sendAdmisionRechazado($solicitud, $motivo = '')
    {
        $email = $solicitud['email'] ?? null;
        if (!$email) {
            $this->log("Admision rechazado - sin email", $solicitud);
            return true;
        }

        $nombre = $solicitud['nombre_completo'] ?? 'Solicitante';
        $folio = 'SOL-' . str_pad($solicitud['id'], 5, '0', STR_PAD_LEFT);
        $subject = "Actualización de tu solicitud - $folio";
        $body = $this->getAdmisionTemplate('rechazado', [
            'nombre' => $nombre,
            'folio' => $folio,
            'motivo' => $motivo
        ]);

        return $this->send($email, $subject, $body);
    }

    /**
     * Template para emails de admisiones
     */
    private function getAdmisionTemplate($tipo, $data)
    {
        $configs = [
            'solicitud_recibida'   => ['color' => '#0097A7', 'icon' => '📩', 'title' => 'Solicitud Recibida'],
            'screening_aprobado'   => ['color' => '#0097A7', 'icon' => '✅', 'title' => 'Solicitud Aprobada'],
            'pago_confirmado'      => ['color' => '#4CAF50', 'icon' => '💳', 'title' => 'Pago Confirmado'],
            'documentos_recibidos' => ['color' => '#2196F3', 'icon' => '📄', 'title' => 'Documentos Recibidos'],
            'preconsulta_programada' => ['color' => '#FF9800', 'icon' => '📅', 'title' => 'Preconsulta Programada'],
            'admitido'             => ['color' => '#4CAF50', 'icon' => '🎉', 'title' => '¡Admisión Confirmada!'],
            'rechazado'            => ['color' => '#F44336', 'icon' => '📋', 'title' => 'Actualización de Solicitud'],
        ];

        $cfg = $configs[$tipo] ?? ['color' => '#0097A7', 'icon' => '📋', 'title' => 'Notificación'];
        $supportEmail = $this->config['support']['email'];
        $supportPhone = $this->config['support']['phone'];

        $linkEstatus = 'https://dtai.uteq.edu.mx/~azaria/admisiones/estatus';

        $contenido = '';
        switch ($tipo) {
            case 'solicitud_recibida':
                $contenido = "
                    <p>Hemos recibido tu solicitud de admisión con el folio <strong>{$data['folio']}</strong>.</p>
                    <div class='details'>
                        <p><strong>¿Qué sigue?</strong></p>
                        <p>Nuestro equipo revisará tu información y te notificaremos sobre los siguientes pasos del proceso de admisión.</p>
                    </div>
                    <p style='margin-top:15px;'>Puedes consultar el estatus de tu solicitud en cualquier momento:</p>
                    <div style='text-align:center;margin:20px 0;'>
                        <a href='{$linkEstatus}' style='display:inline-block;background:{$cfg['color']};color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;'>
                            Consultar Estatus
                        </a>
                    </div>
                    <p style='font-size:13px;color:#666;text-align:center;'>Usa tu folio <strong>{$data['folio']}</strong> y tu correo electrónico o teléfono para consultar.</p>";
                break;

            case 'screening_aprobado':
                $contenido = "
                    <p>Tu solicitud <strong>{$data['folio']}</strong> ha sido <strong>aprobada</strong> en la etapa de evaluación inicial.</p>
                    <div class='details'>
                        <p><strong>Siguiente paso: Pago</strong></p>
                        <p>Espera a que te llegue la referencia de pago por parte de nuestro equipo.
                           Te contactaremos por teléfono o correo con los datos para realizar tu pago.</p>
                    </div>
                    <p style='margin-top:15px;'>Una vez que realices el pago y sea confirmado, te enviaremos un enlace para subir tus documentos.</p>";
                break;

            case 'pago_confirmado':
                $contenido = "
                    <p>Tu pago para la solicitud <strong>{$data['folio']}</strong> ha sido <strong>confirmado</strong> exitosamente.</p>
                    <div class='details'>
                        <p><strong>Siguiente paso: Subir Documentos</strong></p>
                        <p>Ahora necesitamos que subas los siguientes documentos:</p>
                        <ul style='margin:8px 0;padding-left:20px;'>
                            <li>Estudios de laboratorio</li>
                            <li>Radiografías</li>
                            <li>Comprobante de domicilio</li>
                        </ul>
                    </div>"
                    . (!empty($data['link_documentos']) ?
                        "<div style='text-align:center;margin:20px 0;'>
                            <a href='{$data['link_documentos']}' style='display:inline-block;background:{$cfg['color']};color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;'>
                                Subir Documentos
                            </a>
                        </div>
                        <p style='font-size:13px;color:#666;text-align:center;'>Este enlace es válido por 72 horas.</p>" : "
                        <p style='margin-top:12px;'>Te enviaremos el enlace para subir tus documentos en breve.</p>")
                    . "<p style='margin-top:15px;'>Si tienes dudas sobre los documentos requeridos, no dudes en contactarnos.</p>";
                break;

            case 'documentos_recibidos':
                $contenido = "
                    <p>Hemos recibido correctamente todos tus documentos para la solicitud <strong>{$data['folio']}</strong>.</p>
                    <div class='details'>
                        <p><strong>Siguiente paso: Preconsulta</strong></p>
                        <p>Nuestro equipo revisará tu documentación y te contactaremos para programar tu preconsulta médica.</p>
                    </div>
                    <p style='margin-top:15px;'>Estamos avanzando con tu proceso. Te notificaremos cuando tu preconsulta sea programada.</p>";
                break;

            case 'preconsulta_programada':
                $contenido = "
                    <p>Tu preconsulta para la solicitud <strong>{$data['folio']}</strong> ha sido programada.</p>
                    <div class='details'>
                        <p>📅 <strong>Fecha:</strong> {$data['fecha']}</p>
                        <p>🕐 <strong>Hora:</strong> {$data['hora']}</p>
                    </div>
                    <p style='margin-top:15px;'><strong>Recuerda:</strong></p>
                    <ul style='padding-left:20px;'>
                        <li>Llega 15 minutos antes de tu cita</li>
                        <li>Trae una identificación oficial</li>
                        <li>Si necesitas reagendar, contáctanos con anticipación</li>
                    </ul>";
                break;

            case 'admitido':
                $contenido = "
                    <p>¡Felicidades! Tu solicitud <strong>{$data['folio']}</strong> ha sido <strong>aprobada</strong>.
                       Has sido admitido en el programa de rehabilitación de Azaria.</p>
                    <div class='details'>
                        <p><strong>Tus credenciales de acceso a la plataforma:</strong></p>
                        <p>📧 <strong>Email:</strong> {$data['email_acceso']}</p>
                        <p>🔑 <strong>Contraseña temporal:</strong> {$data['password']}</p>
                    </div>
                    <p style='margin-top:15px;'><strong>Importante:</strong></p>
                    <ul style='padding-left:20px;'>
                        <li>Inicia sesión lo antes posible</li>
                        <li>Configura tu PIN de acceso rápido</li>
                        <li>Cambia tu contraseña temporal por una segura</li>
                    </ul>
                    <p style='margin-top:15px;'>Estamos encantados de tenerte en el programa. Tu equipo de especialistas estará contigo en cada paso.</p>";
                break;

            case 'rechazado':
                $contenido = "
                    <p>Lamentamos informarte que tu solicitud <strong>{$data['folio']}</strong> no ha podido ser aprobada en esta ocasión.</p>"
                    . (!empty($data['motivo']) ? "
                    <div class='details'>
                        <p><strong>Observaciones:</strong></p>
                        <p>{$data['motivo']}</p>
                    </div>" : "")
                    . "<p style='margin-top:15px;'>Si tienes preguntas sobre esta decisión o deseas más información, no dudes en contactarnos.
                       Estamos aquí para orientarte.</p>";
                break;
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: {$cfg['color']}; color: white; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; }
                .content { padding: 24px; background: #f9f9f9; }
                .details { background: white; padding: 16px; border-radius: 8px; margin: 16px 0;
                           border-left: 4px solid {$cfg['color']}; }
                .details p { margin: 6px 0; }
                .details ul { margin: 8px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666;
                          border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{$cfg['icon']} {$cfg['title']}</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$data['nombre']}</strong>,</p>
                    $contenido
                </div>
                <div class='footer'>
                    <p>Azaria - Unidad de Investigación en Órtesis y Prótesis</p>
                    <p>ENES Juriquilla, UNAM</p>
                    <p>📧 {$supportEmail} | 📞 {$supportPhone}</p>
                </div>
            </div>
        </body>
        </html>";
    }

    /**
     * Enviar email via SMTP (PHPMailer)
     */
    private function send($to, $subject, $body)
    {
        // Si SMTP no está configurado, solo loguear
        if (!$this->smtpEnabled) {
            $this->log("Email a: $to | Asunto: $subject (SMTP no configurado, solo log)", ['body_preview' => substr(strip_tags($body), 0, 200)]);
            return true;
        }

        $mail = new PHPMailer(true);

        try {
            // Configuración SMTP
            $mail->isSMTP();
            $mail->Host       = $this->config['smtp']['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['smtp']['username'];
            $mail->Password   = $this->config['smtp']['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->config['smtp']['port'];
            $mail->CharSet    = 'UTF-8';

            // Remitente y destinatario
            $mail->setFrom($this->config['from']['address'], $this->config['from']['name']);
            $mail->addAddress($to);
            $mail->addReplyTo($this->config['support']['email'], $this->config['from']['name']);

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

            $mail->send();
            $this->log("Email enviado exitosamente a: $to | Asunto: $subject");
            return true;

        } catch (Exception $e) {
            $this->log("Error enviando email a: $to | Error: " . $mail->ErrorInfo, ['subject' => $subject]);
            return false;
        }
    }

    /**
     * Loguear emails (para desarrollo)
     */
    private function log($message, $data = [])
    {
        $logMessage = "[EMAIL] $message";
        if (!empty($data)) {
            $logMessage .= " | Data: " . json_encode($data, JSON_UNESCAPED_UNICODE);
        }
        error_log($logMessage);
    }

    private function getWelcomeTemplate($user, $credentials)
    {
        $supportEmail = $this->config['support']['email'] ?? 'soporte@vitalia.app';
        $supportPhone = $this->config['support']['phone'] ?? '+52 442 123 4567';

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .credentials { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>¡Bienvenido a Vitalia!</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$user['nombre_completo']}</strong>,</p>
                    <p>Tu cuenta ha sido creada exitosamente en el Sistema Vitalia.</p>

                    <div class='credentials'>
                        <h3>Tus credenciales de acceso:</h3>
                        <p><strong>Email:</strong> {$credentials['email']}</p>
                        <p><strong>Contraseña temporal:</strong> {$credentials['password']}</p>
                    </div>

                    <p><strong>Importante:</strong> Por seguridad, te recomendamos:</p>
                    <ul>
                        <li>Iniciar sesión lo antes posible</li>
                        <li>Configurar tu PIN de 6 dígitos para acceso rápido</li>
                        <li>Cambiar tu contraseña temporal</li>
                    </ul>
                </div>
                <div class='footer'>
                    <p>¿Necesitas ayuda? Contáctanos:</p>
                    <p>📧 {$supportEmail} | 📞 {$supportPhone}</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Formatear fecha YYYY-MM-DD a formato legible
     */
    private function formatearFecha($fecha)
    {
        if (empty($fecha)) return '';
        try {
            $dt = new \DateTime($fecha);
            $meses = ['enero','febrero','marzo','abril','mayo','junio',
                       'julio','agosto','septiembre','octubre','noviembre','diciembre'];
            $dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
            return $dias[$dt->format('w')] . ' ' . $dt->format('j') . ' de ' . $meses[$dt->format('n')-1] . ' de ' . $dt->format('Y');
        } catch (\Exception $e) {
            return $fecha;
        }
    }

    /**
     * Template genérico para emails de citas
     */
    private function getCitaTemplate($tipo, $data)
    {
        $configs = [
            'confirmacion' => ['color' => '#00BFA5', 'icon' => '✅', 'title' => 'Cita Confirmada'],
            'cancelacion'  => ['color' => '#F44336', 'icon' => '❌', 'title' => 'Cita Cancelada'],
            'reagendada'   => ['color' => '#FF9800', 'icon' => '🔄', 'title' => 'Cita Reagendada'],
            'recordatorio' => ['color' => '#2196F3', 'icon' => '🔔', 'title' => 'Recordatorio de Cita'],
        ];

        $cfg = $configs[$tipo] ?? $configs['confirmacion'];
        $supportEmail = $this->config['support']['email'] ?? 'soporte@vitalia.app';

        // Contenido específico por tipo
        $contenido = '';
        switch ($tipo) {
            case 'confirmacion':
                $contenido = "
                    <p>Tu cita ha sido <strong>confirmada</strong> con los siguientes datos:</p>
                    <div class='details'>
                        <p>📋 <strong>Tipo:</strong> {$data['tipo']}</p>
                        <p>👨‍⚕️ <strong>Especialista:</strong> {$data['especialista']}</p>
                        <p>📅 <strong>Fecha:</strong> {$data['fecha']}</p>
                        <p>🕐 <strong>Hora:</strong> {$data['hora']}</p>
                    </div>
                    <p style='margin-top:15px;'>Recuerda llegar 10 minutos antes de tu cita.</p>";
                break;

            case 'cancelacion':
                $contenido = "
                    <p>Tu cita ha sido <strong>cancelada</strong>:</p>
                    <div class='details'>
                        <p>📋 <strong>Tipo:</strong> {$data['tipo']}</p>
                        <p>👨‍⚕️ <strong>Especialista:</strong> {$data['especialista']}</p>
                        <p>📅 <strong>Fecha:</strong> {$data['fecha']}</p>
                        <p>🕐 <strong>Hora:</strong> {$data['hora']}</p>
                    </div>"
                    . (!empty($data['motivo']) ? "<p><strong>Motivo:</strong> {$data['motivo']}</p>" : "")
                    . "<p style='margin-top:15px;'>Si necesitas agendar una nueva cita, puedes hacerlo desde la aplicación.</p>";
                break;

            case 'reagendada':
                $contenido = "
                    <p>Tu cita ha sido <strong>reagendada</strong>:</p>
                    <div class='details' style='background:#fff3cd;'>
                        <p><strong>Anterior:</strong></p>
                        <p>📅 {$data['fecha_anterior']} a las 🕐 {$data['hora_anterior']}</p>
                    </div>
                    <div class='details'>
                        <p><strong>Nueva fecha:</strong></p>
                        <p>📅 {$data['fecha_nueva']} a las 🕐 {$data['hora_nueva']}</p>
                    </div>
                    <p>👨‍⚕️ <strong>Especialista:</strong> {$data['especialista']}</p>";
                break;

            case 'recordatorio':
                $contenido = "
                    <p>Te recordamos que tienes una <strong>cita programada</strong> para mañana:</p>
                    <div class='details'>
                        <p>📋 <strong>Tipo:</strong> {$data['tipo']}</p>
                        <p>👨‍⚕️ <strong>Especialista:</strong> {$data['especialista']}</p>
                        <p>📅 <strong>Fecha:</strong> {$data['fecha']}</p>
                        <p>🕐 <strong>Hora:</strong> {$data['hora']}</p>
                    </div>"
                    . (!empty($data['ubicacion']) ? "<p>📍 <strong>Ubicación:</strong> {$data['ubicacion']}</p>" : "")
                    . "<p style='margin-top:15px;'><strong>Recuerda:</strong> Llega 10 minutos antes y trae tu identificación.</p>";
                break;
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: {$cfg['color']}; color: white; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; }
                .content { padding: 24px; background: #f9f9f9; }
                .details { background: white; padding: 16px; border-radius: 8px; margin: 16px 0;
                           border-left: 4px solid {$cfg['color']}; }
                .details p { margin: 6px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666;
                          border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{$cfg['icon']} {$cfg['title']}</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$data['paciente']}</strong>,</p>
                    $contenido
                </div>
                <div class='footer'>
                    <p>Vitalia - Sistema de Rehabilitación</p>
                    <p>📧 {$supportEmail}</p>
                </div>
            </div>
        </body>
        </html>";
    }

    private function getRecoveryTemplate($code)
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .code { font-size: 32px; text-align: center; color: #2196F3;
                        background: white; padding: 20px; border-radius: 5px;
                        letter-spacing: 5px; font-weight: bold; }
                .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Código de Recuperación</h1>
                </div>
                <div class='content'>
                    <p>Has solicitado recuperar tu contraseña o PIN.</p>
                    <p>Tu código de verificación es:</p>

                    <div class='code'>{$code}</div>

                    <div class='warning'>
                        <p>⏰ <strong>Este código expira en 15 minutos.</strong></p>
                        <p>⚠️ Si no solicitaste este código, ignora este email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
