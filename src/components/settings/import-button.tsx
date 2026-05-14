'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importUserData } from '@/features/auth/import';

export function ImportButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handlePick() {
    if (pending) return;
    fileInputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-import same file later
    if (!file) return;

    const ok = window.confirm(
      `Khôi phục từ "${file.name}"?\n\n` +
        '• Các bài học cùng slug trong bộ cá nhân sẽ bị GHI ĐÈ (cards delete-replace).\n' +
        '• Ghi chú + tạm dừng được áp lại vào các thẻ tương ứng.\n' +
        '• Profile + stats KHÔNG bị thay đổi.\n\n' +
        'Tiếp tục?'
    );
    if (!ok) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (!text) {
        toast.error('Không đọc được nội dung file.');
        return;
      }
      startTransition(async () => {
        const result = await importUserData(text);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        const s = result.summary;
        toast.success(`Đã khôi phục: ${s.lessonsCreated} bài học · ${s.cardsCreated} thẻ`, {
          description:
            `Ghi chú ${s.notesRestored} áp, ${s.notesSkipped} bỏ qua · ` +
            `Tạm dừng ${s.suspendedRestored} áp, ${s.suspendedSkipped} bỏ qua.`,
          duration: 6000,
        });
        router.refresh();
      });
    };
    reader.onerror = () => toast.error('Lỗi đọc file.');
    reader.readAsText(file, 'UTF-8');
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handlePick}
        disabled={pending}
        className="gap-2"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {pending ? 'Đang khôi phục…' : 'Nhập từ JSON'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleChange}
        className="sr-only"
        aria-label="Chọn file JSON để khôi phục"
      />
    </>
  );
}
