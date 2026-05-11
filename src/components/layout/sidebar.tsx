'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlayCircle,
  BookOpen,
  BarChart3,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/review', label: 'Ôn tập', icon: PlayCircle },
  { href: '/decks', label: 'Decks', icon: BookOpen },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white px-3 py-4 md:flex md:flex-col dark:border-zinc-800 dark:bg-zinc-950">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 px-2 text-lg font-bold tracking-tight"
      >
        <GraduationCap className="h-5 w-5" />
        EnStudy
      </Link>
      <nav className="flex flex-col gap-1 text-sm">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                active
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-4 text-xs text-zinc-500">
        <kbd className="rounded border border-zinc-300 px-1 py-0.5 text-[10px] dark:border-zinc-700">
          Ctrl/⌘ + K
        </kbd>{' '}
        mở command palette
      </div>
    </aside>
  );
}
