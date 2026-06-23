-- Migración: Tabla de mediciones antropométricas para módulo de nutrición especialista
-- Fecha: 2026-02-19

CREATE TABLE IF NOT EXISTS mediciones_antropometricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    peso DECIMAL(5,2) COMMENT 'Peso en kg',
    talla DECIMAL(5,2) COMMENT 'Talla en cm',
    imc DECIMAL(5,2) AS (CASE WHEN talla > 0 THEN peso / POWER(talla/100, 2) ELSE NULL END) STORED COMMENT 'IMC calculado automáticamente',
    circunferencia_cintura DECIMAL(5,2) COMMENT 'Circunferencia de cintura en cm',
    circunferencia_cadera DECIMAL(5,2) COMMENT 'Circunferencia de cadera en cm',
    notas TEXT,
    fecha_medicion DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha_medicion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;