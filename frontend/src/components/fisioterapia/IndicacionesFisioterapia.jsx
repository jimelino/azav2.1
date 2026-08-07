import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./IndicacionesFisioterapia.css";

const fases = [
    { id: 1, nombre: "Adaptación al ejercicio" },
    { id: 2, nombre: "Preprotésica" },
    { id: 3, nombre: "Protésica" },
    { id: 4, nombre: "Postprotésica" }
];

const IndicacionesFisioterapia = ({

    pacienteId,
    especialistaId,
    onBack

}) => {

    const [paciente, setPaciente] = useState(null);

    const [faseActual, setFaseActual] = useState(1);

    const [indicaciones, setIndicaciones] = useState("");

    const [guardando, setGuardando] = useState(false);

    const [cargando, setCargando] = useState(true);

    const cargarInformacion = async () => {

        try{

            const infoPaciente = await api.get(

                `/fisioterapia/paciente/${pacienteId}`

            );

            if(infoPaciente.success){

                setPaciente(infoPaciente.data);

            }

            const res = await api.get(

                `/fisioterapia/indicaciones/${pacienteId}`

            );

            if(res.success && res.data){

                setFaseActual(

                    res.data.fase_actual || 1

                );

                setIndicaciones(

                    res.data.indicaciones || ""

                );

            }

        }catch(error){

            console.error(error);

        }finally{

            setCargando(false);

        }

    };

    useEffect(()=>{

        cargarInformacion();

    },[pacienteId]);

    const guardarCambios = async()=>{

        if(indicaciones.trim()===""){

            alert("Escriba las indicaciones.");

            return;

        }

        try{

            setGuardando(true);

            const res = await api.post(

                "/fisioterapia/indicaciones",

                {

                    paciente_id:pacienteId,

                    especialista_id:especialistaId,

                    fase_actual:faseActual,

                    indicaciones

                }

            );

            if(res.success){

                alert("Indicaciones guardadas correctamente.");

            }

        }catch(error){

            console.error(error);

            alert("No fue posible guardar.");

        }finally{

            setGuardando(false);

        }

    };
    const eliminarIndicacion = async () => {

    const confirmar = window.confirm(

        "¿Desea eliminar las indicaciones de este paciente?"

    );

    if (!confirmar) return;

    try {

        const res = await api.delete(

            `/fisioterapia/indicaciones/${pacienteId}`

        );

        if (res.success) {

            setIndicaciones("");

            setFaseActual(1);

            alert("Indicaciones eliminadas correctamente.");

        }

    } catch (error) {

        console.error(error);

        alert("No fue posible eliminar las indicaciones.");

    }

};
        return (

        <section className="indicaciones-fisio">

            <div className="titulo-modulo">

                <button

                    className="back-btn"

                    onClick={onBack}

                >

                    ← Regresar

                </button>

                <div>

                    <h1>

                        Indicaciones de Fisioterapia

                    </h1>

                    <p>

                        Administre la fase del tratamiento y las indicaciones asignadas al paciente.

                    </p>

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

                    <>

                        {/* ==========================
                           TARJETA DEL PACIENTE
                        =========================== */}

                        <div className="paciente-card">

                            <div className="paciente-avatar">

                                👤

                            </div>

                            <div className="paciente-info">

                                <h2>

                                    {paciente?.nombre_completo || "Paciente"}

                                </h2>

                                <span>

                                    {paciente?.email}

                                </span>

                            </div>

                            <div className="paciente-extra">

                                <div className="dato-extra">

                                    <span>

                                        Especialista

                                    </span>

                                    <strong>

                                        {paciente?.especialista || "Lic. Fisioterapia"}

                                    </strong>

                                </div>

                                <div className="dato-extra">

                                    <span>

                                        Área

                                    </span>

                                    <strong>

                                        {paciente?.area || "Fisioterapia"}

                                    </strong>

                                </div>

                            </div>

                        </div>

                        {/* ==========================
                           TARJETA PRINCIPAL
                        =========================== */}

                        <div className="indicaciones-card">

                            <div className="panel-info">

                                <h2>

                                    📋 Panel de seguimiento del paciente

                                </h2>

                                <p>

                                    Seleccione la fase del tratamiento y escriba las indicaciones que el paciente visualizará dentro de su aplicación.

                                </p>

                            </div>
                                                        {/* ==========================
                               FORMULARIO
                            =========================== */}

                            <div className="formulario">

                                <div className="campo">

                                    <label>

                                        Fase del tratamiento

                                    </label>

                                    <select

                                        value={faseActual}

                                        onChange={(e)=>

                                            setFaseActual(

                                                Number(e.target.value)

                                            )

                                        }

                                    >

                                        {

                                            fases.map((fase)=>(

                                                <option

                                                    key={fase.id}

                                                    value={fase.id}

                                                >

                                                    {fase.nombre}

                                                </option>

                                            ))

                                        }

                                    </select>

                                </div>

                                <div className="campo">

                                    <label>

                                        Indicaciones para el paciente

                                    </label>

                                    <textarea

                                        value={indicaciones}

                                        onChange={(e)=>

                                            setIndicaciones(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Escriba aquí las indicaciones que deberá seguir el paciente durante esta fase del tratamiento..."

                                    />

                                </div>

                            </div>

                            <div className="acciones-indicaciones">

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

    indicaciones.trim() !== ""

    ?

    "Actualizar indicación"

    :

    "Guardar indicación"

}
    </button>

    {

    indicaciones.trim() !== "" && (

        <button

            className="btn-eliminar"

            onClick={eliminarIndicacion}

        >

           Eliminar indicación

        </button>

    )

}

</div>

                        </div>

                    </>

                )

            }

        </section>

    );

};

export default IndicacionesFisioterapia;