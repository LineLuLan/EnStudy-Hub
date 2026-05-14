'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, NotebookPen, PauseCircle, PlayCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateUserCard } from '@/features/srs/card-actions';
import { MAX_NOTE_LENGTH } from '@/features/srs/card-actions-schema';

type Props = {
  userCardId: string;
  initialNote: string | null;
  initialSuspended: boolean;
};

export function CardActions({ userCardId, initialNote, initialSuspended }: Props) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState(initialNote ?? '');
  const [savedNote, setSavedNote] = React.useState(initialNote ?? '');
  const [suspended, setSuspended] = React.useState(initialSuspended);
  const [savingNote, startNoteSave] = React.useTransition();
  const [togglingSuspend, startSuspendToggle] = React.useTransition();

  // Reset state when navigating to a different card.
  React.useEffect(() => {
    setNote(initialNote ?? '');
    setSavedNote(initialNote ?? '');
    setSuspended(initialSuspended);
    setOpen(false);
  }, [userCardId, initialNote, initialSuspended]);

  const noteDirty = note !== savedNote;
  const pending = savingNote || togglingSuspend;

  function handleSaveNote() {
    startNoteSave(async () => {
      const result = await updateUserCard({ userCardId, notes: note });
      if (result.ok) {
        setSavedNote(note);
        toast.success(note.trim().length > 0 ? 'Đã lưu ghi chú.' : 'Đã xoá ghi chú.');
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggleSuspend() {
    const next = !suspended;
    startSuspendToggle(async () => {
      const result = await updateUserCard({ userCardId, suspended: next });
      if (result.ok) {
        setSuspended(result.suspended);
        toast.success(
          result.suspended ? 'Đã tạm dừng — thẻ sẽ ẩn khỏi queue ôn tập.' : 'Đã kích hoạt lại thẻ.'
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-zinc-600 select-none dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <NotebookPen className="h-3.5 w-3.5" />
          Hành động thẻ
          {savedNote.trim().length > 0 && (
            <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900/30 dark:text-sky-200">
              Có ghi chú
            </span>
          )}
          {suspended && (
            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
              Tạm dừng
            </span>
          )}
        </span>
        <span className="text-[11px] text-zinc-400">{open ? 'Đóng' : 'Mở'}</span>
      </summary>

      <div className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="space-y-1.5">
          <label
            htmlFor={`note-${userCardId}`}
            className="font-medium text-zinc-700 dark:text-zinc-300"
          >
            Ghi chú cá nhân
          </label>
          <Textarea
            id={`note-${userCardId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mẹo nhớ, ngữ cảnh, từ liên tưởng…"
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            disabled={pending}
            className="font-sans text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              {note.length} / {MAX_NOTE_LENGTH}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSaveNote}
              disabled={!noteDirty || pending}
              className="h-7 gap-1.5 text-xs"
            >
              {savingNote ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {savingNote ? 'Đang lưu…' : 'Lưu ghi chú'}
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
          <div className="space-y-0.5">
            <div className="font-medium text-zinc-700 dark:text-zinc-300">
              {suspended ? 'Đang tạm dừng' : 'Tạm dừng thẻ'}
            </div>
            <p className="text-[11px] text-zinc-500">
              {suspended
                ? 'Thẻ này đã bị ẩn khỏi queue ôn tập. Bấm để kích hoạt lại.'
                : 'Ẩn khỏi queue ôn tập cho đến khi bạn kích hoạt lại.'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleToggleSuspend}
            disabled={pending}
            className="h-7 shrink-0 gap-1.5 text-xs"
          >
            {togglingSuspend ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : suspended ? (
              <PlayCircle className="h-3 w-3" />
            ) : (
              <PauseCircle className="h-3 w-3" />
            )}
            {suspended ? 'Kích hoạt' : 'Tạm dừng'}
          </Button>
        </div>
      </div>
    </details>
  );
}
