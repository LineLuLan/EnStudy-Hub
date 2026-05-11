import Link from 'next/link';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Ôn tập' },
  { href: '/decks', label: 'Decks' },
  { href: '/stats', label: 'Thống kê' },
  { href: '/settings', label: 'Cài đặt' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r p-4 md:block">
        <Link href="/dashboard" className="text-lg font-bold">
          EnStudy
        </Link>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
