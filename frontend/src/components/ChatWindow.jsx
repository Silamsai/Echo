import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Send, Image as ImageIcon, X, Mic, MicOff, Trash2,
  Info, Calendar, Mail, ShieldAlert, ArrowLeft,
  Phone, Video, VolumeX, Volume2, Ban, MessageSquareQuote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import CallModal from './CallModal';
import axiosInstance from '../utils/axiosInstance';
import { getSocket } from '../socket/socket';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useMediaRecorder from '../hooks/useMediaRecorder';
import { formatLastSeen } from '../utils/formatTime';
import useConfigStore from '../store/configStore';

/* ─── Utility ─── */
const getAvatar = (u) => u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.username}`;
const makeRoomName = (conversationId) => `echo_room_${conversationId}`;

/* ─── Load persisted chat theme and apply to element ─── */
const getChatThemeClass = () => {
  const t = localStorage.getItem('chatTheme') || 'midnight';
  return `chat-theme-${t}`;
};

const ChatWindow = ({ conversation, onBack }) => {
  const { user, updateUser } = useAuthStore();
  const { messages, setMessages, typingUsers, addMessage, updateLastMessage } = useChatStore();
  const { config } = useConfigStore();

  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [chatThemeClass, setChatThemeClass] = useState(getChatThemeClass);

  /* ─── Call state ─── */
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('audio');
  const [incomingCall, setIncomingCall] = useState(null);
  const roomNameRef = useRef(null);

  const bottomRef = useRef();
  const typingTimeout = useRef();
  const imageInputRef = useRef();

  const {
    isRecording, formattedDuration, audioBlob, audioUrl,
    startRecording, stopRecording, cancelRecording, clearAudio,
  } = useMediaRecorder();

  const conversationId = conversation._id;
  const other = conversation.participants?.find((p) => p._id !== user?._id);

  const isChatMuted = user?.mutedConversations?.includes(conversation._id);
  const isBlocked = user?.blockedUsers?.includes(other?._id);

  /* Sync chat theme with storage changes */
  useEffect(() => {
    const onStorage = () => setChatThemeClass(getChatThemeClass());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* ─── Block / Mute handlers ─── */
  const handleToggleMute = async () => {
    try {
      const ep = isChatMuted ? `/user/unmute/${conversation._id}` : `/user/mute/${conversation._id}`;
      const { data } = await axiosInstance.put(ep);
      updateUser(data);
      toast.success(isChatMuted ? 'Chat unmuted' : 'Chat muted');
    } catch {
      toast.error('Failed to toggle mute.');
    }
  };

  const handleToggleBlock = async () => {
    if (!other?._id) return;
    try {
      const ep = isBlocked ? `/user/unblock/${other._id}` : `/user/block/${other._id}`;
      const { data } = await axiosInstance.put(ep);
      updateUser(data);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch {
      toast.error('Failed to toggle block.');
    }
  };

  const convMessages = useMemo(() => messages[conversationId] || [], [messages, conversationId]);
  const isOtherTyping = typingUsers[conversationId]?.has(other?._id);

  /* ─── Load messages ─── */
  useEffect(() => {
    if (!conversationId) return;
    axiosInstance.get(`/message/${conversationId}`).then(({ data }) => {
      setMessages(conversationId, data);
    }).catch(() => {});
  }, [conversationId, setMessages]);

  /* ─── Scroll to bottom ─── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length, isOtherTyping]);

  /* ─── Mark seen ─── */
  useEffect(() => {
    const socket = getSocket();
    const unread = convMessages.filter(
      (m) => !m.seen && (m.sender?._id || m.sender) !== user?._id
    );
    unread.forEach((m) => socket?.emit('mark-seen', { messageId: m._id }));
  }, [convMessages, user]);

  /* ─── Incoming call socket listener ─── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (data) => {
      setIncomingCall(data);
      setCallType(data.callType);
      setCallState('incoming');
    };
    const onAccepted = (data) => {
      roomNameRef.current = data.roomName;
      setCallState('connected');
      toast.success('Call connected!');
    };
    const onRejected = () => {
      setCallState('idle');
      roomNameRef.current = null;
      toast('Call declined');
    };
    const onEnded = () => {
      setCallState('idle');
      roomNameRef.current = null;
      toast('Call ended');
    };

    socket.on('call-incoming', onIncoming);
    socket.on('call-accepted', onAccepted);
    socket.on('call-rejected', onRejected);
    socket.on('call-ended', onEnded);

    return () => {
      socket.off('call-incoming', onIncoming);
      socket.off('call-accepted', onAccepted);
      socket.off('call-rejected', onRejected);
      socket.off('call-ended', onEnded);
    };
  }, []);

  /* ─── Start a call ─── */
  const startCall = (type) => {
    if (!other?._id) return;
    const rn = makeRoomName(conversationId);
    roomNameRef.current = rn;
    setCallType(type);
    setCallState('outgoing');
    getSocket()?.emit('call-offer', { toUserId: other._id, callType: type, roomName: rn });
  };

  const acceptCall = () => {
    const rn = incomingCall?.roomName;
    roomNameRef.current = rn;
    getSocket()?.emit('call-answer', { toUserId: incomingCall?.fromUserId, roomName: rn });
    setCallState('connected');
    setIncomingCall(null);
  };

  const rejectCall = () => {
    getSocket()?.emit('call-reject', { toUserId: incomingCall?.fromUserId });
    setCallState('idle');
    setIncomingCall(null);
    roomNameRef.current = null;
  };

  const endCall = () => {
    const toId = incomingCall?.fromUserId || other?._id;
    getSocket()?.emit('call-end', { toUserId: toId });
    setCallState('idle');
    setIncomingCall(null);
    roomNameRef.current = null;
  };

  /* ─── Typing ─── */
  const handleTextChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    socket?.emit('typing', { conversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('stop-typing', { conversationId });
    }, 1500);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10MB.');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ─── Send text ─── */
  const sendTextMessage = useCallback(() => {
    if (!text.trim() || isSending) return;
    getSocket()?.emit('send-message', { conversationId, content: text.trim(), type: 'text' }, (res) => {
      if (res?.error) toast.error(res.error);
    });
    setText('');
    getSocket()?.emit('stop-typing', { conversationId });
  }, [text, conversationId, isSending]);

  /* ─── Send image ─── */
  const sendImage = async () => {
    if (!imageFile) return;
    setIsSending(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('conversationId', conversationId);
      fd.append('type', 'image');
      const { data: newMessage } = await axiosInstance.post('/message/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addMessage(newMessage);
      updateLastMessage(conversationId, newMessage);
      setImageFile(null);
      setImagePreview('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch {
      toast.error('Failed to send image.');
    } finally {
      setIsSending(false);
    }
  };

  /* ─── Send voice ─── */
  const sendVoice = async () => {
    if (!audioBlob) return;
    setIsSending(true);
    try {
      const fd = new FormData();
      fd.append('file', audioBlob, 'voice.webm');
      fd.append('conversationId', conversationId);
      fd.append('type', 'voice');
      const { data: newMessage } = await axiosInstance.post('/message/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addMessage(newMessage);
      updateLastMessage(conversationId, newMessage);
      clearAudio();
    } catch {
      toast.error('Failed to send voice note.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  /* ── Shared icon button style ── */
  const iconBtn = (active = false) =>
    `w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150 cursor-pointer ${
      active
        ? 'border-[#7c6dfa]/30 bg-[#7c6dfa]/10 text-[#7c6dfa] dark:text-white'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
    }`;

  return (
    <>
      {/* ── Call Modal ── */}
      {callState !== 'idle' && (
        <CallModal
          state={callState}
          callType={callType}
          roomName={roomNameRef.current}
          other={
            callState === 'incoming' && incomingCall
              ? {
                  _id: incomingCall.fromUserId,
                  username: incomingCall.fromUsername,
                  nickname: incomingCall.fromUsername,
                  avatar: incomingCall.fromAvatar,
                }
              : other
          }
          localUser={user}
          onEnd={endCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* ── OUTER WRAPPER – applies chat gradient theme ── */}
      <div
        className={`flex flex-row h-full overflow-hidden w-full ${chatThemeClass}`}
        style={{ background: 'var(--bg-app)' }}
      >

        {/* ── MAIN CHAT COLUMN ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 flex-shrink-0"
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <img
                  src={getAvatar(other)}
                  alt={other?.username}
                  className="w-9 h-9 rounded-xl object-cover"
                  style={{ border: '1px solid var(--border-primary)' }}
                />
                {other?.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 rounded-full shadow-lg"
                    style={{ borderColor: 'var(--bg-surface)' }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {other?.nickname || other?.username}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isOtherTyping ? (
                    <span style={{ color: 'var(--accent)' }}>typing…</span>
                  ) : other?.isOnline ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    <span>Last seen {formatLastSeen(other?.lastSeen)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {config?.features?.voiceCalls !== false && (
                <button
                  onClick={() => startCall('audio')}
                  disabled={callState !== 'idle'}
                  className={iconBtn()}
                  style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-panel)' }}
                  title="Voice Call"
                >
                  <Phone size={14} />
                </button>
              )}
              {config?.features?.videoCalls !== false && (
                <button
                  onClick={() => startCall('video')}
                  disabled={callState !== 'idle'}
                  className={iconBtn()}
                  style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-panel)' }}
                  title="Video Call"
                >
                  <Video size={14} />
                </button>
              )}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={iconBtn(showInfo)}
                title="Conversation Info"
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div
            className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-3 chat-messages-area"
          >
            {convMessages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }}
                  >
                    <MessageSquareQuote size={22} style={{ color: 'var(--accent)' }} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>Say hello to {other?.nickname || other?.username}!</p>
                </div>
              </div>
            )}
            {convMessages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
            {isOtherTyping && (
              <div className="flex items-center gap-2 mb-2 fade-in">
                <img src={getAvatar(other)} alt="" className="w-7 h-7 rounded-lg object-cover" />
                <div className="bubble-received flex items-center gap-1.5 py-3.5 px-4">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div
              className="px-4 md:px-6 py-3 flex items-center gap-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface)' }}
            >
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 w-auto rounded-lg object-cover" style={{ border: '1px solid var(--border-primary)' }} />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(''); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
              <button onClick={sendImage} disabled={isSending} className="btn-primary py-2 px-4 text-xs">
                {isSending ? 'Sending…' : 'Send Image'}
              </button>
            </div>
          )}

          {/* Voice note preview */}
          {audioUrl && !isRecording && (
            <div
              className="px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface)' }}
            >
              <audio controls src={audioUrl} className="h-7" style={{ filter: 'invert(1) opacity(0.8)', maxWidth: 180 }} />
              <button onClick={sendVoice} disabled={isSending} className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                <Send size={11} />{isSending ? 'Sending…' : 'Send'}
              </button>
              <button onClick={clearAudio} className="btn-ghost py-2 px-3 text-xs flex items-center justify-center">
                <Trash2 size={12} />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div
            className="px-3 md:px-4 py-3 md:py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-primary)', background: 'var(--bg-surface)' }}
          >
            <div
              className="flex items-center rounded-xl px-3 py-1.5 transition-all"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
            >
              {isBlocked ? (
                <div className="flex-1 text-center text-red-400 text-xs font-mono py-2 flex items-center justify-center gap-2 select-none">
                  <ShieldAlert size={14} className="text-red-400" /> You have blocked this user. Unblock to send messages.
                </div>
              ) : (
                <>
                  {config?.features?.imageSharing !== false && (
                    <>
                      <button
                        id="image-btn"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Attach Image"
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
                      >
                        <ImageIcon size={16} />
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </>
                  )}

                  {!isRecording && !audioUrl && (
                    <textarea
                      id="message-input"
                      className="flex-1 resize-none bg-transparent border-none outline-none py-1.5 px-3 text-xs font-sans"
                      style={{ color: 'var(--text-primary)', maxHeight: 80, minHeight: 28 }}
                      rows={1}
                      placeholder={`Message ${other?.nickname || other?.username}…`}
                      value={text}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                    />
                  )}

                  {isRecording && (
                    <div className="flex-1 flex items-center gap-3 px-3 py-1 bg-red-500/5 rounded-lg border border-red-500/20 mx-2 animate-pulse">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${10 + ((i * 5 + 3) % 12)}px`, animationDelay: `${i * 0.12}s`, background: '#ef4444' }} />
                        ))}
                      </div>
                      <span className="text-red-400 text-xs font-mono font-medium">{formattedDuration}</span>
                      <button onClick={cancelRecording} className="ml-auto text-slate-500 hover:text-red-400 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {!text.trim() && !imageFile ? (
                    config?.features?.voiceNotes !== false && (
                      <button
                        id="mic-btn"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                          isRecording ? 'bg-red-500 text-white' : ''
                        }`}
                        style={!isRecording ? { color: 'var(--text-muted)' } : {}}
                        onMouseEnter={(e) => { if (!isRecording) { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; } }}
                        onMouseLeave={(e) => { if (!isRecording) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; } }}
                        title={isRecording ? 'Stop Recording' : 'Record Voice'}
                      >
                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )
                  ) : (
                    <button
                      id="send-btn"
                      onClick={sendTextMessage}
                      disabled={!text.trim() || isSending}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, var(--accent), #fa6d9b)' }}
                      title="Send Message"
                    >
                      <Send size={13} className="text-white" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PROFILE PANEL ── */}
        {showInfo && (
          <div
            className="w-[220px] md:w-[240px] h-full flex flex-col overflow-y-auto p-4 md:p-5 animate-slide-in-right z-30 flex-shrink-0"
            style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-primary)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-mono tracking-[2.5px] uppercase" style={{ color: 'var(--text-muted)' }}>Profile Info</h3>
              <button onClick={() => setShowInfo(false)} className="cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center pb-5 mb-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <img src={getAvatar(other)} alt="" className="w-16 h-16 rounded-xl object-cover mb-3.5" style={{ border: '1px solid var(--border-primary)' }} />
              <h4 className="text-sm font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{other?.nickname || other?.username}</h4>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono border ${
                other?.isOnline
                  ? 'bg-green-500/5 text-green-400 border-green-500/20'
                  : 'text-slate-500 border-slate-500/20'
              }`} style={!other?.isOnline ? { background: 'var(--bg-panel)' } : {}}>
                <span className={`w-1.5 h-1.5 rounded-full ${other?.isOnline ? 'bg-green-400' : 'bg-slate-600'}`} />
                {other?.isOnline ? 'online' : 'offline'}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[9px] font-mono tracking-wider uppercase block mb-1" style={{ color: 'var(--text-muted)' }}>About</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {other?.bio || <span className="italic" style={{ color: 'var(--text-muted)' }}>No bio written yet.</span>}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-wider uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={10} /> Email
                </span>
                <p className="text-xs truncate select-text" style={{ color: 'var(--text-secondary)' }} title={other?.email}>{other?.email}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-wider uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <ShieldAlert size={10} /> Account Type
                </span>
                <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {other?.isAdmin ? 'Administrator' : 'General Member'}
                </p>
              </div>
              {other?.createdAt && (
                <div>
                  <span className="text-[9px] font-mono tracking-wider uppercase mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={10} /> Member Since
                  </span>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(other.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Privacy Section */}
              <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <span className="text-[9px] font-mono tracking-wider uppercase block mb-2" style={{ color: 'var(--text-muted)' }}>Privacy</span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleToggleMute}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer"
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {isChatMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      {isChatMuted ? 'Unmute Chat' : 'Mute Chat'}
                    </span>
                    {isChatMuted && <span className="text-[9px] font-bold" style={{ color: 'var(--accent)' }}>MUTED</span>}
                  </button>
                  <button
                    onClick={handleToggleBlock}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer ${
                      isBlocked
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400'
                    }`}
                    style={!isBlocked ? { background: 'var(--bg-panel)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' } : {}}
                  >
                    <span className="flex items-center gap-2">
                      <Ban size={12} />
                      {isBlocked ? 'Unblock User' : 'Block User'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center text-[9px] font-mono uppercase tracking-widest mt-6" style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
              ECHO RESOUND
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWindow;
