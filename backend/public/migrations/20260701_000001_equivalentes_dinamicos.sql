CREATE TABLE IF NOT EXISTS equivalentes_alimentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    equivalente_id INT UNSIGNED NOT NULL,

    alimento VARCHAR(255) NOT NULL,

    porcion VARCHAR(100) NOT NULL DEFAULT '1 porcion',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (equivalente_id)
        REFERENCES equivalentes_planes(id)
        ON DELETE CASCADE
);