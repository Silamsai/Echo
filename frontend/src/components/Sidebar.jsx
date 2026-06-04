import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
    <div className="sidebar flex flex-col h-full w-full md:w-[260px] border-r border-white/5 select-none bg-[#0e0e14]">
      {/* Brand Header */}
      <div className="px-4 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <div
            className="leading-none font-black tracking-tight"
            style={{
              fontSize: '18px',
              background: 'linear-gradient(90deg, #7b6ef6, #6eb5ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", -apple-system, sans-serif',
            }}
          >
            echo
          </div>
          <div className="text-[8px] font-mono text-slate-500 tracking-[1.5px] uppercase mt-0.5">
            WORKSPACE CHATS
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-3 relative">
        <Search
          size={13}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          className="w-full bg-[#14141c] text-[#e8e6ff] border border-white/5 rounded-lg py-2 pr-4 text-[11px] placeholder-slate-600 font-mono outline-none focus:border-[#7b6ef6]/30 transition-all duration-150"
          style={{ paddingLeft: '2.2rem' }}
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Section label */}
      <div className="font-mono text-[9px] tracking-[2px] text-slate-500 uppercase px-4 pt-1 pb-1">
        Channels
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-[11px] font-mono">
            {conversations.length === 0 ? (
              <div className="px-4">
                <div className="text-2xl mb-2">📡</div>
                <p className="font-semibold text-slate-500">No active chats</p>
                <p className="text-[9px] text-slate-600 mt-1">Search people to start chatting</p>
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
