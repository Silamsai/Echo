import { formatConversationTime } from '../utils/formatTime';
import { VolumeX, Image as ImageIcon, Mic, Pin } from 'lucide-react';
import { BsPinAngleFill, BsVolumeMuteFill } from 'react-icons/bs';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';
import { getUserAvatar, getGroupAvatar } from '../utils/avatar';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();

  const other = conversation.isGroup ? null : conversation.participants?.find((p) => p._id !== user?._id);
  const avatar = conversation.isGroup
    ? getGroupAvatar(conversation)
    : getUserAvatar(other);
  const getTypingText = () => {
    const ids = typingUsers[conversation._id];
    if (!ids || ids.size === 0) return null;
    const typingList = Array.from(ids)
      .filter((id) => id !== user?._id)
      .map((id) => conversation.participants?.find((p) => p._id === id || p === id))
      .filter(Boolean);
    if (typingList.length === 0) return null;
    if (conversation.isGroup) {
      if (typingList.length === 1) return `${typingList[0].nickname || typingList[0].username} is typing…`;
      if (typingList.length === 2) return `${typingList[0].username} and ${typingList[1].username} are typing…`;
      return 'Several people are typing…';
    }
    return 'typing…';
  };

  const typingText = getTypingText();
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
      <Avatar
        src={avatar}
        name={conversation.isGroup ? conversation.name : other?.nickname || other?.username}
        sizeClass="w-9 h-9"
        borderRadiusClass="rounded-lg"
        isOnline={!conversation.isGroup && other?.isOnline}
      />

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
              <BsVolumeMuteFill size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} title="Muted" />
            )}
            {user?.pinnedConversations?.includes(conversation._id) && (
              <BsPinAngleFill size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} title="Pinned" />
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
              color: typingText ? 'var(--accent)' : isUnread ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontWeight: typingText || isUnread ? 600 : 400,
            }}
          >
            {typingText || getLastMsgPreview()}
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
