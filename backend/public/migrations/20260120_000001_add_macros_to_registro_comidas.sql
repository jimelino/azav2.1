-- Migración: Agregar columnas de macronutrientes a registro_comidas
-- Fecha: 2026-01-20

ALTER TABLE registro_comidas
ADD COLUMN calorias INT UNSIGNED DEFAULT 0 AFTER descripcion,
ADD COLUMN carbohidratos INT UNSIGNED DEFAULT 0 AFTER calorias,
ADD COLUMN proteinas INT UNSIGNED DEFAULT 0 AFTER carbohidratos,
ADD COLUMN grasas INT UNSIGNED DEFAULT 0 AFTER proteinas;

-- Crear tabla de registro de agua si no existe
CREATE TABLE IF NOT EXISTS registro_agua (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    cantidad DECIMAL(4,2) DEFAULT 0,
    vasos INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB;

-- Crear tabla de objetivos de nutrición si no existe
CREATE TABLE IF NOT EXISTS objetivos_nutricion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    calorias INT UNSIGNED DEFAULT 1800,
    carbohidratos INT UNSIGNED DEFAULT 167,
    proteinas INT UNSIGNED DEFAULT 93,
    grasas INT UNSIGNED DEFAULT 49,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_paciente (paciente_id)
) ENGINE=InnoDB;
