<?php

/**
 * OBSOLETO: reemplazado por NeupsiproApiService.php.
 * Ya no lo usa ningún controlador (ExternalPatientController ahora usa
 * NeupsiproApiService). Se deja el archivo por si se necesita como
 * referencia, pero puede borrarse con seguridad.
 */

namespace App\Services;

use RuntimeException;

/**
 * Cliente HTTP pequeño para la aplicación clínica externa.
 * La URL y las rutas son configurables por entorno para no acoplar el código
 * a un proveedor concreto ni exponer tokens en el navegador.
 */
class ExternalHealthApiService
{
    private $baseUrl;
    private $token;
    private $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim((string)(getenv('EXTERNAL_HEALTH_API_URL') ?: ''), '/');
        $this->token = (string)(getenv('EXTERNAL_HEALTH_API_TOKEN') ?: '');
        $this->timeout = (int)(getenv('EXTERNAL_HEALTH_API_TIMEOUT') ?: 10);
    }

    public function getPatientProfile(array $user)
    {
        return $this->request('GET', getenv('EXTERNAL_PROFILE_PATH') ?: '/patients/profile', $user);
    }

    public function updatePatientProfile(array $user, array $payload)
    {
        return $this->request('PUT', getenv('EXTERNAL_PROFILE_PATH') ?: '/patients/profile', $user, $payload);
    }

    public function getAppointments(array $user)
    {
        return $this->request('GET', getenv('EXTERNAL_NEURO_APPOINTMENTS_PATH') ?: '/patients/neuro/appointments', $user);
    }

    public function getDocuments(array $user)
    {
        return $this->request('GET', getenv('EXTERNAL_NEURO_DOCUMENTS_PATH') ?: '/patients/neuro/documents', $user);
    }

    public function getAssignedSpecialist(array $user)
    {
        return $this->request('GET', getenv('EXTERNAL_NEURO_SPECIALIST_PATH') ?: '/patients/neuro/specialist', $user);
    }

    private function request($method, $path, array $user, array $payload = null)
    {
        if ($this->baseUrl === '') {
            throw new RuntimeException('La API clínica externa no está configurada');
        }

        $query = http_build_query([
            'user_id' => $user['id'] ?? null,
            'patient_id' => $user['paciente_id'] ?? null,
            'email' => $user['email'] ?? null,
        ]);
        $url = $this->baseUrl . '/' . ltrim($path, '/');
        $url .= (strpos($url, '?') === false ? '?' : '&') . $query;

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'X-Internal-User-Id: ' . (string)($user['id'] ?? ''),
        ];
        if ($this->token !== '') {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_FAILONERROR => false,
        ]);

        if ($payload !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $body = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($body === false || $curlError !== '') {
            throw new RuntimeException('La API clínica externa no respondió: ' . ($curlError ?: 'error de red'));
        }

        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('La API clínica externa devolvió una respuesta inválida');
        }
        if ($status >= 400) {
            throw new RuntimeException($decoded['message'] ?? 'La API clínica externa rechazó la solicitud');
        }

        return $decoded['data'] ?? $decoded;
    }
}
