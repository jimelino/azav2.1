<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// MODO DEPURACIÓN: Vamos a listar qué archivos hay realmente en la carpeta pública
if ($uri === '/debug-debug') {
    header("Content-Type: text/plain");
    echo "=== CONTENIDO DE LA CARPETA PUBLIC ===\n";
    $files = scandir(__DIR__);
    foreach($files as $file) {
        echo "- " . $file . "\n";
    }
    exit;
}

// Lógica de enrutamiento normal
if ($uri === '/') {
    $uri = '/index.html';
}

$targetFile = $_SERVER['DOCUMENT_ROOT'] . $uri;

if (file_exists($targetFile) && !is_dir($targetFile)) {
    if (pathinfo($targetFile, PATHINFO_EXTENSION) === 'html') {
        header("Content-Type: text/html; charset=UTF-8");
    }
    return false;
}

require $_SERVER['DOCUMENT_ROOT'] . '/index.php';