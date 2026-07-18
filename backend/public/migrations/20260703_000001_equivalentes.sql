-- ==========================================
-- TABLA DE GRUPOS DE EQUIVALENTES
-- ==========================================

CREATE TABLE IF NOT EXISTS grupos_equivalentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA DE ALIMENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS alimentos_equivalentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grupo_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    cantidad VARCHAR(80) NOT NULL,
    calorias DECIMAL(6,2) DEFAULT NULL,
    proteinas DECIMAL(6,2) DEFAULT NULL,
    carbohidratos DECIMAL(6,2) DEFAULT NULL,
    grasas DECIMAL(6,2) DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_equivalentes_grupo
        FOREIGN KEY (grupo_id)
        REFERENCES grupos_equivalentes(id)
        ON DELETE CASCADE
);

INSERT INTO grupos_equivalentes(nombre,orden) VALUES
('Verduras',1),
('Frutas',2),
('Cereales',3),
('Leguminosas',4),
('Leche',5),
('AOA Muy Bajo',6),
('AOA Bajo',7),
('AOA Moderado',8),
('AOA Alto',9),
('Grasas',10),
('Azúcares',11);

INSERT INTO alimentos_equivalentes
(grupo_id,nombre,cantidad,calorias,proteinas,carbohidratos,grasas)
VALUES

(1,'Lechuga','2 tazas',25,2,5,0),
(1,'Espinaca','2 tazas',25,2,4,0),

(2,'Manzana','1 pieza',60,0,15,0),
(2,'Papaya','1 taza',60,0,15,0),

(3,'Tortilla de maíz','1 pieza',70,2,15,1),
(3,'Pan integral','1 rebanada',70,3,15,1),

(4,'Frijoles','1/2 taza',120,8,20,1),

(5,'Leche descremada','1 taza',95,9,12,0),

(6,'Pechuga de pollo','30 g',55,7,0,1),

(10,'Aceite de oliva','1 cucharadita',45,0,0,5),

(11,'Miel','1 cucharadita',20,0,5,0);