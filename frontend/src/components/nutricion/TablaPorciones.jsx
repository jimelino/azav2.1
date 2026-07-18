import React from "react";

const gruposBase = [
    "Frutas",
    "Verduras",
    "Cereales",
    "Leguminosas",
    "Proteínas",
    "Lácteos",
    "Grasas"
];

const TablaPorciones = ({ porciones, setPorciones }) => {

    const horarios = [
        "desayuno",
        "colacion1",
        "comida",
        "colacion2",
        "cena"
    ];

    const cambiarValor = (grupo, horario, valor) => {

        const copia = { ...porciones };

        if (!copia[grupo]) {

            copia[grupo] = {};

        }

        copia[grupo][horario] = parseInt(valor) || 0;

        setPorciones(copia);

    };

    return (

        <div className="tabla-porciones-card">

            <h2>

                🍽 Tabla de Porciones Diarias

            </h2>

            <table className="tabla-porciones">

                <thead>

                    <tr>

                        <th>Grupo</th>

                        <th>🌅</th>

                        <th>☕</th>

                        <th>🍛</th>

                        <th>🥪</th>

                        <th>🌙</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        gruposBase.map(grupo=>(

                            <tr key={grupo}>

                                <td>

                                    <strong>

                                        {grupo}

                                    </strong>

                                </td>

                                {

                                    horarios.map(horario=>(

                                        <td key={horario}>

                                            <input

                                                type="number"

                                                min="0"

                                                value={
                                                    porciones?.[grupo]?.[horario] ?? 0
                                                }

                                                onChange={(e)=>cambiarValor(
                                                    grupo,
                                                    horario,
                                                    e.target.value
                                                )}

                                            />

                                        </td>

                                    ))

                                }

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

};

export default TablaPorciones;