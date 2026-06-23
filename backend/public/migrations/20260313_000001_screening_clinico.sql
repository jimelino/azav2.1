-- Agregar preguntas clínicas de screening a solicitudes_admision
ALTER TABLE solicitudes_admision
    ADD COLUMN herida_consolidada ENUM('si','no') NULL AFTER tiempo_desde_amputacion,
    ADD COLUMN herida_infeccion ENUM('si','no') NULL AFTER herida_consolidada,
    ADD COLUMN padece_cronico ENUM('si','no') NULL AFTER herida_infeccion;
