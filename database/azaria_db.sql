-- =====================================================
-- SISTEMA AZARIA 2.0 - BASE DE DATOS MySQL 8.0+
-- Sistema de Adherencia Terapéutica
-- =====================================================
-- Autor: Mar (Ingeniería en Desarrollo y Gestión de Software)
-- Cliente: UIOyP - ENES Juriquilla, UNAM
-- Fecha: Enero 2025
-- =====================================================
-- IMPORTANTE: Si importas esta exportación en una base de datos existente como Aiven
-- MySQL, elimina o comenta las instrucciones DROP/CREATE DATABASE y USE azaria_db
-- antes de ejecutar el script. Usa el esquema de destino (por ejemplo defaultdb).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- IMPORTANTE: Este script se importa en la base de datos activa.
-- Si estás usando Aiven MySQL, ejecuta:
--   mysql -h <host> -P <port> -u <user> -p defaultdb < azaria_db.sql
-- No necesita DROP/CREATE/USE de la base de datos.

-- =====================================================
-- MÓDULO 1: USUARIOS Y AUTENTICACIÓN
-- =====================================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar roles base
INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Acceso total al sistema, gestión de usuarios, configuración global'),
('especialista', 'Gestión de pacientes asignados, creación de contenido, moderación'),
('paciente', 'Registro de información personal, consulta de contenido, interacción con comunidad');

-- Tabla de áreas médicas
CREATE TABLE IF NOT EXISTS areas_medicas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    icono VARCHAR(50),
    color VARCHAR(7) DEFAULT '#000000',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar áreas médicas
INSERT INTO areas_medicas (nombre, descripcion, icono, color) VALUES
('fisioterapia', 'Rehabilitación física y ejercicios terapéuticos', 'fitness', '#4CAF50'),
('nutricion', 'Alimentación y planes nutricionales', 'restaurant', '#FF9800'),
('medicina', 'Seguimiento médico general y bitácoras de salud', 'medical_services', '#F44336'),
('neuropsicologia', 'Salud mental y bienestar emocional', 'psychology', '#9C27B0'),
('ortesis', 'Dispositivos ortopédicos y prótesis', 'accessibility', '#2196F3');

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) DEFAULT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    rol_id INT UNSIGNED NOT NULL,
    area_medica_id INT UNSIGNED DEFAULT NULL,

    -- Estado de cuenta
    activo TINYINT(1) DEFAULT 1,
    primer_acceso TINYINT(1) DEFAULT 1,
    email_verificado TINYINT(1) DEFAULT 0,
    email_verificado_at TIMESTAMP NULL,

    -- Preferencias de autenticación
    usar_pin TINYINT(1) DEFAULT 0,
    mantener_sesion TINYINT(1) DEFAULT 1,

    -- Bloqueo por intentos fallidos
    intentos_fallidos INT UNSIGNED DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,

    -- Configuración de comunidad
    perfil_publico TINYINT(1) DEFAULT 1,
    mostrar_nombre_real TINYINT(1) DEFAULT 1,
    nombre_anonimo VARCHAR(50) DEFAULT NULL,
    publicaciones_aprobadas INT UNSIGNED DEFAULT 0,

    -- Timestamps
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id),

    INDEX idx_email (email),
    INDEX idx_rol (rol_id),
    INDEX idx_area (area_medica_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- Tabla de sesiones persistentes
CREATE TABLE IF NOT EXISTS sesiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,

    -- Información del dispositivo
    dispositivo VARCHAR(255),
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    ip_address VARCHAR(45),
    ubicacion_aproximada VARCHAR(255),

    -- Control de sesión
    es_confiable TINYINT(1) DEFAULT 0,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_usuario (usuario_id),
    INDEX idx_expiracion (expira_en)
) ENGINE=InnoDB;

-- Tabla de tokens de recuperación
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    tipo ENUM('password', 'pin', 'email_verificacion') NOT NULL,
    intentos INT UNSIGNED DEFAULT 0,
    usado TINYINT(1) DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_codigo (codigo),
    INDEX idx_usuario_tipo (usuario_id, tipo)
) ENGINE=InnoDB;

-- Tabla de log de accesos
CREATE TABLE IF NOT EXISTS log_accesos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    email_intento VARCHAR(255),
    accion ENUM('login_exitoso', 'login_fallido', 'logout', 'recuperacion_solicitada', 'recuperacion_exitosa', 'bloqueo_cuenta', 'cambio_password', 'cambio_pin') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 2: PERFIL Y FASES DE TRATAMIENTO
-- =====================================================

-- Tabla de fases de tratamiento
CREATE TABLE IF NOT EXISTS fases_tratamiento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero TINYINT UNSIGNED NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar fases
INSERT INTO fases_tratamiento (numero, nombre, descripcion) VALUES
(1, 'Preconsulta', 'Primera aproximación al dispositivo, evaluaciones médicas y plan de tratamiento.'),
(2, 'Adaptación al ejercicio', 'Aprendizaje de uso del dispositivo, ejercicios básicos y ajustes iniciales.'),
(3, 'Preprotésico', 'Uso regular del dispositivo, monitoreo constante y correcciones necesarias.'),
(4, 'Protésico', 'Uso independiente del dispositivo con seguimiento periódico.'),
(5, 'Posprotésico', 'Consolidación de la autonomía y adaptación funcional avanzada a la vida diaria.'),
(6, 'Alta/Graduación', 'Finalización formal del proceso de rehabilitación y alta clínica.'),
(7, 'Seguimiento a 6 meses', 'Evaluación de control semestral para asegurar el buen estado del dispositivo y confort.'),
(8, 'Seguimiento a 12 meses', 'Evaluación de control anual y cierre de ciclo de seguimiento prolongado.')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);

