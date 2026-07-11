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
        // 1. Jalamos la configuración original del proyecto (para rescatar la contraseña correcta de producción)
        $config = require __DIR__ . '/../../config/database.php';

        // 2. Forzamos los datos exactos del servidor de Aiven Cloud que Railway necesita resolver
        $driver   = 'mysql';
        $host     = 'mysql-979542e-salazarjimena976-e90a.l.aivencloud.com';
        $port     = '27190';
        $database = 'defaultdb';
        $username = 'avnadmin';
        
        // Rescatamos la contraseña dinámica original que Railway maneja internamente
        $password = $config['password'] ?? ''; 

        try {
            $dsn = "{$driver}:host={$host};port={$port};dbname={$database};charset=utf8mb4";

            // Aiven Cloud OBLIGA a usar ciertas configuraciones de PDO. Mantenemos las tuyas y agregamos compatibilidad SSL por si acaso
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_TIMEOUT => 5 // Evita que la página se quede congelada si tarda en responder
            ];

            // Si el archivo original traía opciones específicas (como certificados SSL de Railway), las sumamos
            if (!empty($config['options'])) {
                $options = array_replace($options, $config['options']);
            }

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