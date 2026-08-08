<?php

namespace App\Middleware;

use App\Utils\Response;

/**
 * Autenticación máquina-a-máquina para APIs de integración con sistemas
 * externos (sin sesión de usuario). Espera "Authorization: Bearer <token>"
 * validado contra una variable de entorno por integración, siguiendo el
 * mismo esquema que Azaria ya usa como cliente en ExternalHealthApiService,
 * pero en sentido inverso.
 */
class ApiKeyMiddleware
{
    public function handle($envVar = 'EXTERNAL_NEURO_INGEST_TOKEN')
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : '';
        $expected = (string) (getenv($envVar) ?: '');

        if ($expected === '' || $token === '' || !hash_equals($expected, $token)) {
            Response::error('No autorizado', 401);
        }

        return true;
    }
}
