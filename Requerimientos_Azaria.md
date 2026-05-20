# REQUERIMIENTOS FUNCIONALES Y NO FUNCIONALES
# Plataforma Azaria - Sistema de Adherencia Terapéutica en Rehabilitación Protésica

**Versión:** 1.0
**Fecha:** Abril 2026
**Autora:** Mariana Hernández Dimas

---

## Índice

1. Requerimientos Funcionales
   - RF-01 a RF-07: Autenticación y Gestión de Usuarios
   - RF-08 a RF-16: Módulo de Nutrición
   - RF-17 a RF-25: Módulo de Medicina
   - RF-26 a RF-32: Módulo de Fisioterapia
   - RF-33 a RF-41: Módulo de Neuropsicología
   - RF-42 a RF-52: Módulo de Ortesis
   - RF-53 a RF-60: Módulo de Citas
   - RF-61 a RF-68: Módulo de Chat/Mensajes
   - RF-69 a RF-76: Módulo de Comunidad
   - RF-77 a RF-82: Módulo de Blog
   - RF-83 a RF-89: Módulo de Recordatorios
   - RF-90 a RF-96: Módulo de Configuración
   - RF-97 a RF-103: Módulo de Expediente Clínico
   - RF-104 a RF-113: Sistema de Admisiones
   - RF-114 a RF-118: Módulo de Fases
   - RF-119 a RF-121: Módulo de FAQs
   - RF-122 a RF-130: Panel de Administración
   - RF-131 a RF-140: Dashboard del Especialista
   - RF-141 a RF-145: Dashboard del Paciente
   - RF-146 a RF-149: Perfil de Usuario
2. Requerimientos No Funcionales

---

## 1. REQUERIMIENTOS FUNCIONALES

### Autenticación y Gestión de Usuarios

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-01 | El sistema debe permitir el inicio de sesión mediante correo electrónico o teléfono y contraseña. | Alta | Implementado |
| RF-02 | El sistema debe generar tokens de sesión HMAC-SHA256 con expiración configurable (24 horas estándar, 30 días con opción "recordarme"). | Alta | Implementado |
| RF-03 | El sistema debe soportar autenticación por PIN numérico (4-6 dígitos) como método alternativo de acceso. | Media | Implementado |
| RF-04 | El sistema debe implementar un flujo de recuperación de contraseña mediante código de verificación enviado por correo electrónico. | Alta | Implementado |
| RF-05 | El sistema debe permitir al usuario gestionar sus dispositivos de confianza y cerrar sesiones activas de forma individual o masiva. | Media | Implementado |
| RF-06 | El sistema debe redirigir automáticamente al dashboard correspondiente según el rol del usuario (paciente, especialista, administrador) tras el inicio de sesión. | Alta | Implementado |
| RF-07 | El sistema debe invalidar automáticamente la sesión del usuario y redirigirlo a la pantalla de login cuando el token expire o sea inválido (código HTTP 401). | Alta | Implementado |

---

### Módulo de Nutrición

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-08 | El sistema debe permitir al paciente registrar comidas diarias (desayuno, almuerzo, merienda, cena) con detalle de calorías, proteínas, carbohidratos y grasas. | Alta | Implementado |
| RF-09 | El sistema debe calcular y mostrar en tiempo real el resumen calórico diario (calorías consumidas vs. objetivo) y el desglose de macronutrientes. | Alta | Implementado |
| RF-10 | El sistema debe permitir al paciente registrar su consumo de agua diario con un contador de vasos (objetivo: 8 vasos diarios). | Media | Implementado |
| RF-11 | El sistema debe integrar una base de datos de alimentos mexicanos para búsqueda rápida al registrar comidas. | Media | Implementado |
| RF-12 | El sistema debe permitir al paciente consultar sus planes nutricionales asignados por el especialista, con detalle de recetas y porciones. | Alta | Implementado |
| RF-13 | El sistema debe permitir al paciente registrar su peso y visualizar su evolución en gráfica de tendencia. | Media | Implementado |
| RF-14 | El sistema debe calcular el Índice de Masa Corporal (IMC) del paciente a partir de su peso y estatura, mostrando la categoría correspondiente. | Media | Implementado |
| RF-15 | El sistema debe permitir al especialista generar planes nutricionales personalizados en formato PDF con distribución de macronutrientes y menús semanales. | Alta | Implementado |
| RF-16 | El sistema debe mantener un catálogo de recetas saludables asignables a pacientes, con ingredientes, instrucciones y valores nutricionales. | Media | Implementado |

---

