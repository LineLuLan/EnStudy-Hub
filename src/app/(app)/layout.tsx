import { eq } from 'drizzle-orm';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { TourModal } from '@/features/onboarding/tour-modal';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Read user email from session cookie (no network round-trip — middleware
  // already verified auth). Fast path; topbar dropdown uses it.
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userEmail = session?.user.email ?? null;
  const userId = session?.user.id ?? null;

  // Show first-login tour iff `profiles.onboarded_at IS NULL`. Single column
  // boolean check — cheaper than parsing createdAt + window math, and survives
  // the user closing+reopening browser before completing the tour.
  let shouldShowTour = false;
  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { onboardedAt: true },
    });
    shouldShowTour = profile?.onboardedAt === null;
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow-md focus:ring-2 focus:ring-sky-400 dark:focus:bg-zinc-900 dark:focus:text-zinc-50"
      >
        Bỏ qua sang nội dung
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userEmail={userEmail} />
        <main id="main-content" className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
      {shouldShowTour && <TourModal />}
    </div>
  );
}
