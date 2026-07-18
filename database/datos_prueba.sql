-- =====================================================
-- DATOS DE PRUEBA - SISTEMA AZARIA 2.0
-- Ejecutar después de azaria_db.sql
-- =====================================================

USE vitalia_v2;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. USUARIOS DEL SISTEMA
-- =====================================================
-- Contraseña para todos: "123456" (hash bcrypt)
-- Hash generado con password_hash('123456', PASSWORD_BCRYPT)

-- Administrador (rol_id = 1)
INSERT INTO usuarios (id, email, password_hash, pin_hash, nombre_completo, fecha_nacimiento, rol_id, area_medica_id, activo, primer_acceso, email_verificado) VALUES
(1, 'admin@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Administrador Sistema', '1985-03-15', 1, NULL, 1, 0, 1);

-- Especialistas (rol_id = 2) - Uno por cada área médica
-- area_medica_id: 1=fisioterapia, 2=nutricion, 3=medicina, 4=neuropsicologia, 5=ortesis
INSERT INTO usuarios (id, email, password_hash, pin_hash, nombre_completo, fecha_nacimiento, rol_id, area_medica_id, activo, primer_acceso, email_verificado) VALUES
(2, 'dr.garcia@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Dr. Carlos García López', '1978-06-20', 2, 1, 1, 0, 1),
(3, 'dra.martinez@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Dra. María Martínez Ruiz', '1982-09-10', 2, 2, 1, 0, 1),
(4, 'lic.rodriguez@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Lic. Ana Rodríguez Sánchez', '1990-01-25', 2, 3, 1, 0, 1),
(5, 'psic.hernandez@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Psic. Roberto Hernández', '1988-11-30', 2, 4, 1, 0, 1),
(6, 'tec.sanchez@azaria.app', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'Téc. Laura Sánchez Mora', '1992-04-18', 2, 5, 1, 0, 1);

