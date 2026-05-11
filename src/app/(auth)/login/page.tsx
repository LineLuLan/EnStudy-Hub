import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <GraduationCap className="h-6 w-6" />
            EnStudy Hub
          </Link>
          <h1 className="text-lg font-semibold">Đăng nhập</h1>
          <p className="text-sm text-zinc-500">
            Học từ vựng tiếng Anh với SRS. Không cần password.
          </p>
        </div>

        <LoginForm initialError={error} />

        <p className="text-center text-xs text-zinc-500">
          Chưa có tài khoản? Magic link sẽ tự tạo cho bạn.
        </p>
      </div>
    </main>
  );
}
