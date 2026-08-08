-- Soporte para la API de integración que recibe datos empujados por el
-- sistema clínico externo de Neuropsicología (pacientes, especialistas,
-- asignaciones, citas y resultados de evaluación en PDF).

ALTER TABLE usuarios
  ADD COLUMN foto_perfil_url VARCHAR(500) NULL;

ALTER TABLE citas
  ADD COLUMN id_externo VARCHAR(100) NULL,
  ADD INDEX idx_id_externo (id_externo);

-- Resultados de evaluación (PDF) subidos por el sistema externo. Historial
-- append-only, igual que neuro_contratos_terapeuticos.
CREATE TABLE IF NOT EXISTS neuro_resultados_evaluacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    id_externo VARCHAR(100) NULL,
    archivo_url VARCHAR(500) NOT NULL,
    titulo VARCHAR(200) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, created_at)
) ENGINE=InnoDB;
