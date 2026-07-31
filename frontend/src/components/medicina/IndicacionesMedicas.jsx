import React from 'react';

const IndicacionesMedicas = ({ especialistaId, pacientes, onBack }) => {

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
                    Indicaciones Médicas
                </h2>
            </div>

            <div className="module-content">

                <div className="patient-summary-card">
                    <h3>Nuevo módulo de Indicaciones Médicas</h3>

                    <p>
                        Especialista ID:
                        <strong> {especialistaId}</strong>
                    </p>

                    <p>
                        Pacientes encontrados:
                        <strong> {pacientes?.length || 0}</strong>
                    </p>

                </div>

            </div>

        </section>
    );
};

export default IndicacionesMedicas;