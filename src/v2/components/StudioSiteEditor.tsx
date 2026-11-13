import { useEffect, useReducer, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  IMAGE_ACCEPT,
  compressImageFile,
  formatBytes,
  pickImageFile,
} from '../lib/image';
import {
  MEDIA_MAX_CHARS,
  SITE_MEDIAS_MAX,
  SITE_PAGES_MAX,
  type MediaAdjust,
  type MiniSite,
  type SiteButton,
  type SiteMedia,
  type SiteOverlay,
  type SitePage,
  type SiteSeg,
  type SiteSocial,
} from '../lib/api';
import { useSession } from '../lib/session';
import { mediaFilter as filterStr, mediaDuree as effDur, segsDuree as segsDur, fmtDuree as fmtT } from '../lib/minisite';
import './StudioSiteEditor.css';

/**
 * Éditeur de mini-site façon TikTok, porté de la maquette validée
 * (.uq_studio_preview/studio-preview.html, section #s9).
 *
 * La vue temps réel occupe tout le haut ; les outils tiennent dans les 20 % du
 * bas. Aucun visuel d'exemple : chaque média est une vraie photo importée ou une
 * vraie vidéo liée, chaque bouton et chaque réseau porte un lien réel. Le
 * résultat (`MiniSite`) est persisté par le Studio via les routes boutique
 * existantes (/api/shop/create, /api/shop/{id}/update), sous garde PIN.
 *
 * Les icônes sont les SVG maison de la maquette approuvée (pas d'emoji), embarqués
 * ici pour garder exactement le rendu validé sans gonfler le registre partagé.
 */

/* ============================ Icônes SVG ============================ */

const PATHS: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  chevronDown: 'M6 9l6 6 6-6',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
  contrast: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18M12 7a5 5 0 010 10',
  drop: 'M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z',
  hl: 'M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1M12 8a4 4 0 100 8 4 4 0 000-8zM4 20h16',
  moon: 'M20 14.5A8 8 0 019.5 4a7 7 0 108.5 10.5z',
  spark: 'M11 3l1.7 4.4L17 9l-4.3 1.6L11 15l-1.7-4.4L5 9l4.3-1.6zM18 14l.9 2.2 2.1.8-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.8z',
  bolt: 'M13 3L5 14h5l-1 7 8-11h-5z',
  rng: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  eye: 'M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  pages: 'M8 3h12v14H8zM4 7v14h12',
  cam: 'M4 9a2 2 0 012-2h1.5L9 5h6l1.5 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  tag: 'M20.5 12.5L12 21 3 12V3h9zM7.5 7.5h.01',
  link: 'M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5',
  share: 'M6 14a2.6 2.6 0 100-5.2A2.6 2.6 0 006 14zM18 8a2.6 2.6 0 100-5.2A2.6 2.6 0 0018 8zM18 21a2.6 2.6 0 100-5.2A2.6 2.6 0 0018 21zM8.3 10.2l7.4-3.6M8.3 12.8l7.4 3.6',
  sliders: 'M4 9h9M17 9h3M4 15h3M11 15h9M13 6.5v5M7 12.5v5',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  scissors: 'M6 6l12 12M18 6L6 18M7 21a3 3 0 100-6 3 3 0 000 6zM7 9a3 3 0 100-6 3 3 0 000 6z',
  crop: 'M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14',
  gauge: 'M4 14a8 8 0 0116 0M12 14l4.5-4.5M12 14h.01M2 14h2M20 14h2',
  play: 'M8 5l11 7-11 7z',
  pause: 'M8 5v14M16 5v14',
  plus: 'M12 5v14M5 12h14',
  cross: 'M12 6v12M6 12h12',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  chat: 'M4 5h16v10H9.5L4 19zM8 9h8M8 12h5',
  cart: 'M3 4h2l2.5 10h10L21 8H6M9 19a1 1 0 100-2 1 1 0 000 2zM17 19a1 1 0 100-2 1 1 0 000 2z',
  undo: 'M9 14L4.5 9.5 9 5M4.5 9.5H14a5 5 0 010 10h-4.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  phone: 'M7 2h10v20H7zM11 19h2',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3.2 12h17.6M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18',
  check: 'M5 13l4 4L19 7',
  facebook: 'M14 8h3V5h-3a4 4 0 00-4 4v3H7v3h3v6h3v-6h3l1-3h-4V9a1 1 0 011-1z',
  xsoc: 'M4 4l16 16M20 4L4 20',
};

function EdIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name] || PATHS.grid} />
    </svg>
  );
}

/* ============================ Constantes ============================ */

type AdjustKey = keyof MediaAdjust;
const ADJ: Array<{ k: AdjustKey; t: string; ic: string; min: number; max: number; def: number }> = [
  { k: 'brightness', t: 'Luminosité', ic: 'sun', min: 0, max: 200, def: 100 },
  { k: 'contrast', t: 'Contraste', ic: 'contrast', min: 0, max: 200, def: 100 },
  { k: 'saturation', t: 'Saturation', ic: 'drop', min: 0, max: 200, def: 100 },
  { k: 'highlights', t: 'Brillance', ic: 'hl', min: -100, max: 100, def: 0 },
  { k: 'shadows', t: 'Ombres', ic: 'moon', min: -100, max: 100, def: 0 },
  { k: 'sharp', t: 'Netteté', ic: 'spark', min: -100, max: 100, def: 0 },
  { k: 'warmth', t: 'Chaleur', ic: 'bolt', min: -100, max: 100, def: 0 },
  { k: 'hue', t: 'Teinte', ic: 'rng', min: -180, max: 180, def: 0 },
  { k: 'vignette', t: 'Vignette', ic: 'eye', min: 0, max: 100, def: 0 },
];
const SPEEDS = [0.3, 0.5, 1, 1.5, 2, 3];
const RATIOS: Array<[string, number]> = [
  ['Libre', 0], ['1:1', 1], ['4:5', 0.8], ['9:16', 0.5625], ['4:3', 1.3333], ['16:9', 1.7778],
];
const SOCIALS: Array<{ k: string; ic: string; c: string }> = [
  { k: 'WhatsApp', ic: 'phone', c: '#25D366' },
  { k: 'Instagram', ic: 'cam', c: '#E1306C' },
  { k: 'TikTok', ic: 'music', c: '#111' },
  { k: 'YouTube', ic: 'play', c: '#FF0000' },
  { k: 'Facebook', ic: 'facebook', c: '#1877F2' },
  { k: 'X', ic: 'xsoc', c: '#111' },
  { k: 'Site', ic: 'globe', c: '#2e86de' },
];
type ToolId = 'pages' | 'images' | 'buttons' | 'video' | 'social' | 'adjust' | 'overlay' | 'sound' | 'cut' | 'crop' | 'speed';
const ETOOLS: Array<{ id: ToolId; t: string; ic: string; g: 'page' | 'media' }> = [
  { id: 'pages', t: 'Pages', ic: 'pages', g: 'page' },
  { id: 'images', t: 'Images', ic: 'cam', g: 'page' },
  { id: 'buttons', t: 'Boutons', ic: 'tag', g: 'page' },
  { id: 'video', t: 'Vidéo', ic: 'link', g: 'page' },
  { id: 'social', t: 'Réseaux', ic: 'share', g: 'page' },
  { id: 'adjust', t: 'Ajuster', ic: 'sliders', g: 'media' },
  { id: 'overlay', t: 'Superposer', ic: 'layers', g: 'media' },
  { id: 'sound', t: 'Son', ic: 'music', g: 'media' },
  { id: 'cut', t: 'Couper', ic: 'scissors', g: 'media' },
  { id: 'crop', t: 'Rogner', ic: 'crop', g: 'media' },
  { id: 'speed', t: 'Vitesse', ic: 'gauge', g: 'media' },
];

