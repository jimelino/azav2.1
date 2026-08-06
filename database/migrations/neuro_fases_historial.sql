-- Historial de fases de tratamiento específico de Neuropsicología.
-- Separado del sistema global de fases (fases_tratamiento / pacientes.fase_actual_id)
-- porque ese ya está atado al proceso protésico (Ortesis/Fisioterapia) y es una
-- sola fase global por paciente, no una por módulo.
--
-- No hay tabla de "estado actual" aparte: la fase vigente de un paciente es su
-- fila más reciente en esta tabla (o fase 1 "Consulta inicial" implícita si no
-- tiene ninguna). Evita el bug clásico de un estado y un historial desincronizados.
CREATE TABLE IF NOT EXISTS neuro_fases_historial (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fase_numero TINYINT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    INDEX idx_paciente_fecha (paciente_id, created_at)
) ENGINE=InnoDB;
