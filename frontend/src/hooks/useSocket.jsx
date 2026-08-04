import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import useChatStore from '../store/chatStore';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { playUiChime, showDesktopNotification } from '../utils/runtimeAlerts';
import {
  isDesktopNotificationsEnabled,
  isSoundEnabled,
} from '../utils/userPreferences';
import { getUserAvatar } from '../utils/avatar';

const useSocket = () => {
  const { user } = useAuthStore();
  const {
    addMessage, updateLastMessage, setTyping,
    setUserOnline, setUserOffline, updateUserPresence, markMessageSeen,
    addOrUpdateConversation,
  } = useChatStore();
  const { addEchoRequest } = useNotificationStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // ── New message ─────────────────────────────────────────────────────────
    const onNewMessage = (message) => {
      const convId = message.conversation?._id || message.conversation;
      addMessage(message);
      updateLastMessage(convId, message);

      const activeConversationId = useChatStore.getState().activeConversation?._id;
      const isOwnMessage = (message.sender?._id || message.sender) === user?._id;
      const senderName = message.sender?.nickname || message.sender?.username || 'Someone';
      const preview = message.type === 'text'
        ? message.content
        : message.type === 'image'
          ? 'Sent an image'
          : 'Sent a voice note';

      if (!isOwnMessage && isSoundEnabled()) {
        playUiChime();
      }

      if (
        !isOwnMessage &&
        isDesktopNotificationsEnabled() &&
        document.hidden &&
        activeConversationId !== convId
      ) {
        showDesktopNotification({
          title: senderName,
          body: preview || 'New message received',
          icon: getUserAvatar(message.sender),
          tag: `message-${convId}`,
        });
      }
    };

    // ── Echo request received ────────────────────────────────────────────────
    const onEchoRequestReceived = ({ request }) => {
      addEchoRequest(request);
      const senderName = request?.sender?.nickname || request?.sender?.username || 'Someone';

      if (isSoundEnabled()) {
        playUiChime();
      }

      if (isDesktopNotificationsEnabled() && document.hidden) {
        showDesktopNotification({
          title: 'New connection request',
          body: `${senderName} wants to connect with you.`,
          icon: getUserAvatar(request?.sender),
          tag: `request-${request?._id}`,
        });
      }

      toast.custom(
        (t) => (
          <div
            className={`glass rounded-xl p-4 flex items-center gap-3 ${t.visible ? 'fade-in' : 'opacity-0'}`}
            style={{ minWidth: 280 }}
          >
            <img
              src={getUserAvatar(request?.sender)}
              alt=""
              className="w-10 h-10 rounded-full"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="font-semibold text-sm text-white">{request?.sender?.username}</p>
              <p className="text-xs text-slate-400">Sent you a connection request.</p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    };

    // ── Echo accepted ────────────────────────────────────────────────────────
    const onEchoAccepted = ({ conversation, acceptedBy }) => {
      if (conversation) {
        addOrUpdateConversation(conversation);
        socket.emit('join-conversation', { conversationId: conversation._id });
      }
      toast.success(`${acceptedBy?.username} accepted your connection request.`);
    };

    // ── New Group/Workspace Channel ───────────────────────────────────────────
    const onNewConversation = (conversation) => {
      if (conversation) {
        addOrUpdateConversation(conversation);
        socket.emit('join-conversation', { conversationId: conversation._id });
      }
    };

    // ── Typing ───────────────────────────────────────────────────────────────
    const onTyping = ({ userId, conversationId }) => {
      setTyping(conversationId, userId, true);
    };
    const onStopTyping = ({ userId, conversationId }) => {
      setTyping(conversationId, userId, false);
    };

    // ── User online/offline ──────────────────────────────────────────────────
    const onUserOnline = ({ userId }) => {
      setUserOnline(userId);
      updateUserPresence(userId, true, null);
    };
    const onUserOffline = ({ userId, lastSeen }) => {
      setUserOffline(userId);
      updateUserPresence(userId, false, lastSeen);
    };

    // ── Message seen ─────────────────────────────────────────────────────────
    const onMessageSeen = ({ messageId, seenAt }) => {
      markMessageSeen(messageId, seenAt);
    };

    // ── Force logout (admin ban) ──────────────────────────────────────────────
    const onForceLogout = ({ reason }) => {
      toast.error(reason || 'You have been logged out.');
      setTimeout(() => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }, 2000);
    };

    // ── Conversation deleted ──────────────────────────────────────────────────
    const onConversationDeleted = ({ conversationId }) => {
      useChatStore.getState().deleteConversationStore(conversationId);
    };

    socket.on('new-message', onNewMessage);
    socket.on('echo-request-received', onEchoRequestReceived);
    socket.on('echo-accepted', onEchoAccepted);
    socket.on('new-conversation', onNewConversation);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);
    socket.on('user-online', onUserOnline);
    socket.on('user-offline', onUserOffline);
    socket.on('message-seen', onMessageSeen);
    socket.on('force-logout', onForceLogout);
    socket.on('conversation-deleted', onConversationDeleted);
    socket.on('poll-updated', onNewMessage);

    return () => {
      socket.off('new-message', onNewMessage);
      socket.off('echo-request-received', onEchoRequestReceived);
      socket.off('echo-accepted', onEchoAccepted);
      socket.off('new-conversation', onNewConversation);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
      socket.off('user-online', onUserOnline);
      socket.off('user-offline', onUserOffline);
      socket.off('message-seen', onMessageSeen);
      socket.off('force-logout', onForceLogout);
      socket.off('conversation-deleted', onConversationDeleted);
      socket.off('poll-updated', onNewMessage);
    };
  }, [
    user,
    addEchoRequest,
    addMessage,
    addOrUpdateConversation,
    markMessageSeen,
    setTyping,
    setUserOffline,
    setUserOnline,
    updateLastMessage,
    updateUserPresence
  ]);
};

export default useSocket;
