'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, User, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MobileNav } from './mobile-nav';

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <span className="text-xs text-zinc-500">TODO: hiển thị email</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <LogOut className="h-4 w-4" />
            Đăng xuất (TODO)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
