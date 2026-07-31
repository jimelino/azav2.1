import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function IndicacionesModule({ especialistaId }) {

    const [pacientes,setPacientes]=useState([]);

    const [form,setForm]=useState({
        paciente_id:"",
        titulo:"",
        descripcion:"",
        prioridad:"media",
        fecha_vencimiento:""
    });

    useEffect(()=>{

        fetch(API+"/api/indicaciones/pacientes",{
            credentials:"include"
        })
        .then(r=>r.json())
        .then(res=>{

            if(res.success){
                setPacientes(res.data);
            }

        });

    },[]);


    const guardar=()=>{

        fetch(API+"/api/indicaciones",{

            method:"POST",

            credentials:"include",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                ...form,

                especialista_id:especialistaId

            })

        })
        .then(r=>r.json())
        .then(res=>{

            if(res.success){

                alert("Indicación guardada correctamente");

                setForm({

                    paciente_id:"",
                    titulo:"",
                    descripcion:"",
                    prioridad:"media",
                    fecha_vencimiento:""

                });

            }

        });

    };


    return(

        <div className="module-card">

            <h3>Indicaciones al paciente</h3>

            <select
            value={form.paciente_id}
            onChange={e=>setForm({...form,paciente_id:e.target.value})}
            >

                <option value="">
                    Seleccione paciente
                </option>

                {pacientes.map(p=>(

                    <option
                    key={p.id}
                    value={p.id}
                    >
                        {p.nombre_completo}
                    </option>

                ))}

            </select>

            <input

            placeholder="Título"

            value={form.titulo}

            onChange={e=>setForm({...form,titulo:e.target.value})}

            />

            <textarea

            placeholder="Escriba las indicaciones..."

            rows={6}

            value={form.descripcion}

            onChange={e=>setForm({...form,descripcion:e.target.value})}

            />

            <select

            value={form.prioridad}

            onChange={e=>setForm({...form,prioridad:e.target.value})}

            >

                <option value="baja">Baja</option>

                <option value="media">Media</option>

                <option value="alta">Alta</option>

            </select>

            <input

            type="date"

            value={form.fecha_vencimiento}

            onChange={e=>setForm({...form,fecha_vencimiento:e.target.value})}

            />

            <button

            onClick={guardar}

            >

                Guardar indicación

            </button>

        </div>

    );

}