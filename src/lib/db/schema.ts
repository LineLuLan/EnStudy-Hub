import {
  pgTable,
  pgSchema,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ============ AUTH (Supabase managed) ============
// Reference to auth.users — Supabase manages this table.
// We declare it here only so foreign keys are typed.
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

// ============ ENUMS ============
export const cardStateEnum = pgEnum('card_state', [
  'new',
  'learning',
  'review',
  'relearning',
]);

export const reviewTypeEnum = pgEnum('review_type', [
  'flashcard',
  'mcq',
  'typing',
  'listening',
]);

export const cefrEnum = pgEnum('cefr', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// ============ CONTENT (public-shareable) ============

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  languageFrom: text('language_from').notNull().default('en'),
  languageTo: text('language_to').notNull().default('vi'),
  levelMin: cefrEnum('level_min'),
  levelMax: cefrEnum('level_max'),
  isOfficial: boolean('is_official').notNull().default(false),
  ownerId: uuid('owner_id').references(() => authUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const topics = pgTable(
  'topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    orderIndex: integer('order_index').notNull().default(0),
    icon: text('icon'),
    color: text('color'),
  },
  (t) => ({
    unq: uniqueIndex('topic_collection_slug').on(t.collectionId, t.slug),
  })
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    orderIndex: integer('order_index').notNull().default(0),
    cardCount: integer('card_count').notNull().default(0),
    estimatedMinutes: integer('estimated_minutes'),
  },
  (t) => ({
    unq: uniqueIndex('lesson_topic_slug').on(t.topicId, t.slug),
  })
);

export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    word: text('word').notNull(),
    lemma: text('lemma'),
    ipa: text('ipa'),
    pos: text('pos'),
    cefrLevel: cefrEnum('cefr_level'),
    // definitions: [{ meaning_en, meaning_vi, examples: [{en, vi}] }]
    definitions: jsonb('definitions').notNull().default([]),
    synonyms: text('synonyms').array(),
    antonyms: text('antonyms').array(),
    collocations: text('collocations').array(),
    etymologyHint: text('etymology_hint'),
    mnemonicVi: text('mnemonic_vi'),
    audioUrl: text('audio_url'),
    imageUrl: text('image_url'),
    source: text('source').notNull().default('manual'),
    contentVersion: integer('content_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    lessonIdx: index('card_lesson_idx').on(t.lessonId),
  })
);

// ============ USER STATE ============

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  avatar: text('avatar'),
  timezone: text('timezone').notNull().default('Asia/Ho_Chi_Minh'),
  locale: text('locale').notNull().default('vi'),
  dailyNewCards: integer('daily_new_cards').notNull().default(20),
  dailyReviewMax: integer('daily_review_max').notNull().default(200),
  uiPrefs: jsonb('ui_prefs').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userLessons = pgTable(
  'user_lessons',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.lessonId] }),
  })
);

export const userCards = pgTable(
  'user_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    // FSRS state
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    elapsedDays: integer('elapsed_days').notNull().default(0),
    scheduledDays: integer('scheduled_days').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    state: cardStateEnum('state').notNull().default('new'),
    lastReview: timestamp('last_review', { withTimezone: true }),
    due: timestamp('due', { withTimezone: true }).notNull().defaultNow(),
    // meta
    suspended: boolean('suspended').notNull().default(false),
    fsrsVersion: integer('fsrs_version').notNull().default(1),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex('user_card_unq').on(t.userId, t.cardId),
    dueIdx: index('user_card_due_idx').on(t.userId, t.due),
  })
);

export const reviewLogs = pgTable(
  'review_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userCardId: uuid('user_card_id')
      .notNull()
      .references(() => userCards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1=again, 2=hard, 3=good, 4=easy
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
    durationMs: integer('duration_ms'),
    stateBefore: jsonb('state_before'),
    stateAfter: jsonb('state_after'),
    reviewType: reviewTypeEnum('review_type').notNull().default('flashcard'),
    clientReviewId: text('client_review_id').notNull(),
  },
  (t) => ({
    clientUnq: uniqueIndex('review_log_client_unq').on(t.userId, t.clientReviewId),
    userTimeIdx: index('review_log_user_time').on(t.userId, t.reviewedAt),
  })
);

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  cardsReviewed: integer('cards_reviewed').notNull().default(0),
  accuracyPct: real('accuracy_pct'),
  newCardsLearned: integer('new_cards_learned').notNull().default(0),
  xpGained: integer('xp_gained').notNull().default(0),
});

export const userStats = pgTable('user_stats', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  totalReviews: integer('total_reviews').notNull().default(0),
  totalCardsMature: integer('total_cards_mature').notNull().default(0),
  lastActiveDate: text('last_active_date'), // YYYY-MM-DD in user TZ
});

// ============ TYPE EXPORTS ============
export type Collection = typeof collections.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserCard = typeof userCards.$inferSelect;
export type ReviewLog = typeof reviewLogs.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
