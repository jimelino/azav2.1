-- Amplía el contenido educativo de manual_informativo_ortesis: actualiza
-- los 2 manuales ya sembrados (uno por categoria/titulo, vía
-- ON DUPLICATE KEY UPDATE para que sea seguro re-ejecutar este script) y
-- agrega manuales nuevos como ítems de acordeón independientes, siguiendo
-- el mismo patrón que ya usa el renderer del paciente (titulo, subtitulo,
-- contenido, objetivos, tipos_comunes).

-- ===== CATEGORIA: ortesis =====

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, objetivos, tipos_comunes, orden, activo)
VALUES
    (
        'ortesis',
        '¿Qué es una órtesis y cuáles son sus objetivos?',
        'Manual Informativo de Órtesis',
        'Una órtesis es un dispositivo externo diseñado para modificar las características estructurales o funcionales del sistema neuromusculoesquelético. Se utiliza para apoyar, alinear, prevenir deformidades, corregir alteraciones biomecánicas, proteger estructuras lesionadas o mejorar la función física del paciente.',
        '["Estabilizar articulaciones","Corregir deformidades","Reducir el dolor","Facilitar la movilidad","Proteger tejidos durante la recuperación","Mejorar la independencia funcional","Prevenir el deterioro físico"]',
        '["Órtesis de miembro superior (mano, muñeca, codo, hombro)","Órtesis de miembro inferior (pie, tobillo, rodilla, cadera)","Órtesis espinales (cervicales, torácicas, lumbares)","Órtesis dinámicas","Órtesis estáticas","Órtesis postquirúrgicas"]',
        1,
        1
    )
ON DUPLICATE KEY UPDATE
    subtitulo = VALUES(subtitulo),
    contenido = VALUES(contenido),
    objetivos = VALUES(objetivos),
    tipos_comunes = VALUES(tipos_comunes);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'ortesis',
        'Información de tu órtesis',
        'Qué encontrarás sobre tu dispositivo',
        'Para cada órtesis podrás consultar: nombre de la órtesis, fotografía o modelo 3D, función terapéutica, indicaciones de uso, beneficios esperados, tiempo estimado de tratamiento y el profesional responsable de tu caso.',
        2,
        1
    )
ON DUPLICATE KEY UPDATE
    subtitulo = VALUES(subtitulo),
    contenido = VALUES(contenido);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'ortesis',
        'Seguimiento del uso de tu órtesis',
        'Registro de uso y adherencia',
        'Para promover la adherencia a tu tratamiento y reducir complicaciones, se registra: horas prescritas por día, horas utilizadas, historial semanal y porcentaje de cumplimiento.',
        3,
        1
    )
ON DUPLICATE KEY UPDATE
    subtitulo = VALUES(subtitulo),
    contenido = VALUES(contenido);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'ortesis',
        'Colocación, retiro y cuidados de tu órtesis',
        NULL,
        'Colocación: sigue las instrucciones paso a paso y los videos demostrativos disponibles. Retiro: realiza el retiro siguiendo el procedimiento seguro indicado por tu especialista. Cuidados: mantén la limpieza, el almacenamiento y el transporte adecuados de tu órtesis. Seguridad: respeta las actividades permitidas y evita las actividades restringidas indicadas por tu especialista.',
        4,
        1
    )
ON DUPLICATE KEY UPDATE
    contenido = VALUES(contenido);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'ortesis',
        'Señales de alerta: cuándo contactar a tu especialista',
        NULL,
        'Durante el uso de tu órtesis debes estar atento a: dolor, inflamación, enrojecimiento, fatiga y dificultad para caminar o mover la extremidad. Contacta inmediatamente a tu especialista si presentas dolor intenso, lesiones en la piel, inflamación excesiva, rotura de la órtesis o pérdida de funcionalidad.',
        5,
        1
    )
ON DUPLICATE KEY UPDATE
    contenido = VALUES(contenido);

-- ===== CATEGORIA: protesis =====

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, objetivos, tipos_comunes, orden, activo)
VALUES
    (
        'protesis',
        '¿Qué es una prótesis y cuáles son sus objetivos?',
        'Manual Informativo de Prótesis',
        'Una prótesis es un dispositivo externo hecho a la medida que sirve para reemplazar una extremidad que se ha perdido por diferentes causas.',
        '["Restituir apoyo o función perdida","Mejorar movilidad segura y tolerancia al esfuerzo","Favorecer independencia en actividades diarias"]',
        '["Miembro inferior: prótesis parcial de pie, transtibial, desarticulada de rodilla, transfemoral y para desarticulado de cadera","Miembro superior: prótesis transradial, transhumeral y para desarticulado de hombro"]',
        1,
        1
    )
ON DUPLICATE KEY UPDATE
    subtitulo = VALUES(subtitulo),
    contenido = VALUES(contenido),
    objetivos = VALUES(objetivos),
    tipos_comunes = VALUES(tipos_comunes);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'protesis',
        '¿Cuál prótesis es la más indicada para ti?',
        NULL,
        'Para determinar qué tipo de prótesis es la más adecuada para ti, se realiza una valoración donde se identifican tus necesidades, tu nivel de actividad y tus expectativas.',
        2,
        1
    )
ON DUPLICATE KEY UPDATE
    contenido = VALUES(contenido);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'protesis',
        'Partes de una prótesis de miembro inferior',
        NULL,
        'Una prótesis de miembro inferior está compuesta principalmente por: pie protésico, tubo, adaptador, rodilla protésica y socket.',
        3,
        1
    )
ON DUPLICATE KEY UPDATE
    contenido = VALUES(contenido);

INSERT INTO manual_informativo_ortesis
    (categoria, titulo, subtitulo, contenido, orden, activo)
VALUES
    (
        'protesis',
        'Recomendaciones de uso de tu prótesis',
        NULL,
        'Asegúrate de colocar correctamente tu prótesis, realiza tu higiene diaria, no manipules los componentes por tu cuenta, informa cualquier molestia o irregularidad a tu protesista y evita acciones inseguras que puedan ocasionar caídas. El tratamiento y la evolución de cada persona es diferente, porque las necesidades son diferentes.',
        4,
        1
    )
ON DUPLICATE KEY UPDATE
    contenido = VALUES(contenido);
