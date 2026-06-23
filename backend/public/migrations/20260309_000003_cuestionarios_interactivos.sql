-- Actualizar tabla de cuestionarios para incluir preguntas interactivas
ALTER TABLE cuestionarios_personalizados
  ADD COLUMN preguntas JSON NULL AFTER tipo,
  ADD COLUMN asignado_a JSON NULL COMMENT 'IDs de pacientes asignados' AFTER preguntas;

-- Tabla de respuestas de usuarios a cuestionarios personalizados
CREATE TABLE IF NOT EXISTS respuestas_cuestionarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuestionario_id BIGINT UNSIGNED NOT NULL,
  paciente_id INT UNSIGNED NOT NULL,
  respuestas JSON NOT NULL,
  puntaje_total DECIMAL(8,2) NULL,
  completado TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cuestionario_id) REFERENCES cuestionarios_personalizados(id) ON DELETE CASCADE,
  INDEX idx_cuest_pac (cuestionario_id, paciente_id),
  INDEX idx_paciente (paciente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