### Módulo de Medicina

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-17 | El sistema debe permitir al paciente registrar mediciones de glucemia con fecha, hora y valor, y clasificarlas automáticamente (hipoglucemia, normal, hiperglucemia). | Alta | Implementado |
| RF-18 | El sistema debe permitir al paciente registrar mediciones de presión arterial (sistólica y diastólica) y clasificarlas según las guías de la AHA. | Alta | Implementado |
| RF-19 | El sistema debe permitir al paciente registrar episodios de dolor usando la Escala Visual Analógica (EVA 0-10) con ubicación anatómica. | Alta | Implementado |
| RF-20 | El sistema debe generar gráficas de tendencia para glucosa, presión arterial y dolor, permitiendo visualizar la evolución temporal de los indicadores. | Alta | Implementado |
| RF-21 | El sistema debe mostrar estadísticas de las bitácoras de salud: promedio, mínimo, máximo y conteo de registros. | Media | Implementado |
| RF-22 | El sistema debe permitir al paciente gestionar su lista de medicamentos activos con nombre comercial, genérico, dosis, vía de administración, frecuencia y horarios. | Alta | Implementado |
| RF-23 | El sistema debe permitir crear, editar y eliminar medicamentos, y filtrar entre medicamentos activos e inactivos. | Media | Implementado |
| RF-24 | El sistema debe generar alertas automáticas cuando los valores de glucosa, presión arterial o dolor excedan los umbrales configurados. | Alta | Implementado |
| RF-25 | El sistema debe permitir al paciente registrar valores de hemoglobina glicosilada (HbA1c) y visualizar su historial. | Media | Implementado |

---

### Módulo de Fisioterapia

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-26 | El sistema debe mostrar una biblioteca de videos de ejercicios con título, descripción, duración e indicador de fase. | Alta | Implementado |
| RF-27 | El sistema debe reproducir videos de ejercicios en un reproductor modal (YouTube embed) con descripción e instrucciones. | Alta | Implementado |
| RF-28 | El sistema debe permitir al paciente marcar ejercicios como completados y registrar su progreso diario. | Alta | Implementado |
| RF-29 | El sistema debe mostrar un resumen de progreso diario con porcentaje de completitud, ejercicios completados y calendario semanal (7 días). | Alta | Implementado |
| RF-30 | El sistema debe calcular y mostrar estadísticas semanales: total de ejercicios, racha de días consecutivos y promedio semanal. | Media | Implementado |
| RF-31 | El sistema debe permitir al especialista crear evaluaciones físicas del paciente (fuerza muscular, rango de movimiento, equilibrio, marcha). | Alta | Implementado |
| RF-32 | El sistema debe permitir al especialista crear, editar y gestionar planes de tratamiento personalizados con series, repeticiones y ejercicios asignados. | Alta | Implementado |

---

### Módulo de Neuropsicología

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-33 | El sistema debe permitir al paciente registrar su estado emocional diario mediante selección de emociones (emojis) con notas opcionales. | Alta | Implementado |
| RF-34 | El sistema debe mostrar el historial de estados emocionales con tendencias y gráficas de evolución. | Media | Implementado |
| RF-35 | El sistema debe implementar cuestionarios clínicos validados: PHQ-9 (depresión), GAD-7 (ansiedad) y AAQ-2 (flexibilidad psicológica). | Alta | Implementado |
| RF-36 | El sistema debe calcular automáticamente los puntajes de los cuestionarios clínicos y mostrar su interpretación. | Alta | Implementado |
| RF-37 | El sistema debe permitir al especialista crear cuestionarios personalizados con preguntas configurables y asignarlos a pacientes. | Media | Implementado |
| RF-38 | El sistema debe mostrar el historial de cuestionarios respondidos con resultados y puntajes previos. | Media | Implementado |
| RF-39 | El sistema debe implementar ejercicios interactivos de Terapia de Aceptación y Compromiso (ACT) con guía paso a paso y narración por voz. | Alta | Implementado |
| RF-40 | El sistema debe permitir al especialista asignar herramientas ACT específicas a pacientes y dar seguimiento a su completitud. | Alta | Implementado |
| RF-41 | El sistema debe registrar el historial de actividades ACT completadas por el paciente con fecha y detalle. | Media | Implementado |

---

