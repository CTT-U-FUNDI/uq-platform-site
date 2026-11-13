import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UQ_COLORS, UQ_GRADIENTS } from '../../theme/colors';
import { useKeyboardInset } from '../../v2/lib/hooks';
import { Icon } from './Icon';
import {
  composeAnswer,
  getEntryById,
  detectLang,
  saveToHistory,
  WELCOME_MESSAGES,
  Lang,
} from '../../features/wallet/data/knowledgeIndex';

// ====================
// TYPES
// ====================

interface Message {
  id: string;
  role: 'user' | 'bot';
  title?: string;
  content: string;
  suggestions?: string[];
  /** Reformulation de ce que l'assistant a compris (questions floues). */
  understoodAs?: string;
  timestamp: number;
  /** Réponse en cours d'écriture mot par mot. */
  streaming?: boolean;
  /** Nombre de caractères déjà révélés pendant le streaming. */
  revealed?: number;
}

interface FixoAssistantProps {
  onClose: () => void;
  /** Sujet à ouvrir automatiquement au démarrage */
  initialTopic?: string;
}

const LANGS: { id: Lang; flag: string; label: string }[] = [
  { id: 'fr', flag: '🇫🇷', label: 'Français' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'es', flag: '🇪🇸', label: 'Español' },
  { id: 'sw', flag: '🇨🇩', label: 'Kiswahili' },
];

// ====================
// COMPOSANT
// ====================

