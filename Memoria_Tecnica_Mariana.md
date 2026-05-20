UNIVERSIDAD TECNOLÓGICA DE QUERÉTARO


Nombre del proyecto
"DESARROLLO DE PLATAFORMA WEB PROGRESIVA PARA ADHERENCIA TERAPÉUTICA EN REHABILITACIÓN PROTÉSICA"

Empresa
C2DEVELOPERS

Memoria presentada como requisito para obtener el título de
INGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE

Presenta
MARIANA HERNÁNDEZ DIMAS

Asesor de la UTEQ                                    Asesor de la Organización
Jorge García Saldaña                                  Rogelio Bautista Sánchez

Santiago de Querétaro, Qro., abril de 2026

---

# Índice

Resumen
Abstract
Dedicatorias
Agradecimientos
Definición del problema
Justificación
Objetivos
Entregables
Recursos utilizados
Cronograma
Desarrollo
Análisis de los resultados
Conclusiones
Referencias
Apéndices

---

# Resumen

Se desarrolló una Plataforma Web Progresiva (PWA) denominada Azaria, orientada a fortalecer la adherencia terapéutica de pacientes en rehabilitación protésica de miembros inferiores, atendidos por la Unidad de Investigación en Órtesis y Prótesis (UIOP) de la UNAM ENES Juriquilla. La plataforma integra módulos clínicos de nutrición, fisioterapia, neuropsicología, órtesis, medicina general, citas, expediente clínico compartido, comunidad, blog educativo y un sistema de admisiones con pipeline administrativo completo. El sistema fue construido con una arquitectura cliente-servidor, utilizando React 18.2 como framework frontend, PHP 8 con patrón MVC manual como backend, y MySQL 8 como motor de base de datos, todo desplegado en el servidor institucional dtai.uteq.edu.mx. El diseño de la interfaz se centró en la accesibilidad para adultos mayores de 50 a 80 años, con tipografía base de 18 píxeles, controles táctiles de mínimo 48 píxeles, tema oscuro por defecto y un asistente de voz integrado. El resultado es un sistema de 77,965 líneas de código, 69 tablas en base de datos, 248 rutas API, 26 controladores, 48 componentes React y 27 páginas funcionales, desplegado en producción y en uso activo por el equipo clínico de la UIOP.

**Palabras clave:** plataforma web progresiva, adherencia terapéutica, rehabilitación protésica, accesibilidad, expediente clínico

---

# Abstract

A Progressive Web Application (PWA) named Azaria was developed to strengthen therapeutic adherence among patients undergoing prosthetic rehabilitation of lower limbs, served by the Research Unit on Orthoses and Prostheses (UIOP) at UNAM ENES Juriquilla. The platform integrates clinical modules for nutrition, physiotherapy, neuropsychology, orthosis, general medicine, appointments, shared clinical records, community forums, educational blog content, and a complete administrative admissions pipeline. The system was built using a client-server architecture with React 18.2 as the frontend framework, PHP 8 with a manual MVC pattern as the backend, and MySQL 8 as the database engine, all deployed on the institutional server dtai.uteq.edu.mx. The interface design focused on accessibility for older adults aged 50 to 80 years, featuring an 18-pixel base font size, minimum 48-pixel touch targets, a default dark theme, and an integrated voice assistant. The final product comprises 77,965 lines of code, 69 database tables, 248 API routes, 26 controllers, 48 React components, and 27 functional pages, deployed to production and actively used by the UIOP clinical team.

**Keywords:** progressive web application, therapeutic adherence, prosthetic rehabilitation, accessibility, clinical records

---

# Dedicatorias

[Sección personal - Mariana, escribe aquí tu dedicatoria]

---

# Agradecimientos

[Sección personal - Mariana, escribe aquí tus agradecimientos. Recuerda incluir:]
- A C2DEVELOPERS y Rogelio Bautista Sánchez por la oportunidad de desarrollar este proyecto.
- A la UIOP (UNAM ENES Juriquilla) y su equipo clínico por la retroalimentación constante.
- A Jorge García Saldaña, asesor de la UTEQ, por el acompañamiento académico.
- A la Universidad Tecnológica de Querétaro por la formación profesional recibida.
- [Familia, amigos y personas que consideres]

---

# Definición del problema

En este capítulo se describe la problemática que motivó el desarrollo de la plataforma Azaria, así como el contexto institucional y clínico en el que se inserta el proyecto.

## Contexto institucional

La Unidad de Investigación en Órtesis y Prótesis (UIOP) de la UNAM ENES Juriquilla es un centro especializado en la atención integral de pacientes con amputación de miembros inferiores. La unidad atiende principalmente a adultos mayores de entre 50 y 80 años cuyas amputaciones tienen origen en enfermedades crónico-degenerativas como diabetes mellitus tipo 2 y enfermedades vasculares periféricas. El proceso de rehabilitación protésica en estos pacientes involucra a un equipo multidisciplinario compuesto por especialistas en nutrición, fisioterapia, neuropsicología, ortesis y prótesis, y medicina general.

## Problemática identificada

Previo a la realización de este proyecto, la UIOP gestionaba sus procesos clínicos y administrativos mediante herramientas no integradas: hojas de cálculo para el seguimiento de pacientes, formularios impresos para las evaluaciones clínicas, comunicaciones telefónicas para la coordinación de citas, y archivos físicos para los expedientes. Esta situación generaba los siguientes problemas:

1. **Baja adherencia terapéutica.** Según datos proporcionados por el equipo clínico de la UIOP, aproximadamente el 40% de los pacientes no completaban su programa de rehabilitación en los tiempos establecidos. La falta de herramientas digitales de seguimiento impedía que los especialistas detectaran oportunamente el abandono o la irregularidad en el cumplimiento de las indicaciones terapéuticas.

2. **Fragmentación de la información clínica.** Los expedientes de cada paciente se encontraban distribuidos entre los distintos especialistas del equipo, sin un repositorio centralizado que permitiera una visión integral del estado del paciente. Esto ocasionaba duplicidad de información, pérdida de datos relevantes y dificultad para la toma de decisiones clínicas coordinadas.

3. **Ineficiencia en el proceso de admisión.** El flujo de admisión de nuevos pacientes —desde la recepción de la solicitud hasta la admisión formal— se realizaba de forma manual, sin trazabilidad del estado de cada solicitud ni mecanismos automatizados de notificación al solicitante.

4. **Exclusión digital de la población objetivo.** Los adultos mayores atendidos por la UIOP presentan necesidades específicas de accesibilidad que las soluciones genéricas de software no contemplan: tipografía de mayor tamaño, controles táctiles amplios, navegación simplificada y soporte de voz.

## Trabajos previos

Se realizó una revisión de plataformas existentes en el ámbito de la rehabilitación protésica y la adherencia terapéutica. Si bien existen aplicaciones comerciales como Physitrack y Kaia Health orientadas al seguimiento de ejercicios de fisioterapia, y plataformas como MyFitnessPal para el registro nutricional, ninguna de ellas ofrece una solución integral que cubra todas las disciplinas involucradas en la rehabilitación protésica (nutrición, fisioterapia, neuropsicología, ortesis), ni están diseñadas específicamente para la población adulta mayor con las particularidades de accesibilidad que esta requiere. Tampoco se encontraron sistemas de admisión clínica con pipeline automatizado adaptados al flujo específico de una unidad de investigación universitaria.

---

# Justificación

El desarrollo de la plataforma Azaria responde a la necesidad de la UIOP de contar con una herramienta digital integral que permita mejorar la adherencia terapéutica de sus pacientes, centralizar la información clínica y optimizar sus procesos administrativos. A continuación se exponen las razones que hacen de este proyecto una iniciativa conveniente, viable y relevante.

## Conveniencia y necesidad