-- Tabla de pacientes (información adicional)
CREATE TABLE IF NOT EXISTS pacientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    fase_actual_id INT UNSIGNED DEFAULT 1,
    fecha_cambio_fase DATE,
    progreso_general DECIMAL(5,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (fase_actual_id) REFERENCES fases_tratamiento(id),
    INDEX idx_fase (fase_actual_id)
) ENGINE=InnoDB;

-- Tabla de historial de cambios de fase
CREATE TABLE IF NOT EXISTS historial_fases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fase_anterior_id INT UNSIGNED,
    fase_nueva_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (fase_anterior_id) REFERENCES fases_tratamiento(id),
    FOREIGN KEY (fase_nueva_id) REFERENCES fases_tratamiento(id),
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    INDEX idx_paciente (paciente_id),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB;

-- Tabla de asignación paciente-especialista
CREATE TABLE IF NOT EXISTS asignaciones_especialista (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    area_medica_id INT UNSIGNED NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_asignacion DATE NOT NULL,
    fecha_fin DATE DEFAULT NULL,
    asignado_por INT UNSIGNED NOT NULL,
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id),
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),

    UNIQUE KEY unique_asignacion (paciente_id, area_medica_id, activo),
    INDEX idx_especialista (especialista_id),
    INDEX idx_area (area_medica_id)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 3: NUTRICIÓN
-- =====================================================

-- Tipos de comida
CREATE TABLE IF NOT EXISTS tipos_comida (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    orden INT UNSIGNED DEFAULT 0,
    hora_sugerida TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO tipos_comida (nombre, orden, hora_sugerida) VALUES
('desayuno', 1, '08:00:00'),
('colacion_matutina', 2, '11:00:00'),
('comida', 3, '14:00:00'),
('colacion_vespertina', 4, '17:00:00'),
('cena', 5, '20:00:00');

-- Registro de comidas
CREATE TABLE IF NOT EXISTS registro_comidas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    tipo_comida_id INT UNSIGNED NOT NULL,
    descripcion TEXT NOT NULL,
    foto_url VARCHAR(500),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_comida_id) REFERENCES tipos_comida(id),
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- Checklist diario de comidas
CREATE TABLE IF NOT EXISTS checklist_comidas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    desayuno TINYINT(1) DEFAULT 0,
    colacion_matutina TINYINT(1) DEFAULT 0,
    comida TINYINT(1) DEFAULT 0,
    colacion_vespertina TINYINT(1) DEFAULT 0,
    cena TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_checklist (paciente_id, fecha),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- Catálogo de recetas
CREATE TABLE IF NOT EXISTS recetas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ingredientes JSON NOT NULL,
    instrucciones JSON NOT NULL,
    tiempo_preparacion INT UNSIGNED,
    porciones INT UNSIGNED DEFAULT 1,

    -- Valores nutricionales
    calorias DECIMAL(8,2),
    proteinas DECIMAL(8,2),
    carbohidratos DECIMAL(8,2),
    grasas DECIMAL(8,2),

    imagen_url VARCHAR(500),
    tipo_comida_id INT UNSIGNED,
    creado_por INT UNSIGNED NOT NULL,
    publicada TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tipo_comida_id) REFERENCES tipos_comida(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_tipo (tipo_comida_id),
    INDEX idx_publicada (publicada),
    FULLTEXT INDEX ft_recetas (titulo, descripcion)
) ENGINE=InnoDB;

-- Asignación de recetas a pacientes
CREATE TABLE IF NOT EXISTS recetas_asignadas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    receta_id INT UNSIGNED NOT NULL,
    asignado_por INT UNSIGNED NOT NULL,
    notas_personalizadas TEXT,
    activo TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_asignacion (paciente_id, receta_id),
    INDEX idx_paciente (paciente_id)
) ENGINE=InnoDB;

-- Recetas favoritas
CREATE TABLE IF NOT EXISTS recetas_favoritas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    receta_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, receta_id)
) ENGINE=InnoDB;

-- Cuestionarios de nutrición
CREATE TABLE IF NOT EXISTS cuestionarios_nutricion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,

    comio_fuera_casa TINYINT(1),
    vasos_agua INT UNSIGNED,
    sintio_hambre_entre_comidas TINYINT(1),
    dificultades TEXT,
    observaciones TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 4: MEDICINA
-- =====================================================

-- Momentos de medición
CREATE TABLE IF NOT EXISTS momentos_medicion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    orden INT UNSIGNED DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO momentos_medicion (nombre, descripcion, orden) VALUES
('ayuno', 'Antes del desayuno', 1),
('post_desayuno', 'Después del desayuno', 2),
('pre_comida', 'Antes de la comida', 3),
('post_comida', 'Después de la comida', 4),
('pre_cena', 'Antes de la cena', 5),
('post_cena', 'Después de la cena', 6),
('antes_dormir', 'Antes de dormir', 7);

-- Bitácora de glucosa
CREATE TABLE IF NOT EXISTS bitacora_glucosa (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    valor DECIMAL(5,1) NOT NULL,
    momento_id INT UNSIGNED NOT NULL,
    notas TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    alerta_generada TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (momento_id) REFERENCES momentos_medicion(id),
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_alerta (alerta_generada)
) ENGINE=InnoDB;

-- Bitácora de presión arterial
CREATE TABLE IF NOT EXISTS bitacora_presion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    sistolica INT UNSIGNED NOT NULL,
    diastolica INT UNSIGNED NOT NULL,
    pulso INT UNSIGNED,
    notas TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    alerta_generada TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- Ubicaciones de dolor
