# Personal Vocabulary Learning Web — Build Blueprint

> **Mục đích**: Web học từ vựng cá nhân, kiến trúc clean để mở rộng SaaS sau.
> **Dùng cho**: Vibe coding với Claude Opus 4.7 / Cursor / Windsurf.
> **Cách dùng tài liệu này**: Đọc Phần 0 trước. Khi code, paste từng phase + relevant sections cho AI agent. Đừng paste cả file 1 lần (loãng context).

---

## Phần 0: Context cho AI Agent (đọc đầu tiên mỗi session)

### Bạn (AI) đang giúp build gì?

Web học từ vựng tiếng Anh cho người Việt. Một mình user dùng trước, nhưng kiến trúc phải sẵn sàng scale lên SaaS đa user mà không cần rewrite.

### Nguyên tắc bất di bất dịch

1. **Content-first**: Nội dung học (từ, ví dụ, dịch) được gen offline 1 lần bằng Claude desktop/ChatGPT free, lưu thành JSON trong `content/`, seed vào DB. **Không gọi LLM API runtime.**
2. **Multi-tenant ready**: Mọi user data row có `user_id`. RLS bật từ đầu. Không có concept "single user mode".
3. **Tách content khỏi state**: `cards` (nội dung, public-share-được) tách khỏi `user_cards` (SRS state per user). Đây là điều kiện sống còn để share deck sau này.
4. **No premature optimization**: Solo dev, ~2h/ngày, 6 tuần. Bỏ qua tRPC, GraphQL, microservices, Redux. Server Actions của Next.js là đủ.
5. **Type-safe end-to-end**: TypeScript strict, Drizzle types, Zod validation ở boundary.
6. **Idempotent mutations**: Mọi review submit có `client_review_id` để chống double-submit.
7. **Timezone-aware**: Lưu UTC, hiển thị theo `profiles.timezone`.

### Khi không chắc, hỏi user trước khi code

- Quyết định ảnh hưởng schema → hỏi
- Quyết định ảnh hưởng UX flow → hỏi
- Quyết định "kiểu code" (folder, naming) → hỏi 1 lần, sau đó tự nhất quán
- Bug fix nhỏ, refactor nội bộ → cứ làm

### Stack đã chốt — KHÔNG đổi giữa chừng

```
Framework:     Next.js 15 (App Router, Server Actions, RSC)
Language:      TypeScript strict mode
DB + Auth:     Supabase (Postgres + RLS + Auth)
ORM:           Drizzle ORM + drizzle-kit
Validation:    Zod
UI:            shadcn/ui + Tailwind v4
Animation:     Framer Motion
Icons:         Lucide React
Fonts:         Geist Sans + Geist Mono
SRS:           ts-fsrs
State (client):Zustand (chỉ cho review session)
Forms:         React Hook Form
Toast:         Sonner
Command:       cmdk (Ctrl+K palette)
Theme:         next-themes
Date utils:    date-fns + date-fns-tz
Deploy:        Vercel
TTS:           Web Speech API (free), cache audio Supabase Storage sau
```

---

## Phần 1: Triết lý nội dung

### 1.1 Cấu trúc 3 tầng

```
Collection (bộ sách)
  └─ Topic (chủ đề)
      └─ Lesson (15-30 từ)
          └─ Cards
```

Ví dụ:

- `Oxford 3000` → `Daily Life` → `Family & Relationships` → 25 cards
- `IELTS Academic` → `Environment` → `Climate Change` → 20 cards

### 1.2 Quy trình gen content offline (chi phí $0)

```
1. Chọn wordlist (Oxford 3000, AWL, NGSL, etc.) — chỉ list từ, không bản quyền
2. Mở Claude desktop / ChatGPT free
3. Paste 20-30 từ + prompt template (ở Phần 1.4)
4. LLM trả JSON đầy đủ
5. Lưu vào content/collections/<col>/topics/<topic>/<lesson>.json
6. Commit git
7. Chạy `pnpm seed` → import Supabase
```

### 1.3 Nguồn wordlist hợp pháp

