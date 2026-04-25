// frontend/app/layout.js  (FINAL — includes SW registrar)
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ChatFlow',
  description: 'Real-time chat — fast, simple, private',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChatFlow',
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#00A884',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChatFlow" />

        {/* SVG favicon — no image file required */}
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2300A884'/%3E%3Cpath fill='white' d='M16 6C10.5 6 6 10.5 6 16c0 1.8.5 3.5 1.4 4.9L6 26l5.3-1.3C12.6 25.5 14.3 26 16 26c5.5 0 10-4.5 10-10S21.5 6 16 6zm4.7 13.3H11.3a.7.7 0 010-1.4h9.4a.7.7 0 010 1.4zm0-2.7H11.3a.7.7 0 010-1.4h9.4a.7.7 0 010 1.4zm0-2.7H11.3a.7.7 0 010-1.4h9.4a.7.7 0 010 1.4z'/%3E%3C/svg%3E"
        />
        <link
          rel="apple-touch-icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' rx='40' fill='%2300A884'/%3E%3Cpath fill='white' d='M90 30C57.9 30 32 55.9 32 88c0 9.8 2.7 19 7.4 26.9L32 144l29.8-7.3C69.4 140.8 79.4 144 90 144c32.1 0 58-25.9 58-56S122.1 30 90 30zm26.3 71.3H63.7a3.7 3.7 0 010-7.4h52.6a3.7 3.7 0 010 7.4zm0-15H63.7a3.7 3.7 0 010-7.4h52.6a3.7 3.7 0 010 7.4zm0-15H63.7a3.7 3.7 0 010-7.4h52.6a3.7 3.7 0 010 7.4z'/%3E%3C/svg%3E"
        />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <ChatProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: { background: '#202C33', color: '#E9EDEF', fontSize: '14px' },
              }}
            />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}