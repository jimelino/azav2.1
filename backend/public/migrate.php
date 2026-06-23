<?php
/**
 * AZARIA - Sistema de Migraciones Versionado (Optimizado para Producción/Render)
 */

// CORRECCIÓN DE RUTA: Ajustada para el entorno Docker de Render (/app/config/...)
$config = require __DIR__ . '/../config/database.php';

// Colores para la terminal
function colorize($text, $color) {
    $colors = [
        'green'  => "\033[32m",
        'red'    => "\033[31m",
        'yellow' => "\033[33m",
        'cyan'   => "\033[36m",
        'bold'   => "\033[1m",
        'reset'  => "\033[0m",
    ];
    if (PHP_OS_FAMILY === 'Windows' && !getenv('ANSICON') && !getenv('ConEmuANSI')) {
        return $text;
    }
    return ($colors[$color] ?? '') . $text . $colors['reset'];
}

function info($msg)    { echo colorize("   ✓ ", 'green') . $msg . PHP_EOL; }
function warn($msg)    { echo colorize("   ⚠ ", 'yellow') . $msg . PHP_EOL; }
function error($msg)   { echo colorize("   ✗ ", 'red') . $msg . PHP_EOL; }
function heading($msg) { echo PHP_EOL . colorize("  " . $msg, 'bold') . PHP_EOL . PHP_EOL; }

// Conectar a la base de datos
try {
    $dsn = "{$config['driver']}:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
} catch (PDOException $e) {
    error("No se pudo conectar a la base de datos: " . $e->getMessage());
    exit(1);
}

