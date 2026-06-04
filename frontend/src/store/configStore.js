import { create } from 'zustand';
import axiosInstance from '../utils/axiosInstance';

const useConfigStore = create((set) => ({
  config: null,
  isLoading: false,

  fetchConfig: async () => {
    try {
      const { data } = await axiosInstance.get('/config');
      set({ config: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  },

  updateConfig: async (updates) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.put('/config', updates);
      set({ config: data.config, isLoading: false });
      return { success: true, config: data.config };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        message: err.response?.data?.message || 'Update failed.',
      };
    }
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await axiosInstance.post('/config/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, url: data.url };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Upload failed.',
      };
    }
  },
}));

export default useConfigStore;
