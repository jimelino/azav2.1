<?php

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if (getenv($key) === false && !isset($_ENV[$key])) {
            $_ENV[$key] = $value;
            putenv("{$key}={$value}");
        }
    }
}

$env = static function (array $keys, $default = null) {
    foreach ($keys as $key) {
        $value = getenv($key);

        if ($value === false) {
            if (isset($_ENV[$key])) {
                $value = $_ENV[$key];
            } elseif (isset($_SERVER[$key])) {
                $value = $_SERVER[$key];
            }
        }

        if ($value !== false && $value !== null && $value !== '') {
            return $value;
        }
    }

    return $default;
};

// Prefer a full provider-supplied connection string, otherwise assemble from explicit MYSQL* / DB_* values.
$url = $env(['MYSQL_URL', 'DB_URL', 'DATABASE_URL']);
$urlConfig = [];

if ($url) {
    $parts = parse_url($url);

    if ($parts !== false) {
        $urlConfig = [
            'host' => $parts['host'] ?? null,
            'port' => isset($parts['port']) ? (string) $parts['port'] : null,
            'database' => isset($parts['path']) ? ltrim($parts['path'], '/') : null,
            'username' => isset($parts['user']) ? urldecode($parts['user']) : null,
            'password' => isset($parts['pass']) ? urldecode($parts['pass']) : null,
        ];
    }
}

return [
    'driver' => 'mysql',
    'host' => $urlConfig['host'] ?? $env(['DB_HOST', 'MYSQLHOST', 'MYSQL_HOST'], '127.0.0.1'),
    'port' => $urlConfig['port'] ?? $env(['DB_PORT', 'MYSQLPORT', 'MYSQL_PORT'], '3306'),
    'database' => $urlConfig['database'] ?? $env(['DB_NAME', 'DB_DATABASE', 'MYSQLDATABASE', 'MYSQL_DATABASE'], 'vitalia_v2'),
    'username' => $urlConfig['username'] ?? $env(['DB_USER', 'DB_USERNAME', 'MYSQLUSER', 'MYSQL_USER'], 'root'),
    'password' => $urlConfig['password'] ?? $env(['DB_PASS', 'DB_PASSWORD', 'MYSQLPASSWORD', 'MYSQL_PASSWORD', 'MYSQL_ROOT_PASSWORD'], ''),
    'charset' => $env(['DB_CHARSET'], 'utf8mb4'),
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ],
];
