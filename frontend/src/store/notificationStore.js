import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  echoRequests: [],
  unreadCount: 0,

  setEchoRequests: (requests) =>
    set({ echoRequests: requests, unreadCount: requests.length }),

  addEchoRequest: (request) =>
    set((s) => ({
      echoRequests: [request, ...s.echoRequests],
      unreadCount: s.unreadCount + 1,
    })),

  removeEchoRequest: (requestId) =>
    set((s) => ({
      echoRequests: s.echoRequests.filter((r) => r._id !== requestId),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  clearUnread: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
