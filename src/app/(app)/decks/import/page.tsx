import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth/session';
import { CsvImportForm } from '@/components/decks/csv-import-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Nhập CSV' };

export default async function ImportPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/decks"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Decks
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Nhập bài học từ CSV
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Tạo bài học cá nhân từ file CSV. Bài học sẽ chỉ hiển thị với tài khoản của bạn và tự được
          thêm vào danh sách đang học.
        </p>
      </div>

      <div className="mt-6">
        <CsvImportForm />
      </div>
    </div>
  );
}
