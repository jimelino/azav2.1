<?php

return [
    'name' => $_ENV['APP_NAME'] ?? 'Vitalia',
    'env' => $_ENV['APP_ENV'] ?? 'production',
    'url' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
    'timezone' => $_ENV['APP_TIMEZONE'] ?? 'America/Mexico_City',
    'locale' => 'es',

    'session' => [
        'lifetime' => $_ENV['SESSION_LIFETIME'] ?? 2592000, // 30 días
        'secure' => $_ENV['SESSION_SECURE'] ?? true,
        'same_site' => 'lax',
        'http_only' => true
    ],

    'upload' => [
        'max_file_size' => $_ENV['MAX_FILE_SIZE'] ?? 5242880, // 5MB
        'allowed_image_types' => explode(',', $_ENV['ALLOWED_IMAGE_TYPES'] ?? 'jpg,jpeg,png,gif'),
        'upload_path' => $_ENV['UPLOAD_PATH'] ?? __DIR__ . '/../public/uploads/'
    ],

    'security' => [
        'jwt_secret' => $_ENV['JWT_SECRET'] ?? '',
        'encryption_key' => $_ENV['ENCRYPTION_KEY'] ?? '',
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 minutos en segundos
        'password_reset_expiry' => 900 // 15 minutos
    ]
];
