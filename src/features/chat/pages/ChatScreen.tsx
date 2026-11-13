// UQ Chat — style Telegram (lite), routes backend réelles

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CirclePlus,
  LogOut,
  Lock,
  Megaphone,
  MessageSquareText,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import api from '../../../api/client';
import { useLanguage } from '../../../i18n/LanguageContext';
import { PublicUserIdentity } from '../../../components/ui/PublicUserIdentity';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';

interface Conversation {
  peer_id: string;
  last_message: string;
  timestamp: number;
  unread?: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  recipient?: string;
  content: string;
  timestamp: number;
}

interface ChatGroup {
  group_id: string;
  name: string;
  type: 'group' | 'channel';
  visibility: 'public' | 'private';
  description: string;
  created_by: string;
  member_count: number;
  role: 'admin' | 'member' | null;
  is_member: boolean;
}

interface SystemAnnouncement {
  id: number | string;
  profile_code: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  created_at: number;
}

interface Props {
  onBack: () => void;
}

export default function ChatScreen({ onBack }: Props) {
  const { language, t } = useLanguage();
  const me = localStorage.getItem('uq_number') || '';
  const myPseudo = localStorage.getItem('uq_pseudo') || me;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [activeSystemFeed, setActiveSystemFeed] = useState(false);
  const [activeSection, setActiveSection] = useState<'messages' | 'groups' | 'news'>('messages');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [newPeer, setNewPeer] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState<'group' | 'channel'>('group');
  const [groupVisibility, setGroupVisibility] = useState<'public' | 'private'>('public');
  const [inviteMember, setInviteMember] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState('');
  const [newsFilter, setNewsFilter] = useState<'all' | 'p2p' | 'alerts' | 'info'>('all');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [e2e, setE2e] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!me) {
      setLoadingInbox(false);
      return;
    }
    try {
      const [inboxR, statusR] = await Promise.all([
        api.get(`/api/chat/inbox/${encodeURIComponent(me)}`),
        api.get('/api/chat/status'),
      ]);
      setRequestError('');
      setConversations(inboxR.data.conversations || []);
      setE2e(statusR.data?.encryption === 'e2e');
    } catch {
      setRequestError(t('chat.loadError'));
    } finally {
      setLoadingInbox(false);
    }
  }, [me, t]);

  const loadGroups = useCallback(async () => {
    if (!me) return;
    try {
      const response = await api.get(`/api/chat/groups/${encodeURIComponent(me)}`);
      setGroups(response.data.groups || []);
    } catch {
      setRequestError(t('chat.loadError'));
    }
  }, [me, t]);

  const loadThread = useCallback(async (peer: string) => {
    if (!me || !peer) return;
    try {
      const r = await api.get(
        `/api/chat/messages/${encodeURIComponent(peer)}?me=${encodeURIComponent(me)}`
      );
      setRequestError('');
      setMessages(r.data.messages || []);
    } catch {
      setRequestError(t('chat.loadError'));
    }
  }, [me, t]);

  const loadGroupMessages = useCallback(async (groupId: string) => {
    try {
      const response = await api.get(`/api/chat/groups/${encodeURIComponent(groupId)}/messages`);
      setMessages(response.data.messages || []);
      setRequestError('');
    } catch {
      setRequestError(t('chat.loadError'));
    }
  }, [t]);

  const loadSystemFeed = useCallback(async () => {
    try {
      const response = await api.get('/api/treasury/system/messages');
      setAnnouncements(response.data.messages || []);
      setRequestError('');
    } catch {
      setRequestError(t('chat.loadError'));
    }
  }, [t]);

  useEffect(() => {
    loadInbox();
    loadGroups();
    const pending = sessionStorage.getItem('uq_chat_peer');
    if (pending) {
      setActivePeer(pending);
      setMobileShowThread(true);
      sessionStorage.removeItem('uq_chat_peer');
    }
  }, [loadInbox, loadGroups]);

  useEffect(() => {
    if (activePeer) {
      loadThread(activePeer);
      const timer = setInterval(() => loadThread(activePeer), 4000);
      return () => clearInterval(timer);
    }
    if (activeGroup?.is_member) {
      loadGroupMessages(activeGroup.group_id);
      const timer = setInterval(() => loadGroupMessages(activeGroup.group_id), 5000);
      return () => clearInterval(timer);
    }
    return;
  }, [activePeer, activeGroup, loadGroupMessages, loadThread]);

  useEffect(() => {
    if (activeSystemFeed) loadSystemFeed();
  }, [activeSystemFeed, loadSystemFeed]);

  useEffect(() => {
    if (activeSystemFeed) {
      const timer = setInterval(() => loadSystemFeed(), 30000);
      return () => clearInterval(timer);
    }
    return;
  }, [activeSystemFeed, loadSystemFeed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConvos = conversations.filter((c) =>
    c.peer_id.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
    || group.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (newsFilter === 'p2p') return /p2p|trading/i.test(announcement.profile_code);
    if (newsFilter === 'alerts') return /alerte|alert/i.test(`${announcement.profile_code} ${announcement.type}`);
    if (newsFilter === 'info') return /info|guide|ia|marche/i.test(announcement.profile_code);
    return true;
  });

  const groupCanPost = !activeGroup || activeGroup.type !== 'channel' || activeGroup.role === 'admin';
  const isDirectChatEncrypted = e2e && Boolean(activePeer) && !activeGroup && !activeSystemFeed;

  const openPeer = (peer: string) => {
    setActivePeer(peer);
    setActiveGroup(null);
    setActiveSystemFeed(false);
    setActiveSection('messages');
    setMobileShowThread(true);
  };

  const openGroup = (group: ChatGroup) => {
    if (!group.is_member) return;
    setActivePeer(null);
    setActiveGroup(group);
    setActiveSystemFeed(false);
    setActiveSection('groups');
    setMobileShowThread(true);
  };

  const openSystemFeed = () => {
    setActivePeer(null);
    setActiveGroup(null);
    setActiveSystemFeed(true);
    setActiveSection('news');
    setMobileShowThread(true);
  };

  const joinGroup = async (group: ChatGroup) => {
    setJoiningGroup(group.group_id);
    setRequestError('');
    try {
      await api.post(`/api/chat/groups/${encodeURIComponent(group.group_id)}/join`);
      const joinedGroup = { ...group, is_member: true, role: 'member' as const, member_count: group.member_count + 1 };
      setGroups((current) => current.map((item) => item.group_id === group.group_id ? joinedGroup : item));
      openGroup(joinedGroup);
    } catch (error: any) {
      setRequestError(error.response?.data?.message || t('chat.groupActionError'));
    } finally {
      setJoiningGroup('');
    }
  };

  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name || savingGroup) return;
    setSavingGroup(true);
    setRequestError('');
    try {
      const response = await api.post('/api/chat/groups', {
        name,
        description: groupDescription.trim(),
        type: groupType,
        visibility: groupVisibility,
      });
      const group = response.data.group as ChatGroup;
      setGroups((current) => [group, ...current.filter((item) => item.group_id !== group.group_id)]);
      setGroupName('');
      setGroupDescription('');
      setShowGroupForm(false);
      openGroup(group);
    } catch (error: any) {
      setRequestError(error.response?.data?.message || t('chat.createGroupError'));
    } finally {
      setSavingGroup(false);
    }
  };

  const leaveGroup = async () => {
    if (!activeGroup) return;
    setRequestError('');
    try {
      await api.post(`/api/chat/groups/${encodeURIComponent(activeGroup.group_id)}/leave`);
      setGroups((current) => current.filter((group) => group.group_id !== activeGroup.group_id));
      setActiveGroup(null);
      setMessages([]);
      setMobileShowThread(false);
      await loadGroups();
    } catch (error: any) {
      setRequestError(error.response?.data?.message || t('chat.groupActionError'));
    }
  };

  const deleteGroup = async () => {
    if (!activeGroup || !window.confirm(t('chat.confirmDeleteGroup'))) return;
    setDeletingGroup(true);
    setRequestError('');
    try {
      await api.delete(`/api/chat/groups/${encodeURIComponent(activeGroup.group_id)}`);
      setGroups((current) => current.filter((group) => group.group_id !== activeGroup.group_id));
      setActiveGroup(null);
      setMessages([]);
      setMobileShowThread(false);
    } catch {
      setRequestError(t('chat.deleteGroupError'));
    } finally {
      setDeletingGroup(false);
    }
  };

  const inviteToGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeGroup || !inviteMember.trim()) return;
    setRequestError('');
    try {
      await api.post(`/api/chat/groups/${encodeURIComponent(activeGroup.group_id)}/members`, {
        member_id: inviteMember.trim(),
      });
      setInviteMember('');
      await loadGroups();
    } catch (error: any) {
      setRequestError(error.response?.data?.message || t('chat.groupActionError'));
    }
  };

  const startNewChat = () => {
    const p = newPeer.trim();
    if (!p) return;
    setActivePeer(p);
    setActiveGroup(null);
    setActiveSystemFeed(false);
    setActiveSection('messages');
    setNewPeer('');
    setMobileShowThread(true);
    if (!conversations.find((c) => c.peer_id === p)) {
      setConversations((prev) => [
        { peer_id: p, last_message: '', timestamp: Math.floor(Date.now() / 1000) },
        ...prev,
      ]);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || (!activePeer && !activeGroup) || !me || sending) return;
    setSending(true);
    setRequestError('');
    setDraft('');
    try {
      if (activeGroup) {
        await api.post(`/api/chat/groups/${encodeURIComponent(activeGroup.group_id)}/messages`, {
          content: text,
        });
        await loadGroupMessages(activeGroup.group_id);
        await loadGroups();
      } else if (activePeer) {
        await api.post('/api/chat/send', {
          sender: me,
          recipient: activePeer,
          content: text,
        });
        await loadThread(activePeer);
        await loadInbox();
      }
    } catch {
      setDraft(text);
      setRequestError(t('chat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString(language, {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="uq-screen uq-screen--fixed uq-spatial-background min-h-0">
      <ScreenHeader
        className="z-10"
        onBack={onBack}
        backLabel={t('chat.back')}
        icon={
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.08] text-sky-200">
            <MessageSquareText size={19} />
          </div>
        }
        title={t('chat.title')}
        subtitle={
          <span className="flex items-center gap-1.5">
            {isDirectChatEncrypted && <Lock size={11} className="shrink-0 text-emerald-300" />}
            <span className="truncate">{myPseudo || me}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{t(isDirectChatEncrypted ? 'chat.encrypted' : 'chat.online')}</span>
          </span>
        }
      />

      {requestError && (
        <div role="alert" className="z-10 shrink-0 border-b border-rose-400/15 bg-rose-400/[0.08] px-4 py-2.5 text-sm text-rose-200">
          {requestError}
        </div>
      )}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-3 p-2 sm:gap-4 sm:p-4">
        <aside
          className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1018] ${
            mobileShowThread ? 'hidden md:flex' : 'flex w-full md:w-[19rem] md:shrink-0 lg:w-[21rem]'
          }`}
        >
          <div className="border-b border-white/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/75">
                  {t('chat.brand')}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  {t('chat.title')}
                </h2>
              </div>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs font-medium tabular-nums text-slate-400">
                {activeSection === 'messages' ? conversations.length : activeSection === 'groups' ? groups.length : announcements.length}
              </span>
            </div>
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('chat.search')}
                aria-label={t('chat.search')}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#080C12] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/10"
              />
            </label>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-[#080C12] p-1">
              {([
                ['messages', t('chat.messagesTab')],
                ['groups', t('chat.groupsTab')],
                ['news', t('chat.newsTab')],
              ] as const).map(([section, label]) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => {
                    setActiveSection(section);
                    setSearch('');
                    if (section === 'news') openSystemFeed();
                    else {
                      setActiveSystemFeed(false);
                      setActiveGroup(null);
                      setActivePeer(null);
                      setMobileShowThread(false);
                    }
                  }}
                  aria-pressed={activeSection === section}
                  className={`rounded-lg px-1 py-2 text-[10px] font-semibold transition ${
                    activeSection === section
                      ? 'bg-[#172330] text-sky-100'
                      : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeSection === 'messages' && (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  startNewChat();
                }}
              >
                <input
                  value={newPeer}
                  onChange={(e) => setNewPeer(e.target.value)}
                  placeholder={t('chat.newPeer')}
                  aria-label={t('chat.newPeer')}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#080C12] px-3 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/10"
                />
                <button
                  type="submit"
                  disabled={!newPeer.trim()}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-300/20 bg-sky-300/[0.1] px-3 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/[0.16] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <CirclePlus size={15} />
                  {t('chat.new')}
                </button>
              </form>
            )}

            {activeSection === 'groups' && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupForm((visible) => !visible)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/[0.09] text-xs font-semibold text-sky-100 transition hover:bg-sky-300/[0.15]"
                >
                  <CirclePlus size={15} />
                  {t('chat.createGroup')}
                </button>
                {showGroupForm && (
                  <form onSubmit={createGroup} className="mt-2 space-y-2 rounded-xl border border-white/[0.07] bg-[#080C12] p-3">
                    <label className="block text-[11px] font-medium text-slate-300">
                      {t('chat.groupName')}
                      <input
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        maxLength={64}
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0D121B] px-3 text-sm text-white outline-none focus:border-sky-300/40"
                      />
                    </label>
                    <label className="block text-[11px] font-medium text-slate-300">
                      {t('chat.groupDescription')}
                      <textarea
                        value={groupDescription}
                        onChange={(event) => setGroupDescription(event.target.value)}
                        maxLength={280}
                        rows={2}
                        className="mt-1 w-full resize-y rounded-lg border border-white/[0.08] bg-[#0D121B] px-3 py-2 text-sm text-white outline-none focus:border-sky-300/40"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] font-medium text-slate-300">
                        {t('chat.groupType')}
                        <select
                          value={groupType}
                          onChange={(event) => setGroupType(event.target.value as 'group' | 'channel')}
                          className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0D121B] px-2 text-xs text-white"
                        >
                          <option value="group">{t('chat.group')}</option>
                          <option value="channel">{t('chat.channel')}</option>
                        </select>
                      </label>
                      <label className="text-[11px] font-medium text-slate-300">
                        {t('chat.access')}
                        <select
                          value={groupVisibility}
                          onChange={(event) => setGroupVisibility(event.target.value as 'public' | 'private')}
                          className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0D121B] px-2 text-xs text-white"
                        >
                          <option value="public">{t('chat.public')}</option>
                          <option value="private">{t('chat.private')}</option>
                        </select>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={!groupName.trim() || savingGroup}
                      className="h-10 w-full rounded-lg bg-sky-300 text-xs font-bold text-[#07111A] transition hover:bg-sky-200 disabled:opacity-50"
                    >
                      {savingGroup ? t('chat.creating') : t('chat.create')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {activeSection === 'messages' && loadingInbox ? (
              <p className="px-3 py-5 text-sm text-slate-400">{t('chat.loading')}</p>
            ) : activeSection === 'messages' && filteredConvos.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <MessageSquareText className="mx-auto mb-3 text-slate-600" size={24} />
                <p className="text-sm text-slate-400">{t('chat.emptyInbox')}</p>
              </div>
            ) : activeSection === 'messages' ? (
              <div className="space-y-1">
                {filteredConvos.map((conversation) => {
                  const active = conversation.peer_id === activePeer;
                  return (
                    <button
                      key={conversation.peer_id}
                      type="button"
                      onClick={() => openPeer(conversation.peer_id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-sky-300/15 bg-sky-300/[0.08]'
                          : 'border-transparent hover:border-white/[0.05] hover:bg-white/[0.035]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <PublicUserIdentity userId={conversation.peer_id} size="sm" className="flex-1" />
                          {conversation.timestamp > 0 && (
                            <time className="shrink-0 text-[10px] text-slate-500">
                              {formatTime(conversation.timestamp)}
                            </time>
                          )}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-400">
                            {conversation.last_message || '—'}
                          </span>
                          {conversation.unread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-300" aria-label={t('chat.unread')} />
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : activeSection === 'groups' ? (
              filteredGroups.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Users className="mx-auto mb-3 text-slate-600" size={23} />
                  <p className="text-sm text-slate-400">{t('chat.noGroups')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredGroups.map((group) => {
                    const active = activeGroup?.group_id === group.group_id;
                    const GroupIcon = group.type === 'channel' ? Radio : Users;
                    return (
                      <div
                        key={group.group_id}
                        className={`rounded-xl border px-3 py-3 ${
                          active ? 'border-sky-300/15 bg-sky-300/[0.08]' : 'border-transparent hover:border-white/[0.05]'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!group.is_member}
                          onClick={() => openGroup(group)}
                          className="flex w-full items-center gap-3 text-left disabled:cursor-default"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-300/15 bg-orange-300/[0.06] text-orange-200">
                            <GroupIcon size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-slate-100">{group.name}</span>
                              <span className="shrink-0 text-[9px] uppercase tracking-wide text-slate-500">
                                {group.visibility === 'private' ? t('chat.private') : group.type === 'channel' ? t('chat.channel') : t('chat.public')}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-400">
                              {group.description || `${group.member_count} ${t('chat.members')}`}
                            </span>
                          </span>
                        </button>
                        {!group.is_member && group.visibility === 'public' && (
                          <button
                            type="button"
                            onClick={() => joinGroup(group)}
                            disabled={joiningGroup === group.group_id}
                            className="mt-2 ml-14 rounded-lg border border-sky-300/15 px-3 py-1.5 text-[10px] font-semibold text-sky-100 hover:bg-sky-300/[0.08] disabled:opacity-50"
                          >
                            {joiningGroup === group.group_id ? t('chat.joining') : t('chat.join')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={openSystemFeed}
                className="flex w-full items-center gap-3 rounded-xl border border-sky-300/15 bg-sky-300/[0.07] px-3 py-3 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.08] text-sky-200">
                  <Megaphone size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{t('chat.systemNews')}</span>
                  <span className="mt-1 block text-xs text-slate-400">{t('chat.systemNewsSubtitle')}</span>
                </span>
              </button>
            )}
          </div>
        </aside>

        <section
          aria-label={activeGroup?.name || activePeer || t('chat.title')}
          className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090D13] ${
            !mobileShowThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeSystemFeed ? (
            <>
              <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0B1018] px-3 sm:px-5">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-white/[0.05] md:hidden"
                  onClick={() => setMobileShowThread(false)}
                  aria-label={t('chat.back')}
                >
                  <ArrowLeft size={17} />
                </button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.08] text-sky-200">
                  <Megaphone size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{t('chat.systemNews')}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{t('chat.officialAnnouncements')}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-300/10 bg-sky-300/[0.04] px-2 py-1.5 text-[10px] text-sky-100/75">
                  <Radio size={12} />
                  {t('chat.systemChannel')}
                </span>
              </div>
              <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.05] px-3 py-2 sm:px-5">
                {([
                  ['all', t('chat.all')],
                  ['p2p', t('chat.p2p')],
                  ['alerts', t('chat.alerts')],
                  ['info', t('chat.info')],
                ] as const).map(([filter, label]) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setNewsFilter(filter)}
                    aria-pressed={newsFilter === filter}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                      newsFilter === filter
                        ? 'bg-sky-300/[0.1] text-sky-100'
                        : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-3">
                  <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-3 py-2.5 text-xs leading-5 text-amber-100/70">
                    {t('chat.announcementsSource')}
                  </div>
                  {filteredAnnouncements.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">
                      {announcements.length === 0
                        ? t('chat.noSystemNews')
                          : t('chat.noCategoryNews')}
                    </p>
                  ) : filteredAnnouncements.map((announcement) => (
                    <article
                      key={announcement.id}
                      className="rounded-xl border border-white/[0.07] bg-[#0D121B] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${
                          /alerte|alert/i.test(`${announcement.profile_code} ${announcement.type}`)
                            ? 'border-orange-300/15 bg-orange-300/[0.05] text-orange-200'
                            : /trading|p2p/i.test(announcement.profile_code)
                              ? 'border-sky-300/15 bg-sky-300/[0.05] text-sky-200'
                              : 'border-white/[0.08] bg-white/[0.03] text-slate-300'
                        }`}>
                          {announcement.profile_code.replace(/^uq_/, '').replace(/_/g, ' ')}
                        </span>
                        <time className="text-[10px] text-slate-500">
                          {new Date(announcement.created_at * 1000).toLocaleString(language, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </time>
                      </div>
                      <h2 className="mt-3 text-sm font-semibold text-white">{announcement.title}</h2>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                        {announcement.content}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : !activePeer && !activeGroup ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-xs">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/10 bg-sky-300/[0.06] text-sky-200/80">
                  <MessageSquareText size={27} />
                </div>
                <h2 className="text-base font-semibold text-white">{t('chat.title')}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{t('chat.selectThread')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0B1018] px-3 sm:px-5">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-white/[0.05] md:hidden"
                  onClick={() => setMobileShowThread(false)}
                  aria-label={t('chat.back')}
                >
                  <ArrowLeft size={17} />
                </button>
                {activePeer ? (
                  <PublicUserIdentity userId={activePeer} size="sm" compact />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.08] text-xs font-semibold text-sky-100">
                    {activeGroup?.type === 'channel' ? <Radio size={17} /> : <Users size={17} />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {!activePeer && <p className="truncate text-sm font-semibold text-white">{activeGroup?.name}</p>}
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    {activeGroup
                      ? `${activeGroup.member_count} ${t('chat.members')} · ${activeGroup.visibility === 'public' ? t('chat.public') : t('chat.private')}`
                      : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{t('chat.online')}</>}
                  </p>
                </div>
                {activeGroup?.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={deleteGroup}
                    disabled={deletingGroup}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-300/10 text-rose-200/70 transition hover:border-rose-300/20 hover:bg-rose-300/[0.05] hover:text-rose-200 disabled:opacity-50"
                    aria-label={t('chat.deleteGroup')}
                    title={t('chat.deleteGroup')}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : activeGroup ? (
                  <button
                    type="button"
                    onClick={leaveGroup}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:border-rose-300/20 hover:bg-rose-300/[0.05] hover:text-rose-200"
                    aria-label={t('chat.leaveGroup')}
                    title={t('chat.leaveGroup')}
                  >
                    <LogOut size={16} />
                  </button>
                ) : e2e && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300/10 bg-emerald-300/[0.05] px-2.5 py-1.5 text-[10px] font-medium text-emerald-200/80">
                    <ShieldCheck size={13} />
                    <span className="hidden sm:inline">{t('chat.encrypted')}</span>
                  </span>
                )}
              </div>

              {activeGroup?.role === 'admin' && (
                <form
                  onSubmit={inviteToGroup}
                  className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#090D13] px-3 py-2 sm:px-5"
                >
                  <UserPlus size={15} className="shrink-0 text-slate-500" />
                  <input
                    value={inviteMember}
                    onChange={(event) => setInviteMember(event.target.value)}
                    aria-label={t('chat.memberId')}
                    placeholder={t('chat.inviteMember')}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-[#080C12] px-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-300/30"
                  />
                  <button
                    type="submit"
                    disabled={!inviteMember.trim()}
                    className="h-9 rounded-lg border border-sky-300/15 px-3 text-[11px] font-semibold text-sky-100 hover:bg-sky-300/[0.07] disabled:opacity-45"
                  >
                    {t('chat.invite')}
                  </button>
                </form>
              )}

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5 sm:px-6">
                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-3">
                  {messages.length === 0 && (
                    <div className="my-auto py-10 text-center">
                      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500">
                        <MessageSquareText size={20} />
                      </span>
                      <p className="text-sm text-slate-400">{t('chat.start')}</p>
                      {e2e && !activeGroup && (
                        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-200/65">
                          <Lock size={11} />
                          {t('chat.encrypted')}
                        </p>
                      )}
                    </div>
                  )}
                  {messages.map((message) => {
                    const mine = message.sender === me;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[88%] rounded-2xl border px-4 py-2.5 sm:max-w-[72%] ${
                          mine
                            ? 'rounded-br-md border-sky-300/15 bg-[#12304A] text-white'
                            : 'rounded-bl-md border-white/[0.07] bg-[#111823] text-slate-100'
                        }`}>
                          {activeGroup && (
                            <PublicUserIdentity
                              userId={message.sender}
                              size="sm"
                              compact
                              className="mb-1.5"
                            />
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                          <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            mine ? 'text-sky-100/55' : 'text-slate-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {mine && <Check size={12} />}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </div>

              {groupCanPost ? <form
                className="shrink-0 border-t border-white/[0.06] bg-[#0B1018] p-3 sm:px-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-white/[0.08] bg-[#080C12] p-1.5 pl-3 transition focus-within:border-sky-300/30">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder={t('chat.message')}
                    aria-label={t('chat.message')}
                    className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || (!activePeer && !activeGroup)}
                    aria-label={t('chat.send')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-300 text-[#07111A] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form> : (
                <div className="shrink-0 border-t border-white/[0.06] bg-[#0B1018] px-4 py-4 text-center text-xs text-slate-400">
                  Seuls les administrateurs peuvent publier dans ce canal.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
