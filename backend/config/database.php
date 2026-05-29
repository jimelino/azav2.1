<?php

return [
    'driver' => 'mysql',
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => getenv('DB_PORT') ?: 15254,
    'database' => getenv('DB_DATABASE') ?: getenv('DB_NAME') ?: 'defaultdb',
    'username' => getenv('DB_USERNAME') ?: getenv('DB_USER') ?: 'avnadmin',
    'password' => getenv('DB_PASSWORD') ?: getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        // Forzar la conexión SSL requerida por Aiven Cloud en producción
        PDO::MYSQL_ATTR_SSL_CA => true,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ]
];