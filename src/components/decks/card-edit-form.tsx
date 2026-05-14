'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Card } from '@/lib/db/schema';
import { updateCard } from '@/features/vocab/card-edit';
import { deleteCard } from '@/features/vocab/lesson-edit';
import {
  cardToFormState,
  formStateToInput,
  MAX_DEFINITIONS,
  MAX_EXAMPLES_PER_DEF,
  type CardEditFormState,
} from '@/features/vocab/card-edit-schema';

const POS_OPTIONS = [
  { value: 'noun', label: 'noun' },
  { value: 'verb', label: 'verb' },
  { value: 'adjective', label: 'adjective' },
  { value: 'adverb', label: 'adverb' },
  { value: 'preposition', label: 'preposition' },
  { value: 'conjunction', label: 'conjunction' },
  { value: 'pronoun', label: 'pronoun' },
  { value: 'interjection', label: 'interjection' },
  { value: 'determiner', label: 'determiner' },
  { value: 'auxiliary', label: 'auxiliary' },
] as const;

const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800';

type Props = {
  card: Card;
  onCancel: () => void;
  onSaved: () => void;
};

export function CardEditForm({ card, onCancel, onSaved }: Props) {
  const router = useRouter();
  const initial = React.useMemo(() => cardToFormState(card), [card]);
  const [form, setForm] = React.useState<CardEditFormState>(initial);
  const [saving, startSave] = React.useTransition();
  const [deletingCard, startDelete] = React.useTransition();
  const pending = saving || deletingCard;

  function patch<K extends keyof CardEditFormState>(key: K, value: CardEditFormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function patchDef(idx: number, partial: Partial<CardEditFormState['definitions'][number]>) {
    setForm((s) => ({
      ...s,
      definitions: s.definitions.map((d, i) => (i === idx ? { ...d, ...partial } : d)),
    }));
  }

  function patchExample(
    defIdx: number,
    exIdx: number,
    partial: Partial<{ en: string; vi: string }>
  ) {
    setForm((s) => ({
      ...s,
      definitions: s.definitions.map((d, i) =>
        i !== defIdx
          ? d
          : {
              ...d,
              examples: d.examples.map((ex, j) => (j === exIdx ? { ...ex, ...partial } : ex)),
            }
      ),
    }));
  }

  function addDefinition() {
    if (form.definitions.length >= MAX_DEFINITIONS) return;
    setForm((s) => ({
      ...s,
      definitions: [
        ...s.definitions,
        { meaning_en: '', meaning_vi: '', examples: [{ en: '', vi: '' }] },
      ],
    }));
  }

  function removeDefinition(idx: number) {
    if (form.definitions.length <= 1) return;
    setForm((s) => ({ ...s, definitions: s.definitions.filter((_, i) => i !== idx) }));
  }

  function addExample(defIdx: number) {
    setForm((s) => ({
      ...s,
      definitions: s.definitions.map((d, i) =>
        i !== defIdx || d.examples.length >= MAX_EXAMPLES_PER_DEF
          ? d
          : { ...d, examples: [...d.examples, { en: '', vi: '' }] }
      ),
    }));
  }

  function removeExample(defIdx: number, exIdx: number) {
    setForm((s) => ({
      ...s,
      definitions: s.definitions.map((d, i) =>
        i !== defIdx || d.examples.length <= 1
          ? d
          : { ...d, examples: d.examples.filter((_, j) => j !== exIdx) }
      ),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const result = await updateCard(formStateToInput(form, card.id));
      if (result.ok) {
        toast.success('Đã lưu thay đổi.');
        onSaved();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(`Xoá thẻ "${form.word}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;
    startDelete(async () => {
      const result = await deleteCard({ cardId: card.id });
      if (result.ok) {
        toast.success('Đã xoá thẻ.');
        onSaved();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-t border-zinc-200 px-4 pt-3 pb-4 text-sm dark:border-zinc-800"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Word" htmlFor={`word-${card.id}`}>
          <Input
            id={`word-${card.id}`}
            value={form.word}
            onChange={(e) => patch('word', e.target.value)}
            disabled={pending}
            required
            className="font-mono"
          />
        </Field>
        <Field label="IPA" htmlFor={`ipa-${card.id}`}>
          <Input
            id={`ipa-${card.id}`}
            value={form.ipa}
            onChange={(e) => patch('ipa', e.target.value)}
            disabled={pending}
            required
            className="font-mono"
          />
        </Field>
        <Field label="POS" htmlFor={`pos-${card.id}`}>
          <select
            id={`pos-${card.id}`}
            value={form.pos}
            onChange={(e) => patch('pos', e.target.value)}
            disabled={pending}
            className={SELECT_CLASS}
          >
            {POS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="CEFR" htmlFor={`cefr-${card.id}`}>
          <select
            id={`cefr-${card.id}`}
            value={form.cefr}
            onChange={(e) => patch('cefr', e.target.value)}
            disabled={pending}
            className={SELECT_CLASS}
          >
            {CEFR_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Định nghĩa</Label>
          <span className="text-[10px] text-zinc-500">
            {form.definitions.length} / {MAX_DEFINITIONS}
          </span>
        </div>
        {form.definitions.map((def, defIdx) => (
          <DefinitionBlock
            key={defIdx}
            cardId={card.id}
            index={defIdx}
            def={def}
            canRemove={form.definitions.length > 1}
            canAddExample={def.examples.length < MAX_EXAMPLES_PER_DEF}
            pending={pending}
            onUpdate={(p) => patchDef(defIdx, p)}
            onRemove={() => removeDefinition(defIdx)}
            onExampleUpdate={(exIdx, p) => patchExample(defIdx, exIdx, p)}
            onExampleAdd={() => addExample(defIdx)}
            onExampleRemove={(exIdx) => removeExample(defIdx, exIdx)}
          />
        ))}
        {form.definitions.length < MAX_DEFINITIONS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDefinition}
            disabled={pending}
            className="h-7 gap-1.5 text-xs"
          >
            <Plus className="h-3 w-3" />
            Thêm định nghĩa
          </Button>
        )}
      </div>

      <Field label="Mẹo nhớ (tùy chọn)" htmlFor={`mn-${card.id}`}>
        <Textarea
          id={`mn-${card.id}`}
          value={form.mnemonic_vi}
          onChange={(e) => patch('mnemonic_vi', e.target.value)}
          disabled={pending}
          rows={2}
          maxLength={300}
          className="font-sans text-xs"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {deletingCard ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {deletingCard ? 'Đang xoá…' : 'Xoá thẻ'}
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DefinitionBlock({
  cardId,
  index,
  def,
  canRemove,
  canAddExample,
  pending,
  onUpdate,
  onRemove,
  onExampleUpdate,
  onExampleAdd,
  onExampleRemove,
}: {
  cardId: string;
  index: number;
  def: CardEditFormState['definitions'][number];
  canRemove: boolean;
  canAddExample: boolean;
  pending: boolean;
  onUpdate: (p: Partial<CardEditFormState['definitions'][number]>) => void;
  onRemove: () => void;
  onExampleUpdate: (exIdx: number, p: Partial<{ en: string; vi: string }>) => void;
  onExampleAdd: () => void;
  onExampleRemove: (exIdx: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Định nghĩa #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
            Xoá định nghĩa
          </button>
        )}
      </div>
      <Field label="Nghĩa VI" htmlFor={`mvi-${cardId}-${index}`}>
        <Input
          id={`mvi-${cardId}-${index}`}
          value={def.meaning_vi}
          onChange={(e) => onUpdate({ meaning_vi: e.target.value })}
          disabled={pending}
          required
          maxLength={200}
        />
      </Field>
      <Field label="Nghĩa EN" htmlFor={`men-${cardId}-${index}`}>
        <Input
          id={`men-${cardId}-${index}`}
          value={def.meaning_en}
          onChange={(e) => onUpdate({ meaning_en: e.target.value })}
          disabled={pending}
          required
          maxLength={200}
        />
      </Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px]">Ví dụ</Label>
          <span className="text-[10px] text-zinc-500">
            {def.examples.length} / {MAX_EXAMPLES_PER_DEF}
          </span>
        </div>
        {def.examples.map((ex, exIdx) => (
          <div
            key={exIdx}
            className="grid gap-2 rounded-md border border-zinc-200 bg-white p-2 sm:grid-cols-[1fr_1fr_auto] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Input
              aria-label={`Ví dụ EN ${exIdx + 1}`}
              value={ex.en}
              onChange={(e) => onExampleUpdate(exIdx, { en: e.target.value })}
              disabled={pending}
              required
              maxLength={300}
              placeholder="English example"
            />
            <Input
              aria-label={`Ví dụ VI ${exIdx + 1}`}
              value={ex.vi}
              onChange={(e) => onExampleUpdate(exIdx, { vi: e.target.value })}
              disabled={pending}
              required
              maxLength={300}
              placeholder="Bản dịch tiếng Việt"
            />
            {def.examples.length > 1 && (
              <button
                type="button"
                onClick={() => onExampleRemove(exIdx)}
                disabled={pending}
                aria-label={`Xoá ví dụ ${exIdx + 1}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {canAddExample && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExampleAdd}
            disabled={pending}
            className="h-7 gap-1.5 text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Thêm ví dụ
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
