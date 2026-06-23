-- Migración: Datos de prueba para módulo de Ortesis
-- Fecha: 2026-03-04

-- 1. Dispositivo para paciente 2 (María López Vega) - NO tiene dispositivo asignado
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, fecha_entrega, marca, modelo, numero_serie, notas, activo)
VALUES (2, 7, '2025-01-20', 'Ottobock', '1C40 C-Walk', 'OB-2025-003', 'Prótesis transtibial con pie SACH, adaptación completada satisfactoriamente', 1);

-- 2. Guías de cuidado (creado_por = 6, Téc. Laura Sánchez - especialista en ortesis)
INSERT INTO guias_cuidado (titulo, tipo, contenido, orden, creado_por, publicado, pasos, tips, advertencias) VALUES
('Limpieza diaria de la prótesis', 'limpieza_diaria',
 'La limpieza diaria es fundamental para mantener la higiene y prolongar la vida útil de su prótesis. Dedique 10-15 minutos cada noche.',
 1, 6, 1,
 '["Retire la prótesis con cuidado y colóquela sobre una superficie limpia","Limpie el encaje (socket) con un paño húmedo y jabón neutro","Seque completamente todas las partes, especialmente el interior del encaje","Revise que no haya grietas, desgaste o partes flojas","Limpie el muñón con agua tibia y jabón, séquelo bien antes de dormir"]',
 '["Use jabón neutro sin perfume para evitar irritaciones","Nunca sumerja componentes electrónicos o mecánicos en agua","Deje secar al aire, no use secadora de pelo en partes plásticas"]',
 '["No use alcohol ni solventes químicos en el encaje","Si detecta grietas o daño, NO use la prótesis y contacte a su especialista"]'),

('Inspección semanal de componentes', 'mantenimiento_semanal',
 'Cada semana realice una revisión más detallada de todos los componentes de su prótesis para detectar desgaste temprano.',
 2, 6, 1,
 '["Revise tornillos y conexiones - apriete si están flojos","Inspeccione la suela del pie protésico buscando desgaste irregular","Verifique que el sistema de suspensión funcione correctamente","Revise el liner o calcetín protésico buscando desgaste o roturas","Pruebe la alineación caminando en línea recta frente a un espejo"]',
 '["Lleve un registro de cualquier cambio que note","Compare el desgaste de la suela con semanas anteriores","Si usa liner de silicón, revise que no tenga burbujas de aire"]',
 '["No intente reparar componentes mecánicos por su cuenta","Si nota cambios en la alineación, suspenda el uso y consulte"]'),

('Inspección mensual completa', 'inspeccion_mensual',
 'Una vez al mes, realice una revisión exhaustiva y documente el estado general de su prótesis.',
 3, 6, 1,
 '["Revise el encaje buscando puntos de presión o deformación","Verifique el estado de todas las correas y velcros","Inspeccione las articulaciones mecánicas y su rango de movimiento","Tome fotos del estado actual para comparar mes a mes","Registre cualquier molestia o cambio en el ajuste"]',
 '["Programe su cita mensual con el protesista para ajustes preventivos","Mantenga un diario de uso con horas de uso diario"]',
 '["El desgaste excesivo puede causar lesiones en el muñón","Si el encaje se siente más holgado, puede necesitar un nuevo liner"]'),

('Almacenamiento correcto de la prótesis', 'almacenamiento',
 'El almacenamiento adecuado cuando no usa la prótesis es importante para mantener su forma y funcionalidad.',
 4, 6, 1,
 '["Coloque la prótesis en posición vertical o en su soporte designado","Guárdela en un lugar seco, a temperatura ambiente","Evite la exposición directa al sol o fuentes de calor","Cubra el encaje para evitar acumulación de polvo","Si no la usará por varios días, aplique talco al interior del encaje"]',
 '["Un soporte para prótesis ayuda a mantener la alineación","En viajes, use el estuche de transporte proporcionado"]',
 '["Nunca deje la prótesis cerca de radiadores o estufas","La humedad excesiva puede dañar componentes electrónicos","No apoye objetos pesados sobre la prótesis"]'),

('Qué hacer si detecta daño', 'dano',
 'Si detecta cualquier tipo de daño en su prótesis, siga estos pasos para evitar lesiones.',
 5, 6, 1,
 '["Deje de usar la prótesis inmediatamente","Documente el daño con fotografías","Contacte a su especialista en ortesis lo antes posible","Use su dispositivo de movilidad alternativo (muletas, silla de ruedas)","No intente reparar el daño por su cuenta"]',
 '["Tenga siempre a mano el número de su protesista","Mantenga sus muletas o bastón accesibles como respaldo"]',
 '["Usar una prótesis dañada puede causar lesiones graves en el muñón","Las reparaciones caseras pueden empeorar el daño y anular la garantía"]');

-- 3. Reportes de problemas
-- Dispositivo 1 = paciente 1 (Juan Pérez), Dispositivo 2 = paciente 3 (Roberto Díaz)
-- Nuevo dispositivo 3 = paciente 2 (María López)
SET @disp_maria = (SELECT id FROM dispositivos_paciente WHERE paciente_id = 2 ORDER BY id DESC LIMIT 1);