CREATE TABLE IF NOT EXISTS ubicaciones_dolor (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO ubicaciones_dolor (nombre, descripcion) VALUES
('munon', 'Muñón'),
('rodilla', 'Rodilla'),
('cadera', 'Cadera'),
('espalda', 'Espalda'),
('hombro', 'Hombro'),
('cuello', 'Cuello'),
('pie', 'Pie'),
('mano', 'Mano'),
('otro', 'Otra ubicación');

-- Tipos de dolor
CREATE TABLE IF NOT EXISTS tipos_dolor (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO tipos_dolor (nombre, descripcion) VALUES
('punzante', 'Dolor punzante o agudo'),
('sordo', 'Dolor sordo o persistente'),
('quemante', 'Sensación de quemadura'),
('pulsatil', 'Dolor pulsátil'),
('hormigueo', 'Hormigueo o entumecimiento'),
('calambres', 'Calambres musculares'),
('otro', 'Otro tipo de dolor');

-- Bitácora de dolor
CREATE TABLE IF NOT EXISTS bitacora_dolor (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    intensidad TINYINT UNSIGNED NOT NULL,
    ubicacion_id INT UNSIGNED NOT NULL,
    tipo_dolor_id INT UNSIGNED,
    notas TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    alerta_generada TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones_dolor(id),
    FOREIGN KEY (tipo_dolor_id) REFERENCES tipos_dolor(id),
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_intensidad (intensidad)
) ENGINE=InnoDB;

-- Catálogo de medicamentos por paciente
CREATE TABLE IF NOT EXISTS medicamentos_paciente (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    nombre_comercial VARCHAR(255) NOT NULL,
    nombre_generico VARCHAR(255),
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    via_administracion ENUM('oral', 'inyectable', 'topica', 'inhalada', 'sublingual', 'otra') DEFAULT 'oral',
    instrucciones_especiales TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo TINYINT(1) DEFAULT 1,
    creado_por INT UNSIGNED NOT NULL,
    notas_medico TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_paciente (paciente_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- Horarios de medicamentos
CREATE TABLE IF NOT EXISTS horarios_medicamento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT UNSIGNED NOT NULL,
    hora TIME NOT NULL,
    activo TINYINT(1) DEFAULT 1,

    FOREIGN KEY (medicamento_id) REFERENCES medicamentos_paciente(id) ON DELETE CASCADE,
    INDEX idx_medicamento (medicamento_id)
) ENGINE=InnoDB;

-- Registro de toma de medicamentos
CREATE TABLE IF NOT EXISTS registro_medicamentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT UNSIGNED NOT NULL,
    paciente_id INT UNSIGNED NOT NULL,
    horario_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    hora_programada TIME NOT NULL,
    hora_real TIME,
    estado ENUM('tomado_a_tiempo', 'tomado_tarde', 'omitido', 'doble_dosis') NOT NULL,
    motivo_omision ENUM('olvide', 'no_tenia_medicamento', 'efectos_secundarios', 'otro') DEFAULT NULL,
    efectos_secundarios TEXT,
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (medicamento_id) REFERENCES medicamentos_paciente(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (horario_id) REFERENCES horarios_medicamento(id),
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_medicamento_fecha (medicamento_id, fecha),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Alertas médicas
CREATE TABLE IF NOT EXISTS alertas_medicas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    tipo ENUM('glucosa', 'presion', 'dolor', 'adherencia_medicamento', 'efectos_secundarios', 'medicamento_sin_stock', 'patron_olvido') NOT NULL,
    severidad ENUM('baja', 'media', 'alta') NOT NULL,
    mensaje TEXT NOT NULL,
    datos_referencia JSON,
    atendida TINYINT(1) DEFAULT 0,
    atendida_por INT UNSIGNED,
    atendida_en TIMESTAMP NULL,
    acciones_tomadas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (atendida_por) REFERENCES usuarios(id),
    INDEX idx_paciente (paciente_id),
    INDEX idx_tipo (tipo),
    INDEX idx_atendida (atendida),
    INDEX idx_severidad (severidad)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 5: FISIOTERAPIA
-- =====================================================

-- Categorías de ejercicios
CREATE TABLE IF NOT EXISTS categorias_ejercicio (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categorias_ejercicio (nombre, descripcion) VALUES
('fortalecimiento', 'Ejercicios para fortalecer músculos'),
('estiramiento', 'Ejercicios de estiramiento y flexibilidad'),
('balance', 'Ejercicios de equilibrio y coordinación'),
('cardio', 'Ejercicios cardiovasculares');

-- Niveles de dificultad
CREATE TABLE IF NOT EXISTS niveles_ejercicio (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    orden INT UNSIGNED DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO niveles_ejercicio (nombre, orden) VALUES
('basico', 1),
('intermedio', 2),
('avanzado', 3);

-- Catálogo de videos de ejercicios
CREATE TABLE IF NOT EXISTS videos_ejercicios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_video_id VARCHAR(20) NOT NULL,
    duracion_minutos INT UNSIGNED,
    nivel_id INT UNSIGNED NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    thumbnail_url VARCHAR(500),
    instrucciones TEXT,
    precauciones TEXT,
    creado_por INT UNSIGNED NOT NULL,
    publicado TINYINT(1) DEFAULT 1,
    vistas INT UNSIGNED DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (nivel_id) REFERENCES niveles_ejercicio(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias_ejercicio(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_nivel (nivel_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_publicado (publicado),
    FULLTEXT INDEX ft_videos (titulo, descripcion)
) ENGINE=InnoDB;

-- Asignación de videos a pacientes
CREATE TABLE IF NOT EXISTS videos_asignados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    video_id INT UNSIGNED NOT NULL,
    asignado_por INT UNSIGNED NOT NULL,
    frecuencia_recomendada VARCHAR(100),
    repeticiones VARCHAR(100),
    notas TEXT,
    activo TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos_ejercicios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_asignacion (paciente_id, video_id),
    INDEX idx_paciente (paciente_id)
) ENGINE=InnoDB;

-- Registro de videos vistos
CREATE TABLE IF NOT EXISTS registro_videos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    video_id INT UNSIGNED NOT NULL,
    porcentaje_visto TINYINT UNSIGNED DEFAULT 0,
    completado TINYINT(1) DEFAULT 0,
    fecha DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos_ejercicios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registro_dia (paciente_id, video_id, fecha),
    INDEX idx_paciente_fecha (paciente_id, fecha)
) ENGINE=InnoDB;

-- Guías de cuidado
CREATE TABLE IF NOT EXISTS guias_cuidado (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo ENUM('limpieza_diaria', 'mantenimiento_semanal', 'inspeccion_mensual', 'almacenamiento', 'dano', 'otro') NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    orden INT UNSIGNED DEFAULT 0,
    creado_por INT UNSIGNED NOT NULL,
    publicado TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_tipo (tipo),
    FULLTEXT INDEX ft_guias (titulo, contenido)
) ENGINE=InnoDB;

-- Checklist de inspección de prótesis
CREATE TABLE IF NOT EXISTS checklist_protesis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    limpieza_realizada TINYINT(1) DEFAULT 0,
    inspeccion_visual TINYINT(1) DEFAULT 0,
    ajuste_correcto TINYINT(1) DEFAULT 0,
    comodidad_uso TINYINT(1) DEFAULT 0,
    problemas_detectados TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_checklist (paciente_id, fecha),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 6: NEUROPSICOLOGÍA
-- =====================================================

-- Catálogo de emociones
CREATE TABLE IF NOT EXISTS emociones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    icono VARCHAR(50),
    categoria ENUM('positiva', 'negativa', 'neutra') DEFAULT 'neutra'
) ENGINE=InnoDB;

INSERT INTO emociones (nombre, categoria) VALUES
('tristeza', 'negativa'),
('alegria', 'positiva'),
('ansiedad', 'negativa'),
('frustracion', 'negativa'),
('esperanza', 'positiva'),
('miedo', 'negativa'),
('calma', 'positiva'),
('enojo', 'negativa'),
('gratitud', 'positiva'),
('confusion', 'neutra'),
('motivacion', 'positiva'),
('soledad', 'negativa');

-- Registro de estado de ánimo
CREATE TABLE IF NOT EXISTS registro_animo (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    nivel_animo TINYINT UNSIGNED NOT NULL,
    nivel_motivacion TINYINT UNSIGNED,
    nivel_energia TINYINT UNSIGNED,
    notas TEXT,
    fecha DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha),
    INDEX idx_nivel_animo (nivel_animo)
) ENGINE=InnoDB;

-- Emociones registradas por día
CREATE TABLE IF NOT EXISTS registro_animo_emociones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registro_animo_id BIGINT UNSIGNED NOT NULL,
    emocion_id INT UNSIGNED NOT NULL,

    FOREIGN KEY (registro_animo_id) REFERENCES registro_animo(id) ON DELETE CASCADE,
    FOREIGN KEY (emocion_id) REFERENCES emociones(id),
    UNIQUE KEY unique_emocion (registro_animo_id, emocion_id)
) ENGINE=InnoDB;

-- Cuestionarios de bienestar
CREATE TABLE IF NOT EXISTS cuestionarios_bienestar (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    fecha_semana DATE NOT NULL,

    durmio_bien TINYINT(1),
    horas_sueno_promedio DECIMAL(3,1),
    socializo TINYINT(1),
    actividad_fisica TINYINT(1),
    nivel_estres TINYINT UNSIGNED,
    pensamientos_negativos TINYINT(1),
    observaciones TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    INDEX idx_paciente_fecha (paciente_id, fecha_semana)
) ENGINE=InnoDB;

-- Historial de fases de tratamiento de neuropsicología (Consulta inicial,
-- Evaluación, Intervención, Alta). La fase vigente es la fila más reciente
-- por paciente; sin fila implica fase 1 (Consulta inicial).
CREATE TABLE IF NOT EXISTS neuro_fases_historial (
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

-- =====================================================
-- MÓDULO 7: ÓRTESIS
-- =====================================================

-- Tipos de dispositivo
CREATE TABLE IF NOT EXISTS tipos_dispositivo (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
) ENGINE=InnoDB;

INSERT INTO tipos_dispositivo (nombre, descripcion) VALUES
('protesis_miembro_inferior', 'Prótesis de pierna o pie'),
('protesis_miembro_superior', 'Prótesis de brazo o mano'),
('ortesis_rodilla', 'Órtesis de rodilla'),
('ortesis_tobillo', 'Órtesis de tobillo'),
('ortesis_columna', 'Órtesis de columna vertebral'),
('otro', 'Otro tipo de dispositivo');

-- Información del dispositivo del paciente
CREATE TABLE IF NOT EXISTS dispositivos_paciente (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    tipo_dispositivo_id INT UNSIGNED NOT NULL,
    fecha_entrega DATE NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    notas TEXT,
    activo TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_dispositivo_id) REFERENCES tipos_dispositivo(id),
    INDEX idx_paciente (paciente_id)
) ENGINE=InnoDB;

-- Historial de ajustes
CREATE TABLE IF NOT EXISTS historial_ajustes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT UNSIGNED NOT NULL,
    tipo_ajuste VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    realizado_por INT UNSIGNED NOT NULL,
    fecha_ajuste DATE NOT NULL,
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_paciente(id) ON DELETE CASCADE,
    FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
    INDEX idx_dispositivo (dispositivo_id),
    INDEX idx_fecha (fecha_ajuste)
) ENGINE=InnoDB;

-- Reportes de problemas con dispositivo
CREATE TABLE IF NOT EXISTS reportes_problemas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT UNSIGNED NOT NULL,
    paciente_id INT UNSIGNED NOT NULL,
    descripcion TEXT NOT NULL,
    severidad ENUM('leve', 'moderado', 'severo') NOT NULL,
    estado ENUM('pendiente', 'en_revision', 'resuelto') DEFAULT 'pendiente',
    fecha_reporte DATE NOT NULL,
    fecha_resolucion DATE,
    notas_resolucion TEXT,
    atendido_por INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_paciente(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (atendido_por) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_severidad (severidad)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 8: SISTEMA DE CITAS
-- =====================================================

-- Tipos de cita
CREATE TABLE IF NOT EXISTS tipos_cita (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    duracion_minutos INT UNSIGNED DEFAULT 30,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO tipos_cita (nombre, duracion_minutos, descripcion) VALUES
('primera_vez', 60, 'Primera consulta con el especialista'),
('seguimiento', 30, 'Consulta de seguimiento regular'),
('urgencia', 45, 'Consulta por situación urgente');

-- Disponibilidad de especialistas
CREATE TABLE IF NOT EXISTS disponibilidad_especialista (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    especialista_id INT UNSIGNED NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo TINYINT(1) DEFAULT 1,

    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_especialista (especialista_id),
    INDEX idx_dia (dia_semana)
) ENGINE=InnoDB;

-- Citas
CREATE TABLE IF NOT EXISTS citas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    area_medica_id INT UNSIGNED NOT NULL,
    tipo_cita_id INT UNSIGNED NOT NULL,

    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    motivo TEXT,
    estado ENUM('programada', 'confirmada', 'completada', 'cancelada', 'no_asistio') DEFAULT 'programada',
    notas_consulta TEXT,

    -- Google Calendar
    google_event_id VARCHAR(255),

    -- Cancelación
    cancelada_por INT UNSIGNED,
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMP NULL,

    -- Recordatorios
    recordatorio_24h_enviado TINYINT(1) DEFAULT 0,
    recordatorio_1h_enviado TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id),
    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id),
    FOREIGN KEY (tipo_cita_id) REFERENCES tipos_cita(id),
    FOREIGN KEY (cancelada_por) REFERENCES usuarios(id),

    INDEX idx_paciente (paciente_id),
    INDEX idx_especialista (especialista_id),
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 9: CHAT TEMPORAL
-- =====================================================

-- Conversaciones
CREATE TABLE IF NOT EXISTS conversaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    especialista_id INT UNSIGNED NOT NULL,
    ultimo_mensaje_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversacion (paciente_id, especialista_id),
    INDEX idx_ultimo_mensaje (ultimo_mensaje_at)
) ENGINE=InnoDB;

-- Mensajes de chat (se eliminan después de 24 horas)
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT UNSIGNED NOT NULL,
    remitente_id INT UNSIGNED NOT NULL,
    contenido TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    leido_at TIMESTAMP NULL,
    expira_en TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id),
    INDEX idx_conversacion (conversacion_id),
    INDEX idx_expiracion (expira_en),
    INDEX idx_leido (leido)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 10: RECORDATORIOS
