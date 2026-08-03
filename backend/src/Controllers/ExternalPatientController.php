<?php

namespace App\Controllers;

use App\Services\NeupsiproApiService;
use App\Utils\Response;
use RuntimeException;

/**
 * Puente entre el módulo de neuropsicología de azav2.1 y neupsipro.
 * Todo lo que expone este controlador viene de endpoints que YA existen
 * hoy en neupsipro (ver NeupsiproApiService para el detalle de cada uno).
 */
class ExternalPatientController
{
    private $neupsipro;

    public function __construct()
    {
        $this->neupsipro = new NeupsiproApiService();
    }

    /**
     * Resuelve el vínculo del usuario autenticado de azav2.1 con su
     * paciente en neupsipro, usando el correo como llave.
     * Lanza un error 409 controlado si aún no ha sido sincronizado.
     */
    private function resolveLink(array $user): array
    {
        $email = $user['email'] ?? null;
        if (!$email) {
            throw new RuntimeException('__NO_EMAIL__');
        }

        $link = $this->neupsipro->findLinkByEmail($email);
        if (!$link) {
            throw new RuntimeException('__NOT_LINKED__');
        }

        return $link;
    }

    // =====================================================================
    // PERFIL + FOLIO + COLABORADOR ASIGNADO
    // =====================================================================

    public function getProfile($user)
    {
        return $this->respond(function () use ($user) {
            $link = $this->resolveLink($user);
            $detail = $this->neupsipro->fetchPatientDetail($link['neupsipro_id_user']);

            return [
                'folio' => $detail['folio'],
                'nombreCompleto' => $detail['nombreCompleto'],
                'correo' => $detail['correo'],
                'colaboradorAsignado' => $detail['colaboradorAsignado'],
                'protocolo' => $detail['protocolo'],
                'estado' => $detail['estado'],
                'proximaCita' => $detail['proximaCita'],
            ];
        });
    }

    /**
     * neupsipro no tiene un endpoint de auto-edición de perfil por parte
     * del paciente (editar usuario ahí es una acción de staff con permiso
     * 'user management:writing'). Se deja explícito en vez de simular
     * un éxito falso.
     */
    public function updateProfile($user, array $payload)
    {
        return Response::error(
            'La edición de perfil clínico se hace desde neupsipro directamente; azav2.1 solo puede consultarlo.',
            501
        );
    }

    public function getAssignedSpecialist($user)
    {
        return $this->respond(function () use ($user) {
            $link = $this->resolveLink($user);
            $detail = $this->neupsipro->fetchPatientDetail($link['neupsipro_id_user']);

            return [
                'colaboradorAsignado' => $detail['colaboradorAsignado'],
            ];
        });
    }

    // =====================================================================
    // EVALUACIONES (antes "documentos")
    // =====================================================================

    /** Lista de evaluaciones/aplicaciones del paciente. */
    public function getNeuroDocuments($user)
    {
        return $this->respond(function () use ($user) {
            $link = $this->resolveLink($user);
            $detail = $this->neupsipro->fetchPatientDetail($link['neupsipro_id_user']);

            return [
                'folio' => $detail['folio'],
                'colaboradorAsignado' => $detail['colaboradorAsignado'],
                'evaluaciones' => $detail['evaluaciones'],
            ];
        });
    }

    /** Detalle (tests individuales) de UNA evaluación puntual. */
    public function getNeuroDocumentDetail($user, $idAplicacion)
    {
        return $this->respond(function () use ($user, $idAplicacion) {
            $link = $this->resolveLink($user);
            return $this->neupsipro->fetchApplicationTests($link['neupsipro_id_user'], $idAplicacion);
        });
    }

    /**
     * Proxy de descarga del PDF de resultados de una evaluación.
     * Acepta el token también por query (?token=) para permitir abrir
     * la descarga en una pestaña nueva, igual que el resto de la app.
     */
    public function downloadNeuroDocument($user, $idAplicacion)
    {
        try {
            $link = $this->resolveLink($user);
            $path = $this->neupsipro->buildExportPath($link['neupsipro_id_user'], $idAplicacion);
            [, $body, $contentType, $contentDisposition] = $this->neupsipro->rawBinaryRequest($path);

            header('Content-Type: ' . $contentType);
            header('Content-Disposition: ' . ($contentDisposition ?: ('attachment; filename="evaluacion_' . $idAplicacion . '.pdf"')));
            header('Content-Length: ' . strlen($body));
            header('Cache-Control: no-cache');
            echo $body;
            exit;
        } catch (RuntimeException $e) {
            $this->handleLinkError($e);
        }
    }

    // =====================================================================
    // SINCRONIZACIÓN (uso administrativo)
    // =====================================================================

    /** Sincroniza un paciente puntual por su id_user de neupsipro. */
    public function syncOne($neupsiproIdUser)
    {
        return $this->respond(fn () => $this->neupsipro->syncPatient($neupsiproIdUser), 'Paciente sincronizado');
    }

    /** Recorre todo neupsipro y refresca la tabla puente completa. */
    public function syncAll()
    {
        return $this->respond(fn () => $this->neupsipro->syncAll(), 'Sincronización completada');
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    private function respond(callable $callback, $message = 'Datos obtenidos')
    {
        try {
            return Response::success($callback(), $message);
        } catch (RuntimeException $e) {
            return $this->handleLinkError($e);
        }
    }

    private function handleLinkError(RuntimeException $e)
    {
        if ($e->getMessage() === '__NOT_LINKED__') {
            return Response::error('Tu expediente de neuropsicología aún no ha sido vinculado. Intenta de nuevo más tarde o contacta a soporte.', 409);
        }
        if ($e->getMessage() === '__NO_EMAIL__') {
            return Response::error('Tu cuenta no tiene un correo registrado, no se puede vincular con neuropsicología.', 422);
        }

        error_log('[ExternalPatientController] ' . $e->getMessage());
        return Response::error($e->getMessage(), 503);
    }
}
