import React from "react";
import "./IndicacionesPaciente.css";

const textosFase = {

    1: {

        nombre: "Adaptación",

        color: "#2E7D32",

        descripcion:
            "En esta etapa estás comenzando tu proceso de rehabilitación. Poco a poco recuperarás fuerza, equilibrio y confianza en tus movimientos. Sigue las indicaciones de tu fisioterapeuta y realiza los ejercicios con calma y constancia."

    },

    2: {

        nombre: "Preprotésica",

        color: "#E67E22",

        descripcion:
            "En esta etapa tu cuerpo se prepara para utilizar una prótesis. Los ejercicios ayudarán a fortalecer tus músculos, mejorar el equilibrio y preparar el muñón para facilitar una mejor adaptación."

    },

    3: {

        nombre: "Protésica",

        color: "#F39C12",

        descripcion:
            "En esta etapa comenzarás a aprender a utilizar tu prótesis. Practicarás caminar, mantener el equilibrio y realizar actividades diarias con mayor seguridad. La práctica constante será muy importante."

    },

    4: {

        nombre: "Postprotésica",

        color: "#1565C0",

        descripcion:
            "En esta etapa continuarás fortaleciendo tu cuerpo para desenvolverte con mayor independencia y seguridad. También aprenderás a cuidar correctamente tu prótesis y mantener tus avances."

    }

};

const IndicacionesPaciente = ({ fase, indicaciones }) => {

    const info = textosFase[fase] || textosFase[1];

    return (

        <div className="indicaciones-paciente-card">

            <h2>

                📋 Indicaciones de tu fisioterapeuta

            </h2>

            <div
                className="fase-actual"
                style={{ borderLeft:`6px solid ${info.color}` }}
            >

                <h3>

                    Fase actual

                </h3>

                <span
                    style={{ color:info.color }}
                >

                    {info.nombre}

                </span>

            </div>

            <div className="descripcion-fase">

                <p>

                    {info.descripcion}

                </p>

            </div>

            <div className="indicaciones-texto">

                <h3>

                    Indicaciones

                </h3>

                <p>

                    {

                        indicaciones ||

                        "Tu fisioterapeuta aún no ha registrado indicaciones para esta etapa."

                    }

                </p>

            </div>

        

        </div>

    );

};

export default IndicacionesPaciente;