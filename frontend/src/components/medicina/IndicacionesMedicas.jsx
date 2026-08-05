import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LucideIcon from '../LucideIcon';

const IndicacionesMedicas = ({
    especialistaId,
    onBack
}) => {

    const [pacienteId, setPacienteId] = useState('');
    const [pacientes, setPacientes] = useState([]);
    const [indicaciones, setIndicaciones] = useState([]);

    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fecha_vencimiento: ''
    });

    const cargarIndicaciones = async (idPaciente) => {

        if (!idPaciente) {
            setIndicaciones([]);
            return;
        }

        try {

            const res = await api.get(`/indicaciones/paciente/${idPaciente}`);

            if (res.success) {
                setIndicaciones(res.data);
            }

        } catch (error) {
            console.error(error);
        }

    };

   useEffect(() => {

    cargarPacientes();

}, []);

useEffect(() => {

    cargarIndicaciones(pacienteId);

}, [pacienteId]);
    //nueva
    const cargarPacientes = async () => {

    try {

        const res = await api.get('/indicaciones/pacientes');

        if (res.success) {

            setPacientes(res.data);

        }

    } catch (error) {

        console.error("Error cargando pacientes:", error);

    }

};
//



    const guardarIndicacion = async () => {

        if (!pacienteId) {

            alert("Selecciona un paciente.");
            return;

        }

        if (!form.descripcion) {

            alert("Escribe una indicación.");
            return;

        }

        try {

            const res = await api.post('/indicaciones', {

                paciente_id: pacienteId,

                especialista_id: especialistaId,

                titulo: form.titulo,

                descripcion: form.descripcion,

                prioridad: form.prioridad,

                fecha_vencimiento: form.fecha_vencimiento

            });

            if (res.success) {

                alert("Indicación guardada.");

                setForm({

                    titulo: '',
                    descripcion: '',
                    prioridad: 'media',
                    fecha_vencimiento: ''

                });

                cargarIndicaciones(pacienteId);

            }

        } catch (error) {

            console.error(error);

            alert("Error al guardar.");

        }


    };
    //neuva funcion eliminar
        const eliminarIndicacion = async (id) => {

    const confirmar = window.confirm(
        "¿Deseas eliminar esta indicación?"
    );

    if (!confirmar) return;

    try {

        await api.delete(`/indicaciones/${id}`);

        cargarIndicaciones(pacienteId);

    } catch (error) {

        console.error(error);
        alert("No se pudo eliminar la indicación.");

    }

}; 




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
                        name="clipboard-list"
                        size={22}
                    />

                    Indicaciones Médicas

                </h2>

            </div>

            <div className="module-content">

                <div className="patient-summary-card">

                    <div className="form-group">

                        <label>Paciente</label>

                        <select
                            className="form-input"
                            value={pacienteId}
                            onChange={(e)=>setPacienteId(e.target.value)}
                        >

                            <option value="">

                                Seleccione un paciente

                            </option>

                            {pacientes.map((p)=>(

                                <option
                                    key={p.id}
                                    value={p.id}
                                >

                                    {p.nombre}

                                </option>

                            ))}

                        </select>

                    </div>

                </div>

                <div className="patient-summary-card">

                    <div className="form-group">

                        <label>Título</label>

                        <input
                            className="form-input"
                            value={form.titulo}
                            onChange={(e)=>setForm({...form,titulo:e.target.value})}
                        />

                    </div>

                    <div className="form-group">

                        <label>Descripción</label>

                        <textarea

                            className="form-input"

                            rows="5"

                            value={form.descripcion}

                            onChange={(e)=>setForm({

                                ...form,

                                descripcion:e.target.value

                            })}

                        />

                    </div>

                    <div className="form-group">

                        <label>Prioridad</label>

                        <select

                            className="form-input"

                            value={form.prioridad}

                            onChange={(e)=>setForm({

                                ...form,

                                prioridad:e.target.value

                            })}

                        >

                            <option value="baja">Baja</option>

                            <option value="media">Media</option>

                            <option value="alta">Alta</option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Fecha límite</label>

                        <input

                            type="date"

                            className="form-input"

                            value={form.fecha_vencimiento}

                            onChange={(e)=>setForm({

                                ...form,

                                fecha_vencimiento:e.target.value

                            })}

                        />

                    </div>

                    <button

                        className="btn-primary"

                        onClick={guardarIndicacion}

                    >

                        Guardar Indicación

                    </button>

                </div>

                <div className="consultas-list">

                    <h3>

                        Indicaciones Registradas

                    </h3>

                    {

                        indicaciones.length===0 ?

                        (

                            <div className="empty-state">

                                No existen indicaciones.

                            </div>

                        )

                        :

                        indicaciones.map((i)=>(

                            <div

                                className="consulta-card"

                                key={i.id}

                            >

                                <h4>

                                    {i.titulo}

                                </h4>

                                <p>

                                    {i.descripcion}

                                </p>

                                <small>

                                    Prioridad:

                                    {' '}

                                    {i.prioridad}

                                </small>
                                 <br /><br />

        <button
            className="btn-eliminar"
            onClick={() => eliminarIndicacion(i.id)}
        >
            🗑 Eliminar
        </button>

                            </div>

                        ))

                    }

                </div>

            </div>

        </section>

    );

};

export default IndicacionesMedicas;