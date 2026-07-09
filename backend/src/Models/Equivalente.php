<?php

namespace App\Models;

use PDO;
use App\Services\DatabaseService;

class Equivalente
{
    private PDO $db;

    public function __construct()
    {
        $this->db = DatabaseService::getConnection();
    }

    /*=========================
        OBTENER TODOS LOS GRUPOS
    =========================*/

    public function obtenerGrupos()
    {
        $sql = "SELECT *
                FROM equivalentes_planes
                ORDER BY orden";

        return $this->db
            ->query($sql)
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    /*=========================
        ALIMENTOS DEL GRUPO
    =========================*/

    public function obtenerAlimentos($grupoId)
    {
        $sql = "SELECT *
                FROM equivalentes_alimentos
                WHERE equivalente_id=?";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([$grupoId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

}