-- =====================================================

-- Tipos de recordatorio
CREATE TABLE IF NOT EXISTS tipos_recordatorio (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    icono VARCHAR(50)
) ENGINE=InnoDB;

INSERT INTO tipos_recordatorio (nombre, descripcion) VALUES
('medicina', 'Recordatorio para registrar mediciones médicas'),
('nutricion', 'Recordatorio para registrar comidas'),
('fisioterapia', 'Recordatorio para ejercicios o limpieza de prótesis'),
('cita', 'Recordatorio de cita médica'),
('cuestionario', 'Recordatorio para completar cuestionarios'),
('medicamento', 'Recordatorio para tomar medicamento');

-- Configuración de recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    tipo_id INT UNSIGNED NOT NULL,
    hora TIME NOT NULL,
    dias_semana JSON NOT NULL,
    mensaje_personalizado TEXT,
    activo TINYINT(1) DEFAULT 1,

    -- Referencia opcional (ej: medicamento específico)
    referencia_tipo VARCHAR(50),
    referencia_id INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_id) REFERENCES tipos_recordatorio(id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- Historial de recordatorios enviados
CREATE TABLE IF NOT EXISTS historial_recordatorios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recordatorio_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    enviado_en TIMESTAMP NOT NULL,
    completado TINYINT(1) DEFAULT 0,
    completado_en TIMESTAMP NULL,
    pospuesto TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (recordatorio_id) REFERENCES recordatorios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_recordatorio (recordatorio_id),
    INDEX idx_fecha (enviado_en)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 11: FAQs
-- =====================================================

-- Preguntas frecuentes
CREATE TABLE IF NOT EXISTS faqs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pregunta VARCHAR(500) NOT NULL,
    respuesta TEXT NOT NULL,
    area_medica_id INT UNSIGNED,
    orden INT UNSIGNED DEFAULT 0,
    vistas INT UNSIGNED DEFAULT 0,
    votos_util INT UNSIGNED DEFAULT 0,
    votos_no_util INT UNSIGNED DEFAULT 0,
    publicada TINYINT(1) DEFAULT 1,
    creado_por INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    INDEX idx_area (area_medica_id),
    INDEX idx_publicada (publicada),
    FULLTEXT INDEX ft_faqs (pregunta, respuesta)
) ENGINE=InnoDB;

