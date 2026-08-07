-- Historial de fases del proceso de fabricación/adaptación de Órtesis y
-- Prótesis, propio del módulo (1: Valoración .. 7: Seguimiento). Separado
-- del sistema global de fases (fases_tratamiento / pacientes.fase_actual_id)
-- por el mismo motivo que neuro_fases_historial: ese sistema global es de
-- rehabilitación general y ya está en uso, mientras que este es específico
-- del flujo de fabricación del dispositivo.
--
-- No hay tabla de "estado actual" aparte: la fase vigente de un paciente es
-- su fila más reciente en esta tabla (o fase 1 "Valoración" implícita si no
-- tiene ninguna).
CREATE TABLE IF NOT EXISTS ortesis_fases_historial (
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
