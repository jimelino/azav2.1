-- Migración: Mediciones del muñón y Protocolo de uso progresivo
-- Fecha: 2026-03-10

-- Tabla de mediciones del muñón
CREATE TABLE IF NOT EXISTS mediciones_munon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    circunferencia_proximal DECIMAL(5,1) NULL COMMENT 'cm - parte proximal del muñón',
    circunferencia_media DECIMAL(5,1) NULL COMMENT 'cm - parte media del muñón',
    circunferencia_distal DECIMAL(5,1) NULL COMMENT 'cm - parte distal del muñón',
    longitud DECIMAL(5,1) NULL COMMENT 'cm - longitud total del muñón',
    condicion_piel ENUM('sana','enrojecida','irritada','con_herida','cicatrizando','edema') DEFAULT 'sana',
    temperatura_local DECIMAL(3,1) NULL COMMENT 'Temperatura local en °C',
    sensibilidad ENUM('normal','hipersensible','hiposensible','dolor_fantasma','hormigueo') DEFAULT 'normal',
    notas TEXT NULL,
    registrado_por INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración del protocolo de uso progresivo
CREATE TABLE IF NOT EXISTS protocolo_uso_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL UNIQUE,
    semana_actual INT DEFAULT 1,
    horas_objetivo DECIMAL(4,1) DEFAULT 2.0 COMMENT 'Horas objetivo por día',
    incremento_semanal DECIMAL(3,1) DEFAULT 1.0 COMMENT 'Incremento de horas por semana',
    horas_maximo DECIMAL(4,1) DEFAULT 12.0 COMMENT 'Máximo de horas por día',
    notas TEXT NULL,
    creado_por INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de registros diarios de uso de prótesis
CREATE TABLE IF NOT EXISTS protocolo_uso_registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    horas_uso DECIMAL(4,1) NOT NULL COMMENT 'Horas de uso en el día',
    dolor_nivel TINYINT DEFAULT 0 COMMENT 'Nivel de dolor 0-10',
    molestias TEXT NULL,
    actividades_realizadas TEXT NULL,
    tolerancia ENUM('excelente','buena','regular','mala') DEFAULT 'buena',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_paciente_fecha (paciente_id, fecha),
    INDEX idx_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
