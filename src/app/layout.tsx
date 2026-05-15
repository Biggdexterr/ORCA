// ============================================================
// ORCA — Root Layout
// ============================================================

import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: 'ORCA — See what smart money sees.',
  description: 'AI-powered token launch sniper, whale wallet tracker, and KOL wallet intelligence.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-dark">
      <body>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-base)' }}>
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
