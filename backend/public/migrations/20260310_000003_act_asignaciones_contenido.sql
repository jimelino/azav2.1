-- Migración: Agregar campos de contenido personalizado a act_asignaciones
-- Fecha: 2026-03-10

ALTER TABLE act_asignaciones
  ADD COLUMN contenido JSON NULL COMMENT 'Contenido personalizado (descripcion, pasos, instrucciones)' AFTER notas_especialista,
  ADD COLUMN es_personalizada TINYINT DEFAULT 0 AFTER contenido,
  ADD COLUMN tipo_actividad VARCHAR(50) NULL COMMENT 'reflexion, escritura, meditacion, accion, formato' AFTER es_personalizada;
