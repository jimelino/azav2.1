-- =====================================================
-- SCRIPT COMPLETO: MÓDULO DE PRÓTESIS
-- Ejecutar en MySQL Workbench
-- =====================================================

USE vitalia_v2;

-- =====================================================
-- 1. CREAR TABLA DE PROBLEMAS SI NO EXISTE
-- =====================================================

CREATE TABLE IF NOT EXISTS problemas_ortesis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    urgencia ENUM('baja', 'media', 'alta') DEFAULT 'media',
    estado ENUM('pendiente', 'en_revision', 'resuelto') DEFAULT 'pendiente',
    respuesta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. AGREGAR COLUMNAS FALTANTES A DISPOSITIVOS_PACIENTE
-- =====================================================

-- Agregar nivel_k si no existe
SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = 'vitalia_db'
               AND table_name = 'dispositivos_paciente'
               AND column_name = 'nivel_k');
SET @query := IF(@exist = 0,
    'ALTER TABLE dispositivos_paciente ADD COLUMN nivel_k VARCHAR(5) DEFAULT NULL',
    'SELECT "Column nivel_k already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar fecha_evaluacion_k si no existe
SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = 'vitalia_db'
               AND table_name = 'dispositivos_paciente'
               AND column_name = 'fecha_evaluacion_k');
