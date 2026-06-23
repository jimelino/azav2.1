-- Migración: tabla integraciones_usuario
-- Motivo: OutlookCalendarController y CitasController referencian esta tabla
-- pero no existía en producción, rompiendo el flujo OAuth con Microsoft/Outlook.
-- Detectado en auditoría 2026-04-15 via error.log.
-- Afecta: INSERT/SELECT/UPDATE/DELETE en integraciones_usuario (tokens OAuth2)

CREATE TABLE IF NOT EXISTS `integraciones_usuario` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `usuario_id` INT UNSIGNED NOT NULL,
    `proveedor` VARCHAR(50) NOT NULL COMMENT 'microsoft, google, etc.',
    `access_token` TEXT NOT NULL COMMENT 'Base64 encoded',
    `refresh_token` TEXT NULL COMMENT 'Base64 encoded, puede ser NULL',
    `expira_en` DATETIME NOT NULL,
    `email_externo` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_usuario_proveedor` (`usuario_id`, `proveedor`),
    KEY `idx_proveedor` (`proveedor`),
    KEY `idx_expira` (`expira_en`),
    CONSTRAINT `fk_integraciones_usuario` FOREIGN KEY (`usuario_id`)
        REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
