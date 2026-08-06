<?php
namespace App\Middleware;

class CorsMiddleware {

    /**
     * Lista de orígenes permitidos para CORS
     * Cumplimiento: Lineamientos de Seguridad UNAM Art. 15
     */
    private static array $allowedOrigins = [
        'http://localhost:3000',             // Desarrollo frontend (CRA)
        'http://localhost:5173',             // Vite dev server
        'https://dtai.uteq.edu.mx',         // Produccion UTEQ
        'http://dtai.uteq.edu.mx',          // Produccion UTEQ (http)
        'https://azav2-1.onrender.com',
        'https://azav21-production.up.railway.app',
    ];

    /**
     * Agrega orígenes adicionales definidos en el entorno CORS_ALLOWED_ORIGINS
     */
    private static function getAllowedOrigins(): array
    {
        $origins = self::$allowedOrigins;
        $envOrigins = getenv('CORS_ALLOWED_ORIGINS') ?: getenv('ALLOWED_ORIGINS') ?: '';

        foreach (explode(',', $envOrigins) as $origin) {
            $origin = trim($origin);
            if ($origin !== '' && !in_array($origin, $origins, true)) {
                $origins[] = $origin;
            }
        }

        return $origins;
    }

    /**
     * Maneja las cabeceras CORS de forma segura
     * Solo permite orígenes explícitamente autorizados
     */
    public static function handle(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = self::getAllowedOrigins();

        // Solo permitir orígenes de la lista blanca
        if (in_array($origin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
        header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas

        // Cabeceras de seguridad adicionales
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /**
     * Agrega un origen a la lista de permitidos (para configuración dinámica)
     */
    public static function addAllowedOrigin(string $origin): void {
        if (!in_array($origin, self::$allowedOrigins, true)) {
            self::$allowedOrigins[] = $origin;
        }
    }
}
