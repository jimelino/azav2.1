-- =====================================================
-- Migración: Módulo de Admisiones / Intake
-- Fecha: 2026-03-01
-- Tablas: solicitudes_admision, documentos_admision,
--         pagos_admision, documentos_oficiales
-- =====================================================

CREATE TABLE IF NOT EXISTS solicitudes_admision (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Datos de contacto
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255) NULL,
    edad INT UNSIGNED NOT NULL,
    sexo ENUM('masculino','femenino','otro') NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado_procedencia VARCHAR(100) NOT NULL,

    -- Datos clínicos
    tipo_servicio ENUM('protesis_publico','protocolo_protesis') NOT NULL,
    tipo_amputacion VARCHAR(255) NOT NULL,
    causa_amputacion VARCHAR(255) NOT NULL,
    tiene_protesis_previa TINYINT(1) DEFAULT 0,
    tiempo_desde_amputacion VARCHAR(100) NULL,
    notas_clinicas TEXT NULL,

    -- Pipeline status
    estado ENUM(
        'solicitud_recibida',
        'screening_aprobado',
        'screening_rechazado',
        'documentos_pendientes',
        'documentos_recibidos',
        'pago_pendiente',
        'pago_confirmado',
        'preconsulta_programada',
        'preconsulta_completada',
        'admitido',
        'rechazado'
    ) DEFAULT 'solicitud_recibida',

    -- Token para acceso público (subida de documentos)
    token_documentos VARCHAR(64) NULL UNIQUE,
    token_expira_en DATETIME NULL,

    -- Screening
    screening_notas TEXT NULL,
    screening_por INT UNSIGNED NULL,
    screening_fecha DATETIME NULL,

    -- Preconsulta
    fecha_preconsulta DATE NULL,
    hora_preconsulta TIME NULL,
    preconsulta_notas TEXT NULL,

    -- Decisión final
    decision_notas TEXT NULL,
    decision_por INT UNSIGNED NULL,
    decision_fecha DATETIME NULL,

    -- Si fue admitido, referencia al usuario creado
    usuario_id INT UNSIGNED NULL,
    paciente_id INT UNSIGNED NULL,

    -- Semestre para reportes (ej: '2026-1', '2026-2')
    semestre VARCHAR(10) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_sa_estado (estado),
    INDEX idx_sa_token (token_documentos),
    INDEX idx_sa_semestre (semestre),
    INDEX idx_sa_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos_admision (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT UNSIGNED NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(10) NOT NULL,
    tamano INT UNSIGNED NOT NULL,
    categoria ENUM('laboratorios','radiografias','comprobante_domicilio','otro') NOT NULL,
    descripcion TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_admision(id) ON DELETE CASCADE,
    INDEX idx_da_solicitud (solicitud_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos_admision (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT UNSIGNED NOT NULL,
    referencia_pago VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NULL,
    estado ENUM('pendiente','confirmado','rechazado') DEFAULT 'pendiente',
    enviado_por INT UNSIGNED NOT NULL,
    confirmado_por INT UNSIGNED NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion DATETIME NULL,
    notas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_admision(id) ON DELETE CASCADE,
    INDEX idx_pa_solicitud (solicitud_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos_oficiales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('reglamento','aviso_privacidad','consentimiento') NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    activo TINYINT(1) DEFAULT 1,
    subido_por INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_do_tipo_activo (tipo, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