/* ============================ Helpers purs ============================ */

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

function defAdj(): MediaAdjust {
  return { brightness: 100, contrast: 100, saturation: 100, highlights: 0, shadows: 0, sharp: 0, warmth: 0, hue: 0, vignette: 0 };
}
function makeMedia(type: 'photo' | 'video'): SiteMedia {
  return {
    type, src: '', label: type === 'video' ? 'vidéo' : 'photo', dur: 0,
    adj: defAdj(), speed: 1, crop: 0, overlays: [], sound: null, segs: [{ start: 0, end: 0 }],
  };
}
function makePage(i: number): SitePage {
  return {
    name: `Page ${i + 1}`,
    medias: [makeMedia('photo'), makeMedia('photo')],
    buttons: [{ label: 'Nous écrire', kind: 'contact', url: '' }],
    video: null,
    social: [],
  };
}
function normalisePage(page: SitePage, i: number): SitePage {
  const medias = (page.medias || []).slice(0, SITE_MEDIAS_MAX).map((m) => ({
    ...makeMedia(m.type === 'video' ? 'video' : 'photo'),
    ...m,
    adj: { ...defAdj(), ...(m.adj || {}) },
    overlays: m.overlays || [],
    segs: m.segs && m.segs.length ? m.segs : [{ start: 0, end: m.dur || 0 }],
  }));
  while (medias.length < SITE_MEDIAS_MAX) medias.push(makeMedia('photo'));
  return {
    name: page.name || `Page ${i + 1}`,
    medias,
    buttons: (page.buttons || []).map((b) => ({ label: b.label || '', kind: b.kind || 'lien', url: b.url || '' })),
    video: page.video || null,
    social: (page.social || []).map((s) => ({ name: s.name || '', url: s.url || '' })),
  };
}

function srcAt(m: SiteMedia, tOut: number): number {
  let acc = 0;
  for (const s of m.segs) {
    const len = (s.end - s.start) / (m.speed || 1);
    if (tOut <= acc + len) return s.start + (tOut - acc) * (m.speed || 1);
    acc += len;
  }
  return m.segs.length ? m.segs[m.segs.length - 1].end : 0;
}
function segAtOut(m: SiteMedia, tOut: number): number {
  let acc = 0;
  for (let i = 0; i < m.segs.length; i++) {
    const len = (m.segs[i].end - m.segs[i].start) / (m.speed || 1);
    if (tOut <= acc + len || i === m.segs.length - 1) return i;
    acc += len;
  }
  return 0;
}
/** Temps de sortie correspondant à un temps source (lecture native à playbackRate). */
function outAt(m: SiteMedia, src: number): number {
  let acc = 0;
  for (const s of m.segs) {
    if (src <= s.end) return acc + Math.max(0, src - s.start) / (m.speed || 1);
    acc += (s.end - s.start) / (m.speed || 1);
  }
  return acc;
}
function segContaining(m: SiteMedia, src: number): number {
  return m.segs.findIndex((s) => src >= s.start - 0.05 && src <= s.end + 0.05);
}

const readFileDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
const mediaDuration = (src: string, kind: 'video' | 'audio'): Promise<number> =>
  new Promise((resolve) => {
    const el = document.createElement(kind);
    el.preload = 'metadata';
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => resolve(0);
    el.src = src;
  });

/* ============================ Modèle ============================ */

interface EdModel {
  pages: SitePage[];
  pi: number;
  mode: 'page' | 'media';
  tool: ToolId | null;
  adjSel: AdjustKey;
  playing: boolean;
  playT: number;
  clip: SiteSeg | null;
  cropSel: number;
  mi: number[];
  ovSel: number;
}
function initModel(initial: MiniSite | null): EdModel {
  const pages = initial?.pages?.length
    ? initial.pages.slice(0, SITE_PAGES_MAX).map(normalisePage)
    : [makePage(0)];
  return {
    pages, pi: 0, mode: 'page', tool: null, adjSel: 'brightness',
    playing: false, playT: 0, clip: null, cropSel: 0, mi: pages.map(() => 0), ovSel: -1,
  };
}

/* ============================ Composant ============================ */

