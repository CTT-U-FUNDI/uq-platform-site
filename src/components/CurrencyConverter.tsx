// ============================================================
// CURRENCY CONVERTER — Saisie CDF avec equivalent BORB
// ============================================================
import { useEffect, useState } from 'react';
import { convertCDFToBORB, formatCDF, formatBORB } from '../services/currency';

interface Props {
  deviseLocale?: string;
  onMontantChange?: (montantCDF: number, montantBORB: number) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: number;
}

export function CurrencyConverter({
  deviseLocale = 'CDF',
  onMontantChange,
  placeholder,
  disabled = false,
  initialValue,
}: Props) {
  const [montantStr, setMontantStr] = useState(
    initialValue ? String(initialValue) : ''
  );
  const [equivalentBORB, setEquivalentBORB] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const num = parseFloat(montantStr);
    if (isNaN(num) || num <= 0) {
      setEquivalentBORB(0);
      onMontantChange?.(0, 0);
      return;
    }

    setLoading(true);
    convertCDFToBORB(num, deviseLocale)
      .then(borb => {
        setEquivalentBORB(borb);
        onMontantChange?.(num, borb);
      })
      .catch(() => {
        setEquivalentBORB(0);
      })
      .finally(() => setLoading(false));
  }, [montantStr, deviseLocale]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={montantStr}
          onChange={e => setMontantStr(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || `Montant en ${deviseLocale}`}
          className="w-full text-4xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-3 disabled:opacity-50"
          autoFocus
        />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">
          {deviseLocale}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {loading ? (
            <span className="animate-pulse">Calcul...</span>
          ) : (
            <>≈ {formatBORB(equivalentBORB)}</>
          )}
        </span>
        {montantStr && parseFloat(montantStr) > 0 && (
          <span className="text-gray-500 text-xs">
            {formatCDF(parseFloat(montantStr))}
          </span>
        )}
      </div>
    </div>
  );
}