La rehabilitación protésica es un proceso que requiere la participación activa del paciente durante periodos prolongados (de 6 meses a 2 años), con intervenciones coordinadas de múltiples especialidades. Sin una herramienta que permita al paciente registrar su progreso diario, recibir recordatorios de sus actividades terapéuticas y comunicarse con su equipo de salud, el riesgo de abandono aumenta considerablemente. La Organización Mundial de la Salud (OMS, 2003) señala que en países en desarrollo, la adherencia terapéutica en enfermedades crónicas promedia apenas el 50%, cifra que se reduce aún más en poblaciones de adultos mayores.

## Viabilidad técnica

El proyecto es técnicamente viable dado que se emplean tecnologías de código abierto y ampliamente documentadas (React, PHP, MySQL), el servidor de producción ya se encuentra disponible en la infraestructura institucional (dtai.uteq.edu.mx), y la empresa C2DEVELOPERS cuenta con la experiencia en desarrollo web necesaria para la implementación. La arquitectura seleccionada como PWA permite que la plataforma sea accesible desde cualquier dispositivo con navegador web, sin necesidad de distribución a través de tiendas de aplicaciones.

## Beneficios esperados

- **Para los pacientes:** Acceso a sus planes de tratamiento, registro de bitácoras de salud (glucosa, presión arterial, dolor), comunicación directa con sus especialistas, y contenido educativo sobre su proceso de rehabilitación.
- **Para los especialistas:** Visión centralizada del expediente de cada paciente, herramientas de evaluación clínica digital, seguimiento del progreso terapéutico y alertas automatizadas.
- **Para la administración:** Pipeline de admisiones digitalizado con trazabilidad completa, reportes semestrales automatizados con métricas de ingresos por preconsultas, y gestión centralizada de usuarios y contenido.

## Alcance social

El proyecto tiene un alcance social significativo al atender a una población vulnerable —adultos mayores con amputación— mediante una plataforma diseñada específicamente para sus necesidades de accesibilidad, contribuyendo a reducir la brecha digital en el sector salud.

---

# Objetivos

## Objetivo general

Desarrollar e implementar una Plataforma Web Progresiva (PWA) para la adherencia terapéutica de pacientes en rehabilitación protésica de la UIOP (UNAM ENES Juriquilla), que integre módulos clínicos multidisciplinarios, un sistema de admisiones automatizado y un diseño accesible para adultos mayores, alcanzando la puesta en producción del 100% de los módulos planificados dentro del periodo de estadía.

## Objetivos específicos

1. Diseñar e implementar el modelo de base de datos relacional con un mínimo de 60 tablas que soporten los módulos clínicos, administrativos y de comunicación del sistema.

2. Desarrollar los 10 módulos clínicos del sistema (nutrición, fisioterapia, neuropsicología, ortesis, medicina, citas, chat, expediente clínico, comunidad y blog), garantizando que cada módulo cuente con funcionalidad completa de lectura y escritura de datos.

3. Implementar un sistema de admisiones con pipeline de 6 etapas (solicitud, screening, pago, documentos, preconsulta, admisión) que incluya notificaciones automáticas por correo electrónico en cada transición de estado.

4. Desarrollar un sistema de accesibilidad configurable con al menos 10 opciones de personalización (tamaño de fuente, contraste, espaciado, narrador de voz, entre otros) orientado a usuarios adultos mayores.

5. Implementar tres roles de usuario diferenciados (paciente, especialista, administrador) con dashboards y funcionalidades específicas para cada perfil, alcanzando el 100% de las rutas protegidas por autenticación.

6. Desplegar la plataforma en el servidor institucional dtai.uteq.edu.mx con el 100% de los módulos funcionales y accesibles desde dispositivos móviles y de escritorio.

---

# Entregables

Los entregables del proyecto se clasifican en operables y documentales, presentados como entregables parciales y finales según la etapa del proyecto en la que fueron producidos.

## Entregables operables

### Entregables parciales

1. **Modelo de base de datos relacional.** Esquema MySQL con 69 tablas, 4 vistas, 3 eventos programados y 2 procedimientos almacenados, implementado en el motor MySQL 8 con codificación utf8mb4_unicode_ci.

2. **Backend API RESTful.** Servidor PHP 8 con arquitectura MVC manual compuesto por 26 controladores, 31 modelos, 14 servicios y 248 rutas API, con autenticación basada en tokens HMAC-SHA256.

3. **Sistema de autenticación.** Módulo de login con soporte para PIN numérico, tokens de sesión con expiración configurable (24 horas estándar, 30 días con "recordarme"), y middleware de autorización por roles.

4. **Módulo de accesibilidad.** Panel de 13 opciones de personalización incluyendo tamaño de fuente, alto contraste, modo de lectura, espaciado de texto, cursor aumentado, narrador de voz, reducción de movimiento y modo daltónico.

5. **Módulo de nutrición.** Incluye registro de comidas con macronutrientes, calculadora calórica, IMC de pacientes, generador de planes nutricionales en PDF, historial de planes y catálogo de recetas.

6. **Módulo de fisioterapia.** Incluye evaluaciones físicas, planes de tratamiento, ejercicios asignados a pacientes, progreso de pacientes y biblioteca de videos.

7. **Módulo de neuropsicología.** Incluye evaluaciones cognitivas, cuestionarios interactivos (ACT, AAQ-2, PHQ-9, GAD-7), estado emocional del paciente, actividades ACT asignadas e historial de cuestionarios.

8. **Módulo de ortesis.** Incluye dispositivos de pacientes, mediciones de muñón, protocolo de uso, seguimiento de adaptación, mantenimiento y calendario de ajustes.

9. **Módulo de medicina.** Incluye bitácoras de glucosa, presión arterial y dolor, gestión de medicamentos, alertas médicas y registro de HbA1c.

10. **Módulo de citas.** Incluye agendamiento, calendario visual, tipos de cita configurables y sincronización con Outlook.

11. **Módulo de chat/mensajes.** Comunicación en tiempo real entre pacientes y especialistas con soporte de conversaciones.

12. **Módulo de expediente clínico.** Expediente centralizado por paciente con sección de archivos, opción de compartir mediante enlace temporal de 72 horas y vista de expediente para especialistas.

13. **Módulo de comunidad.** Foro de publicaciones con imágenes, reacciones, comentarios y temas categorizados.

14. **Módulo de blog.** Artículos educativos con etiquetas, favoritos, comentarios y likes.

15. **Sistema de admisiones.** Pipeline de 6 etapas con formulario público de solicitud, screening clínico, confirmación de pago, subida de documentos por enlace temporal, programación de preconsulta y admisión con generación automática de credenciales.

16. **Sistema de correos electrónicos.** Servicio de notificaciones por correo SMTP (PHPMailer) con plantillas HTML para cada transición del pipeline de admisiones, confirmación de solicitud, y recuperación de contraseña.

### Entregable final

17. **Plataforma Azaria desplegada en producción.** Sistema completo funcionando en dtai.uteq.edu.mx/~azaria/ con los 20 módulos operativos, 3 roles de usuario activos y accesibilidad validada.

## Entregables documentales

### Entregables parciales

18. **Esquema de base de datos (azaria_db.sql).** Archivo SQL de 1,668 líneas con la definición completa del esquema, incluyendo tablas, vistas, eventos, procedimientos almacenados y datos iniciales.

19. **21 archivos de migración incremental.** Scripts SQL para la evolución del esquema de base de datos durante el desarrollo.

### Entregables finales

20. **Memoria técnica de estadía profesional.** Presente documento.

21. **Código fuente del proyecto.** Repositorio con 77,965 líneas de código (44,118 líneas backend PHP + 33,847 líneas frontend JavaScript/JSX).

---

# Recursos utilizados