| Nguồn            | Số từ        | Cách lấy                             |
| ---------------- | ------------ | ------------------------------------ |
| Oxford 3000/5000 | 3000/5000    | GitHub: search "oxford-3000.csv"     |
| AWL              | 570 families | Wikipedia "Academic Word List"       |
| GSL              | 2000         | Public domain, GitHub                |
| NGSL             | 2800         | newgeneralservicelist.com (CC BY-SA) |
| COCA top 5000    | 5000         | wordfrequency.info                   |

**Chỉ lấy danh sách từ. KHÔNG copy định nghĩa/ví dụ từ Oxford, Cambridge, Merriam — có bản quyền.**

### 1.4 Prompt template (paste vào Claude desktop)

```
Tôi đang xây dataset học tiếng Anh cho người Việt. Với danh sách từ dưới đây,
trả về JSON array đúng format sau, không thêm text giải thích nào trước/sau:

[
  {
    "word": "ephemeral",
    "lemma": "ephemeral",
    "ipa": "/ɪˈfem.ər.əl/",
    "pos": "adjective",
    "cefr": "C1",
    "definitions": [
      {
        "meaning_en": "lasting for a very short time",
        "meaning_vi": "phù du, chóng tàn, ngắn ngủi",
        "examples": [
          {
            "en": "Fame in the digital age is often ephemeral.",
            "vi": "Sự nổi tiếng thời số thường rất phù du."
          },
          {
            "en": "The cherry blossoms are beautiful but ephemeral.",
            "vi": "Hoa anh đào đẹp nhưng ngắn ngủi."
          },
          {
            "en": "Her happiness proved ephemeral, lasting only a few days.",
            "vi": "Niềm vui của cô chỉ là ngắn ngủi, chỉ kéo dài vài ngày."
          }
        ]
      }
    ],
    "synonyms": ["transient", "fleeting", "short-lived"],
    "antonyms": ["permanent", "lasting", "enduring"],
    "collocations": ["ephemeral nature", "ephemeral beauty", "ephemeral pleasure"],
    "etymology_hint": "From Greek 'ephēmeros' = lasting only a day",
    "mnemonic_vi": "EPH (ếch) + ÊM (êm) + RAL: con ếch kêu êm 1 ngày rồi tắt"
  }
]

Yêu cầu chất lượng:
- 3 ví dụ mỗi nghĩa, ngữ cảnh tự nhiên (không sách giáo khoa)
- Dịch tiếng Việt mượt, không word-by-word
- IPA chuẩn British English
- Mnemonic giúp người Việt nhớ (gợi ý âm thanh, hình ảnh, hoặc liên tưởng)
- Nếu từ có nhiều nghĩa, tách ra nhiều definitions object
- pos dùng: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection
- cefr dùng: A1, A2, B1, B2, C1, C2

Danh sách từ:
[paste 20-30 từ ở đây]
```

### 1.5 Folder structure cho content

```
content/
├── collections/
│   ├── oxford-3000/
│   │   ├── meta.json
│   │   └── topics/
│   │       ├── daily-life/
│   │       │   ├── meta.json
│   │       │   ├── family.json
│   │       │   └── food.json
│   │       └── work/
│   └── ielts-academic/
└── seed.ts
```

Mỗi `meta.json`:

```json
// collections/oxford-3000/meta.json
{
  "slug": "oxford-3000",
  "name": "Oxford 3000",
  "description": "3000 từ tiếng Anh thiết yếu nhất theo Oxford",
  "level_min": "A1",
  "level_max": "B2",
  "is_official": true,
  "cover_image": null
}

// topics/daily-life/meta.json
{
  "slug": "daily-life",
  "name": "Daily Life",
  "description": "Từ vựng cho cuộc sống hằng ngày",
  "order_index": 1,
  "icon": "home",
  "color": "#3b82f6"
}

// lessons/family.json — file này chứa lesson meta + cards
{
  "slug": "family-relationships",
  "name": "Family & Relationships",
  "description": "Từ vựng về gia đình",
  "order_index": 1,
  "estimated_minutes": 10,
  "cards": [
    { "word": "...", "ipa": "...", ... },
    ...
  ]
}
```

