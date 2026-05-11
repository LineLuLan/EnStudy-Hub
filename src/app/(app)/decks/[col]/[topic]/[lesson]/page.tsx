import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock } from 'lucide-react';
import { getLessonByPath, getEnrolledLessonIds } from '@/features/vocab/queries';
import { getCurrentUserId } from '@/lib/auth/session';
import { CardPreview } from '@/components/decks/card-preview';
import { EnrollButton } from '@/components/decks/enroll-button';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ col: string; topic: string; lesson: string }>;
}) {
  const { col, topic, lesson } = await params;
  const detail = await getLessonByPath(col, topic, lesson);
  if (!detail) notFound();

  const userId = await getCurrentUserId();
  const enrolled = userId ? await getEnrolledLessonIds(userId) : new Set<string>();
  const isEnrolled = enrolled.has(detail.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/decks/${detail.collection.slug}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ChevronLeft className="h-4 w-4" />
        {detail.collection.name} / {detail.topic.name}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{detail.name}</h1>
          {detail.description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{detail.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>{detail.cards.length} từ</span>
            {detail.estimatedMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {detail.estimatedMinutes} phút
              </span>
            )}
          </div>
        </div>
        <EnrollButton lessonId={detail.id} alreadyEnrolled={isEnrolled} />
      </div>

      <ul className="mt-6 space-y-3">
        {detail.cards.map((card) => (
          <li key={card.id}>
            <CardPreview card={card} />
          </li>
        ))}
      </ul>
    </div>
  );
}
