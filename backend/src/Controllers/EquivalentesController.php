<?php

namespace App\Controllers;

use App\Models\Equivalente;

class EquivalentesController
{

    private $modelo;

    public function __construct()
    {
        $this->modelo = new Equivalente();
    }

    /*
    ============================
    TODOS LOS GRUPOS
    ============================
    */

    public function index()
    {

        $grupos = $this->modelo->obtenerGrupos();

        foreach($grupos as &$grupo){

            $grupo["alimentos"] =
                $this->modelo
                ->obtenerAlimentos($grupo["id"]);

        }

        echo json_encode($grupos);

    }

}