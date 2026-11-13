// ============================================================
// PROTECTED BADGE — Signal de confiance BlockOrb
// ============================================================
import { useState } from 'react';
import { Icon } from './ui/Icon';

interface Props {
  montantCDF: number;
  montantUSD: number;
  compact?: boolean;
}

export function ProtectedBadge({ montantCDF, montantUSD, compact = false }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
        style={{ fontSize: compact ? '12px' : '14px' }}
      >
        <span><Icon name="shield" size={20} tone="success" /></span>
        <span className="font-medium">Réserve Protégée BlockOrb</span>
        {!compact && (
          <span className="text-xs text-gray-500">
            (min. ${montantUSD.toFixed(2)} USD)
          </span>
        )}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2"><Icon name="shield" size={32} tone="success" /></div>
              <h3 className="text-lg font-bold text-gray-900">
                Réserve Protégée
              </h3>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              Vos <strong>{montantCDF.toLocaleString('fr-FR')} CDF</strong> sont
              verrouillés à une valeur équivalente de{' '}
              <strong>${montantUSD.toFixed(2)} USD</strong>.
            </p>

            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              Même si le franc congolais chute, votre pouvoir d'achat reste
              intact.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
