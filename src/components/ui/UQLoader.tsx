import { Icon } from './Icon';
import { LogoUQ } from './LogoUQ';

interface UQLoaderProps {
  message?: string;
  subMessage?: string;
}

export function UQLoader({
  message = 'Chargement du coffre...',
  subMessage = 'Connexion au réseau UQ',
}: UQLoaderProps) {
  return (
    <div
      className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center uq-loader-fade-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="text-center">
        <div className="uq-loader-mark-wrap" aria-hidden="true">
          <span className="uq-loader-orbit" />
          <LogoUQ size={88} animated />
        </div>

        <p className="text-base font-semibold text-white mb-2">{message}</p>
        <p className="text-xs text-gray-500 uq-loader-text-pulse">{subMessage}</p>

        <div className="mt-4 mb-2 uq-loader-text-pulse">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#FFD700' }}>
            <Icon name="shield" size={12} tone="success" /> Fonds immunisés par ORB : 100% sécurisé
          </p>
        </div>

        <div className="uq-loader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

export default UQLoader;
