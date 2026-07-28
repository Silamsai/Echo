import { useEffect, useState } from 'react';
import { Search, Radio, Plus, X, Home, Building2, Users, Hash } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useWorkspaceStore from '../store/workspaceStore';
import axiosInstance from '../utils/axiosInstance';
import ConversationItem from './ConversationItem';
import toast from 'react-hot-toast';
import WorkspaceModal from './WorkspaceModal';

const Sidebar = ({ onSelectConversation, activeConversation }) => {
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation: storeActive, setActiveConversation } = useChatStore();

  // Workspaces from Zustand store
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    fetchWorkspaces,
  } = useWorkspaceStore();

  const [search, setSearch] = useState('');

  // Modals state
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);

  // Create channel values
  const [newChannelName, setNewChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create group values
  const [newGroupName, setNewGroupName] = useState('');
  const [connections, setConnections] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Fetch workspaces on mount
  useEffect(() => {
    if (user) {
      fetchWorkspaces().catch(() => { });
    }
  }, [user, fetchWorkspaces]);

  useEffect(() => {
    axiosInstance.get('/conversation')
      .then(({ data }) => setConversations(data))
      .catch(() => { });
  }, [setConversations]);

  // Load connections when group modal opens
  useEffect(() => {
    if (groupModalOpen) {
      axiosInstance.get('/user/connections')
        .then(({ data }) => {
          setConnections(data);
          setSelectedContacts([]);
        })
        .catch(() => { });
    }
  }, [groupModalOpen]);

  const filtered = conversations.filter((c) => {
    // 1. Filter by Workspace context
    if (activeWorkspace) {
      const match = (c.workspace === activeWorkspace._id || c.workspace?._id === activeWorkspace._id);
      if (!match) return false;
    } else {
      if (c.workspace) return false;
    }

    // 2. Filter by search query
    if (!search.trim()) return true;
    if (c.isGroup) {
      return c.name.toLowerCase().includes(search.toLowerCase());
    }
    const other = c.participants?.find((p) => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      other?.nickname?.toLowerCase().includes(search.toLowerCase());
  });

  const currentActive = activeConversation || storeActive;

  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return toast.error('Channel name is required');
    if (!activeWorkspace) return;

    try {
      setIsSubmitting(true);
      const res = await useWorkspaceStore.getState().createChannel(activeWorkspace._id, newChannelName.trim());
      // Populate state
      useChatStore.getState().addOrUpdateConversation(res.channel);
      toast.success(`Channel #${res.channel.name} created!`);
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
      toast.success(`Group "${data.conversation.name}" created!`);
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
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
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
      {/* Brand Header */}
      <div
        className="px-4 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <div>
          <div
            className="leading-none font-black tracking-tight"
            style={{
              fontSize: '18px',
              background: 'linear-gradient(90deg, #7b6ef6, #6eb5ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
            }}
          >
            {activeWorkspace ? activeWorkspace.name : 'echo'}
          </div>
          <div className="text-[8px] font-mono tracking-[1.5px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {activeWorkspace ? 'Workspace Channels' : 'Direct Messages'}
          </div>
        </div>
      </div>

      <div
        className="px-4 py-3 flex items-start justify-between gap-3 border-b border-white/5 flex-shrink-0"
        style={{ background: 'rgba(124,109,250,0.05)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[1.6px]" style={{ color: 'var(--text-muted)' }}>
            {activeWorkspace ? <Building2 size={12} /> : <Users size={12} />}
            <span>{activeWorkspace ? 'Workspace Mode' : 'Direct Messages'}</span>
          </div>
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {activeWorkspace
              ? `Posting in ${activeWorkspace.name}. Use the channel action to create new workspace channels.`
              : 'Private chats and group chats live here. Use the action on the right to start a group chat.'}
          </p>
        </div>
        <button
          onClick={() => (activeWorkspace ? setChannelModalOpen(true) : setGroupModalOpen(true))}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--accent-border)',
            color: 'var(--accent)',
          }}
          title={activeWorkspace ? 'Create Channel' : 'Create Group'}
        >
          {activeWorkspace ? <Hash size={11} /> : <Users size={11} />}
          <span>{activeWorkspace ? 'New Channel' : 'New Group'}</span>
        </button>
      </div>

      {/* Workspace Switcher Row (Visual row at top of sidebar for easy access on mobile/desktop) */}
      <div
        className="px-3 py-2 flex items-center gap-2 overflow-x-auto border-b border-white/5 no-scrollbar flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.1)' }}
      >
        {/* DMs / Home Icon */}
        <button
          onClick={() => setActiveWorkspace(null)}
          title="Direct Messages"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: activeWorkspace === null ? 'var(--accent-glow)' : 'var(--bg-panel)',
            border: activeWorkspace === null ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
            color: activeWorkspace === null ? 'var(--accent)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          className="active:scale-95"
        >
          <Home size={13} />
        </button>

        {/* Workspaces list */}
        {workspaces.map((ws) => {
          const isActive = activeWorkspace?._id === ws._id;
          const initials = ws.name ? ws.name.slice(0, 2).toUpperCase() : 'WS';
          return (
            <button
              key={ws._id}
              onClick={() => setActiveWorkspace(ws)}
              title={ws.name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: isActive ? 'var(--accent-glow)' : 'var(--bg-panel)',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border-primary)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                transition: 'all 0.2s',
              }}
              className="active:scale-95"
            >
              {initials}
            </button>
          );
        })}

      </div>

      {/* Search Input */}
      <div className="px-3 py-3 relative flex-shrink-0">
        <Search
          size={13}
          className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          className="w-full rounded-lg py-2 pr-4 text-[11px] font-mono outline-none transition-all duration-150"
          style={{
            paddingLeft: '2.2rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
          placeholder="Search chats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-primary)'; }}
        />
      </div>

      {/* Section label */}
      <div
        className="font-mono text-[9px] tracking-[2px] uppercase px-4 pt-1 pb-1 flex-shrink-0 flex items-center justify-between"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>{activeWorkspace ? 'Channels' : 'Conversations'}</span>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          {activeWorkspace ? `${filtered.length} channels` : `${filtered.length} chats`}
        </span>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {conversations.length === 0 ? (
              <div className="px-4 flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                  style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }}
                >
                  <Radio size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No active chats</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  {activeWorkspace ? 'Create a channel or switch workspaces from the rail.' : 'Start a group chat, or search for people to begin a direct message.'}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => (activeWorkspace ? setChannelModalOpen(true) : setGroupModalOpen(true))}
                    className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer"
                    style={{
                      background: 'var(--bg-panel)',
                      color: 'var(--accent)',
                      borderColor: 'var(--accent-border)',
                    }}
                  >
                    {activeWorkspace ? 'Create Channel' : 'Create Group'}
                  </button>
                  {!activeWorkspace && (
                    <button
                      type="button"
                      onClick={() => setWsModalOpen(true)}
                      className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      Workspaces
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p>No chats found</p>
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

      {/* ─── CREATE CHANNEL MODAL ─── */}
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
                  placeholder="e.g. feedback-loop"
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
                {isSubmitting ? 'Creating…' : 'Create Channel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE GROUP CHAT MODAL ─── */}
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
              Create Group Chat
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
                      No connections found. Form connections first!
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
                {isSubmitting ? 'Creating…' : 'Create Group Chat'}
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
