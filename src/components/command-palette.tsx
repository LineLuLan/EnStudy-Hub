'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { LayoutDashboard, PlayCircle, BookOpen, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/review', label: 'Ôn tập', icon: PlayCircle },
  { href: '/decks', label: 'Decks', icon: BookOpen },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <Command.Input
          placeholder="Gõ lệnh hoặc tìm trang…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-500">
          Không có kết quả.
        </Command.Empty>
        <Command.Group heading="Điều hướng" className="text-xs text-zinc-500">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Command.Item
                key={item.href}
                value={`${item.label} ${item.href}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Command.Item>
            );
          })}
        </Command.Group>
      </Command.List>
      <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800">
        <span>
          <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">↑↓</kbd> chọn
        </span>
        <span>
          <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">⏎</kbd> mở
        </span>
        <span>
          <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">esc</kbd> đóng
        </span>
      </div>
    </Command.Dialog>
  );
}
