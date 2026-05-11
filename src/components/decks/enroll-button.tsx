'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Check, BookmarkPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enrollLesson } from '@/features/vocab/enrollment';

export function EnrollButton({
  lessonId,
  alreadyEnrolled,
}: {
  lessonId: string;
  alreadyEnrolled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (alreadyEnrolled) {
    return (
      <Button variant="outline" size="sm" disabled className="cursor-default">
        <Check className="mr-1.5 h-4 w-4" />
        Đang học
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set('lessonId', lessonId);
          const result = await enrollLesson(fd);
          if (result.ok) {
            toast.success(`Đã thêm vào học (${result.enrolled} thẻ).`);
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      {pending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <BookmarkPlus className="mr-1.5 h-4 w-4" />
      )}
      {pending ? 'Đang thêm…' : 'Thêm vào học'}
    </Button>
  );
}
