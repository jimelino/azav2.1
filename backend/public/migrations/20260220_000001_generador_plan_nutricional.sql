-- =============================================
-- MIGRACIÓN: Generador de Planes Nutricionales
-- Descripción: Extiende plan_comidas para soportar
--              recetas del catálogo y opciones múltiples.
--              Agrega campos extras a recetas.
-- =============================================

-- Agregar columnas a plan_comidas para vincular con recetas del catálogo
ALTER TABLE plan_comidas
  ADD COLUMN opcion_numero TINYINT UNSIGNED DEFAULT 1 AFTER orden,
  ADD COLUMN receta_id INT UNSIGNED NULL AFTER opcion_numero,
  ADD COLUMN imagen_url VARCHAR(500) NULL AFTER receta_id,
  ADD COLUMN instrucciones_json JSON NULL AFTER imagen_url;

ALTER TABLE plan_comidas
  ADD CONSTRAINT fk_plan_comidas_receta FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE SET NULL;

-- Agregar campos extras a recetas (fibra y tags)
ALTER TABLE recetas
  ADD COLUMN fibra DECIMAL(8,2) NULL AFTER grasas,
  ADD COLUMN tags JSON NULL AFTER fibra;

-- Índice para búsqueda rápida de recetas por plan
CREATE INDEX idx_plan_comidas_receta ON plan_comidas(receta_id);
CREATE INDEX idx_plan_comidas_opcion ON plan_comidas(plan_id, tipo_comida, opcion_numero);
