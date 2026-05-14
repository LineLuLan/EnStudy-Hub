'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Loader2, LogOut, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/actions';
import { MobileNav } from './mobile-nav';
import { ShortcutsTrigger } from './shortcuts-modal';

export function Topbar({ userEmail }: { userEmail: string | null }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [signingOut, startSignOut] = React.useTransition();
  React.useEffect(() => setMounted(true), []);

  function handleSignOut() {
    startSignOut(async () => {
      try {
        await signOut();
      } catch (err) {
        // signOut() throws NEXT_REDIRECT after clearing the session — this is
        // expected behavior, the throw triggers Next's redirect handling.
        // Anything else is a real failure.
        const message = err instanceof Error ? err.message : '';
        if (!message.includes('NEXT_REDIRECT')) {
          toast.error('Không đăng xuất được. Thử lại.');
        }
      }
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur sm:gap-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950/80">
      <MobileNav />
      <button
        type="button"
        onClick={() => {
          // Dispatch ⌘K equivalent
          const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
          document.dispatchEvent(ev);
        }}
        className="flex flex-1 items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Tìm kiếm…</span>
        <kbd className="hidden rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] sm:inline dark:border-zinc-700">
          ⌘K
        </kbd>
      </button>

      <ShortcutsTrigger />

      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {mounted && resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="User menu">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] text-zinc-500">Đăng nhập với</span>
            <span className="w-full truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {userEmail ?? 'Chưa đăng nhập'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="h-4 w-4" />
              Cài đặt
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
            disabled={signingOut}
            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
