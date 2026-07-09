<?php

return [
    'driver' => 'mysql',
    'host' => '127.0.0.1',
        'port' => '3306',
        'database' => 'vitalia_v2',
        'username' => 'root',
        'password' => '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        // Forzar la conexión SSL requerida por Aiven Cloud en producción
       //PDO::MYSQL_ATTR_SSL_CA => true,
       //PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ]
];