'use client';
// frontend/components/ServiceWorkerRegistrar.js
// Drop this anywhere inside <body> (e.g. in layout.js) to register the SW.
// It is a client component so it runs only in the browser.

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  return null; // renders nothing
}