// Crear tabla de tracking si no existe
$pdo->exec("
    CREATE TABLE IF NOT EXISTS migraciones (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migracion VARCHAR(255) NOT NULL UNIQUE,
        lote INT UNSIGNED NOT NULL DEFAULT 1,
        ejecutada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$migrationsDir = __DIR__ . '/migrations';
$command = $argv[1] ?? 'migrate';

switch ($command) {
    case 'migrate':
    case 'run':
        runMigrations($pdo, $migrationsDir);
        break;
    case 'status':
        showStatus($pdo, $migrationsDir);
        break;
    case 'create':
        $name = $argv[2] ?? null;
        if (!$name) {
            error("Debes proporcionar un nombre: php migrate.php create nombre_migracion");
            exit(1);
        }
        createMigration($migrationsDir, $name);
        break;
    case 'reset':
        resetMigrations($pdo, $migrationsDir);
        break;
    default:
        echo "Uso: php migrate.php [migrate|status|create <nombre>|reset]" . PHP_EOL;
        exit(1);
}

/**
 * Ejecutar migraciones pendientes
 */
function runMigrations(PDO $pdo, string $dir) {
    heading("AZARIA - Ejecutando Migraciones");

    $executed = getExecutedMigrations($pdo);
    $pending = getPendingMigrations($dir, $executed);

    if (empty($pending)) {
        info("No hay migraciones pendientes. Todo esta al dia.");
        echo PHP_EOL;
        return;
    }

    $stmt = $pdo->query("SELECT COALESCE(MAX(lote), 0) + 1 FROM migraciones");
    $batch = (int)$stmt->fetchColumn();

    echo "  Migraciones pendientes: " . count($pending) . PHP_EOL;
    echo "  Lote: #$batch" . PHP_EOL . PHP_EOL;

    $success = 0;
    $failed = 0;

    foreach ($pending as $file) {
        $name = basename($file);
        echo "  Ejecutando: " . colorize($name, 'cyan') . " ... ";

        try {
            $sql = file_get_contents($file);

            if (empty(trim($sql))) {
                echo colorize("VACIO (saltado)", 'yellow') . PHP_EOL;
                continue;
            }

            $pdo->exec($sql);

            $stmt = $pdo->prepare("INSERT INTO migraciones (migracion, lote) VALUES (?, ?)");
            $stmt->execute([$name, $batch]);

            echo colorize("OK", 'green') . PHP_EOL;
            $success++;
        } catch (PDOException $e) {
            echo colorize("ERROR", 'red') . PHP_EOL;
            error("  " . $e->getMessage());
            $failed++;

            // OPTIMIZACIÓN DE ENTORNO: Si no hay terminal interactiva, aborta con código de error de inmediato
            if (ftell(STDIN) === false || !stream_isatty(STDIN)) {
                error("Migración fallida en entorno automatizado. Abortando proceso para proteger la base de datos.");
                exit(1);
            }

            echo PHP_EOL . "  Continuar con las demas migraciones? (s/n): ";
            $answer = trim(fgets(STDIN));
            if (strtolower($answer) !== 's') {
                echo PHP_EOL;
                error("Migracion abortada. $success exitosas, $failed fallidas.");
                exit(1);
            }
        }
    }

    echo PHP_EOL;
    if ($failed === 0) {
        info("$success migracion(es) ejecutada(s) exitosamente en lote #$batch.");
    } else {
        warn("$success exitosas, $failed fallidas en lote #$batch.");
    }
    echo PHP_EOL;
}

function showStatus(PDO $pdo, string $dir) {
    heading("AZARIA - Estado de Migraciones");

    $executed = getExecutedMigrations($pdo);
    $allFiles = getAllMigrationFiles($dir);

    if (empty($allFiles)) {
        warn("No se encontraron archivos de migracion en $dir");
        echo PHP_EOL;
        return;
    }

    $batchInfo = [];
    $stmt = $pdo->query("SELECT migracion, lote, ejecutada_en FROM migraciones ORDER BY id");
    while ($row = $stmt->fetch()) {
        $batchInfo[$row['migracion']] = $row;
    }

    echo "  " . str_pad("Estado", 12) . str_pad("Lote", 8) . str_pad("Fecha", 22) . "Migracion" . PHP_EOL;
    echo "  " . str_repeat("-", 90) . PHP_EOL;

    $pendingCount = 0;
    $executedCount = 0;

    foreach ($allFiles as $file) {
        $name = basename($file);

        if (in_array($name, $executed)) {
            $info = $batchInfo[$name] ?? null;
            $batch = $info ? "#" . $info['lote'] : "?";
            $date = $info ? $info['ejecutada_en'] : "?";
            echo "  " . colorize(str_pad("Ejecutada", 12), 'green');
            echo str_pad($batch, 8);
            echo str_pad($date, 22);
            echo $name . PHP_EOL;
            $executedCount++;
        } else {
            echo "  " . colorize(str_pad("Pendiente", 12), 'yellow');
            echo str_pad("-", 8);
            echo str_pad("-", 22);
            echo colorize($name, 'cyan') . PHP_EOL;
            $pendingCount++;
        }
    }

    echo PHP_EOL;
    echo "  Total: " . count($allFiles) . " | ";
    echo colorize("Ejecutadas: $executedCount", 'green') . " | ";
    echo colorize("Pendientes: $pendingCount", 'yellow') . PHP_EOL;
    echo PHP_EOL;
}

function createMigration(string $dir, string $name) {
    $name = preg_replace('/[^a-zA-Z0-9_]/', '_', $name);
    $name = strtolower(trim($name, '_'));

    $timestamp = date('Ymd_His');
    $filename = "{$timestamp}_{$name}.sql";
    $filepath = $dir . '/' . $filename;

    $template = "-- Migracion: $name\n-- Fecha: " . date('Y-m-d H:i:s') . "\n-- Descripcion: \n\n";

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    file_put_contents($filepath, $template);

    heading("AZARIA - Nueva Migracion");
    info("Creada: $filename");
    echo "  Ruta: $filepath" . PHP_EOL . PHP_EOL;
}

function resetMigrations(PDO $pdo, string $dir) {
    heading("AZARIA - Reset de Migraciones");

    $allFiles = getAllMigrationFiles($dir);
    $executed = getExecutedMigrations($pdo);

    if (empty($allFiles)) {
        warn("No se encontraron archivos de migracion.");
        echo PHP_EOL;
        return;
    }

    $stmt = $pdo->query("SELECT COALESCE(MAX(lote), 0) + 1 FROM migraciones");
    $batch = (int)$stmt->fetchColumn();

    $marked = 0;
    foreach ($allFiles as $file) {
        $name = basename($file);
        if (!in_array($name, $executed)) {
            $stmt = $pdo->prepare("INSERT INTO migraciones (migracion, lote) VALUES (?, ?)");
            $stmt->execute([$name, $batch]);
            info("Marcada: $name");
            $marked++;
        }
    }

    if ($marked === 0) {
        info("Todas las migraciones ya estaban registradas.");
    } else {
        echo PHP_EOL;
        info("$marked migracion(es) marcada(s) como ejecutada(s) en lote #$batch.");
    }
    echo PHP_EOL;
}

function getExecutedMigrations(PDO $pdo): array {
    $stmt = $pdo->query("SELECT migracion FROM migraciones ORDER BY id");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function getAllMigrationFiles(string $dir): array {
    if (!is_dir($dir)) return [];
    $files = glob($dir . '/*.sql');
    sort($files);
    return $files;
}

function getPendingMigrations(string $dir, array $executed): array {
    $allFiles = getAllMigrationFiles($dir);
    return array_filter($allFiles, function($file) use ($executed) {
        return !in_array(basename($file), $executed);
    });
}