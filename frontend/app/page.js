'use client';
// frontend/app/page.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Loading stages shown in sequence while auth resolves
const STAGES = [
  'Checking authentication...',
  'Securing your session...',
  'Preparing your chats...',
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Cycle through loading stage labels
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 900);
    return () => clearInterval(id);
  }, [loading]);

  // Redirect once auth resolves
  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/chat' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div
      className={`
        min-h-screen bg-bg-main flex flex-col items-center justify-center
        relative overflow-hidden transition-opacity duration-700
        ${fadeIn ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Animated gradient orbs — subtle background depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-dark opacity-10 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary opacity-5 blur-2xl animate-pulse"
          style={{ animationDelay: '0.75s' }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">

        {/* Logo mark */}
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 blur-xl scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-bg-secondary border border-border-color flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        {/* App name + tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">ChatFlow</h1>
          <p className="text-text-secondary text-sm">Connecting you instantly</p>
        </div>

        {/* Typing-dots loader */}
        <div className="flex items-center gap-2">
          {[0, 160, 320].map((delay) => (
            <span
              key={delay}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>

        {/* Stage label — fades between states */}
        <p
          key={stageIndex}
          className="text-text-secondary text-xs tracking-wide animate-pulse"
          style={{ minHeight: '1rem' }}
        >
          {STAGES[stageIndex]}
        </p>

        {/* Micro trust line */}
        <div className="flex items-center gap-1.5 text-text-secondary opacity-40">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-xs">Secure connection · v1.0.0</span>
        </div>
      </div>
    </div>
  );
}