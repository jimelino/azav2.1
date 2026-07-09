-- 1. Desactivamos las revisiones de llaves foráneas un momento para que nos deje crear todo sin trabas
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Creamos la tabla principal usando 'INT UNSIGNED' para que combine perfectamente con tus pacientes
CREATE TABLE IF NOT EXISTS `planes_equivalentes_periodo` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `paciente_id` INT UNSIGNED NOT NULL,
    `especialista_id` INT UNSIGNED NOT NULL,
    `calorias_totales` INT DEFAULT 0,
    `proteinas_g` INT DEFAULT 0,
    `carbohidratos_g` INT DEFAULT 0,
    `grasas_g` INT DEFAULT 0,
    `recomendaciones` TEXT NULL,
    `status` ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Creamos la tabla de detalle apuntando correctamente al id UNSIGNED de arriba
CREATE TABLE IF NOT EXISTS `plan_porciones_equivalentes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `plan_equivalente_id` INT UNSIGNED NOT NULL,
    `grupo_alimenticio_id` INT UNSIGNED NOT NULL,
    `desayuno` DECIMAL(4,2) DEFAULT 0.00,
    `colacion_matutina` DECIMAL(4,2) DEFAULT 0.00,
    `comida` DECIMAL(4,2) DEFAULT 0.00,
    `colacion_vespertina` DECIMAL(4,2) DEFAULT 0.00,
    `cena` DECIMAL(4,2) DEFAULT 0.00,
    FOREIGN KEY (`plan_equivalente_id`) REFERENCES `planes_equivalentes_periodo`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Volvemos a activar las revisiones de llaves foráneas por seguridad
SET FOREIGN_KEY_CHECKS = 1;