'use client';
// frontend/components/Sidebar.js

import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { formatChatTime } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import InstallButton from './InstallButton';

export default function Sidebar({ onSelectUser }) {
  const { user, logout } = useAuth();
  const { users, chats, fetchUsers, fetchChats, onlineUsers } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build chat list enriched with participant info
  const enrichedChats = chats
    .map((chat) => {
      const otherParticipant = chat.participants?.find((p) => {
        const pid = typeof p === 'object' ? p._id : p;
        return pid?.toString() !== user._id?.toString();
      });
      const participantUser =
        typeof otherParticipant === 'object'
          ? otherParticipant
          : users.find((u) => u._id?.toString() === otherParticipant?.toString());

      return { ...chat, participantUser };
    })
    .filter((c) => c.participantUser)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Search results — filter users by name/number
  const searchResults = searchQuery.trim()
    ? users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.mobileNumber?.includes(searchQuery)
    )
    : [];

  const handleChatClick = (participantUser) => {
    onSelectUser(participantUser);
  };

  const handleSearchSelect = (u) => {
    setSearchQuery('');
    setIsSearching(false);
    onSelectUser(u);
  };

  const openSearch = () => {
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const getLastMessagePreview = (chat) => {
    const msg = chat.lastMessage;
    if (!msg) return 'No messages yet';
    if (msg.image && !msg.text) return '📷 Photo';
    if (msg.image && msg.text) return `📷 ${msg.text}`;
    return msg.text || '';
  };

  return (
    <div className="w-full md:w-96 bg-bg-secondary border-r border-border-color flex flex-col h-full">
      {/* Header */}
      {isSearching ? (
        <div className="bg-bg-secondary px-4 py-3 border-b border-border-color flex items-center gap-3">
          <button onClick={closeSearch} className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or number..."
            className="flex-1 bg-bg-main text-text-primary placeholder-text-secondary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-secondary hover:text-text-primary flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-bg-secondary px-4 py-3 border-b border-border-color flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 select-none">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-text-primary font-semibold text-sm leading-tight truncate">{user?.name}</h2>
            <p className="text-text-secondary text-xs truncate">{user?.mobileNumber}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <InstallButton />
            <button
              onClick={openSearch}
              className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-bg-main"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-bg-main"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {isSearching ? (
          <>
            {searchQuery.trim() === '' ? (
              <div className="p-6 text-center text-text-secondary text-sm">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for a contact to start chatting
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm">No contacts found</div>
            ) : (
              <>
                <div className="px-4 py-2 text-xs text-text-secondary uppercase tracking-wide font-medium bg-bg-main">
                  Contacts on ChatFlow
                </div>
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleSearchSelect(u)}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-bg-main cursor-pointer transition-colors active:bg-bg-main"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary-dark flex items-center justify-center text-white font-semibold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      {onlineUsers[u._id] && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium text-sm truncate">{u.name}</p>
                      <p className="text-text-secondary text-xs truncate">{u.mobileNumber}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        ) : (
          /* Chat List */
          <>
            {enrichedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-bg-main flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-text-primary font-medium text-sm mb-1">No chats yet</p>
                <p className="text-text-secondary text-xs">
                  Tap the search icon to find contacts and start a conversation
                </p>
              </div>
            ) : (
              enrichedChats.map((chat) => {
                const u = chat.participantUser;
                const isOnline = onlineUsers[u._id];
                const preview = getLastMessagePreview(chat);
                const time = chat.lastMessage?.createdAt
                  ? formatChatTime(chat.lastMessage.createdAt)
                  : '';

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleChatClick(u)}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-bg-main cursor-pointer transition-colors active:bg-bg-main border-b border-border-color border-opacity-40"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary-dark flex items-center justify-center text-white font-semibold text-base select-none">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-secondary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-text-primary font-medium text-sm truncate">{u.name}</p>
                        {time && (
                          <span className="text-text-secondary text-xs flex-shrink-0">{time}</span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs truncate mt-0.5">{preview}</p>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}