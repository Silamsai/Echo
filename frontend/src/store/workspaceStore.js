import { create } from 'zustand';
import axiosInstance from '../utils/axiosInstance';

const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    activeWorkspace: null,
    workspaceChannels: [],
    isLoading: false,

    setWorkspaces: (workspaces) => set({ workspaces }),
    setActiveWorkspace: (activeWorkspace) => {
        set({ activeWorkspace });
        if (activeWorkspace) {
            get().fetchWorkspaceChannels(activeWorkspace._id);
        } else {
            set({ workspaceChannels: [] });
        }
    },

    fetchWorkspaces: async () => {
        try {
            set({ isLoading: true });
            const { data } = await axiosInstance.get('/workspace');
            set({ workspaces: data, isLoading: false });
        } catch (err) {
            set({ isLoading: false });
            console.error('Failed to fetch workspaces', err);
        }
    },

    fetchWorkspaceChannels: async (workspaceId) => {
        try {
            const { data } = await axiosInstance.get(`/workspace/${workspaceId}/channels`);
            set({ workspaceChannels: data });
        } catch (err) {
            console.error('Failed to fetch workspace channels', err);
        }
    },

    createWorkspace: async (name, description) => {
        try {
            const { data } = await axiosInstance.post('/workspace', { name, description });
            set((state) => ({
                workspaces: [data.workspace, ...state.workspaces],
                activeWorkspace: data.workspace,
            }));
            if (data.defaultChannel) {
                set({ workspaceChannels: [data.defaultChannel] });
            }
            return data;
        } catch (err) {
            console.error('Failed to create workspace', err);
            throw err;
        }
    },

    joinWorkspace: async (code) => {
        try {
            const { data } = await axiosInstance.post('/workspace/join', { code });
            set((state) => ({
                workspaces: [data.workspace, ...state.workspaces],
                activeWorkspace: data.workspace,
            }));
            return data;
        } catch (err) {
            console.error('Failed to join workspace', err);
            throw err;
        }
    },

    createChannel: async (workspaceId, name) => {
        try {
            const { data } = await axiosInstance.post(`/workspace/${workspaceId}/channels`, { name });
            set((state) => ({
                workspaceChannels: [...state.workspaceChannels, data.channel],
            }));
            return data;
        } catch (err) {
            console.error('Failed to create channel', err);
            throw err;
        }
    },

    addMember: async (workspaceId, userId) => {
        try {
            const { data } = await axiosInstance.post(`/workspace/${workspaceId}/member`, { userId });
            // Update workspaces array with new member count/details
            set((state) => ({
                workspaces: state.workspaces.map((w) => (w._id === workspaceId ? data.workspace : w)),
                activeWorkspace: state.activeWorkspace?._id === workspaceId ? data.workspace : state.activeWorkspace,
            }));
            return data;
        } catch (err) {
            console.error('Failed to add member to workspace', err);
            throw err;
        }
    },
}));

export default useWorkspaceStore;
