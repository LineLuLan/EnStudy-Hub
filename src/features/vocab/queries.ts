import 'server-only';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  collections,
  topics,
  lessons,
  cards,
  userCards,
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

async function withCounts(cols: Collection[]): Promise<CollectionWithCounts[]> {
  if (cols.length === 0) return [];
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

export async function listOfficialCollections(): Promise<CollectionWithCounts[]> {
  const cols = await db.query.collections.findMany({
    where: eq(collections.isOfficial, true),
    orderBy: [asc(collections.createdAt)],
  });
  return withCounts(cols);
}

/**
 * List collections owned by the given user (non-official, personal imports).
 * Drizzle bypasses RLS via service-role; ownership enforced here in app code.
 */
export async function listUserOwnedCollections(userId: string): Promise<CollectionWithCounts[]> {
  const cols = await db.query.collections.findMany({
    where: and(eq(collections.ownerId, userId), eq(collections.isOfficial, false)),
    orderBy: [asc(collections.createdAt)],
  });
  return withCounts(cols);
}

export type TopicWithLessons = Topic & {
  lessons: Array<
    Pick<Lesson, 'id' | 'slug' | 'name' | 'cardCount' | 'estimatedMinutes' | 'orderIndex'>
  >;
};

export type CollectionDetail = Collection & {
  topics: TopicWithLessons[];
};

export async function getCollectionBySlug(
  slug: string,
  userId: string | null
): Promise<CollectionDetail | null> {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.slug, slug),
  });
  if (!collection) return null;
  // Ownership gate: official collections are public; user-owned collections
  // are private. Drizzle bypasses RLS, so enforce here.
  if (!collection.isOfficial && collection.ownerId !== userId) return null;

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
  lessonSlug: string,
  userId: string | null
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
  // Ownership gate (see getCollectionBySlug).
  if (!hit.collection.isOfficial && hit.collection.ownerId !== userId) return null;

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

export type EnrolledLessonProgress = {
  lessonId: string;
  lessonSlug: string;
  lessonName: string;
  cardCount: number;
  topicSlug: string;
  topicName: string;
  colSlug: string;
  colName: string;
  learned: number; // user_cards in this lesson where state != 'new'
  total: number; // user_cards seeded for this lesson (= cardCount on enrollment)
};

/**
 * List the user's enrolled lessons with progress metrics, newest first.
 * Powers the "Bài đang học" widget on the dashboard.
 *
 * Done in two round-trips: (1) join user_lessons → lessons → topics →
 * collections for metadata, (2) read user_cards for the matching lessonIds
 * and aggregate state in JS. Volume per user is small (tens of lessons).
 */
export async function getEnrolledLessonsWithProgress(
  userId: string
): Promise<EnrolledLessonProgress[]> {
  const lessonRows = await db
    .select({
      lessonId: lessons.id,
      lessonSlug: lessons.slug,
      lessonName: lessons.name,
      cardCount: lessons.cardCount,
      topicSlug: topics.slug,
      topicName: topics.name,
      colSlug: collections.slug,
      colName: collections.name,
      startedAt: userLessons.startedAt,
    })
    .from(userLessons)
    .innerJoin(lessons, eq(lessons.id, userLessons.lessonId))
    .innerJoin(topics, eq(topics.id, lessons.topicId))
    .innerJoin(collections, eq(collections.id, topics.collectionId))
    .where(eq(userLessons.userId, userId))
    .orderBy(desc(userLessons.startedAt));

  if (lessonRows.length === 0) return [];

  const lessonIds = lessonRows.map((r) => r.lessonId);

  const cardRows = await db
    .select({ lessonId: userCards.lessonId, state: userCards.state })
    .from(userCards)
    .where(and(eq(userCards.userId, userId), inArray(userCards.lessonId, lessonIds)));

  const totalByLesson = new Map<string, number>();
  const learnedByLesson = new Map<string, number>();
  for (const r of cardRows) {
    totalByLesson.set(r.lessonId, (totalByLesson.get(r.lessonId) ?? 0) + 1);
    if (r.state !== 'new') {
      learnedByLesson.set(r.lessonId, (learnedByLesson.get(r.lessonId) ?? 0) + 1);
    }
  }

  return lessonRows.map((r) => ({
    lessonId: r.lessonId,
    lessonSlug: r.lessonSlug,
    lessonName: r.lessonName,
    cardCount: r.cardCount,
    topicSlug: r.topicSlug,
    topicName: r.topicName,
    colSlug: r.colSlug,
    colName: r.colName,
    learned: learnedByLesson.get(r.lessonId) ?? 0,
    total: totalByLesson.get(r.lessonId) ?? 0,
  }));
}
