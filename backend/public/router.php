<?php
/**
 * Router definitivo para producción en Railway
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Si entran a la raíz, apuntamos al index de React
if ($uri === '/') {
    $uri = '/index.html';
}

// Buscamos el archivo en la carpeta pública usando la ruta real del contenedor
$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;

// Si el archivo existe físicamente y no es una carpeta, lo servimos
if (file_exists($targetFile) && !is_dir($targetFile)) {
    if (pathinfo($targetFile, PATHINFO_EXTENSION) === 'html') {
        header("Content-Type: text/html; charset=UTF-8");
    }
    return false; // PHP entrega el archivo estático (React)
}

// Si no es un archivo físico, se lo entregamos a la API de PHP
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';