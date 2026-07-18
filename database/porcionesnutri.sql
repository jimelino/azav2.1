CREATE TABLE nutrition_plans (

    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    nutritionist_id INT NULL,

    calories INT DEFAULT 0,

    proteins INT DEFAULT 0,

    carbohydrates INT DEFAULT 0,

    fats INT DEFAULT 0,

    recommendations TEXT,

    status ENUM('Activo','Inactivo') DEFAULT 'Activo',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

);
CREATE TABLE nutrition_portions (

    id INT AUTO_INCREMENT PRIMARY KEY,

    plan_id INT NOT NULL,

    food_group VARCHAR(80),

    breakfast INT DEFAULT 0,

    snack_morning INT DEFAULT 0,

    lunch INT DEFAULT 0,

    snack_afternoon INT DEFAULT 0,

    dinner INT DEFAULT 0

);

CREATE TABLE food_categories (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    icon VARCHAR(50)

);

CREATE TABLE foods (

    id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT,

    name VARCHAR(150),

    active TINYINT DEFAULT 1

);
CREATE TABLE nutrition_plan_foods (

    id INT AUTO_INCREMENT PRIMARY KEY,

    plan_id INT,

    food_id INT

);

INSERT INTO food_categories(name,icon)

VALUES

('Frutas','🍎'),

('Verduras','🥬'),

('Cereales','🍞'),

('Leguminosas','🫘'),

('Proteínas','🥩'),

('Lácteos','🥛'),

('Grasas','🥑');


/*datos de prueba para el plan nutri*/
INSERT INTO foods(category_id,name)

VALUES

(1,'Manzana'),
(1,'Papaya'),
(1,'Plátano'),
(1,'Melón'),
(1,'Kiwi'),
(1,'Mango'),

(2,'Lechuga'),
(2,'Espinaca'),
(2,'Pepino'),
(2,'Brócoli'),

(3,'Pan Integral'),
(3,'Avena'),
(3,'Tortilla'),

(4,'Frijoles'),
(4,'Lentejas'),

(5,'Pollo'),
(5,'Atún'),
(5,'Huevo'),
(5,'Pescado'),

(6,'Leche'),
(6,'Yogurt'),

(7,'Aguacate'),
(7,'Aceite de Oliva'),
(7,'Nueces');

/**/
CREATE TABLE plan_porciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    plan_id INT UNSIGNED NOT NULL,

    grupo_alimenticio VARCHAR(80) NOT NULL,

    desayuno INT DEFAULT 0,

    colacion_matutina INT DEFAULT 0,

    comida INT DEFAULT 0,

    colacion_vespertina INT DEFAULT 0,

    cena INT DEFAULT 0,

    FOREIGN KEY (plan_id)
        REFERENCES planes_nutricionales(id)
        ON DELETE CASCADE
);