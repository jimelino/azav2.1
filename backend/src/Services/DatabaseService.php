<?php

namespace App\Services;

use PDO;
use PDOException;

class DatabaseService
{
    private static $instance = null;
    private $connection;

    private function __construct()
    {
        $config = require __DIR__ . '/../../config/database.php';

        try {
            $dsn = "{$config['driver']}:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";

            $this->connection = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            
            // ASEGURAMOS QUE PDO SIEMPRE LANCE EXCEPCIONES SI ALGO FALLA EN LAS CONSULTAS
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new \Exception("No se pudo conectar a la base de datos: " . $e->getMessage());
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function query($sql, $params = [])
    {
        try {
            // Validar que la conexión exista antes de operar
            if (!$this->connection) {
                throw new \Exception("La conexión a la base de datos no está activa.");
            }

            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage());
            
            // REVELAMOS EL ERROR REAL: Esto nos dirá si falta la tabla, si la columna está mal, etc.
            throw new \Exception("Error en la consulta BD: " . $e->getMessage() . " [SQL: " . $sql . "]");
        }
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function lastInsertId()
    {
        return $this->connection->lastInsertId();
    }

    public function beginTransaction()
    {
        return $this->connection->beginTransaction();
    }

    public function commit()
    {
        return $this->connection->commit();
    }

    public function rollBack()
    {
        return $this->connection->rollBack();
    }

    private function __clone() {}
    public function __wakeup(): void {
        throw new \Exception("Cannot unserialize singleton");
    }
}