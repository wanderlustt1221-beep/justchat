'use client';
// frontend/context/ChatContext.js

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket, onSocketReady } from '@/lib/socket';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

export const ChatProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  // Always-current reference — socket callbacks read this without needing
  // to be re-registered every time activeChat changes.
  const activeChatRef = useRef(null);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ─── Data fetchers ────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
      const onlineStatus = {};
      response.data.data.forEach((u) => { onlineStatus[u._id] = u.isOnline; });
      setOnlineUsers((prev) => ({ ...prev, ...onlineStatus }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, []);

  const createOrGetChat = useCallback(async (participantId) => {
    try {
      const response = await api.post('/chats', { participantId });
      const chat = response.data.data;
      setChats((prev) => {
        const exists = prev.find((c) => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
      return null;
    }
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    setMessages([]);
    try {
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data.data);
      console.log('[ChatContext] fetchMessages:', chatId, response.data.data.length, 'msgs');
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  const sendMessage = useCallback(async (chatId, text, image) => {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      toast.error('Not connected. Please refresh.');
      return;
    }
    console.log('[ChatContext] emitting send_message to chatId:', chatId);
    socket.emit('send_message', { chatId, text, image });
  }, []);

  const uploadImage = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  // Uses onSocketReady() so listeners attach even if this effect runs before
  // the socket has emitted 'connect' for the first time.

  useEffect(() => {
    const attach = (socket) => {
      console.log('[ChatContext] attaching socket listeners on socket:', socket.id);

      // Remove stale listeners first
      socket.off('receive_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('user_online');
      socket.off('user_offline');

      socket.on('receive_message', (message) => {
        console.log('[ChatContext] receive_message:', message._id, 'chatId:', message.chatId);

        // Update sidebar preview
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === message.chatId
              ? { ...chat, lastMessage: message, updatedAt: message.createdAt }
              : chat
          )
        );

        // Only inject into visible messages list if this chat is open
        if (activeChatRef.current?._id === message.chatId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev; // dedup
            return [...prev, message];
          });
        }
      });

      socket.on('typing', ({ chatId, userId, userName }) => {
        setTypingUsers((prev) => ({ ...prev, [chatId]: { userId, userName } }));
      });

      socket.on('stop_typing', ({ chatId }) => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[chatId];
          return next;
        });
      });

      socket.on('user_online', ({ userId }) => {
        setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
      });

      socket.on('user_offline', ({ userId }) => {
        setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
      });

      // Re-attach after each reconnect
      socket.on('connect', () => {
        console.log('[ChatContext] reconnected — re-attaching listeners');
        attach(socket);
      });
    };

    // Attach now if socket already connected, otherwise queue for when it is
    onSocketReady(attach);

    return () => {
      const s = getSocket();
      if (s) {
        s.off('receive_message');
        s.off('typing');
        s.off('stop_typing');
        s.off('user_online');
        s.off('user_offline');
        // Note: intentionally leave 'connect' listener; it's harmless after unmount
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    users, chats, activeChat, messages, typingUsers, onlineUsers,
    setActiveChat, fetchUsers, fetchChats, createOrGetChat,
    fetchMessages, sendMessage, uploadImage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};