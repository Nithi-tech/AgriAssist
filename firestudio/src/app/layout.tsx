import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/providers/language-provider-safe';
import { MobileProvider } from '@/providers/mobile-provider';
import { OfflineProvider } from '@/providers/offline-provider';
import { PWAProvider } from '@/providers/pwa-provider';
import { MobileNavigation } from '@/components/mobile-navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriAssist - Smart Farming Solutions',
  description: 'AI-powered agricultural assistance for modern farming',
  manifest: '/manifest.json',
  keywords: 'agriculture, farming, AI, crop analysis, smart farming, agricultural technology',
  authors: [{ name: 'AgriAssist Team' }],
  themeColor: '#22c55e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriAssist'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#16a34a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AgriAssist" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                      console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <OfflineProvider>
            <MobileProvider>
              <LanguageProvider>
                <MobileNavigation />
                <main className="pb-16 pt-14 lg:pb-0 lg:pt-0 min-h-screen bg-gray-50 dark:bg-gray-900">
                  {children}
                </main>
                <Toaster />
              </LanguageProvider>
            </MobileProvider>
          </OfflineProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
