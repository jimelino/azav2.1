import React, { useState } from 'react';
import TextToSpeechButton from '../accessibility/TextToSpeechButton';

const LogoImage = ({ src, alt, className, fallbackText }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className={`${className} institutional-logo-fallback`} aria-label={alt}>
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
};

/**
 * InstitutionalHeader - Cabecera institucional DGTIC UNAM
 * Color cabeza: #00589c | Color menu: #004179
 * Logos: ENES_VECTOR_ORO desde public/assets/images + icon-192 desde public
 */
const InstitutionalHeader = ({
  speechText = 'Azaria. Plataforma de Rehabilitación. Sistema de Adherencia Terapéutica.'
}) => {
  return (
    <header className="institutional-header" role="banner">
      {/* Barra superior institucional (Cabeza) */}
      <div className="institutional-bar">
        <div className="institutional-bar-content">
          <div className="institutional-logos">
            <LogoImage
              src="/assets/images/ENES_VECTOR_ORO.png"
              alt="ENES Logo"
              className="institutional-logo-enes"
              fallbackText="ENES UNAM"
            />
            <div className="institutional-divider" aria-hidden="true"></div>
            <LogoImage
              src="/icon-192.png"
              alt="Azaria Logo"
              className="institutional-logo-azaria"
              fallbackText="Azaria 2.0"
            />
          </div>
          <div className="institutional-title-group">
            <span className="institutional-service-name">Azaria</span>
            <span className="institutional-service-desc">Plataforma de Rehabilitacion</span>
          </div>
          <div className="institutional-actions">
            <TextToSpeechButton
              text={speechText}
              label="Leer encabezado de la página"
              stopLabel="Detener lectura del encabezado"
              variant="ghost"
              size={20}
            />
          </div>
        </div>
      </div>
      {/* Barra de menu institucional */}
      <div className="institutional-menu-bar">
        <div className="institutional-menu-content">
          <span className="institutional-menu-text">Sistema de Adherencia Terapeutica</span>
        </div>
      </div>
    </header>
  );
};

export default InstitutionalHeader;
