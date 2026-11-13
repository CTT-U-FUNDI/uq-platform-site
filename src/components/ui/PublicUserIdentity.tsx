import { useEffect, useState } from 'react';
import apiClient from '../../api/client';

interface PublicProfile {
  pseudo: string;
  name: string;
  avatar_url: string;
}

const identityCache = new Map<string, Promise<PublicProfile>>();

function loadPublicProfile(userId: string): Promise<PublicProfile> {
  let request = identityCache.get(userId);
  if (!request) {
    const path = /^UQ-\d+$/i.test(userId)
      ? `/api/account/${encodeURIComponent(userId)}/public`
      : `/api/account/public/${encodeURIComponent(userId)}`;
    request = apiClient
      .get(path)
      .then(({ data }) => ({
        pseudo: typeof data.pseudo === 'string' ? data.pseudo : '',
        name: typeof data.name === 'string' ? data.name : '',
        avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : '',
      }))
      .catch((error: unknown) => {
        identityCache.delete(userId);
        throw error;
      });
    identityCache.set(userId, request);
  }
  return request;
}

interface Props {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
}

const AVATAR_SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function PublicUserIdentity({
  userId,
  size = 'md',
  compact = false,
  className = '',
}: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!userId) return;
      loadPublicProfile(userId)
        .then((result) => {
          if (active) setProfile(result);
        })
        .catch(() => {
          if (active) setProfile({ pseudo: '', name: '', avatar_url: '' });
        });
    };
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ uqNumber: string }>).detail;
      if (detail?.uqNumber?.toUpperCase() !== userId.toUpperCase()) return;
      identityCache.delete(userId);
      setImageFailed(false);
      refresh();
    };

    setProfile(null);
    setImageFailed(false);
    refresh();
    window.addEventListener('uq:profile-updated', onProfileUpdated);

    return () => {
      active = false;
      window.removeEventListener('uq:profile-updated', onProfileUpdated);
    };
  }, [userId]);

  const ownPseudo = userId === localStorage.getItem('uq_number')
    ? localStorage.getItem('uq_pseudo') || ''
    : '';
  const pseudo = profile?.pseudo || ownPseudo || 'UQ';
  const firstName = (profile?.name || '').trim().split(/\s+/).filter(Boolean)[0] || '';
  const displayName = pseudo;
  const subtitle = compact ? `${pseudo}${firstName ? ` · ${firstName}` : ''}` : (profile?.pseudo && firstName ? firstName : 'Compte public');
  const initials = (firstName || pseudo).replace(/^uq@/i, '').slice(0, 1).toUpperCase() || 'U';
  const avatarUrl = profile?.avatar_url && !imageFailed ? profile.avatar_url : '';

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`} title={displayName}>
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-300/25 bg-[#101A26] font-semibold text-sky-100 ${AVATAR_SIZE[size]}`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : initials}
      </span>
      <span className="min-w-0">
        {!compact ? (
          <>
            <span className="block truncate text-sm font-medium text-white">{displayName}</span>
            {firstName && (
              <span className="block truncate text-[11px] text-slate-400">{firstName}</span>
            )}
          </>
        ) : (
          <span className="block truncate text-[11px] font-medium text-slate-200">{subtitle}</span>
        )}
      </span>
    </div>
  );
}