SET @query := IF(@exist = 0,
    'ALTER TABLE dispositivos_paciente ADD COLUMN fecha_evaluacion_k DATE DEFAULT NULL',
    'SELECT "Column fecha_evaluacion_k already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar objetivos_rehabilitacion si no existe
SET @exist := (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = 'vitalia_db'
               AND table_name = 'dispositivos_paciente'
               AND column_name = 'objetivos_rehabilitacion');
SET @query := IF(@exist = 0,
    'ALTER TABLE dispositivos_paciente ADD COLUMN objetivos_rehabilitacion TEXT DEFAULT NULL',
    'SELECT "Column objetivos_rehabilitacion already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. ACTUALIZAR TIPOS DE PRÓTESIS CON INFO COMPLETA
-- =====================================================

-- Limpiar datos anteriores de prótesis
DELETE FROM tipos_dispositivo WHERE categoria = 'protesis';

-- Insertar tipos de prótesis con información completa
INSERT INTO tipos_dispositivo (nombre, descripcion, categoria, componentes, ventajas, desventajas, cuidados_especificos, nivel_k_minimo, imagen_url) VALUES

('Transtibial',
'Prótesis para amputación debajo de la rodilla. Es el tipo más común y permite una marcha natural.',
'protesis',
'["Socket de contacto total", "Liner de silicona o gel", "Sistema de suspensión (pin, vacío o correa)", "Tubo adaptador de titanio", "Pie protésico dinámico"]',
'["Conserva la articulación de rodilla natural", "Menor gasto energético al caminar", "Más fácil de aprender a usar", "Mejor propiocepción", "Permite actividades deportivas"]',
'["Requiere buen estado del muñón", "El socket debe ajustarse perfectamente", "Puede haber cambios de volumen en el muñón"]',
'["Revisar el liner diariamente por desgaste", "Limpiar el socket con alcohol isopropílico", "Verificar alineación cada 6 meses", "Cambiar liner cada 6-12 meses"]',
'K1',
'/images/protesis/transtibial.png'),

('Transfemoral',
'Prótesis para amputación por encima de la rodilla. Incluye una rodilla protésica articulada.',
'protesis',
'["Socket de contención isquiática", "Liner de gel con pin o vacío", "Rodilla protésica (mecánica o microprocesador)", "Tubo de conexión", "Pie protésico con respuesta energética"]',
'["Permite caminar de forma independiente", "Rodillas modernas ofrecen gran estabilidad", "Tecnología de microprocesador disponible", "Múltiples opciones de personalización"]',
'["Mayor gasto energético (40-60% más)", "Curva de aprendizaje más larga", "Costo más elevado", "Requiere mayor fuerza en cadera"]',
'["Lubricar articulación de rodilla según fabricante", "Cargar batería en rodillas electrónicas", "Verificar sistema de bloqueo", "Inspección profesional cada 3-6 meses"]',
'K2',
'/images/protesis/transfemoral.png'),

('Desarticulación de Rodilla',
'Prótesis para amputación a nivel de la articulación de la rodilla.',
'protesis',
'["Socket de contacto con extremo cerrado", "Articulación de rodilla externa", "Sistema de suspensión por vacío o correa", "Adaptadores de conexión", "Pie protésico"]',
'["Excelente palanca para control", "Permite carga de peso en el extremo", "Suspensión natural por los cóndilos", "Menor gasto energético que transfemoral"]',
'["Rodilla protésica queda más baja", "Asimetría cosmética al sentarse", "Opciones de rodilla más limitadas"]',
'["Verificar el ajuste del socket regularmente", "Limpiar área de contacto del muñón", "Revisar articulación de rodilla mensualmente"]',
'K2',
'/images/protesis/desart-rodilla.png'),

('Pie Parcial',
'Prótesis para amputaciones parciales del pie (transmetatarsiana, Lisfranc, Chopart).',
'protesis',
'["Plantilla de silicona personalizada", "Relleno cosmético del antepié", "Placa de fibra de carbono", "Calzado adaptado o especial"]',
'["Preserva parte del pie natural", "Mínimo impacto en la marcha", "Fácil de ocultar con calzado", "Bajo mantenimiento"]',
'["Opciones limitadas de calzado", "Puede requerir modificaciones", "Riesgo de úlceras en el muñón"]',
'["Inspeccionar piel del muñón diariamente", "Mantener plantilla limpia y seca", "Usar calzado con soporte adecuado"]',
'K1',
'/images/protesis/pie-parcial.png'),

('Syme',
'Prótesis para desarticulación de tobillo. Conserva el talón natural.',
'protesis',
'["Socket con ventana posterior o lateral", "Relleno de talón personalizado", "Pie protésico SACH o dinámico", "Acabado cosmético"]',
'["Excelente capacidad de carga", "Suspensión natural", "Longitud de pierna casi normal", "Buena propiocepción"]',
'["Bulto visible en área de tobillo", "Dificultad para usar calzado normal", "Opciones de pies más limitadas"]',
'["Verificar integridad del relleno de talón", "Limpiar ventana del socket", "Control de volumen del muñón"]',
'K1',
'/images/protesis/syme.png'),

('Desarticulación de Cadera',
'Prótesis para amputación a nivel de la articulación de la cadera.',
'protesis',
'["Socket tipo cesta pélvica", "Articulación de cadera", "Rodilla protésica con bloqueo", "Sistema de tubo y adaptadores", "Pie protésico"]',
'["Permite movilidad independiente", "Tecnología avanzada disponible", "Diseños cada vez más ligeros"]',
'["Alto gasto energético (80-100% más)", "Peso significativo del sistema", "Control complejo de la marcha", "Alto costo"]',
'["Requiere revisión profesional frecuente", "Mantener articulaciones lubricadas", "Verificar sistema de suspensión pélvico", "Cuidado especial de la piel"]',
'K3',
'/images/protesis/desart-cadera.png'),

('Miembro Superior - Transradial',
'Prótesis para amputación debajo del codo. Múltiples opciones de control.',
'protesis',
'["Socket de contacto", "Sistema de suspensión", "Unidad de muñeca", "Dispositivo terminal (gancho o mano)", "Sistema de control (cable o mioeléctrico)"]',
'["Conserva articulación del codo", "Buen control del dispositivo", "Múltiples opciones de terminal", "Permite función bimanual"]',
'["Requiere entrenamiento", "Manos mioeléctricas costosas", "Mantenimiento regular necesario"]',
'["Cargar baterías diariamente (mioeléctricas)", "Limpiar guante cosmético", "Lubricar cables y articulaciones", "Verificar electrodos"]',
'K1',
'/images/protesis/transradial.png'),

('Miembro Superior - Transhumeral',
'Prótesis para amputación por encima del codo. Incluye codo protésico.',
'protesis',
'["Socket con arnés de suspensión", "Codo protésico (mecánico o eléctrico)", "Unidad de muñeca rotatoria", "Dispositivo terminal", "Sistema de control híbrido"]',
'["Permite función del brazo completo", "Tecnología avanzada disponible", "Opciones de control variadas"]',
'["Control más complejo", "Mayor peso del sistema", "Costo elevado", "Entrenamiento extenso"]',
'["Verificar arnés y suspensión", "Mantener codo lubricado", "Cargar sistemas eléctricos", "Revisión profesional trimestral"]',
'K2',
'/images/protesis/transhumeral.png');

-- =====================================================
-- 4. ACTUALIZAR GUÍAS DE CUIDADO CON INFO COMPLETA
-- =====================================================

-- Limpiar guías anteriores de prótesis
DELETE FROM guias_cuidado WHERE categoria IN ('protesis', 'general') OR tipo IN ('limpieza_diaria', 'mantenimiento_semanal', 'inspeccion_mensual', 'almacenamiento', 'dano', 'otro');

-- Insertar guías completas
INSERT INTO guias_cuidado (titulo, tipo, contenido, categoria, orden, publicado, creado_por, pasos, tips, advertencias, nivel_k_aplicable) VALUES

('Limpieza diaria del socket', 'limpieza_diaria',
'Mantener el socket limpio es esencial para prevenir irritaciones en la piel y prolongar la vida útil de tu prótesis.',
'protesis', 1, 1, 1,
'["Retirar la prótesis al final del día", "Limpiar el interior del socket con un paño húmedo", "Usar jabón neutro si hay residuos visibles", "Secar completamente con un paño limpio", "Dejar airear durante la noche", "Verificar que no haya grietas o daños"]',
'["Nunca uses alcohol directamente en el socket", "Si usas liner, límpialo por separado", "Establece una rutina fija para no olvidar"]',
'["No uses secadora de pelo - puede dañar los materiales", "Si notas mal olor persistente, consulta a tu protesista"]',
'["K1", "K2", "K3", "K4"]'),

('Cuidado y limpieza del liner', 'limpieza_diaria',
'El liner es el componente que está en contacto directo con tu piel. Su limpieza diaria es fundamental.',
'protesis', 2, 1, 1,
'["Voltear el liner al revés", "Lavar con agua tibia y jabón neutro", "Enjuagar completamente sin dejar residuos de jabón", "Secar con toalla suave sin frotar", "Dejar secar al aire en lugar ventilado", "Aplicar talco sin perfume antes de usar (opcional)"]',
'["Ten un liner de repuesto mientras uno se seca", "El liner debe reemplazarse cada 6-12 meses", "Guarda el liner estirado, no doblado"]',
'["No uses cremas o lociones antes de ponerte el liner", "Evita exposición directa al sol", "No uses secadora"]',
'["K1", "K2", "K3", "K4"]'),

('Mantenimiento semanal de la prótesis', 'mantenimiento_semanal',
'Una revisión semanal ayuda a detectar problemas antes de que se agraven.',
'protesis', 3, 1, 1,
'["Inspeccionar visualmente todos los componentes", "Verificar tornillos y conexiones", "Revisar el sistema de suspensión", "Limpiar en profundidad el socket", "Lubricar articulaciones si aplica", "Verificar estado del pie protésico"]',
'["Usa una lista de verificación para no olvidar nada", "Toma fotos para comparar el desgaste", "Anota cualquier cambio que notes"]',
'["Si encuentras tornillos flojos, no aprietes demasiado", "Ante cualquier duda, consulta a tu protesista"]',
'["K1", "K2", "K3", "K4"]'),

('Inspección mensual completa', 'inspeccion_mensual',
'Una vez al mes, realiza una inspección más detallada de todos los componentes.',
'protesis', 4, 1, 1,
'["Revisar desgaste del liner y socket", "Verificar alineación visual de la prótesis", "Comprobar funcionamiento del sistema de vacío o pin", "Inspeccionar el pie protésico por grietas", "Revisar cosmética si aplica", "Verificar fecha de última revisión profesional"]',
'["Programa revisiones profesionales cada 6 meses", "Lleva un registro de mantenimiento", "Compara con fotos anteriores para detectar cambios"]',
'["El desgaste excesivo puede causar lesiones", "Agenda cita profesional si notas problemas"]',
'["K1", "K2", "K3", "K4"]'),

('Cuidado de la piel del muñón', 'limpieza_diaria',
'La salud de la piel de tu muñón es crucial para el uso cómodo de la prótesis.',
'protesis', 5, 1, 1,
'["Lavar el muñón con jabón neutro cada mañana y noche", "Secar completamente, especialmente entre pliegues", "Inspeccionar buscando enrojecimiento o irritación", "Aplicar crema hidratante sin alcohol (solo por la noche)", "Masajear suavemente para mejorar circulación", "Dejar airear el muñón varias horas al día"]',
'["No uses talco con fragancias", "Las cremas deben aplicarse 8 horas antes de usar la prótesis", "El masaje ayuda a desensibilizar el muñón"]',
'["Consulta inmediatamente si hay heridas abiertas", "No revientes ampollas", "El enrojecimiento persistente requiere atención médica"]',
'["K1", "K2", "K3", "K4"]'),

('Almacenamiento correcto de la prótesis', 'almacenamiento',
'Guardar correctamente tu prótesis prolonga su vida útil y mantiene los componentes en buen estado.',
'protesis', 6, 1, 1,
'["Limpiar antes de guardar", "Colocar en posición vertical o soporte especial", "Evitar exposición al sol directo", "Mantener en lugar seco y ventilado", "No colocar peso sobre la prótesis", "Guardar el liner por separado si es posible"]',
'["Usa un soporte o stand para prótesis", "Cubre con una funda de tela si no la usarás por días", "Retira baterías si no usarás la prótesis por tiempo prolongado"]',
'["Nunca guardes la prótesis mojada", "Evita temperaturas extremas", "No la dejes en el auto bajo el sol"]',
'["K1", "K2", "K3", "K4"]'),

('Qué hacer ante un daño en la prótesis', 'dano',
'Si tu prótesis sufre algún daño, saber actuar rápidamente puede prevenir problemas mayores.',
'protesis', 7, 1, 1,
'["Dejar de usar la prótesis inmediatamente", "Documentar el daño con fotos", "Contactar a tu protesista", "No intentar reparaciones caseras en componentes críticos", "Usar muletas o silla mientras se repara", "Guardar todas las piezas que se hayan desprendido"]',
'["Ten siempre el contacto de tu protesista a mano", "Considera tener una prótesis de respaldo si es posible", "Revisa tu garantía antes de reparaciones"]',
'["No uses cinta adhesiva o pegamento en el socket", "No continúes usando una prótesis dañada", "Reparaciones incorrectas pueden causar lesiones"]',
'["K1", "K2", "K3", "K4"]'),

('Ejercicios de fortalecimiento del muñón', 'otro',
'Mantener los músculos del muñón fuertes mejora el control de la prótesis.',
'protesis', 8, 1, 1,
'["Ejercicios de extensión de cadera (transfemoral)", "Ejercicios de extensión de rodilla (transtibial)", "Contracciones isométricas del muñón", "Ejercicios de equilibrio con y sin prótesis", "Estiramientos para prevenir contracturas", "Caminar en diferentes superficies"]',
'["Consulta con tu fisioterapeuta antes de empezar", "Empieza con pocas repeticiones", "La consistencia es más importante que la intensidad"]',
'["Detente si sientes dolor agudo", "No ejercites sobre piel irritada", "Aumenta gradualmente la dificultad"]',
'["K2", "K3", "K4"]'),

('Uso de la prótesis en climas extremos', 'otro',
'El calor y el frío pueden afectar tanto tu prótesis como tu muñón.',
'protesis', 9, 1, 1,
'["En calor: usar calcetines absorbentes de humedad", "En calor: llevar toallitas para secar el muñón", "En frío: usar una funda térmica sobre el socket", "En frío: verificar la sensibilidad del muñón regularmente", "Evitar cambios bruscos de temperatura", "Hidratar la piel en ambientes secos"]',
'["Ten calcetines de repuesto en climas calurosos", "El sudor excesivo puede afectar la suspensión", "En frío, los materiales pueden volverse rígidos"]',
'["El muñón puede hincharse con el calor", "El frío reduce la sensibilidad - cuidado con lesiones", "Algunas baterías funcionan peor en frío extremo"]',
'["K1", "K2", "K3", "K4"]'),

('Primeros pasos con tu nueva prótesis', 'otro',
'Guía para los primeros días y semanas con una prótesis nueva.',
'protesis', 10, 1, 1,
'["Comienza con periodos cortos de uso (1-2 horas)", "Aumenta gradualmente el tiempo cada día", "Revisa tu piel frecuentemente al inicio", "Practica ponerte y quitarte la prótesis", "Usa espejo para verificar postura", "No te desanimes - la adaptación toma tiempo"]',
'["Es normal sentir incomodidad los primeros días", "Lleva un diario de uso y sensaciones", "Comunica todo a tu protesista"]',
'["No ignores dolor persistente", "Las ampollas pequeñas son normales, las grandes no", "Si el socket se siente muy diferente al del molde, avisa"]',
'["K1", "K2", "K3", "K4"]');

-- =====================================================
-- 5. ACTUALIZAR FAQs CON MÁS PREGUNTAS
-- =====================================================

-- Limpiar FAQs anteriores
DELETE FROM faq_protesis;

-- Insertar FAQs completas
INSERT INTO faq_protesis (pregunta, respuesta, categoria, orden, activo) VALUES

('¿Cuánto tiempo dura una prótesis?',
'La vida útil de una prótesis varía según el tipo, uso y cuidado. En general:
- Socket: 2-5 años (puede necesitar ajustes antes)
- Liner: 6-12 meses
- Pie protésico: 3-5 años
- Rodilla mecánica: 5-10 años
- Rodilla con microprocesador: 5-7 años
El uso activo, el peso corporal y el mantenimiento afectan significativamente la duración.',
'general', 1, 1),

('¿Puedo bañarme o nadar con mi prótesis?',
'La mayoría de las prótesis NO son resistentes al agua. El agua puede dañar:
- Componentes electrónicos
- El interior del socket
- Las articulaciones metálicas

Sin embargo, existen prótesis acuáticas especiales diseñadas para ducha, piscina y playa. Consulta con tu protesista sobre opciones disponibles.',
'uso', 2, 1),

('¿Qué son los niveles K y cuál es el mío?',
'Los niveles K (K0-K4) clasifican tu potencial de movilidad:
- K0: No ambulatorio
- K1: Ambulador en interiores limitado
- K2: Ambulador comunitario limitado
- K3: Ambulador comunitario sin límites
- K4: Alta actividad, deportes

Tu nivel K determina qué componentes protésicos te corresponden. Tu médico y protesista evalúan tu nivel considerando tu salud, fuerza, equilibrio y metas.',
'general', 3, 1),

('¿Cada cuánto debo visitar a mi protesista?',
'Recomendamos:
- Primeros 3 meses: cada 2-4 semanas para ajustes
- Después del primer año: cada 6 meses mínimo
- Siempre que notes problemas

También debes acudir si:
- Cambias significativamente de peso
- El socket se siente diferente
- Notas desgaste anormal
- Tienes dolor persistente',
'cuidados', 4, 1),

('¿Por qué mi muñón cambia de tamaño?',
'Es completamente normal. El muñón puede cambiar por:
- Fluctuaciones de fluidos durante el día
- Cambios de peso corporal
- Nivel de actividad física
- Temperatura ambiente
- Retención de líquidos

Por eso es importante usar calcetines de diferentes grosores y comunicar los cambios a tu protesista.',
'salud', 5, 1),

('¿Puedo hacer deporte con prótesis?',
'¡Absolutamente! Muchas personas con prótesis practican deportes. Las opciones incluyen:
- Caminar y senderismo
- Natación (con prótesis acuática)
- Ciclismo
- Golf
- Correr (con prótesis de carrera)
- Deportes de equipo adaptados

Existen prótesis deportivas especializadas. Habla con tu protesista sobre tus intereses.',
'actividades', 6, 1),

('¿Cómo sé si mi prótesis está mal alineada?',
'Señales de mala alineación incluyen:
- Dolor en rodilla, cadera o espalda
- Cojera notable
- Desgaste irregular del zapato
- Tropiezos frecuentes
- Fatiga excesiva al caminar
- Presión desigual en el socket

Si notas estos síntomas, agenda una cita con tu protesista.',
'problemas', 7, 1),

('¿Qué hago si tengo dolor en el muñón?',
'El dolor puede indicar varios problemas:
1. Dolor por presión: socket mal ajustado
2. Dolor ardiente: irritación de piel
3. Dolor fantasma: sensación del miembro ausente
4. Dolor punzante: posible neuroma

Acción recomendada:
- Retira la prótesis
- Inspecciona la piel
- Descansa el muñón
- Contacta a tu equipo médico si persiste',
'problemas', 8, 1),

('¿Cuánto cuesta una prótesis?',
'Los costos varían enormemente según el tipo:
- Prótesis básica: desde $30,000 MXN
- Prótesis de nivel medio: $80,000 - $200,000 MXN
- Rodilla con microprocesador: $300,000 - $800,000 MXN
- Prótesis de miembro superior mioeléctrica: $200,000 - $500,000 MXN

Tu seguro médico o programa de salud pública puede cubrir parte o todo el costo. Consulta tus opciones.',
'general', 9, 1),

('¿Puedo dormir con la prótesis puesta?',
'No se recomienda. Dormir sin prótesis:
- Permite que la piel respire
- Reduce riesgo de lesiones
- Ayuda a controlar el volumen del muñón
- Prolonga la vida del liner

Solo en circunstancias especiales (camping, emergencias) podrías dormir con ella brevemente.',
'uso', 10, 1),

('¿Cómo afecta el embarazo al uso de prótesis?',
'Durante el embarazo:
- El volumen del muñón puede cambiar
- El centro de gravedad se desplaza
- Puede necesitarse ajustar la alineación
- El peso adicional afecta los componentes

Comunica tu embarazo a tu protesista para hacer los ajustes necesarios a lo largo de cada trimestre.',
'salud', 11, 1),

('¿Cuánto tarda la adaptación a una nueva prótesis?',
'El tiempo de adaptación varía:
- Adaptación básica: 1-3 meses
- Marcha fluida: 3-6 meses
- Uso sin pensarlo conscientemente: 6-12 meses

Factores que influyen:
- Nivel de amputación
- Condición física general
- Edad
- Motivación y práctica
- Calidad del entrenamiento protésico',
'general', 12, 1);

-- =====================================================
-- 6. ACTUALIZAR VIDEOS EDUCATIVOS
-- =====================================================

-- Limpiar videos anteriores
DELETE FROM videos_educativos_protesis;

-- Insertar videos educativos
INSERT INTO videos_educativos_protesis (url_video, titulo, descripcion, categoria, duracion_minutos, orden, nivel_k_aplicable, activo) VALUES

('https://www.youtube.com/watch?v=prosthesis_care_1',
'Cómo colocarte correctamente tu prótesis transtibial',
'Aprende la técnica correcta para ponerte tu prótesis de pierna por debajo de la rodilla, incluyendo el cuidado del liner y el sistema de suspensión.',
'colocacion', 12, 1, '["K1", "K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_2',
'Colocación de prótesis transfemoral paso a paso',
'Guía completa para usuarios de prótesis por encima de la rodilla. Incluye técnicas de sentado y de pie.',
'colocacion', 15, 2, '["K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_3',
'Limpieza y mantenimiento del liner de silicona',
'Todo lo que necesitas saber para mantener tu liner en perfectas condiciones y prolongar su vida útil.',
'cuidados', 8, 3, '["K1", "K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_4',
'Ejercicios de equilibrio para usuarios de prótesis',
'Rutina de ejercicios para mejorar tu estabilidad y confianza al caminar con prótesis.',
'ejercicios', 20, 4, '["K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_5',
'Fortalecimiento del muñón: ejercicios esenciales',
'Ejercicios recomendados por fisioterapeutas para mantener la fuerza muscular del muñón.',
'ejercicios', 18, 5, '["K1", "K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_6',
'Mantenimiento semanal de tu prótesis',
'Lista de verificación y demostración de cómo realizar el mantenimiento semanal correctamente.',
'mantenimiento', 10, 6, '["K1", "K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_7',
'Cuidado de la piel del muñón',
'Prevención de irritaciones, tratamiento de problemas comunes y rutina diaria de cuidado de la piel.',
'cuidados', 12, 7, '["K1", "K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_8',
'Técnicas de marcha para principiantes',
'Aprende los fundamentos de caminar con prótesis de manera segura y eficiente.',
'ejercicios', 25, 8, '["K1", "K2"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_9',
'Subir y bajar escaleras con prótesis',
'Técnicas paso a paso para manejar escaleras con confianza.',
'ejercicios', 15, 9, '["K2", "K3", "K4"]', 1),

('https://www.youtube.com/watch?v=prosthesis_care_10',
'Qué hacer cuando tu prótesis no ajusta bien',
'Identifica problemas comunes de ajuste y aprende soluciones temporales mientras consultas a tu protesista.',
'mantenimiento', 10, 10, '["K1", "K2", "K3", "K4"]', 1);

-- =====================================================
-- 7. ASIGNAR PRÓTESIS A PACIENTES EXISTENTES
-- =====================================================

-- Verificar si hay pacientes y asignarles dispositivos
-- Primero obtenemos los IDs de tipos de prótesis
SET @transtibial_id = (SELECT id FROM tipos_dispositivo WHERE nombre = 'Transtibial' AND categoria = 'protesis' LIMIT 1);
SET @transfemoral_id = (SELECT id FROM tipos_dispositivo WHERE nombre = 'Transfemoral' AND categoria = 'protesis' LIMIT 1);
SET @pie_parcial_id = (SELECT id FROM tipos_dispositivo WHERE nombre = 'Pie Parcial' AND categoria = 'protesis' LIMIT 1);

-- Limpiar dispositivos anteriores de prótesis para evitar duplicados
DELETE FROM dispositivos_paciente WHERE tipo_dispositivo_id IN (
    SELECT id FROM tipos_dispositivo WHERE categoria = 'protesis'
);

-- Asignar prótesis al paciente 1 (transtibial)
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, numero_serie, fecha_entrega, estado, nivel_k, fecha_evaluacion_k, objetivos_rehabilitacion)
SELECT 1, @transtibial_id, 'PTT-2024-001', '2024-06-15', 'activo', 'K2', '2024-06-01',
'Caminar distancias moderadas en interiores y exteriores. Meta: lograr independencia completa en actividades diarias.'
WHERE EXISTS (SELECT 1 FROM pacientes WHERE id = 1) AND @transtibial_id IS NOT NULL;

-- Asignar prótesis al paciente 2 (transfemoral)
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, numero_serie, fecha_entrega, estado, nivel_k, fecha_evaluacion_k, objetivos_rehabilitacion)
SELECT 2, @transfemoral_id, 'PTF-2024-002', '2024-08-20', 'activo', 'K3', '2024-08-10',
'Lograr marcha independiente sin ayudas técnicas. Retorno a actividades laborales y recreativas.'
WHERE EXISTS (SELECT 1 FROM pacientes WHERE id = 2) AND @transfemoral_id IS NOT NULL;