export function StudioSiteEditor({
  initial,
  shopName,
  shopTagline,
  onClose,
  onSave,
  busy,
}: {
  initial: MiniSite | null;
  shopName: string;
  shopTagline?: string;
  onClose: () => void;
  onSave: (site: MiniSite) => void;
  busy?: boolean;
}) {
  const { toast } = useSession();
  const M = useRef<EdModel | null>(null);
  if (!M.current) M.current = initModel(initial);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const commit = () => force();

  const pagesRef = useRef<HTMLDivElement>(null);
  const pageEls = useRef<Array<HTMLDivElement | null>>([]);
  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const mwrapRef = useRef<HTMLDivElement>(null);
  const mimgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef(0);
  const ovDrag = useRef<null | { i: number; resize: boolean; x0: number; y0: number; cw: number; ch: number; o0: SiteOverlay }>(null);
  const tlDrag = useRef<null | { kind: string; snd: boolean; resize: boolean; x0: number; s0: { start: number; len: number } | null }>(null);
  const animTimer = useRef<number | null>(null);

  const model = M.current;
  const curPage = () => model.pages[model.pi];
  const curMedia = () => curPage().medias[model.mi[model.pi]] || curPage().medias[0];

  /* ---------- carrousel : synchronisation et fondu d'arrivée ---------- */
  const syncCarousel = (smooth: boolean) => {
    const z = pagesRef.current;
    if (!z || model.mode !== 'page' || !z.clientWidth) return;
    const target = model.pi * z.clientWidth;
    if (Math.abs(z.scrollLeft - target) < 1) return;
    if (smooth) { z.scrollTo({ left: target, behavior: 'smooth' }); return; }
    const prev = z.style.scrollBehavior;
    z.style.scrollBehavior = 'auto';
    z.scrollLeft = target;
    z.style.scrollBehavior = prev;
  };
  const animatePage = (i: number) => {
    const el = pageEls.current[i];
    if (!el) return;
    el.classList.remove('ed-in');
    void el.offsetWidth;
    el.classList.add('ed-in');
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => el.classList.remove('ed-in'), 460);
  };
  useEffect(() => {
    syncCarousel(false);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- taille du média (rognage / format) ---------- */
  useEffect(() => {
    if (model.mode !== 'media') return;
    const box = mediaBoxRef.current, wrap = mwrapRef.current;
    if (!box || !wrap) return;
    const m = curMedia();
    const availW = box.clientWidth - 28, availH = box.clientHeight - 96;
    const r = m.crop || (m.type === 'video' ? 0.5625 : 0.8);
    let w = availW, h = w / r;
    if (h > availH) { h = availH; w = h * r; }
    wrap.style.width = `${Math.max(60, w)}px`;
    wrap.style.height = `${Math.max(60, h)}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  /* ---------- lecture réelle ---------- */
  const stopPlayback = () => {
    model.playing = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    videoRef.current?.pause();
    audioRef.current?.pause();
  };
  const paintPlayhead = () => {
    const m = curMedia();
    const d = effDur(m) || 1;
    const p = clamp(model.playT / d, 0, 1);
    const bar = barRef.current?.querySelector('i') as HTMLElement | null;
    if (bar) bar.style.width = `${p * 100}%`;
    const t0 = document.querySelector('.sse .ed__prog .t0') as HTMLElement | null;
    if (t0) t0.textContent = fmtT(model.playT);
    const head = document.querySelector('.sse .ed__pbody .etl__head') as HTMLElement | null;
    if (head) head.style.left = `${p * 100}%`;
  };
  const tick = () => {
    if (!model.playing) return;
    const now = performance.now();
    const dt = (now - lastTRef.current) / 1000;
    lastTRef.current = now;
    const m = curMedia();
    const d = effDur(m);
    const video = videoRef.current;
    if (video && m.src) {
      // lecture native à la vitesse choisie ; on saute les morceaux retirés
      const src = video.currentTime;
      if (segContaining(m, src) < 0) {
        const next = m.segs.find((s) => s.start > src);
        video.currentTime = next ? next.start : m.segs[0]?.start || 0;
      } else if (src >= (m.segs[m.segs.length - 1]?.end || 0) - 0.05) {
        video.currentTime = m.segs[0]?.start || 0;
      }
      model.playT = outAt(m, video.currentTime);
    } else {
      model.playT += dt;
    }
    if (model.playT >= d) { model.playT = 0; if (video) video.currentTime = m.segs[0]?.start || 0; }
    // son calé sur la fenêtre [start, start+len]
    const audio = audioRef.current;
    if (audio && m.sound && m.sound.src) {
      const within = model.playT >= m.sound.start && model.playT <= m.sound.start + m.sound.len;
      if (within) {
        const target = model.playT - m.sound.start;
        if (Math.abs(audio.currentTime - target) > 0.3) audio.currentTime = target;
        if (audio.paused) void audio.play().catch(() => undefined);
      } else if (!audio.paused) audio.pause();
    }
    paintPlayhead();
    rafRef.current = requestAnimationFrame(tick);
  };
  const playToggle = () => {
    const m = curMedia();
    if (m.type !== 'video' || !m.src) return;
    if (model.playing) { stopPlayback(); commit(); return; }
    model.playing = true;
    lastTRef.current = performance.now();
    const video = videoRef.current;
    if (video) {
      video.playbackRate = m.speed || 1;
      video.currentTime = srcAt(m, model.playT);
      void video.play().catch(() => undefined);
    }
    rafRef.current = requestAnimationFrame(tick);
    commit();
  };

  /* ---------- navigation ---------- */
  const setPage = (i: number) => {
    model.pi = clamp(i, 0, model.pages.length - 1);
    stopPlayback();
    model.playT = 0;
    model.mode = 'page';
    commit();
    requestAnimationFrame(() => { syncCarousel(true); animatePage(model.pi); });
  };
  const addPage = () => {
    if (model.pages.length >= SITE_PAGES_MAX) { toast(`Maximum ${SITE_PAGES_MAX} pages par mini-site.`, 'error'); return; }
    model.pages.push(makePage(model.pages.length));
    model.mi.push(0);
    setPage(model.pages.length - 1);
    requestAnimationFrame(() => syncCarousel(false));
    toast(`Page ajoutée · ${model.pages.length}/${SITE_PAGES_MAX}`, 'success');
  };
  const delPage = () => {
    if (model.pages.length <= 1) return;
    model.pages.splice(model.pi, 1);
    model.mi.splice(model.pi, 1);
    model.pi = Math.min(model.pi, model.pages.length - 1);
    model.mode = 'page';
    commit();
    requestAnimationFrame(() => { syncCarousel(false); animatePage(model.pi); });
    toast('Page supprimée.', 'success');
  };
  const openTool = (id: ToolId) => {
    const t = ETOOLS.find((x) => x.id === id);
    if (!t) return;
    model.tool = id;
    model.mode = t.g === 'page' ? 'page' : 'media';
    if (model.mode === 'media') stopPlayback();
    if (id === 'crop') {
      model.cropSel = RATIOS.findIndex((r) => r[1] === (curMedia().crop || 0));
      if (model.cropSel < 0) model.cropSel = 0;
    }
    commit();
    if (model.mode === 'page') requestAnimationFrame(() => syncCarousel(false));
  };
  const closeTool = () => { model.tool = null; stopPlayback(); commit(); requestAnimationFrame(() => syncCarousel(false)); };
  const selectMedia = (i: number) => {
    model.mi[model.pi] = i;
    model.mode = 'media';
    stopPlayback();
    model.playT = 0;
    model.ovSel = -1;
    if (!model.tool) model.tool = 'adjust';
    commit();
  };

  /* ---------- imports réels ---------- */
  const importPhoto = async (target: 'media' | 'overlay') => {
    const file = await pickImageFile(IMAGE_ACCEPT);
    if (!file) return;
    try {
      const c = await compressImageFile(file, { maxSide: 1080, maxChars: MEDIA_MAX_CHARS, quality: 0.82 });
      if (target === 'media') {
        const m = curMedia();
        m.type = 'photo'; m.src = c.dataUrl; m.label = 'photo'; m.dur = 0;
        m.segs = [{ start: 0, end: 0 }]; m.sound = null;
        toast(`Photo de ${formatBytes(c.chars)} importée.`, 'success');
      } else {
        const m = curMedia();
        m.overlays.push({ type: 'photo', src: c.dataUrl, x: 30, y: 30, w: 40, h: 32 });
        model.ovSel = m.overlays.length - 1;
        toast('Superposition photo importée.', 'success');
      }
      commit();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Photo illisible.', 'error');
    }
  };
  const setVideoUrl = async (url: string) => {
    const u = url.trim();
    if (!isHttpUrl(u)) { toast('Le lien vidéo doit commencer par http(s)://', 'error'); return; }
    const dur = await mediaDuration(u, 'video');
    const m = curMedia();
    m.type = 'video'; m.src = u; m.label = 'vidéo'; m.dur = dur || 0;
    m.segs = [{ start: 0, end: dur || 0 }]; m.speed = 1; model.playT = 0;
    commit();
    toast(dur ? `Vidéo liée · ${fmtT(dur)}` : 'Vidéo liée (durée inconnue).', 'success');
  };
  const importSound = async () => {
    const file = await pickImageFile('audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm');
    if (!file) return;
    try {
      const dataUrl = await readFileDataUrl(file);
      if (dataUrl.length > MEDIA_MAX_CHARS) { toast('Son trop lourd : choisis un extrait plus court.', 'error'); return; }
      const dur = await mediaDuration(dataUrl, 'audio');
      const m = curMedia();
      const d = effDur(m);
      m.sound = { track: file.name.replace(/\.[^.]+$/, '') || 'Son importé', src: dataUrl, start: 0, len: Math.min(8, d || dur || 8) };
      commit();
      toast('Son importé et calé sur la vidéo.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Son illisible.', 'error');
    }
  };

  /* ---------- superpositions : glisser / redimensionner ---------- */
  const ovPointerDown = (e: ReactPointerEvent, i: number, resize: boolean) => {
    const m = curMedia();
    const o = m.overlays[i];
    if (!o) return;
    model.ovSel = i;
    const R = mimgRef.current?.getBoundingClientRect();
    if (!R) return;
    ovDrag.current = { i, resize, x0: e.clientX, y0: e.clientY, cw: R.width, ch: R.height, o0: { ...o } };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    commit();
  };
  const ovPointerMove = (e: ReactPointerEvent) => {
    const drag = ovDrag.current;
    if (!drag) return;
    const m = curMedia();
    const o = m.overlays[drag.i];
    if (!o) return;
    const dx = ((e.clientX - drag.x0) / drag.cw) * 100;
    const dy = ((e.clientY - drag.y0) / drag.ch) * 100;
    if (drag.resize) { o.w = clamp(drag.o0.w + dx, 8, 100); o.h = clamp(drag.o0.h + dy, 8, 100); }
    else { o.x = clamp(drag.o0.x + dx, 0, 100 - o.w); o.y = clamp(drag.o0.y + dy, 0, 100 - o.h); }
    commit();
  };
  const ovPointerUp = () => { ovDrag.current = null; };

  /* ---------- timeline : scrub + son draggable ---------- */
  const tlPointerDown = (e: ReactPointerEvent, kind: string) => {
    const m = curMedia();
    const tl = e.currentTarget as HTMLElement;
    const target = e.target as HTMLElement;
    const snd = target.closest('[data-snd]');
    const sh = target.closest('[data-sndh]');
    const R = tl.getBoundingClientRect();
    if (kind === 'sound' && snd && m.sound) {
      tlDrag.current = { kind, snd: !sh, resize: !!sh, x0: e.clientX, s0: { ...m.sound } };
    } else {
      model.playT = clamp((e.clientX - R.left) / R.width, 0, 1) * effDur(m);
      tlDrag.current = { kind, snd: false, resize: false, x0: e.clientX, s0: null };
      paintPlayhead();
    }
    tl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const tlPointerMove = (e: ReactPointerEvent) => {
    const drag = tlDrag.current;
    if (!drag) return;
    const m = curMedia();
    const tl = e.currentTarget as HTMLElement;
    const R = tl.getBoundingClientRect();
    const d = effDur(m) || 1;
    if (!drag.snd && !drag.resize) {
      model.playT = clamp((e.clientX - R.left) / R.width, 0, 1) * d;
      paintPlayhead();
      return;
    }
    if (m.sound && drag.s0) {
      if (drag.snd && !drag.resize) {
        const dt = ((e.clientX - drag.x0) / R.width) * d;
        m.sound.start = clamp(drag.s0.start + dt, 0, Math.max(0, d - m.sound.len));
      } else {
        const t = clamp((e.clientX - R.left) / R.width, 0, 1) * d;
        m.sound.len = clamp(t - m.sound.start, 1, d - m.sound.start);
      }
      commit();
    }
  };
  const tlPointerUp = () => { if (tlDrag.current) { tlDrag.current = null; commit(); } };

  /* ---------- coupe / colle ---------- */
  const doCut = () => {
    const m = curMedia();
    const src = srcAt(m, model.playT);
    const i = segAtOut(m, model.playT);
    const s = m.segs[i];
    if (src > s.start + 0.3 && src < s.end - 0.3) {
      m.segs.splice(i, 1, { start: s.start, end: src }, { start: src, end: s.end });
      toast(`Coupé à ${fmtT(model.playT)}`, 'success');
    } else toast("Place le curseur au milieu d'un morceau.", 'error');
    commit();
  };
  const doCutDel = () => {
    const m = curMedia();
    if (m.segs.length > 1) {
      const i = segAtOut(m, model.playT);
      model.clip = m.segs.splice(i, 1)[0];
      model.playT = Math.min(model.playT, effDur(m));
      toast('Morceau retiré · prêt à coller.', 'success');
      commit();
    }
  };
  const doPaste = () => {
    const m = curMedia();
    if (!model.clip) return;
    const src = srcAt(m, model.playT);
    const i = segAtOut(m, model.playT);
    const s = m.segs[i];
    const at = clamp(src, s.start, s.end);
    m.segs.splice(i, 1, { start: s.start, end: at }, { ...model.clip }, { start: at, end: s.end });
    model.clip = null;
    toast('Morceau collé.', 'success');
    commit();
  };

  /* ---------- publication ---------- */
  const publier = () => {
    stopPlayback();
    const site: MiniSite = {
      pages: model.pages.slice(0, SITE_PAGES_MAX).map((p) => ({
        ...p,
        medias: p.medias.slice(0, SITE_MEDIAS_MAX),
      })),
    };
    onSave(site);
  };

  /* ============================ Rendu ============================ */

  const page = curPage();
  const media = curMedia();
  const showMedia = model.mode === 'media';
  const tool = ETOOLS.find((x) => x.id === model.tool);
  const initials = (shopName || 'UQ').trim().slice(0, 2).toUpperCase();

  const renderPageInner = (p: SitePage, pi: number) => (
    <>
      <div className="mp__head">
        <div className="mp__av">{initials}</div>
        <div className="mp__nm">
          <b>{shopName || 'Ta boutique'}</b>
          <span>{shopTagline || 'Ta boutique, ta page'}</span>
        </div>
      </div>
      <div className="mp__imgs">
        {p.medias.map((m, i) =>
          m.src ? (
            <div
              key={i}
              className="mp__img"
              data-on={i === p.medias.indexOf(m) && i === model.mi[pi] && model.mode === 'media'}
              style={{ backgroundImage: `url("${m.src}")`, filter: filterStr(m.adj) }}
              onClick={() => selectMedia(i)}
            >
              <span className="tag">
                <EdIcon name={m.type === 'video' ? 'play' : 'cam'} size={9} />
                {m.type === 'video' ? fmtT(effDur(m)) : 'photo'}
              </span>
              <span className="edit"><EdIcon name="sliders" size={12} /></span>
            </div>
          ) : (
            <div key={i} className="mp__img mp__img--empty" onClick={() => { model.mi[pi] = i; openTool('images'); }}>
              <EdIcon name="plus" size={18} />
              <span>Image {i + 1}<br />à ajouter</span>
            </div>
          ),
        )}
      </div>
      {p.buttons.length ? (
        <div className="mp__btns">
          {p.buttons.map((b, i) => (
            <button key={i} type="button" className={`mp__cta ${b.kind === 'contact' ? '' : 'mp__cta--ghost'}`}>
              <EdIcon name={b.kind === 'contact' ? 'chat' : b.kind === 'acheter' ? 'cart' : 'link'} size={13} />
              {b.label}
            </button>
          ))}
        </div>
      ) : null}
      {p.video ? (
        <div className="mp__yt">
          <div className="th">
            <span className="play"><EdIcon name="play" size={20} /></span>
            <span className="bd">
              <EdIcon name="play" size={11} />
              <span>{p.video.title || 'Vidéo'}</span>
              <span className="src">{p.video.src}</span>
            </span>
          </div>
          <div className="in"><EdIcon name="link" size={12} /><span>{p.video.url}</span></div>
        </div>
      ) : null}
      {p.social.length ? (
        <>
          <div className="mp__soclb">Retrouve-nous</div>
          <div className="mp__soc">
            {p.social.map((s) => {
              const def = SOCIALS.find((x) => x.k === s.name);
              return (
                <a key={s.name} style={{ background: def?.c || '#2e86de' }} aria-label={s.name} title={s.url || s.name}>
                  <EdIcon name={def?.ic || 'globe'} size={16} />
                </a>
              );
            })}
          </div>
        </>
      ) : null}
      {!p.buttons.length && !p.video && !p.social.length ? (
        <div className="mp__empty">
          <EdIcon name="grid" size={22} />
          Ajoute des boutons, une vidéo YouTube<br />et tes réseaux en bas de page.
        </div>
      ) : null}
    </>
  );

  const renderTimeline = (kind: 'sound' | 'cut') => {
    const m = curMedia();
    const total = segsDur(m) || 1;
    const d = effDur(m) || 1;
    const snd = m.sound;
    const left = snd ? clamp((snd.start / d) * 100, 0, 100) : 0;
    const width = snd ? clamp((snd.len / d) * 100, 2, 100 - left) : 0;
    return (
      <div
        className="etl"
        onPointerDown={(e) => tlPointerDown(e, kind)}
        onPointerMove={tlPointerMove}
        onPointerUp={tlPointerUp}
        onPointerCancel={tlPointerUp}
      >
        <div className="etl__film">
          {m.segs.map((s, i) => (
            <div
              key={i}
              className="etl__seg"
              style={{ width: `${(((s.end - s.start) / total) * 100).toFixed(2)}%`, backgroundImage: m.src ? `url("${m.src}")` : undefined }}
            />
          ))}
        </div>
        {kind === 'sound' && snd ? (
          <div className="etl__snd" data-snd style={{ left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%` }}>
            <EdIcon name="music" size={10} /> {snd.track}
            <span className="h" data-sndh />
          </div>
        ) : null}
        <div className="etl__head" style={{ left: 0 }} />
        <div className="etl__ruler"><span>0:00</span><span>{fmtT(d / 2)}</span><span>{fmtT(d)}</span></div>
      </div>
    );
  };

  const renderPanel = () => {
    if (!model.tool) return null;
    const p = curPage();
    const m = curMedia();
    let sub = '';
    let body: ReactNode = null;

    if (model.tool === 'pages') {
      sub = `Maximum ${SITE_PAGES_MAX} pages`;
      body = (
        <>
          <div className="escroll">
            {model.pages.map((_, i) => (
              <button key={i} type="button" className="echip" data-on={i === model.pi} onClick={() => setPage(i)}>
                <EdIcon name="pages" size={12} />Page {i + 1}
              </button>
            ))}
            {model.pages.length < SITE_PAGES_MAX ? (
              <button type="button" className="echip" onClick={addPage}><EdIcon name="plus" size={12} />Ajouter</button>
            ) : null}
          </div>
          <div className="erow">
            {model.pages.length > 1 ? (
              <button type="button" className="ebtn ebtn--danger" onClick={delPage}><EdIcon name="trash" size={12} />Supprimer cette page</button>
            ) : null}
            <span className="emuted">Glisse horizontalement dans la vue pour changer de page.</span>
          </div>
        </>
      );
    } else if (model.tool === 'images') {
      sub = `${SITE_MEDIAS_MAX} images par page`;
      body = (
        <>
          <div className="erow">
            {p.medias.map((md, i) => (
              <button key={i} type="button" className="echip" data-on={i === model.mi[model.pi]} onClick={() => { model.mi[model.pi] = i; commit(); }}>
                <EdIcon name="cam" size={12} />Image {i + 1} · {md.src ? (md.type === 'video' ? 'Vidéo' : 'Photo') : 'vide'}
              </button>
            ))}
          </div>
          <div className="erow">
            <button type="button" className="ebtn" onClick={() => void importPhoto('media')}><EdIcon name="cam" size={12} />Importer photo</button>
            <button type="button" className="ebtn ebtn--solid" onClick={() => selectMedia(model.mi[model.pi])}><EdIcon name="sliders" size={12} />Éditer</button>
          </div>
          <VideoUrlField key={`vu-${model.pi}-${model.mi[model.pi]}`} initial={m.type === 'video' ? m.src : ''} onValid={(u) => void setVideoUrl(u)} />
          <span className="emuted">Touche une image dans la vue pour l'éditer façon TikTok. La vidéo se lie par URL (mp4/webm).</span>
        </>
      );
    } else if (model.tool === 'buttons') {
      sub = 'Appels à action';
      body = (
        <>
          <div className="erow">
            {p.buttons.map((b, i) => (
              <span key={i} className="echip">
                {b.label}
                <button type="button" className="x" aria-label="Retirer" onClick={() => { p.buttons.splice(i, 1); commit(); }}><EdIcon name="cross" size={10} /></button>
              </span>
            ))}
            {!p.buttons.length ? <span className="emuted">Aucun bouton.</span> : null}
          </div>
          <div className="erow">
            <button type="button" className="ebtn" onClick={() => { p.buttons.push({ label: 'Nous écrire', kind: 'contact', url: '' }); commit(); }}><EdIcon name="chat" size={12} />Nous écrire</button>
            <button type="button" className="ebtn" onClick={() => { p.buttons.push({ label: 'Acheter', kind: 'acheter', url: '' }); commit(); }}><EdIcon name="cart" size={12} />Acheter</button>
          </div>
          <ButtonLinkField onAdd={(label, url) => { p.buttons.push({ label, kind: 'lien', url }); commit(); }} />
        </>
      );
    } else if (model.tool === 'video') {
      sub = 'YouTube ou lien externe';
      body = p.video ? (
        <>
          <div className="efld">
            <span className="emuted" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.video.title || 'Vidéo'} · {p.video.src}</span>
            <button type="button" className="ebtn ebtn--danger" onClick={() => { p.video = null; commit(); }}><EdIcon name="trash" size={12} />Retirer</button>
          </div>
          <span className="emuted">La vidéo s'affiche dans la page avec un bouton lecture.</span>
        </>
      ) : (
        <VideoLinkField onAdd={(url, title) => {
          const src = /youtu\.?be/i.test(url) ? 'YouTube' : 'Externe';
          p.video = { url, title: title || 'Vidéo de la boutique', src };
          commit();
          toast(`Vidéo ajoutée · ${src}`, 'success');
        }} />
      );
    } else if (model.tool === 'social') {
      sub = 'Tout en bas de la page';
      body = (
        <>
          <div className="erow">
            {SOCIALS.map((s) => {
              const active = p.social.some((x) => x.name === s.k);
              return (
                <button key={s.k} type="button" className="echip" data-on={active} onClick={() => {
                  const i = p.social.findIndex((x) => x.name === s.k);
                  if (i >= 0) p.social.splice(i, 1); else p.social.push({ name: s.k, url: '' });
                  commit();
                }}>
                  <EdIcon name={s.ic} size={12} />{s.k}
                </button>
              );
            })}
          </div>
          {p.social.map((s) => (
            <div className="efld" key={s.name}>
              <span className="emuted" style={{ flex: 'none', width: 70 }}>{s.name}</span>
              <input
                defaultValue={s.url}
                placeholder={`Lien ${s.name} (https://…)`}
                onBlur={(e) => { s.url = e.target.value.trim(); commit(); }}
              />
            </div>
          ))}
          <span className="emuted">Active les réseaux et colle leurs liens : les boutons s'ajoutent tout en bas de la page.</span>
        </>
      );
    } else if (model.tool === 'adjust') {
      sub = 'Réglages en temps réel';
      const a = ADJ.find((x) => x.k === model.adjSel)!;
      body = (
        <>
          <div className="escroll">
            {ADJ.map((x) => (
              <button key={x.k} type="button" className="echip echip--ic" data-on={model.adjSel === x.k} onClick={() => { model.adjSel = x.k; commit(); }}>
                <EdIcon name={x.ic} size={16} /><span>{x.t}</span>
              </button>
            ))}
          </div>
          <div className="erng">
            <span className="lab"><EdIcon name={a.ic} size={12} />{a.t}</span>
            <input
              type="range" min={a.min} max={a.max} value={m.adj[a.k]}
              onChange={(e) => { m.adj[model.adjSel] = Number(e.target.value); commit(); }}
            />
            <span className="val">{m.adj[a.k]}</span>
          </div>
          <div className="erow">
            <button type="button" className="ebtn" onClick={() => { m.adj[model.adjSel] = a.def; commit(); }}><EdIcon name="undo" size={12} />Réinitialiser</button>
            <span className="emuted">L'effet s'applique direct sur la vue.</span>
          </div>
        </>
      );
    } else if (model.tool === 'overlay') {
      sub = 'Importer par-dessus';
      body = (
        <>
          <div className="erow">
            <button type="button" className="ebtn ebtn--solid" onClick={() => void importPhoto('overlay')}><EdIcon name="cam" size={12} />Photo</button>
          </div>
          <div className="erow">
            {m.overlays.map((o, i) => (
              <span key={i} className="echip" data-on={i === model.ovSel}>
                <button type="button" className="x" style={{ width: 'auto' }} onClick={() => { model.ovSel = i; commit(); }}><EdIcon name="layers" size={11} />{i + 1} · {o.type}</button>
                <button type="button" className="x" aria-label="Retirer" onClick={() => { m.overlays.splice(i, 1); model.ovSel = -1; commit(); }}><EdIcon name="cross" size={10} /></button>
              </span>
            ))}
            {!m.overlays.length ? <span className="emuted">Aucune superposition.</span> : null}
          </div>
          <span className="emuted">Glisse la superposition dans la vue, tire la poignée pour la taille.</span>
        </>
      );
    } else if (model.tool === 'sound') {
      if (m.type !== 'video') {
        body = <span className="emuted">Une photo n'a pas de durée. Lie une vidéo (menu Images) pour caler un son.</span>;
      } else {
        sub = `Calé sur ${fmtT(effDur(m))}`;
        body = (
          <>
            <div className="erow">
              <button type="button" className="ebtn ebtn--solid" onClick={() => void importSound()}><EdIcon name="music" size={12} />Importer un son</button>
              {m.sound ? <button type="button" className="ebtn" onClick={() => { m.sound = null; commit(); }}><EdIcon name="cross" size={11} />Aucun</button> : null}
              {m.sound ? <span className="echip" data-on="true"><EdIcon name="music" size={11} />{m.sound.track}</span> : null}
            </div>
            {renderTimeline('sound')}
            <span className="emuted">
              {m.sound ? `${fmtT(m.sound.start)} → ${fmtT(m.sound.start + m.sound.len)} · glisse pour déplacer, tire le bord pour la durée.` : 'Importe un son : il se cale sur la durée de la vidéo.'}
            </span>
          </>
        );
      }
    } else if (model.tool === 'cut') {
      if (m.type !== 'video') {
        body = <span className="emuted">Une photo n'a pas de durée. Lie une vidéo (menu Images) pour couper / coller.</span>;
      } else {
        sub = `${m.segs.length} morceau(x) · ${fmtT(effDur(m))}`;
        body = (
          <>
            {renderTimeline('cut')}
            <div className="erow">
              <button type="button" className="ebtn ebtn--solid" onClick={doCut}><EdIcon name="scissors" size={12} />Couper</button>
              <button type="button" className="ebtn ebtn--danger" disabled={m.segs.length < 2} onClick={doCutDel}><EdIcon name="trash" size={12} />Supprimer</button>
              <button type="button" className="ebtn" disabled={!model.clip} onClick={doPaste}><EdIcon name="plus" size={12} />Coller</button>
            </div>
            <span className="emuted">Place le curseur, puis coupe. Glisse dans la timeline pour déplacer le curseur.</span>
          </>
        );
      }
    } else if (model.tool === 'crop') {
      sub = 'Rognage / format';
      body = (
        <>
          <div className="escroll">
            {RATIOS.map((r, i) => (
              <button key={r[0]} type="button" className="echip" data-on={model.cropSel === i} onClick={() => { model.cropSel = i; m.crop = r[1]; commit(); }}>{r[0]}</button>
            ))}
          </div>
          <div className="erow">
            <button type="button" className="ebtn ebtn--solid" onClick={() => { m.crop = RATIOS[model.cropSel][1]; commit(); toast(`Rognage appliqué · ${RATIOS[model.cropSel][0]}`, 'success'); }}><EdIcon name="crop" size={12} />Appliquer</button>
            <button type="button" className="ebtn" onClick={() => { m.crop = 0; model.cropSel = 0; commit(); }}><EdIcon name="undo" size={12} />Réinitialiser</button>
          </div>
          <span className="emuted">Le cadre montre le format gardé.</span>
        </>
      );
    } else if (model.tool === 'speed') {
      if (m.type !== 'video') {
        body = <span className="emuted">Une photo n'a pas de durée. Lie une vidéo pour régler la vitesse.</span>;
      } else {
        sub = `Durée : ${fmtT(effDur(m))}`;
        body = (
          <>
            <div className="erow">
              {SPEEDS.map((s) => (
                <button key={s} type="button" className="echip" data-on={m.speed === s} onClick={() => {
                  m.speed = s;
                  if (m.sound) { const d = effDur(m); m.sound.len = Math.min(m.sound.len, d); m.sound.start = clamp(m.sound.start, 0, Math.max(0, d - m.sound.len)); }
                  model.playT = clamp(model.playT, 0, effDur(m));
                  if (videoRef.current) videoRef.current.playbackRate = s;
                  commit();
                }}>{s}×</button>
              ))}
            </div>
            <span className="emuted">La vitesse change la durée de lecture, le son et la coupe suivent.</span>
          </>
        );
      }
    }

    return (
      <div className="ed__panel" data-on="true">
        <div className="ed__phead">
          <button type="button" className="iconbtn" aria-label="fermer l'outil" onClick={closeTool}><EdIcon name="chevronDown" size={14} /></button>
          <b>{tool?.t || 'Outil'}</b>
          <span className="sub">{sub}</span>
        </div>
        <div className="ed__pbody">{body}</div>
      </div>
    );
  };

  const mediaStyle: CSSProperties = { filter: filterStr(media.adj) };

  return (
    <div className="sse" role="dialog" aria-modal="true" aria-label="Éditeur de mini-site">
      <div className="ed">
        <div className="ed__view">
          <div className="ed__hud">
            <button type="button" className="iconbtn" aria-label="retour" onClick={() => { stopPlayback(); onClose(); }}><EdIcon name="back" size={16} /></button>
            <div className="ed__crumb">
              {shopName || 'Éditeur'}{' '}
              <span className="muted">· {showMedia ? `${media.type === 'video' ? 'Vidéo' : 'Photo'} · ${page.name}` : `${page.name} / ${model.pages.length}`}</span>
            </div>
            {!showMedia ? (
              <div className="ed__pageseg">
                {model.pages.map((_, i) => (
                  <button key={i} type="button" data-on={i === model.pi} onClick={() => setPage(i)}>{i + 1}</button>
                ))}
                {model.pages.length < SITE_PAGES_MAX ? (
                  <button type="button" aria-label="ajouter une page" onClick={addPage}><EdIcon name="plus" size={12} /></button>
                ) : null}
              </div>
            ) : null}
            <button type="button" className="btnpub" disabled={busy} onClick={publier}>
              <EdIcon name="check" size={14} />{busy ? 'Enregistrement…' : 'Publier'}
            </button>
          </div>

          <div
            className="ed__pages"
            ref={pagesRef}
            style={{ display: showMedia ? 'none' : 'flex' }}
            onScroll={() => {
              const z = pagesRef.current;
              if (!z || model.mode !== 'page' || !z.clientWidth) return;
              const i = Math.round(z.scrollLeft / z.clientWidth);
              if (i !== model.pi && i >= 0 && i < model.pages.length) {
                model.pi = i;
                animatePage(i);
                commit();
              }
            }}
          >
            {model.pages.map((p, pi) => (
              <div
                key={pi}
                className="ed__page"
                ref={(el) => { pageEls.current[pi] = el; }}
              >
                {renderPageInner(p, pi)}
              </div>
            ))}
          </div>

          <div className="ed__media" ref={mediaBoxRef} data-on={showMedia}>
            <div className="ed__mwrap" ref={mwrapRef}>
              <div
                className="ed__mimg"
                ref={mimgRef}
                style={media.src && media.type === 'photo' ? { backgroundImage: `url("${media.src}")`, ...mediaStyle } : mediaStyle}
                onPointerMove={ovPointerMove}
                onPointerUp={ovPointerUp}
                onPointerCancel={ovPointerUp}
              >
                {media.type === 'video' && media.src ? (
                  <video ref={videoRef} src={media.src} playsInline muted style={mediaStyle} />
                ) : null}
                {!media.src ? (
                  <div className="empty"><EdIcon name="cam" size={22} />Média à importer<br />(menu Images)</div>
                ) : null}
                {media.overlays.map((o, i) => (
                  <div
                    key={i}
                    className="ov"
                    data-sel={i === model.ovSel}
                    style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, backgroundImage: o.type === 'photo' ? `url("${o.src}")` : undefined }}
                    onPointerDown={(e) => ovPointerDown(e, i, false)}
                  >
                    {o.type === 'video' && o.src ? <video src={o.src} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    <span className="g">{o.type === 'video' ? 'vidéo' : 'photo'}</span>
                    <i className="h" onPointerDown={(e) => { e.stopPropagation(); ovPointerDown(e, i, true); }} />
                  </div>
                ))}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 50% 50%,transparent 55%,rgba(0,0,0,${(media.adj.vignette / 130).toFixed(3)}))` }} />
              </div>
              <div className="ed__crop" data-on={model.tool === 'crop'}>
                <div className="third" />
                <div className="frame"><i data-c="nw" /><i data-c="ne" /><i data-c="sw" /><i data-c="se" /></div>
              </div>
            </div>
          </div>

          <button type="button" className="ed__play" data-on={showMedia && media.type === 'video' && Boolean(media.src)} data-playing={model.playing} aria-label="lecture" onClick={playToggle}>
            <EdIcon name={model.playing ? 'pause' : 'play'} size={26} />
          </button>
          <div className="ed__speedchip" data-on={showMedia && media.type === 'video' && media.speed !== 1}>{media.speed === 1 ? '1' : media.speed}×</div>
          <div className="ed__prog" data-on={showMedia && media.type === 'video' && Boolean(media.src)}>
            <span className="t t0">0:00</span>
            <div
              className="bar"
              ref={barRef}
              onClick={(e) => {
                const R = e.currentTarget.getBoundingClientRect();
                model.playT = clamp((e.clientX - R.left) / R.width, 0, 1) * effDur(media);
                const v = videoRef.current;
                if (v) v.currentTime = srcAt(media, model.playT);
                paintPlayhead();
                commit();
              }}
            >
              <i />
            </div>
            <span className="t">{fmtT(effDur(media))}</span>
          </div>
          {media.sound?.src ? <audio ref={audioRef} src={media.sound.src} preload="auto" /> : null}
        </div>

        <div className="ed__band">
          {!model.tool ? (
            <div className="ed__dock">
              {ETOOLS.map((t, i) => (
                <span key={t.id} style={{ display: 'contents' }}>
                  {i > 0 && ETOOLS[i - 1].g !== t.g ? <span className="sep" /> : null}
                  <button type="button" data-on={model.tool === t.id} onClick={() => openTool(t.id)}>
                    <EdIcon name={t.ic} size={18} /><span>{t.t}</span>
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}

/* ============================ Champs de saisie ============================ */

function VideoUrlField({ initial, onValid }: { initial: string; onValid: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="efld">
      <input ref={ref} defaultValue={initial} placeholder="Lien vidéo externe (https://… .mp4/.webm)" />
      <button type="button" className="ebtn ebtn--solid" onClick={() => onValid(ref.current?.value || '')}><EdIcon name="check" size={12} />Lier</button>
    </div>
  );
}

function VideoLinkField({ onAdd }: { onAdd: (url: string, title: string) => void }) {
  const urlRef = useRef<HTMLInputElement>(null);
  const ttlRef = useRef<HTMLInputElement>(null);
  const { toast } = useSession();
  return (
    <>
      <div className="efld"><input ref={urlRef} placeholder="Lien YouTube ou externe…" /></div>
      <div className="efld">
        <input ref={ttlRef} placeholder="Titre de la vidéo" maxLength={48} />
        <button type="button" className="ebtn ebtn--solid" onClick={() => {
          const u = (urlRef.current?.value || '').trim();
          if (!u) { toast('Colle un lien YouTube ou externe.', 'error'); return; }
          onAdd(u, (ttlRef.current?.value || '').trim());
        }}><EdIcon name="plus" size={12} />Ajouter</button>
      </div>
      <span className="emuted">Ex. : https://youtube.com/watch?v=… — un lecteur est ajouté à la page.</span>
    </>
  );
}

function ButtonLinkField({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const lblRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const { toast } = useSession();
  return (
    <>
      <div className="efld"><input ref={lblRef} placeholder="Libellé du bouton…" maxLength={24} /></div>
      <div className="efld">
        <input ref={urlRef} placeholder="Lien externe (https://…)" />
        <button type="button" className="ebtn ebtn--solid" onClick={() => {
          const label = (lblRef.current?.value || '').trim();
          const url = (urlRef.current?.value || '').trim();
          if (!label) { toast('Donne un libellé au bouton.', 'error'); return; }
          onAdd(label, url);
          if (lblRef.current) lblRef.current.value = '';
          if (urlRef.current) urlRef.current.value = '';
        }}><EdIcon name="plus" size={12} />Ajouter</button>
      </div>
    </>
  );
}