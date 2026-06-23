<?php
/**
 * Router para el servidor de desarrollo PHP built-in en producción (Railway).
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Si entran a la raíz, forzar a que busque el index.html de React
if ($uri === '/') {
    $uri = '/index.html';
}

// Si el archivo existe físicamente en public/ (HTML, JS, CSS, imágenes, etc.)
if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    // Si es el index.html de React, especificar el Content-Type correcto para evitar bugs
    if (pathinfo($uri, PATHINFO_EXTENSION) === 'html') {
        header("Content-Type: text/html; charset=UTF-8");
    }
    return false; // PHP sirve el archivo estático directamente
}

// Todo lo demás (peticiones API que no son archivos reales) va a index.php
require __DIR__ . '/index.php';