-- ============================================================================
-- Migracion: fases_tratamiento de 4 a 8 etapas de rehabilitacion
-- ============================================================================
-- Alinea la tabla con el modelo de 8 fases usado por el frontend:
--   - FASES.* en frontend/src/utils/constants.js
--   - REHABILITATION_PHASES en frontend/src/utils/rehabilitationPhases.js
--
-- Antes (4 fases): Evaluacion Inicial, Adaptacion y Aprendizaje,
--                  Seguimiento Activo, Autonomia Completa
-- Despues (8 fases): Preconsulta, Adaptacion al ejercicio, Preprotesico,
--                    Protesico, Posprotesico, Alta/Graduacion,
--                    Seguimiento a 6 meses, Seguimiento a 12 meses
--
-- Los ids 1-4 se conservan (solo cambian nombre/descripcion), por lo que
-- las referencias existentes en pacientes.fase_actual_id e historial_fases
-- siguen siendo validas. Las fases 5-8 se agregan al final.
--
-- La migracion es idempotente: se puede ejecutar varias veces sin error
-- (los UPDATEs son por numero y el INSERT usa ON DUPLICATE KEY UPDATE).
--
-- IMPORTANTE: ejecutarla forzando el charset para conservar los acentos:
--   mysql -u root -p -P 3307 --default-character-set=utf8mb4 vitalia_db < fases_8_etapas.sql
-- ============================================================================

-- Renombrar las 4 fases existentes al nuevo modelo (manteniendo su id)
UPDATE fases_tratamiento
SET nombre = 'Preconsulta',
    descripcion = 'Primera aproximación al dispositivo, evaluaciones médicas y plan de tratamiento.'
WHERE numero = 1;

UPDATE fases_tratamiento
SET nombre = 'Adaptación al ejercicio',
    descripcion = 'Aprendizaje de uso del dispositivo, ejercicios básicos y ajustes iniciales.'
WHERE numero = 2;

UPDATE fases_tratamiento
SET nombre = 'Preprotésico',
    descripcion = 'Uso regular del dispositivo, monitoreo constante y correcciones necesarias.'
WHERE numero = 3;

UPDATE fases_tratamiento
SET nombre = 'Protésico',
    descripcion = 'Uso independiente del dispositivo con seguimiento periódico.'
WHERE numero = 4;

-- Agregar las fases 5 a 8 (idempotente)
INSERT INTO fases_tratamiento (numero, nombre, descripcion) VALUES
(5, 'Posprotésico', 'Consolidación de la autonomía y adaptación funcional avanzada a la vida diaria.'),
(6, 'Alta/Graduación', 'Finalización formal del proceso de rehabilitación y alta clínica.'),
(7, 'Seguimiento a 6 meses', 'Evaluación de control semestral para asegurar el buen estado del dispositivo y confort.'),
(8, 'Seguimiento a 12 meses', 'Evaluación de control anual y cierre de ciclo de seguimiento prolongado.')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);
