-- Alinea el catálogo persistido con las ocho fases mostradas en la aplicación.
-- Es idempotente: actualiza las fases existentes por numero e inserta las faltantes.

INSERT INTO fases_tratamiento (numero, nombre, descripcion) VALUES
(1, 'Preconsulta', 'Primera aproximación al dispositivo, evaluaciones médicas y plan de tratamiento.'),
(2, 'Adaptación al ejercicio', 'Aprendizaje de uso del dispositivo, ejercicios básicos y ajustes iniciales.'),
(3, 'Preprotésico', 'Uso regular del dispositivo, monitoreo constante y correcciones necesarias.'),
(4, 'Protésico', 'Uso independiente del dispositivo con seguimiento periódico.'),
(5, 'Posprotésico', 'Consolidación de la autonomía y adaptación funcional avanzada a la vida diaria.'),
(6, 'Alta/Graduación', 'Finalización formal del proceso de rehabilitación y alta clínica.'),
(7, 'Seguimiento a 6 meses', 'Evaluación de control semestral para asegurar el buen estado del dispositivo y confort.'),
(8, 'Seguimiento a 12 meses', 'Evaluación de control anual y cierre de ciclo de seguimiento prolongado.')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);
