import { formatConversationTime } from '../utils/formatTime';
import { VolumeX, Image as ImageIcon, Mic } from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();

  const other = conversation.isGroup ? null : conversation.participants?.find((p) => p._id !== user?._id);
  const avatar = conversation.isGroup
    ? (conversation.groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conversation.name)}&backgroundColor=7b6ef6`)
    : (other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`);
  const isTyping = typingUsers[conversation._id]?.size > 0;
  const lastMsg = conversation.lastMessage;

  const getLastMsgPreview = () => {
    if (!lastMsg) return 'Start chatting!';
    if (lastMsg.type === 'image') return (<span className="flex items-center gap-1"><ImageIcon size={10} /> Image</span>);
    if (lastMsg.type === 'voice') return (<span className="flex items-center gap-1"><Mic size={10} /> Voice note</span>);
    if (lastMsg.deleted) return 'Message deleted';

    // In groups, prefix with sender moniker for context
    const senderName = lastMsg.sender?._id === user?._id
      ? 'You'
      : (lastMsg.sender?.nickname || lastMsg.sender?.username || 'Someone');
    const content = lastMsg.content || '';
    return conversation.isGroup ? `${senderName}: ${content}` : content;
  };

  const isUnread = lastMsg && !lastMsg.seen && (lastMsg.sender?._id || lastMsg.sender) !== user?._id;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 relative border cursor-pointer"
      style={{
        background: isActive ? 'var(--bg-panel)' : 'transparent',
        borderColor: isActive ? 'var(--accent-border)' : 'transparent',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={conversation.isGroup ? conversation.name : other?.username}
          className="w-9 h-9 rounded-lg object-cover"
          style={{ border: '1px solid var(--border-primary)' }}
        />
        {!conversation.isGroup && other?.isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full shadow-lg"
            style={{ border: '2px solid var(--bg-surface)' }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-xs truncate"
              style={{
                color: isUnread ? 'var(--text-primary)' : 'var(--text-primary)',
                fontWeight: isUnread ? 700 : 600,
              }}
            >
              {conversation.isGroup
                ? (conversation.workspace ? `#${conversation.name}` : conversation.name)
                : (other?.nickname || other?.username)}
            </span>
            {user?.mutedConversations?.includes(conversation._id) && (
              <VolumeX size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} title="Muted" />
            )}
          </div>
          <span
            className="text-[9px] font-mono flex-shrink-0 ml-2"
            style={{ color: isUnread ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isUnread ? 700 : 400 }}
          >
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[11px] font-mono truncate flex-1"
            style={{
              color: isTyping ? 'var(--accent)' : isUnread ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontWeight: isTyping || isUnread ? 600 : 400,
            }}
          >
            {isTyping ? 'typing…' : getLastMsgPreview()}
          </p>
          {isUnread && (
            <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-md" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
