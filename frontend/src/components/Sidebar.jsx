import { useEffect, useState } from 'react';
import { Search, Radio, Plus, X, Home, Building2, Users, Hash } from 'lucide-react';
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

  const handleContextMenu = (e, conv) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conv,
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
    axiosInstance.get('/conversation')
      .then(({ data }) => setConversations(data))
      .catch(() => { });
  }, [setConversations]);

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

      <div
        className="font-mono text-[9px] tracking-[2px] uppercase px-4 pt-3 pb-1.5 flex-shrink-0 flex items-center justify-between border-t border-white/5"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>{activeWorkspace ? 'Channels' : 'Conversations'}</span>
        <button
          onClick={() => (activeWorkspace ? setChannelModalOpen(true) : setGroupModalOpen(true))}
          className="hover:text-[var(--accent)] transition cursor-pointer p-0.5 flex items-center justify-center rounded"
          title={activeWorkspace ? 'Create Channel' : 'Create Group'}
        >
          <Plus size={12} />
        </button>
      </div>

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
                  {activeWorkspace ? 'Create a channel or switch workspaces from the rail.' : 'Search contacts to start chatting'}
                </p>
              </div>
            ) : (
              <p>No chats found</p>
            )}
          </div>
        )}
        {sortedFiltered.map((conv) => (
          <div
            key={conv._id}
            onContextMenu={(e) => handleContextMenu(e, conv)}
          >
            <ConversationItem
              conversation={conv}
              isActive={currentActive?._id === conv._id}
              onClick={() => handleSelectConv(conv)}
            />
          </div>
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
            <button
              onClick={() => handleTogglePin(contextMenu.conv)}
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
              <span>{user?.pinnedConversations?.includes(contextMenu.conv._id) ? 'Unpin Chat' : 'Pin Chat'}</span>
            </button>
            <button
              onClick={() => handleToggleMute(contextMenu.conv)}
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
              <span>{user?.mutedConversations?.includes(contextMenu.conv._id) ? 'Unmute Chat' : 'Mute Chat'}</span>
            </button>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            <button
              onClick={() => handleDeleteChat(contextMenu.conv)}
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
              {contextMenu.conv.isGroup && contextMenu.conv.groupAdmin !== user?._id ? (
                <BsBoxArrowRight size={12} />
              ) : (
                <BsTrash3Fill size={11} />
              )}
              <span>{contextMenu.conv.isGroup && contextMenu.conv.groupAdmin !== user?._id ? 'Leave Group' : 'Delete Chat'}</span>
            </button>
          </div>
        </>
      )}

      <WorkspaceModal open={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
