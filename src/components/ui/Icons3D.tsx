import React, { useId } from 'react';

export interface Icon3DProps {
  className?: string;
  size?: number;
  active?: boolean;
}

function useGradientPrefix() {
  return `uq-icon-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export const CoffreIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 28, active = false }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48" fill="none" className={`transition-transform duration-300 motion-reduce:transition-none ${active ? 'scale-105' : 'group-hover:scale-105'} ${className}`}>
      <defs>
        <linearGradient id={`${id}-body`} x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1FCFF" stopOpacity=".32" />
          <stop offset=".35" stopColor="#12303A" stopOpacity=".92" />
          <stop offset="1" stopColor="#05070A" />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C8FBFF" />
          <stop offset=".42" stopColor="#00E5FF" />
          <stop offset="1" stopColor="#007F96" />
        </linearGradient>
        <radialGradient id={`${id}-door`} cx="0" cy="0" r="1" gradientTransform="matrix(10 10 -10 10 20 14)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE9B0" />
          <stop offset=".45" stopColor="#E8A85C" />
          <stop offset="1" stopColor="#704735" />
        </radialGradient>
        <linearGradient id={`${id}-reflection`} x1="6" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".7" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="36" height="32" rx="10" fill={`url(#${id}-body)`} stroke={`url(#${id}-bevel)`} strokeWidth="1.5" />
      <path d="M7.5 18C9 12.2 15.1 9.3 22.8 9.1" stroke={`url(#${id}-reflection)`} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11h22c3.3 0 6 2.7 6 6v4H10c-2.2 0-4-1.8-4-4v-1c0-2.8 1.2-5 4-5Z" fill="white" fillOpacity=".045" />
      <circle cx="24" cy="24" r="10" fill={`url(#${id}-door)`} stroke="#F5D9A1" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="4.5" fill="#26313B" stroke="#D8C5A4" />
      <path d="M24 15v4m0 10v4m-9-9h4m10 0h4" stroke="#FFF3D6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="14" r="1.8" fill="#10B981" className="motion-safe:animate-pulse" />
    </svg>
  );
};

export const TradingIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 28, active = false }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48" fill="none" className={`transition-transform duration-300 motion-reduce:transition-none ${active ? 'scale-105' : 'group-hover:scale-105'} ${className}`}>
      <defs>
        <linearGradient id={`${id}-up`} x1="12" y1="14" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${id}-down`} x1="28" y1="18" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F43F5E" />
          <stop offset="1" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id={`${id}-trend`} x1="8" y1="32" x2="40" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path d="M16 8v30m16-26v28" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="14" width="8" height="18" rx="2" fill={`url(#${id}-up)`} stroke="#6EE7B7" />
      <rect x="28" y="18" width="8" height="14" rx="2" fill={`url(#${id}-down)`} stroke="#FDA4AF" />
      <path d="M8 32c6-6 14-2 22-16l10-6" stroke={`url(#${id}-trend)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const StudioIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 32 }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 54 54" fill="none" className={`transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 active:scale-90 motion-reduce:transition-none ${className}`}>
      <defs>
        <linearGradient id={`${id}-core`} x1="10" y1="10" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7F9FF" />
          <stop offset=".48" stopColor="#39C6D7" />
          <stop offset="1" stopColor="#7768D8" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="27" y1="10" x2="27" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".8" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="23" y="10" width="8" height="34" rx="4" fill={`url(#${id}-core)`} stroke={`url(#${id}-shine)`} strokeWidth="1.2" />
      <rect x="10" y="23" width="34" height="8" rx="4" fill={`url(#${id}-core)`} stroke={`url(#${id}-shine)`} strokeWidth="1.2" />
      <circle cx="27" cy="27" r="3" fill="white" className="motion-safe:animate-pulse" />
    </svg>
  );
};

export const ChatIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 28, active = false }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48" fill="none" className={`transition-transform duration-300 motion-reduce:transition-none ${active ? 'scale-105' : 'group-hover:scale-105'} ${className}`}>
      <defs>
        <linearGradient id={`${id}-front`} x1="11" y1="6" x2="46" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B6F7F2" />
          <stop offset=".55" stopColor="#4EA9D1" />
          <stop offset="1" stopColor="#735FCC" />
        </linearGradient>
        <linearGradient id={`${id}-reflect`} x1="24" y1="8" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".7" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="m12 28-4 10 10-3c3 1 6 1.5 9 1.5 9.9 0 18-6.7 18-15S36.9 6.5 27 6.5 9 13.2 9 21.5c0 2.4.8 4.6 2.2 6.5" fill="#101B3A" opacity=".75" />
      <path d="m14 26-4 10 10-2.5c2.5 1 5.5 1.5 8.5 1.5C38.2 35 46 28.5 46 20.5S38.2 6 28.5 6 11 12.5 11 20.5c0 2.1.8 4 2.1 5.5" fill={`url(#${id}-front)`} />
      <path d="M14 16c3-6 10-8 18-8 7 0 11 3 12 6-6-4-16-5-24-2-4 1.5-6 3-6 4Z" fill={`url(#${id}-reflect)`} />
      <circle cx="21" cy="20.5" r="2.2" fill="white" />
      <circle cx="28.5" cy="20.5" r="2.2" fill="white" />
      <circle cx="36" cy="20.5" r="2.2" fill="white" />
    </svg>
  );
};

