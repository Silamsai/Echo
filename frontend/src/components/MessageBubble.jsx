import { CheckCheck, Check } from 'lucide-react';
import { formatMessageTime } from '../utils/formatTime';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';

const MessageBubble = ({ message }) => {
  const { user } = useAuthStore();
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



  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2.5 fade-in items-end gap-2`}>
      {/* Received Avatar on Left */}
      {!isSent && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.nickname || message.sender?.username}
          sizeClass="w-7 h-7"
          borderRadiusClass="rounded-lg"
        />
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[65%]`}>

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
                {message.content}
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
            <p className="text-xs leading-relaxed font-sans">{message.content}</p>
          </div>
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
