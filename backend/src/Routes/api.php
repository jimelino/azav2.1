<?php

use App\Controllers\AuthController;
use App\Controllers\PerfilController;
use App\Controllers\FaseController;
use App\Controllers\NutricionController;
use App\Controllers\MedicinaController;
use App\Controllers\FisioterapiaController;
use App\Controllers\NeuropsicologiaController;
use App\Controllers\OrtesisController;
use App\Controllers\CitasController;
use App\Controllers\ChatController;
use App\Controllers\RecordatoriosController;
use App\Controllers\FAQController;
use App\Controllers\BlogController;
use App\Controllers\ComunidadController;
use App\Controllers\DashboardController;
use App\Controllers\AdminController;
use App\Controllers\EspecialistaController;
use App\Controllers\MensajesController;
use App\Controllers\ExpedienteController;
use App\Controllers\ConfiguracionController;
use App\Controllers\AdmisionesController;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Middleware\RateLimitMiddleware;

// Función helper para rutas
function route($method, $path, $callback, $middleware = []) {
    global $requestMethod, $requestUri;

    if ($requestMethod === $method && preg_match("#^$path$#", $requestUri, $matches)) {
        // Aplicar middleware
        foreach ($middleware as $mw) {
            if ($mw === 'auth') {
                $auth = new AuthMiddleware();
                $auth->handle();
            } elseif ($mw === 'rate:auth') {
                RateLimitMiddleware::checkAuth();
            } elseif ($mw === 'rate:api') {
                RateLimitMiddleware::checkApi();
            } elseif (str_starts_with($mw, 'role:')) {
                $roles = explode(',', substr($mw, 5));
                RoleMiddleware::check($roles);
            }
        }

        // Ejecutar callback
        array_shift($matches); // Remover match completo
        call_user_func_array($callback, $matches);
        exit;
    }
}

// RUTAS PÚBLICAS

route('POST', '/api/auth/login', function() {
    $data = json_decode(file_get_contents('php://input'), true);

    $controller = new AuthController();
    $controller->login($data);
}, ['rate:auth']);

route('POST', '/api/auth/forgot-password', function() {
    $controller = new AuthController();
    $controller->forgotPassword(json_decode(file_get_contents('php://input'), true));
}, ['rate:auth']);

route('POST', '/api/auth/verify-code', function() {
    $controller = new AuthController();
    $controller->verifyRecoveryCode(json_decode(file_get_contents('php://input'), true));
}, ['rate:auth']);

route('POST', '/api/auth/reset-password', function() {
    $controller = new AuthController();
    $controller->resetPassword(json_decode(file_get_contents('php://input'), true));
}, ['rate:auth']);

// RUTAS PROTEGIDAS - AUTENTICACIÓN
route('POST', '/api/auth/logout', function() {
    $controller = new AuthController();
    $controller->logout();
}, ['auth']);

route('POST', '/api/auth/setup-pin', function() {
    $controller = new AuthController();
    $controller->setupPIN(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/auth/check-session', function() {
    $controller = new AuthController();
    $controller->checkSession();
}, ['auth']);

route('GET', '/api/auth/devices', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new AuthController();
    $controller->getTrustedDevices($user['id']);
}, ['auth']);

// RUTAS DE DASHBOARD
route('GET', '/api/dashboard/resumen/(\d+)', function($userId) {
    $controller = new DashboardController();
    $controller->getResumen($userId);
}, ['auth']);

// RUTAS DE PERFIL
route('GET', '/api/perfil', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new PerfilController();
    $controller->getPerfil($user['id']);
}, ['auth']);

route('PUT', '/api/perfil', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new PerfilController();
    $controller->updatePerfil($user['id'], json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// RUTA PARA OBTENER ESPECIALISTAS ASIGNADOS A UN PACIENTE
route('GET', '/api/pacientes/(\d+)/especialistas', function($pacienteId) {
    $controller = new PerfilController();
    $controller->getEspecialistasAsignados($pacienteId);
}, ['auth']);

// RUTAS DE FASES
route('GET', '/api/fases/actual/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->getFaseActual($pacienteId);
}, ['auth']);

route('GET', '/api/fases/progreso/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->getProgreso($pacienteId);
}, ['auth']);

// RUTAS DE NUTRICIÓN
route('GET', '/api/nutricion/recetas', function() {
    $controller = new NutricionController();
    $controller->getRecetas();
}, ['auth']);

route('GET', '/api/nutricion/historial/(\d+)', function($pacienteId) {
    $controller = new NutricionController();
    $controller->getHistorialComidas($pacienteId);
}, ['auth']);

route('POST', '/api/nutricion/comidas', function() {
    $controller = new NutricionController();
    $controller->registrarComida(array_merge($_POST, $_FILES));
}, ['auth']);

route('GET', '/api/nutricion/checklist/(\d+)/([0-9-]+)', function($pacienteId, $fecha) {
    $controller = new NutricionController();
    $controller->getChecklistDiario($pacienteId, $fecha);
}, ['auth']);

