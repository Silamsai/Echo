import { CheckCheck, Check, BarChart3 } from 'lucide-react';
import { formatMessageTime } from '../utils/formatTime';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import Avatar from './Avatar';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const MessageBubble = ({ message, searchQuery }) => {
  const { user } = useAuthStore();
  const { activeConversation, setSelectedProfileUser, addMessage } = useChatStore();
  const isSent = message.sender?._id === user?._id || message.sender === user?._id;

  if (message.deleted) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
        <span
          className="text-[10px] font-mono italic px-4 py-2 rounded-lg border"
          style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-panel)',
          }}
        >
          🗑️ Message deleted
        </span>
      </div>
    );
  }

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} style={{ background: 'rgba(124, 109, 250, 0.4)', color: 'inherit', padding: '0 2px', borderRadius: '4px' }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleVoteOption = async (optionId) => {
    try {
      const response = await axiosInstance.post(`/message/${message._id}/vote`, { optionId });
      addMessage(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit vote.');
    }
  };

  // Poll Vote Calculations
  const totalVotes = message.pollOptions?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

  // Helper to extract avatar
  const getAvatar = (u) => u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.username}`;

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2.5 fade-in items-end gap-2`}>
      {/* Received Avatar on Left */}
      {!isSent && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.nickname || message.sender?.username}
          sizeClass="w-7 h-7"
          borderRadiusClass="rounded-lg"
          onClick={() => {
            if (message.sender) setSelectedProfileUser(message.sender);
          }}
        />
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[65%]`}>
        {/* If group/channel chat, show clickable sender name */}
        {!isSent && activeConversation?.isGroup && (
          <span
            onClick={() => {
              if (message.sender) setSelectedProfileUser(message.sender);
            }}
            className="text-[10px] font-bold mb-1 hover:underline cursor-pointer select-none text-indigo-400 block"
          >
            {message.sender?.nickname || message.sender?.username}
          </span>
        )}

        {/* Render Image Message */}
        {message.type === 'image' && message.fileUrl && (
          <div className={`rounded-xl overflow-hidden mb-1 border border-pri ${isSent ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
            <img
              src={message.fileUrl}
              alt="sent"
              className="max-w-xs max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            {message.content && (
              <div className={`px-3 py-2 text-xs font-sans ${isSent ? 'bubble-sent rounded-t-none border-t-0' : 'bubble-received rounded-t-none border-t-0'}`}>
                {highlightText(message.content, searchQuery)}
              </div>
            )}
          </div>
        )}

        {/* Render Voice Note Message */}
        {message.type === 'voice' && message.fileUrl && (
          <div className={`${isSent ? 'bubble-sent' : 'bubble-received'} flex items-center gap-3 py-2 px-3 min-w-44`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm border"
              style={{
                background: isSent ? 'var(--bg-app)' : 'var(--bg-panel)',
                borderColor: 'var(--border-primary)',
              }}>
              🎙️
            </div>
            <audio controls className="flex-1 h-7 text-[10px]" style={{ filter: 'invert(1) hue-rotate(180deg) opacity(0.8)', maxWidth: 140 }}>
              <source src={message.fileUrl} type="audio/webm" />
            </audio>
          </div>
        )}

        {/* Render Text Message */}
        {message.type === 'text' && (
          <div className={isSent ? 'bubble-sent' : 'bubble-received'}>
            <p className="text-xs leading-relaxed font-sans">{highlightText(message.content, searchQuery)}</p>
          </div>
        )}

        {/* Render Poll Message */}
        {message.type === 'poll' && (
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3 font-sans w-80 text-left"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {/* Poll Header */}
            <div className="flex items-start gap-2.5 pb-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="p-1.5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-glow)' }}>
                <BarChart3 size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white leading-normal break-words">
                  {message.pollQuestion}
                </p>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Interactive live poll • {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                </p>
              </div>
            </div>

            {/* Poll Options */}
            <div className="flex flex-col gap-2">
              {message.pollOptions?.map((opt) => {
                const optVotes = opt.votes?.length || 0;
                const hasVoted = opt.votes?.some((uid) => uid === user?._id || uid?._id === user?._id);
                const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                return (
                  <button
                    key={opt._id}
                    onClick={() => handleVoteOption(opt._id)}
                    className="w-full relative rounded-xl border p-3 flex items-center justify-between text-left overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    style={{
                      borderColor: hasVoted ? 'var(--accent-border)' : 'var(--border-primary)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    {/* Visual Progress Bar fill */}
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        background: hasVoted ? 'rgba(124, 109, 250, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      }}
                    />

                    {/* Left text + checkmark */}
                    <div className="flex items-center gap-2 relative z-10 min-w-0 flex-1">
                      <div
                        className="w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: hasVoted ? 'var(--accent)' : 'var(--border-primary)',
                          background: hasVoted ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {hasVoted && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: hasVoted ? 'white' : 'var(--text-secondary)' }}
                      >
                        {opt.text}
                      </span>
                    </div>

                    {/* Right vote percentage & count */}
                    <div className="flex items-center gap-2 relative z-10 font-mono text-[10px] font-bold text-right pl-2 flex-shrink-0">
                      <span style={{ color: hasVoted ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {percent}%
                      </span>
                      <span className="text-[8px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        ({optVotes})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature 5: Rich Link Preview Card */}
        {message.type === 'text' && message.linkPreview && message.linkPreview.url && (
          <a
            href={message.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 rounded-2xl border overflow-hidden hover:opacity-95 transition-opacity max-w-xs text-left"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {message.linkPreview.image && (
              <img
                src={message.linkPreview.image}
                alt=""
                className="w-full h-32 object-cover border-b"
                style={{ borderColor: 'var(--border-primary)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="p-3.5 flex flex-col gap-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-400">
                {new URL(message.linkPreview.url).hostname}
              </span>
              <p className="text-xs font-semibold text-white line-clamp-1">
                {message.linkPreview.title}
              </p>
              {message.linkPreview.description && (
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">
                  {message.linkPreview.description}
                </p>
              )}
            </div>
          </a>
        )}

        {/* Timestamp + Read Receipt Indicator (DM Mono) */}
        <div className={`flex items-center gap-1 mt-1 font-mono text-[9px] ${isSent ? 'flex-row-reverse' : ''}`}>
          <span className="text-slate-500">{formatMessageTime(message.createdAt)}</span>
          {isSent && (
            message.seen
              ? <CheckCheck size={11} className="text-[#7c6dfa]" />
              : <Check size={11} className="text-slate-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
