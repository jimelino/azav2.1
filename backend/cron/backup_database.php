<?php

$config = require __DIR__ . '/../config/database.php';
$backupDir = __DIR__ . '/../storage/backups';

if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$backupFile = $backupDir . '/backup_' . date('Y-m-d') . '.sql';
$passwordArg = $config['password'] !== '' ? '-p' . escapeshellarg($config['password']) : '';

$command = sprintf(
    'mysqldump -h %s -P %s -u %s %s %s > %s',
    escapeshellarg($config['host']),
    escapeshellarg((string) $config['port']),
    escapeshellarg($config['username']),
    $passwordArg,
    escapeshellarg($config['database']),
    escapeshellarg($backupFile)
);

exec($command, $output, $exitCode);

if ($exitCode !== 0) {
    fwrite(STDERR, "No se pudo crear el backup de base de datos.\n");
    exit($exitCode);
}

echo "Backup creado: {$backupFile}\n";
