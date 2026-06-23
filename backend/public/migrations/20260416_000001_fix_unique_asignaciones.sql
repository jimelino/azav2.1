-- Migración: arreglar UNIQUE de asignaciones_especialista
-- Motivo: El UNIQUE (paciente_id, area_medica_id, activo) impide tener
-- múltiples registros históricos desactivados para el mismo (paciente, area).
-- Esto rompe el soft-delete después de una transferencia.
-- Solución: UNIQUE solo cuando activo=1, usando una columna generada.

ALTER TABLE asignaciones_especialista
  DROP INDEX unique_asignacion;

ALTER TABLE asignaciones_especialista
  ADD COLUMN uniq_activa VARCHAR(32) GENERATED ALWAYS AS
    (IF(activo = 1, CONCAT(paciente_id, '-', area_medica_id), NULL)) STORED,
  ADD UNIQUE KEY uk_asignacion_activa (uniq_activa);