---

## Phần 2: Architecture

### 2.1 High-level

```
[Next.js 15 App Router]
   ↓ Server Actions / Route Handlers
[Drizzle ORM + Zod validation at boundary]
   ↓
[Supabase Postgres with RLS]
   ↓
[Supabase Auth] [Supabase Storage (audio cache later)]
```

### 2.2 Folder structure

```
src/
├── app/                          # Next.js routes
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/                    # Protected via middleware
│   │   ├── layout.tsx            # Sidebar + topbar
│   │   ├── page.tsx              # Dashboard
│   │   ├── review/
│   │   │   ├── page.tsx
│   │   │   └── summary/page.tsx
│   │   ├── decks/
│   │   │   ├── page.tsx
│   │   │   └── [collectionSlug]/
│   │   │       ├── page.tsx
│   │   │       └── [topicSlug]/
│   │   │           └── [lessonSlug]/page.tsx
│   │   ├── stats/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   └── ...                   # Chỉ khi Server Actions không đủ
│   ├── layout.tsx
│   └── globals.css
├── features/                     # Business logic by domain
│   ├── srs/
│   │   ├── scheduler.ts          # FSRS wrapper
│   │   ├── queue.ts              # Review queue
│   │   ├── review.ts             # submitReview()
│   │   └── types.ts
│   ├── vocab/
│   │   ├── cards.ts              # CRUD cards
│   │   ├── decks.ts              # Collections/topics/lessons
│   │   └── enrollment.ts         # User enroll lesson
│   ├── stats/
│   │   ├── streak.ts
│   │   ├── heatmap.ts
│   │   └── retention.ts
│   └── gamification/             # Sau MVP
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── cards/
│   │   ├── flashcard.tsx
│   │   ├── review-card.tsx
│   │   └── rating-buttons.tsx
│   ├── forms/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   └── command-palette.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── client.ts             # DB client
│   │   └── migrations/
│   ├── supabase/
│   │   ├── server.ts             # Server client
│   │   ├── client.ts             # Browser client
│   │   └── middleware.ts
│   ├── auth/
│   │   └── session.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── dates.ts              # Timezone helpers
│   │   └── ids.ts
│   └── env.ts                    # Zod-validated env
├── stores/
│   └── review-session.ts         # Zustand
├── content/                      # Source content (git)
│   └── collections/...
├── scripts/
│   └── seed.ts                   # Content → DB
├── middleware.ts
└── styles/
```

### 2.3 Naming & code conventions

- File: `kebab-case.ts`
- Component: `PascalCase`, file `kebab-case.tsx`
- Server Actions: `verbNoun()` e.g. `submitReview`, `createCard`
- DB columns: `snake_case`
- TS types: `PascalCase`
- Zod schemas: `xxxSchema`
- Server Actions trả về `{ ok: true, data } | { ok: false, error }` — không throw

---

## Phần 3: Database Schema

### 3.1 Drizzle schema (`src/lib/db/schema.ts`)

```typescript
import {
  pgTable,
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
import { authUsers } from 'drizzle-orm/supabase';

// ============ ENUMS ============
export const cardStateEnum = pgEnum('card_state', ['new', 'learning', 'review', 'relearning']);
export const reviewTypeEnum = pgEnum('review_type', ['flashcard', 'mcq', 'typing', 'listening']);
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
```

### 3.2 RLS policies (SQL — chạy 1 lần sau migration)

```sql
-- Profiles: owner only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User cards / logs / sessions / stats / lessons: owner only
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_cards_owner" ON user_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_logs_owner" ON review_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_sessions_owner" ON study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_owner" ON user_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_lessons_owner" ON user_lessons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Content: read public if is_official, write owner only
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_read" ON collections FOR SELECT
  USING (is_official = true OR owner_id = auth.uid());
CREATE POLICY "collections_write" ON collections FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "collections_update" ON collections FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "collections_delete" ON collections FOR DELETE
  USING (owner_id = auth.uid());

-- topics/lessons/cards: cascade — readable if parent collection readable
-- Simplest: same logic via JOIN or denormalize is_public flag
-- For MVP: just allow SELECT to all authenticated, restrict writes to admin
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_read_auth" ON topics FOR SELECT TO authenticated USING (true);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_read_auth" ON lessons FOR SELECT TO authenticated USING (true);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_read_auth" ON cards FOR SELECT TO authenticated USING (true);

-- Trigger: auto-create profile + user_stats when new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Phần 4: SRS Engine

### 4.1 FSRS wrapper (`src/features/srs/scheduler.ts`)

```typescript
import { fsrs, generatorParameters, Rating, State, type Card as FSRSCard } from 'ts-fsrs';
import type { UserCard } from '@/lib/db/schema';

