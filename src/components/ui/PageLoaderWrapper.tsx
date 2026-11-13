import React, { useEffect, useState } from 'react';
import { UQLoader } from './UQLoader';

interface PageLoaderWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
  loadingSubMessage?: string;
  minDuration?: number;  // Durée minimale du loader (ms)
}

/**
 * Wrapper intelligent qui affiche le loader UQ pendant le chargement
 * et se libère DÈS que les données sont prêtes
 */
export function PageLoaderWrapper({ 
  children, 
  loadingMessage = 'Chargement...',
  loadingSubMessage = 'Connexion au réseau UQ',
  minDuration = 600  // Minimum 600ms pour voir l'animation
}: PageLoaderWrapperProps) {
  const [ready, setReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  useEffect(() => {
    // Dès que le composant est monté + minDuration écoulée
    if (minTimeElapsed) {
      setReady(true);
    }
  }, [minTimeElapsed]);

  if (!ready) {
    return (
      <UQLoader 
        message={loadingMessage}
        subMessage={loadingSubMessage}
      />
    );
  }

  return <div className="uq-loader-fade-in">{children}</div>;
}

export default PageLoaderWrapper;