### Módulo de Ortesis

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-42 | El sistema debe mostrar contenido educativo sobre niveles K (K0 a K4) con características, actividades permitidas y tipos de prótesis recomendados. | Alta | Implementado |
| RF-43 | El sistema debe mostrar un catálogo de tipos de prótesis organizados por categoría (transtibial, transfemoral, desarticulación de rodilla, pie parcial) con componentes, ventajas, consideraciones y nivel K mínimo. | Alta | Implementado |
| RF-44 | El sistema debe mostrar guías de cuidado categorizadas (muñón, limpieza, colocación, mantenimiento, emergencias, ejercicios) con instrucciones paso a paso, consejos y advertencias. | Alta | Implementado |
| RF-45 | El sistema debe mostrar la información del dispositivo del paciente: tipo, modelo, fecha de entrega, último mantenimiento, próximo mantenimiento y notas del especialista. | Alta | Implementado |
| RF-46 | El sistema debe permitir al paciente reportar problemas con su dispositivo, especificando tipo (dolor, ajuste, irritación, mecánico, limpieza, otro), descripción y nivel de urgencia (baja, media, alta). | Alta | Implementado |
| RF-47 | El sistema debe mostrar el historial de problemas reportados con su estado (pendiente, resuelto) y permitir al especialista marcarlos como resueltos. | Media | Implementado |
| RF-48 | El sistema debe registrar el historial de ajustes realizados al dispositivo por el especialista. | Media | Implementado |
| RF-49 | El sistema debe permitir al especialista registrar mediciones antropométricas del muñón con seguimiento de evolución. | Alta | Implementado |
| RF-50 | El sistema debe implementar un protocolo de uso progresivo del dispositivo con checklist diario configurable. | Alta | Implementado |
| RF-51 | El sistema debe registrar el seguimiento de adaptación del paciente al dispositivo (tolerancia, confort, funcionalidad). | Media | Implementado |
| RF-52 | El sistema debe mantener un calendario de mantenimiento preventivo del dispositivo con historial de ajustes. | Media | Implementado |

---

### Módulo de Citas

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-53 | El sistema debe mostrar las citas próximas del usuario (futuras, no canceladas) con fecha formateada, hora, especialista/paciente, área médica, motivo, tipo y estado. | Alta | Implementado |
| RF-54 | El sistema debe mostrar el historial de citas pasadas y completadas. | Media | Implementado |
| RF-55 | El sistema debe soportar tres tipos de cita: presencial, videollamada y telefónica, con iconografía diferenciada. | Alta | Implementado |
| RF-56 | El sistema debe manejar cinco estados de cita: programada, confirmada, completada, cancelada y reprogramada, con indicadores visuales por color. | Alta | Implementado |
| RF-57 | El sistema debe permitir al especialista crear nuevas citas seleccionando paciente, fecha (mínimo: mañana), hora (8:00-18:00 en intervalos de 30 minutos), tipo y motivo. | Alta | Implementado |
| RF-58 | El sistema debe permitir cancelar citas con confirmación previa. | Media | Implementado |
| RF-59 | El sistema debe mostrar un detalle expandido de cada cita incluyendo notas del especialista y enlace de videollamada cuando aplique. | Media | Implementado |
| RF-60 | El sistema debe integrarse con Microsoft Outlook mediante OAuth 2.0 para sincronización de citas con el calendario externo del especialista. | Baja | Implementado |

---

### Módulo de Chat/Mensajes

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-61 | El sistema debe mostrar una lista de conversaciones activas con avatar, nombre, rol, último mensaje (30 caracteres) y hora del último mensaje. | Alta | Implementado |
| RF-62 | El sistema debe mostrar un contador de mensajes no leídos por conversación. | Alta | Implementado |
| RF-63 | El sistema debe permitir al paciente iniciar conversaciones con los especialistas asignados a su caso, mostrando nombre y área médica. | Alta | Implementado |
| RF-64 | El sistema debe mostrar los mensajes agrupados por fecha con contenido, hora e indicador de lectura (✓ enviado, ✓✓ leído). | Alta | Implementado |
| RF-65 | El sistema debe implementar un temporizador de expiración de 24 horas por mensaje, mostrando el tiempo restante. | Media | Implementado |
| RF-66 | El sistema debe limitar los mensajes a 500 caracteres máximo con contador visible. | Media | Implementado |
| RF-67 | El sistema debe realizar polling cada 5 segundos para obtener mensajes nuevos. | Alta | Implementado |
| RF-68 | El sistema debe adaptar la interfaz del chat para dispositivos móviles (sidebar colapsable). | Media | Implementado |

---

