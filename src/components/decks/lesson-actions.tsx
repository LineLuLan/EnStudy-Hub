'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { renameLesson, deleteLesson } from '@/features/vocab/lesson-edit';
import { MAX_LESSON_NAME } from '@/features/vocab/lesson-edit-schema';

type Props = {
  lessonId: string;
  currentName: string;
  cardCount: number;
};

export function LessonActions({ lessonId, currentName, cardCount }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(currentName);
  const [renaming, startRename] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();

  // Reset local state when navigating between lessons.
  React.useEffect(() => {
    setName(currentName);
    setEditing(false);
  }, [lessonId, currentName]);

  const pending = renaming || deleting;

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === currentName) {
      setEditing(false);
      return;
    }
    startRename(async () => {
      const result = await renameLesson({ lessonId, name: trimmed });
      if (result.ok) {
        toast.success('Đã đổi tên bài học.');
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(
      `Xoá bài học "${currentName}" và ${cardCount} thẻ bên trong? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;
    startDelete(async () => {
      const result = await deleteLesson({ lessonId });
      if (result.ok) {
        toast.success('Đã xoá bài học.');
        router.push(`/decks/${result.collectionSlug}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleRename} className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LESSON_NAME}
          disabled={pending}
          autoFocus
          className="h-8 w-56 font-medium"
          aria-label="Tên bài học"
        />
        <Button type="submit" size="sm" disabled={pending} className="h-8 gap-1.5">
          {renaming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Lưu
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setName(currentName);
            setEditing(false);
          }}
          disabled={pending}
          className="h-8 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Huỷ
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <Pencil className="h-3 w-3" />
        Đổi tên
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        Xoá bài học
      </button>
    </div>
  );
}
