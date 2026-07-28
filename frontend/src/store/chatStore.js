import { create } from 'zustand';

const useChatStore = create((set) => ({
  conversations: [],
  activeConversation: null,
  messages: {},       // { [conversationId]: Message[] }
  typingUsers: {},    // { [conversationId]: Set of userIds }
  onlineUsers: new Set(),

  setConversations: (convs) => set({ conversations: convs }),

  addOrUpdateConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.find((c) => c._id === conv._id);
      if (exists) {
        return {
          conversations: s.conversations.map((c) => (c._id === conv._id ? { ...c, ...conv } : c)),
        };
      }
      return { conversations: [conv, ...s.conversations] };
    }),

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),

  addMessage: (msg) =>
    set((s) => {
      const convId = msg.conversation?._id || msg.conversation;
      const existing = s.messages[convId] || [];
      const alreadyExists = existing.find((m) => m._id === msg._id);
      if (alreadyExists) return s;
      return { messages: { ...s.messages, [convId]: [...existing, msg] } };
    }),

  markMessageSeen: (messageId, seenAt) =>
    set((s) => {
      const updated = {};
      for (const [convId, msgs] of Object.entries(s.messages)) {
        updated[convId] = msgs.map((m) =>
          m._id === messageId ? { ...m, seen: true, seenAt } : m
        );
      }
      return { messages: updated };
    }),

  updateLastMessage: (conversationId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
          : c
      ),
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = new Set(s.typingUsers[conversationId] || []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typingUsers: { ...s.typingUsers, [conversationId]: current } };
    }),

  setUserOnline: (userId) =>
    set((s) => {
      const updated = new Set(s.onlineUsers);
      updated.add(userId);
      return { onlineUsers: updated };
    }),

  setUserOffline: (userId) =>
    set((s) => {
      const updated = new Set(s.onlineUsers);
      updated.delete(userId);
      return { onlineUsers: updated };
    }),

  updateUserPresence: (userId, isOnline, lastSeen) =>
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        participants: c.participants?.map((p) =>
          p._id === userId ? { ...p, isOnline, lastSeen } : p
        ),
      })),
    })),

  deleteConversationStore: (convId) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c._id !== convId),
      activeConversation: s.activeConversation?._id === convId ? null : s.activeConversation,
    })),
}));

export default useChatStore;