-- Asignar prótesis al paciente 3 (pie parcial)
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, numero_serie, fecha_entrega, estado, nivel_k, fecha_evaluacion_k, objetivos_rehabilitacion)
SELECT 3, @pie_parcial_id, 'PPP-2024-003', '2024-09-10', 'activo', 'K2', '2024-09-01',
'Mejorar patrón de marcha y prevenir complicaciones en pie contralateral.'
WHERE EXISTS (SELECT 1 FROM pacientes WHERE id = 3) AND @pie_parcial_id IS NOT NULL;

-- Asignar prótesis al paciente 4 (transtibial)
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, numero_serie, fecha_entrega, estado, nivel_k, fecha_evaluacion_k, objetivos_rehabilitacion)
SELECT 4, @transtibial_id, 'PTT-2024-004', '2024-10-05', 'activo', 'K3', '2024-10-01',
'Alto nivel de actividad. Objetivo de participar en actividades deportivas recreativas.'
WHERE EXISTS (SELECT 1 FROM pacientes WHERE id = 4) AND @transtibial_id IS NOT NULL;

-- Asignar prótesis al paciente 5 (transfemoral)
INSERT INTO dispositivos_paciente (paciente_id, tipo_dispositivo_id, numero_serie, fecha_entrega, estado, nivel_k, fecha_evaluacion_k, objetivos_rehabilitacion)
SELECT 5, @transfemoral_id, 'PTF-2024-005', '2024-11-15', 'activo', 'K2', '2024-11-01',
'Movilidad comunitaria básica. Énfasis en seguridad y prevención de caídas.'
WHERE EXISTS (SELECT 1 FROM pacientes WHERE id = 5) AND @transfemoral_id IS NOT NULL;

-- =====================================================
-- 8. VERIFICACIÓN FINAL
-- =====================================================

SELECT 'VERIFICACIÓN DE DATOS INSERTADOS' as resultado;
SELECT 'Tipos de prótesis:', COUNT(*) FROM tipos_dispositivo WHERE categoria = 'protesis';
SELECT 'Guías de cuidado:', COUNT(*) FROM guias_cuidado;
SELECT 'FAQs:', COUNT(*) FROM faq_protesis WHERE activo = 1;
SELECT 'Videos educativos:', COUNT(*) FROM videos_educativos_protesis WHERE activo = 1;
SELECT 'Dispositivos asignados:', COUNT(*) FROM dispositivos_paciente dp
    JOIN tipos_dispositivo td ON dp.tipo_dispositivo_id = td.id
    WHERE td.categoria = 'protesis';
SELECT 'Niveles K:', COUNT(*) FROM niveles_k;

SELECT '¡Script ejecutado exitosamente!' as mensaje;
