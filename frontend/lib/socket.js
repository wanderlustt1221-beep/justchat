// frontend/lib/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;
const readyCallbacks = [];

export const initializeSocket = (token) => {
  if (socket) {
    console.log('[Socket] Disconnecting existing socket before re-init');
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    // Flush any callbacks waiting for a live socket
    readyCallbacks.forEach((cb) => cb(socket));
    readyCallbacks.length = 0;
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempt(s)');
  });

  return socket;
};

export const getSocket = () => socket;

/**
 * Calls `cb(socket)` immediately if the socket is already connected,
 * or queues it to run as soon as the socket emits 'connect'.
 */
export const onSocketReady = (cb) => {
  if (socket && socket.connected) {
    cb(socket);
  } else {
    readyCallbacks.push(cb);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};