### Módulo de Comunidad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-69 | El sistema debe permitir al usuario crear publicaciones seleccionando un tema (salud, nutrición, ejercicios, recuperación, mentalidad, general) con contenido de hasta 1,000 caracteres. | Alta | Implementado |
| RF-70 | El sistema debe permitir adjuntar una fotografía a las publicaciones con vista previa antes de publicar. | Media | Implementado |
| RF-71 | El sistema debe ofrecer la opción de publicar de forma anónima. | Media | Implementado |
| RF-72 | El sistema debe mostrar el feed de publicaciones con avatar, autor (o "Anónimo"), tiempo relativo (hace X minutos/horas/días), tema, contenido, imagen y contadores de reacciones y comentarios. | Alta | Implementado |
| RF-73 | El sistema debe soportar 5 tipos de reacciones: ❤️ Me gusta, 💪 Me inspira, 🤝 Me identifico, 🎉 Me motiva, 🙏 Apoyo, con posibilidad de activar/desactivar. | Alta | Implementado |
| RF-74 | El sistema debe permitir agregar comentarios a las publicaciones (máximo 500 caracteres) y mostrar la lista de comentarios con avatar, autor, fecha y contenido. | Alta | Implementado |
| RF-75 | El sistema debe permitir al autor editar y eliminar sus publicaciones. | Media | Implementado |
| RF-76 | El sistema debe permitir reportar contenido inapropiado. | Media | Implementado |

---

### Módulo de Blog

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-77 | El sistema debe mostrar artículos educativos en formato de tarjetas con imagen miniatura, etiqueta de área médica, título, extracto, autor, fecha y contadores de likes y comentarios. | Alta | Implementado |
| RF-78 | El sistema debe permitir filtrar artículos por área médica: fisioterapia, nutrición, medicina, neuropsicología y ortesis. | Media | Implementado |
| RF-79 | El sistema debe mostrar el detalle completo del artículo con encabezado, cuerpo, imagen y sección de interacción. | Alta | Implementado |
| RF-80 | El sistema debe permitir dar y quitar "like" a los artículos con actualización del contador. | Media | Implementado |
| RF-81 | El sistema debe permitir agregar comentarios a los artículos y mostrar la lista de comentarios con nombre de usuario, fecha y texto. | Media | Implementado |
| RF-82 | El sistema debe mostrar las fechas formateadas en formato legible (ej: "15 ene 2024"). | Baja | Implementado |

---

### Módulo de Recordatorios

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-83 | El sistema debe soportar 7 tipos de recordatorios: medicamento, ejercicio, cita médica, medición, hidratación, cuidado de prótesis y otro, cada uno con icono y color diferenciado. | Alta | Implementado |
| RF-84 | El sistema debe permitir crear recordatorios con título, descripción opcional, hora y días de la semana seleccionables. | Alta | Implementado |
| RF-85 | El sistema debe permitir filtrar recordatorios por tipo. | Media | Implementado |
| RF-86 | El sistema debe permitir activar y desactivar recordatorios individualmente mediante un switch. | Media | Implementado |
| RF-87 | El sistema debe enviar notificaciones del navegador (Web Notifications API) al momento programado del recordatorio. | Alta | Implementado |
| RF-88 | El sistema debe soportar alertas con sonido y vibración configurables. | Media | Implementado |
| RF-89 | El sistema debe verificar recordatorios activos cada 30 segundos y evitar duplicidad de notificaciones (una por día/hora). | Media | Implementado |

---

### Módulo de Configuración

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-90 | El sistema debe permitir configurar preferencias de notificación por categoría: medicamentos, ejercicios, citas, chat, blog, comunidad, sonido y vibración. | Media | Implementado |
| RF-91 | El sistema debe permitir configurar opciones de privacidad: perfil visible en comunidad, mostrar nombre real y permitir mensajes de otros pacientes. | Media | Implementado |
| RF-92 | El sistema debe permitir cambiar la contraseña verificando la contraseña actual y validando la nueva (mínimo 6 caracteres, confirmación). | Alta | Implementado |
| RF-93 | El sistema debe permitir cambiar el PIN de acceso (4-6 dígitos con confirmación). | Media | Implementado |
| RF-94 | El sistema debe mostrar la lista de dispositivos/sesiones activas con nombre del navegador, sistema operativo y última actividad. | Media | Implementado |
| RF-95 | El sistema debe permitir cerrar sesiones individuales o cerrar todas las sesiones excepto la actual. | Media | Implementado |
| RF-96 | El sistema debe permitir seleccionar el tema visual (claro/oscuro) y ajustar el tamaño del texto. | Media | Implementado |

---

### Módulo de Expediente Clínico

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-97 | El sistema debe mostrar un resumen del expediente con datos del paciente, edad, diagnóstico, fase actual y tratamientos activos. | Alta | Implementado |
| RF-98 | El sistema debe permitir subir documentos clínicos mediante drag-and-drop o selección de archivo, con validación de tipo (PDF, DOCX, DOC) y tamaño máximo (10 MB). | Alta | Implementado |
| RF-99 | El sistema debe categorizar los documentos subidos: análisis, diagnóstico, radiografía, entre otros, con campo de descripción y fecha de estudio. | Alta | Implementado |
| RF-100 | El sistema debe mostrar la lista de documentos del expediente con nombre, tipo, fecha de carga, y opciones de descarga y eliminación con confirmación. | Alta | Implementado |
| RF-101 | El sistema debe permitir al especialista generar un enlace temporal para compartir el expediente del paciente, con vigencia de 72 horas y token único. | Alta | Implementado |
| RF-102 | El sistema debe permitir el acceso público al expediente compartido mediante el enlace temporal, sin requerir autenticación, mostrando el tiempo restante de vigencia. | Alta | Implementado |
| RF-103 | El sistema debe permitir copiar el enlace de expediente compartido al portapapeles con un solo clic. | Baja | Implementado |

