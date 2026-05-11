import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/providers/toaster';
import { CommandPalette } from '@/components/command-palette';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EnStudy Hub — Học từ vựng tiếng Anh',
    template: '%s · EnStudy Hub',
  },
  description: 'Web học từ vựng tiếng Anh cho người Việt với SRS (FSRS).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <CommandPalette />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
