CREATE TABLE IF NOT EXISTS cuestionarios_personalizados (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  especialista_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'personalizado',
  archivo_url VARCHAR(500),
  archivo_nombre VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_especialista (especialista_id),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
