<?php
/**
 * Router definitivo para Azaria en Railway (Soporte SPA React + API PHP + Migraciones)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. EJECUTAR MIGRACIONES DESDE EL NAVEGADOR (Temporal y Autodestructivo)
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    echo "=== RASTREADOR DE MIGRACIONES ===\n";
    
    // Lista de rutas posibles dentro del contenedor
    $posiblesRutas = [
        $_SERVER['DOCUMENT_ROOT'] . '/../database/migrate.php',
        dirname($_SERVER['DOCUMENT_ROOT']) . '/database/migrate.php',
        '/app/database/migrate.php',
        '/app/migrate.php'
    ];
    
    $archivoEncontrado = null;
    foreach ($posiblesRutas as $ruta) {
        echo "Buscando en: $ruta -> " . (file_exists($ruta) ? "¡ENCONTRADO! ✅" : "No existe ❌") . "\n";
        if (file_exists($ruta) && !$archivoEncontrado) {
            $archivoEncontrado = $ruta;
        }
    }
    
    if ($archivoEncontrado) {
        echo "\nIniciando ejecucion de: $archivoEncontrado...\n\n";
        include $archivoEncontrado;
    } else {
        echo "\n[ERROR] No se pudo localizar migrate.php en ninguna ruta conocida.\n";
        echo "\n=== CONTENIDO DE LA RAÍZ DEL CONTENEDOR (/app) ===\n";
        $raiz = is_dir('/app') ? scandir('/app') : scandir(dirname($_SERVER['DOCUMENT_ROOT']));
        foreach($raiz as $item) {
            echo "- " . $item . "\n";
        }
    }
    exit;
}

// 2. Si la petición es explícitamente para la API, mandarla directo al index.php del backend
if (strpos($uri, '/api/') === 0) {
    require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
    exit;
}

// 3. Si la petición apunta a un archivo físico real (imágenes, JS, CSS, etc.) dentro de public/
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false; // PHP sirve el archivo estático directamente de forma nativa
}

// 4. Para todo lo demás (Ruta raíz '/' o rutas visuales de React como '/login'):
// Le entregamos el index.html de React para que el enrutador del frontend pinte la interfaz
$reactIndex = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
if (file_exists($reactIndex)) {
    header("Content-Type: text/html; charset=UTF-8");
    readfile($reactIndex);
    exit;
}

// Fallback por si acaso no encuentra el HTML
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';