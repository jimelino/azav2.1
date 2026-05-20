<?php

namespace App\Controllers;

use App\Models\Publicacion;
use App\Models\ComentarioComunidad;
use App\Models\Reaccion;
use App\Models\Reporte;
use App\Services\FileUploadService;
use App\Services\ModerationService;
use App\Utils\Response;
use App\Utils\Validator;

class ComunidadController
{
    private $fileUploadService;
    private $moderationService;

    public function __construct()
    {
        $this->fileUploadService = new FileUploadService();
        $this->moderationService = new ModerationService();
    }

    // FEED DE PUBLICACIONES
    public function getFeed($userId, $filters = [])
    {
        $publicaciones = Publicacion::getFeed($userId, $filters);
        $publicaciones = array_map([$this, 'resolveImageUrl'], $publicaciones);
        return Response::success($publicaciones);
    }

    // OBTENER PUBLICACIÓN
    public function getPublicacion($id)
    {
        $publicacion = Publicacion::find($id);

        if (!$publicacion) {
            return Response::error('Publicación no encontrada', 404);
        }

        $publicacion = $this->resolveImageUrl($publicacion);
        return Response::success($publicacion);
    }

    // Convertir ruta relativa de imagen a URL completa
    private function resolveImageUrl($item)
    {
        if (!empty($item['imagen_url']) && !str_starts_with($item['imagen_url'], 'http')) {
            $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
            $item['imagen_url'] = $baseUrl . '/uploads/' . $item['imagen_url'];
        }
        return $item;
    }

