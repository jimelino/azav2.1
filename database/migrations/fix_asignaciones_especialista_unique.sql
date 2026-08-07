-- La UNIQUE KEY (paciente_id, area_medica_id, activo) revienta con
-- "Duplicate entry" en la segunda reasignacion de especialista para el
-- mismo paciente+area, porque ya quedan dos filas historicas con
-- activo=0 para esa combinacion. Se reemplaza por una columna generada
-- que solo participa en la unicidad cuando la fila esta activa
-- (activo=1); las filas inactivas quedan con NULL y MySQL permite
-- múltiples NULL en una UNIQUE KEY, así que el historial queda libre.
-- unique_asignacion era tambien el único índice que soportaba la FK de
-- paciente_id (InnoDB exige un índice con esa columna como prefijo para
-- cada FK); hay que darle uno nuevo antes de tumbar el viejo o el ALTER
-- falla con errno 150 "Foreign key constraint is incorrectly formed".
--
-- La columna generada es VIRTUAL (no STORED): un STORED obliga a MySQL
-- a reconstruir la tabla completa (ALGORITHM=COPY) y esa reconstrucción
-- revalida las 4 foreign keys desde cero, lo que puede tronar con
-- errno 1215 "Cannot add foreign key constraint" según el estado de los
-- datos. VIRTUAL evita esa reconstrucción por completo.
ALTER TABLE asignaciones_especialista
  ADD INDEX idx_paciente (paciente_id),
  DROP INDEX unique_asignacion,
  ADD COLUMN activo_unico VARCHAR(40) GENERATED ALWAYS AS (
    IF(activo = 1, CONCAT(paciente_id, '-', area_medica_id), NULL)
  ) VIRTUAL,
  ADD UNIQUE KEY unique_asignacion_activa (activo_unico);
