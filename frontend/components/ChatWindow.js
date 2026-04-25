'use client';
// frontend/components/ChatWindow.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { getSocket } from '@/lib/socket';
import { formatMessageTime, formatLastSeen } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';

export default function ChatWindow({ selectedUser, onBack }) {
  const { user } = useAuth();
  const {
    activeChat,
    messages,
    typingUsers,
    onlineUsers,
    createOrGetChat,
    fetchMessages,
    sendMessage,
    uploadImage,
    setActiveChat,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const initializingForRef = useRef(null);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // ─── Chat init on user select ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser) return;

    const prevChat = activeChat;
    if (prevChat && isTypingRef.current) {
      const socket = getSocket();
      if (socket?.connected) socket.emit('stop_typing', { chatId: prevChat._id });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setMessageText('');
    setSelectedImage(null);
    setImagePreview(null);
    setShowEmojiPicker(false);

    const initChat = async () => {
      const targetUserId = selectedUser._id;
      initializingForRef.current = targetUserId;

      const chat = await createOrGetChat(targetUserId);
      if (!chat) return;
      if (initializingForRef.current !== targetUserId) return;

      setActiveChat(chat);
      await fetchMessages(chat._id);
    };

    initChat();
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Typing indicator ────────────────────────────────────────────────────
  const handleTyping = useCallback(() => {
    if (!activeChat) return;
    const socket = getSocket();
    if (!socket?.connected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { chatId: activeChat._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        const s = getSocket();
        if (s?.connected) s.emit('stop_typing', { chatId: activeChat._id });
      }
    }, 2000);
  }, [activeChat]);

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedImage) || !activeChat) return;

    let imageUrl = null;
    if (selectedImage) {
      setUploading(true);
      imageUrl = await uploadImage(selectedImage);
      setUploading(false);
      if (!imageUrl) return;
    }

    await sendMessage(activeChat._id, messageText.trim(), imageUrl);

    setMessageText('');
    setSelectedImage(null);
    setImagePreview(null);
    setShowEmojiPicker(false);

    if (isTypingRef.current) {
      const socket = getSocket();
      if (socket?.connected) socket.emit('stop_typing', { chatId: activeChat._id });
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Empty state ─────────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="flex-1 bg-bg-chat hidden md:flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="w-24 h-24 mx-auto mb-6 opacity-30">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-text-primary mb-1">ChatFlow</p>
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const isUserOnline = onlineUsers[selectedUser._id];
  const typingUser = typingUsers[activeChat?._id];

  return (
    /*
     * CRITICAL MOBILE FIX:
     * - flex-1 ensures this fills remaining width on desktop
     * - h-full fills the parent's fixed height (h-screen set on ChatPage)
     * - flex flex-col stacks: header → messages → input vertically
     * - Messages area gets flex-1 + overflow-y-auto so ONLY it scrolls
     * - Header and input are NOT in the scroll area → they stay fixed
     */
    <div className="flex-1 flex flex-col h-full bg-bg-chat overflow-hidden">

      {/* ── Fixed Header ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-bg-secondary border-b border-border-color flex items-center gap-3 px-4 py-3 z-10">
        {/* Back button (visible on mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden text-text-secondary hover:text-text-primary transition-colors -ml-1 p-1"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center text-white font-semibold select-none">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
          {isUserOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-bg-secondary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-text-primary font-semibold text-sm leading-tight truncate">
            {selectedUser.name}
          </h2>
          <p className="text-text-secondary text-xs">
            {typingUser
              ? 'typing...'
              : isUserOnline
              ? 'online'
              : `last seen ${formatLastSeen(selectedUser.lastSeen)}`}
          </p>
        </div>
      </div>

      {/* ── Scrollable Messages ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex justify-center pt-8">
            <div className="bg-bg-secondary rounded-lg px-4 py-2 text-xs text-text-secondary">
              No messages yet. Say hi! 👋
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
          const isMine =
            senderId === user._id || senderId?.toString() === user._id?.toString();

          return (
            <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-[75%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm
                  ${isMine
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-bg-secondary text-text-primary rounded-bl-sm'
                  }
                `}
              >
                {msg.image && (
                  <div className="mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.image}
                      alt="Sent image"
                      className="rounded-xl max-w-full h-auto"
                      style={{ maxWidth: 240 }}
                    />
                  </div>
                )}
                {msg.text && (
                  <p className="break-words text-sm leading-relaxed">{msg.text}</p>
                )}
                <p
                  className={`text-[10px] mt-1 text-right leading-none ${
                    isMine ? 'text-white/60' : 'text-text-secondary'
                  }`}
                >
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Image Preview ──────────────────────────────────────────────── */}
      {imagePreview && (
        <div className="flex-shrink-0 bg-bg-secondary px-4 py-3 border-t border-border-color">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="rounded-xl w-20 h-20 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none shadow"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Emoji Picker ──────────────────────────────────────────────── */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="flex-shrink-0 border-t border-border-color">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width="100%"
            height={300}
          />
        </div>
      )}

      {/* ── Fixed Input Bar ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-bg-secondary border-t border-border-color px-3 py-2.5">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1.5 flex-shrink-0"
            aria-label="Emoji"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-text-secondary hover:text-text-primary transition-colors p-1.5 flex-shrink-0"
            aria-label="Attach image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            placeholder="Message"
            className="flex-1 bg-bg-main text-text-primary placeholder-text-secondary px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
            disabled={uploading}
          />

          <button
            type="submit"
            disabled={uploading || (!messageText.trim() && !selectedImage)}
            className="bg-primary text-white p-2.5 rounded-full hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send"
          >
            {uploading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}