export function FixoAssistant({ onClose, initialTopic }: FixoAssistantProps) {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const thinkTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);
  /* Hauteur recouverte par le clavier virtuel : sans cette reserve, la barre de
     saisie restait posee tout en bas de l'ecran, sous les touches. */
  const insetClavier = useKeyboardInset();

  const clearTimers = useCallback(() => {
    if (thinkTimerRef.current !== null) {
      window.clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    stopStreamRef.current = null;
  }, []);

  // Coupe les minuteurs au démontage pour ne jamais écrire après coup.
  useEffect(() => clearTimers, [clearTimers]);

  // ===== Message de bienvenue ou sujet direct =====
  useEffect(() => {
    clearTimers();
    setTyping(false);
    setStreaming(false);

    if (initialTopic) {
      // La fiche est cherchée dans la langue de l'interface puis, à défaut,
      // dans les langues équivalentes (les ids diffèrent de langue en langue).
      const entry = getEntryById(initialTopic, lang);

      if (entry) {
        setMessages([
          {
            id: 'topic-' + Date.now(),
            role: 'bot',
            title: entry.response.title,
            content: entry.response.content,
            suggestions: entry.response.suggestions,
            timestamp: Date.now(),
          },
        ]);
        return;
      }
    }

    // Sinon : message de bienvenue normal
    const welcome = WELCOME_MESSAGES[lang];
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'bot',
        title: welcome.title,
        content: welcome.content,
        suggestions: welcome.suggestions,
        timestamp: Date.now(),
      },
    ]);
  }, [lang, initialTopic, clearTimers]);

  // ===== Scroll auto =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth' });
  }, [messages, typing, streaming]);

  // ===== Focus input =====
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // ===== Envoyer un message =====
  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    saveToHistory(trimmed, lang);

    // Phase de réflexion : 500–800 ms, puis la réponse s'écrit mot par mot.
    const thinkDelay = 500 + Math.random() * 300;

    thinkTimerRef.current = window.setTimeout(() => {
      thinkTimerRef.current = null;

      const answer = composeAnswer(trimmed, lang);
      const content = answer.content || '';
      const tokens = content.match(/\S+\s*/g) || (content ? [content] : []);
      const botId = 'bot-' + Date.now();

      setMessages(prev => [
        ...prev,
        {
          id: botId,
          role: 'bot',
          title: answer.title,
          content,
          suggestions: answer.suggestions,
          understoodAs: answer.understoodAs,
          timestamp: Date.now(),
          streaming: true,
          revealed: 0,
        },
      ]);
      setTyping(false);
      setStreaming(true);

      // Calendrier précalculé : 42–78 ms par mot sur les 10 premiers, puis
      // 12–26 ms. Révéler selon le temps écoulé évite qu'un timer retardé
      // (onglet en arrière-plan) bloque la frappe à un mot par seconde.
      const stepDelay = (i: number) =>
        i < 10 ? 42 + Math.random() * 36 : 12 + Math.random() * 14;
      const tokenTimes: number[] = [];
      const tokenEnds: number[] = [];
      let clock = 0;
      let chars = 0;
      for (let i = 0; i < tokens.length; i++) {
        clock += stepDelay(i);
        chars += tokens[i].length;
        tokenTimes.push(clock);
        tokenEnds.push(chars);
      }

      const startedAt = performance.now();
      let revealedCount = 0;

      const finish = () => {
        if (revealTimerRef.current !== null) {
          window.clearTimeout(revealTimerRef.current);
          revealTimerRef.current = null;
        }
        stopStreamRef.current = null;
        setMessages(prev =>
          prev.map(m =>
            m.id === botId ? { ...m, streaming: false, revealed: content.length } : m
          )
        );
        setStreaming(false);
      };

      // « Arrêter » coupe l'effet de frappe et révèle le reste d'un coup.
      stopStreamRef.current = finish;

      const step = () => {
        const elapsed = performance.now() - startedAt;
        let count = revealedCount;
        while (count < tokens.length && tokenTimes[count] <= elapsed) count++;

        if (count >= tokens.length) {
          finish();
          return;
        }
        if (count > revealedCount) {
          revealedCount = count;
          const shown = tokenEnds[count - 1];
          setMessages(prev => prev.map(m => (m.id === botId ? { ...m, revealed: shown } : m)));
        }
        revealTimerRef.current = window.setTimeout(
          step,
          Math.max(8, tokenTimes[count] - elapsed)
        );
      };

      if (tokens.length === 0) {
        finish();
        return;
      }
      revealTimerRef.current = window.setTimeout(step, tokenTimes[0]);
    }, thinkDelay);
  }, [lang, streaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (s: string) => {
    sendMessage(s);
  };

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('uq_lang', newLang);
    setShowLangPicker(false);
  };

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // ====================
  // RENDU
  // ====================

  return (
    <div
      className="flex flex-col w-full h-[680px] max-h-[90vh] bg-[var(--uq-card)] border border-[var(--uq-border)] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        maxHeight: `calc(100dvh - 2rem - ${insetClavier}px)`,
        marginBottom: insetClavier,
      }}
    >

      {/* ═══ HEADER ═══ */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-[var(--uq-border)]"
        style={{ background: UQ_GRADIENTS.subtle }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center relative"
            style={{
              background: UQ_GRADIENTS.diagonal,
              boxShadow: `0 0 12px ${UQ_COLORS.magenta}60`,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4.5a2.5 2.5 0 0 0-5 0 3 3 0 0 0-3 3 3 3 0 0 0-1 5.5 3 3 0 0 0 2 4 2.5 2.5 0 0 0 4 1.5" />
              <path d="M12 4.5a2.5 2.5 0 0 1 5 0 3 3 0 0 1 3 3 3 3 0 0 1 1 5.5 3 3 0 0 1-2 4 2.5 2.5 0 0 1-4 1.5" />
              <line x1="12" y1="4.5" x2="12" y2="20" />
              <circle cx="7" cy="9" r="0.8" fill="#FFFFFF" />
              <circle cx="17" cy="9" r="0.8" fill="#FFFFFF" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0ECB81] border-2 border-[var(--uq-card)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold uq-gradient-text">UQ AI</h3>
            <p className="text-[10px] text-[var(--uq-text-secondary)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
              Assistant intelligent · En ligne
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--uq-card-light)] hover:bg-[var(--uq-border)] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>{LANGS.find(l => l.id === lang)?.flag}</span>
              <span className="uppercase">{lang}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showLangPicker && (
              <div
                className="absolute top-10 right-0 w-40 bg-[var(--uq-card)] border border-[var(--uq-border)] rounded-xl shadow-2xl overflow-hidden z-50 uq-animate-scale-in"
                style={{ transformOrigin: 'top right' }}
              >
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => changeLang(l.id)}
                    className={`w-full px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-[var(--uq-card-light)] transition-colors ${
                      lang === l.id ? 'bg-[var(--uq-card-light)]' : ''
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    {lang === l.id && <span className="text-[#0ECB81]"><Icon name="check" size={20} tone="success" /></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--uq-card-light)] hover:bg-[var(--uq-border)] flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ MESSAGES ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSuggestion={handleSuggestion}
            fmtTime={fmtTime}
          />
        ))}

        {typing && (
          <div className="flex items-start gap-2 uq-animate-fade-in">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: UQ_GRADIENTS.diagonal }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4.5a2.5 2.5 0 0 0-5 0 3 3 0 0 0-3 3 3 3 0 0 0-1 5.5 3 3 0 0 0 2 4 2.5 2.5 0 0 0 4 1.5" />
                <path d="M12 4.5a2.5 2.5 0 0 1 5 0 3 3 0 0 1 3 3 3 3 0 0 1 1 5.5 3 3 0 0 1-2 4 2.5 2.5 0 0 1-4 1.5" />
                <line x1="12" y1="4.5" x2="12" y2="20" />
              </svg>
            </div>
            <div className="bg-[var(--uq-card-light)] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--uq-text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--uq-text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--uq-text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ INPUT ═══ */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[var(--uq-border)] bg-[var(--uq-bg-secondary)]"
      >
        {streaming && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => stopStreamRef.current?.()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--uq-card-light)] hover:bg-[var(--uq-border)] border border-[var(--uq-border)] text-[11px] font-medium text-[var(--uq-text-secondary)] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              {lang === 'fr' ? 'Arrêter' : lang === 'en' ? 'Stop' : lang === 'es' ? 'Detener' : 'Acha'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              lang === 'fr' ? 'Pose ta question...' :
              lang === 'en' ? 'Ask your question...' :
              lang === 'es' ? 'Haz tu pregunta...' :
              'Uliza swali lako...'
            }
            className="flex-1 px-4 py-2.5 rounded-full bg-[var(--uq-card-light)] border border-[var(--uq-border)] text-sm text-[var(--uq-text)] placeholder-[var(--uq-text-muted)] focus:outline-none focus:border-[var(--uq-magenta)] transition-colors"
            disabled={typing || streaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || typing || streaming}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              background: UQ_GRADIENTS.diagonal,
              boxShadow: input.trim() && !typing && !streaming ? `0 0 12px ${UQ_COLORS.magenta}60` : 'none',
            }}
            aria-label="Envoyer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[var(--uq-text-muted)] text-center mt-2">
          <Icon name="bot" size={12} tone="info" /> UQ AI peut faire des erreurs. Vérifie les infos importantes.
        </p>
      </form>
    </div>
  );
}

// ====================
// MESSAGE BUBBLE
// ====================

function MessageBubble({
  message,
  onSuggestion,
  fmtTime,
}: {
  message: Message;
  onSuggestion: (s: string) => void;
  fmtTime: (ts: number) => string;
}) {
  const isUser = message.role === 'user';
  const isStreaming = !!message.streaming;
  const shown =
    message.revealed !== undefined ? message.content.slice(0, message.revealed) : message.content;

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 uq-animate-slide-up">
        <div className="max-w-[80%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white"
            style={{
              background: UQ_GRADIENTS.diagonal,
              boxShadow: `0 2px 8px ${UQ_COLORS.magenta}30`,
            }}
          >
            {message.content}
          </div>
          <p className="text-[9px] text-[var(--uq-text-muted)] text-right mt-1 pr-1">
            {fmtTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 uq-animate-slide-up">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
        style={{ background: UQ_GRADIENTS.diagonal }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.5a2.5 2.5 0 0 0-5 0 3 3 0 0 0-3 3 3 3 0 0 0-1 5.5 3 3 0 0 0 2 4 2.5 2.5 0 0 0 4 1.5" />
          <path d="M12 4.5a2.5 2.5 0 0 1 5 0 3 3 0 0 1 3 3 3 3 0 0 1 1 5.5 3 3 0 0 1-2 4 2.5 2.5 0 0 1-4 1.5" />
          <line x1="12" y1="4.5" x2="12" y2="20" />
        </svg>
      </div>

      <div className="max-w-[85%] flex-1">
        <div className="bg-[var(--uq-card-light)] border border-[var(--uq-border)] rounded-2xl rounded-tl-sm px-4 py-3">
          {message.title && (
            <h4 className="text-sm font-bold mb-2 uq-gradient-text">{message.title}</h4>
          )}
          <p
            className="text-sm text-[var(--uq-text)] whitespace-pre-line leading-relaxed"
            aria-live={isStreaming ? 'polite' : undefined}
          >
            {shown}
            {isStreaming && (
              <span
                className="inline-block w-[2px] h-[1em] align-middle bg-current ml-0.5 animate-pulse"
                aria-hidden="true"
              />
            )}
          </p>

          {!isStreaming && message.understoodAs && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--uq-card)] border border-[var(--uq-border)] text-[10px] text-[var(--uq-text-secondary)]">
              <span aria-hidden="true"><Icon name="target" size={20} tone="brand" /></span>
              <span className="italic">{message.understoodAs}</span>
            </div>
          )}

          {!isStreaming && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--uq-border)]">
              {message.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion(s)}
                  className="px-2.5 py-1 rounded-full bg-[var(--uq-card)] hover:bg-[var(--uq-bg)] border border-[var(--uq-border)] hover:border-[var(--uq-magenta)] text-[11px] font-medium text-[var(--uq-text)] transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[9px] text-[var(--uq-text-muted)] mt-1 pl-1">
          {fmtTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default FixoAssistant;

