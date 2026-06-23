<?php
/**
 * Router definitivo para Azaria en Railway (Producción)
 * Soporte nativo para SPA React + API PHP
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. ENDPOINT DE MIGRACIONES (Deshabilitado de forma segura post-instalación)
if ($uri === '/run-my-migrations') {
    header("Content-Type: text/plain; charset=UTF-8");
    echo "=== AZARIA SISTEMA ===\n";
    echo "Las migraciones ya fueron ejecutadas con éxito. Este endpoint está deshabilitado por seguridad. 🔒\n";
    exit;
}

// 2. Si la petición es para la API, mandarla directo al index.php del backend
if (strpos($uri, '/api/') === 0) {
    require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
    exit;
}

// 3. Servir archivos físicos reales nativamente (Imágenes, JS, CSS)
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false;
}

// 4. Soporte SPA React (Cualquier ruta visual recarga el index.html)
$reactIndex = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
if (file_exists($reactIndex)) {
    header("Content-Type: text/html; charset=UTF-8");
    readfile($reactIndex);
    exit;
}

// Fallback de seguridad
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';