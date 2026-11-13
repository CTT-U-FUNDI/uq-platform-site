import { useId } from 'react';

/**
 * Icones "3D" du Studio UQ : volumes en degrades, reflets et ombres portees.
 * Chaque instance genere ses propres ids de defs (useId) pour eviter les
 * collisions quand plusieurs icones sont montees en meme temps.
 */

interface Icon3DProps {
  size?: number;
  className?: string;
}

const sanitize = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

export function StudioOfferIcon({ size = 48, className }: Icon3DProps) {
  const uid = sanitize(useId());
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="14" y1="24" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9095" />
          <stop offset="0.45" stopColor="#E63946" />
          <stop offset="1" stopColor="#9E1B23" />
        </linearGradient>
        <linearGradient id={`${uid}-roof`} x1="12" y1="14" x2="52" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB27A" />
          <stop offset="0.5" stopColor="#F0603C" />
          <stop offset="1" stopColor="#B21E2A" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="16" y1="33" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3C4" />
          <stop offset="1" stopColor="#F5B301" />
        </linearGradient>
        <linearGradient id={`${uid}-door`} x1="26" y1="37" x2="38" y2="53" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5C1220" />
          <stop offset="1" stopColor="#2B0710" />
        </linearGradient>
        <filter id={`${uid}-drop`} x="4" y="6" width="56" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.6" stdDeviation="2.1" floodColor="#4A0D14" floodOpacity="0.38" />
        </filter>
      </defs>

      <ellipse cx="32" cy="57.4" rx="19" ry="3.6" fill="#0B1220" opacity="0.16" />

      <g filter={`url(#${uid}-drop)`}>
        <path
          d="M15 24h34a3 3 0 0 1 3 3v19.6a5.4 5.4 0 0 1-5.4 5.4H17.4A5.4 5.4 0 0 1 12 46.6V27a3 3 0 0 1 3-3Z"
          fill={`url(#${uid}-body)`}
        />
        <path
          d="M15 24h10.5c-3.4 2.6-5.6 7.6-6.2 14.4-.3 3.6-.2 6.9.5 9.6H17.4A5.4 5.4 0 0 1 12 42.6V27a3 3 0 0 1 3-3Z"
          fill="#FFFFFF"
          opacity="0.12"
        />
        <rect x="26" y="37" width="12" height="15.4" rx="2.6" fill={`url(#${uid}-door)`} />
        <circle cx="35" cy="45.2" r="1.2" fill="#FFD75E" />
        <rect x="16.4" y="33.6" width="7.6" height="7.6" rx="2" fill={`url(#${uid}-glass)`} />
        <rect x="40" y="33.6" width="7.6" height="7.6" rx="2" fill={`url(#${uid}-glass)`} />
        <path d="M17.8 34.9h2.4" stroke="#FFF8DC" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <path d="M41.4 34.9h2.4" stroke="#FFF8DC" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      </g>

      <g filter={`url(#${uid}-drop)`}>
        <rect x="10.5" y="14" width="43" height="10.6" rx="4.2" fill={`url(#${uid}-roof)`} />
        <rect x="17.2" y="14.5" width="3.6" height="9.6" fill="#FFFFFF" opacity="0.17" />
        <rect x="26.2" y="14.5" width="3.6" height="9.6" fill="#FFFFFF" opacity="0.17" />
        <rect x="35.2" y="14.5" width="3.6" height="9.6" fill="#FFFFFF" opacity="0.17" />
        <rect x="44.2" y="14.5" width="3.6" height="9.6" fill="#FFFFFF" opacity="0.17" />
        <path d="M10.5 23.2h43" stroke="#7A1220" strokeWidth="1.5" opacity="0.4" />
        <circle cx="16.8" cy="25.6" r="2.3" fill="#E85D4A" />
        <circle cx="26.3" cy="25.6" r="2.3" fill="#C22B38" />
        <circle cx="35.8" cy="25.6" r="2.3" fill="#E85D4A" />
        <circle cx="45.3" cy="25.6" r="2.3" fill="#C22B38" />
      </g>
    </svg>
  );
}

