-- ============================================================================
-- Migración: integración con neupsipro (módulo de Neuropsicología)
-- Ejecutar una sola vez sobre la base de datos de azav2.1 (vitalia_v2).
-- ============================================================================

-- Cachea el JWT de la cuenta de servicio de neupsipro para no hacer login
-- en cada petición. Solo se guarda un renglón (el más reciente se usa).
CREATE TABLE IF NOT EXISTS neupsipro_service_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla puente: vincula un usuario de azav2.1 (por correo) con su paciente
-- en neupsipro (por id_user). Se llena/actualiza vía sincronización
-- (POST /api/admin/neupsipro/sync o /sync/:neupsiproIdUser).
CREATE TABLE IF NOT EXISTS neupsipro_vinculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    azaria_email VARCHAR(191) NOT NULL,
    neupsipro_id_user VARCHAR(64) NOT NULL,
    folio VARCHAR(64) NULL,
    nombre_completo VARCHAR(191) NULL,
    colaborador_asignado VARCHAR(191) NULL,
    protocolo VARCHAR(191) NULL,
    estatus VARCHAR(64) NULL,
    ultima_sincronizacion DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_neupsipro_vinculos_email (azaria_email),
    KEY idx_neupsipro_vinculos_id_user (neupsipro_id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
