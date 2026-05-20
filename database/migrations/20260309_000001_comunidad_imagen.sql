-- Agregar columna imagen_url a publicaciones_comunidad
ALTER TABLE publicaciones_comunidad
ADD COLUMN imagen_url VARCHAR(500) NULL AFTER contenido;
