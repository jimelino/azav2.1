-- =============================================
-- MIGRACIÓN: Planes Nutricionales
-- Descripción: Tablas para almacenar planes nutricionales
--              cargados desde PDFs y asignados a pacientes
-- =============================================

-- Tabla principal de planes nutricionales
CREATE TABLE IF NOT EXISTS planes_nutricionales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    especialista_id INT UNSIGNED NOT NULL,
    -- Archivo PDF original
    archivo_pdf VARCHAR(500),
    archivo_nombre VARCHAR(255),
    -- JSON procesado del plan
    contenido_json JSON,
    -- Metadatos
    calorias_diarias INT,
    proteinas_g DECIMAL(6,2),
    carbohidratos_g DECIMAL(6,2),
    grasas_g DECIMAL(6,2),
    fibra_g DECIMAL(6,2),
    -- Estado y fechas
    estado ENUM('borrador', 'activo', 'archivado') DEFAULT 'borrador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de asignación de planes a pacientes
CREATE TABLE IF NOT EXISTS planes_nutricionales_paciente (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plan_id INT UNSIGNED NOT NULL,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    -- Personalización del plan para este paciente
    notas_personalizadas TEXT,
    ajustes_json JSON,
    -- Fechas de vigencia
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    -- Estado
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES planes_nutricionales(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de comidas del plan (estructura del JSON desglosada)
CREATE TABLE IF NOT EXISTS plan_comidas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plan_id INT UNSIGNED NOT NULL,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    tipo_comida ENUM('desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'snack') NOT NULL,
    hora_sugerida TIME,
    nombre_plato VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ingredientes JSON,
    -- Información nutricional de esta comida
    calorias INT,
    proteinas_g DECIMAL(6,2),
    carbohidratos_g DECIMAL(6,2),
    grasas_g DECIMAL(6,2),
    -- Orden de aparición
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES planes_nutricionales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para tracking del seguimiento del plan por el paciente
CREATE TABLE IF NOT EXISTS seguimiento_plan_nutricional (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asignacion_id INT UNSIGNED NOT NULL,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    comida_id INT UNSIGNED,
    tipo_comida VARCHAR(50),
    -- ¿Cumplió con la comida?
    cumplido TINYINT(1) DEFAULT 0,
    -- Notas del paciente
    notas TEXT,
    -- Foto de la comida (opcional)
    foto_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asignacion_id) REFERENCES planes_nutricionales_paciente(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (comida_id) REFERENCES plan_comidas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para optimizar consultas
CREATE INDEX idx_planes_especialista ON planes_nutricionales(especialista_id);
CREATE INDEX idx_planes_estado ON planes_nutricionales(estado);
CREATE INDEX idx_asignacion_paciente ON planes_nutricionales_paciente(paciente_id);
CREATE INDEX idx_asignacion_activo ON planes_nutricionales_paciente(activo);
CREATE INDEX idx_comidas_plan ON plan_comidas(plan_id);
CREATE INDEX idx_comidas_dia ON plan_comidas(dia_semana);
CREATE INDEX idx_seguimiento_fecha ON seguimiento_plan_nutricional(fecha);