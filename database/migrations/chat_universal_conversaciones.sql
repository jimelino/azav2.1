-- Activa el "modo chat universal" que MensajesController ya sabe usar
-- (soportaChatUniversal() detecta la columna participante_1_id), para
-- permitir conversaciones especialista<->especialista ademas de las
-- paciente<->especialista existentes. Sin esta migracion, conversaciones
-- solo tiene paciente_id/especialista_id (ambos NOT NULL), lo que hace
-- estructuralmente imposible guardar una conversacion entre dos
-- especialistas (no hay donde meter un segundo especialista).
--
-- paciente_id/especialista_id se dejan nullable y se conservan para las
-- conversaciones paciente<->especialista (le siguen dando contexto
-- directo sin tener que resolverlo desde participante_1/2). Para
-- especialista<->especialista quedan NULL.

ALTER TABLE conversaciones
  MODIFY paciente_id INT UNSIGNED NULL,
  MODIFY especialista_id INT UNSIGNED NULL,
  ADD COLUMN tipo VARCHAR(30) NOT NULL DEFAULT 'paciente_especialista' AFTER id,
  ADD COLUMN participante_1_id INT UNSIGNED NULL AFTER tipo,
  ADD COLUMN participante_2_id INT UNSIGNED NULL AFTER participante_1_id;

-- Backfill: para cada conversacion paciente-especialista existente,
-- participante_1/2 son los dos usuarios ordenados por id (mismo criterio
-- que ordenarParticipantes() en el controller).
UPDATE conversaciones c
INNER JOIN pacientes p ON p.id = c.paciente_id
SET c.participante_1_id = LEAST(p.usuario_id, c.especialista_id),
    c.participante_2_id = GREATEST(p.usuario_id, c.especialista_id)
WHERE c.participante_1_id IS NULL;

-- unique_conversacion tambien sostenia la FK de paciente_id (mismo problema
-- que ya vimos en asignaciones_especialista): hay que darle un indice propio
-- antes de tumbarla.
ALTER TABLE conversaciones
  MODIFY participante_1_id INT UNSIGNED NOT NULL,
  MODIFY participante_2_id INT UNSIGNED NOT NULL,
  ADD INDEX idx_paciente (paciente_id),
  DROP INDEX unique_conversacion,
  ADD UNIQUE KEY unique_conversacion_universal (tipo, participante_1_id, participante_2_id),
  ADD INDEX idx_participante_1 (participante_1_id),
  ADD INDEX idx_participante_2 (participante_2_id),
  ADD CONSTRAINT conversaciones_participante_1_fk FOREIGN KEY (participante_1_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  ADD CONSTRAINT conversaciones_participante_2_fk FOREIGN KEY (participante_2_id) REFERENCES usuarios(id) ON DELETE CASCADE;