export const ProfilIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 28, active = false }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48" fill="none" className={`transition-transform duration-300 motion-reduce:transition-none ${active ? 'scale-105' : 'group-hover:scale-105'} ${className}`}>
      <defs>
        <radialGradient id={`${id}-head`} cx="0" cy="0" r="1" gradientTransform="matrix(11 12 -12 11 20 12)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5CFFF" />
          <stop offset=".55" stopColor="#9B6FE4" />
          <stop offset="1" stopColor="#316D9A" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="12" y1="28" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#64D7D1" />
          <stop offset="1" stopColor="#56458F" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="24" rx="20" ry="8" stroke="#82DCD9" strokeWidth="1.2" strokeDasharray="3 3" opacity=".3" transform="rotate(-25 24 24)" />
      <circle cx="24" cy="18" r="8.5" fill={`url(#${id}-head)`} stroke="#EADFFF" />
      <circle cx="21.5" cy="15" r="2.5" fill="white" opacity=".6" />
      <path d="M12 38c0-6.5 5.5-10 12-10s12 3.5 12 10c0 3-3 4-12 4s-12-1-12-4Z" fill={`url(#${id}-body)`} stroke="#82DCD9" />
    </svg>
  );
};

export const HeartIcon3D: React.FC<{ size?: number; liked?: boolean }> = ({ size = 26, liked = false }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48" fill="none" className={`transition-transform duration-300 active:scale-75 motion-reduce:transition-none ${liked ? 'drop-shadow-[0_4px_14px_rgba(47,107,255,0.55)]' : ''}`}>
      <defs>
        <radialGradient id={`${id}-liked`} cx="0" cy="0" r="1" gradientTransform="matrix(25 27 -27 25 12 12)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C8F9FA" />
          <stop offset=".45" stopColor="#42D6CF" />
          <stop offset=".9" stopColor="#157A9B" />
          <stop offset="1" stopColor="#0B354D" />
        </radialGradient>
        <linearGradient id={`${id}-idle`} x1="4" y1="5" x2="44" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CBD5E1" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path d="M24 41.5C22.8 41.5 8 29.8 4.2 21.2.6 13.2 4.4 4.5 13.5 4.5c4.7 0 8.6 3.1 10.5 6.3 1.9-3.2 5.8-6.3 10.5-6.3 9.1 0 12.9 8.7 9.3 16.7C40 29.8 25.2 41.5 24 41.5Z" fill={`url(#${id}-${liked ? 'liked' : 'idle'})`} stroke={liked ? '#D9FBFF' : 'rgba(255,255,255,.35)'} strokeWidth="1.2" />
      {liked && <ellipse cx="14" cy="12" rx="4.5" ry="2.5" fill="white" opacity=".65" transform="rotate(-30 14 12)" />}
    </svg>
  );
};

