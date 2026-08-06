import React, { useEffect, useState } from "react";
import api from "../../services/api";
import LucideIcon from "../LucideIcon";
import "./AlertasClinicas.css";

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
    const atenderAlerta = async (id) => {

    const confirmar = window.confirm(
        "¿Marcar esta alerta como atendida?"
    );

    if (!confirmar) return;

    try {

        const res = await api.put(`/alertas/${id}/atender`);

        if (res.success) {
            alert("Alerta marcada como atendida.");

            cargarAlertas();

        }

    } catch (error) {

        console.error(error);

        alert("No fue posible actualizar la alerta.");

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
                            <br /><br />

<button
    className="btn-atender-alerta"
    onClick={() => atenderAlerta(a.id)}
>
    Marcar como atendida
</button>

                        </div>

                    ))

                }

            </div>

        </section>

    );

};

export default AlertasClinicas;