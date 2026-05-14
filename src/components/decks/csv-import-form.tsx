'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CsvPreviewTable } from './csv-preview-table';
import { previewCsv, importCsvAsLesson, type PreviewResult } from '@/features/vocab/csv-import';
import { slugify, MAX_LESSON_NAME } from '@/features/vocab/csv-schema';

const CSV_TEMPLATE_HEADER =
  'word,ipa,pos,cefr,meaning_vi,meaning_en,example_en,example_vi,mnemonic_vi';
const CSV_TEMPLATE_SAMPLE =
  'breakfast,ˈbrek.fəst,noun,A1,bữa sáng,The first meal of the day,I eat breakfast at 7am.,Tôi ăn sáng lúc 7 giờ.,';
const CSV_TEMPLATE_DOWNLOAD = `${CSV_TEMPLATE_HEADER}
breakfast,ˈbrek.fəst,noun,A1,bữa sáng,The first meal of the day,I eat breakfast at 7am.,Tôi ăn sáng lúc 7 giờ.,BREAK + FAST = phá vỡ thời gian nhịn ăn qua đêm
happy,ˈhæp.i,adjective,A2,vui vẻ,feeling or showing pleasure,She looks happy today.,Hôm nay cô ấy trông vui vẻ.,
run,rʌn,verb,A1,chạy,move quickly on foot,I run every morning.,Tôi chạy mỗi sáng.,
`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE_DOWNLOAD], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'enstudy-csv-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CsvImportForm() {
  const router = useRouter();
  const [csvText, setCsvText] = React.useState('');
  const [lessonName, setLessonName] = React.useState('');
  const [lessonSlug, setLessonSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [overwrite, setOverwrite] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewResult | null>(null);
  const [previewing, startPreview] = React.useTransition();
  const [submitting, startSubmit] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-derive slug từ name until user manually edits
  React.useEffect(() => {
    if (!slugTouched && lessonName) {
      setLessonSlug(slugify(lessonName));
    }
  }, [lessonName, slugTouched]);

  // Debounced auto-preview on csvText change
  React.useEffect(() => {
    if (!csvText.trim()) {
      setPreview(null);
      return;
    }
    const handle = window.setTimeout(() => {
      const fd = new FormData();
      fd.set('csvText', csvText);
      startPreview(async () => {
        const result = await previewCsv(fd);
        setPreview(result);
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [csvText]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvText(text);
    };
    reader.onerror = () => toast.error('Không đọc được file.');
    reader.readAsText(file, 'UTF-8');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview || !preview.ok) {
      toast.error('CSV chưa hợp lệ.');
      return;
    }
    if (!lessonName.trim() || !lessonSlug.trim()) {
      toast.error('Cần nhập tên và slug bài học.');
      return;
    }
    const fd = new FormData();
    fd.set('lessonName', lessonName.trim());
    fd.set('lessonSlug', lessonSlug.trim());
    fd.set('csvText', csvText);
    fd.set('overwrite', overwrite ? 'true' : 'false');
    startSubmit(async () => {
      const result = await importCsvAsLesson(fd);
      if (result.ok) {
        toast.success(
          overwrite ? `Đã ghi đè ${result.cardCount} thẻ.` : `Đã nhập ${result.cardCount} thẻ.`,
          { description: 'Đang chuyển tới bài học…' }
        );
        router.push(`/decks/${result.collectionSlug}/${result.topicSlug}/${result.lessonSlug}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function loadSample() {
    setCsvText(`${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_SAMPLE}`);
    setLessonName('Bài mẫu CSV');
  }

  const pending = previewing || submitting;
  const canSubmit =
    preview?.ok && lessonName.trim().length >= 3 && lessonSlug.length >= 3 && !pending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection
        title="1. Tải file CSV"
        description="Tối đa 200 thẻ · 256 KB · UTF-8. Cột bắt buộc: word, ipa, pos, cefr, meaning_vi, meaning_en, example_en, example_vi. Cột tùy chọn: mnemonic_vi."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            Chọn file CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Tải file CSV"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={loadSample}
            disabled={pending}
            className="text-xs"
          >
            Hoặc dùng mẫu thử
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={downloadTemplate}
            disabled={pending}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Tải CSV mẫu
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="csvText">Hoặc dán CSV trực tiếp</Label>
          <Textarea
            id="csvText"
            name="csvText"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_SAMPLE}`}
            rows={6}
            disabled={pending}
          />
        </div>

        {previewing && (
          <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang kiểm tra…
          </p>
        )}

        {preview && (
          <CsvPreviewTable
            rows={preview.ok ? preview.rows : []}
            rowErrors={preview.ok ? [] : preview.rowErrors}
          />
        )}
      </FormSection>

      <FormSection
        title="2. Thông tin bài học"
        description="Đặt tên và slug để xác định bài học trong URL."
      >
        <div className="space-y-1.5">
          <Label htmlFor="lessonName">Tên bài học</Label>
          <Input
            id="lessonName"
            name="lessonName"
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
            maxLength={MAX_LESSON_NAME}
            placeholder="VD: Daily Words Practice"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lessonSlug">Slug (URL-safe)</Label>
          <Input
            id="lessonSlug"
            name="lessonSlug"
            value={lessonSlug}
            onChange={(e) => {
              setLessonSlug(e.target.value);
              setSlugTouched(true);
            }}
            maxLength={40}
            placeholder="daily-words-practice"
            disabled={pending}
            className="font-mono"
          />
          <p className="text-[11px] text-zinc-500">
            3-40 ký tự, chỉ a-z, 0-9, dấu gạch ngang. Tự suy ra từ tên nếu chưa sửa.
          </p>
        </div>
        <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/40 p-2.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/20">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-amber-600"
            aria-label="Ghi đè bài học cũ nếu trùng slug"
          />
          <span className="leading-relaxed">
            <span className="font-medium text-amber-900 dark:text-amber-100">
              Ghi đè bài học cũ nếu trùng slug
            </span>
            <span className="block text-[11px] text-amber-900/80 dark:text-amber-100/80">
              Thẻ cũ trong bài đó sẽ bị xoá, FSRS state (stability/due) reset về thẻ mới. Dùng khi
              muốn fix typo trong CSV và upload lại.
            </span>
          </span>
        </label>
      </FormSection>

      <div className="flex flex-col items-start gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center dark:border-zinc-800">
        <Button type="submit" disabled={!canSubmit} className="gap-2">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {submitting ? 'Đang nhập…' : 'Nhập bài học'}
        </Button>
        <span className="text-xs text-zinc-500">
          Sau khi nhập, bài học sẽ tự được thêm vào danh sách đang học của bạn.
        </span>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
