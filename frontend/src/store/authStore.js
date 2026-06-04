import { create } from 'zustand';
import axiosInstance from '../utils/axiosInstance';
import { initSocket, disconnectSocket } from '../socket/socket';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('echo_token') || null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem('echo_token');
    if (!token) return set({ isInitialized: true });
    try {
      const { data } = await axiosInstance.get('/auth/me');
      set({ user: data, token, isInitialized: true });
      initSocket(token);
    } catch {
      localStorage.removeItem('echo_token');
      set({ user: null, token: null, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('echo_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      initSocket(data.token);
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Login failed.' };
    }
  },

  loginWithToken: (token, user) => {
    localStorage.setItem('echo_token', token);
    set({ user, token });
    initSocket(token);
  },

  logout: () => {
    localStorage.removeItem('echo_token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

  setLoading: (v) => set({ isLoading: v }),
}));

export default useAuthStore;
