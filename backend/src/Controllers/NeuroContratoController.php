<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\ContratoTerapeutico;
use App\Models\NeuroFase;
use App\Services\FileUploadService;
use App\Utils\Response;

class NeuroContratoController
{
    private $fileUploadService;

    public function __construct()
    {
        $this->fileUploadService = new FileUploadService();
    }

    /**
     * Mismo criterio de acceso que NeuroFaseController: el propio paciente,
     * o un especialista de Neuropsicología asignado a él.
     */
    private function usuarioPuedeAccederPaciente($pacienteId, $user)
    {
        if ((int) $user['rol_id'] === 3) {
            return (int) ($user['paciente_id'] ?? 0) === (int) $pacienteId;
        }

        if ((int) $user['rol_id'] === 2) {
            return NeuroFase::getEspecialistaAsignado($pacienteId) === (int) $user['id'];
        }

        return false;
    }

    // Convertir ruta relativa de archivo a URL completa (mismo criterio
    // que ComunidadController::resolveImageUrl)
    private function resolveArchivoUrl($contrato)
    {
        if ($contrato && !empty($contrato['archivo_url']) && !str_starts_with($contrato['archivo_url'], 'http')) {
            $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
            $contrato['archivo_url'] = $baseUrl . '/uploads/' . $contrato['archivo_url'];
        }
        return $contrato;
    }

    public function getActual($pacienteId)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || !$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }

        $contrato = $this->resolveArchivoUrl(ContratoTerapeutico::getActual($pacienteId));
        return Response::success(['contrato' => $contrato]);
    }

    public function subir($pacienteId)
    {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user) {
            return Response::error('No autorizado', 401);
        }

        if ((int) $user['rol_id'] !== 2) {
            return Response::error('Solo un especialista puede subir el contrato terapéutico', 403);
        }

        if (!$this->usuarioPuedeAccederPaciente($pacienteId, $user)) {
            return Response::error('No autorizado', 403);
        }

        if (empty($_FILES['archivo'])) {
            return Response::error('Falta el archivo del contrato', 422);
        }

        try {
            $archivoUrl = $this->fileUploadService->upload($_FILES['archivo'], 'neuro-contratos', ['pdf']);
        } catch (\Exception $e) {
            return Response::error('El archivo debe ser un PDF válido', 422);
        }

        $contrato = $this->resolveArchivoUrl(ContratoTerapeutico::crear($pacienteId, $user['id'], $archivoUrl));

        return Response::success(['contrato' => $contrato], 'Contrato terapéutico subido exitosamente', 201);
    }
}
