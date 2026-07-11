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
        // Forzamos los datos exactos y reales de tu servidor de Aiven Cloud
        $driver   = 'mysql';
        $host     = 'mysql-979542e-salazarjimena976-e90a.l.aivencloud.com';
        $port     = '27190';
        $database = 'defaultdb';
        $username = 'avnadmin';
        
        // Buscamos la contraseña que viene configurada en el proyecto para Aiven
        $config = require __DIR__ . '/../../config/database.php';
        $password = $config['password'] ?? ''; 

        // Si por alguna razón el archivo database.php local o de producción no tiene la contraseña,
        // puedes colocarla temporalmente aquí abajo entre las comillas si la tienes a la mano:
        // $password = 'TU_CONTRASEÑA_REAL_DE_AIVEN';

        try {
            $dsn = "{$driver}:host={$host};port={$port};dbname={$database};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            // Pasamos explícitamente el usuario 'avnadmin' para evitar que use 'root'
            $this->connection = new PDO($dsn, $username, $password, $options);
            
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