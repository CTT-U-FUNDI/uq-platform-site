import { useEffect, useRef, useState, type FormEvent } from 'react';
import { composeAnswer, detectLang, saveToHistory, WELCOME_MESSAGES, type Lang } from '../../features/wallet/data/knowledgeIndex';
import { Icon } from './Icon';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { Sheet } from './Ui';

interface Message {
  id: number;
  mine: boolean;
  content: string;
}

export function AuthAiSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [language] = useState<Lang>(() => detectLang());
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, mine: false, content: WELCOME_MESSAGES[language].content },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number | null>(null);
  const typingTimer = useRef<number | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (typingTimer.current !== null) window.clearInterval(typingTimer.current);
    },
    [],
  );

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, busy]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;

    const id = Date.now();
    setError('');
    setDraft('');
    setMessages((current) => [...current, { id, mine: true, content: question }]);
    saveToHistory(question, language);
    setBusy(true);
    setTypingMessageId(null);
    timer.current = window.setTimeout(() => {
      try {
        const answer = composeAnswer(question, language);
        const content = answer.content || 'Je n’ai pas trouvé de réponse fiable. Essaie de reformuler ta question.';
        const answerId = id + 1;
        let visibleLength = 0;
        setMessages((current) => [...current, { id: answerId, mine: false, content: '' }]);
        setTypingMessageId(answerId);
        typingTimer.current = window.setInterval(() => {
          visibleLength = Math.min(visibleLength + 2, content.length);
          const visibleContent = content.slice(0, visibleLength);
          setMessages((current) =>
            current.map((message) =>
              message.id === answerId ? { ...message, content: visibleContent } : message,
            ),
          );
          if (visibleLength >= content.length) {
            if (typingTimer.current !== null) window.clearInterval(typingTimer.current);
            typingTimer.current = null;
            setTypingMessageId(null);
            setBusy(false);
          }
        }, 36);
      } catch {
        setError('UQ AI n’a pas pu préparer une réponse. Réessaie avec une autre question.');
        setBusy(false);
      } finally {
        timer.current = null;
      }
    }, 240);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(draft);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      className="v2-auth-gate-sheet v2-auth-ai-sheet"
      title="UQ AI"
      subtitle="Assistant local · réponses sur cet appareil"
    >
      <div className="v2-auth-ai">
        <div ref={listRef} className="v2-auth-ai-messages" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <div
              className={`v2-auth-ai-message${message.mine ? ' is-mine' : ''}${message.id === typingMessageId ? ' is-typing' : ''}`}
              key={message.id}
            >
              {!message.mine && <LogoUQ size={26} />}
              <p>{message.content}</p>
            </div>
          ))}
          {busy && typingMessageId === null && (
            <div className="v2-auth-ai-message" role="status" aria-label="UQ AI prépare une réponse">
              <LogoUQ size={26} animated />
              <span className="v2-auth-ai-typing"><i /><i /><i /></span>
            </div>
          )}
        </div>
        {error && <div className="v2-auth-error" role="alert">{error}</div>}
        <form className="v2-auth-ai-form" onSubmit={submit}>
          <textarea
            ref={inputRef}
            className="v2-auth-ai-input"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(draft);
              }
            }}
            placeholder="Pose ta question à UQ AI…"
            rows={1}
            maxLength={1200}
            aria-label="Message à UQ AI"
          />
          <button
            className="v2-auth-ai-send"
            type="submit"
            aria-label="Envoyer le message"
            disabled={!draft.trim() || busy}
          >
            {busy ? <span className="v2-spinner" /> : <Icon name="send" size={17} />}
          </button>
        </form>
        <p className="v2-auth-ai-note">Réponses issues de la base de connaissances UQ. Ne partage aucune donnée confidentielle.</p>
      </div>
    </Sheet>
  );
}
