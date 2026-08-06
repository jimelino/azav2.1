import React from "react";
import "./MapaFases.css";

const fases = [
    {
        id: 1,
        nombre: "Adaptación"
    },
    {
        id: 2,
        nombre: "Preprotésica"
    },
    {
        id: 3,
        nombre: "Protésica"
    },
    {
        id: 4,
        nombre: "Postprotésica"
    }
];

const MapaFases = ({ faseActual = 1 }) => {

    return (

        <div className="mapa-fases">

            {
                fases.map((fase, index) => {

                    const completada = fase.id < faseActual;
                    const actual = fase.id === faseActual;

                    return (

                        <React.Fragment key={fase.id}>

                            <div className="fase-item">

                                <div
                                    className={
                                        actual
                                            ? "fase-circulo actual"
                                            : completada
                                                ? "fase-circulo completada"
                                                : "fase-circulo"
                                    }
                                />

                                <span className="fase-nombre">

                                    {fase.nombre}

                                </span>

                            </div>
                            <div className="leyenda-fases">

    <div className="leyenda-item">
        <span className="leyenda-color verde"></span>
        <span>Fase completada</span>
    </div>

    <div className="leyenda-item">
        <span className="leyenda-color naranja"></span>
        <span>Fase actual</span>
    </div>

    <div className="leyenda-item">
        <span className="leyenda-color gris"></span>
        <span>Fase pendiente</span>
    </div>

</div>

                            {

                                index < fases.length - 1 &&

                                <div
                                    className={
                                        fase.id < faseActual
                                            ? "fase-linea activa"
                                            : "fase-linea"
                                    }
                                />

                            }

                        </React.Fragment>

                    );

                })
            }

        </div>

    );

};

export default MapaFases;