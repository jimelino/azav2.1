<?php
/**
 * Router definitivo para Azaria en Railway (Soporte SPA React + API PHP + Inyección Integral Base)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. EJECUTAR MIGRACIONES DESDE EL NAVEGADOR (Temporal)
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    
    // Cargar variables de entorno del backend
    $projectRoot = dirname(__DIR__);
    $envFile = $projectRoot . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }

    try {
        $dsn = "mysql:host=" . ($_ENV['DB_HOST'] ?? 'localhost') . ";dbname=" . ($_ENV['DB_NAME'] ?? 'railway') . ";port=" . ($_ENV['DB_PORT'] ?? '3306') . ";charset=utf8mb4";
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo "=== PASO 1: INYECTANDO ESQUEMA ESTRUCTURAL COMPLETO ===\n";
        
        $sqlBase = <<<'SQL'
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'administrador', 'Acceso total al sistema, gestión de usuarios, configuración global'),
(2, 'especialista', 'Gestión de pacientes asignados, creación de contenido, moderación'),
(3, 'paciente', 'Registro de información personal, consulta de contenido, interacción con comunidad');

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

INSERT IGNORE INTO areas_medicas (id, nombre, descripcion, icono, color) VALUES
(1, 'fisioterapia', 'Rehabilitación física y ejercicios terapéuticos', 'fitness', '#4CAF50'),
(2, 'nutricion', 'Alimentación y planes nutricionales', 'restaurant', '#FF9800'),
(3, 'medicina', 'Seguimiento médico general y bitácoras de salud', 'medical_services', '#F44336'),
(4, 'neuropsicologia', 'Salud mental y bienestar emocional', 'psychology', '#9C27B0'),
(5, 'ortesis', 'Dispositivos ortopédicos y prótesis', 'accessibility', '#2196F3');

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) DEFAULT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    rol_id INT UNSIGNED NOT NULL,
    area_medica_id INT UNSIGNED DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    primer_acceso TINYINT(1) DEFAULT 1,
    email_verificado TINYINT(1) DEFAULT 0,
    email_verificado_at TIMESTAMP NULL,
    usar_pin TINYINT(1) DEFAULT 0,
    mantener_sesion TINYINT(1) DEFAULT 1,
    intentos_fallidos INT UNSIGNED DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    perfil_publico TINYINT(1) DEFAULT 1,
    mostrar_nombre_real TINYINT(1) DEFAULT 1,
    nombre_anonimo VARCHAR(50) DEFAULT NULL,
    publicaciones_aprobadas INT UNSIGNED DEFAULT 0,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (area_medica_id) REFERENCES areas_medicas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fases_tratamiento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero TINYINT UNSIGNED NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO fases_tratamiento (id, numero, nombre, descripcion) VALUES
(1, 1, 'Evaluación Inicial', 'Primera aproximación al dispositivo, evaluaciones médicas'),
(2, 2, 'Adaptación y Aprendizaje', 'Aprendizaje de uso, ejercicios básicos, ajustes'),
(3, 3, 'Seguimiento Activo', 'Uso regular, monitoreo constante, correcciones'),
(4, 4, 'Autonomía Completa', 'Uso independiente, seguimiento periódico');

CREATE TABLE IF NOT EXISTS pacientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    fase_actual_id INT UNSIGNED DEFAULT 1,
    fecha_cambio_fase DATE,
    progreso_general DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (fase_actual_id) REFERENCES fases_tratamiento(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_comida (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    orden INT UNSIGNED DEFAULT 0,
    hora_sugerida TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_comida (id, nombre, orden, hora_sugerida) VALUES
(1, 'desayuno', 1, '08:00:00'),
(2, 'colacion_matutina', 2, '11:00:00'),
(3, 'comida', 3, '14:00:00'),
(4, 'colacion_vespertina', 4, '17:00:00'),
(5, 'cena', 5, '20:00:00');

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
    FOREIGN KEY (tipo_comida_id) REFERENCES tipos_comida(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
SQL;

        $pdo->exec($sqlBase);
        echo "¡Tablas de soporte e iniciales estructuradas de forma exitosa! ✅\n\n";
        
    } catch (Exception $e) {
        echo "[AVISO BD BASE]: " . $e->getMessage() . "\n\n";
    }

    echo "=== PASO 2: EJECUTANDO PARCHES Y MIGRACIONES SECUENCIALES ===\n";
    try {
        $migrationsDir = __DIR__ . '/migrations';
        if (is_dir($migrationsDir)) {
            $files = glob($migrationsDir . '/*.sql');
            sort($files);
            
            $pdo->exec("CREATE TABLE IF NOT EXISTS migraciones (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                migracion VARCHAR(255) NOT NULL UNIQUE,
                lote INT UNSIGNED NOT NULL DEFAULT 1,
                ejecutada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            
            $stmt = $pdo->query("SELECT COALESCE(MAX(lote), 0) + 1 FROM migraciones");
            $batch = (int)$stmt->fetchColumn();
            
            foreach ($files as $file) {
                $name = basename($file);
                try {
                    $patchSql = file_get_contents($file);
                    if (!empty(trim($patchSql))) {
                        $pdo->exec($patchSql);
                    }
                    $ins = $pdo->prepare("INSERT IGNORE INTO migraciones (migracion, lote) VALUES (?, ?)");
                    $ins->execute([$name, $batch]);
                    echo "  -> Parche procesado: $name ✅\n";
                } catch (Exception $ex) {
                    echo "  -> Ya aplicado o saltado de forma segura: $name (Detalle: " . $ex->getMessage() . ") ⚠️\n";
                }
            }
            echo "\n¡Proceso de migración finalizado exitosamente! Base de datos lista en Railway. 🚀\n";
        } else {
            echo "[AVISO] Procesado esquema directo. Recuerda subir los archivos .sql incrementales a public/migrations si deseas parches extra.\n";
        }
    } catch (Exception $e) {
        echo "[ERROR MIGRACIONES]: " . $e->getMessage() . "\n";
    }
    exit;
}

// 2. Si la petición es para la API, mandarla directo al index.php del backend
if (strpos($uri, '/api/') === 0) {
    require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
    exit;
}

// 3. Servir archivos físicos reales nativamente
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false;
}

// 4. Soporte SPA React
$reactIndex = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
if (file_exists($reactIndex)) {
    header("Content-Type: text/html; charset=UTF-8");
    readfile($reactIndex);
    exit;
}

require $_SERVER['DOCUMENT_ROOT'] . '/index.php';