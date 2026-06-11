import { useEffect, useState } from 'react';
import { Search, Radio } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import axiosInstance from '../utils/axiosInstance';
import ConversationItem from './ConversationItem';

const Sidebar = ({ onSelectConversation, activeConversation }) => {
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation: storeActive, setActiveConversation } = useChatStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosInstance.get('/conversation').then(({ data }) => setConversations(data)).catch(() => {});
  }, [setConversations]);

  const filtered = conversations.filter((c) => {
    const other = c.participants?.find((p) => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase()) ||
           other?.nickname?.toLowerCase().includes(search.toLowerCase());
  });

  const currentActive = activeConversation || storeActive;

  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
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
            echo
          </div>
          <div className="text-[8px] font-mono tracking-[1.5px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Workspace Chats
          </div>
        </div>
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
        className="font-mono text-[9px] tracking-[2px] uppercase px-4 pt-1 pb-1 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        Channels
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
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Search people to start chatting</p>
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
    </div>
  );
};

export default Sidebar;