-- Votos de FAQs
CREATE TABLE IF NOT EXISTS votos_faq (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    faq_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    es_util TINYINT(1) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_voto (faq_id, usuario_id)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 12: BLOG MULTI-ÁREA
-- =====================================================

-- Etiquetas de artículos
CREATE TABLE IF NOT EXISTS etiquetas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Artículos del blog
CREATE TABLE IF NOT EXISTS articulos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    resumen VARCHAR(500),
    contenido LONGTEXT NOT NULL,
    imagen_portada_url VARCHAR(500),
    area_medica_id INT UNSIGNED,
    autor_id INT UNSIGNED NOT NULL,

    tiempo_lectura_minutos INT UNSIGNED DEFAULT 5,
    publicado TINYINT(1) DEFAULT 0,
    destacado TINYINT(1) DEFAULT 0,
    fecha_publicacion TIMESTAMP NULL,

    vistas INT UNSIGNED DEFAULT 0,
    likes INT UNSIGNED DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id),
    INDEX idx_area (area_medica_id),
    INDEX idx_publicado (publicado),
    INDEX idx_destacado (destacado),
    INDEX idx_fecha (fecha_publicacion),
    FULLTEXT INDEX ft_articulos (titulo, resumen, contenido)
) ENGINE=InnoDB;

