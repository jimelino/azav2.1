-- Usuario de prueba: mariana15hdzdim@gmail.com (paciente)
-- Password: password123 (mismo hash que los demás usuarios de prueba)
INSERT INTO usuarios (nombre_completo, email, password_hash, rol_id, activo, email_verificado, created_at)
SELECT 'Mariana Hernández', 'mariana15hdzdim@gmail.com', password_hash, 3, 1, 1, NOW()
FROM usuarios WHERE id = 7;

SET @uid = LAST_INSERT_ID();

INSERT INTO pacientes (usuario_id, fecha_nacimiento, sexo, tipo_amputacion, fase_actual, created_at)
VALUES (@uid, '1990-03-15', 'femenino', 'Transtibial', 'adaptacion', NOW());
