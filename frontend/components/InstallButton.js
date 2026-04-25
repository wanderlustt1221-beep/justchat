'use client';
// frontend/components/InstallButton.js
// Shows an install icon when the PWA install prompt is available.
// Silently hidden when already installed or not supported.

import { useEffect, useState } from 'react';

export default function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Hide button if already running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowButton(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowButton(false);
            setDeferredPrompt(null);
        }
    };

    if (!showButton) return null;

    return (
        <button
            onClick={handleInstall}
            title="Install ChatFlow App"
            className="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-bg-main relative"
            aria-label="Install app"
        >
            {/* Download / install icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {/* Pulse dot to draw attention */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        </button>
    );
}