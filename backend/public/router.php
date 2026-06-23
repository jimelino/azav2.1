<?php
/**
 * Router definitivo e infalible para Azaria en Railway
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Si entran a la raíz, les entregamos directamente el index.html de React
if ($uri === '/' || $uri === '/index.html') {
    $target = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
    if (file_exists($target)) {
        header("Content-Type: text/html; charset=UTF-8");
        readfile($target);
        exit;
    }
}

// Si están buscando un archivo físico real de React (como un JS, CSS o imagen de la carpeta static/assets)
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;
if (file_exists($targetFile) && !is_dir($targetFile)) {
    // Dejar que PHP determine el tipo de contenido y lo sirva de forma nativa
    return false; 
}

// Todo lo demás (URLs limpias, peticiones de la API de administración) pasa al backend
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';