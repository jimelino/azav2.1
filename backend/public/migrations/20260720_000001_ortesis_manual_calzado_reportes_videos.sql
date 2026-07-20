-- Correcciones y nuevos modulos para Ortesis y Protesis
-- Fecha: 2026-07-20

CREATE TABLE IF NOT EXISTS manual_informativo_ortesis (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria ENUM('ortesis', 'protesis', 'general') NOT NULL DEFAULT 'general',
    titulo VARCHAR(180) NOT NULL,
    subtitulo VARCHAR(220) NULL,
    contenido TEXT NOT NULL,
    objetivos JSON NULL,
    tipos_comunes JSON NULL,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_por INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_manual_categoria_titulo (categoria, titulo),
    INDEX idx_manual_categoria (categoria, activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calzado_autorizado (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    tipo_calzado VARCHAR(140) NOT NULL,
    descripcion TEXT NULL,
    recomendaciones TEXT NULL,
    restricciones TEXT NULL,
    fecha_autorizacion DATE NOT NULL,
    vigencia_hasta DATE NULL,
    estado ENUM('activo', 'suspendido', 'vencido') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_calzado_paciente_estado (paciente_id, estado),
    INDEX idx_calzado_especialista (especialista_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reportes_molestias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NULL,
    dispositivo_id INT UNSIGNED NULL,
    descripcion TEXT NOT NULL,
    nota_voz_url VARCHAR(500) NULL,
    evidencia_foto_url VARCHAR(500) NULL,
    estado ENUM('pendiente', 'notificado', 'en_revision', 'resuelto', 'cancelado') NOT NULL DEFAULT 'pendiente',
    prioridad ENUM('normal', 'urgente') NOT NULL DEFAULT 'urgente',
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion TIMESTAMP NULL,
    notas_atencion TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_paciente(id) ON DELETE SET NULL,
    INDEX idx_molestias_paciente_fecha (paciente_id, fecha_reporte),
    INDEX idx_molestias_especialista_estado (especialista_id, estado),
    INDEX idx_molestias_prioridad (prioridad, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS videotutoriales_cuidados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    descripcion TEXT NOT NULL,
    url_video VARCHAR(500) NOT NULL,
    categoria ENUM('ortesis', 'protesis') NOT NULL,
    subcategoria VARCHAR(100) NULL,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_por INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_video_categoria_titulo (categoria, titulo),
    INDEX idx_videos_categoria (categoria, activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, objetivos, tipos_comunes, orden, activo)
VALUES
    (
        'ortesis',
        '¿Qué es una órtesis y cuáles son sus objetivos?',
        'Manual Informativo de Órtesis',
        'Una órtesis es un dispositivo externo diseñado para apoyar, corregir, proteger o estabilizar una parte del cuerpo durante la recuperación o la actividad diaria.',
        '["Estabilizar articulaciones y reducir dolor","Corregir deformidades y facilitar movilidad","Proteger tejidos y mejorar independencia"]',
        '["Miembro superior: mano, muñeca, codo u hombro","Miembro inferior: pie, tobillo, rodilla o cadera","Espinales: cervicales, torácicas y lumbares","Dinámicas y estáticas según el objetivo funcional"]',
        1,
        1
    ),
    (
        'protesis',
        '¿Qué es una prótesis y cuáles son sus objetivos?',
        'Manual Informativo de Prótesis',
        'Una prótesis reemplaza parcial o totalmente una parte ausente del cuerpo y busca recuperar función, marcha, apoyo, estética y autonomía.',
        '["Restituir apoyo o función perdida","Mejorar movilidad segura y tolerancia al esfuerzo","Favorecer independencia en actividades diarias"]',
        '["Transtibiales: debajo de rodilla","Transfemorales: arriba de rodilla","Parciales de pie","Miembro superior funcional o cosmético"]',
        2,
        1
    )
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);

INSERT INTO videotutoriales_cuidados
    (titulo, descripcion, url_video, categoria, subcategoria, orden, activo)
VALUES
    ('Limpieza del Liner y Socket', 'Lavar el liner diariamente con agua limpia y jabón neutro. Enjuagar y dejar secar a la sombra sin exprimir.', 'https://www.youtube.com/results?search_query=limpieza+liner+socket+protesis', 'protesis', 'limpieza_protesis', 1, 1),
    ('Cuidado del Muñón', 'Qué hacer ante zonas rojas, bultos de presión o fatiga durante el uso de la prótesis.', 'https://www.youtube.com/results?search_query=cuidado+munon+protesis', 'protesis', 'cuidado_munon', 2, 1),
    ('Colocación segura de la órtesis', 'Guía para colocar, retirar y revisar puntos de presión de una órtesis.', 'https://www.youtube.com/results?search_query=colocacion+segura+ortesis', 'ortesis', 'uso_ortesis', 1, 1)
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);
