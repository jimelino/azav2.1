-- =====================================================
-- Migración: Módulos de Fisioterapia para Especialista
-- Fecha: 2026-02-22
-- Tablas: evaluaciones_fisicas, planes_tratamiento, plan_tratamiento_ejercicios
-- =====================================================

-- Evaluaciones físicas del paciente
CREATE TABLE IF NOT EXISTS evaluaciones_fisicas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    -- ROM (Rango de Movimiento) en grados
    rom_rodilla_flexion DECIMAL(5,1) NULL,
    rom_rodilla_extension DECIMAL(5,1) NULL,
    rom_cadera_flexion DECIMAL(5,1) NULL,
    rom_cadera_extension DECIMAL(5,1) NULL,
    rom_tobillo_dorsiflexion DECIMAL(5,1) NULL,
    rom_tobillo_plantiflexion DECIMAL(5,1) NULL,
    -- Fuerza muscular (escala 0-5)
    fuerza_cuadriceps TINYINT UNSIGNED NULL,
    fuerza_isquiotibiales TINYINT UNSIGNED NULL,
    fuerza_gluteos TINYINT UNSIGNED NULL,
    fuerza_pantorrilla TINYINT UNSIGNED NULL,
    -- Dolor (escala EVA 0-10)
    dolor_reposo TINYINT UNSIGNED NULL,
    dolor_movimiento TINYINT UNSIGNED NULL,
    dolor_carga TINYINT UNSIGNED NULL,
    -- Tests funcionales
    test_equilibrio_unipodal INT UNSIGNED NULL COMMENT 'segundos',
    test_timed_up_go DECIMAL(5,1) NULL COMMENT 'segundos',
    test_marcha_6min DECIMAL(6,1) NULL COMMENT 'metros',
    test_berg_balance TINYINT UNSIGNED NULL COMMENT 'puntuacion 0-56',
    -- Observaciones
    observaciones TEXT NULL,
    notas_plan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    INDEX idx_eval_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Planes de tratamiento de fisioterapia
CREATE TABLE IF NOT EXISTS planes_tratamiento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    objetivo TEXT NULL,
    duracion_semanas INT UNSIGNED DEFAULT 4,
    frecuencia_semanal INT UNSIGNED DEFAULT 3,
    estado ENUM('activo','pausado','completado','cancelado') DEFAULT 'activo',
    notas TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    INDEX idx_plan_paciente (paciente_id),
    INDEX idx_plan_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejercicios dentro de un plan de tratamiento
CREATE TABLE IF NOT EXISTS plan_tratamiento_ejercicios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plan_id INT UNSIGNED NOT NULL,
    video_id INT UNSIGNED NOT NULL,
    orden INT UNSIGNED DEFAULT 0,
    series INT UNSIGNED DEFAULT 3,
    repeticiones VARCHAR(50) DEFAULT '10',
    duracion_segundos INT UNSIGNED NULL,
    descanso_segundos INT UNSIGNED DEFAULT 30,
    notas TEXT NULL,
    FOREIGN KEY (plan_id) REFERENCES planes_tratamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos_ejercicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