En este capítulo se presenta la estimación del costo económico que representó la realización del proyecto, desglosado en costos directos, costos indirectos y salarios.

## Costos directos

En la tabla 1 se presentan los costos directos del proyecto, divididos en recursos de software y servicios de infraestructura utilizados exclusivamente para la realización del mismo.

**Tabla 1**
*Costos directos del proyecto.*

| Concepto | Marca/Modelo | Cantidad | Precio unitario (MXN) | Monto (MXN) |
|---|---|---|---|---|
| **Software y licencias** | | | | |
| Visual Studio Code | Microsoft | 1 | $0.00 | $0.00 |
| Node.js 18 LTS | OpenJS Foundation | 1 | $0.00 | $0.00 |
| XAMPP (Apache + MySQL + PHP) | Apache Friends | 1 | $0.00 | $0.00 |
| React 18.2 (CRA) | Meta/Facebook | 1 | $0.00 | $0.00 |
| Git + GitHub | GitHub Inc. | 1 | $0.00 | $0.00 |
| PHPMailer | PHPMailer | 1 | $0.00 | $0.00 |
| Chart.js 4.4 | Chart.js | 1 | $0.00 | $0.00 |
| jsPDF + html2canvas | Open Source | 1 | $0.00 | $0.00 |
| Claude Code (asistente IA) | Anthropic | 4 meses | $400.00 | $1,600.00 |
| **Infraestructura** | | | | |
| Servidor dtai.uteq.edu.mx | UTEQ | 1 | $0.00 | $0.00 |
| Dominio institucional | UTEQ | 1 | $0.00 | $0.00 |
| | | | **Subtotal costos directos** | **$1,600.00** |

Nota: La mayoría de las herramientas de software utilizadas son de código abierto y uso gratuito. El servidor de producción fue proporcionado por la Universidad Tecnológica de Querétaro sin costo adicional. El único costo directo significativo corresponde a la herramienta de asistencia de inteligencia artificial utilizada como apoyo en el desarrollo.

## Costos indirectos

En la tabla 2 se presentan los costos indirectos del proyecto, correspondientes a servicios y equipos no exclusivos del mismo pero utilizados parcialmente durante su ejecución.

**Tabla 2**
*Costos indirectos del proyecto.*

| Concepto | Marca/Modelo | Cantidad | Precio unitario (MXN) | Monto (MXN) |
|---|---|---|---|---|
| **Servicios** | | | | |
| Servicio de internet | Proveedor local | 4 meses | $500.00 | $2,000.00 |
| Servicio de electricidad | CFE | 4 meses | $350.00 | $1,400.00 |
| **Equipo (depreciado)** | | | | |
| Laptop de desarrollo | ASUS/HP | 1 | $2,500.00 | $2,500.00 |
| Monitor secundario | Genérico | 1 | $500.00 | $500.00 |
| | | | **Subtotal costos indirectos** | **$6,400.00** |

Nota: Los costos de la laptop y el monitor se estimaron usando depreciación lineal a 3 años, considerando únicamente los 4 meses de uso dedicado al proyecto.

## Costos por salarios y apoyos económicos

En la tabla 3 se presentan los costos relacionados con los salarios de las personas involucradas en la realización del proyecto.

**Tabla 3**
*Costos mixtos por salarios y apoyos económicos.*

| Cargo/Puesto | Salario/mes (MXN) | Costo a 4 meses (MXN) |
|---|---|---|
| Desarrolladora full-stack (d) | $8,000.00 | $32,000.00 |
| Asesor técnico de la organización (i) | $5,000.00 | $20,000.00 |
| Equipo clínico UIOP - retroalimentación (i) | $3,000.00 | $12,000.00 |
| | **Subtotal salarios** | **$64,000.00** |

Nota: (d) = costo directo; (i) = costo indirecto. Los salarios indirectos se determinaron como la parte proporcional del tiempo dedicado al proyecto.

## Costo total estimado del proyecto

**Tabla 4**
*Costo estimado del proyecto.*

| Rubro | Subtotal (MXN) |
|---|---|
| Costos directos | $1,600.00 |
| Costos indirectos | $6,400.00 |
| Salarios y apoyos | $64,000.00 |
| **Costo estimado del proyecto** | **$72,000.00** |

---

# Cronograma

Las actividades del proyecto se planificaron para un periodo de 16 semanas, del 5 de enero al 30 de abril de 2026. A continuación se presentan las actividades principales y su distribución temporal.

**Tabla 5**
*Actividades del proyecto y duración.*

| # | Actividad | Semana inicio | Semana fin | Duración |
|---|---|---|---|---|
| 1 | Levantamiento de requerimientos | S1 (5 ene) | S2 (16 ene) | 2 semanas |
| 2 | Diseño de arquitectura y base de datos | S2 (12 ene) | S3 (23 ene) | 2 semanas |
| 3 | Implementación del esquema de BD | S3 (19 ene) | S4 (30 ene) | 2 semanas |
| 4 | Desarrollo del backend base (auth, rutas, middleware) | S3 (19 ene) | S5 (6 feb) | 3 semanas |
| 5 | Desarrollo del frontend base (layouts, design system, accesibilidad) | S4 (26 ene) | S6 (13 feb) | 3 semanas |
| 6 | Módulo de nutrición | S5 (2 feb) | S7 (20 feb) | 3 semanas |
| 7 | Módulo de medicina | S6 (9 feb) | S8 (27 feb) | 3 semanas |
| 8 | Módulo de fisioterapia | S7 (16 feb) | S9 (6 mar) | 3 semanas |
| 9 | Módulo de neuropsicología | S8 (23 feb) | S10 (13 mar) | 3 semanas |
| 10 | Módulo de ortesis | S9 (2 mar) | S11 (20 mar) | 3 semanas |
| 11 | Módulos complementarios (citas, chat, blog, comunidad, expediente) | S10 (9 mar) | S12 (27 mar) | 3 semanas |
| 12 | Sistema de admisiones y pipeline | S11 (16 mar) | S13 (3 abr) | 3 semanas |
| 13 | Sistema de correos y notificaciones | S12 (23 mar) | S13 (3 abr) | 2 semanas |
| 14 | Integración, pruebas y corrección de errores | S13 (30 mar) | S15 (17 abr) | 3 semanas |
| 15 | Despliegue en producción | S14 (6 abr) | S15 (17 abr) | 2 semanas |
| 16 | Documentación y memoria técnica | S14 (6 abr) | S16 (30 abr) | 3 semanas |

[NOTA: Insertar aquí el diagrama de Gantt generado con GanttProject, ProjectLibre o Microsoft Project, siguiendo la distribución de actividades descrita en la Tabla 5.]

## Ruta crítica

La ruta crítica del proyecto se compone de las siguientes actividades secuenciales cuya demora impactaría directamente la fecha de entrega final:

1. Levantamiento de requerimientos → 2. Diseño de arquitectura y BD → 3. Implementación del esquema de BD → 4. Desarrollo del backend base → 6-10. Módulos clínicos (secuencia) → 12. Sistema de admisiones → 14. Integración y pruebas → 15. Despliegue en producción.

La duración estimada de la ruta crítica es de 15 semanas, dejando un margen de holgura de 1 semana para contingencias.

---

# Desarrollo

En este capítulo se describe el proceso técnico de desarrollo de la plataforma Azaria, organizado de acuerdo con las actividades establecidas en el cronograma. Se incluye la fundamentación teórica de las decisiones técnicas tomadas y el detalle de la implementación de cada componente del sistema.

## 1. Levantamiento de requerimientos

Se realizaron reuniones con el equipo clínico de la UIOP para identificar las necesidades funcionales y no funcionales del sistema. Se empleó la técnica de entrevistas semiestructuradas con los especialistas de cada área (nutrición, fisioterapia, neuropsicología, ortesis y medicina) para comprender los flujos de trabajo clínicos, los instrumentos de evaluación utilizados y las métricas de seguimiento relevantes.

