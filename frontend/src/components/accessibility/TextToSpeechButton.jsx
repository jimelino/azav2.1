import React, { useEffect, useRef, useState } from 'react';
import { useVoice } from '../VoiceHelper';
import LucideIcon from '../LucideIcon';
import './TextToSpeechButton.css';

const TextToSpeechButton = ({
  text,
  label = 'Leer sección',
  stopLabel = 'Detener lectura',
  className = '',
  size = 20,
  variant = 'default'
}) => {
  const { speak, stop, isSupported } = useVoice();
  const [isReading, setIsReading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = async (event) => {
    event.stopPropagation();

    if (isReading) {
      stop();
      setIsReading(false);
      return;
    }

    const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    setIsReading(true);
    try {
      await speak(cleanText);
    } finally {
      if (mountedRef.current) {
        setIsReading(false);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={`tts-button tts-button-${variant} ${isReading ? 'is-reading' : ''} ${className}`}
      onClick={handleClick}
      aria-label={isReading ? stopLabel : label}
      aria-pressed={isReading}
      title={isReading ? stopLabel : label}
    >
      <LucideIcon name={isReading ? 'stop' : 'volume'} size={size} />
      <span className="tts-button-pulse" aria-hidden="true" />
    </button>
  );
};

export default TextToSpeechButton;