    // CREAR PUBLICACIÓN
    public function crearPublicacion($data)
    {
        $validator = new Validator($data);
        $validator->required(['usuario_id', 'contenido']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        // Subir imagen si existe
        if (isset($_FILES['imagen'])) {
            $imagePath = $this->fileUploadService->upload($_FILES['imagen'], 'comunidad');
            $data['imagen'] = $imagePath;
        }

        // Moderar contenido
        $moderacion = $this->moderationService->moderate($data['contenido']);

        if (!$moderacion['approved']) {
            $data['estado'] = CONTENIDO_PENDIENTE;
            $data['motivo_rechazo'] = $moderacion['reason'];
        } else {
            $data['estado'] = CONTENIDO_APROBADO;
        }

        $result = Publicacion::create($data);

        if ($result) {
            if ($data['estado'] === CONTENIDO_PENDIENTE) {
                return Response::success($result, 'Publicación enviada a moderación', 201);
            }

            return Response::success($result, 'Publicación creada exitosamente', 201);
        }

        return Response::error('Error al crear publicación', 500);
    }

    // ACTUALIZAR PUBLICACIÓN
    public function actualizarPublicacion($id, $data)
    {
        $currentUser = \App\Middleware\AuthMiddleware::getCurrentUser();
        $publicacion = Publicacion::find($id);

        if (!$publicacion) {
            return Response::error('Publicación no encontrada', 404);
        }

        if ($publicacion['usuario_id'] != $currentUser['id']) {
            return Response::error('No tienes permiso para editar esta publicación', 403);
        }

        if (isset($_FILES['imagen'])) {
            $imagePath = $this->fileUploadService->upload($_FILES['imagen'], 'comunidad');
            $data['imagen'] = $imagePath;
        }

        $result = Publicacion::update($id, $data);

        if ($result) {
            $updated = Publicacion::find($id);
            $updated = $this->resolveImageUrl($updated);
            return Response::success($updated, 'Publicación actualizada exitosamente');
        }

        return Response::error('Error al actualizar publicación', 500);
    }

    // ELIMINAR PUBLICACIÓN
    public function eliminarPublicacion($id)
    {
        $currentUser = \App\Middleware\AuthMiddleware::getCurrentUser();
        $publicacion = Publicacion::find($id);

        if (!$publicacion) {
            return Response::error('Publicación no encontrada', 404);
        }

        if ($publicacion['usuario_id'] != $currentUser['id']) {
            return Response::error('No tienes permiso para eliminar esta publicación', 403);
        }

        $result = Publicacion::delete($id);

        if ($result) {
            return Response::success(null, 'Publicación eliminada exitosamente');
        }

        return Response::error('Error al eliminar publicación', 500);
    }

    // COMENTARIOS
    public function getComentarios($publicacionId)
    {
        $comentarios = ComentarioComunidad::getByPublicacion($publicacionId);
        return Response::success($comentarios);
    }

    public function crearComentario($data)
    {
        $validator = new Validator($data);
        $validator->required(['publicacion_id', 'usuario_id', 'contenido']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        // Moderar comentario
        $moderacion = $this->moderationService->moderate($data['contenido']);

        if (!$moderacion['approved']) {
            return Response::error('El comentario contiene contenido inapropiado', 422);
        }

        $result = ComentarioComunidad::create($data);

        if ($result) {
            return Response::success($result, 'Comentario agregado', 201);
        }

        return Response::error('Error al agregar comentario', 500);
    }

    public function eliminarComentario($id)
    {
        $result = ComentarioComunidad::delete($id);

        if ($result) {
            return Response::success(null, 'Comentario eliminado');
        }

        return Response::error('Error al eliminar comentario', 500);
    }

    // REACCIONES
    public function reaccionar($data)
    {
        $validator = new Validator($data);
        $validator->required(['usuario_id', 'publicacion_id', 'tipo_reaccion'])
                  ->in('tipo_reaccion', ['me_gusta', 'me_inspira', 'me_identifico', 'me_motiva', 'apoyo', 'gracias', 'celebrar']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = Reaccion::toggle($data);

        if ($result) {
            return Response::success($result);
        }

        return Response::error('Error al registrar reacción', 500);
    }

    public function getReacciones($publicacionId)
    {
        $reacciones = Reaccion::getByPublicacion($publicacionId);
        return Response::success($reacciones);
    }

    // REPORTAR CONTENIDO
    public function reportarContenido($data)
    {
        $validator = new Validator($data);
        $validator->required(['usuario_id', 'contenido_tipo', 'contenido_id', 'motivo']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $result = Reporte::create($data);

        if ($result) {
            // Notificar a moderadores
            $this->moderationService->notifyModerators($result);

            return Response::success(null, 'Reporte enviado. Será revisado por moderadores.');
        }

        return Response::error('Error al enviar reporte', 500);
    }

    // MODERACIÓN (solo moderadores)
    public function getColaModeracion()
    {
        $cola = [
            'publicaciones_pendientes' => Publicacion::getPendientes(),
            'reportes_pendientes' => Reporte::getPendientes()
        ];

        return Response::success($cola);
    }

    public function aprobarContenido($tipo, $id)
    {
        $result = null;

        if ($tipo === 'publicacion') {
            $result = Publicacion::approve($id);
        } elseif ($tipo === 'reporte') {
            $result = Reporte::resolve($id, 'aprobado');
        }

        if ($result) {
            return Response::success(null, 'Contenido aprobado');
        }

        return Response::error('Error al aprobar contenido', 500);
    }

    public function rechazarContenido($tipo, $id, $data)
    {
        $result = null;

        if ($tipo === 'publicacion') {
            $result = Publicacion::reject($id, $data['motivo'] ?? null);
        } elseif ($tipo === 'reporte') {
            $result = Reporte::resolve($id, 'rechazado', $data['notas'] ?? null);
        }

        if ($result) {
            return Response::success(null, 'Contenido rechazado');
        }

        return Response::error('Error al rechazar contenido', 500);
    }

    // MIS PUBLICACIONES
    public function getMisPublicaciones($usuarioId)
    {
        $publicaciones = Publicacion::getByUsuario($usuarioId);
        return Response::success($publicaciones);
    }

    // FILTRAR POR TEMA
    public function getPorTema($tema)
    {
        $publicaciones = Publicacion::getByTema($tema);
        return Response::success($publicaciones);
    }
}
