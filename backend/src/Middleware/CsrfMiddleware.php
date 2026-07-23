<?php

namespace App\Middleware;

use App\Utils\Response;

/**
 * CSRF Protection para rutas POST/PUT/DELETE
 *
 * En una SPA con token Bearer (no cookies de sesion), el vector CSRF clasico
 * es limitado. Sin embargo, verificamos el Origin header como defensa en profundidad.
 *
 * Verifica que:
 * 1. El request venga de un origen permitido (Origin header)
 * 2. O que incluya el header X-Requested-With (solo posible desde JS mismo origen)
 */
class CsrfMiddleware
{
    private static array $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8000',
        'https://dtai.uteq.edu.mx',
        'http://dtai.uteq.edu.mx',
        'https://azaria-production.up.railway.app', // <-- Dominio de producción en Railway
    ];

    /**
     * Rutas que están exentas de la validación estricta de CSRF
     */
    private static array $exceptRoutes = [
        '/api/guardar_porciones',
        '/backend/src/Controllers/guardar_porciones.php'
    ];

    /**
     * Verificar proteccion CSRF en requests mutantes
     */
    public static function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];

        // Solo verificar en metodos que modifican datos
        if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            return;
        }

        // Excepción de rutas permitidas directamente
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        foreach (self::$exceptRoutes as $except) {
            if (strpos($uri, $except) !== false) {
                return; // Omitir verificación CSRF para esta ruta
            }
        }

        // Verificar X-Requested-With header (axios o fetch lo pueden enviar)
        $xRequestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
        if (strtolower($xRequestedWith) === 'xmlhttprequest') {
            return; // OK - request hecho desde JavaScript
        }

        // Verificar Origin header
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (!empty($origin) && in_array($origin, self::$allowedOrigins, true)) {
            return; // OK - origen permitido
        }

        // Verificar Referer como fallback (algunos browsers no envian Origin)
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        if (!empty($referer)) {
            $refererOrigin = parse_url($referer, PHP_URL_SCHEME) . '://' . parse_url($referer, PHP_URL_HOST);
            $port = parse_url($referer, PHP_URL_PORT);
            if ($port) {
                $refererOrigin .= ':' . $port;
            }
            if (in_array($refererOrigin, self::$allowedOrigins, true)) {
                return; // OK - referer de origen permitido
            }
        }

        // Si no hay Origin ni Referer, permitir (requests desde mismo servidor o tools)
        if (empty($origin) && empty($referer)) {
            return;
        }

        // Bloquear - posible CSRF
        Response::error('Solicitud rechazada por proteccion CSRF', 403);
    }
}