export function StudioContentIcon({ size = 48, className }: Icon3DProps) {
  const uid = sanitize(useId());
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-back`} x1="20" y1="12" x2="48" y2="51" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B79CE4" />
          <stop offset="1" stopColor="#4B3F72" />
        </linearGradient>
        <linearGradient id={`${uid}-front`} x1="12" y1="18" x2="47" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#79C9FF" />
          <stop offset="0.48" stopColor="#2E86DE" />
          <stop offset="1" stopColor="#1B4F9C" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="26" y1="28" x2="37" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3A8" />
          <stop offset="0.55" stopColor="#FFD75E" />
          <stop offset="1" stopColor="#F5A301" />
        </linearGradient>
        <radialGradient id={`${uid}-glass`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25 31) rotate(48) scale(16)">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.06" />
        </radialGradient>
        <filter id={`${uid}-drop`} x="2" y="4" width="60" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.6" stdDeviation="2.2" floodColor="#0B1A33" floodOpacity="0.38" />
        </filter>
      </defs>

      <ellipse cx="32" cy="57.4" rx="18" ry="3.4" fill="#0B1220" opacity="0.16" />

      <g filter={`url(#${uid}-drop)`} transform="rotate(9 34 32)">
        <rect x="19.5" y="11" width="28" height="40" rx="8" fill={`url(#${uid}-back)`} />
        <rect x="22.5" y="14" width="22" height="4.5" rx="2.25" fill="#FFFFFF" opacity="0.22" />
      </g>

      <g filter={`url(#${uid}-drop)`}>
        <rect x="10" y="17" width="38" height="38" rx="10" fill={`url(#${uid}-front)`} />
        <rect x="12.2" y="18.8" width="33.6" height="13" rx="6.5" fill="#FFFFFF" opacity="0.14" />
        <circle cx="29" cy="36" r="12" fill={`url(#${uid}-glass)`} stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="1.1" />
        <path
          d="M25.8 29.9c0-1.1 1-1.8 2-1.3l10 5.3c1 .5 1 1.9 0 2.4l-10 5.3c-1 .5-2-.2-2-1.3V29.9Z"
          fill={`url(#${uid}-gold)`}
          filter={`url(#${uid}-drop)`}
        />
        <path d="M14.4 48.2c1.1-2 2.8-3.4 4.9-4.3" stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M47.6 20.4v4.4M45.4 22.6h4.4" stroke="#FFD75E" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        <circle cx="46.8" cy="47.4" r="1.5" fill="#FFD75E" opacity="0.85" />
      </g>
    </svg>
  );
}

