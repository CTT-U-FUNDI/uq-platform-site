import { Icon, type IconName } from '../components/ui/Icon';
import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient, { apiFetch } from '../api/client';
import { UQLoader } from '../components/ui/UQLoader';
import { VerificationPage } from '../features/profile/pages/VerificationPage';
import { PinModal } from '../components/ui/PinModal';
import { FixoAssistant } from '../components/ui/FixoAssistant';
import { KycFlow } from '../features/kyc/pages/KycFlow';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  IconUser, IconShield, IconSettings, IconBell,
  IconChevron, IconExit, IconCheck, IconClose,
  IconCopy, IconStore, IconLock, IconWallet,
  IconCamera, IconKey, IconAlertTriangle, IconGift, IconGlobe,
  IconShieldCheck, IconStar, IconEye, IconHeart,
} from '../components/ui/UQIcons';

interface ProfileProps { onBack?: () => void; }

interface AccountData {
  uq_number: string;
  uq_email: string;
  uq_pseudo: string;
  full_name?: string;
  kyc_verified?: boolean;
  created_at?: number;
  is_owner?: boolean;
  public_key?: string;
  cadenas?: string;
  db_path?: string;
  code_promo?: string;
  // ===== PROFIL COMPLET =====
  sexe?: string;
  ville_provenance?: string;
  ville_actuelle?: string;
  statut_marital?: string;
  photo_url?: string;
  description?: string;
  emploi?: string;
  mobile_money_number?: string;
  mobile_money_operator?: string;
  date_naissance?: string;
}

interface Device { device: string; ip: string; last_seen: number; }
interface MyItem {
  id?: string;
  title?: string;
  category?: string;
  price_borb?: number;
  published?: boolean;
  rating?: number;
  review_count?: number;
  view_count?: number;
  like_count?: number;
  views_last_30_days?: number;
}
interface DailyZandoMetric {
  date: string;
  label: string;
  views: number;
  likes: number;
}
interface PublicMetrics {
  views: number;
  recentViews: number;
  likes: number;
  reviews: number;
  rating: number | null;
  activeItems: number;
}

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
type Theme = 'dark' | 'light' | 'auto';
type Tab = 'stats' | 'compte' | 'sensible' | 'securite' | 'preferences' | 'publications' | 'aide';
const localeForLanguage: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en',
  es: 'es',
  sw: 'sw',
};

function parseDeviceInfo(s: string) {
  if (!s) return { icon: 'appWindow' as IconName, browser: 'Appareil', os: 'Inconnu' };
  const l = s.toLowerCase();
  let os = 'Inconnu', icon: IconName = 'appWindow';
  if (l.includes('windows')) { os = 'Windows'; icon = 'appWindow'; }
  else if (l.includes('mac')) { os = 'macOS'; icon = 'appWindow'; }
  else if (l.includes('iphone')) { os = 'iPhone'; icon = 'smartphone'; }
  else if (l.includes('ipad')) { os = 'iPad'; icon = 'smartphone'; }
  else if (l.includes('android')) { os = 'Android'; icon = 'smartphone'; }
  else if (l.includes('linux')) { os = 'Linux'; icon = 'appWindow'; }
  let browser = 'Navigateur';
  if (l.includes('chrome')) browser = 'Chrome';
  else if (l.includes('firefox')) browser = 'Firefox';
  else if (l.includes('safari')) browser = 'Safari';
  else if (l.includes('edge')) browser = 'Edge';
  return { icon, browser, os };
}

function formatTimeAgo(ts: number): string {
  if (!ts) return 'Jamais';
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return new Date(ts * 1000).toLocaleDateString('fr-FR');
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#5A5A6A] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, detail }: any) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0D121B] p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
          <Icon size={17} color={color} />
        </span>
        <p className="min-w-0 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{label}</p>
      </div>
      <p className="mt-4 truncate text-2xl font-bold tabular-nums text-white sm:text-3xl" style={{ color }}>{value}</p>
      {detail && <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">{detail}</p>}
    </div>
  );
}

function ZandoAnalyticsChart({
  data,
  loading,
  error,
}: {
  data: DailyZandoMetric[];
  loading: boolean;
  error: string;
}) {
  return (
    <section aria-labelledby="zando-analytics-title" className="rounded-2xl border border-white/[0.08] bg-[#0D121B] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 id="zando-analytics-title" className="text-sm font-bold text-white">Zando · activité quotidienne</h3>
          <p className="mt-1 text-xs text-[#94A3B8]">Vues et mentions « J’aime » sur vos annonces · 30 jours</p>
        </div>
        <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-sky-200">30 J</span>
      </div>
      {loading ? (
        <div className="flex h-56 items-center justify-center text-sm text-[#94A3B8]">Chargement des statistiques…</div>
      ) : error ? (
        <p role="alert" className="flex min-h-56 items-center justify-center text-center text-sm text-rose-200">{error}</p>
      ) : data.every((day) => day.views === 0 && day.likes === 0) ? (
        <p role="status" className="flex min-h-56 items-center justify-center text-center text-sm text-[#94A3B8]">
          Aucune interaction Zando enregistrée sur les 30 derniers jours.
        </p>
      ) : (
        <div className="h-56" role="img" aria-label="Graphique quotidien des vues et des mentions J’aime sur 30 jours">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profileZandoViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="profileZandoLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 5" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 9 }} width={32} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                contentStyle={{ background: '#080C12', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, color: '#E2E8F0', fontSize: 11 }}
                formatter={(value, name) => [Number(value).toLocaleString('fr-FR'), name === 'views' ? 'Vues' : 'J’aime']}
              />
              <Area type="monotone" dataKey="views" name="views" stroke="#38BDF8" strokeWidth={2} fill="url(#profileZandoViews)" dot={false} />
              <Area type="monotone" dataKey="likes" name="likes" stroke="#FB7185" strokeWidth={2} fill="url(#profileZandoLikes)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#94A3B8]" aria-hidden="true">
        <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-sky-400" />Vues</span>
        <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-400" />J’aime</span>
      </div>
    </section>
  );
}

