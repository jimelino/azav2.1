-- Migración: Tabla de asignaciones de herramientas ACT
-- Fecha: 2026-03-10

CREATE TABLE IF NOT EXISTS act_asignaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    herramienta_id VARCHAR(100) NOT NULL,
    herramienta_nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    notas_especialista TEXT NULL,
    prioridad ENUM('normal','alta') DEFAULT 'normal',
    estado ENUM('pendiente','completada','cancelada') DEFAULT 'pendiente',
    fecha_completada DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_paciente_estado (paciente_id, estado),
    INDEX idx_especialista (especialista_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
