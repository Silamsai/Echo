import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Radio, X, Home, Building2, Users, Hash, Compass, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useWorkspaceStore from '../store/workspaceStore';
import axiosInstance from '../utils/axiosInstance';
import ConversationItem from './ConversationItem';
import toast from 'react-hot-toast';
import WorkspaceModal from './WorkspaceModal';

const Sidebar = ({ onSelectConversation, activeConversation }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { conversations, setConversations, activeConversation: storeActive, setActiveConversation } = useChatStore();
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces } = useWorkspaceStore();

  const [search, setSearch] = useState('');
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [connections, setConnections] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    if (user) {
      fetchWorkspaces().catch(() => {});
    }
  }, [user, fetchWorkspaces]);

  useEffect(() => {
    axiosInstance.get('/conversation')
      .then(({ data }) => setConversations(data))
      .catch(() => {});
  }, [setConversations]);

  useEffect(() => {
    if (groupModalOpen) {
      axiosInstance.get('/user/connections')
        .then(({ data }) => {
          setConnections(data);
          setSelectedContacts([]);
        })
        .catch(() => {});
    }
  }, [groupModalOpen]);

  const filtered = conversations.filter((c) => {
    if (activeWorkspace) {
      const match = c.workspace === activeWorkspace._id || c.workspace?._id === activeWorkspace._id;
      if (!match) return false;
    } else if (c.workspace) {
      return false;
    }

    if (!search.trim()) return true;
    if (c.isGroup) return c.name.toLowerCase().includes(search.toLowerCase());
    const other = c.participants?.find((p) => p._id !== user?._id);
    return (
      other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      other?.nickname?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const currentActive = activeConversation || storeActive;
  const modeConfig = useMemo(() => (
    activeWorkspace
      ? {
          title: activeWorkspace.name,
          badge: 'Workspace',
          description: 'Channels and team conversations',
          primaryAction: 'New Channel',
          primaryIcon: Hash,
          secondaryAction: 'Workspace Access',
          secondaryIcon: Building2,
        }
      : {
          title: 'Direct Messages',
          badge: 'Inbox',
          description: 'Private chats and small groups',
          primaryAction: 'Find People',
          primaryIcon: Compass,
          secondaryAction: 'New Group',
          secondaryIcon: Users,
        }
  ), [activeWorkspace]);

  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    onSelectConversation?.(conv);
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return toast.error('Channel name is required');
    if (!activeWorkspace) return;

    try {
      setIsSubmitting(true);
      const res = await useWorkspaceStore.getState().createChannel(activeWorkspace._id, newChannelName.trim());
      useChatStore.getState().addOrUpdateConversation(res.channel);
      toast.success(`Channel #${res.channel.name} created.`);
      setChannelModalOpen(false);
      setNewChannelName('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return toast.error('Group name is required');
    if (selectedContacts.length === 0) return toast.error('Select at least one contact');

    try {
      setIsSubmitting(true);
      const { data } = await axiosInstance.post('/conversation/group', {
        name: newGroupName.trim(),
        participants: selectedContacts,
      });
      useChatStore.getState().addOrUpdateConversation(data.conversation);
      toast.success(`Group "${data.conversation.name}" created.`);
      setGroupModalOpen(false);
      setNewGroupName('');
      setSelectedContacts([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group chat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  return (
    <div
      className="sidebar flex flex-col h-full w-full select-none"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
      }}
    >
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="leading-none font-black tracking-tight" style={{ fontSize: '19px', color: 'var(--text-primary)' }}>
              {modeConfig.title}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="px-2 py-1 rounded-full text-[9px] font-mono uppercase tracking-[1.4px]"
                style={{
                  background: activeWorkspace ? 'rgba(123,110,246,0.14)' : 'rgba(99,102,241,0.12)',
                  color: activeWorkspace ? '#c4b5fd' : '#93c5fd',
                  border: activeWorkspace ? '1px solid rgba(123,110,246,0.25)' : '1px solid rgba(147,197,253,0.18)',
                }}
              >
                {modeConfig.badge}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {modeConfig.description}
              </span>
            </div>
          </div>
          <button
            onClick={() => setWsModalOpen(true)}
            className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
            title="Open Workspace Access"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      <div
        className="px-4 py-3 border-b border-white/5 flex-shrink-0"
        style={{ background: activeWorkspace ? 'rgba(123,110,246,0.06)' : 'rgba(59,130,246,0.04)' }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (activeWorkspace) setChannelModalOpen(true);
              else navigate('/search');
            }}
            className="px-3 py-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderColor: 'transparent',
              boxShadow: '0 10px 24px rgba(89,86,233,0.18)',
            }}
          >
            <modeConfig.primaryIcon size={13} />
            <span>{modeConfig.primaryAction}</span>
          </button>
          <button
            onClick={() => {
              if (activeWorkspace) setWsModalOpen(true);
              else setGroupModalOpen(true);
            }}
            className="px-3 py-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <modeConfig.secondaryIcon size={13} />
            <span>{modeConfig.secondaryAction}</span>
          </button>
        </div>
      </div>

      <div
        className="px-4 py-3 border-b border-white/5 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="text-[10px] font-mono uppercase tracking-[1.6px] mb-2" style={{ color: 'var(--text-muted)' }}>
          {activeWorkspace ? 'Switch Workspace' : 'Jump Between Inbox And Workspaces'}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveWorkspace(null)}
            title="Direct Messages"
            style={{
              minWidth: '110px',
              height: '34px',
              borderRadius: '10px',
              background: activeWorkspace === null ? 'var(--accent-glow)' : 'var(--bg-panel)',
              border: activeWorkspace === null ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
              color: activeWorkspace === null ? 'var(--accent)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
              fontSize: '11px',
              fontWeight: 700,
            }}
            className="active:scale-95"
          >
            <Home size={13} />
            <span>Direct Messages</span>
          </button>
          {workspaces.map((ws) => {
            const isActive = activeWorkspace?._id === ws._id;
            return (
              <button
                key={ws._id}
                onClick={() => setActiveWorkspace(ws)}
                title={ws.name}
                style={{
                  minWidth: '110px',
                  height: '34px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg-panel)',
                  border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0 12px',
                }}
                className="active:scale-95"
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(123,110,246,0.18)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  {ws.name ? ws.name.slice(0, 1).toUpperCase() : 'W'}
                </span>
                <span className="truncate">{ws.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-3 relative flex-shrink-0">
        <Search
          size={13}
          className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          className="w-full rounded-xl py-2.5 pr-4 text-[12px] outline-none transition-all duration-150"
          style={{
            paddingLeft: '2.2rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
          placeholder={activeWorkspace ? 'Search channels...' : 'Search chats...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-primary)'; }}
        />
      </div>

      <div
        className="font-mono text-[9px] tracking-[2px] uppercase px-4 pt-1 pb-2 flex-shrink-0 flex items-center justify-between"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>{activeWorkspace ? 'Channels' : 'Recent Conversations'}</span>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          {activeWorkspace ? `${filtered.length} channels` : `${filtered.length} chats`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {conversations.length === 0 ? (
              <div
                className="px-4 py-6 rounded-2xl border flex flex-col items-center gap-3"
                style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-primary)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }}
                >
                  <Radio size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <p className="font-semibold text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {activeWorkspace ? 'No channels yet' : 'No conversations yet'}
                </p>
                <p className="text-[10px] leading-relaxed max-w-[220px]" style={{ color: 'var(--text-muted)' }}>
                  {activeWorkspace
                    ? 'Create your first channel to organize updates, projects, or team discussions.'
                    : 'Search for someone to start a direct chat, or create a group for a shared conversation.'}
                </p>
                <div className="grid grid-cols-1 gap-2 w-full mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeWorkspace) setChannelModalOpen(true);
                      else navigate('/search');
                    }}
                    className="px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer"
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      borderColor: 'transparent',
                    }}
                  >
                    {activeWorkspace ? 'Create First Channel' : 'Start Direct Message'}
                  </button>
                  <button
                    type="button"
                    onClick={() => (activeWorkspace ? setWsModalOpen(true) : setGroupModalOpen(true))}
                    className="px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-primary)',
                    }}
                  >
                    {activeWorkspace ? 'Workspace Access' : 'Create Group'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 rounded-2xl border" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-primary)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No results</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Try a different search term or switch context.
                </p>
              </div>
            )}
          </div>
        )}
        {filtered.map((conv) => (
          <ConversationItem
            key={conv._id}
            conversation={conv}
            isActive={currentActive?._id === conv._id}
            onClick={() => handleSelectConv(conv)}
          />
        ))}
      </div>

      {channelModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-primary)',
            borderRadius: '18px',
            width: '90%',
            maxWidth: '380px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              onClick={() => setChannelModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Create Channel
            </h3>

            <form onSubmit={handleCreateChannelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontMono: true, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. product-updates"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Channel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {groupModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-primary)',
            borderRadius: '18px',
            width: '90%',
            maxWidth: '400px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              onClick={() => setGroupModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Create Group
            </h3>

            <form onSubmit={handleCreateGroupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontMono: true, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sync"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontMono: true, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Select Participants
                </label>
                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {connections.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 6px' }}>
                      No connections found. Connect with people first.
                    </p>
                  ) : (
                    connections.map((c) => (
                      <label
                        key={c._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                        }}
                        className="hover:bg-white/5 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(c._id)}
                          onChange={() => toggleContact(c._id)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span>{c.nickname || c.username}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      <WorkspaceModal open={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
