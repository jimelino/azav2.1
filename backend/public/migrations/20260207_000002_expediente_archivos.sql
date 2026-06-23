-- =============================================
-- Azaria - Expediente del Paciente
-- Tablas para archivos y compartir expediente
-- =============================================

CREATE TABLE IF NOT EXISTS archivos_expediente (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    subido_por INT UNSIGNED NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(10) NOT NULL,
    tamano INT UNSIGNED NOT NULL,
    categoria VARCHAR(50) DEFAULT 'analisis',
    descripcion TEXT,
    fecha_estudio DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id),
    INDEX idx_ae_paciente (paciente_id),
    INDEX idx_ae_fecha (fecha_estudio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expediente_compartido (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_ec_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
