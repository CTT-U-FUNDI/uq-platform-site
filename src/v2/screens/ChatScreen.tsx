import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import {
  WELCOME_MESSAGES,
  composeAnswer,
  detectLang,
  saveToHistory,
  type Lang,
} from '../../features/wallet/data/knowledgeIndex';
import { PinSheet } from '../components/PinSheet';
import { MarketplaceSheet } from '../components/MarketplaceSheet';
import { PublicProfileSheet } from '../components/PublicProfileSheet';
import { PublicationsPanel } from '../components/PublicationsPanel';
import { StatusRail } from '../components/StatusRail';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Field,
  IconButton,
  Input,
  List,
  Row,
  ScreenHeader,
  SearchInput,
  Segmented,
  Sheet,
  Skeleton,
  Textarea,
} from '../components/Ui';
import { useAsync, useKeyboardInset, usePolling } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useHelp } from '../lib/help';
import {
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  createChatGroup,
  describeError,
  ETIQUETTES_MOTIF,
  getChatInbox,
  getChatMessages,
  getChatStatus,
  getGroupMessages,
  getPinStatus,
  getSystemMessages,
  joinChatGroup,
  leaveChatGroup,
  listChatContacts,
  listChatGroups,
  listZandoItems,
  pinIsConfigured,
  lookupPublicPseudo,
  MOTIFS_SIGNALEMENT,
  sendChatMessage,
  sendGroupMessage,
  signalerPair,
  updateChatSettings,
  upsertChatContact,
  askUqAi,
  verifyPin,
  type AiTour,
  type ChatContact,
  type ChatGroup,
  type ChatMessage,
  type ChatReseau,
  type ChatThreadResponse,
  type PublicPseudoResponse,
  type SignalementPayload,
  type SystemMessage,
  type ZandoItem,
} from '../lib/api';
import { formatNumber, formatTime, initials, relativeDay } from '../lib/format';
import { identityAvatar, identityLabel, useIdentities, useIdentity } from '../lib/identity';
import { getP2POffers, type P2POffer } from '../lib/trading';

type ChatTab = 'direct' | 'clients' | 'p2p' | 'groups' | 'news' | 'trends';
type Thread =
  | { kind: 'direct'; id: string }
  | { kind: 'group'; id: string; name: string }
  | { kind: 'ai'; id: string; name: string };

/** Identifiant du fil UQ AI dans la liste des discussions. */
const AI_THREAD_ID = 'UQ-AI';
const AI_STORAGE_PREFIX = 'uq_ai_thread_';

/**
 * Message que le client a saisi mais que le serveur n'a pas encore accepte.
 * Il est montre dans le fil avec son etat reel : ni le texte ni l'heure ne
 * sont inventes, et rien n'est declare envoye avant la reponse.
 */
interface MessageLocal {
  cle: string;
  content: string;
  image?: string;
  timestamp: number;
  enAttente: boolean;
  erreur?: string;
}

const messageAuthor = (message: ChatMessage): string =>
  String(message.sender || message.from_user || '');

const isMine = (message: ChatMessage, me: string): boolean => {
  const author = messageAuthor(message);
  return Boolean(author) && author.toUpperCase() === me.toUpperCase();
};

