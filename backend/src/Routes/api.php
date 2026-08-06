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
use App\Controllers\MensajesController;
use App\Controllers\RecordatoriosController;
use App\Controllers\FAQController;
use App\Controllers\BlogController;
use App\Controllers\ComunidadController;
use App\Controllers\DashboardController;
use App\Controllers\AdminController;
use App\Controllers\EspecialistaController;
use App\Controllers\ExpedienteController;
use App\Controllers\ConfiguracionController;
use App\Controllers\AdmisionesController;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Controllers\EquivalentesController;
use App\Controllers\ExternalPatientController;
use App\Controllers\IndicacionesController;
use App\Controllers\AlertasClinicasController;

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

// Datos clínicos y de perfil consumidos desde la aplicación externa.
route('GET', '/api/integracion/paciente/perfil', function() {
    $controller = new ExternalPatientController();
    $controller->getProfile(AuthMiddleware::getCurrentUser());
}, ['auth']);

route('PUT', '/api/integracion/paciente/perfil', function() {
    $controller = new ExternalPatientController();
    $controller->updateProfile(AuthMiddleware::getCurrentUser(), json_decode(file_get_contents('php://input'), true) ?? []);
}, ['auth']);

route('GET', '/api/integracion/neuro/citas', function() {
    $controller = new ExternalPatientController();
    $controller->getNeuroAppointments(AuthMiddleware::getCurrentUser());
}, ['auth']);

route('GET', '/api/integracion/neuro/documentos', function() {
    $controller = new ExternalPatientController();
    $controller->getNeuroDocuments(AuthMiddleware::getCurrentUser());
}, ['auth']);