function InfoRow({ label, value, icon, copyable, onCopy }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 border-b border-[#2A2A38] last:border-b-0">
      <span className="text-xs text-[#8E8E9A]">{label}</span>
      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        {icon && <Icon name={icon} size={14} tone="muted" />}
        <span className="min-w-0 break-words text-sm text-[#EAECEF]">{value}</span>
        {copyable && (
          <button onClick={onCopy} className="text-[#5A5A6A] hover:text-[#FCD535]">
            <IconCopy size={14} color="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, desc, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1F1F2A] transition-colors text-left border-b border-[#2A2A38] last:border-b-0"
    >
      <div className="w-10 h-10 rounded-full bg-[#1F1F2A] flex items-center justify-center shrink-0">
        <Icon size={18} color="#FCD535" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#EAECEF]">{label}</p>
        {desc && <p className="text-xs text-[#5A5A6A]">{desc}</p>}
      </div>
      <IconChevron size={16} color="#5A5A6A" direction="right" />
    </button>
  );
}

function TabContent(props: any) {
  const {
    tab, account, uqNumber, devices, itemsError,
    myItems, codePromo, pinEnabled, language, t, avatarUrl, displayName,
    pseudoDisplay,
    publicMetrics, zandoDaily, analyticsLoading, analyticsError,
  } = props;
  const isVerified = !!(account.kyc_verified || account.is_owner);
  const profileCompletion = Math.round(
    [
      account.full_name,
      account.uq_pseudo,
      account.description,
      avatarUrl,
      account.ville_actuelle,
      account.emploi,
    ].filter((value) => typeof value === 'string' && value.trim().length > 0).length / 6 * 100
  );
  const { views: listingViews, recentViews, likes: listingLikes, reviews: totalReviews, rating: weightedRating, activeItems } = publicMetrics;

  if (tab === 'stats') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8E8E9A]">
            {t('profile.profileOverview')}
          </p>
          <h2 className="mt-1 text-xl font-bold">{t('profile.myStats')}</h2>
        </div>

        <section className="overflow-hidden rounded-2xl border border-sky-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.14),transparent_45%),linear-gradient(135deg,#0D121B,#080C12)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={props.onShowPhoto}
              aria-label={t('profile.changePhoto')}
              className="relative h-20 w-20 shrink-0 self-start rounded-full bg-gradient-to-br from-[#0EA5E9] via-[#2563EB] to-[#22D3EE] p-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0D121B] text-2xl font-bold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (account.full_name?.[0] || account.uq_pseudo?.[0] || 'U').toUpperCase()
                )}
              </span>
              {isVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#181A20] bg-[#0ECB81]">
                  <IconShieldCheck size={13} color="#0A0A0F" />
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h3 className="mt-1 truncate text-xl font-bold sm:text-2xl">{displayName}</h3>
              <p className="truncate text-sm text-[#8E8E9A]">{pseudoDisplay}</p>
              <button
                type="button"
                onClick={() => props.onCopy(uqNumber, 'UQ copié')}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-mono text-[#8E8E9A] transition hover:text-[#FCD535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCD535]"
              >
                {uqNumber}
                <IconCopy size={13} color="currentColor" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={isVerified ? undefined : props.onShowKyc}
                disabled={isVerified}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold disabled:cursor-default ${
                  isVerified
                    ? 'border-[#0ECB81]/30 bg-[#0ECB81]/10 text-[#0ECB81]'
                    : 'border-[#FCD535]/30 bg-[#FCD535]/10 text-[#FCD535]'
                }`}
              >
                {isVerified
                  ? <IconShieldCheck size={15} color="#0ECB81" />
                  : <IconShield size={15} color="#FCD535" />}
                {isVerified ? t('profile.identityVerified') : t('profile.identityToVerify')}
              </button>
              <button
                type="button"
                onClick={props.onShowEdit}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#FCD535] px-4 text-sm font-bold text-[#0B0E11] transition hover:bg-[#F0CB2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('profile.edit')}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#2A2A38] bg-[#181A20] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold">{t('profile.profileCompleteness')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#8E8E9A]">
                  {profileCompletion === 100
                    ? t('profile.profileComplete')
                    : t('profile.completeProfileHint')}
                </p>
              </div>
              <span className="shrink-0 text-xl font-bold text-[#FCD535]">{profileCompletion}%</span>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-[#0B0E11]"
              role="progressbar"
              aria-label={t('profile.profileCompleteness')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompletion}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FCD535] to-[#0ECB81] transition-[width]"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <button
              type="button"
              onClick={props.onShowEdit}
              className="mt-4 min-h-11 text-sm font-semibold text-[#FCD535] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCD535]"
            >
              {t('profile.edit')}
            </button>
          </section>

          <section className="rounded-2xl border border-[#2A2A38] bg-[#181A20] p-5" aria-labelledby="profile-confidence-title">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCD535]/10" aria-hidden="true">
                <IconStar size={20} color="#FCD535" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="profile-confidence-title" className="text-sm font-bold">{t('profile.confidenceScore')}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-sky-300">{weightedRating === null ? '—' : weightedRating.toFixed(1)}</span>
                  <span className="text-sm text-[#8E8E9A]">/ 5</span>
                  <span className="rounded-full border border-[#2A2A38] px-2 py-1 text-[10px] font-semibold text-[#8E8E9A]">
                    {totalReviews > 0 ? `${totalReviews} avis` : 'Pas encore notée'}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#8E8E9A]">
              {totalReviews > 0
                ? 'Moyenne pondérée des notes enregistrées sur les publications Zando.'
                : 'La note apparaîtra après l’enregistrement de véritables avis sur vos publications.'}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-[#2A2A38] pt-4 text-xs">
              {isVerified
                ? <IconShieldCheck size={15} color="#0ECB81" />
                : <IconShield size={15} color="#8E8E9A" />}
              <span className={isVerified ? 'text-[#0ECB81]' : 'text-[#8E8E9A]'}>
                {isVerified ? t('profile.identityVerified') : t('profile.identityToVerify')}
              </span>
            </div>
          </section>
        </div>

        <section aria-labelledby="profile-evolution-title" className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id="profile-evolution-title" className="text-base font-bold text-white">Activité et évolution Zando</h3>
              <p className="mt-1 text-xs text-[#94A3B8]">Indicateurs calculés à partir de vos publications présentes dans Zando.</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-sky-200/70">Mise à jour au chargement du profil</span>
          </div>
          {itemsError ? (
            <p role="status" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200">{itemsError}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard icon={IconEye} label="Vues cumulées" value={listingViews.toLocaleString('fr-FR')} color="#38BDF8" detail="Sur les publications encore enregistrées" />
              <StatCard icon={IconEye} label="Vues · 30 jours" value={recentViews.toLocaleString('fr-FR')} color="#60A5FA" detail="Interactions récentes des annonces présentes" />
              <StatCard icon={IconHeart} label="Personnes intéressées" value={listingLikes.toLocaleString('fr-FR')} color="#FB7185" detail="Comptes ayant aimé vos publications" />
              <StatCard icon={IconStore} label="En ligne" value={activeItems.toLocaleString('fr-FR')} color="#34D399" detail={`${myItems.length.toLocaleString('fr-FR')} publication${myItems.length === 1 ? '' : 's'} enregistrée${myItems.length === 1 ? '' : 's'}`} />
            </div>
          )}
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <ZandoAnalyticsChart data={zandoDaily} loading={analyticsLoading} error={analyticsError} />
            <section aria-labelledby="trading-analytics-title" className="flex min-h-72 flex-col rounded-2xl border border-white/[0.08] bg-[#0D121B] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="trading-analytics-title" className="text-sm font-bold text-white">Trading · évolution</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">Opérations exécutées sur votre compte</p>
                </div>
                <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-amber-100/80">En attente</span>
              </div>
              <div className="my-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 px-4 py-6 text-center">
                <span className="text-3xl text-slate-500" aria-hidden="true">—</span>
                <p className="mt-2 text-sm font-semibold text-slate-200">Pas d’historique de trading fiable</p>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#94A3B8]">
                  Le carnet et le règlement des ordres ne sont pas encore actifs. Le profil affichera ici les volumes et leur évolution dès que des transactions réelles seront enregistrées.
                </p>
              </div>
              <p className="text-[10px] leading-relaxed text-[#64748B]">
                Aucune donnée Zando ou de portefeuille n’est réutilisée pour fabriquer des statistiques de trading.
              </p>
            </section>
          </div>
        </section>
      </div>
    );
  }

  if (tab === 'compte') {
    const initial = (account.full_name?.[0] || account.uq_pseudo?.[0] || 'U').toUpperCase();
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <IconUser size={20} color="#EAECEF" />
          <h2 className="text-lg font-bold">Mon Compte</h2>
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <button onClick={props.onShowPhoto} className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0EA5E9] via-[#2563EB] to-[#22D3EE] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {props.avatarUrl ? <img src={props.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#2A2A38] border-2 border-[#0A0A0F] flex items-center justify-center">
                <IconCamera size={13} color="#EAECEF" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{account.full_name || '-'}</p>
              <p className="text-xs text-[#8E8E9A] truncate">{account.uq_pseudo || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl overflow-hidden">
          <InfoRow label={t('profile.fullName')} value={account.full_name || '-'} />
          <InfoRow label={t('profile.pseudo')} value={account.uq_pseudo || '-'} />
          <InfoRow label={t('profile.email')} value={account.uq_email || '-'} />
          <InfoRow label={t('profile.number')} value={uqNumber} copyable onCopy={() => props.onCopy(uqNumber, 'UQ copié')} />
          <InfoRow label={t('profile.memberSince')} value={account.created_at ? new Date(account.created_at * 1000).toLocaleDateString(localeForLanguage[language]) : '-'} />
          <InfoRow label={t('profile.gender')} value={account.sexe === 'M' ? 'Homme' : account.sexe === 'F' ? 'Femme' : account.sexe === 'A' ? 'Autre' : '-'} />
          <InfoRow label={t('profile.birthDate')} value={account.date_naissance || '-'} />
          <InfoRow label={t('profile.maritalStatus')} value={account.statut_marital === 'celibataire' ? 'Célibataire' : account.statut_marital === 'marie' ? 'Marié(e)' : account.statut_marital === 'divorce' ? 'Divorcé(e)' : account.statut_marital === 'veuf' ? 'Veuf(ve)' : '-'} />
          <InfoRow label={t('profile.originCity')} value={account.ville_provenance ? account.ville_provenance : '-'} icon="house" />
          <InfoRow label={t('profile.currentCity')} value={account.ville_actuelle ? account.ville_actuelle : '-'} icon="pin" />
          <InfoRow label={t('profile.job')} value={account.emploi ? account.emploi : '-'} icon="briefcase" />
          <InfoRow label={t('profile.mobileMoney')} value={account.mobile_money_number ? (account.mobile_money_operator || 'MM') + ' ' + account.mobile_money_number : '-'} />
          <InfoRow label={t('profile.description')} value={account.description || '-'} />
        </div>
        {codePromo && (
          <div className="bg-gradient-to-br from-[#E63946]/10 via-[#B5378C]/10 to-[#2E86DE]/10 border border-[#2A2A38] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconGift size={18} color="#EAECEF" />
                <h3 className="text-sm font-bold text-[#EAECEF]">CODE PROMO</h3>
              </div>
            </div>
            <div className="bg-[#0A0A0F] border border-[#2A2A38] rounded-xl p-4 flex items-center justify-between">
              <span className="font-mono text-lg font-bold bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] bg-clip-text text-transparent">
                {codePromo}
              </span>
              <button onClick={() => props.onCopy(codePromo, 'Code promo copié')} className="px-3 py-1.5 rounded-lg bg-[#2A2A38] text-xs font-semibold text-[#EAECEF]">
                <IconCopy size={12} color="#EAECEF" /> Copier
              </button>
            </div>
          </div>
)}
        <button
          onClick={() => props.onShowEdit && props.onShowEdit()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold text-sm active:scale-95 transition"
        >
          <Icon name="pencil" size={20} tone="info" /> {t('profile.edit')}
        </button>
      </div>
    );
  }

  if (tab === 'sensible') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <IconKey size={20} color="#EAECEF" />
          <h2 className="text-lg font-bold">Informations Sensibles</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#F6465D]/15 border border-[#F6465D]/30 text-[#F6465D] text-[9px] font-bold uppercase">
            Owner
          </span>
        </div>
        <div className="bg-[#FCD535]/5 border border-[#FCD535]/30 rounded-xl p-3">
          <p className="text-[11px] text-[#FCD535] flex items-start gap-2">
            <IconAlertTriangle size={14} color="#FCD535" />
            <span>Informations confidentielles. Ne les partagez jamais.</span>
          </p>
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl overflow-hidden">
          <InfoRow label="UQ Number" value={uqNumber} copyable onCopy={() => props.onCopy(uqNumber, 'UQ copié')} />
          <InfoRow label="Email UQ" value={account.uq_email || '-'} />
          <InfoRow label="Pseudo UQ" value={account.uq_pseudo || '-'} />
          <InfoRow label="Code Promo" value={codePromo || '-'} />
          <InfoRow label="KYC" value={isVerified ? 'Vérifié' : 'Non vérifié'} />
          <InfoRow label="Owner" value={account.is_owner ? 'OUI' : 'Non'} />
        </div>
      </div>
    );
  }

  if (tab === 'securite') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">Sécurité</h2>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl overflow-hidden">
          <ActionRow
            icon={IconLock}
            label={t('profile.pin')}
            desc={pinEnabled ? t('profile.pinActive') : t('profile.pinNotSet')}
            onClick={props.onShowPin}
          />
          <ActionRow
            icon={IconShield}
            label="Vérification KYC"
            desc={isVerified ? 'Vérifié' : 'Non vérifié'}
            onClick={props.onShowVerif}
          />
          {isVerified ? (
            <div className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-[#2A2A38] bg-[#0ECB81]/5">
              <div className="w-10 h-10 rounded-full bg-[#0ECB81]/15 flex items-center justify-center shrink-0">
                <IconCheck size={18} color="#0ECB81" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0ECB81]">{t('profile.identityVerified')}</p>
                <p className="text-xs text-[#5A5A6A]">{t('profile.accountVerified')}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={props.onShowKyc}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1F1F2A] transition-colors text-left border-t border-[#2A2A38]"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #2563EB 100%)' }}>
                <span className="text-lg"><Icon name="target" size={18} tone="brand" /></span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#EAECEF]">Vérification d'identité (KYC)</p>
                <p className="text-xs text-[#5A5A6A]">Scanner pièce d'identité + vidéo selfie</p>
              </div>
              <IconChevron size={16} color="#5A5A6A" direction="right" />
            </button>
          )}
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">{t('profile.devices')}</h3>
            <span className="text-xs text-[#5A5A6A]">{devices.length} appareil{devices.length > 1 ? 's' : ''}</span>
          </div>
          {devices.length === 0 ? (
            <p className="text-sm text-[#8E8E9A] text-center py-8">{t('profile.noDevices')}</p>
          ) : (
            <div className="space-y-3">
              {devices.map((d: any, i: number) => {
                const isCurrent = i === 0;
                const info = parseDeviceInfo(d.device);
                return (
                  <div key={i} className={'p-4 rounded-xl border ' + (isCurrent ? 'bg-[#0ECB81]/5 border-[#0ECB81]/30' : 'bg-[#0F0F17] border-[#2A2A38]')}>
                    <div className="flex items-start gap-3">
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' + (isCurrent ? 'bg-[#0ECB81]/15' : 'bg-[#1F1F2A]')}>
                        <Icon name={info.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#EAECEF] truncate">{info.browser} sur {info.os}</p>
                          {isCurrent && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-[#0ECB81] text-[9px] font-bold uppercase">Actuel</span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A5A6A] font-mono">{d.ip || 'IP inconnue'}</p>
                        <p className="text-xs text-[#5A5A6A]">{formatTimeAgo(d.last_seen)}</p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => window.confirm('Révoquer cet appareil ?') && props.onRevokeDevice(d.device)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs font-semibold"
                      >
                        <IconClose size={12} color="#F6465D" /> Révoquer l'accès
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tab === 'preferences') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">{t('profile.preferences')}</h2>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('profile.fontSize')}</h3>
          <div className="flex gap-2">
            {(['small', 'medium', 'large', 'xlarge'] as const).map((s) => (
              <button
                key={s}
                onClick={() => props.onSaveFontSize(s)}
                className={'flex-1 px-4 py-2.5 rounded-lg font-bold ' + (props.fontSize === s ? 'bg-[#FCD535] text-black' : 'bg-[#1F1F2A] text-[#8E8E9A]')}
              >
                {s === 'small' ? 'S' : s === 'medium' ? 'M' : s === 'large' ? 'L' : 'XL'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('profile.language')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: 'fr' as const, flag: '🇫🇷', label: 'Français' },
              { code: 'en' as const, flag: '🇬🇧', label: 'English' },
              { code: 'es' as const, flag: '🇪🇸', label: 'Español' },
              { code: 'sw' as const, flag: '🇰🇪', label: 'Kiswahili' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => props.onSaveLanguage(l.code)}
                className={'px-4 py-2.5 rounded-lg text-sm font-medium ' + (props.language === l.code ? 'bg-[#FCD535] text-black' : 'bg-[#1F1F2A] text-[#8E8E9A]')}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#8E8E9A]">{t('profile.translationNote')}</p>
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('profile.theme')}</h3>
          <div className="flex gap-2">
            {[
              { id: 'dark' as const, label: t('profile.dark') },
              { id: 'light' as const, label: t('profile.light') },
              { id: 'auto' as const, label: t('profile.auto') },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => props.onSaveTheme(t.id)}
                className={'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ' + (props.theme === t.id ? 'bg-[#FCD535] text-black' : 'bg-[#1F1F2A] text-[#8E8E9A]')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'publications') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">Mes Publications</h2>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-3">Mes Zando ({myItems.length})</h3>
          {myItems.length === 0 ? (
            <p className="text-sm text-[#8E8E9A] text-center py-4">{t('profile.noPublications')}</p>
          ) : (
            <div className="space-y-2">
              {myItems.map((item: MyItem, i: number) => (
                <div key={item.id || i} className="flex items-center gap-3 py-3 border-b border-[#2A2A38] last:border-b-0">
                  <div className="w-12 h-12 rounded-lg bg-[#1F1F2A] flex items-center justify-center">
                    <IconStore size={20} color="#FCD535" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title || 'Sans titre'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8E8E9A]">
                      <span>{item.category || 'Non classé'}</span>
                      <span className={item.published ? 'text-emerald-300' : 'text-slate-400'}>
                        {item.published ? 'En ligne' : 'Brouillon'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IconEye size={12} color="currentColor" />
                        {Number(item.view_count || 0).toLocaleString('fr-FR')} vues
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#FCD535] font-mono">{item.price_borb || 0} BORB</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tab === 'aide') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">Aide & Support</h2>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl overflow-hidden">
          <ActionRow icon={IconShield} label="FAQ" desc="Questions fréquentes" onClick={() => props.onOpenUQAI('faq')} />
          <ActionRow icon={IconSettings} label="UQ AI" desc="Assistant intelligent" onClick={() => props.onOpenUQAI()} />
          <ActionRow icon={IconBell} label="Contacter le support" desc="support@ufundi.uq" onClick={() => (window.location.href = 'mailto:support@ufundi.uq')} />
        </div>
        <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
          <p className="text-xs text-[#8E8E9A]">UQ Platform v1.0</p>
          <p className="text-xs text-[#5A5A6A] mt-1">La monnaie du quartier</p>
        </div>
      </div>
    );
  }

  return null;
}

import { ReclamerModal } from './ReclamerModal';
import { EditProfileModal } from '../features/profile/components/EditProfileModal';
import { Language, translate, useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

export default function ProfilePage({ onBack }: ProfileProps) {
  const { language, setLanguage, t } = useLanguage();
  const { setMode } = useTheme();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [showKyc, setShowKyc] = useState(false);
  const [codePromo, setCodePromo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showReclamerModal, setShowReclamerModal] = useState(false);
  const [canReclaim, setCanReclaim] = useState(false);
  const [reclaimRaison, setReclaimRaison] = useState("");
  const [kycTargetUq, setKycTargetUq] = useState('');
  const [kycTargetEmail, setKycTargetEmail] = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMessage, setKycMessage] = useState('');
  const [soldeProfil2, setSoldeProfil2] = useState(0);
  const [switchUq, setSwitchUq] = useState('UQ-230354360');
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchStep, setSwitchStep] = useState<'credentials' | 'pin'>('credentials');
  const [switchSession, setSwitchSession] = useState<any>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinLength, setPinLength] = useState<4 | 5 | 6>(6);
  const [pinMode, setPinMode] = useState<'set' | 'change' | 'remove'>('set');
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showUQAI, setShowUQAI] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uqaiTopic, setUqaiTopic] = useState<string | undefined>(undefined);

  const [itemsError, setItemsError] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [zandoDaily, setZandoDaily] = useState<DailyZandoMetric[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const [fontSize, setFontSize] = useState<FontSize>((localStorage.getItem('uq_font_size') as FontSize) || 'medium');
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('uq_theme') as Theme) || 'dark');

  const uqNumber = localStorage.getItem('uq_number') || '';
  const publicMetrics = useMemo<PublicMetrics>(() => {
    const views = myItems.reduce((sum, item) => sum + (Number(item.view_count) || 0), 0);
    const recentViews = myItems.reduce((sum, item) => sum + (Number(item.views_last_30_days) || 0), 0);
    const likes = myItems.reduce((sum, item) => sum + (Number(item.like_count) || 0), 0);
    const reviews = myItems.reduce((sum, item) => sum + (Number(item.review_count) || 0), 0);
    const ratingTotal = myItems.reduce(
      (sum, item) => sum + (Number(item.rating) || 0) * (Number(item.review_count) || 0),
      0
    );
    return {
      views,
      recentViews,
      likes,
      reviews,
      rating: reviews > 0 ? ratingTotal / reviews : null,
      activeItems: myItems.filter((item) => item.published).length,
    };
  }, [myItems]);

  const loadAccount = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/me');
      const data = r.data;
      if (data.status !== 'success' || !data.me) {
        throw new Error(data.message || 'Les données du profil sont indisponibles.');
      }
      const me = data.me;
      const identity = data.identity || {};
      setAccount({
        uq_number: me.uq_number || uqNumber,
        uq_email: me.email || '',
        uq_pseudo: me.pseudo || '',
        full_name: `${identity.prenom || ''} ${identity.nom || ''}`.trim(),
        is_owner: me.is_owner || false,
        code_promo: me.code_promo || '',
        created_at: me.created_at || 0,
        kyc_verified: me.is_owner || me.kyc_verified || false,
        cadenas: me.cadenas || '',
        public_key: me.public_key || '',
        db_path: me.db_path || '',
        sexe: me.sexe || identity.sexe || '',
        ville_provenance: me.ville_provenance || '',
        ville_actuelle: me.ville_actuelle || '',
        statut_marital: me.statut_marital || '',
        photo_url: me.photo_url || '',
        description: me.description || '',
        emploi: me.emploi || '',
        mobile_money_number: me.mobile_money_number || '',
        mobile_money_operator: me.mobile_money_operator || '',
        date_naissance: me.date_naissance || identity.date_naissance || '',
      });
      if (me.code_promo) setCodePromo(me.code_promo);
    } catch (e: any) {
      setAccount(null);
      setError(e.response?.data?.message || e.message || 'Impossible de charger le profil depuis le serveur.');
    }
  }, [uqNumber]);

  const loadCodePromo = useCallback(async () => {
    try {
      const r = await apiClient.get(`/api/account/infos/${uqNumber}`);
      if (r.data?.code_promo) setCodePromo(r.data.code_promo);
    } catch {}
  }, [uqNumber]);

  const loadAvatar = useCallback(async () => {
    try {
      const r = await apiClient.post('/api/account/avatar/get', { uq_number: uqNumber });
      if (r.data.avatar_url) setAvatarUrl(r.data.avatar_url);
    } catch {}
  }, [uqNumber]);

  const loadDevices = useCallback(async () => {
    try {
      const r = await apiClient.get(`/api/account/devices/${uqNumber}`);
      if (r.data.devices) setDevices(r.data.devices);
    } catch {}
  }, [uqNumber]);

  const loadMyItems = useCallback(async () => {
    try {
      const r = await apiClient.get(`/api/zando/items/${encodeURIComponent(uqNumber)}`);
      if (r.data?.status !== 'success' || !Array.isArray(r.data.items)) {
        throw new Error(r.data?.message || 'Réponse des publications invalide.');
      }
      setMyItems(r.data.items);
      setItemsError('');
    } catch (e: any) {
      setMyItems([]);
      setItemsError(e.response?.data?.message || e.message || 'Impossible de charger vos publications Zando.');
    }
  }, [uqNumber]);

  const loadZandoAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await apiClient.get(`/api/zando/analytics/${encodeURIComponent(uqNumber)}`);
      const daily = response.data?.daily;
      if (response.data?.status !== 'success' || !Array.isArray(daily)) {
        throw new Error(response.data?.message || 'Réponse des statistiques Zando invalide.');
      }
      const metricsByDate = new Map<string, { views: number; likes: number }>();
      for (const metric of daily) {
        if (
          typeof metric?.date !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(metric.date) ||
          !Number.isFinite(metric.views) ||
          !Number.isFinite(metric.likes) ||
          metric.views < 0 ||
          metric.likes < 0
        ) {
          throw new Error('Les statistiques Zando contiennent une journée invalide.');
        }
        metricsByDate.set(metric.date, { views: metric.views, likes: metric.likes });
      }
      const today = new Date();
      const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const dateLabel = new Intl.DateTimeFormat(localeForLanguage[language] || 'fr-FR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
      });
      const days = Array.from({ length: 30 }, (_, index) => {
        const date = new Date(utcToday);
        date.setUTCDate(date.getUTCDate() - (29 - index));
        const dateKey = date.toISOString().slice(0, 10);
        const metrics = metricsByDate.get(dateKey) || { views: 0, likes: 0 };
        return { date: dateKey, label: dateLabel.format(date), ...metrics };
      });
      setZandoDaily(days);
      setAnalyticsError('');
    } catch (e: any) {
      setZandoDaily([]);
      setAnalyticsError(e.response?.data?.message || e.message || 'Impossible de charger les statistiques Zando.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [language, uqNumber]);

  const loadPinStatus = useCallback(async () => {
    try {
      const r = await apiClient.post('/api/account/pin/status', { uq_number: uqNumber });
      const status = r.data.pin_status;
      const isActive = status === 'Ready' || status === 'Cooldown' || status === 'Locked' || (typeof status === 'object' && status !== null);
      setPinEnabled(isActive);
      if (r.data.pin_length) {
        const len = Number(r.data.pin_length);
        if (len === 4 || len === 5 || len === 6) setPinLength(len as 4 | 5 | 6);
      }
    } catch {}
  }, [uqNumber]);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/account/preferences/${encodeURIComponent(uqNumber)}`);
      const preferences = response.data?.preferences;
      if (preferences?.language === 'fr' || preferences?.language === 'en' || preferences?.language === 'es' || preferences?.language === 'sw') {
        setLanguage(preferences.language);
      }
      if (preferences?.theme === 'dark' || preferences?.theme === 'light' || preferences?.theme === 'auto') {
        setTheme(preferences.theme);
        const resolvedTheme = preferences.theme === 'auto'
          ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
          : preferences.theme;
        setMode(resolvedTheme);
        localStorage.setItem('uq_theme', preferences.theme);
        window.dispatchEvent(new Event('uq:theme-preference-change'));
      }
      const savedFontSize = preferences?.font_size || localStorage.getItem('uq_font_size');
      if (savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large' || savedFontSize === 'xlarge') {
        setFontSize(savedFontSize);
      }
    } catch {
      console.warn('Impossible de charger les préférences du profil; les valeurs locales sont conservées.');
    }
  }, [setLanguage, setMode, uqNumber]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.allSettled([loadAccount(), loadCodePromo(), loadAvatar(), loadDevices(), loadMyItems(), loadZandoAnalytics(), loadPreferences()]);
    setLoading(false);
  }, [loadAccount, loadCodePromo, loadAvatar, loadDevices, loadMyItems, loadZandoAnalytics, loadPreferences]);

  useEffect(() => {
    if (!uqNumber) { setError('Non connecté'); setLoading(false); return; }
    loadAll();
    loadPinStatus();
  }, [uqNumber, loadAll, loadPinStatus]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    document.documentElement.style.fontSize =
      fontSize === 'small' ? '13px'
      : fontSize === 'large' ? '17px'
      : fontSize === 'xlarge' ? '19px'
      : '15px';
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const openPinModal = (mode?: 'set' | 'change' | 'remove') => {
    setPinMode(mode ?? (pinEnabled ? 'change' : 'set'));
    setShowPinModal(true);
  };

  const copyText = useCallback((text: string, label = 'Copié') => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setMessage(label);
  }, []);

  const saveFontSize = async (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem('uq_font_size', size);
    try {
      await apiClient.post('/api/account/font-size/set', { uq_number: uqNumber, font_size: size });
      setMessage(t('profile.preferencesSaved'));
    } catch { setMessage(t('profile.preferencesLocal')); }
  };

  const saveLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await apiClient.post('/api/account/preferences', { uq_number: uqNumber, language: lang });
      setMessage(translate(lang, 'profile.preferencesSaved'));
    } catch {
      setMessage(translate(lang, 'profile.preferencesLocal'));
    }
  };

  const saveTheme = async (nextTheme: Theme) => {
    setTheme(nextTheme);
    localStorage.setItem('uq_theme', nextTheme);
    window.dispatchEvent(new Event('uq:theme-preference-change'));
    const resolvedTheme = nextTheme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : nextTheme;
    setMode(resolvedTheme);
    try {
      await apiClient.post('/api/account/preferences', { uq_number: uqNumber, theme: nextTheme });
      setMessage(t('profile.preferencesSaved'));
    } catch {
      setMessage(t('profile.preferencesLocal'));
    }
  };

  const uploadAvatar = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const b64 = e.target?.result as string;
      try {
        await apiClient.post('/api/account/avatar/set', { uq_number: uqNumber, avatar: b64 });
        setAvatarUrl(b64);
        window.dispatchEvent(new CustomEvent('uq:profile-updated', { detail: { uqNumber } }));
        setMessage('Avatar sauvegardé');
      } catch { setMessage('Impossible de sauvegarder la photo sur le serveur'); }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    if (!window.confirm('Supprimer ta photo ?')) return;
    try {
      await apiClient.post('/api/account/avatar/set', { uq_number: uqNumber, avatar: '' });
      setAvatarUrl('');
      window.dispatchEvent(new CustomEvent('uq:profile-updated', { detail: { uqNumber } }));
      setMessage('Photo supprimée');
      setShowPhotoModal(false);
    } catch {}
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      await apiClient.post('/api/account/devices/revoke', { uq_number: uqNumber, device: deviceId });
      setMessage('Appareil révoqué');
      loadDevices();
    } catch { setMessage('Erreur révocation'); }
  };

  const openUQAI = (topic?: string) => {
    setUqaiTopic(topic);
    setShowUQAI(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    onBack?.();
    window.location.reload();
  };

  const isVerified = !!(account?.kyc_verified || account?.is_owner);

  // ====================
  // BASCULE VERS PROFIL 2 - Step1 -> Step2 -> Finalize
  // ====================
  // ====================
  // RETOUR AU PROFIL 1 (owner) - SANS MOT DE PASSE
  // ====================
  const handleReturnToOwner = async () => {
    const ownerUq = localStorage.getItem('uq_switched_from') || 'UQ-00000001';

    // Re-login automatique au owner (sans mdp car deja authentifie)
    try {
      // 1. STEP1 - Nouvelle session owner
      const step1 = await apiFetch('/api/secure/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uq_number: ownerUq }),
      });
      const data1 = await step1.json();

      if (!step1.ok || data1.status !== 'step_required') {
        setSwitchError('Erreur retour owner');
        return;
      }

      // 2. Finalize-owner (le owner est re-authentifie sans mdp)
      // Utiliser finalize-owner (pas finalize-user qui refuse is_owner=1)
      const final = await apiFetch('/api/secure/finalize-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: data1.session_id,
          tfa_token: data1.tfa_token,
        }),
      });
      const dataFinal = await final.json();

      if (!final.ok || dataFinal.status !== 'success') {
        setSwitchError('Erreur retour');
        return;
      }

      // Restaurer le JWT owner + flags
      localStorage.setItem('uq_token', dataFinal.token);
      localStorage.setItem('uq_number', ownerUq);
      localStorage.setItem('uq_is_owner', 'true');
      localStorage.removeItem('uq_switched_from');

      window.location.href = '/';
    } catch (e: any) {
      setSwitchError(e.message || 'Erreur reseau');
    }
  };

  // ====================
  // VERIFIER AUTOMATIQUEMENT LE KYC D UN USER (owner only)
  // ====================
  const handleAutoValidateKyc = async () => {
    // ===== VERIFICATIONS LOCALES AVANT ENVOI =====
    const uqClean = kycTargetUq.trim().toUpperCase();
    const emailClean = kycTargetEmail.trim().toLowerCase();

    if (!uqClean && !emailClean) {
      setKycMessage('Veuillez saisir le UQ et l email du user');
      return;
    }
    if (!uqClean) {
      setKycMessage('Veuillez saisir le UQ du user');
      return;
    }
    if (!emailClean) {
      setKycMessage('Veuillez saisir l email du user');
      return;
    }
    if (!uqClean.match(/^UQ-[0-9]+$/i)) {
      setKycMessage('Format UQ invalide (ex: UQ-732688531)');
      return;
    }
    if (!emailClean.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setKycMessage('Format email invalide');
      return;
    }
    if (uqClean === 'UQ-00000001') {
      setKycMessage('Impossible de valider le compte owner');
      return;
    }

    setKycLoading(true);
    setKycMessage('');
    try {
      const resp = await apiFetch('/api/distribution/auto-validate-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_uq: 'UQ-00000001',
          owner_email: 'delis@ufundi.uq',
          target_uq: uqClean,
          target_email: emailClean,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        // Messages specifiques du backend
        const errMsg = data.message || 'Erreur inconnue';
        if (errMsg.includes('introuvable')) {
          setKycMessage(`Compte ${uqClean} introuvable dans le systeme`);
        } else if (errMsg.includes('correspond')) {
          setKycMessage(`L email ne correspond pas au UQ ${uqClean}`);
        } else if (errMsg.includes('Email owner')) {
          setKycMessage('Erreur interne : email owner invalide');
        } else {
          setKycMessage(errMsg);
        }
        setKycLoading(false);
        return;
      }
      // SUCCES
      setKycMessage(`OK - ${uqClean} valide avec succes`);
      setKycTargetUq('');
      setKycTargetEmail('');
      setKycLoading(false);
    } catch (e: any) {
      setKycMessage('Erreur reseau - verifiez la connexion');
      setKycLoading(false);
    }
  };

  const handleSwitchToProfil2 = async () => {
    if (!switchPassword) {
      setSwitchError('Mot de passe requis');
      return;
    }
    setSwitchLoading(true);
    setSwitchError('');

    try {
      // 1. STEP1 - Creation session (avec header X-Switch-From)
      const step1 = await apiFetch('/api/secure/step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Switch-From': 'UQ-00000001',
        },
        body: JSON.stringify({ uq_number: switchUq }),
      });
      const data1 = await step1.json();

      if (!step1.ok || data1.status !== 'step_required') {
        setSwitchError(data1.message || 'Erreur step1');
        setSwitchLoading(false);
        return;
      }

      // 2. STEP2 - Mot de passe
      const step2 = await apiFetch('/api/secure/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: data1.session_id,
          tfa_token: data1.tfa_token,
          password: switchPassword,
        }),
      });
      const data2 = await step2.json();

      if (!step2.ok || data2.status !== 'step_required') {
        setSwitchError(data2.message || 'Mot de passe incorrect');
        setSwitchLoading(false);
        return;
      }

      // 3. FINALIZE - JWT
      const final = await apiFetch('/api/secure/finalize-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: data2.session_id,
          tfa_token: data2.tfa_token,
        }),
      });
      const dataFinal = await final.json();

      if (!final.ok || dataFinal.status !== 'success') {
        setSwitchError(dataFinal.message || 'Erreur finalisation');
        setSwitchLoading(false);
        return;
      }

      // 4. STOCKER LE JWT + REDIRIGER
      // 1. D'ABORD : stocker TOUT dans localStorage
      localStorage.setItem('uq_token', dataFinal.token);
      localStorage.setItem('uq_number', dataFinal.uq_number);
      localStorage.setItem('uq_pseudo', dataFinal.account?.uq_pseudo || '');
      localStorage.setItem('uq_email', dataFinal.account?.uq_email || '');
      localStorage.setItem('uq_is_owner', 'false');
      localStorage.setItem('uq_switched_from', 'UQ-00000001');

      console.log('[SWITCH] Basculé vers', dataFinal.uq_number);
      console.log('[SWITCH] uq_switched_from =', localStorage.getItem('uq_switched_from'));

      // 2. ENSUITE : recharger la page
      window.location.href = '/';
    } catch (e: any) {
      setSwitchError(e.message || 'Erreur reseau');
      setSwitchLoading(false);
    }
  };
  const initial = useMemo(() => (account?.full_name?.[0] || account?.uq_pseudo?.[0] || 'U').toUpperCase(), [account]);
  const pseudoDisplay = useMemo(() => {
    if (!account?.uq_pseudo) return 'uq@user';
    return account.uq_pseudo.startsWith('uq@') ? account.uq_pseudo : `uq@${account.uq_pseudo}`;
  }, [account]);
  const displayName = account?.full_name || pseudoDisplay;

  const TABS = useMemo(() => {
    const base: { id: Tab; icon: any; label: string }[] = [
      { id: 'stats', icon: IconWallet, label: t('profile.stats') },
      { id: 'compte', icon: IconUser, label: t('profile.account') },
    ];
    if (account?.is_owner) base.push({ id: 'sensible', icon: IconKey, label: t('profile.sensitive') });
    base.push(
      { id: 'securite', icon: IconLock, label: t('profile.security') },
      { id: 'preferences', icon: IconSettings, label: t('profile.preferences') },
      { id: 'publications', icon: IconStore, label: t('profile.publications') },
      { id: 'aide', icon: IconShield, label: t('profile.support') }
    );
    return base;
  }, [account?.is_owner, t]);

  if (loading) return <UQLoader message="Chargement du profil..." subMessage="Connexion sécurisée" />;

  if (error || !account) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-[#EAECEF] flex items-center justify-center p-4">
        <div className="bg-[#181A20] border border-[#F6465D]/30 rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-[#F6465D] text-sm mb-4">{error || 'Erreur inconnue'}</p>
          <button onClick={onBack} className="text-[#FCD535] text-sm underline">Retour</button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => (
    <TabContent
      tab={activeTab}
      account={account}
      uqNumber={uqNumber}
      itemsError={itemsError}
      devices={devices}
      myItems={myItems}
      publicMetrics={publicMetrics}
      zandoDaily={zandoDaily}
      analyticsLoading={analyticsLoading}
      analyticsError={analyticsError}
      codePromo={codePromo}
      fontSize={fontSize}
      language={language}
      theme={theme}
      avatarUrl={avatarUrl}
      pinEnabled={pinEnabled}
      t={t}
      displayName={displayName}
      pseudoDisplay={pseudoDisplay}
      onShowPin={() => openPinModal()}
      onShowVerif={() => setShowVerifModal(true)}
      onShowKyc={() => setShowKyc(true)}
      onShowPhoto={() => setShowPhotoModal(true)}
      onOpenUQAI={openUQAI}
      onRevokeDevice={revokeDevice}
      onSaveFontSize={saveFontSize}
      onSaveLanguage={saveLanguage}
      onSaveTheme={saveTheme}
      onCopy={copyText}
      onShowEdit={() => setShowEditModal(true)}
    />
  );

  return (
    <div className="uq-profile uq-screen uq-screen--fixed">
      <ScreenHeader
        className="z-20"
        onBack={onBack}
        backLabel={t('profile.title')}
        title={t('profile.title')}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openPinModal();
              }}
              className={'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ' + (pinEnabled ? 'bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-[#0ECB81]' : 'bg-[#F6465D]/15 border border-[#F6465D]/30 text-[#F6465D]')}
            >
              <span>{pinEnabled ? 'PIN' : 'Sans PIN'}</span>
            </button>
            <button
              onClick={() => setShowVerifModal(true)}
              className={'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ' + (isVerified ? 'bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-[#0ECB81]' : 'bg-[#FCD535]/15 border border-[#FCD535]/30 text-[#FCD535]')}
            >
              {isVerified ? (<><IconCheck size={12} color="#0ECB81" /> Vérifié</>) : (<><IconShield size={12} color="#FCD535" /> Non vérifié</>)}
            </button>
          </div>
        }
      />

      {message && (
        <div className="shrink-0 px-4 pt-2">
          <div className="p-2.5 rounded-xl text-sm bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">{message}</div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex md:flex-col w-80 shrink-0 border-r border-[#2A2A38] bg-[#0D0D14]">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="text-center mb-6">
              <button onClick={() => setShowPhotoModal(true)} className="relative inline-block mb-3">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E63946] via-[#B5378C] to-[#2E86DE] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initial}
                </div>
                {isVerified && (
                  <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#0ECB81] flex items-center justify-center border-2 border-[#0D0D14]">
                    <IconCheck size={10} color="#FFFFFF" />
                  </div>
                )}
              </button>
              <h2 className="text-base font-bold truncate">{displayName}</h2>
              <p className="text-xs text-[#8E8E9A] truncate">{pseudoDisplay}</p>
              <button onClick={() => copyText(uqNumber, 'UQ copié')} className="text-[10px] text-[#5A5A6A] font-mono mt-1">
                {uqNumber} <IconCopy size={10} color="currentColor" className="inline" />
              </button>
            </div>

            {account.is_owner && account.code_promo && (
              <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-[#E63946]/10 to-[#2E86DE]/10 border border-[#2A2A38]">
                <p className="text-[10px] text-[#8E8E9A] uppercase mb-0.5">Code Promo Owner</p>
                <p className="text-xs font-mono font-bold bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent truncate">
                  {account.code_promo}
                </p>
              </div>
            )}

            {account.is_owner && (
              <button
                onClick={() => setShowSwitchModal(true)}
                className="w-full mb-3 p-3 rounded-lg border border-[#FCD535]/30 bg-[#FCD535]/5 hover:bg-[#FCD535]/10 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#FCD535] font-bold">
                    Basculer vers Profil 2
                  </span>
                  <span className="text-[10px] text-[#FCD535]"><Icon name="arrowRight" size={12} /></span>
                </div>
                <p className="text-[10px] text-[#5A5A6A] leading-tight">
                  Se connecter au compte lie du cercle
                </p>
              </button>
            )}

            {account.is_owner && (
              <div className="mb-3 p-3 rounded-lg border border-[#0ECB81]/30 bg-[#0ECB81]/5">
                <p className="text-[10px] uppercase tracking-wider text-[#0ECB81] font-bold mb-3">
                  Verifier KYC d un user
                </p>
                <input
                  type="text"
                  value={kycTargetUq}
                  onChange={(e) => setKycTargetUq(e.target.value.toUpperCase())}
                  placeholder="UQ-XXXXXXXX"
                  className="w-full p-2 mb-2 rounded-lg bg-[#0F0F15] border border-[#2A2A38] text-white text-xs focus:outline-none focus:border-[#0ECB81]"
                />
                <input
                  type="email"
                  value={kycTargetEmail}
                  onChange={(e) => setKycTargetEmail(e.target.value)}
                  placeholder="email@zando.uq"
                  className="w-full p-2 mb-3 rounded-lg bg-[#0F0F15] border border-[#2A2A38] text-white text-xs focus:outline-none focus:border-[#0ECB81]"
                />
                <button
                  onClick={handleAutoValidateKyc}
                  disabled={kycLoading || !kycTargetUq || !kycTargetEmail}
                  className="w-full py-2 rounded-lg bg-[#0ECB81] text-black font-bold text-xs active:scale-95 transition disabled:opacity-50 hover:bg-[#0ECB81]/90"
                >
                  {kycLoading ? 'Verification...' : 'Verifier automatiquement'}
                </button>
                {kycMessage && (
                  <div className={`mt-3 p-2 rounded-lg text-[10px] text-center border ${
                    kycMessage.startsWith('OK')
                      ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30 text-[#0ECB81]'
                      : 'bg-[#F6465D]/10 border-[#F6465D]/30 text-[#F6465D]'
                  }`}>
                    <Icon name={kycMessage.startsWith('OK') ? 'check' : 'alert'} size={12} className="mr-1 inline-block align-[-1px]" />
                    {kycMessage}
                  </div>
                )}
              </div>
            )}

            {localStorage.getItem('uq_switched_from') && (
              <>
                <button
                  onClick={handleReturnToOwner}
                  className="w-full mb-3 p-3 rounded-lg border border-[#0ECB81]/30 bg-[#0ECB81]/5 hover:bg-[#0ECB81]/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#0ECB81] font-bold">
                      Revenir au Profil 1 (Owner)
                    </span>
                    <span className="text-[10px] text-[#0ECB81]"><Icon name="arrowLeft" size={12} /></span>
                  </div>
                  <p className="text-[10px] text-[#5A5A6A] leading-tight">
                    Retour immediat, sans mot de passe
                  </p>
                </button>

                {canReclaim && (
                  <button
                  onClick={() => setShowReclamerModal(true)}
                  className="w-full mb-3 p-3 rounded-lg border border-[#FCD535]/30 bg-[#FCD535]/5 hover:bg-[#FCD535]/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#FCD535] font-bold">
                      Reclamer 30% du Tresor
                    </span>
                    <span className="text-[10px] text-[#FCD535]"><Icon name="arrowDown" size={12} tone="brand" /></span>
                  </div>
                  <p className="text-[10px] text-[#5A5A6A] leading-tight">
                    300 000 BORB (authentification owner requise)
                  </p>
                </button>
                )}
              </>
            )}

            <div className={'mb-3 p-3 rounded-lg border ' + (pinEnabled ? 'bg-[#0ECB81]/5 border-[#0ECB81]/30' : 'bg-[#F6465D]/5 border-[#F6465D]/30')}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E9A]">PIN validation</span>
                <span className={'text-[10px] font-bold ' + (pinEnabled ? 'text-[#0ECB81]' : 'text-[#F6465D]')}>
                  {pinEnabled ? 'ACTIF' : 'INACTIF'}
                </span>
              </div>
              <p className="text-[10px] text-[#5A5A6A] leading-tight">
                {pinEnabled ? 'Valide les opérations critiques' : 'Configurez dans Sécurité'}
              </p>
            </div>

            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ' + (active ? 'bg-[#FCD535]/10 text-[#FCD535]' : 'text-[#EAECEF] hover:bg-[#1F1F2A]')}
                  >
                    <Icon size={18} color={active ? '#FCD535' : '#8E8E9A'} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 p-4 border-t border-[#2A2A38]">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-sm font-semibold">
              <IconExit size={16} color="#F6465D" /> Se déconnecter
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden p-4">
            {mobileTabOpen ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMobileTabOpen(false)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2A2A38] bg-[#181A20] px-4 text-sm font-semibold text-[#EAECEF]"
                >
                  <IconChevron size={16} color="#EAECEF" direction="left" />
                  {t('profile.back')}
                </button>
                {renderTabContent()}
              </div>
            ) : (
              <>
            <div className="text-center mb-6">
              <button onClick={() => setShowPhotoModal(true)} className="relative inline-block mb-3">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E63946] via-[#B5378C] to-[#2E86DE] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initial}
                </div>
                {isVerified && (
                  <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#0ECB81] flex items-center justify-center border-2 border-[#0A0A0F]">
                    <IconCheck size={10} color="#FFFFFF" />
                  </div>
                )}
              </button>
              <h2 className="text-xl font-bold truncate px-4">{displayName}</h2>
              <p className="text-sm text-[#8E8E9A] truncate px-4">{pseudoDisplay}</p>
              <button onClick={() => copyText(uqNumber, 'UQ copié')} className="text-xs text-[#5A5A6A] font-mono mt-1">
                {uqNumber} <IconCopy size={10} color="currentColor" className="inline" />
              </button>
              <div className="flex justify-center gap-6 mt-5">
                <Stat value={publicMetrics.views.toLocaleString('fr-FR')} label="Vues" color="#38BDF8" />
                <Stat value={publicMetrics.rating === null ? '—' : publicMetrics.rating.toFixed(1)} label="Confiance / 5" color="#FBBF24" />
                <Stat value={publicMetrics.likes.toLocaleString('fr-FR')} label="J’aime" color="#FB7185" />
              </div>
            </div>

            <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl overflow-hidden">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileTabOpen(true);
                    }}
                    className={'w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#2A2A38] last:border-b-0 ' + (active ? 'bg-[#FCD535]/8' : '')}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2A] flex items-center justify-center shrink-0">
                      <Icon size={16} color={active ? '#FCD535' : '#8E8E9A'} />
                    </div>
                    <span className={'flex-1 text-left text-sm font-medium ' + (active ? 'text-[#FCD535]' : 'text-[#EAECEF]')}>
                      {tab.label}
                    </span>
                    <IconChevron size={16} color="#5A5A6A" direction="right" />
                  </button>
                );
              })}
            </div>

            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-2xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] font-semibold">
              <IconExit size={18} color="#F6465D" /> {t('profile.logout')}
            </button>
              </>
            )}
          </div>

          <div className="hidden md:block p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center p-0 md:p-4" onClick={(e) => e.target === e.currentTarget && setShowPhotoModal(false)}>
          <div className="w-full max-w-md bg-[#181A20] border-t md:border border-[#2A2A38] rounded-t-3xl md:rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A38]">
              <h3 className="text-base font-bold">Ma photo de profil</h3>
              <button onClick={() => setShowPhotoModal(false)} className="w-8 h-8 rounded-full bg-[#1F1F2A] flex items-center justify-center">
                <IconClose size={16} color="#EAECEF" />
              </button>
            </div>
            <div className="p-6 flex justify-center">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#E63946] via-[#B5378C] to-[#2E86DE] flex items-center justify-center text-6xl font-bold text-white overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initial}
              </div>
            </div>
            <div className="p-4 border-t border-[#2A2A38] space-y-2">
              <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FCD535] text-black font-semibold cursor-pointer">
                <IconCamera size={18} color="#000000" />
                Modifier la photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { uploadAvatar(e.target.files[0]); setShowPhotoModal(false); } }} />
              </label>
              {avatarUrl && (
                <button onClick={removeAvatar} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] font-semibold">
                  <IconClose size={18} color="#F6465D" /> Supprimer la photo
                </button>
              )}
              <button onClick={() => setShowPhotoModal(false)} className="w-full py-3 rounded-xl bg-[#1F1F2A] text-[#8E8E9A] font-semibold">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <PinModal
          action="pin"
          mode={pinMode}
          uqNumber={uqNumber}
          pinLength={pinLength}
          onSuccess={() => { setShowPinModal(false); setMessage('PIN ' + (pinMode === 'set' ? 'configuré' : pinMode === 'change' ? 'modifié' : 'supprimé')); loadPinStatus(); }}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      {showVerifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowVerifModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">Vérification KYC</h3>
                <button onClick={() => setShowVerifModal(false)} className="w-8 h-8 rounded-full bg-[#1F1F2A] flex items-center justify-center">
                  <IconClose size={16} color="#EAECEF" />
                </button>
              </div>
              <VerificationPage uqNumber={uqNumber} />
            </div>
          </div>
        </div>
      )}

      {showKyc && (
        <KycFlow
          onComplete={(data) => { setShowKyc(false); window.location.reload(); }}
          onCancel={() => setShowKyc(false)}
        />
      )}

      {showUQAI && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowUQAI(false); setUqaiTopic(undefined); } }}>
          <div className="w-full max-w-md">
            <FixoAssistant onClose={() => { setShowUQAI(false); setUqaiTopic(undefined); }} initialTopic={uqaiTopic} />
          </div>
        </div>
      )}

      {/* MODAL BASCULE VERS PROFIL 2 */}
      {showSwitchModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !switchLoading) { setShowSwitchModal(false); setSwitchError(''); setSwitchPassword(''); } }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#FCD535]/30 bg-[#181A20] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#FCD535] mb-2">Basculer vers Profil 2</h3>
            <p className="text-xs text-[#8E8E9A] mb-5">
              Connectez-vous au compte lie du cercle.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[#8E8E9A] mb-2">
              Mot de passe du Profil 2
            </label>
            <input
              type="password"
              value={switchPassword}
              onChange={(e) => setSwitchPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !switchLoading) handleSwitchToProfil2(); }}
              placeholder="Mot de passe"
              autoFocus
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white mb-4 focus:outline-none focus:border-[#FCD535]"
            />

            {switchError && (
              <div className="mb-4 p-3 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs">
                {switchError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSwitchModal(false); setSwitchError(''); setSwitchPassword(''); }}
                disabled={switchLoading}
                className="flex-1 py-3 rounded-xl border border-[#2A2A38] text-[#8E8E9A] font-bold disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSwitchToProfil2}
                disabled={switchLoading || !switchPassword}
                className="flex-1 py-3 rounded-xl bg-[#FCD535] text-black font-bold disabled:opacity-50 hover:bg-[#FCD535]/90"
              >
                {switchLoading ? 'Connexion...' : 'Basculer'}
              </button>
            </div>

            <p className="text-[10px] text-[#5A5A6A] mt-4 leading-tight">
              Le mot de passe du Profil 2 est requis. Sans lui, la bascule est impossible.
            </p>
          </div>
        </div>
      )}

      {showEditModal && account && (
        <EditProfileModal
          uqNumber={uqNumber}
          currentProfil={{
            ville_provenance: account.ville_provenance,
            ville_actuelle: account.ville_actuelle,
            statut_marital: account.statut_marital,
            emploi: account.emploi,
            description: account.description,
            mobile_money_number: account.mobile_money_number,
            mobile_money_operator: account.mobile_money_operator,
          }}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setMessage('Profil mis a jour');
            window.dispatchEvent(new CustomEvent('uq:profile-updated', { detail: { uqNumber } }));
            loadAccount();
          }}
        />
      )}

      {showReclamerModal && (
        <ReclamerModal
          onClose={() => setShowReclamerModal(false)}
          uqProfil2={localStorage.getItem("uq_number") || "UQ-230354360"}
        />
      )}
    </div>
  );
}