-- Pacientes (rol_id = 3)
INSERT INTO usuarios (id, email, password_hash, pin_hash, nombre_completo, fecha_nacimiento, rol_id, area_medica_id, activo, primer_acceso, email_verificado, usar_pin) VALUES
(7, 'paciente1@test.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Juan Pérez González', '1955-08-12', 3, NULL, 1, 0, 1, 1),
(8, 'paciente2@test.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'María López Vega', '1960-12-03', 3, NULL, 1, 0, 1, 1),
(9, 'paciente3@test.com', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Roberto Díaz Mendoza', '1958-05-22', 3, NULL, 1, 0, 1, 1);

-- =====================================================
-- 2. PACIENTES (tabla pacientes)
-- =====================================================
-- fase_actual_id: 1=Evaluación Inicial, 2=Adaptación, 3=Seguimiento Activo, 4=Autonomía

INSERT INTO pacientes (id, usuario_id, fase_actual_id, fecha_cambio_fase, progreso_general) VALUES
(1, 7, 3, '2024-10-01', 65.00),
(2, 8, 2, '2024-11-01', 40.00),
(3, 9, 3, '2024-09-15', 80.00);

-- =====================================================
-- 3. ASIGNACIONES ESPECIALISTA-PACIENTE
-- =====================================================

INSERT INTO asignaciones_especialista (paciente_id, especialista_id, area_medica_id, activo, fecha_asignacion, asignado_por) VALUES
-- Paciente 1 (Juan) - asignado a todos los especialistas
(1, 2, 1, 1, '2024-06-15', 1),  -- Fisioterapia
(1, 3, 2, 1, '2024-06-15', 1),  -- Nutrición
(1, 4, 3, 1, '2024-06-15', 1),  -- Medicina
(1, 5, 4, 1, '2024-06-15', 1),  -- Neuropsicología
(1, 6, 5, 1, '2024-06-15', 1),  -- Órtesis
-- Paciente 2 (María)
(2, 2, 1, 1, '2024-03-20', 1),
(2, 3, 2, 1, '2024-03-20', 1),
(2, 4, 3, 1, '2024-03-20', 1),
-- Paciente 3 (Roberto)
(3, 2, 1, 1, '2024-08-10', 1),
(3, 3, 2, 1, '2024-08-10', 1),
(3, 6, 5, 1, '2024-08-10', 1);

-- =====================================================
-- 4. DISPOSITIVOS DE PACIENTES (Órtesis/Prótesis)
-- =====================================================
-- tipo_dispositivo_id: 1=protesis_miembro_inferior, 2=protesis_miembro_superior

INSERT INTO dispositivos_paciente (id, paciente_id, tipo_dispositivo_id, fecha_entrega, marca, modelo, numero_serie, notas, activo) VALUES
(1, 1, 1, '2024-10-15', 'Ottobock', '1C30 Trias', 'OB-2024-001', 'Prótesis transtibial con pie de carbono', 1),
(2, 3, 1, '2024-11-01', 'Össur', 'Pro-Flex XC', 'OS-2024-002', 'Prótesis transtibial, adaptación en proceso', 1);

-- =====================================================
-- 5. CITAS MÉDICAS
-- =====================================================
-- tipo_cita_id: 1=primera_vez, 2=seguimiento, 3=urgencia
-- estado: programada, confirmada, completada, cancelada, no_asistio

-- Citas pasadas (completadas)
INSERT INTO citas (paciente_id, especialista_id, area_medica_id, tipo_cita_id, fecha, hora_inicio, hora_fin, motivo, estado, notas_consulta) VALUES
(1, 2, 1, 2, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:00:00', '10:00:00', 'Revisión de avance en fisioterapia', 'completada', 'Paciente muestra buen progreso. Continuar con ejercicios asignados.'),
(1, 3, 2, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '10:00:00', '10:45:00', 'Control nutricional mensual', 'completada', 'Peso estable. Ajustar dieta para mejorar energía.'),
(2, 4, 3, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '11:00:00', '11:30:00', 'Control de medicamentos', 'completada', 'Continuar con tratamiento actual.');

-- Citas futuras (programadas/confirmadas)
INSERT INTO citas (paciente_id, especialista_id, area_medica_id, tipo_cita_id, fecha, hora_inicio, hora_fin, motivo, estado) VALUES
(1, 2, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '10:00:00', 'Sesión de fisioterapia semanal', 'confirmada'),
(1, 5, 4, 2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '14:00:00', '14:45:00', 'Evaluación psicológica mensual', 'programada'),
(2, 3, 2, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', '10:45:00', 'Consulta de nutrición', 'confirmada'),
(3, 6, 5, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:00:00', 'Ajuste de prótesis', 'confirmada'),
(3, 2, 1, 2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', '12:00:00', 'Evaluación de marcha', 'programada');

-- =====================================================
-- 6. VIDEOS DE EJERCICIOS (Fisioterapia)
-- =====================================================
-- nivel_id: 1=basico, 2=intermedio, 3=avanzado
-- categoria_id: 1=fortalecimiento, 2=estiramiento, 3=balance, 4=cardio

INSERT INTO videos_ejercicios (id, titulo, descripcion, youtube_url, youtube_video_id, duracion_minutos, nivel_id, categoria_id, instrucciones, precauciones, creado_por, publicado) VALUES
(1, 'Ejercicios de fortalecimiento de muñón - Nivel básico', 'Ejercicios esenciales para fortalecer los músculos del muñón después de la amputación', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 15, 1, 1, 'Realizar 3 series de 10 repeticiones. Descansar 30 segundos entre series.', 'Detener si hay dolor intenso', 2, 1),
(2, 'Ejercicios de equilibrio con prótesis', 'Rutina para mejorar el equilibrio al usar la prótesis', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 20, 2, 3, 'Usar apoyo cerca. Realizar frente a un espejo para verificar postura.', 'Tener superficie de apoyo cerca', 2, 1),
(3, 'Marcha con prótesis - Técnica básica', 'Aprende la técnica correcta de marcha con tu nueva prótesis', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 25, 2, 3, 'Comenzar con barras paralelas. Avanzar gradualmente a bastón y luego sin apoyo.', 'No forzar la marcha', 2, 1),
(4, 'Estiramientos para amputados', 'Rutina de estiramientos para prevenir contracturas', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 12, 1, 2, 'Mantener cada estiramiento 30 segundos. No rebotar.', 'Evitar estiramientos bruscos', 2, 1),
(5, 'Ejercicios de respiración y relajación', 'Técnicas de respiración para manejar el dolor y la ansiedad', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 10, 1, 2, 'Realizar en un lugar tranquilo. Ideal antes de dormir.', NULL, 5, 1);

-- =====================================================
-- 7. VIDEOS ASIGNADOS A PACIENTES
-- =====================================================

INSERT INTO videos_asignados (paciente_id, video_id, asignado_por, frecuencia_recomendada, repeticiones, notas, activo) VALUES
(1, 1, 2, 'Lunes, Miércoles, Viernes', '3 series x 10 rep', 'Aumentar gradualmente las repeticiones', 1),
(1, 2, 2, 'Martes, Jueves', '3 series x 8 rep', 'Usar apoyo si es necesario', 1),
(1, 4, 2, 'Diario', '1 vez', 'Realizar al despertar', 1),
(3, 1, 2, 'Lunes, Miércoles, Viernes', '2 series x 8 rep', 'Comenzar con pocas repeticiones', 1),
(3, 3, 2, 'Martes, Jueves, Sábado', '15 minutos', 'Practicar 15 minutos', 1);

-- =====================================================
-- 8. RECETAS DE NUTRICIÓN
-- =====================================================
-- tipo_comida_id: 1=desayuno, 2=colacion_matutina, 3=comida, 4=colacion_vespertina, 5=cena

INSERT INTO recetas (id, titulo, descripcion, ingredientes, instrucciones, tiempo_preparacion, porciones, calorias, proteinas, carbohidratos, grasas, tipo_comida_id, creado_por, publicada) VALUES
(1, 'Desayuno energético proteico', 'Ideal para comenzar el día con energía durante la rehabilitación',
'["2 huevos", "1 rebanada de pan integral", "1/2 aguacate", "1 taza de espinacas", "Sal y pimienta al gusto"]',
'["Cocinar los huevos revueltos a fuego medio", "Tostar el pan integral", "Servir con aguacate rebanado y espinacas frescas", "Sazonar al gusto"]',
15, 1, 350.00, 18.00, 25.00, 20.00, 1, 3, 1),

(2, 'Pollo a la plancha con verduras', 'Almuerzo balanceado y fácil de preparar',
'["150g pechuga de pollo", "1 taza de brócoli", "1/2 taza de zanahoria", "1 cucharada de aceite de oliva", "Hierbas al gusto"]',
'["Sazonar el pollo con hierbas", "Cocinar a la plancha 6-7 minutos por lado", "Cocer las verduras al vapor", "Servir juntos"]',
25, 1, 320.00, 35.00, 15.00, 12.00, 3, 3, 1),

(3, 'Licuado de recuperación', 'Bebida ideal post-ejercicio para recuperación muscular',
'["1 plátano", "1 taza de leche descremada", "2 cucharadas de avena", "1 cucharada de mantequilla de maní", "Canela al gusto"]',
'["Colocar todos los ingredientes en la licuadora", "Licuar hasta obtener consistencia homogénea", "Servir inmediatamente"]',
5, 1, 280.00, 12.00, 40.00, 8.00, 2, 3, 1),

(4, 'Ensalada mediterránea', 'Cena ligera rica en nutrientes',
'["2 tazas de lechuga mixta", "1/2 taza de tomate cherry", "1/4 taza de pepino", "30g queso feta", "1 cucharada de aceite de oliva", "Orégano"]',
'["Lavar y cortar las verduras", "Mezclar en un bowl", "Agregar queso feta", "Aderezar con aceite y orégano"]',
10, 1, 180.00, 8.00, 12.00, 12.00, 5, 3, 1);

-- =====================================================
-- 9. RECETAS ASIGNADAS A PACIENTES
-- =====================================================

INSERT INTO recetas_asignadas (paciente_id, receta_id, asignado_por, notas_personalizadas, activo) VALUES
(1, 1, 3, 'Ideal para días de ejercicio', 1),
(1, 2, 3, 'Reducir sal por hipertensión', 1),
(1, 4, 3, 'Cena ligera recomendada', 1),
(3, 1, 3, NULL, 1),
(3, 3, 3, 'Tomar después de fisioterapia', 1);

-- =====================================================
-- 10. BITÁCORA DE GLUCOSA
-- =====================================================
-- momento_id: 1=ayuno, 2=post_desayuno, 3=pre_comida, 4=post_comida, 5=pre_cena, 6=post_cena, 7=antes_dormir

INSERT INTO bitacora_glucosa (paciente_id, valor, momento_id, notas, fecha, hora) VALUES
(1, 95.0, 1, 'Nivel normal', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:00:00'),
(1, 140.0, 4, 'Después del almuerzo', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:30:00'),
(1, 110.0, 7, NULL, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '22:00:00'),
(1, 98.0, 1, 'Buen control', CURDATE(), '07:15:00'),
(3, 105.0, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '06:45:00'),
(3, 165.0, 4, 'Comí más carbohidratos de lo normal', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '14:00:00'),
(3, 92.0, 1, 'Excelente', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:00:00'),
(3, 135.0, 4, 'Dentro de rango', CURDATE(), '14:15:00');

-- =====================================================
-- 11. BITÁCORA DE PRESIÓN ARTERIAL
-- =====================================================

INSERT INTO bitacora_presion (paciente_id, sistolica, diastolica, pulso, notas, fecha, hora) VALUES
(1, 125, 82, 72, 'Normal', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00'),
(1, 130, 85, 75, 'Ligeramente elevada', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:30:00'),
(1, 122, 78, 70, 'Controlada', CURDATE(), '08:00:00'),
(3, 138, 88, 78, 'Tomar medicamento', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:30:00'),
(3, 128, 82, 74, 'Mejorando', CURDATE(), '07:45:00');

-- =====================================================
-- 12. BITÁCORA DE DOLOR
-- =====================================================
-- ubicacion_id: 1=munon, 2=rodilla, 3=cadera, 4=espalda...
-- tipo_dolor_id: 1=punzante, 2=sordo, 3=quemante, 4=pulsatil, 5=hormigueo, 6=calambres

INSERT INTO bitacora_dolor (paciente_id, intensidad, ubicacion_id, tipo_dolor_id, notas, fecha, hora) VALUES
(1, 3, 1, 2, 'Dolor leve después de ejercicios', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:00:00'),
(1, 2, 1, 5, 'Sensación fantasma leve', CURDATE(), '10:00:00'),
(2, 5, 1, 4, 'Dolor moderado en la noche', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '23:00:00'),
(2, 4, 1, 5, 'Sensación de pie que no existe', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '21:00:00'),
(3, 2, 1, 1, 'Solo al caminar mucho', CURDATE(), '17:00:00');

-- =====================================================
-- 13. REGISTRO DE ESTADO DE ÁNIMO
-- =====================================================

INSERT INTO registro_animo (id, paciente_id, nivel_animo, nivel_motivacion, nivel_energia, notas, fecha) VALUES
(1, 1, 4, 4, 3, 'Buen día de ejercicios', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2, 1, 5, 5, 4, 'Logré caminar sin apoyo', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(3, 1, 4, 4, 4, 'Familia me visitó', CURDATE()),
(4, 2, 3, 2, 3, 'Nervioso por la próxima cita', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(5, 2, 3, 3, 3, 'Día normal', CURDATE()),
(6, 3, 4, 4, 4, 'Me adapto bien a la prótesis', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(7, 3, 2, 2, 2, 'Tropecé hoy', CURDATE());

-- Emociones asociadas a los registros de ánimo
-- emocion_id: 1=tristeza, 2=alegria, 3=ansiedad, 4=frustracion, 5=esperanza, 6=miedo, 7=calma, 8=enojo, 9=gratitud, 10=confusion, 11=motivacion, 12=soledad

INSERT INTO registro_animo_emociones (registro_animo_id, emocion_id) VALUES
(1, 7),   -- calma
(2, 2),   -- alegria
(2, 9),   -- gratitud
(3, 9),   -- gratitud
(4, 3),   -- ansiedad
(5, 7),   -- calma
(6, 5),   -- esperanza
(6, 11),  -- motivacion
(7, 4);   -- frustracion

-- =====================================================
-- 14. RECORDATORIOS
-- =====================================================
-- tipo_id: 1=medicina, 2=nutricion, 3=fisioterapia, 4=cita, 5=cuestionario, 6=medicamento

INSERT INTO recordatorios (usuario_id, tipo_id, hora, dias_semana, mensaje_personalizado, activo) VALUES
(7, 6, '08:00:00', '["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]', 'Tomar Metformina 500mg con el desayuno', 1),
(7, 6, '08:00:00', '["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]', 'Tomar Losartán 50mg para presión', 1),
(7, 3, '10:00:00', '["lunes","miercoles","viernes"]', 'Ejercicios de fortalecimiento de muñón', 1),
(7, 1, '07:00:00', '["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]', 'Medir glucosa en ayunas', 1),
(9, 6, '08:00:00', '["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]', 'Tomar Metformina 850mg', 1),
(9, 3, '11:00:00', '["martes","jueves","sabado"]', 'Práctica de marcha con prótesis', 1);

-- =====================================================
-- 15. FAQs
-- =====================================================
-- area_medica_id: 1=fisioterapia, 2=nutricion, 3=medicina, 4=neuropsicologia, 5=ortesis

INSERT INTO faqs (pregunta, respuesta, area_medica_id, orden, publicada, creado_por) VALUES
('¿Cuántas horas al día debo usar mi prótesis al inicio?', 'Al principio, se recomienda usar la prótesis de 1 a 2 horas, aumentando gradualmente 30 minutos cada día según tolerancia. Tu especialista te dará indicaciones específicas.', 5, 1, 1, 6),
('¿Qué hago si mi muñón está irritado?', 'Suspende el uso de la prótesis, limpia y seca bien el área, y contacta a tu especialista. No apliques cremas sin autorización médica.', 5, 2, 1, 6),
('¿Cada cuánto debo medir mi glucosa?', 'Generalmente se recomienda medir en ayunas diariamente y 2 horas después de las comidas principales. Tu médico ajustará la frecuencia según tu caso.', 3, 1, 1, 4),
('¿Qué valores de glucosa son normales?', 'En ayunas: 70-100 mg/dL. Después de comer (2 horas): menos de 140 mg/dL. Valores fuera de rango deben reportarse a tu médico.', 3, 2, 1, 4),
('¿Puedo hacer ejercicio si me duele el muñón?', 'Un dolor leve es normal. Si el dolor es intenso (mayor a 5/10), descansa y consulta a tu fisioterapeuta antes de continuar.', 1, 1, 1, 2),
('¿Qué alimentos debo evitar si soy diabético?', 'Evita azúcares refinados, bebidas azucaradas, harinas blancas, y alimentos procesados. Prefiere carbohidratos complejos y controla las porciones.', 2, 1, 1, 3),
('¿Es normal sentir el pie que ya no tengo?', 'Sí, esto se llama "sensación fantasma" y es muy común. Técnicas como la terapia espejo y ejercicios de visualización pueden ayudar a manejarla.', 4, 1, 1, 5),
('¿Cómo puedo manejar la ansiedad sobre mi recuperación?', 'Es normal sentir ansiedad. Practica técnicas de respiración, mantén comunicación con tu equipo de salud, y considera unirte al grupo de apoyo en la comunidad.', 4, 2, 1, 5);

-- =====================================================
-- 16. ARTÍCULOS DEL BLOG
-- =====================================================

INSERT INTO articulos (titulo, slug, resumen, contenido, area_medica_id, autor_id, tiempo_lectura_minutos, publicado, destacado, fecha_publicacion) VALUES
('5 ejercicios esenciales para fortalecer tu muñón',
'ejercicios-fortalecer-munon',
'Descubre los ejercicios fundamentales que te ayudarán a preparar tu muñón para el uso de la prótesis.',
'El fortalecimiento del muñón es crucial para el éxito en el uso de una prótesis. Aquí te presentamos 5 ejercicios que puedes realizar en casa:\n\n**1. Contracciones isométricas**\nAprieta los músculos del muñón durante 5 segundos, relaja por 5 segundos. Repite 10 veces.\n\n**2. Elevaciones laterales**\nAcostado de lado, eleva el muñón hacia el techo. 3 series de 10 repeticiones.\n\n**3. Extensiones de cadera**\nEn posición boca abajo, eleva el muñón hacia atrás. Mantén 3 segundos. 3 series de 10.\n\n**4. Círculos con el muñón**\nRealiza círculos pequeños en el aire. 10 en cada dirección.\n\n**5. Resistencia con banda elástica**\nColoca una banda alrededor del muñón y realiza movimientos de extensión.\n\n**Importante:** Realiza estos ejercicios solo después de que tu herida haya sanado completamente.',
1, 2, 5, 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),

('Alimentación para una mejor cicatrización',
'alimentacion-cicatrizacion',
'Conoce los nutrientes esenciales que aceleran la recuperación y fortalecen tu sistema inmune.',
'Una buena alimentación es fundamental para una recuperación exitosa. Estos son los nutrientes que debes priorizar:\n\n**Proteínas**\nFundamentales para la regeneración de tejidos: pollo, pescado, huevos, legumbres.\n\n**Vitamina C**\nEsencial para la síntesis de colágeno: cítricos, guayaba, kiwi, pimientos.\n\n**Zinc**\nAcelera la cicatrización: carnes magras, semillas de calabaza, garbanzos.\n\n**Vitamina A**\nProtege contra infecciones: zanahoria, calabaza, espinacas.\n\n**Hidratación**\nBebe al menos 8 vasos de agua al día.\n\n**Evita:** Azúcares refinados, alimentos procesados, alcohol.',
2, 3, 4, 1, 0, DATE_SUB(NOW(), INTERVAL 3 DAY)),

('Manejando la ansiedad durante tu recuperación',
'manejando-ansiedad-recuperacion',
'Estrategias prácticas para sobrellevar los momentos difíciles durante tu proceso de rehabilitación.',
'Es completamente normal sentir ansiedad después de una amputación. Aquí te compartimos estrategias que pueden ayudarte:\n\n**Técnicas de respiración**\nLa respiración 4-7-8 es muy efectiva: inhala por 4 segundos, mantén por 7, exhala por 8.\n\n**Mindfulness**\nPractica estar en el presente. Cuando notes que tu mente divaga hacia preocupaciones, regresa tu atención al momento actual.\n\n**Grupos de apoyo**\nConectar con personas que han pasado por experiencias similares puede ser muy reconfortante.\n\n**Comunicación abierta**\nHabla con tus seres queridos sobre cómo te sientes.\n\n**Actividad física**\nEl ejercicio, dentro de tus posibilidades, libera endorfinas que mejoran el estado de ánimo.\n\nRecuerda: pedir ayuda es una señal de fortaleza, no de debilidad.',
4, 5, 5, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- =====================================================
-- 17. PUBLICACIONES DE COMUNIDAD
-- =====================================================
-- tema_id: 1=Primera vez, 2=Logros, 3=Superación, 4=Tips, 5=Apoyo, 6=Rutina, 7=Progreso, 8=Agradecimientos, 9=Preguntas

INSERT INTO publicaciones_comunidad (id, usuario_id, tema_id, titulo, contenido, es_anonimo, estado, total_reacciones, total_comentarios) VALUES
(1, 7, 2, 'Mi primer medio kilómetro', '¡Hoy logré caminar 500 metros con mi prótesis sin descansar! Hace 3 meses apenas podía dar 10 pasos. No se rindan, el esfuerzo vale la pena.', 0, 'aprobada', 3, 2),
(2, 8, 9, 'Tips para el dolor fantasma', '¿Alguien tiene tips para el dolor fantasma en las noches? A veces me despierta y no sé qué hacer.', 0, 'aprobada', 2, 2),
(3, 9, 8, 'Gracias a esta comunidad', 'Gracias a todos en este grupo. Cuando me dijeron que necesitaba una prótesis, pensé que mi vida había terminado. Ahora, 6 meses después, me doy cuenta de que apenas está comenzando una nueva etapa.', 0, 'aprobada', 3, 0);

-- =====================================================
-- 18. COMENTARIOS EN COMUNIDAD
-- =====================================================

INSERT INTO comentarios_comunidad (publicacion_id, usuario_id, contenido, es_anonimo, estado) VALUES
(1, 8, '¡Felicidades Juan! Es un gran logro. Sigue así.', 0, 'aprobado'),
(1, 9, 'Eres una inspiración para todos nosotros.', 0, 'aprobado'),
(2, 7, 'A mí me ayuda mucho la técnica de la caja espejo, pregúntale a tu fisioterapeuta.', 0, 'aprobado'),
(2, 9, 'También me pasa. Los ejercicios de respiración antes de dormir me han ayudado.', 0, 'aprobado');

-- =====================================================
-- 19. REACCIONES A PUBLICACIONES
-- =====================================================
-- tipo_reaccion_id: 1=me_gusta, 2=me_inspira, 3=me_identifico, 4=me_motiva, 5=apoyo

INSERT INTO reacciones_publicacion (publicacion_id, usuario_id, tipo_reaccion_id) VALUES
(1, 8, 1),   -- me_gusta
(1, 9, 2),   -- me_inspira
(1, 3, 5),   -- apoyo (de nutrióloga)
(2, 7, 5),   -- apoyo
(2, 9, 1),   -- me_gusta
(3, 7, 1),   -- me_gusta
(3, 8, 3),   -- me_identifico
(3, 2, 5);   -- apoyo (de fisioterapeuta)

-- =====================================================
-- 20. CONVERSACIONES Y MENSAJES DE CHAT
-- =====================================================

INSERT INTO conversaciones (id, paciente_id, especialista_id, ultimo_mensaje_at) VALUES
(1, 1, 2, NOW()),
(2, 2, 3, NOW());

-- Mensajes (expiran en 24h)
INSERT INTO mensajes_chat (conversacion_id, remitente_id, contenido, leido, expira_en) VALUES
(1, 7, 'Dr. García, ¿puedo hacer los ejercicios si me duele un poco el muñón?', 1, DATE_ADD(NOW(), INTERVAL 22 HOUR)),
(1, 2, 'Hola Juan, si el dolor es leve (1-3) puedes continuar. Si aumenta, descansa y me avisas.', 1, DATE_ADD(NOW(), INTERVAL 23 HOUR)),
(1, 7, 'Perfecto, gracias doctor. El dolor es como 2, entonces continuaré.', 0, DATE_ADD(NOW(), INTERVAL 24 HOUR)),
(2, 8, 'Licenciada, ¿puedo sustituir el pollo por atún en la receta?', 1, DATE_ADD(NOW(), INTERVAL 21 HOUR)),
(2, 3, 'Sí María, el atún es una excelente fuente de proteína. Solo asegúrate de que sea en agua, no en aceite.', 0, DATE_ADD(NOW(), INTERVAL 22 HOUR));

-- =====================================================
-- 21. CHECKLIST DE COMIDAS
-- =====================================================

INSERT INTO checklist_comidas (paciente_id, fecha, desayuno, colacion_matutina, comida, colacion_vespertina, cena) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 1, 1, 0, 1),
(1, CURDATE(), 1, 0, 0, 0, 0),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 0, 1, 1, 1),
(3, CURDATE(), 1, 1, 0, 0, 0);

-- =====================================================
-- 22. CHECKLIST DE PRÓTESIS
-- =====================================================

INSERT INTO checklist_protesis (paciente_id, fecha, limpieza_realizada, inspeccion_visual, ajuste_correcto, comodidad_uso, problemas_detectados) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 1, 1, 1, NULL),
(1, CURDATE(), 1, 1, 1, 1, NULL),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 1, 0, 0, 'Ligera molestia en el encaje'),
(3, CURDATE(), 1, 1, 1, 1, NULL);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- RESUMEN DE USUARIOS PARA PRUEBAS
-- =====================================================
/*
USUARIOS DE PRUEBA - Contraseña: 123456 para todos
=================================================

ADMINISTRADOR:
- Email: admin@azaria.app

ESPECIALISTAS:
- dr.garcia@azaria.app (Fisioterapia)
- dra.martinez@azaria.app (Nutrición)
- lic.rodriguez@azaria.app (Medicina)
- psic.hernandez@azaria.app (Neuropsicología)
- tec.sanchez@azaria.app (Órtesis)

PACIENTES:
- paciente1@test.com (Juan Pérez) - PIN: 123456
- paciente2@test.com (María López) - PIN: 123456
- paciente3@test.com (Roberto Díaz) - PIN: 123456

Todos los pacientes tienen:
- Historial médico (glucosa, presión, dolor)
- Citas programadas
- Ejercicios asignados
- Recetas asignadas
- Recordatorios activos
- Publicaciones en comunidad
- Mensajes de chat
*/

SELECT 'Datos de prueba insertados exitosamente' AS resultado;