---

### Sistema de Admisiones

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-104 | El sistema debe proveer un formulario público de solicitud de admisión en 2 pasos: datos personales (nombre, teléfono, email, edad, sexo, ciudad, estado) y datos clínicos (tipo de servicio, tipo de amputación, causa, screening clínico). | Alta | Implementado |
| RF-105 | El sistema debe generar un folio automático (formato SOL-XXXXX) al registrar la solicitud y enviar un correo de confirmación al solicitante con enlace para consultar estatus. | Alta | Implementado |
| RF-106 | El sistema debe implementar un pipeline de admisiones de 6 etapas: solicitud recibida → screening → pago → documentos → preconsulta → admitido. | Alta | Implementado |
| RF-107 | El sistema debe permitir al administrador aprobar o rechazar solicitudes en la etapa de screening, enviando correo de notificación al solicitante. | Alta | Implementado |
| RF-108 | El sistema debe permitir al administrador marcar una solicitud como "pagada" ($500 MXN por preconsulta), generando automáticamente un token de subida de documentos con vigencia de 72 horas. | Alta | Implementado |
| RF-109 | El sistema debe permitir al solicitante subir documentos (estudios de laboratorio, radiografías, comprobante de domicilio) a través de un enlace temporal con token. | Alta | Implementado |
| RF-110 | El sistema debe permitir al administrador programar la preconsulta con fecha y hora, enviando correo con los detalles al solicitante. | Alta | Implementado |
| RF-111 | El sistema debe permitir al administrador admitir al paciente, generando automáticamente credenciales de acceso (usuario y contraseña temporal) y enviando correo de bienvenida. | Alta | Implementado |
| RF-112 | El sistema debe enviar correos electrónicos automáticos con plantillas HTML en cada transición del pipeline: solicitud recibida, screening aprobado, pago confirmado, documentos recibidos, preconsulta programada, admisión confirmada y rechazo. | Alta | Implementado |
| RF-113 | El sistema debe permitir al solicitante consultar el estatus de su solicitud ingresando su folio y correo electrónico o teléfono. | Media | Implementado |

---

### Módulo de Fases de Tratamiento

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-114 | El sistema debe mostrar la fase actual del paciente con nombre, número, icono y porcentaje de progreso general. | Alta | Implementado |
| RF-115 | El sistema debe mostrar una línea de tiempo de 4 fases (preoperatoria, postoperatoria, preprotésica, protésica) con estados visuales: completada (✓), en curso (resaltada), pendiente (atenuada). | Alta | Implementado |
| RF-116 | El sistema debe mostrar estadísticas del proceso: días en rehabilitación, fase actual (X/4) y número de cambios de fase. | Media | Implementado |
| RF-117 | El sistema debe mostrar el historial de cambios de fase con transición (Fase X → Fase Y), fecha, especialista responsable y motivo. | Media | Implementado |
| RF-118 | El sistema debe permitir al especialista cambiar la fase del paciente mediante un formulario con selección de nueva fase y motivo del cambio. | Alta | Implementado |

---

### Módulo de FAQs

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-119 | El sistema debe mostrar preguntas frecuentes en formato de acordeón expandible, con búsqueda por texto en pregunta y respuesta. | Alta | Implementado |
| RF-120 | El sistema debe permitir filtrar las FAQs por área: general, fisioterapia, nutrición, medicina, neuropsicología y ortesis/prótesis. | Media | Implementado |
| RF-121 | El sistema debe mostrar una sección de contacto con enlaces directos al chat y agendamiento de citas cuando no se encuentren resultados. | Baja | Implementado |

---