const f = fsrs(
  generatorParameters({
    enable_fuzz: true,
    request_retention: 0.9,
    maximum_interval: 36500,
  })
);

export function toFSRSCard(uc: UserCard): FSRSCard {
  return {
    due: uc.due,
    stability: uc.stability,
    difficulty: uc.difficulty,
    elapsed_days: uc.elapsedDays,
    scheduled_days: uc.scheduledDays,
    reps: uc.reps,
    lapses: uc.lapses,
    state: stateToFSRS(uc.state),
    last_review: uc.lastReview ?? undefined,
  };
}

export function scheduleNext(
  uc: UserCard,
  rating: 1 | 2 | 3 | 4,
  now = new Date()
): Partial<UserCard> {
  const card = toFSRSCard(uc);
  const result = f.repeat(card, now);
  const next = result[rating as Rating].card;

  return {
    stability: next.stability,
    difficulty: next.difficulty,
    elapsedDays: next.elapsed_days,
    scheduledDays: next.scheduled_days,
    reps: next.reps,
    lapses: next.lapses,
    state: stateFromFSRS(next.state),
    lastReview: next.last_review,
    due: next.due,
  };
}

// State helpers
function stateToFSRS(s: UserCard['state']): State {
  return {
    new: State.New,
    learning: State.Learning,
    review: State.Review,
    relearning: State.Relearning,
  }[s];
}
function stateFromFSRS(s: State): UserCard['state'] {
  return {
    [State.New]: 'new',
    [State.Learning]: 'learning',
    [State.Review]: 'review',
    [State.Relearning]: 'relearning',
  }[s] as any;
}
```

### 4.2 Review queue (`src/features/srs/queue.ts`)

```typescript
import { db } from '@/lib/db/client';
import { userCards, cards, profiles } from '@/lib/db/schema';
import { and, eq, lte, ne, asc, sql } from 'drizzle-orm';

export async function getReviewQueue(opts: {
  userId: string;
  reviewLimit?: number;
  newLimit?: number;
  lessonId?: string;
}) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, opts.userId),
  });
  const newLimit = opts.newLimit ?? profile?.dailyNewCards ?? 20;
  const reviewLimit = opts.reviewLimit ?? profile?.dailyReviewMax ?? 200;

  // Đếm new cards đã học hôm nay (theo TZ user)
  const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
  const newToday = await countNewLearnedToday(opts.userId, tz);
  const newQuota = Math.max(0, newLimit - newToday);

  // Due reviews
  const due = await db
    .select()
    .from(userCards)
    .innerJoin(cards, eq(cards.id, userCards.cardId))
    .where(
      and(
        eq(userCards.userId, opts.userId),
        eq(userCards.suspended, false),
        ne(userCards.state, 'new'),
        lte(userCards.due, new Date()),
        opts.lessonId ? eq(userCards.lessonId, opts.lessonId) : undefined
      )
    )
    .orderBy(asc(userCards.due))
    .limit(reviewLimit);

  // New cards
  const newOnes =
    newQuota > 0
      ? await db
          .select()
          .from(userCards)
          .innerJoin(cards, eq(cards.id, userCards.cardId))
          .where(
            and(
              eq(userCards.userId, opts.userId),
              eq(userCards.state, 'new'),
              eq(userCards.suspended, false),
              opts.lessonId ? eq(userCards.lessonId, opts.lessonId) : undefined
            )
          )
          .orderBy(asc(userCards.createdAt))
          .limit(newQuota)
      : [];

  return interleave(due, newOnes);
}

