import 'server-only';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  collections,
  topics,
  lessons,
  cards,
  userLessons,
  type Collection,
  type Topic,
  type Lesson,
  type Card,
} from '@/lib/db/schema';

export type CollectionWithCounts = Collection & {
  topicCount: number;
  lessonCount: number;
};

export async function listOfficialCollections(): Promise<CollectionWithCounts[]> {
  const cols = await db.query.collections.findMany({
    where: eq(collections.isOfficial, true),
    orderBy: [asc(collections.createdAt)],
  });
  if (cols.length === 0) return [];

  // Aggregate topics + lessons in two more round-trips. MVP volume is small;
  // can collapse to a single SQL with GROUP BY if it ever becomes hot.
  const topicRows = await db
    .select({ id: topics.id, collectionId: topics.collectionId })
    .from(topics)
    .where(
      inArray(
        topics.collectionId,
        cols.map((c) => c.id)
      )
    );

  const topicByCol = new Map<string, string[]>();
  for (const t of topicRows) {
    const arr = topicByCol.get(t.collectionId) ?? [];
    arr.push(t.id);
    topicByCol.set(t.collectionId, arr);
  }

  const allTopicIds = topicRows.map((t) => t.id);
  const lessonRows = allTopicIds.length
    ? await db
        .select({ topicId: lessons.topicId })
        .from(lessons)
        .where(inArray(lessons.topicId, allTopicIds))
    : [];

  const lessonCountByTopic = new Map<string, number>();
  for (const l of lessonRows) {
    lessonCountByTopic.set(l.topicId, (lessonCountByTopic.get(l.topicId) ?? 0) + 1);
  }

  return cols.map((c) => {
    const colTopicIds = topicByCol.get(c.id) ?? [];
    const lessonCount = colTopicIds.reduce(
      (sum, tid) => sum + (lessonCountByTopic.get(tid) ?? 0),
      0
    );
    return { ...c, topicCount: colTopicIds.length, lessonCount };
  });
}

export type TopicWithLessons = Topic & {
  lessons: Array<
    Pick<Lesson, 'id' | 'slug' | 'name' | 'cardCount' | 'estimatedMinutes' | 'orderIndex'>
  >;
};

export type CollectionDetail = Collection & {
  topics: TopicWithLessons[];
};

export async function getCollectionBySlug(slug: string): Promise<CollectionDetail | null> {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.slug, slug),
  });
  if (!collection) return null;

  const topicRows = await db.query.topics.findMany({
    where: eq(topics.collectionId, collection.id),
    orderBy: [asc(topics.orderIndex), asc(topics.name)],
  });

  if (topicRows.length === 0) {
    return { ...collection, topics: [] };
  }

  const lessonRows = await db.query.lessons.findMany({
    where: inArray(
      lessons.topicId,
      topicRows.map((t) => t.id)
    ),
    orderBy: [asc(lessons.orderIndex), asc(lessons.name)],
    columns: {
      id: true,
      slug: true,
      name: true,
      cardCount: true,
      estimatedMinutes: true,
      orderIndex: true,
      topicId: true,
    },
  });

  const lessonsByTopic = new Map<string, TopicWithLessons['lessons']>();
  for (const l of lessonRows) {
    const arr = lessonsByTopic.get(l.topicId) ?? [];
    arr.push({
      id: l.id,
      slug: l.slug,
      name: l.name,
      cardCount: l.cardCount,
      estimatedMinutes: l.estimatedMinutes,
      orderIndex: l.orderIndex,
    });
    lessonsByTopic.set(l.topicId, arr);
  }

  return {
    ...collection,
    topics: topicRows.map((t) => ({
      ...t,
      lessons: lessonsByTopic.get(t.id) ?? [],
    })),
  };
}

export type LessonDetail = Lesson & {
  cards: Card[];
  topic: Topic;
  collection: Collection;
};

export async function getLessonByPath(
  colSlug: string,
  topicSlug: string,
  lessonSlug: string
): Promise<LessonDetail | null> {
  const row = await db
    .select({
      lesson: lessons,
      topic: topics,
      collection: collections,
    })
    .from(lessons)
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(
      and(eq(collections.slug, colSlug), eq(topics.slug, topicSlug), eq(lessons.slug, lessonSlug))
    )
    .limit(1);

  const hit = row[0];
  if (!hit) return null;

  const cardRows = await db.query.cards.findMany({
    where: eq(cards.lessonId, hit.lesson.id),
    orderBy: [asc(cards.createdAt), asc(cards.word)],
  });

  return {
    ...hit.lesson,
    topic: hit.topic,
    collection: hit.collection,
    cards: cardRows,
  };
}

/**
 * Return the set of lessonIds this user has enrolled in.
 * Empty set if not signed in or no enrollments.
 */
export async function getEnrolledLessonIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ lessonId: userLessons.lessonId })
    .from(userLessons)
    .where(eq(userLessons.userId, userId));
  return new Set(rows.map((r) => r.lessonId));
}
