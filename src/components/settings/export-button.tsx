'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportUserData } from '@/features/auth/export';
import { exportFilename } from '@/features/auth/export-schema';

type Props = {
  userId: string;
};

export function ExportButton({ userId }: Props) {
  const [pending, startTransition] = React.useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportUserData();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename(userId);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const noteCount = result.data.notes.length;
      const collectionCount = result.data.customCollections.length;
      toast.success(`Đã xuất ${noteCount} ghi chú · ${collectionCount} bộ cá nhân.`, {
        description: 'File JSON đã tải xuống máy bạn.',
      });
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={pending}
      className="gap-2"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {pending ? 'Đang tải…' : 'Tải JSON dữ liệu cá nhân'}
    </Button>
  );
}