export function ChatScreen({
  initialPeer,
  initialItem,
  onPeerConsumed,
  onOpenItem,
  onBack,
}: {
  initialPeer?: string | null;
  /** Element Zando a l'origine de la discussion (bouton « Contacter » du flux). */
  initialItem?: ZandoItem | null;
  onPeerConsumed?: () => void;
  onOpenItem?: (item: ZandoItem) => void;
  onBack?: () => void;
}) {
  const { uq, toast } = useSession();
  const help = useHelp();
  const [tab, setTab] = useState<ChatTab>('direct');
  const [query, setQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newProfile, setNewProfile] = useState<PublicPseudoResponse | null>(null);
  const [newBusy, setNewBusy] = useState(false);
  const [newError, setNewError] = useState('');
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupVisibility, setGroupVisibility] = useState('public');
  const [busy, setBusy] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState('');

  // Actions d'une conversation : bloquer, silencieux, verrouiller (PIN).
  const [optionsPeer, setOptionsPeer] = useState<string | null>(null);
  /** Ventes & commandes marketplace avec ce contact (seller gère ici). */
  const [ventesPeer, setVentesPeer] = useState<string | null>(null);
  /** Fiche publique du membre : n'importe quel membre clique sur sa fiche. */
  const [profilePeer, setProfilePeer] = useState<string | null>(null);
  const [removePeer, setRemovePeer] = useState<string | null>(null);
  const [settingBusy, setSettingBusy] = useState(false);
  const [pinPeer, setPinPeer] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<'lock' | 'unlock' | null>(null);
  /** Discussions dont le verrou a ete ouvert pendant cette session. */
  const [unlocked, setUnlocked] = useState<string[]>([]);
  // Signalement d'un interlocuteur : motif + explication, envoyes a la moderation.
  const [reportPeer, setReportPeer] = useState<string | null>(null);
  const [reportMotif, setReportMotif] = useState<SignalementPayload['motif']>('spam');
  const [reportTexte, setReportTexte] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  const inbox = useAsync(() => getChatInbox(uq), [uq], { enabled: Boolean(uq) });
  const contacts = useAsync(() => listChatContacts(uq), [uq], { enabled: Boolean(uq) });
  const groups = useAsync(() => listChatGroups(uq), [uq], { enabled: Boolean(uq) });
  const news = useAsync(() => getSystemMessages(), []);
  const pin = useAsync(() => getPinStatus(uq), [uq], { enabled: Boolean(uq) });
  /** Etat reseau mesure : null quand le serveur n'a pas repondu. */
  const reseau = useAsync<ChatReseau | null>(() => getChatStatus(), [uq], {
    enabled: Boolean(uq) && tab === 'direct',
  });
  const p2p = useAsync(() => getP2POffers(uq), [uq], {
    enabled: Boolean(uq) && tab === 'p2p',
  });
  const items = useAsync(() => listZandoItems(), [], {
    enabled: tab === 'clients' || tab === 'direct' || Boolean(thread),
  });
  /* Le bandeau reseau est rafraichi a part : la presence se mesure cote serveur,
     aucun ping cote client ne doit laisser croire qu'un contact est en ligne. */
  usePolling(() => reseau.reload(), 20000, tab === 'direct' && !thread);

  const pinConfigured = pinIsConfigured(pin.data);
  const pinLength = Math.min(
    Math.max(Number(pin.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH),
    PIN_MAX_LENGTH,
  );

  useEffect(() => {
    if (!initialPeer) return;
    setTab('direct');
    setThread({ kind: 'direct', id: initialPeer });
    if (initialItem?.id) {
      // La conversation garde le lien de l'offre : les deux participants la
      // retrouvent dans « Clients ».
      void upsertChatContact({
        uq,
        peer_id: initialPeer,
        action: 'add',
        zando_item_id: String(initialItem.id),
        zando_item_title: initialItem.title || '',
      })
        .then(() => contacts.reload())
        .catch(() => undefined);
    }
    onPeerConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPeer]);

  const conversations = useMemo(() => {
    const list = (inbox.data?.conversations || []).slice();
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [inbox.data]);

  const contactMap = useMemo(() => {
    const map: Record<string, ChatContact> = {};
    (contacts.data?.contacts || []).forEach((entry) => {
      map[String(entry.peer_id || '').toUpperCase()] = entry;
    });
    return map;
  }, [contacts.data]);

  /**
   * Un fil peut etre ouvert par pseudo : le serveur seul le rattache au numero
   * UQ canonique. On retient cette reponse pour que les reglages et le
   * signalement parlent la meme langue que la base de contacts.
   */
  const [resolus, setResolus] = useState<Record<string, string>>({});

  const canoniqueDe = (peer: string): string =>
    String(resolus[String(peer || '').toUpperCase()] || peer || '');

  const contactFor = (peerId: string): ChatContact | undefined =>
    contactMap[canoniqueDe(peerId).toUpperCase()];

  const linkedItemFor = (contact?: ChatContact): ZandoItem | null => {
    if (!contact?.zando_item_id) return null;
    return (
      (items.data?.items || []).find((entry) => String(entry.id) === String(contact.zando_item_id)) ||
      null
    );
  };

  /**
   * Les conversations ne portent que le numero UQ du destinataire. On resout
   * le pseudo pour l'affichage et pour la recherche : le UQ reste la cle
   * technique envoyee a l'API.
   */
  const peers = useIdentities([
    ...conversations.map((entry) => entry.peer_id),
    ...(contacts.data?.contacts || []).map((entry) => entry.peer_id),
  ]);

  const peerLabel = (peerId: string) => identityLabel(peerId, peers[String(peerId || '').toUpperCase()]);

  const filteredConversations = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return conversations;
    return conversations.filter((entry) => {
      const label = peerLabel(entry.peer_id);
      return (
        label.toLowerCase().includes(lowered) ||
        String(entry.peer_id || '').toLowerCase().includes(lowered)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, peers, query]);

  /** UQ AI reste visible dans la liste sauf si la recherche l'exclut. */
  const aiRowVisible = !query.trim() || /uq\s*-?\s*ai|assistant|intelligence/i.test(query);

  /** Apercu du fil UQ AI : la ligne se presente comme une discussion normale. */
  const [aiSurvol, setAiSurvol] = useState<AiMessage | null>(() => aiPreview(uq));
  useEffect(() => {
    // A la fermeture du fil, l'historique vient d'etre reecrit : on le relit.
    if (thread?.kind !== 'ai') setAiSurvol(aiPreview(uq));
  }, [thread, uq]);

  /** Clients : conversations rattachees a un element Zando. */
  const clientContacts = useMemo(() => {
    const lowered = clientQuery.trim().toLowerCase();
    return (contacts.data?.contacts || [])
      .filter((entry) => Boolean(entry.zando_item_id))
      .filter((entry) => {
        if (!lowered) return true;
        const label = peerLabel(entry.peer_id).toLowerCase();
        return (
          label.includes(lowered) ||
          String(entry.peer_id || '').toLowerCase().includes(lowered) ||
          String(entry.zando_item_title || '').toLowerCase().includes(lowered)
        );
      })
      .sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.data, peers, clientQuery]);

  const contactList = useMemo(() => {
    const lowered = contactQuery.trim().toLowerCase();
    const list = (contacts.data?.contacts || []).slice();
    if (!lowered) return list;
    return list.filter((entry) => {
      const label = peerLabel(entry.peer_id);
      return (
        label.toLowerCase().includes(lowered) ||
        String(entry.peer_id || '').toLowerCase().includes(lowered)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.data, peers, contactQuery]);

  const openDirect = (peerId: string) => {
    if (!peerId) return;
    setThread({ kind: 'direct', id: peerId.trim().toUpperCase() });
  };

  /**
   * Nouvelle discussion : on cherche par pseudo. Le profil (pseudo, nom,
   * avatar) est affiche avant d'ouvrir le fil, pour confirmer l'identite.
   * Le backend resout lui-meme le pseudo en UQ au premier message.
   */
  const searchNewTarget = async () => {
    const target = newTarget.trim().replace(/^@/, '');
    if (!target) {
      setNewError('Saisis un pseudo.');
      return;
    }
    setNewBusy(true);
    setNewError('');
    setNewProfile(null);
    try {
      const found = await lookupPublicPseudo(target);
      if (!found?.existe) {
        setNewError('Aucun compte ne porte ce pseudo.');
        return;
      }
      setNewProfile(found);
    } catch (error) {
      setNewError(describeError(error, 'Recherche impossible.'));
    } finally {
      setNewBusy(false);
    }
  };

  const openNewChat = () => {
    const pseudo = String(newProfile?.pseudo || newTarget).trim().replace(/^@/, '');
    if (!pseudo) return;
    setNewOpen(false);
    setNewTarget('');
    setNewProfile(null);
    setNewError('');
    setThread({ kind: 'direct', id: pseudo });
  };

  const submitGroup = async () => {
    if (!groupName.trim()) {
      toast('Donne un nom au groupe', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await createChatGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        type: 'group',
        visibility: groupVisibility,
      });
      const created = result?.group;
      setNewGroupOpen(false);
      setGroupName('');
      setGroupDescription('');
      toast('Groupe créé', 'success');
      groups.reload();
      if (created?.group_id) setThread({ kind: 'group', id: created.group_id, name: created.name });
    } catch (error) {
      toast(describeError(error, 'Création impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleGroupMembership = async (group: ChatGroup) => {
    try {
      if (group.is_member) await leaveChatGroup(group.group_id);
      else await joinChatGroup(group.group_id);
      toast(group.is_member ? 'Groupe quitté' : 'Groupe rejoint', 'success');
      groups.reload();
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    }
  };

  const applySetting = async (
    peer: string,
    patch: { blocked?: boolean; muted?: boolean; locked?: boolean; ephemere?: boolean },
    message: string,
  ) => {
    setSettingBusy(true);
    try {
      await updateChatSettings({ uq, peer_id: peer, ...patch });
      toast(message, 'success');
      contacts.reload();
      inbox.reload();
    } catch (error) {
      toast(describeError(error, 'Réglage impossible.'), 'error');
    } finally {
      setSettingBusy(false);
    }
  };

  /**
   * Signalement d'un interlocuteur. La cible doit etre le numero UQ canonique
   * (le pseudo ne se signale pas) : a defaut, la feuille explique comment
   * l'obtenir plutot que d'envoyer une valeur inventee.
   */
  const submitSignalement = async () => {
    const cible = canoniqueDe(reportPeer || '').toUpperCase();
    if (!/^UQ-\d+$/.test(cible)) {
      toast('Ouvre la discussion avec ce contact pour le signaler.', 'error');
      return;
    }
    setReportBusy(true);
    try {
      const resultat = await signalerPair({
        cible_uq: cible,
        motif: reportMotif,
        description: reportTexte.trim(),
      });
      toast(resultat?.message || 'Signalement enregistré.', 'success');
      setReportPeer(null);
      setReportTexte('');
      setReportMotif('spam');
    } catch (error) {
      toast(describeError(error, 'Signalement impossible.'), 'error');
    } finally {
      setReportBusy(false);
    }
  };

  /**
   * Verrouiller ou ouvrir une discussion exige le code PIN du compte. La
   * verification passe par /api/account/pin/verify avant tout reglage.
   */
  const askPin = (mode: 'lock' | 'unlock', peer: string) => {
    if (!pinConfigured) {
      toast('Configure un code PIN dans la sécurité du profil', 'error');
      return;
    }
    setOptionsPeer(null);
    setPinPeer(peer);
    setPinMode(mode);
  };

  const confirmPin = async (code: string): Promise<string | void> => {
    const check = await verifyPin(uq, code);
    if (check?.valid === false) return 'Code PIN incorrect';
    if (check?.pin_configured === false) return 'Aucun code PIN configuré sur ce compte';
    const mode = pinMode;
    const peer = pinPeer;
    setPinPeer(null);
    setPinMode(null);
    if (!peer || !mode) return;
    await updateChatSettings({ uq, peer_id: peer, locked: mode === 'lock' });
    const key = peer.toUpperCase();
    setUnlocked((prev) =>
      mode === 'unlock' ? Array.from(new Set([...prev, key])) : prev.filter((entry) => entry !== key),
    );
    contacts.reload();
    toast(mode === 'lock' ? 'Discussion verrouillée' : 'Discussion déverrouillée', 'success');
  };

  const removeContact = async (peer: string) => {
    setSettingBusy(true);
    try {
      await upsertChatContact({ uq, peer_id: peer, action: 'delete' });
      toast('Contact supprimé', 'success');
      setRemovePeer(null);
      setOptionsPeer(null);
      contacts.reload();
    } catch (error) {
      toast(describeError(error, 'Suppression impossible.'), 'error');
    } finally {
      setSettingBusy(false);
    }
  };

  const optionsContact = optionsPeer ? contactFor(optionsPeer) : undefined;

  if (thread) {
    if (thread.kind === 'ai') {
      return <AiThread me={uq} onClose={() => setThread(null)} />;
    }
    const direct = thread.kind === 'direct';
    const contact = direct ? contactFor(thread.id) : undefined;
    const key = canoniqueDe(thread.id).toUpperCase();
    const conversation = direct
      ? conversations.find((entry) => String(entry.peer_id || '').toUpperCase() === key)
      : undefined;
    return (
      <>
        <ChatThread
          thread={thread}
          me={uq}
          contact={contact}
          linkedItem={direct ? linkedItemFor(contact) : null}
          locked={Boolean(direct && contact?.locked && !unlocked.includes(key))}
          presence={direct ? Boolean(conversation?.en_ligne) : undefined}
          onPeerResolved={(pair) =>
            setResolus((prev) => {
              const cle = thread.id.toUpperCase();
              return prev[cle] === pair ? prev : { ...prev, [cle]: pair };
            })
          }
          onUnlock={() => askPin('unlock', canoniqueDe(thread.id))}
          onProfile={direct ? () => setProfilePeer(thread.id) : undefined}
          onOptions={direct ? () => setOptionsPeer(thread.id) : undefined}
          onOpenItem={onOpenItem}
          onClose={() => {
            setThread(null);
            inbox.reload();
            contacts.reload();
            groups.reload();
          }}
          onRefreshList={() => {
            inbox.reload();
            contacts.reload();
          }}
        />

        <PinSheet
          open={Boolean(pinMode && pinPeer)}
          onClose={() => {
            setPinPeer(null);
            setPinMode(null);
          }}
          title={pinMode === 'lock' ? 'Verrouiller la discussion' : 'Déverrouiller la discussion'}
          subtitle="Confirme avec ton code PIN"
          length={pinLength}
          onSubmit={confirmPin}
        />

        <ConversationOptions
          peer={optionsPeer}
          label={optionsPeer ? peerLabel(optionsPeer) : ''}
          contact={optionsContact}
          busy={settingBusy}
          onClose={() => setOptionsPeer(null)}
          onProfile={() => {
            if (!optionsPeer) return;
            setProfilePeer(optionsPeer);
            setOptionsPeer(null);
          }}
          onOpen={() => {
            if (!optionsPeer) return;
            const peer = optionsPeer;
            setOptionsPeer(null);
            openDirect(peer);
          }}
          onBlock={() => {
            if (!optionsPeer) return;
            void applySetting(
              canoniqueDe(optionsPeer),
              { blocked: !optionsContact?.blocked },
              optionsContact?.blocked ? 'Contact débloqué' : 'Contact bloqué',
            );
          }}
          onMute={() => {
            if (!optionsPeer) return;
            void applySetting(
              canoniqueDe(optionsPeer),
              { muted: !optionsContact?.muted },
              optionsContact?.muted ? 'Mode silencieux désactivé' : 'Discussion en mode silencieux',
            );
          }}
          onLock={() => {
            if (!optionsPeer) return;
            askPin(optionsContact?.locked ? 'unlock' : 'lock', canoniqueDe(optionsPeer));
          }}
          onEphemere={() => {
            if (!optionsPeer) return;
            const cible = canoniqueDe(optionsPeer);
            const etatActif = Boolean(optionsContact?.ephemere);
            setOptionsPeer(null);
            void applySetting(
              cible,
              { ephemere: !etatActif },
              etatActif ? 'Messages éphémères désactivés' : 'Messages éphémères activés',
            );
          }}
          onVentes={() => {
            if (!optionsPeer) return;
            setVentesPeer(optionsPeer);
            setOptionsPeer(null);
          }}
          onReport={() => {
            if (!optionsPeer) return;
            setReportPeer(canoniqueDe(optionsPeer));
            setOptionsPeer(null);
          }}
          onRemove={() => {
            if (!optionsPeer) return;
            setRemovePeer(optionsPeer);
            setOptionsPeer(null);
          }}
        />

        <MarketplaceSheet peer={ventesPeer} onClose={() => setVentesPeer(null)} />

        <SignalementSheet
          peer={reportPeer}
          label={reportPeer ? peerLabel(reportPeer) : ''}
          motif={reportMotif}
          texte={reportTexte}
          busy={reportBusy}
          onMotif={setReportMotif}
          onTexte={setReportTexte}
          onSubmit={() => void submitSignalement()}
          onClose={() => {
            setReportPeer(null);
            setReportTexte('');
          }}
        />

        <Sheet
          open={Boolean(removePeer)}
          onClose={() => setRemovePeer(null)}
          title="Supprimer ce contact ?"
          subtitle={removePeer ? peerLabel(removePeer) : ''}
        >
          <div className="v2-stack">
            <div className="v2-muted" style={{ fontSize: 13 }}>
              Il ne sera plus ajouté automatiquement à tes contacts, même lors d’une nouvelle
              conversation. L’historique des messages reste conservé.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <Button
                block
                variant="danger"
                icon="trash"
                loading={settingBusy}
                onClick={() => removePeer && void removeContact(canoniqueDe(removePeer))}
              >
                Supprimer le contact
              </Button>
              <Button block variant="secondary" onClick={() => setRemovePeer(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </Sheet>

        <PublicProfileSheet
          pseudo={profilePeer || ''}
          onClose={() => setProfilePeer(null)}
          onContact={
            profilePeer
              ? () => {
                  // La fiche rend le pseudo ; la discussion reste indexee par l'identifiant.
                  const peer = profilePeer;
                  setProfilePeer(null);
                  openDirect(peer);
                }
              : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title="Chat"
        subtitle="Discussions, clients, groupes et annonces"
        onBack={onBack}
        dense
        right={
          <>
            <IconButton
              name="info"
              label="Guide du chat"
              compact
              onClick={() => help.openHelp('chat')}
            />
            <IconButton
              name="contact"
              label="Contacts"
              compact
              onClick={() => setContactsOpen(true)}
            />
            <IconButton name="plus" label="Nouveau message" compact onClick={() => setNewOpen(true)} />
            <IconButton
              name="users"
              label="Nouveau groupe"
              compact
              onClick={() => setNewGroupOpen(true)}
            />
          </>
        }
      />

      <div className="v2-pad">
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'direct', label: 'Discussions', icon: 'chat' },
            { value: 'clients', label: 'Clients', icon: 'contact' },
            { value: 'p2p', label: 'P2P', icon: 'swap' },
            { value: 'groups', label: 'Groupes', icon: 'users' },
            { value: 'trends', label: 'Tendances', icon: 'trendUp' },
            { value: 'news', label: 'Annonces', icon: 'bell' },
          ]}
        />
      </div>

      {tab === 'direct' && (
        <div className="v2-pad">
          <div style={{ margin: '0 calc(var(--v2-pad) * -1)' }}>
            <StatusRail
              items={items.data?.items || []}
              onOpenItem={onOpenItem}
              onOpenProfile={(pseudo) => setProfilePeer(pseudo)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une discussion…" />
          </div>

          {!reseau.loading && (reseau.data || reseau.error) && (
            <div
              className="v2-chat-banner"
              data-hors-ligne={Boolean(!reseau.data && reseau.error)}
            >
              <Icon name={!reseau.data && reseau.error ? 'alert' : 'chat'} size={14} />
              <span>
                {reseau.data
                  ? [
                      reseau.data.messages_non_lus
                        ? `${reseau.data.messages_non_lus} message${
                            reseau.data.messages_non_lus > 1 ? 's' : ''
                          } non lu${reseau.data.messages_non_lus > 1 ? 's' : ''}`
                        : 'Aucun message non lu',
                      reseau.data.contacts_en_ligne
                        ? `${reseau.data.contacts_en_ligne} contact${
                            reseau.data.contacts_en_ligne > 1 ? 's' : ''
                          } en ligne`
                        : null,
                      `${reseau.data.total_conversations || 0} discussion${
                        (reseau.data.total_conversations || 0) > 1 ? 's' : ''
                      }`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Serveur injoignable — tes messages restent sur le serveur UQ.'}
              </span>
            </div>
          )}

          {inbox.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
            </Card>
          ) : inbox.error ? (
            <ErrorBlock message={inbox.error} onRetry={inbox.reload} />
          ) : (
            <>
              {(aiRowVisible || filteredConversations.length > 0) && (
                <Card padded={false} style={{ overflow: 'hidden' }}>
                  <List plain>
                    {aiRowVisible && (
                      <Row
                        avatar={{ label: 'UQ AI', icon: 'uqia' }}
                        title="UQ AI"
                        subtitle={
                          <span className="v2-clamp-1" style={{ display: 'block', maxWidth: 200 }}>
                            {aiSurvol
                              ? `${aiSurvol.mine ? 'Tu : ' : ''}${aiSurvol.content}`
                              : 'Assistant intelligent · réponses instantanées'}
                          </span>
                        }
                        value={aiSurvol ? formatTime(aiSurvol.timestamp) : ''}
                        chevron
                        onClick={() => setThread({ kind: 'ai', id: AI_THREAD_ID, name: 'UQ AI' })}
                      />
                    )}

                    {filteredConversations.map((entry) => {
                      const label = peerLabel(entry.peer_id);
                      const contact = contactFor(entry.peer_id);
                      const nonLus = Number(entry.non_lus || 0);
                      const marques =
                        entry.ephemere ||
                        nonLus > 0 ||
                        Boolean(contact && (contact.muted || contact.blocked || contact.locked));
                      return (
                        <Row
                          key={entry.peer_id}
                          avatar={{
                            label: initials(label),
                            src: identityAvatar(entry.peer_id, peers[String(entry.peer_id || '').toUpperCase()]),
                            presence: Boolean(entry.en_ligne),
                          }}
                          title={label}
                          subtitle={
                            <span className="v2-clamp-1" style={{ display: 'block', maxWidth: 200 }}>
                              {entry.last_message || 'Nouvelle conversation'}
                            </span>
                          }
                          value={entry.timestamp ? formatTime(entry.timestamp) : ''}
                          right={
                            marques ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--v2-ink-3)' }}>
                                {entry.ephemere && <Icon name="clock" size={14} />}
                                {contact?.blocked && <Icon name="shield" size={14} />}
                                {contact?.muted && <Icon name="bell" size={14} />}
                                {contact?.locked && <Icon name="lock" size={14} />}
                                {nonLus > 0 && <span className="v2-chat-unread">{nonLus}</span>}
                              </span>
                            ) : undefined
                          }
                          chevron
                          onClick={() => openDirect(entry.peer_id)}
                        />
                      );
                    })}
                  </List>
                </Card>
              )}

              {filteredConversations.length === 0 && (
                <div style={{ marginTop: 12 }}>
                  <Card>
                    <EmptyState
                      icon="chat"
                      title={query.trim() ? 'Aucun résultat' : 'Aucune discussion'}
                      description="Écris à un membre."
                      action={
                        <Button size="sm" icon="plus" onClick={() => setNewOpen(true)}>
                          Nouveau message
                        </Button>
                      }
                    />
                  </Card>
                </div>
              )}
            </>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'clients' && (
        <div className="v2-pad">
          <div style={{ marginBottom: 12 }}>
            <SearchInput
              value={clientQuery}
              onChange={setClientQuery}
              placeholder="Rechercher un client ou une offre…"
            />
          </div>

          {contacts.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
            </Card>
          ) : contacts.error ? (
            <ErrorBlock message={contacts.error} onRetry={contacts.reload} />
          ) : clientContacts.length === 0 ? (
            <Card>
              <EmptyState
                icon="market"
                title="Aucun client Zando"
                description="Les discussions ouvertes depuis une offre apparaissent ici, avec le lien de l’élément."
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <List plain>
                {clientContacts.map((contact) => {
                  const label = peerLabel(contact.peer_id);
                  const item = linkedItemFor(contact);
                  return (
                    <div
                      key={contact.peer_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--v2-line)',
                      }}
                    >
                      <button
                        onClick={() => setProfilePeer(contact.peer_id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                          textAlign: 'left',
                          background: 'none',
                          border: 0,
                          padding: 0,
                          color: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <Avatar
                          label={initials(label)}
                          src={identityAvatar(
                            contact.peer_id,
                            peers[String(contact.peer_id || '').toUpperCase()],
                          )}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className="v2-row-title">{label}</div>
                          <div
                            className="v2-row-sub v2-clamp-1"
                            style={{ display: 'flex', gap: 6 }}
                          >
                            <Icon name="market" size={13} style={{ flex: 'none', marginTop: 2 }} />
                            <span className="v2-clamp-1">
                              {contact.zando_item_title || 'Élément Zando'}
                            </span>
                          </div>
                        </div>
                      </button>
                      <IconButton
                        name="chat"
                        label={`Écrire à ${label}`}
                        onClick={() => openDirect(contact.peer_id)}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="external"
                        disabled={!item || !onOpenItem}
                        onClick={() => {
                          if (item && onOpenItem) onOpenItem(item);
                        }}
                      >
                        Offre
                      </Button>
                    </div>
                  );
                })}
              </List>
            </Card>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'p2p' && (
        <div className="v2-pad">
          <P2PTab
            offers={p2p.data?.offers || []}
            loading={p2p.loading}
            error={p2p.error}
            onRetry={p2p.reload}
            onContact={openDirect}
            onProfile={(peer) => setProfilePeer(peer)}
          />

          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'groups' && (
        <div className="v2-pad">
          {groups.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
            </Card>
          ) : groups.error ? (
            <ErrorBlock message={groups.error} onRetry={groups.reload} />
          ) : (groups.data?.groups || []).length === 0 ? (
            <Card>
              <EmptyState
                icon="users"
                title="Aucun groupe"
                description="Échange à plusieurs."
                action={
                  <Button size="sm" icon="plus" onClick={() => setNewGroupOpen(true)}>
                    Créer un groupe
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <List plain>
                {(groups.data?.groups || []).map((group) => (
                  <Row
                    key={group.group_id}
                    avatar={{ label: initials(group.name) }}
                    title={group.name}
                    subtitle={`${group.member_count || 0} membres · ${group.visibility === 'private' ? 'privé' : 'public'}`}
                    right={
                      group.is_member ? (
                        <span className="v2-badge v2-badge--positive">{group.role || 'membre'}</span>
                      ) : (
                        <span className="v2-badge">rejoindre</span>
                      )
                    }
                    chevron
                    onClick={() => {
                      if (group.is_member) setThread({ kind: 'group', id: group.group_id, name: group.name });
                      else void toggleGroupMembership(group);
                    }}
                  />
                ))}
              </List>
            </Card>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'trends' && (
        <div className="v2-pad">
          <div className="v2-row-between" style={{ marginBottom: 8 }}>
            <div>
              <div className="v2-h3">Tendances</div>
              <div className="v2-muted" style={{ fontSize: 12 }}>
                Annonces, conférences et publications · 7 jours
              </div>
            </div>
            <span className="v2-badge">
              <Icon name="trendUp" size={12} /> En direct
            </span>
          </div>
          <PublicationsPanel
            compose
            emptyHint="Aucune tendance pour le moment. Publie une annonce ou une conférence."
          />
          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'news' && (
        <div className="v2-pad">
          {news.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
            </Card>
          ) : (news.data?.messages || []).length === 0 ? (
            <Card>
              <EmptyState
                icon="bell"
                title="Aucune annonce"
                description="Canaux trésorerie et réseau."
              />
            </Card>
          ) : (
            <div className="v2-stack">
              {(news.data?.messages || []).map((entry: SystemMessage, index) => (
                <Card key={`${entry.timestamp}-${index}`}>
                  <div className="v2-row-between">
                    <span className="v2-badge v2-badge--accent">{entry.type || 'info'}</span>
                    <span className="v2-muted" style={{ fontSize: 11.5 }}>
                      {relativeDay(entry.timestamp)} · {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{entry.content}</div>
                </Card>
              ))}
            </div>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {/* Nouveau message */}
      <Sheet
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setNewProfile(null);
          setNewError('');
        }}
        title="Nouvelle discussion"
        subtitle="Cherche un membre par son pseudo"
        footer={
          <Button
            block
            icon={newProfile ? 'chat' : 'search'}
            loading={newBusy}
            onClick={newProfile ? openNewChat : searchNewTarget}
          >
            {newProfile ? 'Ouvrir la discussion' : 'Rechercher le profil'}
          </Button>
        }
      >
        <div className="v2-stack">
          <Field label="Pseudo" hint="Exemple : uq@destin">
            <Input
              value={newTarget}
              onChange={(event) => {
                setNewTarget(event.target.value);
                setNewProfile(null);
                setNewError('');
              }}
              placeholder="destin"
              autoCapitalize="none"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                if (newProfile) openNewChat();
                else void searchNewTarget();
              }}
            />
          </Field>
          {newError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--v2-negative)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Icon name="alert" size={16} />
              {newError}
            </div>
          )}
          {newProfile && (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                label={String(newProfile.display || newProfile.pseudo || newTarget)}
                src={newProfile.avatar_url}
                size={48}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 750 }}>
                  {String(newProfile.pseudo || newTarget)}
                </div>
                <div className="v2-muted" style={{ fontSize: 12.5 }}>
                  {String(newProfile.name || 'Membre UQ')}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 4,
                    color: 'var(--v2-positive)',
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  <Icon name="check" size={13} />
                  Profil confirmé
                </div>
              </div>
            </Card>
          )}
        </div>
      </Sheet>

      {/* Nouveau groupe */}
      <Sheet
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        title="Créer un groupe"
        subtitle="Espace partagé pour ta communauté"
        footer={
          <Button block loading={busy} icon="users" onClick={submitGroup}>
            Créer le groupe
          </Button>
        }
      >
        <div className="v2-stack">
          <Field label="Nom du groupe">
            <Input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Ex. Tontine du quartier"
            />
          </Field>
          <Field label="Description" hint="Optionnel">
            <Textarea
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              rows={3}
              placeholder="À quoi sert ce groupe ?"
            />
          </Field>
          <Field label="Visibilité">
            <select
              className="v2-input"
              value={groupVisibility}
              onChange={(event) => setGroupVisibility(event.target.value)}
            >
              <option value="public">Public — visible par tous</option>
              <option value="private">Privé — sur invitation</option>
            </select>
          </Field>
        </div>
      </Sheet>

      {/* Contacts persistes */}
      <Sheet
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        title="Contacts"
        subtitle="Toute conversation ajoute son interlocuteur ici"
      >
        <div className="v2-stack">
          <SearchInput
            value={contactQuery}
            onChange={setContactQuery}
            placeholder="Rechercher un contact…"
          />

          {contacts.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={42} radius={14} />
              <Skeleton height={42} radius={14} />
            </Card>
          ) : contactList.length === 0 ? (
            <Card>
              <EmptyState
                icon="contact"
                title={contactQuery.trim() ? 'Aucun résultat' : 'Aucun contact'}
                description="Écris à un membre avec son identifiant UQ."
                action={
                  <Button
                    size="sm"
                    icon="plus"
                    onClick={() => {
                      setContactsOpen(false);
                      setNewOpen(true);
                    }}
                  >
                    Nouveau message
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <List plain>
                {contactList.map((entry) => {
                  const label = peerLabel(entry.peer_id);
                  return (
                    <Row
                      key={entry.peer_id}
                      avatar={{
                        label: initials(label),
                        src: identityAvatar(entry.peer_id, peers[String(entry.peer_id || '').toUpperCase()]),
                      }}
                      title={label}
                      subtitle={
                        entry.zando_item_title
                          ? `Client · ${entry.zando_item_title}`
                          : entry.blocked
                            ? 'Bloqué'
                            : entry.locked
                              ? 'Verrouillé'
                              : entry.muted
                                ? 'Silencieux'
                                : 'Contact'
                      }
                      right={
                        entry.muted || entry.blocked || entry.locked ? (
                          <span style={{ display: 'inline-flex', gap: 6, color: 'var(--v2-ink-3)' }}>
                            {entry.blocked && <Icon name="shield" size={14} />}
                            {entry.muted && <Icon name="bell" size={14} />}
                            {entry.locked && <Icon name="lock" size={14} />}
                          </span>
                        ) : undefined
                      }
                      chevron
                      onClick={() => {
                        setContactsOpen(false);
                        setProfilePeer(entry.peer_id);
                      }}
                    />
                  );
                })}
              </List>
            </Card>
          )}
        </div>
      </Sheet>

      <PinSheet
        open={Boolean(pinMode && pinPeer)}
        onClose={() => {
          setPinPeer(null);
          setPinMode(null);
        }}
        title={pinMode === 'lock' ? 'Verrouiller la discussion' : 'Déverrouiller la discussion'}
        subtitle="Confirme avec ton code PIN"
        length={pinLength}
        onSubmit={confirmPin}
      />

      <PublicProfileSheet
        pseudo={profilePeer || ''}
        onClose={() => setProfilePeer(null)}
        onContact={
          profilePeer
            ? () => {
                // La fiche rend le pseudo ; la discussion reste indexee par l'identifiant.
                const peer = profilePeer;
                setProfilePeer(null);
                setContactsOpen(false);
                openDirect(peer);
              }
            : undefined
        }
      />
    </>
  );
}

/* ============================ Canal P2P ============================ */

/**
 * Carnet d'ordres public : chaque annonce en ligne du marche P2P apparait ici
 * avec son prix, sa devise et l'appareil (operateur mobile money) associe.
 * Aucune duplication : la liste lit directement les offres ouvertes.
 */
function P2PTab({
  offers,
  loading,
  error,
  onRetry,
  onContact,
  onProfile,
}: {
  offers: P2POffer[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onContact: (uq: string) => void;
  onProfile: (uq: string) => void;
}) {
  return (
    <>
      <Card style={{ marginBottom: 10 }}>
        <div className="v2-row-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--v2-accent)' }}>
              <Icon name="market" size={18} />
            </span>
            <span style={{ fontWeight: 650, fontSize: 13.5 }}>Carnet d’ordres public</span>
          </div>
          <span className="v2-badge">{offers.length} annonces</span>
        </div>
        <div className="v2-muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
          Les annonces P2P en ligne s’affichent ici automatiquement : prix, appareil et ville.
        </div>
      </Card>

      {loading ? (
        <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton height={54} radius={14} />
          <Skeleton height={54} radius={14} />
        </Card>
      ) : error ? (
        <ErrorBlock message={error} onRetry={onRetry} />
      ) : offers.length === 0 ? (
        <Card>
          <EmptyState
            icon="market"
            title="Aucune annonce en ligne"
            description="Publie une annonce P2P dans Trading : elle apparaîtra ici comme une annonce publique."
          />
        </Card>
      ) : (
        <div className="v2-stack">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <div className="v2-row-between">
                <span
                  className={`v2-badge ${offer.side === 'sell' ? 'v2-badge--positive' : 'v2-badge--accent'}`}
                >
                  {offer.side === 'sell' ? 'Vente' : 'Achat'}
                </span>
                <span className="v2-muted" style={{ fontSize: 11.5 }}>
                  {relativeDay(offer.created_at)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 21, fontWeight: 750, letterSpacing: -0.4 }}>
                  {formatNumber(offer.rate, 2)}
                </span>
                <span className="v2-muted" style={{ fontSize: 12 }}>
                  {offer.currency} / BORB
                </span>
              </div>
              <div className="v2-muted" style={{ fontSize: 12, marginTop: 2 }}>
                {formatNumber(offer.min_amount, 0)} – {formatNumber(offer.max_amount, 0)}{' '}
                {offer.currency}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                <span className="v2-badge">
                  <Icon name="device" size={12} /> {offer.operator || 'Mobile money'}
                </span>
                {offer.city ? <span className="v2-badge">{offer.city}</span> : null}
              </div>

              <div className="v2-row-between" style={{ marginTop: 11 }}>
                <button
                  type="button"
                  onClick={() => onProfile(offer.uq)}
                  disabled={!offer.uq}
                  style={{
                    background: 'none',
                    border: 0,
                    padding: 0,
                    color: 'inherit',
                    cursor: offer.uq ? 'pointer' : 'default',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {offer.pseudo || 'Membre UQ'}
                </button>
                <Button
                  size="sm"
                  variant={offer.mine ? 'secondary' : 'primary'}
                  icon={offer.mine ? undefined : 'chat'}
                  disabled={offer.mine || !offer.uq}
                  onClick={() => onContact(offer.uq)}
                >
                  {offer.mine ? 'Mon annonce' : 'Contacter'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================ Actions de conversation ============================ */

function ConversationOptions({
  peer,
  label,
  contact,
  busy,
  onClose,
  onOpen,
  onProfile,
  onBlock,
  onMute,
  onLock,
  onEphemere,
  onVentes,
  onReport,
  onRemove,
}: {
  peer: string | null;
  label: string;
  contact?: ChatContact;
  busy: boolean;
  onClose: () => void;
  onOpen: () => void;
  onProfile: () => void;
  onBlock: () => void;
  onMute: () => void;
  onLock: () => void;
  /** Auto-destruction des messages que je envoie dans ce fil. */
  onEphemere: () => void;
  /** Ventes & commandes marketplace avec ce contact (séquestre UQ). */
  onVentes: () => void;
  /** Signalement a la moderation, comptable dans le score de confiance. */
  onReport: () => void;
  onRemove: () => void;
}) {
  return (
    <Sheet
      open={Boolean(peer)}
      onClose={onClose}
      title="Conversation"
      subtitle={label}
    >
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <List plain>
          <Row
            icon="chat"
            title="Ouvrir la discussion"
            onClick={onOpen}
            chevron
          />
          <Row
            icon="user"
            title="Voir le profil public"
            subtitle="Ses publications, vues, likes et réputation."
            onClick={onProfile}
            chevron
          />
          <Row
            icon="shield"
            iconTone={contact?.blocked ? 'accent' : 'neutral'}
            title={contact?.blocked ? 'Débloquer ce contact' : 'Bloquer ce contact'}
            subtitle={
              contact?.blocked
                ? 'Il pourra de nouveau t’écrire.'
                : 'Ses messages ne seront plus acceptés.'
            }
            onClick={busy ? undefined : onBlock}
            chevron
          />
          <Row
            icon="bell"
            iconTone={contact?.muted ? 'accent' : 'neutral'}
            title={contact?.muted ? 'Désactiver le mode silencieux' : 'Mode silencieux'}
            subtitle={contact?.muted ? 'La discussion est muette.' : 'Sans alerte pour cette discussion.'}
            onClick={busy ? undefined : onMute}
            chevron
          />
          <Row
            icon="lock"
            iconTone={contact?.locked ? 'accent' : 'neutral'}
            title={contact?.locked ? 'Déverrouiller la discussion' : 'Verrouiller la discussion'}
            subtitle={`Code PIN ${contact?.locked ? 'requis pour l’ouvrir' : 'demandé pour verrouiller'}.`}
            onClick={busy ? undefined : onLock}
            chevron
          />
          <Row
            icon="clock"
            iconTone={contact?.ephemere ? 'accent' : 'neutral'}
            title={contact?.ephemere ? 'Désactiver les messages éphémères' : 'Messages éphémères'}
            subtitle={
              contact?.ephemere
                ? 'Tes messages dans ce fil seront effacés après la durée annoncée.'
                : 'Efface automatiquement les messages que tu envoies dans ce fil.'
            }
            onClick={busy ? undefined : onEphemere}
            chevron
          />
          <Row
            icon="cart"
            iconTone="neutral"
            title="Ventes & commandes"
            subtitle="Transactions marketplace avec ce contact : séquestre, livraison, code jetable."
            onClick={busy ? undefined : onVentes}
            chevron
          />
          <Row
            icon="alert"
            iconTone="neutral"
            title="Signaler ce contact"
            subtitle="Un dossier ouvre la moderation ; un signalement confirmé baisse son score."
            onClick={busy ? undefined : onReport}
            chevron
          />
          <Row
            icon="trash"
            iconTone="accent"
            title="Supprimer le contact"
            subtitle="Ne sera plus ajouté automatiquement."
            onClick={busy ? undefined : onRemove}
            chevron
          />
        </List>
      </Card>
    </Sheet>
  );
}

/* ============================ Fil de discussion ============================ */

/**
 * Feuille de signalement. Les motifs sont ceux que le backend accepte
 * (chat_reports::MOTIFS) : un motif inconnu serait refuse a 400.
 */
function SignalementSheet({
  peer,
  label,
  motif,
  texte,
  busy,
  onMotif,
  onTexte,
  onSubmit,
  onClose,
}: {
  peer: string | null;
  label: string;
  motif: SignalementPayload['motif'];
  texte: string;
  busy: boolean;
  onMotif: (motif: SignalementPayload['motif']) => void;
  onTexte: (texte: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(peer)} onClose={onClose} title="Signaler ce compte" subtitle={label}>
      <div className="v2-stack">
        <div className="v2-muted" style={{ fontSize: 13 }}>
          La moderation ouvre un dossier. Un signalement confirmé retire des points au score de
          confiance du compte signalé ; répéter un faux signalement coûte des points à son auteur.
        </div>
        <div className="v2-field">
          <span className="v2-label">Motif</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOTIFS_SIGNALEMENT.map((entry) => (
              <Chip key={entry} active={motif === entry} onClick={() => onMotif(entry)}>
                {ETIQUETTES_MOTIF[entry]}
              </Chip>
            ))}
          </div>
        </div>
        <Field label="Précision (facultatif)">
          <Textarea
            value={texte}
            rows={3}
            maxLength={500}
            placeholder="Ce que tu as constaté, en quelques mots…"
            onChange={(event) => onTexte(event.target.value)}
          />
        </Field>
        <div style={{ display: 'grid', gap: 8 }}>
          <Button block icon="alert" loading={busy} onClick={onSubmit}>
            Envoyer le signalement
          </Button>
          <Button block variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Auteur d'un message de groupe : le pseudo, jamais le numero UQ. */
function AuthorName({ uq }: { uq: string }) {
  const identity = useIdentity(uq);
  return <>{identityLabel(uq, identity)}</>;
}

/** Redimensionne et compresse la photo avant stockage local. */
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 1280;
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Photo illisible');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Photo illisible'));
    };
    img.src = url;
  });
}

/* --------------------------------------------------------------------------
 * Pieces partagees par tous les fils : une bulle et la barre de saisie.
 * Un contact et UQ AI utilisent exactement le meme markup.
 * ------------------------------------------------------------------------ */

/**
 * Etats d'envoi réellement observables : le message attend son tour, est parti
 * au serveur, a été ouvert par le destinataire, ou n'est jamais parti. Aucun
 * « distribué » n'est affiche : le serveur ne le mesure pas.
 */
type EtatEnvoi = 'attente' | 'envoye' | 'lu' | 'echec';

const GLYPHE_ETAT: Record<EtatEnvoi, string> = {
  attente: '…',
  envoye: '✓',
  lu: '✓✓',
  echec: '!',
};

const LIBELLE_ETAT: Record<EtatEnvoi, string> = {
  attente: 'En attente d’envoi',
  envoye: 'Envoyé',
  lu: 'Lu',
  echec: 'Échec d’envoi',
};

function Bubble({
  mine,
  content,
  image,
  timestamp,
  etat,
  author,
  onImage,
}: {
  mine: boolean;
  content?: string;
  image?: string;
  timestamp: number;
  /** Accusé visible sur une bulle envoyée ; rien sur une bulle reçue. */
  etat?: EtatEnvoi;
  author?: ReactNode;
  onImage?: (source: string) => void;
}) {
  return (
    <div className="v2-bubble" data-mine={mine} data-image={Boolean(image)} data-etat={etat}>
      {!mine && author && <span className="v2-bubble-author">{author}</span>}
      {image ? (
        <img
          className="v2-bubble-image"
          src={image}
          alt="Photo"
          onClick={() => onImage?.(image)}
        />
      ) : null}
      {content ? <span className="v2-bubble-text">{content}</span> : null}
      {/* L'horodatage flotte a la fin de la derniere ligne : la bulle garde la
          largeur de son texte. */}
      <span className="v2-bubble-time">
        {formatTime(timestamp)}
        {mine && etat ? (
          <span className="v2-chat-ticks" data-etat={etat} title={LIBELLE_ETAT[etat]}>
            {GLYPHE_ETAT[etat]}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Barre de saisie d'un fil. La camera n'existe que pour les contacts :
 * on ne la passe pas quand `onPhotoFile` est absent.
 */
function Composer({
  value,
  onChange,
  onSend,
  busy,
  onPhotoFile,
}: {
  value: string;
  onChange: (saisie: string) => void;
  onSend: () => void;
  busy: boolean;
  onPhotoFile?: (fichier: File) => void;
}) {
  const champ = useRef<HTMLTextAreaElement | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);
  /* La barre se porte elle-meme au-dessus du clavier : un fil de contact et le
     fil UQ AI héritent de la meme reserve sans la declarer chacun. Sur les
     moteurs qui retrecissent la fenetre (Android), l'ecart reste a 0. */
  const insetClavier = useKeyboardInset();

  // La pastille suit la hauteur du brouillon jusqu'a trois lignes, puis le
  // texte deroule a l'interieur : le pouce reste sur une seule ligne.
  useEffect(() => {
    const zone = champ.current;
    if (!zone) return;
    zone.style.height = 'auto';
    zone.style.height = `${Math.min(zone.scrollHeight, 112)}px`;
  }, [value]);

  return (
    <div className="v2-composer" style={{ marginBottom: insetClavier }}>
      {onPhotoFile && (
        <>
          <button
            type="button"
            className="v2-icon-btn v2-icon-btn--plain"
            aria-label="Envoyer une photo"
            onClick={() => fichier.current?.click()}
            disabled={busy}
            style={{ flex: 'none' }}
          >
            <Icon name="camera" size={22} />
          </button>
          <input
            ref={fichier}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const choisi = event.target.files?.[0];
              if (choisi) onPhotoFile(choisi);
            }}
          />
        </>
      )}
      <textarea
        ref={champ}
        className="v2-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder="Écrire un message…"
        rows={1}
      />
      <button
        className="v2-btn v2-btn--primary"
        onClick={onSend}
        disabled={!value.trim() || busy}
        aria-label="Envoyer"
        style={{ width: 42, height: 42, padding: 0, borderRadius: 999, flex: 'none' }}
      >
        {busy ? <span className="v2-spinner" /> : <Icon name="send" size={19} />}
      </button>
    </div>
  );
}

/** Un echange avec l'assistant : meme forme qu'un message de conversation. */
type AiMessage = {
  id: string;
  mine: boolean;
  content: string;
  timestamp: number;
  suggestions?: string[];
  understoodAs?: string;
  /** `gemini` = reponse de la passerelle serveur, `local` = base integree au front. */
  source?: 'gemini' | 'local';
};

/** Le fil UQ AI reste sur l'appareil : rien n'est publie ni synchronise. */
const AI_HISTORY_MAX = 60;

function readAiThread(cle: string): AiMessage[] {
  try {
    const brut = localStorage.getItem(cle);
    const valeurs = brut ? (JSON.parse(brut) as AiMessage[]) : [];
    return Array.isArray(valeurs) ? valeurs.slice(-AI_HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function writeAiThread(cle: string, messages: AiMessage[]) {
  try {
    localStorage.setItem(cle, JSON.stringify(messages.slice(-AI_HISTORY_MAX)));
  } catch {
    /* Stockage sature ou navigation privee : le fil reste en memoire. */
  }
}

/** Cle du fil UQ AI : une historique par compte, comme la messagerie locale. */
function aiStorageKey(me: string) {
  return `${AI_STORAGE_PREFIX}${(me || 'anon').toUpperCase()}`;
}

/** Derniere echange du fil : sert d'apercu dans la liste des discussions. */
function aiPreview(me: string): AiMessage | null {
  const histoire = readAiThread(aiStorageKey(me));
  return histoire[histoire.length - 1] || null;
}

function AiThread({ me, onClose }: { me: string; onClose: () => void }) {
  const cle = aiStorageKey(me);
  const langue = useMemo<Lang>(() => detectLang(), []);
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    const histoire = readAiThread(cle);
    if (histoire.length) return histoire;
    const accueil = WELCOME_MESSAGES[langue];
    return [
      {
        id: 'accueil',
        mine: false,
        content: accueil.content,
        suggestions: accueil.suggestions,
        timestamp: Date.now(),
      },
    ];
  });
  const [draft, setDraft] = useState('');
  /** L'assistant cherche sa réponse : les trois points clignotent. */
  const [refletit, setRefletit] = useState(false);
  /** Réponse en cours d'écriture : identifiant de la bulle et longueur révélée. */
  const [flux, setFlux] = useState<{ id: string; jusqua: number } | null>(null);
  /**
   * D'où vient l'assistant pour ce fil : la passerelle serveur quand elle a
   * répondu, la base locale dès qu'elle a manqué. Connu seulement après le
   * premier appel, sinon l'en-tête reste neutre au lieu de mentir.
   */
  const [assistant, setAssistant] = useState<{ origine: 'connecte' | 'local'; modele?: string } | null>(
    () => {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const echange = messages[i];
        if (!echange.mine && echange.source) {
          return { origine: echange.source === 'gemini' ? 'connecte' : 'local' };
        }
      }
      return null;
    },
  );
  const minuteurs = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  /* La barre de saisie se porte elle-meme au-dessus du clavier : le fil n'a
     plus qu'a recoller sa vue sur la derniere bulle quand l'ecran retrecit. */
  const insetClavier = useKeyboardInset();

  const scrollToEnd = (smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    const liste = minuteurs.current;
    return () => liste.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (stickToBottom.current) requestAnimationFrame(() => scrollToEnd(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insetClavier]);

  useEffect(() => {
    if (stickToBottom.current) requestAnimationFrame(() => scrollToEnd(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, refletit, flux]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 120;
    setShowJump(distance > 160);
  };

  const jumpToEnd = () => {
    stickToBottom.current = true;
    setShowJump(false);
    scrollToEnd(true);
  };

  /** Ajoute la bulle de réponse puis la révèle mot à mot. */
  const afficher = (message: AiMessage) => {
    setMessages((prev) => [...prev, message]);

    const mots = message.content.match(/\S+\s*/g) || [message.content];
    const bornes: number[] = [];
    let total = 0;
    mots.forEach((mot) => {
      total += mot.length;
      bornes.push(total);
    });

    let etape = 0;
    setFlux({ id: message.id, jusqua: bornes[0] });

    const pas = () => {
      const attente = etape < 10 ? 42 + Math.random() * 36 : 12 + Math.random() * 14;
      const minuteur = window.setTimeout(() => {
        etape += 1;
        if (etape >= bornes.length) {
          setFlux(null);
          setMessages((prev) => {
            writeAiThread(cle, prev);
            return prev;
          });
          return;
        }
        setFlux({ id: message.id, jusqua: bornes[etape] });
        pas();
      }, attente);
      minuteurs.current.push(minuteur);
    };
    pas();
  };

  const envoyerTexte = (brut: string) => {
    const contenu = brut.trim();
    if (!contenu || refletit || flux) return;

    const question: AiMessage = {
      id: `q-${Date.now()}`,
      mine: true,
      content: contenu,
      timestamp: Date.now(),
    };
    /* Les derniers tours partent avec la question : la passerelle ne stocke
       rien, c'est le fil local qui porte la coherence. */
    const histoire: AiTour[] = messages
      .filter((echange) => echange.id !== 'accueil' && echange.content.trim())
      .slice(-10)
      .map((echange): AiTour => ({
        role: echange.mine ? 'user' : 'assistant',
        texte: echange.content,
      }));
    setMessages((prev) => {
      const suivant = [...prev, question];
      writeAiThread(cle, suivant);
      return suivant;
    });
    setDraft('');
    stickToBottom.current = true;
    saveToHistory(contenu, langue);
    setRefletit(true);

    const id = `r-${Date.now()}`;
    const repliLocal = () => {
      const pensif = window.setTimeout(() => {
        setRefletit(false);
        const reponse = composeAnswer(contenu, langue);
        const texte =
          reponse.content ||
          "Je n'ai pas de réponse fiable à cette question. Précise ce que tu cherches.";
        setAssistant({ origine: 'local' });
        afficher({
          id,
          mine: false,
          content: texte,
          suggestions: reponse.suggestions,
          understoodAs: reponse.understoodAs,
          source: 'local',
          timestamp: Date.now(),
        });
      }, 500 + Math.random() * 300);
      minuteurs.current.push(pensif);
    };

    void (async () => {
      try {
        const reponse = await askUqAi(contenu, histoire, langue);
        const texte = reponse?.disponible ? String(reponse.reponse || '').trim() : '';
        if (texte) {
          setRefletit(false);
          setAssistant({ origine: 'connecte', modele: reponse.modele });
          afficher({
            id,
            mine: false,
            content: texte,
            source: 'gemini',
            timestamp: Date.now(),
          });
          return;
        }
      } catch {
        /* Hors-ligne, quota ou cle absente : jamais de bulle vide, on répond
           avec la base de connaissances deja embarquee. */
      }
      repliLocal();
    })();
  };

  const occupe = refletit || Boolean(flux);
  const connecte = assistant?.origine === 'connecte';
  const etatAssistant = occupe
    ? 'écrit…'
    : assistant === null
      ? 'Assistant intelligent · réponses instantanées'
      : connecte
        ? `Assistant connecté${assistant.modele ? ' · ' + assistant.modele : ''}`
        : 'Assistant local · réponses sur cet appareil';
  const noteAssistant = connecte
    ? 'Réponses en ligne · vérifie les informations importantes'
    : 'Assistant local · vérifie les informations importantes';

  return (
    <div className="v2-chat-thread v2-chat-thread--cadre">
      <header className="v2-topbar v2-topbar--dense">
        <button
          className="v2-icon-btn v2-icon-btn--plain v2-icon-btn--sm"
          onClick={onClose}
          aria-label="Retour"
        >
          <Icon name="back" size={19} />
        </button>
        <Avatar size={34} label="UQ AI" icon="uqia" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="v2-topbar-title"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            UQ AI
          </div>
          <div className="v2-topbar-sub">{etatAssistant}</div>
        </div>
      </header>

      <div className="v2-chat-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="v2-thread">
          <div className="v2-chat-ephemeral">
            <Icon name="shield" size={13} />
            {noteAssistant}
          </div>
          {messages.map((message, index) => {
            const jour = relativeDay(message.timestamp);
            const precedent = index > 0 ? relativeDay(messages[index - 1].timestamp) : null;
            const enCours = flux?.id === message.id;
            const texte = enCours ? message.content.slice(0, flux?.jusqua) : message.content;
            return (
              <Fragment key={message.id}>
                {jour !== precedent && <div className="v2-chat-day">{jour}</div>}
                <Bubble
                  mine={message.mine}
                  content={texte}
                  timestamp={message.timestamp}
                  etat={message.mine ? 'envoye' : undefined}
                />
                {!message.mine && !enCours && message.understoodAs && (
                  <div className="v2-chat-note">
                    <Icon name="info" size={12} />
                    {message.understoodAs}
                  </div>
                )}
                {!message.mine && !enCours && Boolean(message.suggestions?.length) && (
                  <div className="v2-chat-suggestions">
                    {(message.suggestions || []).map((suggestion) => (
                      <Chip key={suggestion} onClick={() => envoyerTexte(suggestion)}>
                        {suggestion}
                      </Chip>
                    ))}
                  </div>
                )}
              </Fragment>
            );
          })}
          {refletit && (
            <div className="v2-bubble" data-mine="false">
              <span className="v2-chat-dots" aria-label="L'assistant réfléchit">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <div className="v2-chat-jump-slot">
          <button
            type="button"
            className="v2-chat-jump"
            aria-label="Aller au dernier message"
            onClick={jumpToEnd}
          >
            <Icon name="back" size={18} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => envoyerTexte(draft)}
        busy={occupe}
      />
    </div>
  );
}

function ChatThread({
  thread,
  me,
  contact,
  linkedItem,
  locked,
  presence,
  onUnlock,
  onProfile,
  onOptions,
  onOpenItem,
  onClose,
  onRefreshList,
  onPeerResolved,
}: {
  thread: Thread;
  me: string;
  contact?: ChatContact;
  linkedItem?: ZandoItem | null;
  locked: boolean;
  /** Activite mesuree par le serveur pour ce correspondant. */
  presence?: boolean;
  onUnlock: () => void;
  /** Fiche publique du correspondant. */
  onProfile?: () => void;
  onOptions?: () => void;
  onOpenItem?: (item: ZandoItem) => void;
  onClose: () => void;
  onRefreshList: () => void;
  /** Le serveur a resolu le pseudo du fil en numero UQ canonique. */
  onPeerResolved?: (peer: string) => void;
}) {
  const { toast } = useSession();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [photoView, setPhotoView] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** Tant que l'utilisateur reste en bas, les nouveaux messages suivent. */
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);
  /** Messages saisis pas encore acceptes par le serveur (file d'attente locale). */
  const [locaux, setLocaux] = useState<Record<string, MessageLocal>>({});

  const fil = useAsync<ChatThreadResponse>(
    async () => {
      if (thread.kind === 'group') {
        const result = await getGroupMessages(thread.id);
        return { messages: result?.messages || [] };
      }
      return (await getChatMessages(thread.id, me)) || {};
    },
    [thread.kind, thread.id, me],
    { enabled: Boolean(thread.id && me) && !locked },
  );

  usePolling(() => fil.reload(), 7000, !locked);

  useEffect(() => {
    // Une file locale n'appartient qu'a la discussion en cours : changer de fil
    // ne doit pas reporter un message reste sur l'ecran.
    setLocaux({});
    lastCount.current = 0;
  }, [thread.kind, thread.id]);

  useEffect(() => {
    // Un fil ouvert par pseudo n'a que le serveur pour le rattacher a son
    // numero canonique : reglages et signalement en ont besoin.
    if (fil.data?.peer) onPeerResolved?.(fil.data.peer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fil.data?.peer]);

  /* La barre de saisie se porte elle-meme au-dessus du clavier : le fil n'a
     plus qu'a recoller sa vue sur le dernier message quand l'ecran retrecit. */
  const insetClavier = useKeyboardInset();

  const scrollToEnd = (smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (stickToBottom.current) requestAnimationFrame(() => scrollToEnd(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insetClavier]);

  useEffect(() => {
    const count = (fil.data?.messages || []).length;
    if (!count) return;
    if (stickToBottom.current || lastCount.current === 0) {
      requestAnimationFrame(() => scrollToEnd(false));
    }
    lastCount.current = count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fil.data]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 120;
    setShowJump(distance > 160);
  };

  const jumpToEnd = () => {
    stickToBottom.current = true;
    setShowJump(false);
    scrollToEnd(true);
  };

  /**
   * Envoi reel. Le message est d'abord pose dans la file locale comme
   * « en attente », retire seulement quand le serveur l'a stocke ; s'il echoue,
   * il reste a l'ecran avec la raison renvoyee par le backend et sa seconde
   * chance. Aucun coche n'est affiche avant la reponse.
   */
  const envoyer = async (content: string, image?: string, cle = `local_${Date.now()}`) => {
    setLocaux((prev) => ({
      ...prev,
      [cle]: {
        cle,
        content,
        image,
        timestamp: Math.floor(Date.now() / 1000),
        enAttente: true,
      },
    }));
    try {
      if (thread.kind === 'group') {
        await sendGroupMessage(thread.id, content);
      } else {
        // Le lien Zando voyage avec chaque message pour rester rattache a l'offre.
        await sendChatMessage(
          me,
          thread.id,
          content,
          { id: contact?.zando_item_id, title: contact?.zando_item_title },
          image || null,
        );
      }
      setLocaux((prev) => {
        const reste = { ...prev };
        delete reste[cle];
        return reste;
      });
      stickToBottom.current = true;
      fil.reload();
      onRefreshList();
    } catch (error) {
      setLocaux((prev) => ({
        ...prev,
        [cle]: {
          ...prev[cle],
          enAttente: false,
          erreur: describeError(error, 'Envoi impossible.'),
        },
      }));
    }
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    try {
      await envoyer(content);
    } finally {
      setSending(false);
    }
  };

  const rejouer = async (item: MessageLocal) => {
    if (sending) return;
    setSending(true);
    try {
      await envoyer(item.content, item.image, item.cle);
    } finally {
      setSending(false);
    }
  };

  const sendPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Choisis une image', 'error');
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const dataUrl = await compressPhoto(file);
      if (dataUrl.length > 850_000) {
        toast('Photo trop lourde, essaie une autre', 'error');
        return;
      }
      const legende = draft.trim();
      setDraft('');
      await envoyer(legende, dataUrl);
    } catch (error) {
      toast(describeError(error, 'Envoi de la photo impossible.'), 'error');
    } finally {
      setSending(false);
    }
  };

  const peerIdentity = useIdentity(thread.kind === 'direct' ? thread.id : null);
  const title =
    thread.kind === 'group' ? thread.name : identityLabel(thread.id, peerIdentity);
  const blocked = thread.kind === 'direct' && Boolean(contact?.blocked);
  const hasOffer = thread.kind === 'direct' && Boolean(contact?.zando_item_id);
  const list = fil.data?.messages || [];
  /** Le mode ephemere est un reglage du lecteur, annonce par le serveur. */
  const ephemere = thread.kind === 'direct' && Boolean(contact?.ephemere);
  const ttlHeures = Math.max(1, Math.round(Number(fil.data?.ttl_seconds || 0) / 3600));
  const enAttente = Object.values(locaux);

  return (
    <div className="v2-chat-thread v2-chat-thread--cadre">
      <header className="v2-topbar v2-topbar--dense">
        <button
          className="v2-icon-btn v2-icon-btn--plain v2-icon-btn--sm"
          onClick={onClose}
          aria-label="Retour"
        >
          <Icon name="back" size={19} />
        </button>
        <Avatar
          size={34}
          label={initials(title)}
          src={thread.kind === 'direct' ? identityAvatar(thread.id, peerIdentity) : undefined}
          presence={presence}
        />
        <button
          type="button"
          onClick={onProfile}
          disabled={!onProfile}
          style={{
            minWidth: 0,
            flex: 1,
            textAlign: 'left',
            background: 'none',
            border: 0,
            padding: 0,
            color: 'inherit',
            cursor: onProfile ? 'pointer' : 'default',
          }}
        >
          <div
            className="v2-topbar-title"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {title}
          </div>
          <div className="v2-topbar-sub">
            {thread.kind === 'group'
              ? 'Discussion de groupe'
              : blocked
                ? 'Contact bloqué'
                : locked
                  ? 'Discussion verrouillée'
                  : [
                      presence ? 'En ligne' : null,
                      contact?.muted ? 'Mode silencieux' : null,
                      ephemere
                        ? `Éphémère · ${ttlHeures} h`
                        : 'Historique conservé',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
          </div>
        </button>
        <div className="v2-topbar-actions">
          {onProfile && (
            <IconButton compact name="user" label="Voir le profil public" onClick={onProfile} />
          )}
          {onOptions && (
            <IconButton compact name="more" label="Options de la conversation" onClick={onOptions} />
          )}
          <IconButton compact name="refresh" label="Actualiser" onClick={fil.reload} />
        </div>
      </header>

      {hasOffer && (
        <div className="v2-pad" style={{ paddingTop: 10 }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
              <Icon name="market" size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="v2-muted" style={{ fontSize: 11.5 }}>
                Offre Zando liée
              </div>
              <div
                style={{
                  fontWeight: 650,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {contact?.zando_item_title || 'Élément Zando'}
              </div>
            </div>
            {linkedItem && onOpenItem && (
              <Button
                size="sm"
                variant="secondary"
                icon="external"
                onClick={() => onOpenItem(linkedItem)}
              >
                Voir
              </Button>
            )}
          </Card>
        </div>
      )}

      {locked ? (
        <div className="v2-chat-scroll">
          <div className="v2-pad" style={{ paddingTop: 12 }}>
            <Card>
              <EmptyState
                icon="lock"
                title="Discussion verrouillée"
                description="Entre ton code PIN pour ouvrir cette conversation."
                action={
                  <Button size="sm" icon="lock" onClick={onUnlock}>
                    Déverrouiller
                  </Button>
                }
              />
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="v2-chat-scroll" ref={scrollRef} onScroll={handleScroll}>
            {fil.loading && !fil.data ? (
              <div className="v2-pad" style={{ paddingTop: 12 }}>
                <div className="v2-stack">
                  <Skeleton height={46} width="70%" radius={16} />
                  <Skeleton height={46} width="55%" radius={16} />
                  <Skeleton height={46} width="64%" radius={16} />
                </div>
              </div>
            ) : fil.error && !fil.data ? (
              <div className="v2-pad" style={{ paddingTop: 12 }}>
                <ErrorBlock message={fil.error} onRetry={fil.reload} />
              </div>
            ) : list.length === 0 && enAttente.length === 0 ? (
              <div className="v2-pad" style={{ paddingTop: 12 }}>
                <Card>
                  <EmptyState
                    icon="chat"
                    title="Aucun message"
                    description={
                      ephemere
                        ? `Écris le premier message. Il sera supprimé ${ttlHeures} h après l’envoi.`
                        : 'Écris le premier message. Il reste enregistré tant que la discussion existe.'
                    }
                  />
                </Card>
              </div>
            ) : (
              <div className="v2-thread">
                {ephemere && (
                  <div className="v2-chat-ephemeral">
                    <Icon name="clock" size={13} />
                    Messages éphémères · supprimés {ttlHeures} h après l’envoi
                  </div>
                )}
                {list.map((message, index) => {
                  const mine = isMine(message, me);
                  const day = relativeDay(message.timestamp);
                  const previous = index > 0 ? relativeDay(list[index - 1].timestamp) : null;
                  return (
                    <Fragment key={`${message.id ?? index}-${message.timestamp}`}>
                      {day !== previous && <div className="v2-chat-day">{day}</div>}
                      <Bubble
                        mine={mine}
                        content={message.content}
                        image={message.image ? String(message.image) : undefined}
                        timestamp={message.timestamp}
                        etat={mine ? (message.delivered ? 'lu' : 'envoye') : undefined}
                        author={
                          thread.kind === 'group' && messageAuthor(message) ? (
                            <AuthorName uq={messageAuthor(message)} />
                          ) : undefined
                        }
                        onImage={setPhotoView}
                      />
                    </Fragment>
                  );
                })}
                {enAttente
                  .slice()
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((item) => (
                    <Fragment key={item.cle}>
                      <Bubble
                        mine
                        content={item.content}
                        image={item.image}
                        timestamp={item.timestamp}
                        etat={item.enAttente ? 'attente' : 'echec'}
                      />
                      {!item.enAttente && (
                        <button
                          type="button"
                          className="v2-chat-retry"
                          title={item.erreur}
                          onClick={() => void rejouer(item)}
                        >
                          {item.erreur || 'Envoi impossible'} · Réessayer
                        </button>
                      )}
                    </Fragment>
                  ))}
              </div>
            )}
          </div>

          {showJump && (
            <div className="v2-chat-jump-slot">
              <button
                type="button"
                className="v2-chat-jump"
                aria-label="Aller au dernier message"
                onClick={jumpToEnd}
              >
                <Icon name="back" size={18} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          )}

          {blocked ? (
            <div className="v2-composer">
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="shield" size={18} style={{ color: 'var(--v2-ink-3)' }} />
                <span className="v2-muted" style={{ fontSize: 13 }}>
                  Contact bloqué — impossible d’envoyer un message.
                </span>
              </div>
              {onOptions && (
                <Button size="sm" variant="secondary" onClick={onOptions}>
                  Gérer
                </Button>
              )}
            </div>
          ) : (
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send()}
              busy={sending}
              onPhotoFile={thread.kind === 'direct' ? (file) => void sendPhoto(file) : undefined}
            />
          )}
        </>
      )}

      {photoView && (
        <div className="v2-photo-view" role="presentation" onClick={() => setPhotoView(null)}>
          <img src={photoView} alt="Photo" />
        </div>
      )}
    </div>
  );
}
