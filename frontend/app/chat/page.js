'use client';
// frontend/app/chat/page.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSelectUser = (u) => setSelectedUser(u);
  const handleBack = () => setSelectedUser(null);

  return (
    /*
     * h-screen + overflow-hidden on the root:
     *   - locks the full viewport height
     *   - prevents the page itself from scrolling
     *   - children manage their own internal scroll
     *
     * On mobile (< md):
     *   - Show Sidebar OR ChatWindow (full screen), not both
     * On desktop (≥ md):
     *   - Show Sidebar + ChatWindow side by side
     */
    <div className="h-screen overflow-hidden flex bg-bg-main">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {/*
        Mobile: shown only when no chat selected (selectedUser is null)
        Desktop: always shown as a panel
      */}
      <div
        className={`
          ${selectedUser ? 'hidden md:flex' : 'flex'}
          w-full md:w-96 h-full flex-shrink-0
        `}
      >
        <Sidebar onSelectUser={handleSelectUser} />
      </div>

      {/* ── Chat Window ──────────────────────────────────────────────── */}
      {/*
        Mobile: shown only when a user is selected (full screen)
        Desktop: always shown, fills remaining space
      */}
      <div
        className={`
          ${selectedUser ? 'flex' : 'hidden md:flex'}
          flex-1 h-full flex-col
        `}
      >
        <ChatWindow
          selectedUser={selectedUser}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}