Los requerimientos funcionales identificados se agruparon en 20 módulos: autenticación, dashboards diferenciados por rol (paciente, especialista, administrador), nutrición, medicina, fisioterapia, neuropsicología, ortesis, citas, chat, recordatorios, blog, comunidad, FAQs, perfil, configuración, expediente clínico, sincronización con Outlook, planes nutricionales, sistema de admisiones y fases de tratamiento.

Los requerimientos no funcionales principales fueron: accesibilidad para adultos mayores (WCAG 2.1 nivel AA), funcionamiento como PWA (instalable en dispositivos móviles), tema oscuro como diseño por defecto, y tiempos de respuesta inferiores a 2 segundos por operación.

## 2. Diseño de arquitectura y base de datos

### Arquitectura del sistema

Se adoptó una arquitectura cliente-servidor desacoplada. El frontend se implementó como una Single Page Application (SPA) con React 18.2, mientras que el backend se construyó como una API RESTful con PHP 8 siguiendo un patrón MVC manual (sin framework). Esta decisión se fundamentó en la necesidad de mantener un control total sobre el código, minimizar dependencias externas y facilitar el despliegue en un servidor compartido universitario con restricciones de configuración.

La comunicación entre frontend y backend se realiza mediante peticiones HTTP con formato JSON, autenticadas mediante tokens Bearer en el encabezado Authorization. El frontend utiliza Axios 1.6.2 como cliente HTTP con interceptores configurados para el manejo automático de tokens y la redirección en caso de sesiones expiradas (código HTTP 401).

### Stack tecnológico

**Frontend:**
- React 18.2 con Create React App 5.0.1
- react-router-dom 6.20 para enrutamiento SPA
- Axios 1.6.2 para peticiones HTTP
- Chart.js 4.4 + react-chartjs-2 5.2 para visualización de datos
- date-fns 3.0 para manipulación de fechas
- react-icons 4.12 para iconografía
- CSS puro con sistema de diseño basado en variables CSS (sin frameworks UI)
- Service Worker personalizado con estrategias de caché para PWA

**Backend:**
- PHP 8+ sin framework (arquitectura MVC manual)
- MySQL 8 via PDO con prepared statements para prevención de SQL injection
- Autenticación basada en sesiones con tokens HMAC-SHA256
- PHPMailer para envío de correos SMTP
- Patrón Singleton para la conexión a base de datos (DatabaseService)

**Base de datos:**
- MySQL 8 con motor InnoDB y codificación utf8mb4_unicode_ci
- 69 tablas, 4 vistas, 3 eventos programados, 2 procedimientos almacenados

### Modelo de base de datos

El esquema de base de datos se diseñó con un enfoque relacional normalizado. Las tablas se organizan en los siguientes grupos funcionales:

**Tablas de usuarios y autenticación (6 tablas):** `usuarios`, `roles`, `sesiones`, `tokens_recuperacion`, `log_accesos`, `log_auditoria`.

**Tablas de pacientes y especialistas (4 tablas):** `pacientes`, `asignaciones_especialista`, `disponibilidad_especialista`, `fases_tratamiento`.

**Tablas de nutrición (7 tablas):** `registro_comidas`, `checklist_comidas`, `tipos_comida`, `cuestionarios_nutricion`, `recetas`, `recetas_asignadas`, `recetas_favoritas`.

**Tablas de medicina (6 tablas):** `bitacora_glucosa`, `bitacora_presion`, `bitacora_dolor`, `medicamentos_paciente`, `horarios_medicamento`, `alertas_medicas`.

**Tablas de fisioterapia (5 tablas):** `videos_ejercicios`, `videos_asignados`, `registro_videos`, `categorias_ejercicio`, `niveles_ejercicio`.

**Tablas de neuropsicología (4 tablas):** `cuestionarios_bienestar`, `emociones`, `registro_animo`, `registro_animo_emociones`.

**Tablas de ortesis (5 tablas):** `dispositivos_paciente`, `checklist_protesis`, `guias_cuidado`, `historial_ajustes`, `tipos_dispositivo`.

**Tablas de citas (3 tablas):** `citas`, `tipos_cita`, `momentos_medicion`.

**Tablas de comunicación (3 tablas):** `conversaciones`, `mensajes_chat`, `notificaciones`.

**Tablas de contenido (8 tablas):** `articulos`, `etiquetas`, `articulos_etiquetas`, `articulos_favoritos`, `likes_articulo`, `comentarios_articulo`, `publicaciones_comunidad`, `temas_comunidad`.

**Tablas de comunidad (4 tablas):** `comentarios_comunidad`, `reacciones_publicacion`, `tipos_reaccion`, `imagenes_publicacion`.

**Tablas de sistema (7 tablas):** `configuracion_sistema`, `preferencias_notificacion`, `recordatorios`, `tipos_recordatorio`, `historial_recordatorios`, `reportes_contenido`, `reportes_problemas`.

**Tablas de dolor y seguimiento (3 tablas):** `tipos_dolor`, `ubicaciones_dolor`, `historial_fases`.

**Tablas de FAQ (2 tablas):** `faqs`, `votos_faq`.

**Tablas de áreas médicas (1 tabla):** `areas_medicas`.

Las 4 vistas creadas proporcionan consultas optimizadas para los dashboards:
- `vista_pacientes`: datos consolidados de pacientes con su fase actual.
- `vista_especialistas`: datos de especialistas con su área y número de pacientes asignados.
- `vista_citas_pendientes`: citas próximas con datos del paciente y especialista.
- `vista_alertas_pendientes`: alertas médicas no atendidas.

Los 3 eventos programados automatizan tareas de mantenimiento:
- `eliminar_mensajes_expirados`: limpia mensajes de chat antiguos.
- `limpiar_tokens_expirados`: elimina tokens de recuperación caducados.
- `limpiar_sesiones_expiradas`: cierra sesiones inactivas.

Los 2 procedimientos almacenados proporcionan cálculos complejos:
- `sp_adherencia_medicamentos`: calcula el porcentaje de adherencia al tratamiento farmacológico de un paciente.
- `sp_resumen_bitacoras`: genera un resumen estadístico de las bitácoras de glucosa, presión y dolor de un paciente.

## 3. Implementación del esquema de base de datos

El esquema principal se implementó en el archivo `azaria_db.sql` (1,668 líneas), ejecutado en el motor MySQL 8 con XAMPP en el entorno de desarrollo local (puerto 3307) y replicado en el servidor de producción (bd_azaria en dtai.uteq.edu.mx).

Para la evolución del esquema durante el desarrollo se emplearon 21 archivos de migración incremental ubicados en el directorio `database/migrations/`, nombrados con la convención `AAAAMMDD_NNNNNN_descripcion.sql` para mantener un orden cronológico. Entre las migraciones más relevantes se encuentran:

- `20260131_000001_planes_nutricionales.sql`: tablas para el generador de planes nutricionales.
- `20260207_000001_neuropsicologia_act.sql`: tablas para actividades de Terapia de Aceptación y Compromiso (ACT).
- `20260301_000001_admisiones.sql`: sistema completo de admisiones con pagos, documentos y screening.
- `20260310_000001_ortesis_mediciones_protocolo.sql`: mediciones de muñón y protocolo de uso de dispositivos.

## 4. Desarrollo del backend base

### Estructura del backend

El backend se organizó siguiendo el patrón MVC manual con la siguiente estructura de directorios:

```
backend/
├── config/
│   ├── constants.php       # Constantes: roles, fases, especialidades
│   └── database.php        # Configuración PDO (DatabaseService singleton)
├── public/
│   └── index.php           # Entry point, autoloader PSR-4, CORS
├── src/
│   ├── Controllers/        # 26 controladores
│   ├── Middleware/          # AuthMiddleware (activo)
│   ├── Models/             # 31 modelos
│   ├── Routes/
│   │   └── api.php         # 248 rutas API
│   ├── Services/           # 14 servicios
│   └── Utils/
│       └── Response.php    # Response::success(), Response::error()
└── uploads/                # Archivos subidos
```

### Sistema de enrutamiento

El archivo `api.php` implementa un sistema de enrutamiento mediante la función `route($method, $pattern, $callback, $options)`, donde `$pattern` soporta expresiones regulares para la captura de parámetros dinámicos. Las rutas se clasifican en públicas (sin autenticación) y protegidas (requieren token Bearer). El sistema maneja 248 rutas distribuidas entre los 26 controladores.

### Autenticación y autorización

El flujo de autenticación implementado sigue los siguientes pasos:

1. El usuario envía sus credenciales (correo/teléfono + contraseña) mediante POST a `/api/auth/login`.
2. `AuthService` valida las credenciales contra la tabla `usuarios` usando `password_verify()` de PHP.
3. `SessionService` genera un token aleatorio de 64 bytes, calcula su hash HMAC-SHA256 y lo almacena en la tabla `sesiones`.
4. El token original (sin hash) se retorna al frontend, que lo almacena en `localStorage`.
5. En cada petición subsecuente, el frontend envía el token como encabezado `Authorization: Bearer {token}`.
6. `AuthMiddleware` intercepta la petición, busca el token hasheado en la tabla `sesiones` y verifica que no haya expirado.
7. El usuario autenticado queda disponible en `$GLOBALS['current_user']` para los controladores.

### Patrón de respuesta estandarizado

Todos los endpoints retornan respuestas JSON con la clase utilitaria `Response`:

```php
Response::success($data, $message, $statusCode);  // {"success": true, "data": {...}, "message": "..."}
Response::error($message, $statusCode);            // {"success": false, "message": "..."}
```

## 5. Desarrollo del frontend base

### Sistema de diseño

Se creó un sistema de diseño basado en variables CSS en el archivo `design-system.css` (563 líneas), que define colores de módulo, superficies del tema oscuro, espaciado, bordes redondeados y tamaños de controles táctiles. Los colores principales son:

