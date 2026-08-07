<?php

// Roles de usuario
define('ROLE_ADMIN', 'admin');
define('ROLE_ESPECIALISTA', 'especialista');
define('ROLE_PACIENTE', 'paciente');

// Fases de rehabilitación
define('FASE_PRECONSULTA', 1);
define('FASE_ADAPTACION_EJERCICIO', 2);
define('FASE_PREPROTESICA', 3);
define('FASE_PROTESICA', 4);
define('FASE_POSPROTESICA', 5);
define('FASE_ALTA_GRADUACION', 6);
define('FASE_SEGUIMIENTO_6_MESES', 7);
define('FASE_SEGUIMIENTO_12_MESES', 8);

// Estados de citas
define('CITA_PENDIENTE', 'pendiente');
define('CITA_CONFIRMADA', 'confirmada');
define('CITA_COMPLETADA', 'completada');
define('CITA_CANCELADA', 'cancelada');

// Especialidades
define('ESPECIALIDAD_NUTRICION', 'nutricion');
define('ESPECIALIDAD_MEDICINA', 'medicina');
define('ESPECIALIDAD_FISIOTERAPIA', 'fisioterapia');
define('ESPECIALIDAD_NEUROPSICOLOGIA', 'neuropsicologia');
define('ESPECIALIDAD_ORTESIS', 'ortesis');

// Estados de contenido comunidad
define('CONTENIDO_PENDIENTE', 'pendiente');
define('CONTENIDO_APROBADO', 'aprobado');
define('CONTENIDO_RECHAZADO', 'rechazado');

// Tipos de notificación
define('NOTIF_CITA', 'cita');
define('NOTIF_RECORDATORIO', 'recordatorio');
define('NOTIF_MENSAJE', 'mensaje');
define('NOTIF_ALERTA', 'alerta');
define('NOTIF_SISTEMA', 'sistema');
define('NOTIF_NEURO_FASE', 'neuro_fase_cambio');
define('NOTIF_ORTESIS_FASE', 'ortesis_fase_cambio');

// Fases de tratamiento de Neuropsicología (1..4, propio del módulo,
// independiente de FASE_PREOPERATORIA/etc. que son del proceso protésico)
define('NEURO_FASES', [
    1 => 'Consulta inicial',
    2 => 'Evaluación',
    3 => 'Intervención',
    4 => 'Alta',
]);

// Fases del proceso de fabricación/adaptación de Órtesis y Prótesis (1..7),
// propio del módulo e independiente del sistema genérico de 8 fases de
// rehabilitación (fases_tratamiento / pacientes.fase_actual_id)
define('ORTESIS_FASES', [
    1 => 'Valoración',
    2 => 'Cotización',
    3 => 'Espera de componentes',
    4 => 'Toma de medidas / Molde',
    5 => 'Prueba y ajustes de órtesis',
    6 => 'Entrega de órtesis',
    7 => 'Seguimiento',
]);

// Tipos de reacción
define('REACCION_ME_GUSTA', 'me_gusta');
define('REACCION_APOYO', 'apoyo');
define('REACCION_GRACIAS', 'gracias');
define('REACCION_CELEBRAR', 'celebrar');

// Estados de animo
define('ANIMO_MUY_MAL', 1);
define('ANIMO_MAL', 2);
define('ANIMO_NEUTRAL', 3);
define('ANIMO_BIEN', 4);
define('ANIMO_MUY_BIEN', 5);

return [
    'roles' => [ROLE_ADMIN, ROLE_ESPECIALISTA, ROLE_PACIENTE],
    'fases' => [
        FASE_PRECONSULTA,
        FASE_ADAPTACION_EJERCICIO,
        FASE_PREPROTESICA,
        FASE_PROTESICA,
        FASE_POSPROTESICA,
        FASE_ALTA_GRADUACION,
        FASE_SEGUIMIENTO_6_MESES,
        FASE_SEGUIMIENTO_12_MESES
    ],
    'especialidades' => [
        ESPECIALIDAD_NUTRICION,
        ESPECIALIDAD_MEDICINA,
        ESPECIALIDAD_FISIOTERAPIA,
        ESPECIALIDAD_NEUROPSICOLOGIA,
        ESPECIALIDAD_ORTESIS
    ]
];
