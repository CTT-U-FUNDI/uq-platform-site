import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Sheet } from './Ui';
import { PIN_MIN_LENGTH } from '../lib/api';

interface PinSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  length?: number;
  /** Doit renvoyer un message d'erreur pour reinitialiser la saisie, ou rien si succes. */
  onSubmit: (pin: string) => Promise<string | void>;
}

/**
 * Saisie du code PIN : pavé numerique, validation automatique
 * a la longueur configuree cote compte.
 */
export function PinSheet({
  open,
  onClose,
  title = 'Code PIN',
  subtitle = 'Confirme ton operation',
  // Repli seulement : chaque appelant passe la longueur lue via /pin/status.
  length = PIN_MIN_LENGTH,
  onSubmit,
}: PinSheetProps) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setBusy(false);
    }
  }, [open]);

  const submit = async (value: string) => {
    setBusy(true);
    setError('');
    try {
      const message = await onSubmit(value);
      if (message) {
        setError(message);
        setPin('');
      }
    } catch (err) {
      const message =
        typeof err === 'object' && err !== null
          ? (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
              ?.message || (err as { message?: string }).message
          : undefined;
      setError(message || 'Verification impossible');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const push = (digit: string) => {
    if (busy) return;
    const next = `${pin}${digit}`.slice(0, length);
    setPin(next);
    setError('');
    if (next.length === length) void submit(next);
  };

  const remove = () => {
    if (busy) return;
    setPin((current) => current.slice(0, -1));
    setError('');
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="v2-pin-dots">
        {Array.from({ length }).map((_, index) => (
          <span key={index} className="v2-pin-dot" data-filled={index < pin.length} />
        ))}
      </div>

      <div
        style={{
          minHeight: 22,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: error ? 'var(--v2-negative)' : 'var(--v2-ink-3)',
          marginBottom: 10,
        }}
      >
        {busy ? <span className="v2-spinner" style={{ display: 'inline-block', width: 16, height: 16 }} /> : error}
      </div>

      <div className="v2-keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button key={digit} className="v2-key" onClick={() => push(digit)}>
            {digit}
          </button>
        ))}
        <button className="v2-key v2-key--ghost" onClick={onClose} aria-label="Annuler">
          <Icon name="close" size={20} />
        </button>
        <button className="v2-key" onClick={() => push('0')}>
          0
        </button>
        <button className="v2-key v2-key--ghost" onClick={remove} aria-label="Effacer">
          <Icon name="back" size={20} />
        </button>
      </div>
    </Sheet>
  );
}
