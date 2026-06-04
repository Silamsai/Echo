import { formatConversationTime } from '../utils/formatTime';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();

  const other = conversation.participants?.find((p) => p._id !== user?._id);
  const avatar = other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`;
  const isTyping = typingUsers[conversation._id]?.size > 0;
  const lastMsg = conversation.lastMessage;

  const getLastMsgText = () => {
    if (!lastMsg) return 'Start chatting!';
    if (lastMsg.type === 'image') return '📷 Image';
    if (lastMsg.type === 'voice') return '🎙️ Voice note';
    if (lastMsg.deleted) return 'Message deleted';
    return lastMsg.content || '';
  };

  const isUnread = lastMsg && !lastMsg.seen && (lastMsg.sender?._id || lastMsg.sender) !== user?._id;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 relative border ${
        isActive
          ? 'bg-[#16161f] border-[rgba(124,109,250,0.22)] shadow-sm'
          : 'bg-transparent border-transparent hover:bg-[#16161f]/50'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={other?.username}
          className="w-9 h-9 rounded-lg object-cover border border-white/5"
        />
        {other?.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#111118] rounded-full shadow-lg" />
        )}
      </div>

      {/* Message Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-semibold truncate ${isUnread ? 'text-white font-bold' : 'text-[#e8e6ff]'}`}>
              {other?.nickname || other?.username}
            </span>
            {user?.mutedConversations?.includes(conversation._id) && (
              <span className="text-[10px] text-slate-500" title="Muted">🔕</span>
            )}
          </div>
          <span className={`text-[9px] font-mono flex-shrink-0 ml-2 ${isUnread ? 'text-[#7c6dfa] font-bold' : 'text-slate-500'}`}>
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[11px] font-mono truncate flex-1 ${
            isTyping 
              ? 'text-indigo-400 font-medium' 
              : isUnread 
                ? 'text-slate-200 font-semibold' 
                : 'text-slate-400'
          }`}>
            {isTyping ? 'typing...' : getLastMsgText()}
          </p>
          
          {/* Unread Message Indicator Dot */}
          {isUnread && (
            <span className="w-2 h-2 bg-[#7c6dfa] rounded-full flex-shrink-0 shadow-md shadow-indigo-500/50" />
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
