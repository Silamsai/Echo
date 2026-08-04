import { useEffect, useState } from 'react';
import { Search, Radio, Plus, X, Home, Building2, Users, Hash, ArrowLeft, Share2 } from 'lucide-react';
import { BsPinAngleFill, BsVolumeMuteFill, BsTrash3Fill, BsBoxArrowRight } from 'react-icons/bs';
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

  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    fetchWorkspaces,
    sidebarTab,
    workspaceChannels,
  } = useWorkspaceStore();

  const [search, setSearch] = useState('');
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [connections, setConnections] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const getWorkspaceInitials = (name) => {
    return name ? name.slice(0, 2).toUpperCase() : 'WS';
  };

  const getWorkspaceColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 50%, 45%)`;
  };

  const handleTogglePinWorkspace = async (ws) => {
    const isPinned = user?.pinnedWorkspaces?.includes(ws._id);
    const endpoint = isPinned ? `/user/unpin-workspace/${ws._id}` : `/user/pin-workspace/${ws._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ pinnedWorkspaces: data.pinnedWorkspaces });
      toast.success(isPinned ? 'Workspace unpinned' : 'Workspace pinned');
    } catch {
      toast.error('Failed to update workspace settings.');
    }
    setContextMenu(null);
  };

  const handleToggleMuteWorkspace = async (ws) => {
    const isMuted = user?.mutedWorkspaces?.includes(ws._id);
    const endpoint = isMuted ? `/user/unmute-workspace/${ws._id}` : `/user/mute-workspace/${ws._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ mutedWorkspaces: data.mutedWorkspaces });
      toast.success(isMuted ? 'Workspace unmuted' : 'Workspace muted');
    } catch {
      toast.error('Failed to update workspace settings.');
    }
    setContextMenu(null);
  };

  const handleDeleteWorkspace = async (ws) => {
    const confirmText = ws.owner === user?._id
      ? 'Delete workspace? This will erase all channels and messages.'
      : 'Leave workspace?';
    if (!window.confirm(confirmText)) return;
    try {
      const { deleteWorkspace } = useWorkspaceStore.getState();
      await deleteWorkspace(ws._id);
      toast.success(ws.owner === user?._id ? 'Workspace deleted' : 'Left workspace');
    } catch {
      toast.error('Failed to delete/leave workspace.');
    }
    setContextMenu(null);
  };

  const handleCopyInviteCode = (ws) => {
    if (ws?.code) {
      navigator.clipboard.writeText(ws.code);
      toast.success('Workspace invite code copied!');
    } else {
      toast.error('No invite code available.');
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e, item, type = 'conv') => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    });
  };

  const handleToggleMute = async (conv) => {
    const isMuted = user?.mutedConversations?.includes(conv._id);
    const endpoint = isMuted ? `/user/unmute/${conv._id}` : `/user/mute/${conv._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ mutedConversations: data.mutedConversations });
      toast.success(isMuted ? 'Chat unmuted' : 'Chat muted');
    } catch {
      toast.error('Failed to update mute settings.');
    }
    setContextMenu(null);
  };

  const handleTogglePin = async (conv) => {
    const isPinned = user?.pinnedConversations?.includes(conv._id);
    const endpoint = isPinned ? `/user/unpin/${conv._id}` : `/user/pin/${conv._id}`;
    try {
      const { data } = await axiosInstance.put(endpoint);
      useAuthStore.getState().updateUser({ pinnedConversations: data.pinnedConversations });
      toast.success(isPinned ? 'Chat unpinned' : 'Chat pinned');
    } catch {
      toast.error('Failed to update pin settings.');
    }
    setContextMenu(null);
  };

  const handleDeleteChat = async (conv) => {
    const confirmText = conv.isGroup
      ? (conv.groupAdmin === user?._id ? 'Delete group? This will erase all messages.' : 'Leave group?')
      : 'Delete chat history for both parties?';
    if (!window.confirm(confirmText)) return;

    try {
      await axiosInstance.delete(`/conversation/${conv._id}`);
      useChatStore.getState().deleteConversationStore(conv._id);
      toast.success(conv.isGroup && conv.groupAdmin !== user?._id ? 'Left group' : 'Chat deleted');
    } catch {
      toast.error('Failed to delete chat.');
    }
    setContextMenu(null);
  };

  useEffect(() => {
    if (user) {
      fetchWorkspaces().catch(() => { });
    }
  }, [user, fetchWorkspaces]);

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;
    const loadConversations = async () => {
      try {
        const { data } = await axiosInstance.get('/conversation');
        if (!cancelled) {
          setConversations(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load conversations:', err);
        toast.error(err.response?.data?.message || 'Failed to load chats.');
      }
    };

    loadConversations();

    // Refetch when tab becomes visible again (covers missed loads after OAuth)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadConversations();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?._id, setConversations]);

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
    if (activeWorkspace) {
      const match = (c.workspace === activeWorkspace._id || c.workspace?._id === activeWorkspace._id);
      if (!match) return false;
    } else {
      if (c.workspace) return false;
    }

    if (!search.trim()) return true;
    if (c.isGroup) {
      return c.name.toLowerCase().includes(search.toLowerCase());
    }
    const other = c.participants?.find((p) => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      other?.nickname?.toLowerCase().includes(search.toLowerCase());
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const aPinned = user?.pinnedConversations?.includes(a._id) ? 1 : 0;
    const bPinned = user?.pinnedConversations?.includes(b._id) ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
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

  // Filter active workspace channels
  const filteredWorkspaceChannels = workspaceChannels.filter(c => {
    if (!search.trim()) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  // Filter and sort workspaces
  const filteredWorkspaces = workspaces.filter(ws => {
    if (!search.trim()) return true;
    return ws.name.toLowerCase().includes(search.toLowerCase());
  });

  const sortedWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    const aPinned = user?.pinnedWorkspaces?.includes(a._id) ? 1 : 0;
    const bPinned = user?.pinnedWorkspaces?.includes(b._id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div
      className="sidebar flex flex-col h-full w-full select-none"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
      }}
    >
      <div
        className="px-4 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        {sidebarTab === 'workspaces' && activeWorkspace !== null ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWorkspace(null)}
              className="mr-1 hover:text-[var(--accent)] transition cursor-pointer p-1 rounded-lg flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white"
              title="Back to workspaces"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div
                className="leading-none font-black tracking-tight text-[16px] text-white"
                style={{ fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif' }}
              >
                {activeWorkspace.name}
              </div>
              <div className="text-[8px] font-mono tracking-[1px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Workspace Channels
              </div>
            </div>
          </div>
        ) : (
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
              {sidebarTab === 'workspaces' ? 'workspaces' : 'echo'}
            </div>
            <div className="text-[8px] font-mono tracking-[1.5px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {sidebarTab === 'workspaces' ? 'Available spaces' : 'Direct Messages'}
            </div>
          </div>
        )}
      </div>

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
          placeholder={sidebarTab === 'workspaces' ? (activeWorkspace ? "Search channels…" : "Search workspaces…") : "Search chats…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-primary)'; }}
        />
      </div>

      <div
        className="font-mono text-[9px] tracking-[2px] uppercase px-4 pt-3 pb-1.5 flex-shrink-0 flex items-center justify-between border-t border-white/5"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>
          {sidebarTab === 'chats' ? 'Conversations' : (activeWorkspace ? 'Channels' : 'Workspaces')}
        </span>
        <button
          onClick={() => {
            if (sidebarTab === 'chats') setGroupModalOpen(true);
            else if (activeWorkspace) setChannelModalOpen(true);
            else setWsModalOpen(true);
          }}
          className="hover:text-[var(--accent)] transition cursor-pointer p-0.5 flex items-center justify-center rounded"
          title={sidebarTab === 'chats' ? 'Create Group' : (activeWorkspace ? 'Create Channel' : 'Create Workspace')}
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 pb-20 md:pb-2">
        {/* Chats Mode list */}
        {sidebarTab === 'chats' && (
          <>
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
                      Search contacts to start chatting
                    </p>
                  </div>
                ) : activeWorkspace ? (
                  <div className="px-4 flex flex-col items-center gap-2">
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No chats in this workspace</p>
                    <button
                      type="button"
                      className="text-[10px] underline"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => setActiveWorkspace(null)}
                    >
                      Show direct messages
                    </button>
                  </div>
                ) : (
                  <p>No chats found</p>
                )}
              </div>
            )}
            {sortedFiltered.map((conv) => (
              <div
                key={conv._id}
                onContextMenu={(e) => handleContextMenu(e, conv, 'conv')}
              >
                <ConversationItem
                  conversation={conv}
                  isActive={currentActive?._id === conv._id}
                  onClick={() => handleSelectConv(conv)}
                />
              </div>
            ))}
          </>
        )}

        {/* Workspaces list Mode */}
        {sidebarTab === 'workspaces' && activeWorkspace === null && (
          <>
            {sortedWorkspaces.length === 0 && (
              <div className="px-4 py-8 flex flex-col items-center text-center gap-4 overflow-y-auto">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }}
                >
                  <Building2 size={22} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">No Workspaces Joined</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                    Create a brand new workspace or enter code to join an existing one.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-[200px] mt-2">
                  <button
                    onClick={() => setWsModalOpen(true)}
                    className="w-full btn-primary text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer"
                  >
                    Create Workspace
                  </button>
                  <button
                    onClick={() => setWsModalOpen(true)}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition duration-150 cursor-pointer"
                  >
                    Join Workspace
                  </button>
                </div>
              </div>
            )}
            {sortedWorkspaces.map((ws) => {
              const initials = getWorkspaceInitials(ws.name);
              const color = getWorkspaceColor(ws.name);
              const isPinned = user?.pinnedWorkspaces?.includes(ws._id);
              const isMuted = user?.mutedWorkspaces?.includes(ws._id);
              const isOwner = ws.owner === user?._id;

              return (
                <div
                  key={ws._id}
                  onContextMenu={(e) => handleContextMenu(e, ws, 'workspace')}
                  onClick={() => setActiveWorkspace(ws)}
                  className="w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition duration-200 border border-transparent active:scale-[0.99] group mt-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black font-mono shadow-md text-white transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${color} 0%, rgba(15,15,22,0.6) 100%)`,
                        border: '1.5px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {initials}
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-[13px] font-semibold text-white group-hover:text-[var(--accent)] transition-colors duration-150">
                        {ws.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                        {ws.members?.length || 1} member{(ws.members?.length || 1) !== 1 ? 's' : ''} {isOwner && '• Owner'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPinned && <BsPinAngleFill size={10} style={{ color: 'var(--accent)' }} />}
                    {isMuted && <BsVolumeMuteFill size={11} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Workspace Channels Mode list */}
        {sidebarTab === 'workspaces' && activeWorkspace !== null && (
          <>
            {filteredWorkspaceChannels.length === 0 && (
              <div className="text-center py-12 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <p>No channels found</p>
              </div>
            )}
            {filteredWorkspaceChannels.map((c) => (
              <div key={c._id}>
                <ConversationItem
                  conversation={c}
                  isActive={currentActive?._id === c._id}
                  onClick={() => handleSelectConv(c)}
                />
              </div>
            ))}
          </>
        )}
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

      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'transparent',
            }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              zIndex: 9999,
              minWidth: '150px',
              background: 'rgba(15, 15, 22, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
            className="fade-in-quick"
          >
            {contextMenu.type === 'workspace' ? (
              <>
                <button
                  onClick={() => handleTogglePinWorkspace(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <BsPinAngleFill size={11} style={{ color: 'var(--accent)' }} />
                  <span>{user?.pinnedWorkspaces?.includes(contextMenu.item._id) ? 'Unpin Workspace' : 'Pin Workspace'}</span>
                </button>
                <button
                  onClick={() => handleToggleMuteWorkspace(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <BsVolumeMuteFill size={12} style={{ color: 'var(--text-muted)' }} />
                  <span>{user?.mutedWorkspaces?.includes(contextMenu.item._id) ? 'Unmute Workspace' : 'Mute Workspace'}</span>
                </button>
                <button
                  onClick={() => handleCopyInviteCode(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <Share2 size={11} style={{ color: 'var(--accent)' }} />
                  <span>Copy Invite Code</span>
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <button
                  onClick={() => handleDeleteWorkspace(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-red-500/10 hover:text-red-400"
                >
                  {contextMenu.item.owner === user?._id ? (
                    <BsTrash3Fill size={11} />
                  ) : (
                    <BsBoxArrowRight size={12} />
                  )}
                  <span>{contextMenu.item.owner === user?._id ? 'Delete Workspace' : 'Leave Workspace'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleTogglePin(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <BsPinAngleFill size={11} style={{ color: 'var(--accent)' }} />
                  <span>{user?.pinnedConversations?.includes(contextMenu.item._id) ? 'Unpin Chat' : 'Pin Chat'}</span>
                </button>
                <button
                  onClick={() => handleToggleMute(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  <BsVolumeMuteFill size={12} style={{ color: 'var(--text-muted)' }} />
                  <span>{user?.mutedConversations?.includes(contextMenu.item._id) ? 'Unmute Chat' : 'Mute Chat'}</span>
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <button
                  onClick={() => handleDeleteChat(contextMenu.item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-red-500/10 hover:text-red-400"
                >
                  {contextMenu.item.isGroup && contextMenu.item.groupAdmin === user?._id ? (
                    <BsTrash3Fill size={11} />
                  ) : contextMenu.item.isGroup ? (
                    <BsBoxArrowRight size={12} />
                  ) : (
                    <BsTrash3Fill size={11} />
                  )}
                  <span>{contextMenu.item.isGroup && contextMenu.item.groupAdmin !== user?._id ? 'Leave Group' : 'Delete Chat'}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      <WorkspaceModal open={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