-- Relación artículos-etiquetas
CREATE TABLE IF NOT EXISTS articulos_etiquetas (
    articulo_id INT UNSIGNED NOT NULL,
    etiqueta_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (articulo_id, etiqueta_id),
    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Likes de artículos
CREATE TABLE IF NOT EXISTS likes_articulo (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (articulo_id, usuario_id)
) ENGINE=InnoDB;

-- Artículos favoritos
CREATE TABLE IF NOT EXISTS articulos_favoritos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (articulo_id, usuario_id)
) ENGINE=InnoDB;

-- Comentarios de artículos
CREATE TABLE IF NOT EXISTS comentarios_articulo (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    contenido TEXT NOT NULL,
    es_anonimo TINYINT(1) DEFAULT 0,
    aprobado TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_articulo (articulo_id),
    INDEX idx_aprobado (aprobado)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 13: COMUNIDAD
-- =====================================================

-- Temas de comunidad
CREATE TABLE IF NOT EXISTS temas_comunidad (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icono VARCHAR(50),
    descripcion VARCHAR(255),
    orden INT UNSIGNED DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO temas_comunidad (nombre, slug, icono, orden) VALUES
('Primera vez', 'primera-vez', '🌟', 1),
('Logros alcanzados', 'logros', '🏆', 2),
('Superación de miedos', 'superacion', '💪', 3),
('Tips y consejos', 'tips', '💡', 4),
('Apoyo emocional', 'apoyo', '🤝', 5),
('Mi rutina diaria', 'rutina', '🎯', 6),
('Mi progreso', 'progreso', '📈', 7),
('Agradecimientos', 'agradecimientos', '🙏', 8),
('Preguntas a la comunidad', 'preguntas', '❓', 9);

-- Publicaciones de comunidad
CREATE TABLE IF NOT EXISTS publicaciones_comunidad (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    tema_id INT UNSIGNED NOT NULL,
    titulo VARCHAR(100),
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500) NULL,
    es_anonimo TINYINT(1) DEFAULT 0,

    -- Estado de moderación
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    moderado_por INT UNSIGNED,
    moderado_en TIMESTAMP NULL,
    motivo_rechazo TEXT,

    -- Destacado
    destacada TINYINT(1) DEFAULT 0,

    -- Contadores
    total_reacciones INT UNSIGNED DEFAULT 0,
    total_comentarios INT UNSIGNED DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tema_id) REFERENCES temas_comunidad(id),
    FOREIGN KEY (moderado_por) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_tema (tema_id),
    INDEX idx_fecha (created_at),
    INDEX idx_destacada (destacada)
) ENGINE=InnoDB;

-- Imágenes de publicaciones
CREATE TABLE IF NOT EXISTS imagenes_publicacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT UNSIGNED NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    orden INT UNSIGNED DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (publicacion_id) REFERENCES publicaciones_comunidad(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tipos de reacción
CREATE TABLE IF NOT EXISTS tipos_reaccion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    emoji VARCHAR(10) NOT NULL,
    descripcion VARCHAR(100)
) ENGINE=InnoDB;

INSERT INTO tipos_reaccion (nombre, emoji, descripcion) VALUES
('me_gusta', '❤️', 'Me gusta'),
('me_inspira', '💪', 'Me inspira'),
('me_identifico', '🤝', 'Me identifico'),
('me_motiva', '🎉', 'Me motiva'),
('apoyo', '🙏', 'Te apoyo');

-- Reacciones a publicaciones
CREATE TABLE IF NOT EXISTS reacciones_publicacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    tipo_reaccion_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (publicacion_id) REFERENCES publicaciones_comunidad(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_reaccion_id) REFERENCES tipos_reaccion(id),
    UNIQUE KEY unique_reaccion (publicacion_id, usuario_id)
) ENGINE=InnoDB;