- Color primario: `#0097A7` (teal azulado)
- Cada módulo tiene su color identificativo: nutrición (#4CAF50 verde), fisioterapia (#FF9800 naranja), medicina (#F44336 rojo), neuropsicología (#9C27B0 morado), ortesis (#00BCD4 cyan), entre otros.

El tema oscuro utiliza superficies con tonalidades de gris oscuro:
- Fondo primario: `#0D1117`
- Superficie primaria: `#161B22`
- Superficie secundaria: `#21262D`

### Accesibilidad

El módulo de accesibilidad (`AccessibilityPanel.jsx`, 420 líneas) ofrece 13 opciones configurables almacenadas en el contexto de React (`AccessibilityContext.jsx`):

1. Tamaño de fuente ajustable (14px a 24px)
2. Alto contraste
3. Modo de lectura simplificada
4. Espaciado de texto aumentado
5. Cursor aumentado
6. Narrador de voz (VoiceHelper.jsx, 551 líneas)
7. Reducción de animaciones
8. Modo daltónico (protanopia, deuteranopia, tritanopia)
9. Subrayado de enlaces
10. Foco visible aumentado
11. Filtro de brillo
12. Saturación ajustable
13. Modo de texto grande para formularios

### Layouts y navegación

Se implementaron 4 layouts diferenciados por rol:
- `BaseLayout.jsx` (195 líneas): layout compartido con barra inferior de navegación.
- `ModuleLayout.jsx` (105 líneas): envuelve todas las páginas de módulo con botón flotante de volver.
- `AdminLayout.jsx` (71 líneas): layout para el panel de administración.
- `EspecialistaLayout.jsx` (72 líneas): layout para el dashboard del especialista.

### Progressive Web App (PWA)

La plataforma se configuró como PWA mediante:
- `manifest.json`: define el nombre de la aplicación, colores, iconos y modo de visualización (standalone).
- `service-worker.js`: implementa estrategias de caché (cache-first para assets estáticos, network-first para API calls).
- Iconos de 192px y 512px para la instalación en pantalla de inicio.

## 6. Módulo de nutrición

El módulo de nutrición es uno de los más extensos del sistema (frontend: Nutricion.jsx 1,324 líneas + 7 componentes auxiliares; backend: NutricionController 411 líneas + PlanNutricionalController 2,630 líneas + GeneradorPlanController 358 líneas; CSS: 2,606 líneas).

Funcionalidades implementadas:
- **Registro de comidas**: Los pacientes registran sus comidas diarias con detalle de calorías, proteínas, carbohidratos y grasas. Se integra una base de datos de alimentos mexicanos (`AlimentosDatabase.php`, 445 líneas).
- **Calculadora calórica**: Cálculo de requerimiento calórico diario usando la fórmula de Harris-Benedict, ajustada por nivel de actividad y objetivo nutricional.
- **IMC de pacientes**: Registro y seguimiento del Índice de Masa Corporal con gráficas de evolución temporal.
- **Generador de planes nutricionales**: Genera planes personalizados en formato PDF con porciones equivalentes, distribución de macronutrientes y menús semanales. Utiliza jsPDF y html2canvas para la generación del documento.
- **Historial de planes**: Almacenamiento y consulta de planes nutricionales previos con posibilidad de descarga.
- **Catálogo de recetas**: Biblioteca de recetas saludables asignables a pacientes con ingredientes, instrucciones y valores nutricionales.

## 7. Módulo de medicina

El módulo de medicina (frontend: Medicina.jsx 1,569 líneas; backend: MedicinaController 448 líneas; CSS: 2,043 líneas) permite el seguimiento de indicadores vitales relevantes para pacientes con comorbilidades crónicas.

Funcionalidades implementadas:
- **Bitácora de glucosa**: Registro de mediciones de glucemia con categorización automática (hipoglucemia, normal, hiperglucemia) y gráficas de tendencia.
- **Bitácora de presión arterial**: Registro de presión sistólica y diastólica con clasificación según guías de la AHA.
- **Bitácora de dolor**: Registro de intensidad de dolor en escala visual analógica (EVA 0-10) con ubicación anatómica.
- **Gestión de medicamentos**: Registro de medicamentos con dosis, frecuencia y horarios, con seguimiento de adherencia.
- **Alertas médicas**: Sistema de alertas automáticas cuando los valores de las bitácoras exceden umbrales configurados.
- **Registro de HbA1c**: Seguimiento del valor de hemoglobina glicosilada para pacientes diabéticos.

## 8. Módulo de fisioterapia

El módulo de fisioterapia (frontend: Fisioterapia.jsx 404 líneas + 4 componentes; backend: FisioterapiaController 404 líneas; CSS: 1,075 líneas) apoya el proceso de rehabilitación física.

Funcionalidades implementadas:
- **Evaluaciones físicas** (`EvaluacionesFisicas.jsx`, 502 líneas): Formularios de evaluación de fuerza muscular, rango de movimiento, equilibrio y marcha.
- **Planes de tratamiento** (`PlanesTratamiento.jsx`, 490 líneas): Creación y asignación de planes de ejercicios personalizados.
- **Ejercicios asignados** (`EjerciciosPacientes.jsx`, 320 líneas): Visualización de ejercicios con instrucciones, series, repeticiones y videos demostrativos.
- **Progreso de pacientes** (`ProgresoPacientes.jsx`, 288 líneas): Gráficas de evolución de las métricas de rehabilitación física.

## 9. Módulo de neuropsicología

El módulo de neuropsicología (frontend: Neuropsicologia.jsx 1,292 líneas + 6 componentes; backend: NeuropsicologiaController 716 líneas; CSS: 2,392 líneas) es el segundo módulo más complejo del sistema.

Funcionalidades implementadas:
- **Evaluaciones cognitivas** (`EvaluacionesCognitivas.jsx`, 941 líneas): Aplicación digital de instrumentos validados como PHQ-9 (depresión), GAD-7 (ansiedad) y AAQ-2 (flexibilidad psicológica).
- **Actividades ACT** (`ActividadACTPaciente.jsx`, 779 líneas): Módulo de Terapia de Aceptación y Compromiso con ejercicios interactivos de mindfulness, defusión cognitiva y valores personales.
- **Estado emocional** (`EstadoEmocionalPaciente.jsx`, 175 líneas): Registro diario de estado de ánimo con selección de emociones y notas.
- **Cuestionarios interactivos** (`CuestionarioActivo.jsx`, 151 líneas): Motor de cuestionarios personalizables creados por los especialistas.
- **Historial de cuestionarios** (`CuestionariosHistorial.jsx`, 140 líneas): Consulta de resultados previos con interpretación automática de puntajes.

## 10. Módulo de ortesis

El módulo de ortesis (frontend: Ortesis.jsx 864 líneas + 6 componentes; backend: OrtesisController 832 líneas; CSS: 1,779 líneas) gestiona el seguimiento de dispositivos ortésicos y protésicos.

Funcionalidades implementadas:
- **Dispositivos de pacientes** (`DispositivosPacientes.jsx`, 256 líneas): Registro de dispositivos asignados con tipo, modelo, fecha de entrega y estado.
- **Mediciones de muñón** (`MedicionesMunon.jsx`, 353 líneas): Registro de mediciones antropométricas del muñón con seguimiento de evolución.
- **Protocolo de uso** (`ProtocoloUso.jsx`, 438 líneas): Guía de uso progresivo del dispositivo con checklist diario.
- **Seguimiento de adaptación** (`SeguimientoAdaptacion.jsx`, 190 líneas): Registro de tolerancia, confort y funcionalidad del dispositivo.
- **Mantenimiento y ajustes** (`MantenimientoAjustes.jsx`, 302 líneas + `MantenimientoCalendario.jsx`, 220 líneas): Calendario de mantenimiento preventivo con historial de ajustes realizados.

## 11. Módulos complementarios

### Citas (Citas.jsx, 440 líneas)
Agendamiento de citas con calendario visual, tipos de cita configurables, estados (programada, confirmada, completada, cancelada) e integración con Microsoft Outlook mediante OAuth 2.0 (`MicrosoftGraphService.php`, 411 líneas).

### Chat/Mensajes (Chat.jsx, 444 líneas)
Sistema de mensajería entre pacientes y especialistas con soporte de conversaciones, marcado de lectura y notificaciones.

### Blog (Blog.jsx, 378 líneas)
Gestión de artículos educativos con editor de contenido, sistema de etiquetas, favoritos, likes y comentarios.

### Comunidad (Comunidad.jsx, 692 líneas)
Foro de interacción entre pacientes con publicaciones que soportan imágenes, reacciones emotivas (5 tipos), comentarios y temas categorizados.

### Expediente clínico (Expediente.jsx, 520 líneas)
Expediente centralizado con datos personales, diagnósticos, tratamientos activos, bitácoras consolidadas y sección de archivos. Funcionalidad de compartir expediente mediante enlace temporal de 72 horas con token único.

### Recordatorios (Recordatorios.jsx, 518 líneas)
Sistema de recordatorios configurables para medicamentos, citas, ejercicios y actividades terapéuticas.

### Configuración (Configuracion.jsx, 637 líneas)
Panel de preferencias del usuario incluyendo datos de perfil, cambio de contraseña, configuración de notificaciones y exportación de datos.

## 12. Sistema de admisiones

El sistema de admisiones (`AdmisionesTab.jsx`, 1,358 líneas frontend; `AdmisionesController.php`, 946 líneas backend) implementa un pipeline de 6 etapas para gestionar el ingreso de nuevos pacientes:

### Pipeline de admisión

1. **Solicitud recibida**: El solicitante llena un formulario público (`Solicitud.jsx`, 422 líneas) con datos personales, tipo de servicio (órtesis, prótesis, protocolo), datos clínicos (tipo y causa de amputación, preguntas de screening) y se le asigna un folio automático (SOL-XXXXX). Se envía correo de confirmación con liga para consultar estatus.

2. **Screening**: El administrador revisa los datos clínicos y aprueba o rechaza la solicitud. Al aprobar, se envía correo informando al solicitante que debe esperar la referencia de pago.

3. **Pago**: El administrador marca como "Pagado" ($500 MXN por preconsulta). El sistema genera automáticamente un token de subida de documentos con vigencia de 72 horas y envía correo con el enlace.

4. **Documentos**: El solicitante sube sus documentos (estudios de laboratorio, radiografías, comprobante de domicilio) a través del enlace temporal (`SubirDocumentos.jsx`, 339 líneas). Al recibir los documentos, se envía correo de confirmación.

5. **Preconsulta**: El administrador programa fecha y hora de preconsulta. Se envía correo con los detalles de la cita.

6. **Admitido**: Tras la preconsulta, el administrador admite al paciente. El sistema genera automáticamente credenciales de acceso (usuario + contraseña temporal) y envía correo de bienvenida.

### Reportes semestrales

El módulo de reportes (`getReporteSemestral()`) genera estadísticas por semestre:
- Total de solicitudes recibidas
- Total de preconsultas programadas
- Preconsultas donde el paciente asistió
- Ingresos por preconsultas ($500 x preconsulta asistida)
- Total de pacientes admitidos
- Tasa de admisión
- Distribución por sexo, edad y procedencia
- Exportación a PDF con gráficas

## 13. Sistema de correos electrónicos

El servicio de correos (`EmailService.php`, 770 líneas) implementa envío SMTP mediante PHPMailer con plantillas HTML responsivas para cada etapa del proceso:

- Confirmación de solicitud recibida (con liga de consulta de estatus)
- Screening aprobado (indicación de esperar referencia de pago)
- Pago confirmado (enlace para subir documentos)
- Documentos recibidos
- Preconsulta programada (fecha, hora, indicaciones)
- Admisión confirmada (credenciales de acceso)
- Solicitud rechazada (con motivo)
- Recuperación de contraseña

Cada plantilla utiliza un layout HTML con encabezado de color según el tipo de notificación, logotipo, contenido estructurado y pie de página con datos de contacto de la UIOP.

## 14. Integración, pruebas y despliegue

### Pruebas funcionales

Se realizaron pruebas funcionales manuales de cada módulo, verificando:
- Flujos completos de lectura y escritura de datos
- Manejo de errores y validaciones de formularios
- Responsividad en dispositivos móviles (iPhone SE, iPad, desktop)
- Funcionamiento del panel de accesibilidad
- Flujo completo del pipeline de admisiones

### Despliegue

El despliegue en producción se realizó en el servidor dtai.uteq.edu.mx mediante transferencia SFTP con la biblioteca Paramiko de Python. La configuración de producción incluye:
- Frontend: build de React desplegado en `/home/aazaria/public_html/`
- Backend: archivos PHP desplegados en `/home/aazaria/public_html/api/`
- Base de datos: MySQL en el servidor con nombre `bd_azaria`
- Homepage configurada en `package.json`: `/~azaria/`

---

# Análisis de los resultados

En este capítulo se analiza el cumplimiento de los objetivos planteados y los resultados obtenidos con la implementación de la plataforma Azaria.

## Cumplimiento de objetivos

### Objetivo específico 1: Base de datos con mínimo 60 tablas
**Resultado: Cumplido al 115%.** Se implementaron 69 tablas (9 más de las 60 planificadas), además de 4 vistas, 3 eventos programados y 2 procedimientos almacenados. Las tablas adicionales surgieron de requerimientos identificados durante el desarrollo iterativo, como las tablas de cuestionarios personalizados, mediciones de muñón y screening clínico.

### Objetivo específico 2: 10 módulos clínicos completos
**Resultado: Cumplido al 100%.** Los 10 módulos clínicos planificados (nutrición, fisioterapia, neuropsicología, ortesis, medicina, citas, chat, expediente clínico, comunidad y blog) se desarrollaron con funcionalidad completa de lectura y escritura de datos. Adicionalmente, se implementaron módulos no planificados originalmente como el generador de planes nutricionales en PDF y el catálogo de recetas.

### Objetivo específico 3: Sistema de admisiones con 6 etapas y correos automáticos
**Resultado: Cumplido al 100%.** El pipeline de admisiones implementa las 6 etapas definidas (solicitud, screening, pago, documentos, preconsulta, admisión) con notificaciones automáticas por correo electrónico en cada transición. Se agregaron funcionalidades adicionales como el formulario público de solicitud, la consulta de estatus por folio, la subida de documentos por enlace temporal y los reportes semestrales con cálculo de ingresos.

### Objetivo específico 4: Sistema de accesibilidad con 10+ opciones
**Resultado: Cumplido al 130%.** Se implementaron 13 opciones de accesibilidad configurables (3 más de las 10 planificadas), incluyendo el asistente de voz narrador (VoiceHelper.jsx, 551 líneas) que no estaba contemplado en la planificación original.

### Objetivo específico 5: Tres roles diferenciados con 100% rutas protegidas
**Resultado: Cumplido al 100%.** Los tres roles (paciente, especialista, administrador) cuentan con dashboards y funcionalidades específicas. El 100% de las rutas que requieren autenticación están protegidas por el AuthMiddleware. El frontend implementa `ProtectedRoute` y `RoleBasedRoute` para el control de acceso en el lado del cliente.

### Objetivo específico 6: Despliegue en producción con 100% módulos funcionales
**Resultado: Cumplido al 95%.** La plataforma se encuentra desplegada y funcional en dtai.uteq.edu.mx/~azaria/. El módulo de Fases de tratamiento (1 de 20) quedó con implementación parcial (backend parcialmente desarrollado, frontend básico), representando el único módulo no completado al 100%.

## Métricas del sistema

**Tabla 6**
*Métricas cuantitativas del sistema Azaria.*

| Métrica | Valor |
|---|---|
| Líneas de código totales | 77,965 |
| Líneas backend (PHP) | 44,118 |
| Líneas frontend (JSX/JS) | 33,847 |
| Líneas CSS | 21,434 |
| Tablas en base de datos | 69 |
| Vistas SQL | 4 |
| Eventos programados | 3 |
| Procedimientos almacenados | 2 |
| Rutas API | 248 |
| Controladores backend | 26 |
| Modelos backend | 31 |
| Servicios backend | 14 |
| Páginas frontend | 27 |
| Componentes React | 48 |
| Archivos CSS | 25 |
| Migraciones de BD | 21 |
| Módulos funcionales | 19 de 20 |

## Comparación con trabajos similares

A diferencia de las soluciones existentes en el mercado (Physitrack, Kaia Health, MyFitnessPal), la plataforma Azaria se distingue por:

1. **Integración multidisciplinaria:** Cubre 5 especialidades clínicas en una sola plataforma, mientras que las soluciones comerciales se enfocan en una sola disciplina.
2. **Accesibilidad específica:** Diseñada para adultos mayores con 13 opciones de personalización, frente a las opciones limitadas de las aplicaciones comerciales.
3. **Pipeline de admisiones:** Ninguna de las plataformas revisadas incluye un sistema de gestión de admisiones con trazabilidad y notificaciones automatizadas.
4. **Código abierto y desplegable en infraestructura universitaria:** No depende de servicios en la nube comerciales ni requiere suscripciones mensuales.

---

# Conclusiones

El desarrollo de la plataforma Azaria permitió alcanzar el objetivo general de proveer a la Unidad de Investigación en Órtesis y Prótesis (UIOP) una herramienta digital integral para la gestión de la adherencia terapéutica de sus pacientes en rehabilitación protésica. A continuación se presentan las conclusiones principales del proyecto.

Se logró construir un sistema funcional de 77,965 líneas de código que integra 19 de los 20 módulos planificados, con una cobertura del 95% de las funcionalidades definidas en los requerimientos iniciales. El único módulo con implementación parcial (Fases de tratamiento) no representa una limitación operativa para el uso actual del sistema, ya que su funcionalidad se encuentra parcialmente cubierta por el expediente clínico y el dashboard del especialista.

La decisión de utilizar PHP sin framework, si bien incrementó el volumen de código a escribir respecto a una solución basada en Laravel o Symfony, proporcionó un control total sobre la arquitectura del sistema y facilitó el despliegue en un servidor universitario compartido con restricciones de configuración. Esta decisión demostró ser acertada para el contexto específico del proyecto.

El enfoque de accesibilidad para adultos mayores resultó ser uno de los aspectos más valorados por el equipo clínico de la UIOP. La tipografía base de 18 píxeles, los controles táctiles de mínimo 48 píxeles, el tema oscuro y el asistente de voz integrado fueron mencionados como elementos diferenciadores frente a otras soluciones evaluadas previamente.

El sistema de admisiones con pipeline automatizado representó un aporte significativo a la eficiencia administrativa de la unidad, al reducir el tiempo de procesamiento de solicitudes y proporcionar trazabilidad completa del estado de cada trámite.

Como trabajo futuro se identifica la necesidad de completar el módulo de Fases de tratamiento, implementar notificaciones push nativas del navegador, agregar pruebas unitarias y de integración automatizadas, y desarrollar un módulo de telemedicina con videollamadas integradas.

La experiencia adquirida durante la estadía profesional consolidó competencias en desarrollo full-stack, diseño de bases de datos relacionales, implementación de APIs RESTful, diseño de interfaces accesibles y gestión de despliegues en servidores de producción, todas ellas directamente alineadas con el perfil de egreso de la Ingeniería en Desarrollo y Gestión de Software.

---

# Referencias

American Psychological Association. (2020). *Publication manual of the American Psychological Association* (7a ed.). American Psychological Association.

Axios. (2023). *Axios HTTP client documentation*. https://axios-http.com/docs/intro

Chart.js. (2024). *Chart.js documentation* (versión 4.4). https://www.chartjs.org/docs/latest/

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* [Tesis doctoral, University of California, Irvine].

Meta Open Source. (2024). *React documentation* (versión 18.2). https://react.dev/

MySQL. (2024). *MySQL 8.0 Reference Manual*. Oracle Corporation. https://dev.mysql.com/doc/refman/8.0/en/

Organización Mundial de la Salud. (2003). *Adherencia a los tratamientos a largo plazo: pruebas para la acción*. OMS. https://www.who.int/chp/knowledge/publications/adherence_report/en/

PHP Group. (2024). *PHP 8.1 Documentation*. https://www.php.net/docs.php

PHPMailer. (2024). *PHPMailer documentation*. https://github.com/PHPMailer/PHPMailer

React Router. (2024). *React Router v6 documentation*. https://reactrouter.com/en/main

Sommerville, I. (2016). *Software Engineering* (10a ed.). Pearson Education.

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium. https://www.w3.org/TR/WCAG21/

---

# Apéndices

## Apéndice A: Lista completa de controladores del backend

| # | Controlador | Líneas | Responsabilidad |
|---|---|---|---|
| 1 | PlanNutricionalController.php | 2,630 | Generación y gestión de planes nutricionales |
| 2 | AdmisionesController.php | 946 | Pipeline de admisiones y reportes |
| 3 | OrtesisController.php | 832 | Dispositivos, mediciones, protocolo, adaptación |
| 4 | NeuropsicologiaController.php | 716 | Evaluaciones cognitivas, ACT, cuestionarios |
| 5 | CitasController.php | 515 | Agendamiento y gestión de citas |
| 6 | ExpedienteController.php | 477 | Expediente clínico y compartición |
| 7 | MedicinaController.php | 448 | Bitácoras de salud y medicamentos |
| 8 | OutlookCalendarController.php | 423 | Sincronización con Microsoft Outlook |
| 9 | NutricionController.php | 411 | Registro de comidas, IMC, recetas |
| 10 | FisioterapiaController.php | 404 | Evaluaciones físicas y ejercicios |
| 11 | MensajesController.php | 392 | Chat y conversaciones |
| 12 | GeneradorPlanController.php | 358 | Generador de planes nutricionales PDF |
| 13 | AdminController.php | 349 | Panel de administración |
| 14 | EspecialistaController.php | 330 | Dashboard del especialista |
| 15 | RecetaController.php | 320 | Catálogo de recetas |
| 16 | ComunidadController.php | 297 | Foro de comunidad |
| 17 | ConfiguracionController.php | 254 | Preferencias de usuario |
| 18 | AuthController.php | 251 | Autenticación y sesiones |
| 19 | AntropometriaController.php | 164 | Mediciones antropométricas |
| 20 | BlogController.php | 170 | Artículos y contenido educativo |
| 21 | RecordatoriosController.php | 126 | Sistema de recordatorios |
| 22 | FAQController.php | 122 | Preguntas frecuentes |
| 23 | PerfilController.php | 99 | Perfil de usuario |
| 24 | DashboardController.php | 97 | Dashboard general |
| 25 | ChatController.php | 84 | Gestión de chats |
| 26 | FaseController.php | 64 | Fases de tratamiento |

## Apéndice B: Lista completa de tablas de la base de datos

| # | Tabla | Grupo funcional |
|---|---|---|
| 1 | alertas_medicas | Medicina |
| 2 | areas_medicas | Sistema |
| 3 | articulos | Contenido |
| 4 | articulos_etiquetas | Contenido |
| 5 | articulos_favoritos | Contenido |
| 6 | asignaciones_especialista | Usuarios |
| 7 | bitacora_dolor | Medicina |
| 8 | bitacora_glucosa | Medicina |
| 9 | bitacora_presion | Medicina |
| 10 | categorias_ejercicio | Fisioterapia |
| 11 | checklist_comidas | Nutrición |
| 12 | checklist_protesis | Ortesis |
| 13 | citas | Citas |
| 14 | comentarios_articulo | Contenido |
| 15 | comentarios_comunidad | Comunidad |
| 16 | configuracion_sistema | Sistema |
| 17 | conversaciones | Comunicación |
| 18 | cuestionarios_bienestar | Neuropsicología |
| 19 | cuestionarios_nutricion | Nutrición |
| 20 | disponibilidad_especialista | Usuarios |
| 21 | dispositivos_paciente | Ortesis |
| 22 | emociones | Neuropsicología |
| 23 | etiquetas | Contenido |
| 24 | faqs | FAQ |
| 25 | fases_tratamiento | Tratamiento |
| 26 | guias_cuidado | Ortesis |
| 27 | historial_ajustes | Ortesis |
| 28 | historial_fases | Tratamiento |
| 29 | historial_recordatorios | Sistema |
| 30 | horarios_medicamento | Medicina |
| 31 | imagenes_publicacion | Comunidad |
| 32 | likes_articulo | Contenido |
| 33 | log_accesos | Seguridad |
| 34 | log_auditoria | Seguridad |
| 35 | medicamentos_paciente | Medicina |
| 36 | mensajes_chat | Comunicación |
| 37 | momentos_medicion | Citas |
| 38 | niveles_ejercicio | Fisioterapia |
| 39 | notificaciones | Comunicación |
| 40 | pacientes | Usuarios |
| 41 | preferencias_notificacion | Sistema |
| 42 | publicaciones_comunidad | Comunidad |
| 43 | reacciones_publicacion | Comunidad |
| 44 | recetas | Nutrición |
| 45 | recetas_asignadas | Nutrición |
| 46 | recetas_favoritas | Nutrición |
| 47 | recordatorios | Sistema |
| 48 | registro_animo | Neuropsicología |
| 49 | registro_animo_emociones | Neuropsicología |
| 50 | registro_comidas | Nutrición |
| 51 | registro_medicamentos | Medicina |
| 52 | registro_videos | Fisioterapia |
| 53 | reportes_contenido | Sistema |
| 54 | reportes_problemas | Sistema |
| 55 | roles | Usuarios |
| 56 | sesiones | Autenticación |
| 57 | temas_comunidad | Comunidad |
| 58 | tipos_cita | Citas |
| 59 | tipos_comida | Nutrición |
| 60 | tipos_dispositivo | Ortesis |
| 61 | tipos_dolor | Medicina |
| 62 | tipos_reaccion | Comunidad |
| 63 | tipos_recordatorio | Sistema |
| 64 | tokens_recuperacion | Autenticación |
| 65 | ubicaciones_dolor | Medicina |
| 66 | usuarios | Usuarios |
| 67 | videos_asignados | Fisioterapia |
| 68 | videos_ejercicios | Fisioterapia |
| 69 | votos_faq | FAQ |

## Apéndice C: Estructura de directorios del proyecto

```
Azaria/
├── backend/                        # 44,118 líneas PHP
│   ├── config/
│   │   ├── constants.php
│   │   └── database.php
│   ├── public/
│   │   └── index.php
│   ├── src/
│   │   ├── Controllers/            # 26 controladores (11,279 líneas)
│   │   ├── Middleware/
│   │   │   └── AuthMiddleware.php
│   │   ├── Models/                 # 31 modelos (3,313 líneas)
│   │   ├── Routes/
│   │   │   └── api.php             # 248 rutas
│   │   ├── Services/               # 14 servicios (2,820 líneas)
│   │   └── Utils/
│   │       └── Response.php
│   └── uploads/
├── database/
│   ├── azaria_db.sql               # 1,668 líneas
│   └── migrations/                 # 21 archivos
├── frontend/                       # 33,847 líneas JSX/JS
│   ├── public/
│   │   ├── manifest.json
│   │   ├── service-worker.js
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── components/             # 48 componentes (15,266 líneas)
│   │   │   ├── accessibility/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── fisioterapia/
│   │   │   ├── layouts/
│   │   │   ├── neuropsicologia/
│   │   │   ├── nutricion/
│   │   │   ├── ortesis/
│   │   │   ├── outlook/
│   │   │   └── shared/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── AccessibilityContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── pages/                  # 27 páginas (16,594 líneas)
│   │   │   ├── admin/
│   │   │   ├── especialista/
│   │   │   └── paciente/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── perfilService.js
│   │   ├── styles/                 # 25 archivos CSS (21,434 líneas)
│   │   └── utils/
│   │       └── constants.js
│   └── package.json
└── Lineamientos/                   # Documentos de diseño
```

## Apéndice D: Capturas de pantalla del sistema

[NOTA: Insertar capturas de pantalla de las siguientes vistas:]
1. Pantalla de login
2. Dashboard del paciente
3. Dashboard del especialista
4. Dashboard del administrador
5. Módulo de nutrición - registro de comidas
6. Módulo de medicina - bitácora de glucosa
7. Módulo de fisioterapia - ejercicios asignados
8. Módulo de neuropsicología - cuestionario activo
9. Módulo de ortesis - dispositivos
10. Sistema de admisiones - pipeline
11. Panel de accesibilidad
12. Formulario público de solicitud
13. Vista móvil (responsive)