// Trộn new vào review, không dồn cuối
function interleave<T>(reviews: T[], news: T[]): T[] {
  if (news.length === 0) return reviews;
  if (reviews.length === 0) return news;
  const step = Math.max(1, Math.floor(reviews.length / news.length));
  const out: T[] = [];
  let ni = 0;
  for (let i = 0; i < reviews.length; i++) {
    out.push(reviews[i]);
    if (ni < news.length && (i + 1) % step === 0) {
      out.push(news[ni++]);
    }
  }
  while (ni < news.length) out.push(news[ni++]);
  return out;
}
```

### 4.3 Submit review (`src/features/srs/review.ts`)

```typescript
'use server';
import { db } from '@/lib/db/client';
import { userCards, reviewLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { scheduleNext, toFSRSCard } from './scheduler';
import { z } from 'zod';

const submitSchema = z.object({
  userCardId: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  durationMs: z.number().int().min(0).max(600_000),
  clientReviewId: z.string().min(1).max(128),
  reviewType: z.enum(['flashcard', 'mcq', 'typing', 'listening']).default('flashcard'),
});

export async function submitReview(input: z.infer<typeof submitSchema>) {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' as const };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: 'unauthorized' as const };

  // Idempotency
  const existing = await db.query.reviewLogs.findFirst({
    where: and(
      eq(reviewLogs.userId, userId),
      eq(reviewLogs.clientReviewId, parsed.data.clientReviewId)
    ),
  });
  if (existing) return { ok: true, data: existing };

  return await db.transaction(async (tx) => {
    const uc = await tx.query.userCards.findFirst({
      where: and(eq(userCards.id, parsed.data.userCardId), eq(userCards.userId, userId)),
    });
    if (!uc) return { ok: false, error: 'not_found' as const };

    const stateBefore = toFSRSCard(uc);
    const next = scheduleNext(uc, parsed.data.rating);

    const [log] = await tx
      .insert(reviewLogs)
      .values({
        userId,
        userCardId: uc.id,
        rating: parsed.data.rating,
        durationMs: parsed.data.durationMs,
        stateBefore,
        stateAfter: next,
        reviewType: parsed.data.reviewType,
        clientReviewId: parsed.data.clientReviewId,
      })
      .returning();

    await tx.update(userCards).set(next).where(eq(userCards.id, uc.id));

    await updateStreakAndStats(tx, userId);

    return { ok: true, data: log };
  });
}
```

---

## Phần 5: Wireframes

### 5.1 Dashboard `/`

```
┌─────────────────────────────────────────────────┐
│  Logo        Search (⌘K)         🌙  👤        │
├─────────────────────────────────────────────────┤
│  Chào buổi sáng, [Name]                        │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 23 từ    │ │ 🔥 12    │ │ 847      │       │
│  │ cần ôn   │ │ ngày     │ │ từ thuộc │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  [▶ Bắt đầu ôn tập]                            │
│                                                 │
│  ─── Đang học ───                              │
│  • Oxford 3000 / Daily Life      ▓▓▓░░ 60%   │
│  • IELTS Academic / Environment  ▓░░░░ 20%   │
│                                                 │
│  ─── Hoạt động 6 tháng qua ───                │
│  [Heatmap GitHub-style]                        │
└─────────────────────────────────────────────────┘
```

### 5.2 Review `/review` (mặt trước)

```
┌─────────────────────────────────────────────────┐
│  ✕                Progress: 12 / 50            │
├─────────────────────────────────────────────────┤
│                                                 │
│                  ephemeral                      │
│                /ɪˈfem.ər.əl/  🔊               │
│                  adjective                      │
│                                                 │
│         [Hiện đáp án — Space]                  │
└─────────────────────────────────────────────────┘
```

### 5.3 Review (mặt sau)

```
┌─────────────────────────────────────────────────┐
│  ephemeral  /ɪˈfem.ər.əl/  🔊  adj             │
│                                                 │
│  📖 phù du, chóng tàn, ngắn ngủi               │
│                                                 │
│  Ví dụ:                                        │
│  • Fame in the digital age is often ephemeral.│
│    Sự nổi tiếng thời số thường rất phù du.    │
│                                                 │
│  Đồng nghĩa: transient, fleeting               │
│  💡 EPH (ếch) + ÊM: ếch kêu êm 1 ngày         │
│                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │Again│ │Hard │ │Good │ │Easy │              │
│  │ <1m │ │ 6m  │ │ 1d  │ │ 4d  │              │
│  │ [1] │ │ [2] │ │ [3] │ │ [4] │              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
└─────────────────────────────────────────────────┘
```

### 5.4 Keyboard shortcuts

| Key               | Action          |
| ----------------- | --------------- |
| `Space` / `Enter` | Flip card       |
| `1` / `J`         | Again           |
| `2` / `K`         | Hard            |
| `3` / `L`         | Good            |
| `4` / `;`         | Easy            |
| `R`               | Replay audio    |
| `E`               | Edit card       |
| `S`               | Suspend         |
| `U`               | Undo last       |
| `⌘K`              | Command palette |
| `Esc`             | Exit review     |

---

## Phần 6: Roadmap 6 tuần

### Tuần 1 — Foundation

```
[ ] Init Next.js 15 + TS strict + Tailwind v4
[ ] Setup Supabase project
[ ] Drizzle config + connection (lib/db/client.ts)
[ ] Schema migrations
[ ] RLS policies (run SQL)
[ ] Supabase Auth (magic link + Google OAuth)
[ ] Middleware: protect (app) routes
[ ] Layout shell: sidebar + topbar (shadcn)
[ ] Theme provider (next-themes)
[ ] Geist fonts
[ ] Command palette skeleton (cmdk)
[ ] Deploy Vercel
```

### Tuần 2 — Content & Seed

```
[ ] Tạo content/collections/oxford-3000/ với 2-3 lesson pilot
[ ] Gen 60-90 từ bằng Claude desktop (free)
[ ] Viết scripts/seed.ts (đọc JSON → upsert DB)
[ ] CRUD collections/topics/lessons (admin UI đơn giản)
[ ] Page /decks: list collections
[ ] Page /decks/[col]/[topic]/[lesson]: chi tiết + cards
[ ] Lesson enrollment ("Thêm vào học")
[ ] Card detail modal/page
```

### Tuần 3 — SRS Core

```
[ ] Cài ts-fsrs, viết features/srs/
[ ] Review queue algorithm + tests
[ ] Page /review với Zustand session store
[ ] Flashcard component + Framer Motion flip
[ ] Rating buttons với hint thời gian
[ ] Keyboard shortcuts
[ ] Optimistic update + idempotency (clientReviewId)
[ ] Server action submitReview
[ ] Page /review/summary
[ ] Daily new cards limit
[ ] Edge: empty queue, exit mid-session resume
```

### Tuần 4 — Dashboard & Stats

```
[ ] Streak calculation (timezone-aware, date-fns-tz)
[ ] Heatmap component (react-calendar-heatmap)
[ ] Dashboard: 3 stat cards + streak + lessons in progress
[ ] Page /stats: retention chart, daily activity bar
[ ] Card maturity distribution
[ ] Page /settings: timezone, daily limits, theme
```

### Tuần 5 — Minigames + Polish

```
[ ] MCQ mode: 4 đáp án (1 đúng + 3 distractors cùng lesson)
[ ] Typing mode (gõ word khi thấy nghĩa)
[ ] Listening mode (nghe audio, gõ word)
[ ] Mode picker trong /review
[ ] Web Speech API TTS
[ ] Toast cho milestones (streak +1, lesson hoàn thành)
[ ] Loading states + skeletons
[ ] Empty states đẹp + helpful
```

### Tuần 6 — Scale content + ship

```
[ ] Gen thêm 500-1000 từ (Claude desktop, nhiều batch)
[ ] CSV import UI
[ ] Card editing UI (sửa khi gen sai)
[ ] Suspend/bury cards
[ ] Personal notes per card
[ ] Mobile responsive QA
[ ] Perf: Lighthouse > 90
[ ] GitHub Actions cron: daily DB backup → GitHub release
[ ] README cho repo
```

---

## Phần 7: Pitfalls đã biết — fix sẵn

| Bẫy                                                | Giải pháp                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Streak lệch ngày do timezone                       | Lưu `due` UTC. Tính streak theo `profiles.timezone` dùng `date-fns-tz`. `last_active_date` lưu `YYYY-MM-DD` ở TZ user.               |
| Double-submit review khi mạng yếu                  | `clientReviewId` (uuid v4 client gen) + unique index `(user_id, client_review_id)` trên `review_logs`. Submit lần 2 → return log cũ. |
| Content sai sau gen                                | `content_version` trên `cards`. UI cho admin edit. User override qua `user_cards.notes`.                                             |
| User học quá nhiều card mới                        | `daily_new_cards` cap 20. Đếm new learned today trước khi serve new cards.                                                           |
| FSRS params chưa optimal                           | `fsrs_version` cột. Sau ~1000 reviews chạy FSRS optimizer trên `review_logs` để tune `request_retention`.                            |
| Supabase free hết                                  | Cron GitHub Actions daily: `pg_dump` → upload artifact. Nâng cấp $25/mo khi >500MB.                                                  |
| Audio TTS inconsistent                             | Web Speech API mỗi browser khác. Tương lai: pre-gen audio (ElevenLabs/Coqui) → cache Supabase Storage.                               |
| Lessons cardCount lệch sau insert                  | Trigger SQL hoặc tính trong seed script — đừng tin client cập nhật.                                                                  |
| Server Action lỗi nhưng UI tưởng OK                | Server Actions luôn return `{ ok: boolean, error?, data? }` — không throw. Client check `ok` trước khi optimistic update final.      |
| Drizzle migrations conflict khi solo dev nhiều máy | Chỉ chạy `drizzle-kit generate` trên 1 máy chính. Commit migration files vào git.                                                    |
| Loading flashcard nháy ảnh placeholder             | Preload next 3 cards trong queue. Component dùng `<Suspense>` boundary.                                                              |

---

## Phần 8: Cách dùng tài liệu này khi vibe code

### Khi bắt đầu session mới với AI agent

Paste prompt sau làm system context:

```
Tôi đang build Vocab Learning Web theo blueprint ở VOCAB_APP_BLUEPRINT.md.
Stack đã chốt: Next.js 15 + Supabase + Drizzle + shadcn/ui + ts-fsrs.
Triết lý: content-first (gen offline, store DB), multi-tenant ready, no premature optimization.
Tôi đang ở Tuần [X], task [Y].
Đây là phần liên quan của blueprint: [paste phần cần thiết]
[mô tả task cụ thể]
```

### Khi gặp quyết định khó

Quay lại Phần 0 — "Nguyên tắc bất di bất dịch". Nếu AI đề xuất gì vi phạm, push back.

### Khi muốn thêm feature mới

Hỏi: "feature này thuộc MVP (Tuần 1-6) hay post-MVP?". Nếu post-MVP, ghi vào backlog, không làm bây giờ.

### Khi AI gen content database

KHÔNG cho AI gọi LLM API trong code. Content luôn vào `content/` trước, qua seed script. Lý do: deterministic, free, version controlled.

---

## Phần 9: Post-MVP backlog (chỉ khi đã dùng 60 ngày liên tục)

- Billing: Polar/Stripe + bảng `subscriptions`
- Public deck marketplace + fork/clone
- Mobile app: Expo, share `features/`
- Browser extension: bôi từ trên web → add deck
- AI tutor chat (lúc này có user trả tiền → gọi LLM realtime OK)
- Audio pre-gen với ElevenLabs/Coqui TTS
- FSRS parameter optimizer cá nhân hóa
- Cloze deletion cards (Anki-style)
- Image occlusion (cho từ vựng visual)
- Social: friends, leaderboard, shared streak

---

**End of blueprint.** Bản này đủ chi tiết để vibe code từ A→Z. Khi cần, copy section cần dùng vào prompt — không paste cả file mỗi lần (loãng context AI agent).
