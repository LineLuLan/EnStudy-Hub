import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">EnStudy Hub</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Web học từ vựng tiếng Anh cho người Việt — bản scaffold (Phase 0).
      </p>

      <div className="mt-8 rounded-md border border-dashed p-4 text-sm">
        <p className="font-medium">Trạng thái</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-500">
          <li>Code base: Next.js 15 + TS strict + Tailwind v4 + Drizzle + Supabase clients.</li>
          <li>Schema DB: full theo blueprint, chưa push lên Supabase.</li>
          <li>
            Tiếp theo: cấp Supabase keys (xem{' '}
            <code className="font-mono text-xs">docs/API_KEYS.md</code>) → chạy{' '}
            <code className="font-mono text-xs">pnpm db:push</code>.
          </li>
        </ul>
      </div>

      <nav className="mt-8 flex gap-4 text-sm">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
        <Link href="/decks" className="underline">
          Decks
        </Link>
        <Link href="/review" className="underline">
          Review
        </Link>
        <Link href="/stats" className="underline">
          Stats
        </Link>
        <Link href="/settings" className="underline">
          Settings
        </Link>
      </nav>
    </main>
  );
}
