import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const initSocket = (token) => {
  if (socket) socket.disconnect();

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('🟢 Socket connected'));
  socket.on('disconnect', () => console.log('🔴 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
