-- Contrato terapéutico de Neuropsicología: lo sube el especialista asignado,
-- el paciente lo descarga. Historial append-only (mismo criterio que
-- neuro_fases_historial); el contrato vigente es la fila más reciente.
CREATE TABLE IF NOT EXISTS neuro_contratos_terapeuticos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    archivo_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    INDEX idx_paciente_fecha (paciente_id, created_at)
) ENGINE=InnoDB;