### Panel de Administración

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-122 | El sistema debe mostrar un dashboard con métricas generales: total de usuarios, pacientes activos, especialistas, citas del día, nuevos usuarios del mes, vistas del blog y porcentaje de engagement. | Alta | Implementado |
| RF-123 | El sistema debe permitir listar, crear, editar, eliminar y activar/desactivar usuarios con campos: nombre, email, contraseña, rol y área médica (para especialistas). | Alta | Implementado |
| RF-124 | El sistema debe permitir listar especialistas con nombre, email, área médica, cédula profesional, número de pacientes asignados y estado. | Alta | Implementado |
| RF-125 | El sistema debe permitir filtrar usuarios por rol. | Media | Implementado |
| RF-126 | El sistema debe integrar el módulo de admisiones con vista de solicitudes, acciones por etapa y reportes semestrales. | Alta | Implementado |
| RF-127 | El sistema debe permitir gestionar FAQs: listar, crear, editar, eliminar y categorizar por área médica. | Media | Implementado |
| RF-128 | El sistema debe incluir un módulo de moderación de comunidad para revisar publicaciones reportadas y eliminar contenido inapropiado. | Media | Implementado |
| RF-129 | El sistema debe generar reportes semestrales de admisiones con: total de solicitudes, preconsultas programadas, preconsultas asistidas, ingresos generados ($500 × preconsulta asistida), pacientes admitidos y tasa de admisión. | Alta | Implementado |
| RF-130 | El sistema debe mostrar la distribución de solicitudes por sexo, rango de edad y estado de procedencia. | Media | Implementado |

---

### Dashboard del Especialista

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-131 | El sistema debe mostrar un dashboard personalizado según el área médica del especialista, con módulos y herramientas específicas de su disciplina. | Alta | Implementado |
| RF-132 | El sistema debe permitir al especialista de fisioterapia gestionar: ejercicios de pacientes, evaluaciones físicas, planes de tratamiento y visualización de progreso. | Alta | Implementado |
| RF-133 | El sistema debe permitir al especialista de nutrición gestionar: planes nutricionales, seguimiento de peso, historial alimenticio, IMC, calculadora calórica, historial de planes, catálogo de recetas y generación de planes PDF. | Alta | Implementado |
| RF-134 | El sistema debe permitir al especialista de medicina gestionar: historial de consultas, signos vitales, estudios clínicos y recetas médicas con múltiples medicamentos. | Alta | Implementado |
| RF-135 | El sistema debe permitir al especialista de medicina crear recetas con múltiples medicamentos, cada uno con: nombre comercial, genérico, dosis, frecuencia, vía de administración, instrucciones especiales y rango de fechas. | Alta | Implementado |
| RF-136 | El sistema debe permitir al especialista de neuropsicología gestionar: evaluaciones neuropsicológicas, herramientas ACT y estado emocional de pacientes. | Alta | Implementado |
| RF-137 | El sistema debe permitir al especialista de ortesis gestionar: dispositivos, seguimiento de adaptación, mantenimiento/ajustes y mediciones del muñón. | Alta | Implementado |
| RF-138 | El sistema debe permitir al especialista seleccionar un paciente por módulo para visualizar y editar su información. | Alta | Implementado |
| RF-139 | El sistema debe proporcionar herramientas clínicas específicas por área: calculadora de ROM (fisioterapia), escala de dolor (fisioterapia), tabla de alimentos (nutrición), calculadora de dosis (medicina), CIE-10 (medicina). | Media | Implementado |
| RF-140 | El sistema debe integrar la sincronización con Outlook para especialistas de medicina, permitiendo ver citas en calendario externo. | Baja | Implementado |

---

### Dashboard del Paciente

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-141 | El sistema debe mostrar un dashboard con accesos directos a los módulos principales del sistema mediante tarjetas con icono y nombre del módulo. | Alta | Implementado |
| RF-142 | El sistema debe mostrar resúmenes del estado actual del paciente: fase de rehabilitación, próxima cita y recordatorios pendientes. | Alta | Implementado |
| RF-143 | El sistema debe adaptar la interfaz del dashboard para adultos mayores con tarjetas grandes, iconos prominentes y texto legible. | Alta | Implementado |
| RF-144 | El sistema debe mostrar notificaciones y alertas pendientes al paciente desde el dashboard. | Media | Implementado |
| RF-145 | El sistema debe permitir navegación rápida a cualquier módulo desde el dashboard. | Alta | Implementado |

---

### Perfil de Usuario

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-146 | El sistema debe mostrar la información del perfil del usuario: nombre, foto, correo, teléfono y rol. | Alta | Implementado |
| RF-147 | El sistema debe permitir editar los datos del perfil. | Alta | Implementado |
| RF-148 | El sistema debe permitir subir y actualizar la foto de perfil. | Media | Implementado |
| RF-149 | El sistema debe mostrar información del perfil en la navegación y en las vistas de chat y comunidad. | Media | Implementado |

---

## 2. REQUERIMIENTOS NO FUNCIONALES

