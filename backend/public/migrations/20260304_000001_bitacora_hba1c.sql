-- Migración: Tabla bitacora_hba1c para registro de Hemoglobina Glicosilada
-- Fecha: 2026-03-04

CREATE TABLE IF NOT EXISTS bitacora_hba1c (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    valor DECIMAL(4,2) NOT NULL COMMENT 'Valor de HbA1c en porcentaje (ej: 6.50)',
    notas TEXT,
    fecha DATE NOT NULL COMMENT 'Fecha del estudio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_hba1c_paciente_fecha (paciente_id, fecha DESC),
    INDEX idx_hba1c_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