INSERT INTO reportes_problemas (dispositivo_id, paciente_id, descripcion, severidad, estado, fecha_reporte, fecha_resolucion, notas_resolucion, atendido_por) VALUES
(1, 1, 'Siento presión excesiva en la parte lateral del muñón después de caminar más de 30 minutos', 'moderado', 'resuelto', '2026-01-25', '2026-01-28', 'Se realizó ajuste en el encaje lateral. Se redujo el punto de presión con padding adicional.', 6),
(1, 1, 'El pie protésico hace un ruido al flexionar, como un clic', 'leve', 'resuelto', '2026-02-10', '2026-02-12', 'Tornillo de conexión del pie estaba ligeramente flojo. Se apretó y lubricó.', 6),
(2, 3, 'Irritación en la piel del muñón después de usar la prótesis todo el día', 'moderado', 'resuelto', '2026-02-05', '2026-02-08', 'Se cambió el liner por uno hipoalergénico. Se recomendó reducir horas de uso gradualmente.', 6),
(2, 3, 'La prótesis se siente inestable al subir escaleras', 'severo', 'en_revision', '2026-02-28', NULL, NULL, 6);

-- Reportes para María López (paciente 2)
INSERT INTO reportes_problemas (dispositivo_id, paciente_id, descripcion, severidad, estado, fecha_reporte, fecha_resolucion, notas_resolucion, atendido_por) VALUES
(@disp_maria, 2, 'Molestia leve en la zona posterior del muñón al final del día', 'leve', 'resuelto', '2026-02-15', '2026-02-17', 'Se ajustó el ángulo del socket posterior. Paciente reporta mejora significativa.', 6),
(@disp_maria, 2, 'El calcetín protésico se desliza durante la caminata', 'moderado', 'resuelto', '2026-02-22', '2026-02-24', 'Se proporcionó calcetín de mayor grosor (5 capas) y se instruyó técnica correcta de colocación.', 6);

-- 4. Historial de ajustes adicionales
INSERT INTO historial_ajustes (dispositivo_id, tipo_ajuste, descripcion, realizado_por, fecha_ajuste, notas) VALUES
(1, 'Alineación', 'Ajuste de alineación estática y dinámica del pie protésico', 6, '2026-01-28', 'Paciente caminaba con ligera desviación lateral. Se corrigió el ángulo de abducción 2°.'),
(1, 'Encaje', 'Modificación del encaje por cambio de volumen del muñón', 6, '2026-02-15', 'Reducción de volumen detectada. Se agregó padding interior de 3mm.'),
(2, 'Alineación', 'Ajuste de alineación para mejorar estabilidad en escaleras', 6, '2026-02-10', 'Se modificó la flexión plantar para mejorar el despegue del talón.'),
(2, 'Suspensión', 'Cambio de sistema de suspensión por desgaste', 6, '2026-02-20', 'Se reemplazó el pin de bloqueo y el liner de silicón.');

-- Ajustes para dispositivo de María
INSERT INTO historial_ajustes (dispositivo_id, tipo_ajuste, descripcion, realizado_por, fecha_ajuste, notas) VALUES
(@disp_maria, 'Alineación', 'Ajuste inicial de alineación post-entrega', 6, '2025-01-25', 'Primera revisión después de entrega. Se ajustó la altura y alineación en plano sagital.'),
(@disp_maria, 'Encaje', 'Ajuste de encaje por adaptación inicial', 6, '2025-02-10', 'Paciente reporta mejoría en comodidad. Se pulieron bordes del socket.'),
(@disp_maria, 'Alineación', 'Revisión trimestral de alineación', 6, '2025-04-15', 'Alineación dentro de parámetros normales. Sin cambios necesarios.'),
(@disp_maria, 'Encaje', 'Ajuste por reducción de volumen del muñón', 6, '2026-02-17', 'Se agregó calcetín extra de 3 capas para compensar cambio volumétrico.');

-- 5. Checklist recientes para los 3 pacientes (últimos días)
INSERT INTO checklist_protesis (paciente_id, fecha, limpieza_realizada, inspeccion_visual, ajuste_correcto, comodidad_uso, problemas_detectados) VALUES
-- Paciente 1 - Juan Pérez
(1, '2026-03-01', 1, 1, 1, 1, NULL),
(1, '2026-03-02', 1, 1, 1, 0, 'Ligera molestia en zona anterior del muñón'),
(1, '2026-03-03', 1, 1, 1, 1, NULL),
(1, '2026-03-04', 1, 1, 1, 1, NULL),
-- Paciente 2 - María López
(2, '2026-03-01', 1, 1, 1, 1, NULL),
(2, '2026-03-02', 1, 0, 1, 1, NULL),
(2, '2026-03-03', 1, 1, 1, 1, NULL),
(2, '2026-03-04', 1, 1, 1, 1, NULL),
-- Paciente 3 - Roberto Díaz
(3, '2026-03-01', 1, 1, 0, 0, 'Prótesis se siente inestable, pendiente revisión'),
(3, '2026-03-02', 0, 1, 0, 0, 'Continúa inestabilidad, no usé la prótesis hoy'),
(3, '2026-03-03', 1, 1, 1, 1, 'Mejoró después de ajuste provisional'),
(3, '2026-03-04', 1, 1, 1, 1, NULL)
ON DUPLICATE KEY UPDATE
  limpieza_realizada = VALUES(limpieza_realizada),
  inspeccion_visual = VALUES(inspeccion_visual),
  ajuste_correcto = VALUES(ajuste_correcto),
  comodidad_uso = VALUES(comodidad_uso),
  problemas_detectados = VALUES(problemas_detectados);