### Accesibilidad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-01 | El sistema debe cumplir con las directrices WCAG 2.1 nivel AA, incluyendo etiquetas ARIA, navegación por teclado (Tab, Enter, Escape), gestión de foco y regiones live. | Alta | Implementado |
| RNF-02 | El sistema debe utilizar una tipografía base de 18 píxeles, configurable entre 14 y 24 píxeles, para facilitar la lectura por adultos mayores. | Alta | Implementado |
| RNF-03 | El sistema debe garantizar que todos los elementos interactivos (botones, enlaces, controles) tengan un área de toque mínima de 48×48 píxeles. | Alta | Implementado |
| RNF-04 | El sistema debe implementar un panel de accesibilidad con al menos 13 opciones configurables: tamaño de fuente (6 niveles), tema (claro/oscuro), alto contraste, modo de lectura, espaciado de texto, cursor aumentado, narrador de voz, reducción de animaciones, modo daltónico (3 tipos), subrayado de enlaces, foco visible, brillo y saturación. | Alta | Implementado |
| RNF-05 | El sistema debe implementar un asistente de voz (Text-to-Speech) en español mexicano que narre títulos de secciones, instrucciones de formularios y retroalimentación de acciones, usando la Web Speech API del navegador. | Alta | Implementado |
| RNF-06 | El sistema debe soportar perfiles de edad (joven-adulto, adulto, adulto mayor) que ajusten automáticamente el tamaño y complejidad de la interfaz. | Media | Implementado |
| RNF-07 | El sistema debe soportar modo de dislexia que aplique fuentes y espaciados especializados para mejorar la legibilidad. | Baja | Implementado |
| RNF-08 | Las configuraciones de accesibilidad deben persistir entre sesiones almacenándose en localStorage y aplicándose mediante atributos data-* en el DOM raíz. | Alta | Implementado |

### Usabilidad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-09 | La interfaz del sistema debe estar en idioma español (es-MX) en todos sus textos, etiquetas, mensajes y notificaciones. | Alta | Implementado |
| RNF-10 | El sistema debe utilizar tema oscuro como diseño por defecto, con opción de cambiar a tema claro. | Alta | Implementado |
| RNF-11 | El sistema debe implementar un sistema de diseño consistente basado en variables CSS con colores por módulo (nutrición verde, fisioterapia naranja, medicina rojo, neuropsicología morado, ortesis cyan). | Alta | Implementado |
| RNF-12 | Cada módulo debe tener su archivo CSS independiente para evitar conflictos de estilos entre secciones. | Media | Implementado |
| RNF-13 | El sistema debe mostrar estados de carga (spinners) durante las peticiones al servidor y estados vacíos con mensajes informativos cuando no hay datos. | Alta | Implementado |
| RNF-14 | El sistema debe mostrar notificaciones tipo toast (éxito/error) para confirmar acciones del usuario. | Alta | Implementado |
| RNF-15 | El sistema debe formatear fechas de forma legible (ej: "lunes, 15 de marzo", "Hace 5 minutos") y limitar textos con contadores de caracteres en formularios. | Media | Implementado |

### Rendimiento

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-16 | El tiempo de respuesta de las peticiones API no debe exceder 2 segundos para operaciones de lectura y 5 segundos para operaciones de escritura con subida de archivos. | Alta | Implementado |
| RNF-17 | El build de producción del frontend no debe exceder 200 kB de JavaScript comprimido (gzipped) y 60 kB de CSS comprimido. | Media | Implementado |
| RNF-18 | El sistema debe implementar estrategias de caché mediante Service Worker: cache-first para assets estáticos y network-first para peticiones API. | Media | Implementado |
| RNF-19 | El sistema debe optimizar las peticiones API utilizando Promise.all para consultas paralelas y evitar peticiones redundantes. | Media | Implementado |

### Seguridad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-20 | El sistema debe autenticar a los usuarios mediante tokens HMAC-SHA256 de 64 caracteres hexadecimales, almacenando únicamente el hash en la base de datos. | Alta | Implementado |
| RNF-21 | Todas las consultas a la base de datos deben utilizar prepared statements (PDO) para prevenir inyección SQL. | Alta | Implementado |
| RNF-22 | Las contraseñas deben almacenarse como hash usando `password_hash()` de PHP (bcrypt) y validarse con `password_verify()`. | Alta | Implementado |
| RNF-23 | Los tokens de sesión deben tener expiración automática: 24 horas para sesiones normales y 30 días para sesiones con "recordarme". | Alta | Implementado |
| RNF-24 | El sistema debe implementar CORS (Cross-Origin Resource Sharing) configurado para permitir peticiones únicamente desde los dominios autorizados. | Alta | Implementado |
| RNF-25 | La validación de archivos subidos debe verificar extensión y tipo MIME, limitando a formatos permitidos (PDF, DOCX, DOC, JPG, PNG) con tamaño máximo de 10 MB. | Alta | Implementado |
| RNF-26 | Los enlaces temporales (expediente compartido, subida de documentos) deben expirar automáticamente después de 72 horas. | Alta | Implementado |
| RNF-27 | El sistema debe proteger las rutas del frontend con guards de autenticación (ProtectedRoute) y de rol (AdminRoute, EspecialistaRoute) que redirijan a usuarios no autorizados. | Alta | Implementado |