route('GET', '/api/integracion/neuro/especialista', function() {
    $controller = new ExternalPatientController();
    $controller->getAssignedSpecialist(AuthMiddleware::getCurrentUser());
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

route('GET', '/api/fases/dashboard/(\d+)', function($pacienteId) {
    $controller = new FaseController();
    $controller->getDashboard($pacienteId);
}, ['auth']);

route('PUT', '/api/fases/cambiar/(\d+)', function($pacienteId) {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new FaseController();
    $controller->cambiarFase(
        $pacienteId,
        json_decode(file_get_contents('php://input'), true) ?? [],
        $user['id']
    );
}, ['auth', 'role:especialista']);

// RUTAS DE NUTRICIÓN
route('POST', '/api/guardar_porciones', function() {
    require_once __DIR__ . '/../Controllers/guardar_porciones.php';
}, ['auth']);

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

// RUTAS DE ANTROPOMETRÍA (seguimiento de peso)
route('GET', '/api/nutricion/antropometria/(\d+)', function($pacienteId) {
    $controller = new \App\Controllers\AntropometriaController();
    $controller->getMediciones($pacienteId);
}, ['auth']);

route('GET', '/api/nutricion/antropometria/(\d+)/peso', function($pacienteId) {
    $controller = new \App\Controllers\AntropometriaController();
    $controller->getEvolucionPeso($pacienteId);
}, ['auth']);

route('POST', '/api/nutricion/antropometria/(\d+)', function($pacienteId) {
    $controller = new \App\Controllers\AntropometriaController();
    $controller->registrarMedicion($pacienteId);
}, ['auth']);

route('DELETE', '/api/nutricion/antropometria/medicion/(\d+)', function($id) {
    $controller = new \App\Controllers\AntropometriaController();
    $controller->eliminarMedicion($id);
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

//nuevas rutas para indicaciones medicas

// Obtener pacientes registrados
route('GET', '/api/indicaciones/pacientes', function () {
    $controller = new IndicacionesController();
    $controller->obtenerPacientes();
}, ['auth']);


// Guardar una indicación
route('POST', '/api/indicaciones', function () {
    $controller = new IndicacionesController();
    $controller->guardar(json_decode(file_get_contents('php://input'), true));
}, ['auth']);


// Obtener indicaciones de un paciente
route('GET', '/api/indicaciones/paciente/(\d+)', function ($pacienteId) {
    $controller = new IndicacionesController();
    $controller->obtenerPorPaciente($pacienteId);
}, ['auth']);
//ruta eliminar indicacion
// Eliminar una indicación
route('DELETE', '/api/indicaciones/(\d+)', function ($id) {
    $controller = new IndicacionesController();
    $controller->eliminar($id);
}, ['auth']);

// ======================================================
// RUTAS DE ALERTAS CLÍNICAS
// ======================================================

// Obtener alertas por área
route('GET', '/api/alertas/([a-zA-Z_-]+)', function ($area) {

    $controller = new AlertasClinicasController();

    $controller->obtenerPorArea($area);

}, ['auth']);


// Marcar alerta como atendida
route('PUT', '/api/alertas/(\d+)/atender', function ($id) {

    $controller = new AlertasClinicasController();

    $controller->atender($id);

}, ['auth']);
// =============================
// RUTAS DE ESPECIALISTAS
// =============================

route('GET', '/api/especialistas/(\d+)/citas-hoy', function($especialistaId) {
    $controller = new EspecialistaController();
    $controller->getCitasHoy($especialistaId);
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/pacientes', function($especialistaId) {
    $controller = new EspecialistaController();
    $controller->getPacientes($especialistaId);
}, ['auth']);

route('GET', '/api/especialistas/(\d+)/pacientes/(\d+)', function($especialistaId, $pacienteId) {
    $controller = new EspecialistaController();
    $controller->getPacienteDetalle($especialistaId, $pacienteId);
}, ['auth']);

route('PUT', '/api/especialistas/(\d+)/pacientes/(\d+)/seguimiento', function($especialistaId, $pacienteId) {
    $controller = new EspecialistaController();
    $controller->actualizarSeguimiento(
        $especialistaId,
        $pacienteId,
        json_decode(file_get_contents('php://input'), true)
    );
}, ['auth']);

route('GET', '/api/especialistas/activos', function() {
    $controller = new EspecialistaController();
    $controller->getEspecialistasActivos();
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

route('GET', '/api/neuropsicologia/alertas', function() {
    $controller = new NeuropsicologiaController();
    $controller->getAlertas();
}, ['auth']);

route('PUT', '/api/neuropsicologia/alertas/(\d+)/atendida', function($alertaId) {
    $controller = new NeuropsicologiaController();
    $controller->marcarAlertaAtendida($alertaId);
}, ['auth']);

// Fases de tratamiento de Neuropsicología (Consulta inicial, Evaluación,
// Intervención, Alta) — sistema propio del módulo, separado del de /api/fases
route('GET', '/api/neuropsicologia/fases/(\d+)', function($pacienteId) {
    $controller = new \App\Controllers\NeuroFaseController();
    $controller->getFaseActual($pacienteId);
}, ['auth']);

route('GET', '/api/neuropsicologia/fases/(\d+)/historial', function($pacienteId) {
    $controller = new \App\Controllers\NeuroFaseController();
    $controller->getHistorial($pacienteId);
}, ['auth']);

route('PUT', '/api/neuropsicologia/fases/(\d+)', function($pacienteId) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $controller = new \App\Controllers\NeuroFaseController();
    $controller->cambiarFase($pacienteId, $data);
}, ['auth']);

// RUTAS DE NOTIFICACIONES (bandeja persistente, campanita del header)
route('GET', '/api/notificaciones', function() {
    $controller = new \App\Controllers\NotificacionesController();
    $controller->getMisNotificaciones();
}, ['auth']);

route('PUT', '/api/notificaciones/(\d+)/leida', function($id) {
    $controller = new \App\Controllers\NotificacionesController();
    $controller->marcarLeida($id);
}, ['auth']);

route('PUT', '/api/notificaciones/leer-todas', function() {
    $controller = new \App\Controllers\NotificacionesController();
    $controller->marcarTodasLeidas();
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

// Manual informativo, calzado autorizado, reportes directos y videotutoriales
route('GET', '/api/ortesis/manual-informativo', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getManualInformativo($categoria);
}, ['auth']);

route('GET', '/api/ortesis/calzado-autorizado/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->getCalzadoAutorizado($pacienteId);
}, ['auth']);

route('POST', '/api/ortesis/calzado-autorizado/(\d+)', function($pacienteId) {
    $controller = new OrtesisController();
    $controller->crearCalzadoAutorizado($pacienteId, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('POST', '/api/ortesis/reportes-molestias', function() {
    $controller = new OrtesisController();
    $controller->reportarMolestiaDirecta($_POST, $_FILES);
}, ['auth']);

route('GET', '/api/ortesis/videotutoriales-cuidados', function() {
    $categoria = $_GET['categoria'] ?? null;
    $controller = new OrtesisController();
    $controller->getVideotutorialesCuidados($categoria);
}, ['auth']);

route('GET', '/api/ortesis/especialista/contenido', function() {
    $controller = new OrtesisController();
    $controller->getContenidoGestionEspecialista();
}, ['auth']);

route('POST', '/api/ortesis/especialista/manuales', function() {
    $controller = new OrtesisController();
    $controller->crearManualEspecialista(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/ortesis/especialista/manuales/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->actualizarManualEspecialista($id, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('DELETE', '/api/ortesis/especialista/manuales/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->eliminarManualEspecialista($id);
}, ['auth']);

route('POST', '/api/ortesis/especialista/videos', function() {
    $controller = new OrtesisController();
    $controller->crearVideoEspecialista(json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('PUT', '/api/ortesis/especialista/videos/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->actualizarVideoEspecialista($id, json_decode(file_get_contents('php://input'), true));
}, ['auth']);

route('DELETE', '/api/ortesis/especialista/videos/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->eliminarVideoEspecialista($id);
}, ['auth']);

route('GET', '/api/ortesis/especialista/reportes-molestias', function() {
    $controller = new OrtesisController();
    $controller->getReportesMolestiasEspecialista();
}, ['auth']);

route('PUT', '/api/ortesis/especialista/reportes-molestias/(\d+)', function($id) {
    $controller = new OrtesisController();
    $controller->actualizarReporteMolestiaEspecialista($id, json_decode(file_get_contents('php://input'), true));
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
route('GET', '/api/mensajes/conversaciones/(\d+)', function($usuarioId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->getConversaciones($usuarioId);
}, ['auth']);

route('GET', '/api/mensajes/contactos/(\d+)', function($usuarioId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->getContactos($usuarioId);
}, ['auth']);

route('GET', '/api/mensajes/conversacion/(\d+)/(\d+)', function($conversacionId, $usuarioId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->getMensajes($conversacionId, $usuarioId);
}, ['auth']);

// Polling corto: solo mensajes con id mayor al último que ya tiene el
// frontend, en vez de volver a traer toda la conversación cada vez.
route('GET', '/api/mensajes/conversacion/(\d+)/(\d+)/nuevos/(\d+)', function($conversacionId, $usuarioId, $ultimoId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->getMensajesNuevos($conversacionId, $usuarioId, $ultimoId);
}, ['auth']);

route('POST', '/api/mensajes/iniciar/(\d+)/(\d+)', function($usuarioId, $otroUsuarioId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->iniciarConversacion($usuarioId, $otroUsuarioId);
}, ['auth']);

route('POST', '/api/mensajes/enviar', function() {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $user = AuthMiddleware::getCurrentUser();
    if ((int)($data['emisor_id'] ?? 0) !== (int)$user['id']) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->enviarMensaje($data);
}, ['auth']);

route('GET', '/api/mensajes/no-leidos/(\d+)', function($usuarioId) {
    $user = AuthMiddleware::getCurrentUser();
    if ((int)$user['id'] !== (int)$usuarioId) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->getNoLeidos($usuarioId);
}, ['auth']);

route('GET', '/api/chat/conversaciones', function() {
    $user = AuthMiddleware::getCurrentUser();
    $controller = new MensajesController();
    $controller->getConversaciones($user['id'], $user['rol']);
}, ['auth']);

route('POST', '/api/chat/mensajes', function() {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $user = AuthMiddleware::getCurrentUser();
    if ((int)($data['emisor_id'] ?? 0) !== (int)$user['id']) {
        \App\Utils\Response::error('No autorizado', 403);
    }
    (new MensajesController())->enviarMensaje($data);
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

route('PUT', '/api/comunidad/publicaciones/(\d+)', function($id) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $controller = new ComunidadController();
    $controller->actualizarPublicacion($id, $data);
}, ['auth']);

route('DELETE', '/api/comunidad/publicaciones/(\d+)', function($id) {
    $controller = new ComunidadController();
    $controller->eliminarPublicacion($id);
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

// Cola de moderación (publicaciones/reportes pendientes) — antes existían
// en el controller pero sin ruta, así que el contenido marcado como
// pendiente quedaba huérfano para siempre, sin forma de aprobarlo/rechazarlo.
route('GET', '/api/comunidad/moderacion/cola', function() {
    $controller = new ComunidadController();
    $controller->getColaModeracion();
}, ['auth', 'role:administrador']);

route('PUT', '/api/comunidad/moderacion/(publicacion|reporte)/(\d+)/aprobar', function($tipo, $id) {
    $controller = new ComunidadController();
    $controller->aprobarContenido($tipo, $id);
}, ['auth', 'role:administrador']);

route('PUT', '/api/comunidad/moderacion/(publicacion|reporte)/(\d+)/rechazar', function($tipo, $id) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $controller = new ComunidadController();
    $controller->rechazarContenido($tipo, $id, $data);
}, ['auth', 'role:administrador']);

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
    $controller->toggleUsuarioEstado($id);
}, ['auth', 'role:administrador']);

route('GET', '/api/nutricion/plan-paciente/(\d+)', function($id) {
    $controller = new \App\Controllers\NutricionController();
    $controller->obtenerPlanPaciente($id);
}, ['auth']);
