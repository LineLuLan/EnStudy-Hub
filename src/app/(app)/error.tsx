'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] route error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-6 dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Có lỗi xảy ra
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Trang không tải được. Thử lại — nếu vẫn lỗi, kiểm tra console hoặc reload toàn trang.
            </p>
            {isDev && error.message && (
              <pre className="mt-3 max-h-48 overflow-auto rounded border border-red-200 bg-white p-2 font-mono text-xs text-red-900 dark:border-red-900/40 dark:bg-zinc-950 dark:text-red-300">
                {error.message}
                {error.digest && `\n\ndigest: ${error.digest}`}
              </pre>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={reset}>
                <RefreshCcw className="mr-1.5 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
