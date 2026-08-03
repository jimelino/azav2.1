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
        // Intentamos cargar el archivo local, si no existe usamos un array vacío
        $config_file = __DIR__ . '/../../config/database.php';
        $config = file_exists($config_file) ? require $config_file : [];

        // Obtenemos los valores desde las variables de entorno de Railway
        // o caemos al valor que está en tu archivo config/database.php
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? '3306';
        $db   = $config['database'] ?? 'vitalia_v2';
        $user = $config['username'] ?? 'root';
        $pass = $config['password'] ?? '';
        
        $driver = $config['driver'] ?? 'mysql';
        $charset = $config['charset'] ?? 'utf8mb4';
        $options = $config['options'] ?? [];

        try {
            $dsn = "{$driver}:host={$host};port={$port};dbname={$db};charset={$charset}";

            $this->connection = new PDO($dsn, $user, $pass, $options);
            
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
            if (!$this->connection) {
                throw new \Exception("La conexión a la base de datos no está activa.");
            }

            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage());
            
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
