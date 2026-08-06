import React from 'react';

/**
 * InstitutionalFooter - Pie de pagina institucional DGTIC UNAM
 * Pie 1: #00589c | Pie 2: #004179
 */
const InstitutionalFooter = () => {
  return (
    <footer className="institutional-footer" role="contentinfo">
      {/* Pie 1 */}
      <div className="institutional-footer-1">
        <div className="institutional-footer-content">
          <div className="institutional-footer-logos">
            <img
              src="/assets/images/ENES VECTOR AZUL.png"
              alt="ENES Logo"
              className="institutional-footer-logo institutional-footer-logo-enes"
            />
            <img
              src="/icon-192.png"
              alt="Azaria Logo"
              className="institutional-footer-logo"
            />
          </div>
          <div className="institutional-footer-info">
            <p className="institutional-footer-name">Unidad de Investigación en Órtesis y Prótesis - ENES Juriquilla, UNAM</p>
            <p className="institutional-footer-address">Boulevard Juriquilla 3001, Querétaro, Qro.</p>
            <p className="institutional-footer-contact">
              <a href="tel:+5214424369592">+52 1 442 436 9592</a>
              <span className="contact-separator"> · </span>
              <a href="mailto:unidadinvestigacionoyp_enesj@unam.mx">unidadinvestigacionoyp_enesj@unam.mx</a>
            </p>
          </div>
        </div>
      </div>
      {/* Pie 2 */}
      <div className="institutional-footer-2">
        <div className="institutional-footer-content">
          <p className="institutional-footer-copy">
            &copy; {new Date().getFullYear()} Azaria - Plataforma de Rehabilitacion. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default InstitutionalFooter;
