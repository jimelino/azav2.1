import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./IndicacionesFisioterapia.css";

const fases = [

    {
        id: 1,
        nombre: "Adaptación al ejercicio"
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

const IndicacionesFisioterapia = ({

    pacienteId,
    especialistaId,
    onBack

}) => {

    const [faseActual, setFaseActual] = useState(1);

    const [indicaciones, setIndicaciones] = useState("");

    const [guardando, setGuardando] = useState(false);

    const [cargando, setCargando] = useState(true);
    const [paciente, setPaciente] = useState(null);

    const cargarInformacion = async () => {

        try {

            const infoPaciente = await api.get(
    `/fisioterapia/paciente/${pacienteId}`
);

if (infoPaciente.success) {

    setPaciente(infoPaciente.data);

}

            const res = await api.get(

                `/fisioterapia/indicaciones/${pacienteId}`

            );

            if (res.success && res.data) {

                setFaseActual(

                    res.data.fase_actual || 1

                );

                setIndicaciones(

                    res.data.indicaciones || ""

                );

            }

        } catch (error) {

            console.error(error);

        } finally {

            setCargando(false);

        }

    };

    useEffect(() => {

        cargarInformacion();

    }, [pacienteId]);

    const guardarCambios = async () => {

        if (indicaciones.trim() === "") {

            alert("Escriba las indicaciones para el paciente.");

            return;

        }

        try {

            setGuardando(true);

            const res = await api.post(

                "/fisioterapia/indicaciones",

                {

                    paciente_id: pacienteId,

                    especialista_id: especialistaId,

                    fase_actual: faseActual,

                    indicaciones: indicaciones

                }

            );

            if (res.success) {

                alert("Información guardada correctamente.");

            }

        } catch (error) {

            console.error(error);

            alert("No fue posible guardar la información.");

        } finally {

            setGuardando(false);

        }

    };
        return (

        <section className="indicaciones-fisio">

            <div className="module-header">

                <button
                    className="back-btn"
                    onClick={onBack}
                >
                    ← Regresar
                </button>

                <h2>

                    Indicaciones de Fisioterapia

                </h2>
                <div className="paciente-card">

    <div className="paciente-avatar">

        👤

    </div>

    <div className="paciente-info">

        <h2>

            {paciente?.nombre_completo || "Paciente"}

        </h2>

        <p>

             {paciente?.email || "Correo no disponible"}

        </p>

    </div>

    <div className="paciente-extra">

        <span>

            Especialista

        </span>

        <strong>

            {paciente?.especialista || "Sin asignar"}

        </strong>

        <br /><br />

        <span>

            Área

        </span>

        <strong>

            {paciente?.area || "Fisioterapia"}

        </strong>

    </div>

</div>
            </div>

            {

                cargando ?

                (

                    <div className="loading-card">

                        Cargando información...

                    </div>

                )

                :

                (

                    <div className="indicaciones-card">

                        <div className="info-paciente">

                            <h3>

                                Panel de seguimiento del paciente

                            </h3>

                            <p>

                                En este módulo podrá actualizar la fase del tratamiento y asignar las indicaciones que visualizará el paciente

                            </p>

                        </div>

                        <div className="formulario-indicaciones">

    <div className="campo">

        <label>

            Fase del tratamiento

        </label>

        <select
            value={faseActual}
            onChange={(e)=>setFaseActual(Number(e.target.value))}
        >

            {fases.map((fase)=>(

                <option
                    key={fase.id}
                    value={fase.id}
                >
                    {fase.nombre}
                </option>

            ))}

        </select>

    </div>


    <div className="campo">

        <label>

            Indicaciones para el paciente

        </label>

        <textarea

            value={indicaciones}

            onChange={(e)=>setIndicaciones(e.target.value)}

            placeholder="Escriba aquí las indicaciones que deberá seguir el paciente..."

        />

    </div>

</div>

                       <div className="boton-guardar">

    <button

        className="btn-guardar"

        onClick={guardarCambios}

        disabled={guardando}

    >

        {

            guardando

            ?

            "Guardando..."

            :

            "Guardar cambios"

        }

    </button>

</div>
                        

                    </div>

                )

            }

        </section>

    );

};

export default IndicacionesFisioterapia;