route('POST', '/api/nutricion/checklist', function() {
    $controller = new NutricionController();
    $controller->actualizarChecklist(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Nuevas rutas para módulo de nutrición mejorado
route('GET', '/api/nutricion/resumen/(\d+)/([0-9-]+)', function($pacienteId, $fecha) {
    $controller = new NutricionController();
    $controller->getResumenDia($pacienteId, $fecha);
}, ['auth']);

route('POST', '/api/nutricion/agua', function() {
    $controller = new NutricionController();
    $controller->registrarAgua(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/nutricion/agua/(\d+)/([0-9-]+)', function($pacienteId, $fecha) {
    $controller = new NutricionController();
    $controller->getRegistroAgua($pacienteId, $fecha);
}, ['auth']);

route('POST', '/api/nutricion/alimento', function() {
    $controller = new NutricionController();
    $controller->registrarAlimento(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/nutricion/alimentos/buscar', function() {
    $controller = new NutricionController();
    $controller->buscarAlimentos($_GET['q'] ?? '');
}, ['auth']);

// RUTAS DE MEDICINA
route('GET', '/api/medicina/glucosa/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getGlucosa($pacienteId);
}, ['auth']);

route('POST', '/api/medicina/glucosa', function() {
    $controller = new MedicinaController();
    $controller->registrarGlucosa(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/medicina/presion/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getPresion($pacienteId);
}, ['auth']);

route('POST', '/api/medicina/presion', function() {
    $controller = new MedicinaController();
    $controller->registrarPresion(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/medicina/dolor/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getDolor($pacienteId);
}, ['auth']);

route('POST', '/api/medicina/dolor', function() {
    $controller = new MedicinaController();
    $controller->registrarDolor(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/medicina/resumen/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getResumen($pacienteId);
}, ['auth']);

// HbA1c (Hemoglobina Glicosilada)
route('GET', '/api/medicina/hba1c/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getHba1c($pacienteId);
}, ['auth']);

route('POST', '/api/medicina/hba1c', function() {
    $controller = new MedicinaController();
    $controller->registrarHba1c(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Medicamentos (Recetas Médicas)
route('GET', '/api/medicina/medicamentos/(\d+)', function($pacienteId) {
    $controller = new MedicinaController();
    $controller->getMedicamentos($pacienteId);
}, ['auth']);

route('POST', '/api/medicina/medicamentos', function() {
    $controller = new MedicinaController();
    $controller->crearMedicamento(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/medicina/medicamentos/(\d+)', function($id) {
    $controller = new MedicinaController();
    $controller->actualizarMedicamento($id);
}, ['auth']);

route('DELETE', '/api/medicina/medicamentos/(\d+)', function($id) {
    $controller = new MedicinaController();
    $controller->eliminarMedicamento($id);
}, ['auth']);

// RUTAS DE FISIOTERAPIA
route('GET', '/api/fisioterapia/videos', function() {
    $controller = new FisioterapiaController();
    $controller->getVideos();
}, ['auth']);

route('GET', '/api/fisioterapia/videos/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->getVideo($id);
}, ['auth']);

route('GET', '/api/fisioterapia/rutina/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getVideosAsignados($pacienteId);
}, ['auth']);

route('GET', '/api/fisioterapia/progreso/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getHistorialChecklist($pacienteId);
}, ['auth']);

route('GET', '/api/fisioterapia/guias', function() {
    $controller = new FisioterapiaController();
    $controller->getGuias();
}, ['auth']);

route('GET', '/api/fisioterapia/checklist/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getChecklist($pacienteId);
}, ['auth']);

route('POST', '/api/fisioterapia/checklist', function() {
    $controller = new FisioterapiaController();
    $controller->guardarChecklist(array_merge($_POST, json_decode(file_get_contents('php://input'), true) ?? [], $_FILES));
}, ['auth']);

// Completar ejercicio (paciente)
route('POST', '/api/fisioterapia/ejercicio/completar', function() {
    $controller = new FisioterapiaController();
    $controller->completarEjercicio(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Evaluaciones físicas
route('GET', '/api/fisioterapia/evaluaciones/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getEvaluaciones($pacienteId);
}, ['auth']);

route('GET', '/api/fisioterapia/evaluacion/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->getEvaluacion($id);
}, ['auth']);

route('POST', '/api/fisioterapia/evaluaciones', function() {
    $controller = new FisioterapiaController();
    $controller->crearEvaluacion();
}, ['auth']);

route('PUT', '/api/fisioterapia/evaluaciones/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->actualizarEvaluacion($id);
}, ['auth']);

route('DELETE', '/api/fisioterapia/evaluaciones/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->eliminarEvaluacion($id);
}, ['auth']);

// Planes de tratamiento
route('GET', '/api/fisioterapia/planes/paciente/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getPlanes($pacienteId);
}, ['auth']);

route('GET', '/api/fisioterapia/planes/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->getPlan($id);
}, ['auth']);

route('POST', '/api/fisioterapia/planes', function() {
    $controller = new FisioterapiaController();
    $controller->crearPlan();
}, ['auth']);

route('PUT', '/api/fisioterapia/planes/(\d+)', function($id) {
    $controller = new FisioterapiaController();
    $controller->actualizarPlan($id);
}, ['auth']);

route('PUT', '/api/fisioterapia/planes/(\d+)/estado', function($id) {
    $controller = new FisioterapiaController();
    $controller->cambiarEstadoPlan($id);
}, ['auth']);

// Stats de fisioterapia para especialista
route('GET', '/api/fisioterapia/stats/paciente/(\d+)', function($pacienteId) {
    $controller = new FisioterapiaController();
    $controller->getEstadisticasPaciente($pacienteId);
}, ['auth']);

// RUTAS DE NEUROPSICOLOGÍA
route('GET', '/api/neuropsicologia/estados-animo/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getEstadosAnimo($pacienteId);
}, ['auth']);

route('POST', '/api/neuropsicologia/estados-animo', function() {
    $controller = new NeuropsicologiaController();
    $controller->registrarEstadoAnimo(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/neuropsicologia/ejercicios', function() {
    $controller = new NeuropsicologiaController();
    $controller->getEjercicios();
}, ['auth']);

route('GET', '/api/neuropsicologia/cuestionarios/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getCuestionarios($pacienteId);
}, ['auth']);

route('POST', '/api/neuropsicologia/cuestionarios', function() {
    $controller = new NeuropsicologiaController();
    $controller->guardarCuestionario(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Cuestionarios ACT - Resultados
route('POST', '/api/neuropsicologia/cuestionarios/resultado', function() {
    $controller = new NeuropsicologiaController();
    $controller->guardarResultadoCuestionario(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/neuropsicologia/cuestionarios/historial/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getHistorialCuestionarios($pacienteId);
}, ['auth']);

// Cuestionarios personalizados (especialista)
route('GET', '/api/neuropsicologia/cuestionarios-personalizados', function() {
    $controller = new NeuropsicologiaController();
    $controller->getCuestionariosPersonalizados();
}, ['auth']);

route('POST', '/api/neuropsicologia/cuestionarios-personalizados', function() {
    $controller = new NeuropsicologiaController();
    $controller->crearCuestionarioPersonalizado();
}, ['auth']);

route('DELETE', '/api/neuropsicologia/cuestionarios-personalizados/(\d+)', function($id) {
    $controller = new NeuropsicologiaController();
    $controller->eliminarCuestionarioPersonalizado($id);
}, ['auth']);

route('GET', '/api/neuropsicologia/cuestionarios-personalizados/(\d+)/respuestas', function($id) {
    $controller = new NeuropsicologiaController();
    $controller->getRespuestasCuestionario($id);
}, ['auth']);

// Cuestionarios para el usuario (paciente)
route('GET', '/api/neuropsicologia/mis-cuestionarios/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getCuestionariosPaciente($pacienteId);
}, ['auth']);

route('POST', '/api/neuropsicologia/mis-cuestionarios/responder', function() {
    $controller = new NeuropsicologiaController();
    $controller->guardarRespuestaCuestionario(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/neuropsicologia/mis-cuestionarios/historial/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getHistorialRespuestas($pacienteId);
}, ['auth']);

// Sesiones ACT
route('POST', '/api/neuropsicologia/act/sesion', function() {
    $controller = new NeuropsicologiaController();
    $controller->guardarSesionACT(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/neuropsicologia/act/historial/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getHistorialACT($pacienteId);
}, ['auth']);

// Asignaciones ACT (especialista)
route('GET', '/api/neuropsicologia/act/asignaciones/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getAsignacionesACT($pacienteId);
}, ['auth']);

route('POST', '/api/neuropsicologia/act/asignar', function() {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new NeuropsicologiaController();
    $controller->asignarHerramientaACT($data);
}, ['auth']);

route('DELETE', '/api/neuropsicologia/act/asignaciones/(\d+)', function($asignacionId) {
    $controller = new NeuropsicologiaController();
    $controller->eliminarAsignacionACT($asignacionId);
}, ['auth']);

route('PUT', '/api/neuropsicologia/act/asignaciones/(\d+)/completar', function($asignacionId) {
    $controller = new NeuropsicologiaController();
    $controller->completarAsignacionACT($asignacionId);
}, ['auth']);

route('PUT', '/api/neuropsicologia/act/asignaciones/(\d+)/estado', function($asignacionId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new NeuropsicologiaController();
    $controller->cambiarEstadoAsignacionACT($asignacionId, $data);
}, ['auth']);

// Evaluación neuropsicológica (perfil cognitivo)
route('GET', '/api/neuropsicologia/evaluacion/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getEvaluacion($pacienteId);
}, ['auth']);

route('GET', '/api/neuropsicologia/evaluacion/historial/(\d+)', function($pacienteId) {
    $controller = new NeuropsicologiaController();
    $controller->getHistorialEvaluaciones($pacienteId);
}, ['auth']);

route('POST', '/api/neuropsicologia/evaluacion', function() {
    $controller = new NeuropsicologiaController();
    $controller->guardarEvaluacion(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// ===== RUTAS DE PRÓTESIS Y ÓRTESIS =====

// Contenido educativo completo (niveles K, tipos, guías, FAQs)
route('GET', '/api/protesis/educativo', function() {
    $controller = new OrtesisController();
    $controller->getContenidoEducativo();
}, ['auth']);

// Niveles K
route('GET', '/api/protesis/niveles-k', function() {
    $controller = new OrtesisController();
    $controller->getNivelesK();
}, ['auth']);

route('GET', '/api/protesis/niveles-k/([A-Za-z0-9]+)', function($nivel) {
    $controller = new OrtesisController();
    $controller->getNivelK($nivel);
}, ['auth']);

// Tipos de Prótesis
route('GET', '/api/protesis/tipos', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getTiposProtesis($categoria);
}, ['auth']);

route('GET', '/api/protesis/tipos/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->getTipoProtesis($id);
}, ['auth']);

route('GET', '/api/protesis/categorias', function() {
    $controller = new OrtesisController();
    $controller->getCategoriasProtesis();
}, ['auth']);

// Guías de Cuidado
route('GET', '/api/protesis/guias', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getGuias($categoria);
}, ['auth']);

route('GET', '/api/protesis/guias/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->getGuia($id);
}, ['auth']);

route('GET', '/api/protesis/guias/categorias', function() {
    $controller = new OrtesisController();
    $controller->getCategoriasGuias();
}, ['auth']);

// FAQs de Prótesis
route('GET', '/api/protesis/faqs', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getFAQs($categoria);
}, ['auth']);

// Videos Educativos
route('GET', '/api/protesis/videos', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getVideos($categoria);
}, ['auth']);

// Dispositivo del paciente
route('GET', '/api/ortesis/dispositivo/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getDispositivo($pacienteId);
}, ['auth']);

route('PUT', '/api/ortesis/dispositivo/(\d+)/nivel-k', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->actualizarNivelK($pacienteId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Checklist de prótesis
route('GET', '/api/ortesis/checklist/(\d+)/([0-9-]+)', function($pacienteId, $fecha) {
    $controller = new OrtesisController();
    $controller->getChecklist($pacienteId, $fecha);
}, ['auth']);

// Problemas reportados
route('GET', '/api/ortesis/problemas/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getProblemas($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/problemas', function() {
    $controller = new OrtesisController();
    $controller->reportarProblema(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Ajustes realizados
route('GET', '/api/ortesis/ajustes/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getAjustes($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/ajustes/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->crearAjuste($pacienteId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Resolver problema reportado
route('PUT', '/api/ortesis/problemas/(\d+)/resolver', function($problemaId) {
    $controller = new OrtesisController();
    $controller->resolverProblema($problemaId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Historial de checklist
route('GET', '/api/ortesis/checklist/historial/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getChecklistHistorial($pacienteId);
}, ['auth']);

// Mantener compatibilidad con rutas antiguas
route('GET', '/api/ortesis/guias', function() {
    $controller = new OrtesisController();
    $controller->getGuias();
}, ['auth']);

// Mediciones del muñón
route('GET', '/api/ortesis/mediciones-munon/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getMedicionesMunon($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/mediciones-munon/(\d+)', function($pacienteId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new OrtesisController();
    $controller->crearMedicionMunon($pacienteId, $data);
}, ['auth']);

// Protocolo de uso progresivo
route('GET', '/api/ortesis/protocolo-uso/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getProtocoloUsoRegistros($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/protocolo-uso/(\d+)', function($pacienteId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new OrtesisController();
    $controller->crearRegistroUso($pacienteId, $data);
}, ['auth']);

route('GET', '/api/ortesis/protocolo-uso/(\d+)/config', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getProtocoloConfig($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/protocolo-uso/(\d+)/config', function($pacienteId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new OrtesisController();
    $controller->guardarProtocoloConfig($pacienteId, $data);
}, ['auth']);

// RUTAS DE CITAS
route('GET', '/api/citas', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new CitasController();
    $controller->getMisCitas($user['id'], $user['rol']);
}, ['auth']);

route('POST', '/api/citas', function() {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new CitasController();
    $controller->agendarCita($data);
}, ['auth']);

// RUTAS DE CHAT
route('GET', '/api/chat/conversaciones', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new ChatController();
    $controller->getConversaciones($user['id'], $user['rol']);
}, ['auth']);

route('POST', '/api/chat/mensajes', function() {
    $controller = new ChatController();
    $controller->enviarMensaje(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// RUTAS DE RECORDATORIOS
route('GET', '/api/recordatorios/(\d+)', function($pacienteId) {
    $controller = new RecordatoriosController();
    $controller->getRecordatorios($pacienteId);
}, ['auth']);

route('POST', '/api/recordatorios', function() {
    $controller = new RecordatoriosController();
    $controller->crearRecordatorio(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/recordatorios/(\d+)', function($id) {
    $controller = new RecordatoriosController();
    $controller->actualizarRecordatorio($id, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('DELETE', '/api/recordatorios/(\d+)', function($id) {
    $controller = new RecordatoriosController();
    $controller->eliminarRecordatorio($id);
}, ['auth']);

// RUTAS DE FAQs
route('GET', '/api/faqs', function() {
    $controller = new FAQController();
    $controller->getFAQs();
}, ['auth']);

// RUTAS DE BLOG
route('GET', '/api/blog/articulos', function() {
    $controller = new BlogController();
    $controller->getArticulos();
}, ['auth']);

route('GET', '/api/blog/articulos/(\d+)', function($id) {
    $controller = new BlogController();
    $controller->getArticulo($id);
}, ['auth']);

route('POST', '/api/blog/articulos/(\d+)/like', function($id) {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new BlogController();
    $controller->toggleLike($id, $user['id']);
}, ['auth']);

route('GET', '/api/blog/articulos/(\d+)/comentarios', function($id) {
    $controller = new BlogController();
    $controller->getComentarios($id);
}, ['auth']);

route('POST', '/api/blog/articulos/(\d+)/comentarios', function($id) {
    $user = AuthMiddleware::getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    $data['articulo_id'] = $id;
    $data['usuario_id'] = $user['id'];
    // Frontend envía 'texto', backend espera 'contenido'
    if (isset($data['texto']) && !isset($data['contenido'])) {
        $data['contenido'] = $data['texto'];
    }
    $controller = new BlogController();
    $controller->crearComentario($data);
}, ['auth']);

// RUTAS DE COMUNIDAD
route('GET', '/api/comunidad/feed', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new ComunidadController();
    $controller->getFeed($user['id']);
}, ['auth']);

route('POST', '/api/comunidad/publicaciones', function() {
    $user = AuthMiddleware::getCurrentUser();
    $data = array_merge($_POST, $_FILES);
    $data['usuario_id'] = $user['id'];
    $controller = new ComunidadController();
    $controller->crearPublicacion($data);
}, ['auth']);

route('GET', '/api/comunidad/publicaciones/(\d+)', function($id) {
    $controller = new ComunidadController();
    $controller->getPublicacion($id);
}, ['auth']);

route('POST', '/api/comunidad/publicaciones/(\d+)/like', function($id) {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new ComunidadController();
    $controller->reaccionar([
        'usuario_id' => $user['id'],
        'publicacion_id' => $id,
        'tipo_reaccion' => 'me_gusta'
    ]);
}, ['auth']);

route('GET', '/api/comunidad/publicaciones/(\d+)/comentarios', function($id) {
    $controller = new ComunidadController();
    $controller->getComentarios($id);
}, ['auth']);

route('POST', '/api/comunidad/publicaciones/(\d+)/comentarios', function($id) {
    $user = AuthMiddleware::getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    $data['publicacion_id'] = $id;
    $data['usuario_id'] = $user['id'];
    // Frontend envía 'texto', backend espera 'contenido'
    if (isset($data['texto']) && !isset($data['contenido'])) {
        $data['contenido'] = $data['texto'];
    }
    $controller = new ComunidadController();
    $controller->crearComentario($data);
}, ['auth']);

route('POST', '/api/comunidad/reportar', function() {
    $user = AuthMiddleware::getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    $data['usuario_id'] = $user['id'];
    $controller = new ComunidadController();
    $controller->reportarContenido($data);
}, ['auth']);

// Eliminar comentario
route('DELETE', '/api/comunidad/comentarios/(\d+)', function($id) {
    $controller = new ComunidadController();
    $controller->eliminarComentario($id);
}, ['auth']);

// Reacciones de una publicacion
route('GET', '/api/comunidad/publicaciones/(\d+)/reacciones', function($id) {
    $controller = new ComunidadController();
    $controller->getReacciones($id);
}, ['auth']);

// Reaccion con tipo especifico
route('POST', '/api/comunidad/publicaciones/(\d+)/reaccion', function($id) {
    $user = AuthMiddleware::getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new ComunidadController();
    $controller->reaccionar([
        'usuario_id' => $user['id'],
        'publicacion_id' => $id,
        'tipo_reaccion' => $data['tipo_reaccion'] ?? 'me_gusta'
    ]);
}, ['auth']);

// Temas de comunidad
route('GET', '/api/comunidad/temas', function() {
    $db = \App\Services\DatabaseService::getInstance();
    $temas = $db->query("SELECT * FROM temas_comunidad WHERE activo = 1 ORDER BY orden")->fetchAll();
    \App\Utils\Response::success($temas);
}, ['auth']);

// ===== RUTAS DE ADMINISTRACIÓN =====
route('GET', '/api/admin/metricas', function() {
    $controller = new AdminController();
    $controller->getMetricas();
}, ['auth', 'role:administrador']);

route('GET', '/api/admin/usuarios', function() {
    $controller = new AdminController();
    $controller->getUsuarios();
}, ['auth', 'role:administrador']);

route('POST', '/api/admin/usuarios', function() {
    $controller = new AdminController();
    $controller->createUsuario(json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('PUT', '/api/admin/usuarios/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->updateUsuario($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('DELETE', '/api/admin/usuarios/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->deleteUsuario($id);
}, ['auth', 'role:administrador']);

route('PUT', '/api/admin/usuarios/(\d+)/toggle', function($id) {
    $controller = new AdminController();
    $controller->toggleUsuarioActivo($id);
}, ['auth', 'role:administrador']);

route('GET', '/api/admin/especialistas', function() {
    $controller = new AdminController();
    $controller->getEspecialistas();
}, ['auth', 'role:administrador']);

route('PUT', '/api/admin/especialistas/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->updateUsuario($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('DELETE', '/api/admin/especialistas/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->deleteUsuario($id);
}, ['auth', 'role:administrador']);

// Asignaciones especialista-paciente (gestión admin)
route('GET', '/api/admin/pacientes', function() {
    $controller = new AdminController();
    $controller->getPacientes();
}, ['auth', 'role:administrador']);

route('GET', '/api/admin/especialistas/(\d+)/asignaciones', function($especialistaId) {
    $controller = new AdminController();
    $controller->getAsignacionesEspecialista($especialistaId);
}, ['auth', 'role:administrador']);

route('POST', '/api/admin/asignaciones', function() {
    $controller = new AdminController();
    $controller->crearAsignacion(json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('DELETE', '/api/admin/asignaciones/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->eliminarAsignacion($id);
}, ['auth', 'role:administrador']);

route('GET', '/api/admin/blogs/metricas', function() {
    $controller = new AdminController();
    $controller->getBlogMetricas();
}, ['auth', 'role:administrador']);

route('GET', '/api/admin/faqs', function() {
    $controller = new AdminController();
    $controller->getFAQs();
}, ['auth', 'role:administrador']);

route('POST', '/api/admin/faqs', function() {
    $controller = new AdminController();
    $controller->createFAQ(json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('PUT', '/api/admin/faqs/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->updateFAQ($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

route('DELETE', '/api/admin/faqs/(\d+)', function($id) {
    $controller = new AdminController();
    $controller->deleteFAQ($id);
}, ['auth', 'role:administrador']);

// ===== RUTAS DE ESPECIALISTAS =====

// Lista de todos los especialistas activos
route('GET', '/api/especialistas', function() {
    $controller = new EspecialistaController();
    $controller->getEspecialistasActivos();
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/citas-hoy', function($id) {
    $controller = new EspecialistaController();
    $controller->getCitasHoy($id);
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/pacientes', function($id) {
    $controller = new EspecialistaController();
    $controller->getPacientes($id);
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/pacientes/(\d+)', function($especialistaId, $pacienteId) {
    $controller = new EspecialistaController();
    $controller->getPacienteDetalle($especialistaId, $pacienteId);
}, ['auth']);

route('PUT', '/api/especialistas/(\d+)/pacientes/(\d+)/seguimiento', function($especialistaId, $pacienteId) {
    $controller = new EspecialistaController();
    $controller->actualizarSeguimiento($especialistaId, $pacienteId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/dashboard', function($id) {
    $controller = new EspecialistaController();
    $controller->getDashboardResumen($id);
}, ['auth']);

// ===== RUTAS DE MENSAJES =====
route('GET', '/api/mensajes/no-leidos/(\d+)', function($userId) {
    $controller = new MensajesController();
    $controller->getNoLeidos($userId);
}, ['auth']);

route('GET', '/api/mensajes/conversaciones/(\d+)', function($userId) {
    $controller = new MensajesController();
    $controller->getConversaciones($userId);
}, ['auth']);

route('GET', '/api/mensajes/conversacion/(\d+)/(\d+)', function($conversacionId, $userId) {
    $controller = new MensajesController();
    $controller->getMensajes($conversacionId, $userId);
}, ['auth']);

route('POST', '/api/mensajes/enviar', function() {
    $controller = new MensajesController();
    $controller->enviarMensaje(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('POST', '/api/mensajes/iniciar/(\d+)/(\d+)', function($userId, $otroUsuarioId) {
    $controller = new MensajesController();
    $controller->iniciarConversacion($userId, $otroUsuarioId);
}, ['auth']);

// ===== RUTAS DE CITAS PARA ESPECIALISTA =====
route('GET', '/api/citas/tipos', function() {
    $controller = new CitasController();
    $controller->getTiposCita();
}, ['auth']);

route('GET', '/api/citas/horarios/(\d+)/([0-9-]+)', function($especialistaId, $fecha) {
    $controller = new CitasController();
    $controller->getHorariosDisponibles($especialistaId, $fecha);
}, ['auth']);

route('GET', '/api/citas/especialista/(\d+)', function($especialistaId) {
    $controller = new CitasController();
    $controller->getCitasEspecialistaFecha($especialistaId, $_GET['fecha'] ?? null);
}, ['auth']);

route('POST', '/api/citas/especialista', function() {
    $controller = new CitasController();
    $controller->crearCitaEspecialista(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/citas/(\d+)/estado', function($citaId) {
    $controller = new CitasController();
    $controller->actualizarEstadoCita($citaId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/citas/(\d+)/notas', function($citaId) {
    $controller = new CitasController();
    $controller->agregarNotasCita($citaId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/citas/(\d+)/cancelar', function($citaId) {
    $controller = new CitasController();
    $controller->cancelarCita($citaId, ['motivo_cancelacion' => 'Cancelada por usuario']);
}, ['auth']);

// ===== RUTAS DE INTEGRACIÓN CON OUTLOOK =====
use App\Controllers\OutlookCalendarController;

// Verificar estado de configuración de Microsoft
route('GET', '/api/outlook/status', function() {
    $controller = new OutlookCalendarController();
    $controller->checkStatus();
}, ['auth']);

// Verificar si el usuario tiene Outlook conectado
route('GET', '/api/outlook/connected', function() {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->isConnected($user['id']);
}, ['auth']);

// Iniciar flujo de autorización OAuth con Microsoft
route('GET', '/api/outlook/auth', function() {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->startAuth($user['id']);
}, ['auth']);

// Callback de autorización OAuth (sin auth porque viene de Microsoft)
route('GET', '/api/auth/microsoft/callback', function() {
    $controller = new OutlookCalendarController();
    $controller->handleCallback();
});

// Desconectar cuenta de Outlook
route('DELETE', '/api/outlook/disconnect', function() {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->disconnect($user['id']);
}, ['auth']);

// Sincronizar cita con Outlook
route('POST', '/api/outlook/sync/(\d+)', function($citaId) {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->syncCitaToOutlook($user['id'], $citaId);
}, ['auth']);

// Obtener eventos de Outlook
route('GET', '/api/outlook/events', function() {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $startDate = $_GET['start'] ?? date('Y-m-d\T00:00:00');
    $endDate = $_GET['end'] ?? date('Y-m-d\T23:59:59', strtotime('+30 days'));
    $controller = new OutlookCalendarController();
    $controller->getOutlookEvents($user['id'], $startDate, $endDate);
}, ['auth']);

// Obtener disponibilidad de calendario
route('POST', '/api/outlook/availability', function() {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    $controller = new OutlookCalendarController();
    $controller->getAvailability($user['id'], $data);
}, ['auth']);

// Actualizar evento en Outlook
route('PUT', '/api/outlook/sync/(\d+)', function($citaId) {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->updateOutlookEvent($user['id'], $citaId);
}, ['auth']);

// Eliminar evento de Outlook
route('DELETE', '/api/outlook/sync/(\d+)', function($citaId) {
    $user = \App\Middleware\AuthMiddleware::getCurrentUser();
    $controller = new OutlookCalendarController();
    $controller->deleteOutlookEvent($user['id'], $citaId);
}, ['auth']);

// ===== RUTAS DE ANTROPOMETRÍA (Nutrición Especialista) =====
use App\Controllers\AntropometriaController;

route('POST', '/api/nutricion/antropometria/(\d+)', function($pacienteId) {
    $controller = new AntropometriaController();
    $controller->registrarMedicion($pacienteId);
}, ['auth']);

route('GET', '/api/nutricion/antropometria/(\d+)', function($pacienteId) {
    $controller = new AntropometriaController();
    $controller->getMediciones($pacienteId);
}, ['auth']);

route('GET', '/api/nutricion/antropometria/(\d+)/ultima', function($pacienteId) {
    $controller = new AntropometriaController();
    $controller->getUltimaMedicion($pacienteId);
}, ['auth']);

route('GET', '/api/nutricion/antropometria/(\d+)/peso', function($pacienteId) {
    $controller = new AntropometriaController();
    $controller->getEvolucionPeso($pacienteId);
}, ['auth']);

route('DELETE', '/api/nutricion/antropometria/medicion/(\d+)', function($id) {
    $controller = new AntropometriaController();
    $controller->eliminarMedicion($id);
}, ['auth']);

// ===== RUTAS DE CATÁLOGO DE RECETAS (Generador de Planes) =====
use App\Controllers\RecetaController;
use App\Controllers\GeneradorPlanController;

// CRUD Recetas del catálogo
route('GET', '/api/nutricion/recetas/catalogo', function() {
    $controller = new RecetaController();
    $controller->getRecetas();
}, ['auth']);

route('GET', '/api/nutricion/recetas/catalogo/(\d+)', function($id) {
    $controller = new RecetaController();
    $controller->getReceta($id);
}, ['auth']);

route('POST', '/api/nutricion/recetas/catalogo', function() {
    $controller = new RecetaController();
    $controller->crearReceta();
}, ['auth']);

route('PUT', '/api/nutricion/recetas/catalogo/(\d+)', function($id) {
    $controller = new RecetaController();
    $controller->actualizarReceta($id);
}, ['auth']);

// POST con ID para actualizar (FormData con archivos no soporta PUT en todos los servidores)
route('POST', '/api/nutricion/recetas/catalogo/(\d+)', function($id) {
    $controller = new RecetaController();
    $controller->actualizarReceta($id);
}, ['auth']);

route('DELETE', '/api/nutricion/recetas/catalogo/(\d+)', function($id) {
    $controller = new RecetaController();
    $controller->eliminarReceta($id);
}, ['auth']);

// Recetas agrupadas por tipo de comida (para wizard)
route('GET', '/api/nutricion/recetas/por-tipo', function() {
    $controller = new RecetaController();
    $controller->getRecetasPorTipo();
}, ['auth']);

// Generador de Planes
route('POST', '/api/nutricion/planes/generar', function() {
    $controller = new GeneradorPlanController();
    $controller->crearPlanDesdeRecetas();
}, ['auth']);

route('GET', '/api/nutricion/planes/generado/(\d+)', function($planId) {
    $controller = new GeneradorPlanController();
    $controller->getPlanGenerado($planId);
}, ['auth']);

route('PUT', '/api/nutricion/planes/generado/(\d+)', function($planId) {
    $controller = new GeneradorPlanController();
    $controller->actualizarPlanGenerado($planId);
}, ['auth']);

// ===== RUTAS DE ESTUDIOS CLÍNICOS =====
route('POST', '/api/estudios', function() {
    $controller = new EspecialistaController();
    $controller->registrarEstudio(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// ===== RUTAS DE PLANES NUTRICIONALES =====
use App\Controllers\PlanNutricionalController;

// Obtener planes del especialista
route('GET', '/api/nutricion/planes/especialista/(\d+)', function($especialistaId) {
    $controller = new PlanNutricionalController();
    $controller->getPlanesEspecialista($especialistaId);
}, ['auth']);

// Subir PDF y crear plan
route('POST', '/api/nutricion/planes/upload/(\d+)', function($especialistaId) {
    $controller = new PlanNutricionalController();
    $controller->uploadPlan($especialistaId);
}, ['auth']);

// Obtener detalle de un plan
route('GET', '/api/nutricion/planes/(\d+)', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->getPlan($planId);
}, ['auth']);

// Actualizar contenido del plan
route('PUT', '/api/nutricion/planes/(\d+)', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->updatePlanContent($planId);
}, ['auth']);

// Eliminar plan
route('DELETE', '/api/nutricion/planes/(\d+)', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->deletePlan($planId);
}, ['auth']);

// Asignar plan a paciente
route('POST', '/api/nutricion/planes/(\d+)/asignar', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->asignarPlan($planId);
}, ['auth']);

// Obtener plan activo del paciente
route('GET', '/api/nutricion/plan-paciente/(\d+)', function($pacienteId) {
    $controller = new PlanNutricionalController();
    $controller->getPlanPaciente($pacienteId);
}, ['auth']);

// Registrar seguimiento del plan
route('POST', '/api/nutricion/plan-paciente/(\d+)/seguimiento', function($pacienteId) {
    $controller = new PlanNutricionalController();
    $controller->registrarSeguimiento($pacienteId);
}, ['auth']);

// Agregar recetas del catálogo a un plan
route('POST', '/api/nutricion/planes/(\d+)/recetas', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->addRecetasToPlan($planId);
}, ['auth']);

// Eliminar receta de un plan
route('DELETE', '/api/nutricion/planes/(\d+)/recetas/(\d+)', function($planId, $comidaId) {
    $controller = new PlanNutricionalController();
    $controller->removeRecetaFromPlan($planId, $comidaId);
}, ['auth']);

// Subir imagen al plan
route('POST', '/api/nutricion/planes/(\d+)/imagenes', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->uploadImagenPlan($planId);
}, ['auth']);

// Eliminar imagen del plan
route('DELETE', '/api/nutricion/planes/(\d+)/imagenes', function($planId) {
    $controller = new PlanNutricionalController();
    $controller->removeImagenPlan($planId);
}, ['auth']);

// ===== RUTAS DE EXPEDIENTE =====

// Resumen del expediente (glucosa, presion, animo, comida, citas del dia)
route('GET', '/api/expediente/resumen/(\d+)', function($pacienteId) {
    $controller = new ExpedienteController();
    $controller->getResumen($pacienteId);
}, ['auth']);

// Subir archivo al expediente (PDF, DOCX, DOC)
route('POST', '/api/expediente/archivos', function() {
    $data = array_merge($_POST, $_FILES);
    $controller = new ExpedienteController();
    $controller->subirArchivo($data);
}, ['auth']);

// Listar archivos del expediente
route('GET', '/api/expediente/archivos/(\d+)', function($pacienteId) {
    $controller = new ExpedienteController();
    $controller->getArchivos($pacienteId);
}, ['auth']);

// Eliminar archivo del expediente
route('DELETE', '/api/expediente/archivos/(\d+)', function($archivoId) {
    $controller = new ExpedienteController();
    $controller->eliminarArchivo($archivoId);
}, ['auth']);

// Descargar archivo del expediente
route('GET', '/api/expediente/archivos/(\d+)/descargar', function($archivoId) {
    $controller = new ExpedienteController();
    $controller->descargarArchivo($archivoId);
}, ['auth']);

// Generar link para compartir expediente
route('POST', '/api/expediente/compartir/(\d+)', function($pacienteId) {
    $controller = new ExpedienteController();
    $controller->compartirExpediente($pacienteId);
}, ['auth']);

// Ver expediente compartido (PUBLICO - sin auth)
route('GET', '/api/expediente/compartido/([a-f0-9]+)', function($token) {
    $controller = new ExpedienteController();
    $controller->getExpedienteCompartido($token);
});

// ===== RUTAS DE CONFIGURACIÓN =====

// Obtener configuracion completa del usuario
route('GET', '/api/configuracion', function() {
    $controller = new ConfiguracionController();
    $controller->getConfiguracion();
}, ['auth']);

// Guardar preferencias de notificaciones
route('PUT', '/api/configuracion/notificaciones', function() {
    $controller = new ConfiguracionController();
    $controller->guardarNotificaciones(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Guardar preferencias de privacidad
route('PUT', '/api/configuracion/privacidad', function() {
    $controller = new ConfiguracionController();
    $controller->guardarPrivacidad(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Cambiar contraseña
route('PUT', '/api/auth/cambiar-password', function() {
    $controller = new ConfiguracionController();
    $controller->cambiarPassword(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Cambiar PIN
route('PUT', '/api/auth/cambiar-pin', function() {
    $controller = new ConfiguracionController();
    $controller->cambiarPIN(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Eliminar dispositivo/sesion especifica
route('DELETE', '/api/auth/devices/(\d+)', function($dispositivoId) {
    $controller = new ConfiguracionController();
    $controller->eliminarDispositivo($dispositivoId);
}, ['auth']);

// Cerrar todas las sesiones excepto la actual
route('POST', '/api/auth/logout-all', function() {
    $controller = new ConfiguracionController();
    $controller->cerrarTodasSesiones();
}, ['auth']);

// ===== RUTAS DE AUTENTICACIÓN ADICIONALES =====

// Registro de usuario
route('POST', '/api/auth/register', function() {
    $controller = new AuthController();
    $controller->register(json_decode(file_get_contents('php://input'), true));
});

// Cerrar sesión en dispositivo específico
route('DELETE', '/api/auth/devices/(\d+)/logout', function($deviceId) {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new AuthController();
    $controller->logoutDevice($user['id'], $deviceId);
}, ['auth']);

// Cerrar sesión en todos los dispositivos
route('POST', '/api/auth/logout-all-devices', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new AuthController();
    $controller->logoutAllDevices($user['id']);
}, ['auth']);

// Completar onboarding
route('POST', '/api/auth/onboarding', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new AuthController();
    $controller->completeOnboarding($user['id']);
}, ['auth']);

// ===== RUTAS DE FASES ADICIONALES =====

// Cambiar fase de tratamiento
route('PUT', '/api/fases/cambiar/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->cambiarFase($pacienteId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Historial de cambios de fase
route('GET', '/api/fases/historial/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->getHistorialFases($pacienteId);
}, ['auth']);

// Dashboard de fases
route('GET', '/api/fases/dashboard/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->getDashboard($pacienteId);
}, ['auth']);

// ===== RUTAS DE FISIOTERAPIA ADICIONALES =====

// Crear video educativo (especialista/admin)
route('POST', '/api/fisioterapia/videos', function() {
    $controller = new FisioterapiaController();
    $controller->crearVideo(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Asignar video a paciente
route('POST', '/api/fisioterapia/videos/asignar/(\d+)/(\d+)', function($pacienteId, $videoId) {
    $controller = new FisioterapiaController();
    $controller->asignarVideo($pacienteId, $videoId);
}, ['auth']);

// ===== RUTAS DE BLOG ADICIONALES =====

// Crear artículo (admin)
route('POST', '/api/blog/articulos', function() {
    $controller = new BlogController();
    $controller->crearArticulo(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Actualizar artículo (admin)
route('PUT', '/api/blog/articulos/(\d+)', function($id) {
    $controller = new BlogController();
    $controller->actualizarArticulo($id, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Eliminar artículo (admin)
route('DELETE', '/api/blog/articulos/(\d+)', function($id) {
    $controller = new BlogController();
    $controller->eliminarArticulo($id);
}, ['auth']);

// ===== RUTAS DE COMUNIDAD ADICIONALES =====

// Actualizar publicación
route('PUT', '/api/comunidad/publicaciones/(\d+)', function($id) {
    $controller = new ComunidadController();
    $controller->actualizarPublicacion($id, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

// Eliminar publicación
route('DELETE', '/api/comunidad/publicaciones/(\d+)', function($id) {
    $controller = new ComunidadController();
    $controller->eliminarPublicacion($id);
}, ['auth']);

// ===== RUTAS DE ADMISIONES =====

// --- Públicas (sin auth) ---
// Crear solicitud de admisión (formulario público)
route('POST', '/api/admisiones/solicitud', function() {
    $controller = new AdmisionesController();
    $controller->crearSolicitud(json_decode(file_get_contents('php://input'), true));
});

// Subir documento por token (solicitante)
route('POST', '/api/admisiones/documentos/([a-f0-9]{64})', function($token) {
    $controller = new AdmisionesController();
    $controller->subirDocumentoPorToken($token);
});

// Ver documentos subidos por token
route('GET', '/api/admisiones/documentos/([a-f0-9]{64})', function($token) {
    $controller = new AdmisionesController();
    $controller->getDocumentosPorToken($token);
});

// Obtener documentos oficiales activos (público)
route('GET', '/api/admisiones/documentos-oficiales', function() {
    $controller = new AdmisionesController();
    $controller->getDocumentosOficiales();
});

// Descargar documento oficial por ID (público)
route('GET', '/api/admisiones/documentos-oficiales/(\d+)/descargar', function($id) {
    $controller = new AdmisionesController();
    $controller->descargarDocumentoOficial($id);
});

// Consultar estatus de solicitud (público)
route('POST', '/api/admisiones/estatus', function() {
    $controller = new AdmisionesController();
    $controller->consultarEstatus(json_decode(file_get_contents('php://input'), true));
});

// --- Admin (auth + role:administrador) ---
// Listar solicitudes con filtros
route('GET', '/api/admin/admisiones', function() {
    $controller = new AdmisionesController();
    $controller->getSolicitudes($_GET);
}, ['auth', 'role:administrador']);

// Detalle de solicitud
route('GET', '/api/admin/admisiones/(\d+)', function($id) {
    $controller = new AdmisionesController();
    $controller->getSolicitud($id);
}, ['auth', 'role:administrador']);

// Descargar/previsualizar documento de admisión
route('GET', '/api/admin/admisiones/documentos/(\d+)/ver', function($docId) {
    $controller = new AdmisionesController();
    $controller->descargarDocumentoAdmision($docId);
}, ['auth', 'role:administrador']);

// Actualizar estado
route('PUT', '/api/admin/admisiones/(\d+)/estado', function($id) {
    $controller = new AdmisionesController();
    $controller->actualizarEstado($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

// Generar token de documentos
route('POST', '/api/admin/admisiones/(\d+)/token-documentos', function($id) {
    $controller = new AdmisionesController();
    $controller->generarTokenDocumentos($id);
}, ['auth', 'role:administrador']);

// Marcar como pagado (confirma pago + genera link docs + envía email)
route('POST', '/api/admin/admisiones/(\d+)/pagado', function($id) {
    $controller = new AdmisionesController();
    $controller->marcarPagado($id);
}, ['auth', 'role:administrador']);

// Programar preconsulta
route('PUT', '/api/admin/admisiones/(\d+)/preconsulta', function($id) {
    $controller = new AdmisionesController();
    $controller->programarPreconsulta($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

// Admitir paciente
route('POST', '/api/admin/admisiones/(\d+)/admitir', function($id) {
    $controller = new AdmisionesController();
    $controller->admitirPaciente($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

// Rechazar solicitud
route('PUT', '/api/admin/admisiones/(\d+)/rechazar', function($id) {
    $controller = new AdmisionesController();
    $controller->rechazarSolicitud($id, json_decode(file_get_contents('php://input'), true));
}, ['auth', 'role:administrador']);

// Reporte semestral
route('GET', '/api/admin/admisiones/reportes/semestre', function() {
    $controller = new AdmisionesController();
    $controller->getReporteSemestral($_GET['semestre'] ?? null);
}, ['auth', 'role:administrador']);

// Subir documento oficial
route('POST', '/api/admin/documentos-oficiales', function() {
    $controller = new AdmisionesController();
    $controller->subirDocumentoOficial($_POST);
}, ['auth', 'role:administrador']);

// Eliminar documento oficial
route('DELETE', '/api/admin/documentos-oficiales/(\d+)', function($id) {
    $controller = new AdmisionesController();
    $controller->eliminarDocumentoOficial($id);
}, ['auth', 'role:administrador']);
