-- Migración: Tablas para módulo de Neuropsicología ACT
-- Cuestionarios psicométricos y herramientas ACT

-- Resultados de cuestionarios psicométricos (AAQ-2, AADQ, Cancer AAQ, VLQ)
CREATE TABLE IF NOT EXISTS resultados_cuestionarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    tipo_cuestionario VARCHAR(30) NOT NULL,
    puntuacion_total DECIMAL(8,2),
    puntuacion_detalle JSON,
    interpretacion VARCHAR(100),
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_rc_paciente_tipo (paciente_id, tipo_cuestionario),
    INDEX idx_rc_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sesiones de herramientas ACT completadas
CREATE TABLE IF NOT EXISTS act_sesiones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    herramienta VARCHAR(100) NOT NULL,
    completado TINYINT(1) DEFAULT 1,
    notas_usuario TEXT,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_as_paciente_fecha (paciente_id, fecha),
    INDEX idx_as_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
