-- FisioterapiaController::completarEjercicio() hace INSERT ... ON DUPLICATE
-- KEY UPDATE sobre registro_videos esperando que (paciente_id, video_id, fecha)
-- sea único, pero la tabla nunca tuvo esa UNIQUE KEY. Resultado: cada doble
-- clic o reintento de red inserta una fila duplicada en vez de actualizar,
-- inflando la racha y el historial de progreso del paciente.
--
-- 1) Deduplicar filas existentes antes de poder crear la UNIQUE KEY: se
--    conserva la fila de mayor id (la más reciente) por combinación de
--    paciente_id + video_id + fecha, preservando completado=1 y el mayor
--    porcentaje_visto si alguna de las duplicadas ya lo tenía.
UPDATE registro_videos rv
INNER JOIN (
    SELECT paciente_id, video_id, fecha,
           MAX(id) AS keep_id,
           MAX(completado) AS any_completado,
           MAX(porcentaje_visto) AS max_porcentaje
    FROM registro_videos
    GROUP BY paciente_id, video_id, fecha
) agg ON rv.id = agg.keep_id
SET rv.completado = agg.any_completado,
    rv.porcentaje_visto = agg.max_porcentaje;

DELETE rv FROM registro_videos rv
LEFT JOIN (
    SELECT MAX(id) AS keep_id
    FROM registro_videos
    GROUP BY paciente_id, video_id, fecha
) keep_rows ON rv.id = keep_rows.keep_id
WHERE keep_rows.keep_id IS NULL;

-- 2) Agregar la UNIQUE KEY que faltaba, para que el ON DUPLICATE KEY UPDATE
--    del controller finalmente actualice en vez de duplicar.
ALTER TABLE registro_videos
    ADD UNIQUE KEY unique_registro_dia (paciente_id, video_id, fecha);