export function StudioConnectIcon({ size = 48, className }: Icon3DProps) {
  const uid = sanitize(useId());
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-globe`} x1="16" y1="21" x2="42" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7FF0D9" />
          <stop offset="0.5" stopColor="#2BB3A3" />
          <stop offset="1" stopColor="#17638F" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="40" y1="12" x2="58" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0A0" />
          <stop offset="1" stopColor="#F5A301" />
        </linearGradient>
        <filter id={`${uid}-drop`} x="4" y="6" width="56" height="56" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.6" stdDeviation="2.2" floodColor="#062A3F" floodOpacity="0.38" />
        </filter>
      </defs>

      <ellipse cx="30" cy="56.4" rx="18" ry="3.4" fill="#0B1220" opacity="0.16" />

      <g filter={`url(#${uid}-drop)`}>
        <circle cx="28" cy="34" r="13.6" fill={`url(#${uid}-globe)`} />
        <ellipse cx="28" cy="34" rx="6.1" ry="13.6" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.1" />
        <path d="M14.7 34h26.6M17.4 27.4h21.2M17.4 40.6h21.2" stroke="#FFFFFF" strokeOpacity="0.24" strokeWidth="1.1" />
        <ellipse cx="23.2" cy="27.4" rx="5.4" ry="3.4" fill="#FFFFFF" opacity="0.22" transform="rotate(-28 23.2 27.4)" />
      </g>

      <ellipse
        cx="30"
        cy="37.4"
        rx="21.5"
        ry="7.6"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1.5"
        strokeOpacity="0.55"
        transform="rotate(-16 30 37.4)"
      />

      <g stroke={`url(#${uid}-gold)`} strokeWidth="2.2" strokeLinecap="round">
        <path d="M44 21.7A4.4 4.4 0 0 1 48.3 26" />
        <path d="M44 17.2A8.8 8.8 0 0 1 52.8 26" />
        <path d="M44 12.7A13.3 13.3 0 0 1 57.3 26" />
      </g>
      <circle cx="44" cy="26" r="2.3" fill={`url(#${uid}-gold)`} />
      <circle cx="43.3" cy="25.3" r="0.8" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

export function StudioBoutiqueIcon({ size = 48, className }: Icon3DProps) {
  const uid = sanitize(useId());
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-facade`} x1="14" y1="26" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8AD1FF" />
          <stop offset="0.45" stopColor="#3182BD" />
          <stop offset="1" stopColor="#123B60" />
        </linearGradient>
        <linearGradient id={`${uid}-awning`} x1="10" y1="14" x2="54" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93E7C3" />
          <stop offset="0.5" stopColor="#1FA57A" />
          <stop offset="1" stopColor="#0B5741" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="18" y1="34" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3C4" />
          <stop offset="1" stopColor="#F5B301" />
        </linearGradient>
        <filter id={`${uid}-drop`} x="4" y="6" width="56" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.6" stdDeviation="2.1" floodColor="#0E2B46" floodOpacity="0.38" />
        </filter>
      </defs>

      <ellipse cx="32" cy="57.4" rx="19" ry="3.6" fill="#0B1220" opacity="0.16" />

      <g filter={`url(#${uid}-drop)`}>
        <path
          d="M15 26h34a3 3 0 0 1 3 3v20a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V29a3 3 0 0 1 3-3Z"
          fill={`url(#${uid}-facade)`}
        />
        <path
          d="M15 26h10c-3.2 2.6-5.4 7.4-6 14-.3 3.6-.2 7 .5 9.8H17a5 5 0 0 1-5-5V29a3 3 0 0 1 3-3Z"
          fill="#FFFFFF"
          opacity="0.12"
        />
        <rect x="18" y="34" width="11" height="9" rx="2.2" fill={`url(#${uid}-glass)`} />
        <rect x="35" y="34" width="11" height="9" rx="2.2" fill={`url(#${uid}-glass)`} />
        <path d="M19.4 35.6h3.4" stroke="#FFF8DC" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <path d="M36.4 35.6h3.4" stroke="#FFF8DC" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <rect x="27" y="45.5" width="10" height="8.5" rx="1.8" fill="#0B2A44" />
        <circle cx="35" cy="50" r="1.1" fill="#FFD75E" />
      </g>

      <g filter={`url(#${uid}-drop)`}>
        <rect x="10.5" y="15" width="43" height="10.5" rx="4.2" fill={`url(#${uid}-awning)`} />
        <rect x="17.2" y="15.5" width="3.6" height="9.5" fill="#FFFFFF" opacity="0.17" />
        <rect x="26.2" y="15.5" width="3.6" height="9.5" fill="#FFFFFF" opacity="0.17" />
        <rect x="35.2" y="15.5" width="3.6" height="9.5" fill="#FFFFFF" opacity="0.17" />
        <rect x="44.2" y="15.5" width="3.6" height="9.5" fill="#FFFFFF" opacity="0.17" />
        <path d="M10.5 24.1h43" stroke="#0A4A37" strokeWidth="1.5" opacity="0.4" />
        <circle cx="16.8" cy="26.4" r="2.3" fill="#2CB98D" />
        <circle cx="26.3" cy="26.4" r="2.3" fill="#12795A" />
        <circle cx="35.8" cy="26.4" r="2.3" fill="#2CB98D" />
        <circle cx="45.3" cy="26.4" r="2.3" fill="#12795A" />
      </g>
    </svg>
  );
}

export function StudioSparkIcon({ size = 40, className }: Icon3DProps) {
  const uid = sanitize(useId());
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-star`} x1="20" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF6C9" />
          <stop offset="0.45" stopColor="#FFD75E" />
          <stop offset="1" stopColor="#EE9B00" />
        </linearGradient>
        <linearGradient id={`${uid}-violet`} x1="12" y1="30" x2="30" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C3A6F2" />
          <stop offset="1" stopColor="#7B5EA7" />
        </linearGradient>
        <filter id={`${uid}-drop`} x="6" y="6" width="52" height="52" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.2" stdDeviation="1.9" floodColor="#4A3500" floodOpacity="0.32" />
        </filter>
      </defs>

      <ellipse cx="32" cy="53.6" rx="14" ry="2.8" fill="#0B1220" opacity="0.14" />

      <g filter={`url(#${uid}-drop)`}>
        <path
          d="M32 10.5c2.9 8.6 6 12 14.6 14.9-8.6 2.9-11.7 6.3-14.6 14.9-2.9-8.6-6-12-14.6-14.9C26 22.5 29.1 19.1 32 10.5Z"
          fill={`url(#${uid}-star)`}
        />
        <path
          d="M22.4 36.8c1.6 4.6 3.2 6.4 7.8 7.9-4.6 1.6-6.2 3.4-7.8 7.9-1.5-4.5-3.1-6.3-7.7-7.9 4.6-1.5 6.2-3.3 7.7-7.9Z"
          fill={`url(#${uid}-violet)`}
          opacity="0.95"
        />
        <circle cx="45.5" cy="42.5" r="3.2" fill={`url(#${uid}-violet)`} opacity="0.9" />
        <circle cx="44.7" cy="41.7" r="1.1" fill="#FFFFFF" opacity="0.55" />
      </g>
    </svg>
  );
}
