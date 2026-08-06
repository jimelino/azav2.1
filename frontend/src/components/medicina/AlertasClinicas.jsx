import React, { useEffect, useState } from "react";
import api from "../../services/api";
import LucideIcon from "../LucideIcon";

const AlertasClinicas = ({
    especialistaId,
    area,
    onBack
}) => {
    console.log("Entré al módulo de Alertas");

    const [alertas, setAlertas] = useState([]);

    const cargarAlertas = async () => {
        console.log("Área recibida:", area);


        try {

            const res = await api.get(`/alertas/${area}`);
            console.log("Respuesta:", res);

            console.log(res);

            if (res.success) {
                console.log("Alertas:", res.data);

                setAlertas(res.data);

            }

        } catch (error) {

            console.error(error);

        }

    };
    

   useEffect(() => {
    console.log("Cargando alertas...");

    if (area) {
    
        cargarAlertas();

    }

}, [area]);

    return (

        <section className="module-view">

            <div className="module-header">

                <button
                    className="back-btn"
                    onClick={onBack}
                >
                    ← Regresar
                </button>

                <h2 className="module-title">

                    <LucideIcon
                        name="bell-ring"
                        size={22}
                    />

                    Alertas Clínicas - {area}

                </h2>

            </div>

            <div className="consultas-list">

                {

                    alertas.length === 0 ?

                    (

                        <div className="empty-state">

                            No existen alertas.

                        </div>

                    )

                    :

                    alertas.map((a) => (

                        <div
                            key={a.id}
                            className="consulta-card"
                        >

                            <h3>{a.titulo}</h3>

                            <p>

                                <strong>Paciente:</strong>

                                {" "}

                                {a.paciente}

                            </p>

                            <p>

                                {a.descripcion}

                            </p>

                            <small>

                                Prioridad:

                                {" "}

                                {a.prioridad}

                            </small>

                        </div>

                    ))

                }

            </div>

        </section>

    );

};

export default AlertasClinicas;