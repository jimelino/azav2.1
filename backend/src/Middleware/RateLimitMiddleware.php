<?php

namespace App\Middleware;

use App\Utils\Response;

/**
 * Rate Limiting basado en archivos temporales
 * Limita la cantidad de requests por IP en un periodo de tiempo
 */
class RateLimitMiddleware
{
    private static string $storageDir = '';

    /**
     * Verificar rate limit
     * @param int $maxRequests Maximo de requests permitidos
     * @param int $windowSeconds Ventana de tiempo en segundos
     * @param string $key Clave adicional para diferenciar endpoints
     */
    public static function check(int $maxRequests = 60, int $windowSeconds = 60, string $key = ''): bool
    {
        self::initStorage();

        $ip = self::getClientIp();
        $identifier = md5($ip . $key);
        $file = self::$storageDir . '/' . $identifier . '.json';

        $now = time();
        $requests = [];

        // Leer requests anteriores
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $requests = json_decode($content, true) ?: [];
        }

        // Filtrar solo requests dentro de la ventana de tiempo
        $requests = array_filter($requests, function ($timestamp) use ($now, $windowSeconds) {
            return ($now - $timestamp) < $windowSeconds;
        });

        // Verificar limite
        if (count($requests) >= $maxRequests) {
            $retryAfter = $windowSeconds - ($now - min($requests));
            header("Retry-After: $retryAfter");
            Response::error(
                "Demasiadas solicitudes. Intenta de nuevo en $retryAfter segundos.",
                429
            );
        }

        // Registrar este request
        $requests[] = $now;
        file_put_contents($file, json_encode(array_values($requests)));

        return true;
    }

    /**
     * Rate limit estricto para rutas de autenticacion (login, recovery)
     */
    public static function checkAuth(): bool
    {
        return self::check(20, 60, 'auth'); // 20 intentos por minuto
    }

    /**
     * Rate limit para API general
     */
    public static function checkApi(): bool
    {
        return self::check(120, 60, 'api'); // 120 requests por minuto
    }

    /**
     * Inicializar directorio de almacenamiento
     */
    private static function initStorage(): void
    {
        if (empty(self::$storageDir)) {
            self::$storageDir = sys_get_temp_dir() . '/azaria_ratelimit';
        }

        if (!is_dir(self::$storageDir)) {
            @mkdir(self::$storageDir, 0755, true);
        }

        // Limpiar archivos viejos cada ~100 requests (probabilistico)
        if (mt_rand(1, 100) === 1) {
            self::cleanup();
        }
    }

    /**
     * Limpiar archivos de rate limit viejos (> 5 minutos)
     */
    private static function cleanup(): void
    {
        $files = glob(self::$storageDir . '/*.json');
        $threshold = time() - 300; // 5 minutos

        foreach ($files as $file) {
            if (filemtime($file) < $threshold) {
                @unlink($file);
            }
        }
    }

    /**
     * Obtener IP del cliente
     */
    private static function getClientIp(): string
    {
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                // X-Forwarded-For puede tener multiples IPs
                $ip = explode(',', $_SERVER[$header])[0];
                return trim($ip);
            }
        }

        return '0.0.0.0';
    }
}