### Compatibilidad y Portabilidad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-28 | El sistema debe funcionar como Progressive Web App (PWA) instalable en dispositivos móviles y de escritorio, con soporte offline parcial. | Alta | Implementado |
| RNF-29 | El sistema debe ser responsivo y funcionar correctamente en dispositivos con resoluciones desde 320px (móvil) hasta 1920px (desktop). | Alta | Implementado |
| RNF-30 | El sistema debe ser compatible con Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ y Samsung Internet 14+. | Alta | Implementado |
| RNF-31 | El PWA debe configurar manifest.json con nombre, iconos (192px y 512px), orientación portrait, accesos directos y categorías (health, medical, lifestyle). | Media | Implementado |

### Mantenibilidad

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-32 | El backend debe seguir el patrón MVC con separación clara en Controllers, Models, Services, Middleware y Routes. | Alta | Implementado |
| RNF-33 | Todas las respuestas de la API deben estar estandarizadas mediante la clase Response con formato JSON: `{success, data, message}`. | Alta | Implementado |
| RNF-34 | La conexión a base de datos debe implementarse como Singleton (DatabaseService) para reutilización eficiente de conexiones. | Alta | Implementado |
| RNF-35 | El frontend debe utilizar Context API de React para la gestión de estado global (autenticación, accesibilidad, notificaciones). | Alta | Implementado |
| RNF-36 | El esquema de base de datos debe evolucionar mediante archivos de migración incrementales con nomenclatura cronológica (AAAAMMDD_NNNNNN_descripcion.sql). | Media | Implementado |
| RNF-37 | El código fuente debe utilizar namespaces PSR-4 en el backend para la organización y autoloading de clases. | Media | Implementado |

### Disponibilidad e Infraestructura

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-38 | El sistema debe estar desplegado en el servidor institucional dtai.uteq.edu.mx bajo la ruta /~azaria/ con soporte para SPA routing mediante reglas de rewrite de Apache. | Alta | Implementado |
| RNF-39 | La base de datos MySQL debe configurar eventos automáticos para limpieza de sesiones expiradas (cada hora), tokens de recuperación (cada hora) y mensajes antiguos (cada día, >90 días). | Media | Implementado |
| RNF-40 | El sistema debe registrar errores del backend en un archivo de log (storage/logs/error.log) para diagnóstico de incidencias. | Alta | Implementado |

### Correos Electrónicos

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RNF-41 | El sistema debe enviar correos electrónicos mediante SMTP (PHPMailer) con soporte para Gmail, Outlook y servidores SMTP genéricos. | Alta | Implementado |
| RNF-42 | Las plantillas de correo deben ser HTML responsivas con encabezado de color según tipo de notificación, logotipo, contenido estructurado y pie de página con datos de contacto. | Media | Implementado |
| RNF-43 | El sistema debe degradar elegantemente cuando el servicio SMTP no esté configurado, registrando el correo en log sin interrumpir el flujo de la aplicación. | Alta | Implementado |

---

## RESUMEN DE REQUERIMIENTOS

| Categoría | Funcionales | No Funcionales |
|---|---|---|
| Autenticación | 7 | — |
| Nutrición | 9 | — |
| Medicina | 9 | — |
| Fisioterapia | 7 | — |
| Neuropsicología | 9 | — |
| Ortesis | 11 | — |
| Citas | 8 | — |
| Chat/Mensajes | 8 | — |
| Comunidad | 8 | — |
| Blog | 6 | — |
| Recordatorios | 7 | — |
| Configuración | 7 | — |
| Expediente Clínico | 7 | — |
| Sistema de Admisiones | 10 | — |
| Fases | 5 | — |
| FAQs | 3 | — |
| Panel Admin | 9 | — |
| Dashboard Especialista | 10 | — |
| Dashboard Paciente | 5 | — |
| Perfil | 4 | — |
| Accesibilidad | — | 8 |
| Usabilidad | — | 7 |
| Rendimiento | — | 4 |
| Seguridad | — | 8 |
| Compatibilidad | — | 4 |
| Mantenibilidad | — | 6 |
| Disponibilidad | — | 3 |
| Correos | — | 3 |
| **TOTAL** | **149** | **43** |

**Total general: 192 requerimientos (149 funcionales + 43 no funcionales)**
**Estado: 100% implementados**
