'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Card } from '@/lib/db/schema';
import { updateCard } from '@/features/vocab/card-edit';
import { cardToFormState } from '@/features/vocab/card-edit-schema';

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
  const initial = React.useMemo(() => cardToFormState(card), [card]);
  const [form, setForm] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  function bind<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCard({ cardId: card.id, ...form });
      if (result.ok) {
        toast.success('Đã lưu thay đổi.');
        onSaved();
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
            onChange={bind('word')}
            disabled={pending}
            required
            className="font-mono"
          />
        </Field>
        <Field label="IPA" htmlFor={`ipa-${card.id}`}>
          <Input
            id={`ipa-${card.id}`}
            value={form.ipa}
            onChange={bind('ipa')}
            disabled={pending}
            required
            className="font-mono"
          />
        </Field>
        <Field label="POS" htmlFor={`pos-${card.id}`}>
          <select
            id={`pos-${card.id}`}
            value={form.pos}
            onChange={bind('pos')}
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
            onChange={bind('cefr')}
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

      <Field label="Nghĩa VI" htmlFor={`mvi-${card.id}`}>
        <Input
          id={`mvi-${card.id}`}
          value={form.meaning_vi}
          onChange={bind('meaning_vi')}
          disabled={pending}
          required
          maxLength={200}
        />
      </Field>
      <Field label="Nghĩa EN" htmlFor={`men-${card.id}`}>
        <Input
          id={`men-${card.id}`}
          value={form.meaning_en}
          onChange={bind('meaning_en')}
          disabled={pending}
          required
          maxLength={200}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ví dụ EN" htmlFor={`exen-${card.id}`}>
          <Input
            id={`exen-${card.id}`}
            value={form.example_en}
            onChange={bind('example_en')}
            disabled={pending}
            required
            maxLength={300}
          />
        </Field>
        <Field label="Ví dụ VI" htmlFor={`exvi-${card.id}`}>
          <Input
            id={`exvi-${card.id}`}
            value={form.example_vi}
            onChange={bind('example_vi')}
            disabled={pending}
            required
            maxLength={300}
          />
        </Field>
      </div>

      <Field label="Mẹo nhớ (tùy chọn)" htmlFor={`mn-${card.id}`}>
        <Textarea
          id={`mn-${card.id}`}
          value={form.mnemonic_vi}
          onChange={bind('mnemonic_vi')}
          disabled={pending}
          rows={2}
          maxLength={300}
          className="font-sans text-xs"
        />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
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
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
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
