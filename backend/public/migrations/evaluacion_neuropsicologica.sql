-- Migración: Tabla de evaluaciones neuropsicológicas
-- Almacena las evaluaciones realizadas por el especialista al paciente
-- Cada registro contiene puntajes de funciones cognitivas (escala 0-10)

CREATE TABLE IF NOT EXISTS evaluaciones_neuropsicologicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    notas TEXT NULL,

    -- Funciones cognitivas evaluadas (escala 0-10)
    atencion_visual DECIMAL(3,1) NULL,
    atencion_auditiva DECIMAL(3,1) NULL,
    memoria_visual DECIMAL(3,1) NULL,
    memoria_auditiva DECIMAL(3,1) NULL,
    memoria_trabajo DECIMAL(3,1) NULL,
    funciones_ejecutivas DECIMAL(3,1) NULL,
    velocidad_procesamiento DECIMAL(3,1) NULL,
    orientacion DECIMAL(3,1) NULL,
    lenguaje DECIMAL(3,1) NULL,
    razonamiento DECIMAL(3,1) NULL,
    flexibilidad_cognitiva DECIMAL(3,1) NULL,
    planificacion DECIMAL(3,1) NULL,
    control_inhibitorio DECIMAL(3,1) NULL,
    praxias DECIMAL(3,1) NULL,
    gnosias DECIMAL(3,1) NULL,
    calculo DECIMAL(3,1) NULL,
    comprension_verbal DECIMAL(3,1) NULL,
    habilidades_visuoespaciales DECIMAL(3,1) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_paciente (paciente_id),
    INDEX idx_especialista (especialista_id),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
