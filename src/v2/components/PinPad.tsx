import { Icon } from './Icon';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  /** Nombre de points affiches au minimum (le PIN fait 4 a 6 chiffres). */
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  shake?: boolean;
}

/**
 * Saisie du code a 4-6 chiffres : points qui se remplissent + pave numerique.
 * Aucune validation automatique : la longueur du code n'est jamais connue du
 * client, c'est le bouton de validation qui declenche l'appel.
 */
export function PinPad({
  value,
  onChange,
  minLength = 4,
  maxLength = 6,
  disabled,
  shake,
}: PinPadProps) {
  const dots = Math.max(minLength, Math.min(value.length, maxLength));

  const push = (digit: string) => {
    if (disabled) return;
    onChange(`${value}${digit}`.slice(0, maxLength));
  };

  const remove = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div className={shake ? 'v2-shake' : undefined}>
      <div className="v2-pin-dots" aria-label={`${value.length} chiffre(s) saisi(s)`}>
        {Array.from({ length: dots }).map((_, index) => (
          <span key={index} className="v2-pin-dot" data-filled={index < value.length} />
        ))}
      </div>

      <div className="v2-keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            className="v2-key"
            disabled={disabled}
            onClick={() => push(digit)}
          >
            {digit}
          </button>
        ))}
        <span aria-hidden="true" />
        <button type="button" className="v2-key" disabled={disabled} onClick={() => push('0')}>
          0
        </button>
        <button
          type="button"
          className="v2-key v2-key--ghost"
          disabled={disabled || value.length === 0}
          onClick={remove}
          aria-label="Effacer le dernier chiffre"
        >
          <Icon name="back" size={20} />
        </button>
      </div>
    </div>
  );
}
