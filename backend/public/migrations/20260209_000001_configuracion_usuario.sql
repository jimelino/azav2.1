-- Tabla de configuración/preferencias del usuario
CREATE TABLE IF NOT EXISTS configuracion_usuario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    -- Notificaciones
    notif_recordatorios_medicamentos TINYINT(1) DEFAULT 1,
    notif_recordatorios_ejercicios TINYINT(1) DEFAULT 1,
    notif_recordatorios_citas TINYINT(1) DEFAULT 1,
    notif_mensajes_chat TINYINT(1) DEFAULT 1,
    notif_actualizaciones_blog TINYINT(1) DEFAULT 0,
    notif_comunidad TINYINT(1) DEFAULT 0,
    notif_sonido TINYINT(1) DEFAULT 1,
    notif_vibracion TINYINT(1) DEFAULT 1,
    -- Privacidad
    perfil_visible_comunidad TINYINT(1) DEFAULT 1,
    mostrar_nombre_real TINYINT(1) DEFAULT 1,
    permitir_mensajes_pacientes TINYINT(1) DEFAULT 0,
    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
