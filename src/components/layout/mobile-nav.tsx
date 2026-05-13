'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { NAV_ITEMS } from './nav-items';

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở menu điều hướng"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-zinc-200 bg-white px-3 py-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight"
              >
                <GraduationCap className="h-5 w-5" />
                EnStudy
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2.5 transition-colors',
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
          </aside>
        </div>
      )}
    </>
  );
}
