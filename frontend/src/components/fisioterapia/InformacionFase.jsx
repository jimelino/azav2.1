import React from "react";
import "./InformacionFase.css";

const fases = {

    1: {
        nombre: "Adaptación al ejercicio",
        descripcion:
            "En esta fase el paciente inicia su proceso de rehabilitación física mediante ejercicios supervisados para mejorar la movilidad, fortalecer la musculatura y preparar el cuerpo para avanzar a la siguiente etapa del tratamiento."
    },

    2: {
        nombre: "Preprotésica",
        descripcion:
            "En esta fase el paciente prepara el muñón y fortalece su condición física para facilitar la futura adaptación a una prótesis."
    },

    3: {
        nombre: "Protésica",
        descripcion:
            "En esta fase el paciente comienza el entrenamiento con la prótesis para mejorar el equilibrio, aprender la marcha y recuperar su independencia."
    },

    4: {
        nombre: "Postprotésica",
        descripcion:
            "En esta fase el paciente fortalece las habilidades adquiridas y trabaja para lograr una mayor independencia en sus actividades diarias."
    }

};

const InformacionFase = ({ faseActual = 1 }) => {

    const fase = fases[faseActual];

    return (

        <div className="informacion-fase">

            <h2 className="titulo-fase">
                Fase actual
            </h2>

            <h3 className="nombre-fase">
                {fase.nombre}
            </h3>

            <p className="descripcion-fase">
                {fase.descripcion}
            </p>

        </div>

    );

};

export default InformacionFase;