export const EscrowShield3D: React.FC<{ size?: number }> = ({ size = 22 }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id={`${id}-shield`} x1="5" y1="3" x2="31" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#79F2DB" />
          <stop offset=".5" stopColor="#159F9F" />
          <stop offset="1" stopColor="#114D65" />
        </linearGradient>
      </defs>
      <path d="M18 3 5 8.5v8.3c0 8 5.5 15 13 17.2 7.5-2.2 13-9.2 13-17.2V8.5L18 3Z" fill={`url(#${id}-shield)`} stroke="#B4F9EF" strokeWidth="1.2" />
      <path d="M18 11c-2.2 0-4 1.8-4 4v2h-1v6h10v-6h-1v-2c0-2.2-1.8-4-4-4Zm-2 4a2 2 0 0 1 4 0v2h-4v-2Z" fill="white" />
    </svg>
  );
};

export const PlayGem3D: React.FC<{ size?: number }> = ({ size = 24 }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id={`${id}-play`} x1="12" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BCF7FF" />
          <stop offset=".5" stopColor="#32B8CC" />
          <stop offset="1" stopColor="#1D5D8A" />
        </linearGradient>
      </defs>
      <path d="m12 8 20 12-20 12V8Z" fill={`url(#${id}-play)`} stroke="#D9FBFF" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m14 11 14 9H14v-9Z" fill="white" opacity=".3" />
    </svg>
  );
};

export const BorbCoinIcon3D: React.FC<{ size?: number; className?: string }> = ({ size = 112, className = '' }) => {
  const id = useGradientPrefix();
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 128 128" fill="none" className={className}>
      <defs>
        <radialGradient id={`${id}-face`} cx="0" cy="0" r="1" gradientTransform="matrix(70 76 -76 70 34 22)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B5E9FF" />
          <stop offset=".24" stopColor="#428DB8" />
          <stop offset=".58" stopColor="#163B5D" />
          <stop offset=".83" stopColor="#0C2038" />
          <stop offset="1" stopColor="#6BC9E4" />
        </radialGradient>
        <linearGradient id={`${id}-edge`} x1="26" y1="10" x2="103" y2="119" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D2F6FF" />
          <stop offset=".28" stopColor="#6AAACB" />
          <stop offset=".58" stopColor="#112D48" />
          <stop offset=".82" stopColor="#8BDAEF" />
          <stop offset="1" stopColor="#234B6B" />
        </linearGradient>
        <linearGradient id={`${id}-mark`} x1="43" y1="28" x2="86" y2="99" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E4FAFF" />
          <stop offset=".45" stopColor="#83CBE8" />
          <stop offset="1" stopColor="#315F80" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0" cy="0" r="1" gradientTransform="matrix(49 44 -42 47 35 23)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C8F4FF" stopOpacity=".35" />
          <stop offset="1" stopColor="#8CE8FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="59" fill={`url(#${id}-edge)`} />
      <circle cx="64" cy="64" r="53" fill={`url(#${id}-face)`} stroke="#A5E6F7" strokeOpacity=".65" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="47" stroke="#B7EBFB" strokeOpacity=".22" />
      <circle cx="64" cy="64" r="44" fill={`url(#${id}-shine)`} />
      <path d="m64 26 17 34H47l17-34Zm-17 38h34L64 103 47 64Z" fill={`url(#${id}-mark)`} fillOpacity=".86" stroke="#B9EEFF" strokeOpacity=".78" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="36" y="56" width="56" height="18" rx="4" fill="#0B1B2B" fillOpacity=".88" stroke="#8FD8EF" strokeOpacity=".82" />
      <text x="64" y="69" fill="#D9F5FF" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" letterSpacing="1.5" textAnchor="middle">BORB</text>
      <path d="M22 47c6-17 23-29 42-31" stroke="white" strokeOpacity=".38" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
