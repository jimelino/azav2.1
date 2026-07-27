<?php

namespace App\Controllers;

use App\Services\ExternalHealthApiService;
use App\Utils\Response;
use RuntimeException;

class ExternalPatientController
{
    private $externalApi;

    public function __construct()
    {
        $this->externalApi = new ExternalHealthApiService();
    }

    public function getProfile($user)
    {
        return $this->respond(fn() => $this->externalApi->getPatientProfile($user));
    }

    public function updateProfile($user, array $payload)
    {
        $allowed = ['nombre_completo', 'fecha_nacimiento', 'telefono'];
        $payload = array_intersect_key($payload, array_flip($allowed));
        if (!$payload) {
            return Response::error('No hay datos de perfil para actualizar', 422);
        }

        return $this->respond(fn() => $this->externalApi->updatePatientProfile($user, $payload), 'Perfil actualizado');
    }

    public function getNeuroAppointments($user)
    {
        return $this->respond(fn() => $this->externalApi->getAppointments($user));
    }

    public function getNeuroDocuments($user)
    {
        return $this->respond(fn() => $this->externalApi->getDocuments($user));
    }

    public function getAssignedSpecialist($user)
    {
        return $this->respond(fn() => $this->externalApi->getAssignedSpecialist($user));
    }

    private function respond(callable $callback, $message = 'Datos obtenidos')
    {
        try {
            return Response::success($callback(), $message);
        } catch (RuntimeException $e) {
            error_log('External health API: ' . $e->getMessage());
            return Response::error($e->getMessage(), 503);
        }
    }
}
