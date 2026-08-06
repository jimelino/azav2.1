<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

use App\Models\Recordatorio;
use App\Services\RecordatorioService;

$service = new RecordatorioService();
$recordatorios = Recordatorio::getPendientes();
$enviados = 0;

foreach ($recordatorios as $recordatorio) {
    if ($service->send($recordatorio)) {
        Recordatorio::registrarEnvio($recordatorio['id'], $recordatorio['usuario_id']);
        $enviados++;
    }
}

echo "✓ Recordatorios procesados: $enviados enviado(s) de " . count($recordatorios) . "\n";