-- Comentarios de publicaciones de comunidad
CREATE TABLE IF NOT EXISTS comentarios_comunidad (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    contenido VARCHAR(500) NOT NULL,
    es_anonimo TINYINT(1) DEFAULT 0,

    -- Moderación
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'aprobado',
    moderado_por INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (publicacion_id) REFERENCES publicaciones_comunidad(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (moderado_por) REFERENCES usuarios(id),
    INDEX idx_publicacion (publicacion_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Reportes de contenido
CREATE TABLE IF NOT EXISTS reportes_contenido (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reportado_por INT UNSIGNED NOT NULL,
    tipo_contenido ENUM('publicacion', 'comentario') NOT NULL,
    contenido_id INT UNSIGNED NOT NULL,
    razon ENUM('spam', 'contenido_inapropiado', 'lenguaje_ofensivo', 'informacion_incorrecta', 'otro') NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'revisado', 'accion_tomada', 'desestimado') DEFAULT 'pendiente',
    revisado_por INT UNSIGNED,
    accion_tomada TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reportado_por) REFERENCES usuarios(id),
    FOREIGN KEY (revisado_por) REFERENCES usuarios(id),
    INDEX idx_estado (estado),
    INDEX idx_tipo (tipo_contenido)
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 14: NOTIFICACIONES
-- =====================================================

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    datos JSON,
    leida TINYINT(1) DEFAULT 0,
    leida_en TIMESTAMP NULL,

    -- Referencia al contenido relacionado
    referencia_tipo VARCHAR(50),
    referencia_id INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_leida (leida),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB;

-- Preferencias de notificaciones
CREATE TABLE IF NOT EXISTS preferencias_notificacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,

    -- Email
    email_citas TINYINT(1) DEFAULT 1,
    email_mensajes TINYINT(1) DEFAULT 1,
    email_comunidad TINYINT(1) DEFAULT 1,
    email_recordatorios TINYINT(1) DEFAULT 1,

    -- Push
    push_citas TINYINT(1) DEFAULT 1,
    push_mensajes TINYINT(1) DEFAULT 1,
    push_comunidad TINYINT(1) DEFAULT 1,
    push_recordatorios TINYINT(1) DEFAULT 1,

    -- Frecuencia comunidad
    frecuencia_comunidad ENUM('inmediata', 'diaria', 'desactivada') DEFAULT 'inmediata',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- MÓDULO 15: CONFIGURACIÓN DEL SISTEMA
-- =====================================================

-- Configuración general
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    descripcion VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar configuraciones base
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES
('nombre_sistema', 'Azaria 2.0', 'string', 'Nombre del sistema'),
('email_soporte', 'soporte@azaria.mx', 'string', 'Email de soporte'),
('telefono_soporte', '+52 442 123 4567', 'string', 'Teléfono de soporte'),
('horario_atencion', '{"inicio": "08:00", "fin": "18:00", "dias": [1,2,3,4,5]}', 'json', 'Horario de atención'),
('duracion_sesion_dias', '30', 'number', 'Días de duración de sesión persistente'),
('max_intentos_login', '5', 'number', 'Máximo de intentos de login antes de bloqueo'),
('tiempo_bloqueo_minutos', '15', 'number', 'Minutos de bloqueo por intentos fallidos'),
('expiracion_codigo_minutos', '15', 'number', 'Minutos de validez del código de recuperación'),
('chat_expiracion_horas', '24', 'number', 'Horas antes de eliminar mensajes de chat'),
('moderacion_auto_aprobacion', '5', 'number', 'Publicaciones aprobadas para auto-aprobación');

-- =====================================================
-- MÓDULO 16: AUDITORÍA
-- =====================================================

-- Log de auditoría general
CREATE TABLE IF NOT EXISTS log_auditoria (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INT UNSIGNED,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de pacientes con información completa
CREATE OR REPLACE VIEW vista_pacientes AS
SELECT
    p.id AS paciente_id,
    u.id AS usuario_id,
    u.nombre_completo,
    u.email,
    u.fecha_nacimiento,
    TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) AS edad,
    f.numero AS fase_numero,
    f.nombre AS fase_nombre,
    p.progreso_general,
    p.fecha_cambio_fase,
    u.activo,
    u.ultimo_acceso,
    u.created_at
FROM pacientes p
INNER JOIN usuarios u ON p.usuario_id = u.id
INNER JOIN fases_tratamiento f ON p.fase_actual_id = f.id;

-- Vista de especialistas por área
CREATE OR REPLACE VIEW vista_especialistas AS
SELECT
    u.id AS usuario_id,
    u.nombre_completo,
    u.email,
    am.id AS area_medica_id,
    am.nombre AS area_medica,
    u.activo,
    u.ultimo_acceso
FROM usuarios u
INNER JOIN areas_medicas am ON u.area_medica_id = am.id
WHERE u.rol_id = 2;

-- Vista de citas pendientes
CREATE OR REPLACE VIEW vista_citas_pendientes AS
SELECT
    c.id AS cita_id,
    c.fecha,
    c.hora_inicio,
    c.hora_fin,
    c.estado,
    tc.nombre AS tipo_cita,
    p.id AS paciente_id,
    up.nombre_completo AS paciente_nombre,
    ue.id AS especialista_id,
    ue.nombre_completo AS especialista_nombre,
    am.nombre AS area_medica
FROM citas c
INNER JOIN pacientes p ON c.paciente_id = p.id
INNER JOIN usuarios up ON p.usuario_id = up.id
INNER JOIN usuarios ue ON c.especialista_id = ue.id
INNER JOIN areas_medicas am ON c.area_medica_id = am.id
INNER JOIN tipos_cita tc ON c.tipo_cita_id = tc.id
WHERE c.estado IN ('programada', 'confirmada')
AND c.fecha >= CURDATE()
ORDER BY c.fecha, c.hora_inicio;

-- Vista de alertas médicas pendientes
CREATE OR REPLACE VIEW vista_alertas_pendientes AS
SELECT
    a.id AS alerta_id,
    a.tipo,
    a.severidad,
    a.mensaje,
    a.created_at,
    p.id AS paciente_id,
    u.nombre_completo AS paciente_nombre
FROM alertas_medicas a
INNER JOIN pacientes p ON a.paciente_id = p.id
INNER JOIN usuarios u ON p.usuario_id = u.id
WHERE a.atendida = 0
ORDER BY
    CASE a.severidad
        WHEN 'alta' THEN 1
        WHEN 'media' THEN 2
        WHEN 'baja' THEN 3
    END,
    a.created_at DESC;

-- =====================================================
-- EVENTOS PROGRAMADOS (para eliminar mensajes de chat)
-- =====================================================

-- Habilitar el scheduler de eventos
SET GLOBAL event_scheduler = ON;

-- Evento para eliminar mensajes de chat expirados
DELIMITER //
CREATE EVENT IF NOT EXISTS eliminar_mensajes_expirados
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM mensajes_chat WHERE expira_en < NOW();
END//
DELIMITER ;

-- Evento para limpiar tokens de recuperación expirados
DELIMITER //
CREATE EVENT IF NOT EXISTS limpiar_tokens_expirados
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM tokens_recuperacion WHERE expira_en < NOW();
END//
DELIMITER ;

-- Evento para limpiar sesiones expiradas
DELIMITER //
CREATE EVENT IF NOT EXISTS limpiar_sesiones_expiradas
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE FROM sesiones WHERE expira_en < NOW();
END//
DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_registro_comidas_paciente_fecha ON registro_comidas(paciente_id, fecha DESC);
CREATE INDEX idx_bitacora_glucosa_paciente_fecha ON bitacora_glucosa(paciente_id, fecha DESC);
CREATE INDEX idx_bitacora_presion_paciente_fecha ON bitacora_presion(paciente_id, fecha DESC);
CREATE INDEX idx_bitacora_dolor_paciente_fecha ON bitacora_dolor(paciente_id, fecha DESC);
CREATE INDEX idx_registro_animo_paciente_fecha ON registro_animo(paciente_id, fecha DESC);
CREATE INDEX idx_publicaciones_estado_fecha ON publicaciones_comunidad(estado, created_at DESC);

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

DELIMITER //

-- Procedimiento para obtener estadísticas de adherencia de medicamentos
CREATE PROCEDURE IF NOT EXISTS sp_adherencia_medicamentos(
    IN p_paciente_id INT UNSIGNED,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT
        m.nombre_comercial,
        COUNT(*) AS total_dosis,
        SUM(CASE WHEN rm.estado = 'tomado_a_tiempo' THEN 1 ELSE 0 END) AS tomado_a_tiempo,
        SUM(CASE WHEN rm.estado = 'tomado_tarde' THEN 1 ELSE 0 END) AS tomado_tarde,
        SUM(CASE WHEN rm.estado = 'omitido' THEN 1 ELSE 0 END) AS omitido,
        ROUND(
            (SUM(CASE WHEN rm.estado IN ('tomado_a_tiempo', 'tomado_tarde') THEN 1 ELSE 0 END) / COUNT(*)) * 100,
            2
        ) AS porcentaje_adherencia
    FROM registro_medicamentos rm
    INNER JOIN medicamentos_paciente m ON rm.medicamento_id = m.id
    WHERE rm.paciente_id = p_paciente_id
    AND rm.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY m.id, m.nombre_comercial;
END//

-- Procedimiento para obtener resumen de bitácoras médicas
CREATE PROCEDURE IF NOT EXISTS sp_resumen_bitacoras(
    IN p_paciente_id INT UNSIGNED,
    IN p_dias INT
)
BEGIN
    DECLARE v_fecha_inicio DATE;
    SET v_fecha_inicio = DATE_SUB(CURDATE(), INTERVAL p_dias DAY);

    -- Glucosa
    SELECT
        'glucosa' AS tipo,
        COUNT(*) AS total_registros,
        ROUND(AVG(valor), 1) AS promedio,
        MIN(valor) AS minimo,
        MAX(valor) AS maximo
    FROM bitacora_glucosa
    WHERE paciente_id = p_paciente_id
    AND fecha >= v_fecha_inicio

    UNION ALL

    -- Presión sistólica
    SELECT
        'presion_sistolica' AS tipo,
        COUNT(*) AS total_registros,
        ROUND(AVG(sistolica), 0) AS promedio,
        MIN(sistolica) AS minimo,
        MAX(sistolica) AS maximo
    FROM bitacora_presion
    WHERE paciente_id = p_paciente_id
    AND fecha >= v_fecha_inicio

    UNION ALL

    -- Presión diastólica
    SELECT
        'presion_diastolica' AS tipo,
        COUNT(*) AS total_registros,
        ROUND(AVG(diastolica), 0) AS promedio,
        MIN(diastolica) AS minimo,
        MAX(diastolica) AS maximo
    FROM bitacora_presion
    WHERE paciente_id = p_paciente_id
    AND fecha >= v_fecha_inicio

    UNION ALL

    -- Dolor
    SELECT
        'dolor' AS tipo,
        COUNT(*) AS total_registros,
        ROUND(AVG(intensidad), 1) AS promedio,
        MIN(intensidad) AS minimo,
        MAX(intensidad) AS maximo
    FROM bitacora_dolor
    WHERE paciente_id = p_paciente_id
    AND fecha >= v_fecha_inicio;
END//

DELIMITER ;

-- =====================================================
-- DATOS DE PRUEBA (opcional - comentar en producción)
-- =====================================================

-- Usuario administrador por defecto
-- Password: Admin123! (hash generado con bcrypt cost 12)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, primer_acceso, email_verificado) VALUES
('admin@azaria.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4UJyp.dGCJn7zzHO', 'Administrador Sistema', 1, 0, 1);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

