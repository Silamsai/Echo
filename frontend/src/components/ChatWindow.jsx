import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Send, Image as ImageIcon, X, Mic, MicOff, Trash2,
  Info, Calendar, Mail, ShieldAlert, ArrowLeft,
  Phone, Video,
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

/* ─── Generate a stable room name for a conversation ─── */
const makeRoomName = (conversationId) => `echo_room_${conversationId}`;

const ChatWindow = ({ conversation, onBack }) => {
  const { user, updateUser } = useAuthStore();
  const { messages, setMessages, typingUsers, addMessage, updateLastMessage } = useChatStore();
  const { config } = useConfigStore();

  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  /* ─── Call state ─── */
  // callState: 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('audio');     // 'audio' | 'video'
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, fromUsername, fromAvatar, callType, roomName }
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

  /* ─── Block / Mute handlers ─── */
  const handleToggleMute = async () => {
    try {
      const ep = isChatMuted ? `/user/unmute/${conversation._id}` : `/user/mute/${conversation._id}`;
      const { data } = await axiosInstance.put(ep);
      updateUser(data);
      toast.success(isChatMuted ? 'Chat unmuted ✅' : 'Chat muted 🔕');
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
      toast.success(isBlocked ? 'User unblocked ✅' : 'User blocked 🚫');
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
      // The callee accepted → move caller to 'connected'
      roomNameRef.current = data.roomName;
      setCallState('connected');
      toast.success('Call connected! 🟢');
    };

    const onRejected = () => {
      setCallState('idle');
      roomNameRef.current = null;
      toast('Call declined', { icon: '📵' });
    };

    const onEnded = () => {
      setCallState('idle');
      roomNameRef.current = null;
      toast('Call ended', { icon: '📴' });
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

  /* ─── Start a call (caller) ─── */
  const startCall = (type) => {
    if (!other?._id) return;
    const rn = makeRoomName(conversationId);
    roomNameRef.current = rn;
    setCallType(type);
    setCallState('outgoing');

    const socket = getSocket();
    socket?.emit('call-offer', {
      toUserId: other._id,
      callType: type,
      roomName: rn,
    });
  };

  /* ─── Accept incoming call (callee) ─── */
  const acceptCall = () => {
    const rn = incomingCall?.roomName;
    roomNameRef.current = rn;

    const socket = getSocket();
    socket?.emit('call-answer', {
      toUserId: incomingCall?.fromUserId,
      roomName: rn,
    });

    setCallState('connected');
    setIncomingCall(null);
  };

  /* ─── Reject incoming call (callee) ─── */
  const rejectCall = () => {
    const socket = getSocket();
    socket?.emit('call-reject', { toUserId: incomingCall?.fromUserId });
    setCallState('idle');
    setIncomingCall(null);
    roomNameRef.current = null;
  };

  /* ─── End an active / outgoing call ─── */
  const endCall = () => {
    const socket = getSocket();
    const toId = incomingCall?.fromUserId || other?._id;
    socket?.emit('call-end', { toUserId: toId });
    setCallState('idle');
    setIncomingCall(null);
    roomNameRef.current = null;
  };

  /* ─── Typing indicator ─── */
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
    const socket = getSocket();
    socket?.emit('send-message', { conversationId, content: text.trim(), type: 'text' }, (res) => {
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

  return (
    <>
      {/* ── LiveKit Call Modal (portal-like, fixed overlay) ── */}
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

      <div className="flex flex-row h-full overflow-hidden w-full" style={{ background: '#0a0a0f' }}>

        {/* ── MAIN CHAT COLUMN ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/5 bg-[#111118] flex-shrink-0">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0 cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <img
                  src={getAvatar(other)}
                  alt={other?.username}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
                />
                {other?.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#111118] rounded-full shadow-lg" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {other?.nickname || other?.username}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {isOtherTyping ? (
                    <span className="text-[#7c6dfa]">typing...</span>
                  ) : other?.isOnline ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    <span>Last seen {formatLastSeen(other?.lastSeen)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Call */}
              {config?.features?.voiceCalls !== false && (
                <button
                  onClick={() => startCall('audio')}
                  disabled={callState !== 'idle'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#16161f] text-slate-500 hover:text-green-400 hover:border-green-500/20 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Voice Call"
                >
                  <Phone size={14} />
                </button>
              )}

              {/* Video Call */}
              {config?.features?.videoCalls !== false && (
                <button
                  onClick={() => startCall('video')}
                  disabled={callState !== 'idle'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-[#16161f] text-slate-500 hover:text-[#7c6dfa] hover:border-[#7c6dfa]/20 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Video Call"
                >
                  <Video size={14} />
                </button>
              )}

              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150 cursor-pointer ${
                  showInfo
                    ? 'text-white border-[#7c6dfa]/30 bg-[#7c6dfa]/10'
                    : 'text-slate-500 border-white/5 bg-[#16161f] hover:text-slate-300'
                }`}
                title="Conversation Info"
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div
            className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-3"
            style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d16 100%)' }}
          >
            {convMessages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500 font-mono text-xs">
                  <div className="text-4xl mb-3">👋</div>
                  <p>Say hello to {other?.nickname || other?.username}!</p>
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
            <div className="px-4 md:px-6 py-3 border-t border-white/5 bg-[#0d0d16]/80 backdrop-blur-md flex items-center gap-4 flex-shrink-0">
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 w-auto rounded-lg object-cover border border-white/10" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(''); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
              <button onClick={sendImage} disabled={isSending} className="btn-primary py-2 px-4 text-xs">
                {isSending ? 'Sending...' : 'Send Image'}
              </button>
            </div>
          )}

          {/* Voice note preview */}
          {audioUrl && !isRecording && (
            <div className="px-4 md:px-6 py-3 border-t border-white/5 flex items-center gap-3 bg-[#0d0d16]/80 backdrop-blur-md flex-shrink-0">
              <audio controls src={audioUrl} className="h-7" style={{ filter: 'invert(1) opacity(0.8)', maxWidth: 180 }} />
              <button onClick={sendVoice} disabled={isSending} className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                <Send size={11} />{isSending ? 'Sending...' : 'Send'}
              </button>
              <button onClick={clearAudio} className="btn-ghost py-2 px-3 text-xs flex items-center justify-center">
                <Trash2 size={12} />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="px-3 md:px-4 py-3 md:py-4 border-t border-white/5 bg-[#111118]/90 flex-shrink-0">
            <div className="flex items-center bg-[#16161f] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-[#7c6dfa]/35 transition-all">
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#7c6dfa] hover:bg-[#7c6dfa]/10 transition-all flex-shrink-0 cursor-pointer"
                        title="Attach Image"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </>
                  )}

                  {!isRecording && !audioUrl && (
                    <textarea
                      id="message-input"
                      className="flex-1 resize-none bg-transparent border-none outline-none py-1.5 px-3 text-xs text-[#e8e6ff] placeholder-slate-600 font-sans"
                      rows={1}
                      placeholder={`Message ${other?.nickname || other?.username}...`}
                      value={text}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      style={{ maxHeight: 80, minHeight: 28 }}
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
                          isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-[#7c6dfa] hover:bg-[#7c6dfa]/10'
                        }`}
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/10"
                      style={{ background: 'linear-gradient(135deg, #7c6dfa, #fa6d9b)' }}
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
          <div className="w-[220px] md:w-[240px] h-full bg-[#111118] border-l border-white/5 flex flex-col overflow-y-auto p-4 md:p-5 animate-slide-in-right z-30 flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-mono tracking-[2.5px] text-slate-500 uppercase">Profile Info</h3>
              <button onClick={() => setShowInfo(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center pb-5 border-b border-white/5 mb-5">
              <img src={getAvatar(other)} alt="" className="w-16 h-16 rounded-xl object-cover mb-3.5 border border-white/10" />
              <h4 className="text-sm font-extrabold text-[#e8e6ff] leading-none">{other?.nickname || other?.username}</h4>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono border ${
                other?.isOnline
                  ? 'bg-green-500/5 text-green-400 border-green-500/20'
                  : 'bg-slate-500/5 text-slate-500 border-slate-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${other?.isOnline ? 'bg-green-400' : 'bg-slate-600'}`} />
                {other?.isOnline ? 'online' : 'offline'}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-1">About</span>
                <p className="text-xs text-[#e8e6ff] leading-relaxed">
                  {other?.bio || <span className="text-slate-600 italic">No bio written yet.</span>}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-1.5 flex items-center gap-1.5">
                  <Mail size={10} className="text-slate-600" /> Email
                </span>
                <p className="text-xs text-slate-400 truncate select-text" title={other?.email}>{other?.email}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert size={10} className="text-slate-600" /> Account Type
                </span>
                <p className="text-xs text-slate-400 font-mono">
                  {other?.isAdmin ? 'Administrator' : 'General Member'}
                </p>
              </div>
              {other?.createdAt && (
                <div>
                  <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-1.5 flex items-center gap-1.5">
                    <Calendar size={10} className="text-slate-600" /> Member Since
                  </span>
                  <p className="text-xs text-slate-400 font-mono">
                    {new Date(other.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Privacy Section */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-2">Privacy Settings</span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleToggleMute}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-slate-300"
                  >
                    <span className="flex items-center gap-2">🔕 {isChatMuted ? 'Unmute Chat' : 'Mute Chat'}</span>
                    {isChatMuted && <span className="text-[9px] text-[#7c6dfa] font-bold">MUTED</span>}
                  </button>
                  <button
                    onClick={handleToggleBlock}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer ${
                      isBlocked
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">🚫 {isBlocked ? 'Unblock User' : 'Block User'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-center text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-6">
              ECHO RESOUND
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideInR {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in-right {
            animation: slideInR 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatWindow;
