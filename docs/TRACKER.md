# Tracker — Roadmap 6 tuần + Phase 0

> **Quy ước**: `[ ]` todo, `[~]` đang làm, `[x]` xong, `[!]` blocker, `[-]` skip/đẩy lùi.
> Cập nhật trạng thái mỗi lần bắt đầu / kết thúc task.

---

## Phase 0 — Foundation ✅ DONE

**Mục tiêu**: repo có khung, docs, scaffold, content pilot — không cần Supabase chạy được `pnpm dev`.

- [x] Tạo nhánh `dev`, `be`, `fe` từ `main` + push remote
- [x] `.gitignore` + `docs/` (9 file: README, TRACKER, HANDOFF, SYNC, DECISIONS, API_KEYS, CONTENT_PIPELINE, CONTRIBUTING, ENVIRONMENT, GLOSSARY)
- [x] Next.js 15 + TS strict + Tailwind v4 scaffold trong root (package.json + tsconfig + next.config + postcss + drizzle config)
- [x] Config files: `tsconfig`, `next.config`, `tailwind`/`postcss`, `drizzle`, `eslint`, `prettier`, `commitlint`
- [x] Folder skeleton `src/{app,features,components,lib,stores}` theo blueprint 2.2
- [x] Drizzle schema full (blueprint 3.1) trong `src/lib/db/schema.ts`
- [x] Supabase clients (`server.ts`, `client.ts`, `middleware.ts`) via `@supabase/ssr`
- [x] `src/lib/env.ts` Zod-validated env + `.env.example`
- [x] Husky `pre-commit` (lint-staged) + `commit-msg` (commitlint)
- [x] Content wordlist sample (40-word subset Oxford 3000) ở `content/wordlists/oxford-3000-sample.csv`
- [x] Pilot lesson `daily-life/family` — **5 cards** (family, mother, father, son, daughter, full IPA/VI/examples/mnemonic)
- [x] `scripts/seed.ts` (dry-run) + `scripts/validate-content.ts` (cross-check dictionaryapi.dev) + `scripts/sync-branches.ps1`
- [x] Commit `dev` → merge `dev → be`, `dev → fe` → update `SYNC.md`
- [x] PR template `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `pnpm install` + `pnpm dev` verify (2026-05-11, commit `f8cc446`)
- [x] Cấp Supabase URL + 4 keys (verified 2026-05-12 qua auth flow real)
- [ ] **CHỜ USER**: bật branch protection GitHub cho `main` (require PR) — làm sau, không block ship
- [ ] **CHỜ USER**: gen thêm 15 cards còn lại cho lesson `family` qua Claude desktop (đã có 5, cần thêm 15 để đủ 20 theo blueprint) — đẩy sang Tuần 2

---

## Tuần 1 — Foundation ✅ DONE (2026-05-12)

- [x] Supabase project tạo + 4 keys cấp (2026-05-12)
- [x] `pnpm db:gen` → migration `src/lib/db/migrations/0000_breezy_swarm.sql` (11 tables, FKs, indexes)
- [x] `pnpm db:push` apply migration lên Supabase (fix env loading + skip auth.users CREATE, commit `5c47f9c`)
- [x] RLS SQL ready-to-run ở `src/lib/db/rls.sql`
- [x] Chạy `rls.sql` trên Supabase (2026-05-12: 19 policies + trigger `on_auth_user_created` enabled)
- [x] Auth magic link + Google OAuth: `src/features/auth/actions.ts` (signInWithMagicLink, signInWithGoogle, signOut)
- [x] OAuth callback: `src/app/auth/callback/route.ts`
- [x] Profile bootstrap fallback: `src/features/auth/profile.ts`
- [x] `middleware.ts` protect `(app)` routes
- [x] Layout shell: sidebar + topbar (`src/components/layout/{sidebar,topbar}.tsx`)
- [x] Theme provider (next-themes) wired ở `app/layout.tsx`
- [x] Toaster (sonner) provider
- [x] Geist fonts ở root layout
- [x] Command palette (cmdk, ⌘K) ở `src/components/command-palette.tsx`
- [x] Login page UI: `src/app/(auth)/login/page.tsx` + `src/components/auth/login-form.tsx`
- [x] UI primitives shadcn-style: button, input, label, separator, dropdown-menu
- [x] **Auth flow verified real** (2026-05-12): magic link → `/auth/callback` → `/dashboard`, trigger `handle_new_user` insert đúng `profiles` + `user_stats` (IDs match `auth.users.id`)
- [x] Merge `dev → main`, tag `v0.1.0-foundation` (2026-05-12)
- [-] Deploy Vercel — skip Tuần 1, đẩy về Tuần 6 release
- [-] Google OAuth credentials — skip, magic link đủ MVP, làm sau nếu cần

---

## Tuần 2 — Content & Seed

- [x] `scripts/seed.ts` upsert thật vào Supabase (Drizzle tx; idempotent; delete-replace cards per lesson; verify counts). Live run 2026-05-12: 1/1/3/60
- [x] `scripts/validate-content.ts` smoke-test với `family.json` — call dictionaryapi.dev, throttle 800ms, write `docs/CONTENT_REPORT.md`. 5/5 cards IPA mismatch (stylistic Oxford vs dict)
- [x] **Content master plan**: `docs/CONTENT_PLAN.md` — 10 topics, 42 lessons MVP, ~840 cards, phased P0-P4
- [x] **P0 batch DONE** (2026-05-12, 3 lesson / 60 cards): `daily-life/family` (20), `daily-life/food-meals` (20), `daily-life/home-rooms` (20)
- [x] Page `/decks` list collections (RSC + Drizzle queries)
- [x] Page `/decks/[col]` list topics + lessons với "Đang học" badge
- [x] Page `/decks/[col]/[topic]/[lesson]` detail + CardPreview collapsible
- [x] Lesson enrollment ("Thêm vào học") — server action `enrollLesson` insert user_lessons + bulk user_cards với FSRS defaults
- [x] **Render bug fixed** (2026-05-12 polish session): added `(app)/error.tsx` + `loading.tsx` + 3 route-level loading.tsx — Next 15 streaming RSC giờ có error boundary đúng
- [x] **UI polish DONE** (2026-05-12 polish session, commit `78d8bdd` trên fe → merge `ff527be` lên dev):
  - Typography: explicit `text-zinc-900 dark:text-zinc-50` contrast, `leading-relaxed` description, topic header `text-xl tracking-tight`, lesson title `tracking-tight`
  - Spacing: topic section `space-y-8 → space-y-10`, soft divider `divide-zinc-100 dark:divide-zinc-900`, lesson meta `mt-0.5 → mt-1`
  - Card density: lesson detail `max-w-3xl → max-w-5xl` + `grid lg:grid-cols-2 gap-3 items-start` (20 cards no longer stack)
  - Visual: mnemonic amber softened with `ring-1` thay vì saturated bg, CEFR blue → sky, IPA giữ `font-mono` (Geist Mono đã wired)
  - Empty states: 3 routes có empty UI với icon + heading + sub
  - Skeleton: `ui/skeleton.tsx` + 4 loading.tsx files (top-level + 3 segments)
- [x] **P1 batch DONE** (2026-05-15, 7 lesson / 140 cards + 2 topic meta): `daily-life/clothes-appearance` (20), `daily-life/body-health` (20), `daily-life/daily-routine` (20), `people/personality` (20), `people/emotions` (20), `time-numbers/time-dates` (20), `time-numbers/numbers-quantities` (20) — commit `9a0d112` trên be → merge `84f5979` lên dev → sync `4461ec2` xuống fe. AI gen one-time override of offline-only policy (cost vs quality tradeoff). Schema validated all 9 files; dictionaryapi IPA cross-check skipped per existing P0 precedent
- [x] **P2 batch DONE** (2026-05-15, 5 lesson / 100 cards + 1 topic meta): `time-numbers/weather-seasons` (20), `places-travel/city-places` (20), `places-travel/transportation` (20), `places-travel/countries-nationalities` (20), `people/greetings-social` (20) + meta `places-travel` — commit `0b2dbb9` trên be → merge `daed553` lên dev → sync `d3dd493` xuống fe. Gates green (typecheck 0 / lint 0 / 179 tests). 1st batch of 3-batch P2→P3→P4 override schedule.
- [x] **P3 partial DONE** (2026-05-15, 9 lesson / 180 cards + 1 topic meta): `people/relationships` (20), `people/life-stages` (20), `places-travel/hotel-restaurant` (20), `places-travel/airport-flight` (20), `work-business/jobs-occupations` (20), `work-business/office-workplace` (20), `work-business/meetings-comms` (20), `work-business/money-finance` (20), `work-business/career` (20) + meta `work-business` — commit `717d886` trên be → merge `42f5660` lên dev → sync `4d4c0be` xuống fe. Gates green. User truncated AI gen at work-business done — 12 lessons P3-remaining (education + nature-environment + entertainment) + 6 lessons P4 (society-culture + abstract-academic) handoff offline via `docs/CONTENT_BRIEF_P3_P4_REMAINING.md`.
- [x] **P3 CLOSED** (2026-05-15, 12 lesson / 240 cards + 3 topic metas): `education/{school-classroom, subjects-academic, exams-results, learning-skills}` (80), `nature-environment/{animals-pets, plants-trees, landscape-geography, climate-env}` (80), `entertainment/{sports-games, music-arts, movies-tv, hobbies-leisure}` (80) + meta `education, nature-environment, entertainment` — 3 commits trên be (`abc4006`, `4eeb615`, `3744fcd`) → merge be → dev → sync fe. Gates green (typecheck 0 / lint 0 / 179 tests). User explicit override AI gen (lần 2). P3 toàn phase đóng. **Progress: 36/42 lessons = 720/840 cards = 86%.**
- [x] **P4 CLOSED — MVP COMPLETE** (2026-05-16, 6 lesson / 120 cards + 2 topic metas): `society-culture/{government-law, traditions-festivals, news-media}` (60), `abstract-academic/{thinking-knowledge, cause-effect, linking-words}` (60) + meta `society-culture, abstract-academic` — 2 commits trên be (`7920e0d`, `98eb9d7`) → merge be → dev → sync fe. Gates green (typecheck 0 / lint 0 / 179 tests). User explicit override AI gen (lần 3). **MVP target reached: 42/42 lessons = 840/840 cards = 100%.** All 10 topics shipped: daily-life, people, places-travel, time-numbers, work-business, education, nature-environment, entertainment, society-culture, abstract-academic.

### Post-MVP — Phase 5+ Full Oxford 3000 (theo `docs/CONTENT_PLAN_FULL.md`)

- [x] **P5a Common Core function words** (2026-05-16, 5 lessons / 100 cards + topic meta common-core): `articles-determiners, pronouns-basic, prepositions-place, prepositions-time-other, conjunctions-basic` — commit `15fa814` trên be → dev `6728b06` → fe `884d527`. Gates green. Live seed: 1 collection / 11 topics / 47 lessons / **940 cards**.
- [x] **P5b Common Core verbs/adj/adv — P5 CLOSED** (2026-05-16, 5 lessons / 100 cards): `core-be-do-have, core-action-verbs, core-mental-verbs, core-adjectives, core-adverbs` — commit `1775ac5` trên be → dev `67cc293` → fe `1247b0d`. Gates green. Live seed: **1 collection / 11 topics / 52 lessons / 1040 cards**. **P5 Common Core đóng đủ 10 lessons / 200 cards.**
- [x] **P6a A1 fillers** (2026-05-16, 5 lessons / 100 cards): `common-core/{colors-basic, shapes-sizes, common-a1-verbs-1}` + `daily-life/{body-parts-ext, food-cooking}` — commit `dfe0a97` trên be → dev `1cf9e1a` → fe `d0b57d7`. Gates green. Live seed: **1 collection / 11 topics / 57 lessons / 1140 cards**.
- [x] **P6b A1 fillers** (2026-05-16, 5 lessons / 100 cards): `common-core/{numbers-quantities-ext, common-a1-verbs-2, common-a1-adj}` + `time-numbers/weather-seasons-ext` + `people/family-people-ext` — commit `a7da661` trên be → dev `f555cb1` → fe `8cb2db8`. Gates green. Live seed: **1 collection / 11 topics / 62 lessons / 1240 cards**.
- [x] **P6c A1 fillers — P6 CLOSED** (2026-05-16, 5 lessons / 100 cards): `daily-life/clothes-accessories-ext` + `places-travel/transport-vehicles-ext` + `common-core/{common-a1-adv, common-a1-nouns}` + `time-numbers/time-words-ext` — commit `0fee06d` trên be → dev `da7216c` → fe `16d8c8b`. Gates green. Live seed: **1 collection / 11 topics / 67 lessons / 1340 cards**. **P6 A1 fillers đóng đủ 15 lessons / 300 cards.**
- [ ] **P7-P12**: A2 expansion, B1, B2, phrasal & compound, final fill — `docs/CONTENT_PLAN_FULL.md`.
- [ ] **CHỜ USER**: review `docs/CONTENT_REPORT.md`, quyết định pick IPA style (giữ Oxford hay theo dictionaryapi)
- [-] CRUD collections/topics/lessons (admin UI) — skip, content gen offline đủ MVP
- [ ] Card detail modal (FE work) — hiện đang collapsible inline trong CardPreview, modal có thể làm sau nếu cần

---

## Tuần 3 — SRS Core

- [x] **BE foundation done** (2026-05-12, commit `87da8ef` trên be → merge `ae89cb2` lên dev):
  - `features/srs/fsrs.ts`: ts-fsrs wrapper — state mapping DB↔enum, `rate()` trả về DB-shape + structured log
  - `features/srs/queue.ts`: `getReviewQueue(userId, now)` — due reviews + new cards limit theo `profiles.daily_new_cards`, trừ cards learned today (timezone-aware)
  - `features/srs/queue-utils.ts`: pure helpers `computeNewRemaining` + `dayStartUtc` (tách để test không khởi tạo DB)
  - `features/srs/actions.ts`: `submitReview` server action — idempotent `(user_id, client_review_id)`, transaction update `user_cards` + insert `review_logs` jsonb audit
- [x] Vitest setup + tests (17/17 pass):
  - `vitest.config.ts` + scripts `test/test:watch/test:ui`
  - `fsrs.test.ts` (9): state mapping roundtrip, initial state, rate transitions (new→learning/review, review→relearning với lapse++)
  - `queue.test.ts` (8): `computeNewRemaining` math, `dayStartUtc` cho Asia/Ho_Chi_Minh + UTC + boundary cases
- [x] **Chunk 2 /review FE shell done** (2026-05-12, commit `3206996` trên fe → merge `311feb3` lên dev):
  - `/review` RSC: `getReviewQueue(userId)` → meta header (due/new/dailyLimit) + `<ReviewSession>` hoặc empty state
  - `/review/loading.tsx` + `/review/summary` page (client, rating distribution stats + snapshot pattern)
  - `<FlashcardFlip>`: Framer Motion 3D rotate, word + IPA + POS front / definitions + first example + mnemonic back
  - `<ReviewSession>`: Zustand-driven, keyboard handler (Space lật, 1-4 chấm), optimistic advance + Sonner toast error
  - Zustand `src/stores/review-session.ts`: queue/currentIndex/flipped, `rate()` generates `crypto.randomUUID()` clientReviewId + calls submitReview, results array tracks per-rating status
- [x] **Terminal-style Inline Cloze** done (2026-05-12, commit `8fa69ef` trên fe → merge `a57327f` trên dev → sync `2c7d234` xuống be):
  - Locked state: 1 câu ví dụ với từ đục lỗ trong khung mono `[ f _ _ _ _ y ]` + VN dịch `backdrop-blur` toggle hover
  - Typing: doc-level keydown handler, auto-fill non-letter chars (apostrophe/hyphen), wrong-char shake (Framer Motion x-axis 0.3s) + counter mistakes, Backspace xóa, `Eraser` button bonus
  - Unlocked: glassmorphism panel (`bg-white/70 backdrop-blur ring-sky-100` + neon glow `0 0 24px sky-400/18`), reveal word + IPA + POS + CEFR + definitions + examples[1..3] + collocations + mnemonic, Web Speech API `speechSynthesis` (en-US, rate 0.9) phát auto + nút Volume2 replay
  - Difficulty mask theo CEFR: `getClozeMask` — A1 first+last, A2 first+vowels, B1+/null full hidden
  - Hint key `?` → auto-fill next letter + `hintsUsed++`; Esc → instant give-up + Again
  - Grade derive (pure `gradeFromCloze`): gaveUp || mistakes≥3 || hints≥2 → Again; 1 hint || 1-2 mistakes → Hard; 0/0/<5s → Easy; else Good
  - Auto-submit 2s countdown (Framer Motion width animate) + override `1-4` hoặc Enter/Space; rating buttons row với derived highlighted
  - Multi-word fallback: `card.word.includes(' ')` → `<FlashcardFlip>` + Space/1-4 keyboard (P0 chưa có nhưng defensive)
  - `submitReview` payload `reviewType: 'typing'` (đổi từ `'flashcard'`)
- [x] Tests: 15 cloze-utils tests pass (mask scheme + edge cases + 7 grade derivation) → tổng 32/32 với BE foundation
- [x] Flashcard flip (chunk 2 — sẽ chuyển thành fallback khi Cloze chunk 3 land)
- [x] Rating buttons (Again/Hard/Good/Easy với color tone + kbd hint 1-4)
- [x] Keyboard shortcuts toàn cục — Space lật, 1-4 chấm rating
- [x] Server action `submitReview` (done trong BE foundation — `features/srs/actions.ts`)
- [x] Idempotency (`clientReviewId`) — unique index `(user_id, client_review_id)` đã có trong schema, action check existing log trước khi apply rating
- [x] Daily new cards limit — `getReviewQueue` enforce qua `computeNewRemaining(dailyNewLimit, learnedToday)`
- [x] Optimistic update FE — `rate()` advance currentIndex ngay, submit chạy background, status tracked trong results array
- [x] Page `/review/summary` — counts per rating, accuracy %, total duration, error count với idempotency note
- [x] Edge case: empty queue (RSC empty state với link `/decks`)
- [x] **Chunk 4 persist done** (2026-05-12, commit `f13577d` trên fe → merge `de97b64` trên dev → sync `8d7c212` xuống be):
  - `useReviewSession` wrap với `zustand/middleware` `persist` + `createJSONStorage(() => localStorage)`
  - `partialize: (state) => ({ results: state.results })` — chỉ persist `results` để `/review/summary` survive F5
  - `queue/currentIndex/cardStartedAt` KHÔNG persist (avoid stale queue + Date serialization issues) — `init()` reset trên mỗi `/review` mount đảm bảo fresh start
  - Storage name `'review-session-results'` — clear khi `reset()` hoặc `init()` called
  - Build: `/review` 172 kB (+1 kB), `/review/summary` 122 kB (+1 kB)

---

## Tuần 4 — Dashboard & Stats

- [x] **BE foundation done** (2026-05-12, commit `139afed` trên be → merge `3443d13` lên dev → sync `1e3201a` xuống fe):
  - `features/stats/dates.ts` (pure): `dayKey(date, tz)` qua `date-fns-tz.formatInTimeZone`, `shiftDay(key, delta)` UTC noon shift, `computeStreaks(daysAsc, today)` — longest = max consecutive run, current = run ending today (strict today policy)
  - `features/stats/streak.ts`: `getStreak(userId, now)` đọc `profiles.timezone` + distinct days từ `review_logs.reviewedAt` → `{ current, longest, daysActive, timezone, lastActiveDate }`
  - `features/stats/heatmap.ts`: `getHeatmap(userId, days=84)` buckets reviewedAt theo user tz, fill empty cells, return `{ cells[], total, max, start, end }`
  - `features/stats/maturity.ts`: `getMaturityCounts(userId)` single SELECT + JS aggregate, mature = `state='review' AND stability >= 21d` (Anki convention)
  - `commitlint.config.cjs`: add 'stats' scope
- [x] Vitest: 17 mới (dates.test.ts) — tz boundary, day shift month/year wrap, streak edge cases (empty, today only, yesterday only, 3 consec, ends yesterday, longest > current, gaps). Tổng 49/49 pass.
- [x] **Chunk 2 /dashboard FE done** (2026-05-13, commit `e229e1f` trên fe → merge `dad126c` lên dev → sync `048d99a` xuống be):
  - `features/vocab/queries.ts`: thêm `getEnrolledLessonsWithProgress(userId)` — join user_lessons + lessons + topics + collections, 2nd query group user_cards by lesson + state, return `{ lessonId, lessonSlug, lessonName, cardCount, topic/col slug+name, learned, total }` order startedAt DESC
  - `components/dashboard/heatmap.tsx`: SVG 12-week grid với Sunday-aligned padding (firstCell.date getUTCDay), 5-level sky intensity (zinc-100 / sky-200 / sky-300 / sky-500 / sky-600), VN month labels (Th 1..Th 12), accessible `<title>` per cell, role=img + aria-label
  - `app/(app)/dashboard/page.tsx`: RSC `Promise.all([getStreak, getHeatmap, getMaturityCounts, getReviewQueue, getEnrolledLessonsWithProgress])`, 3 StatCard (streak/due/mature) với tone rings amber/sky/emerald, CTA "Bắt đầu ôn tập (N)" → /review (disable nếu queue rỗng → "Thêm bài học mới" → /decks), enrolled list top 5 với progress bar emerald, heatmap section, brand-new-user empty state Sparkles CTA
  - `app/(app)/dashboard/loading.tsx`: skeleton match layout (header + 3 cards + CTA + list + heatmap block)
  - Build: `/dashboard` 181 B / **109 kB** First Load (RSC only, không client JS, không charting lib)
- [x] Charting lib decision: **raw SVG cho mọi chart** (zero dep, consistency với heatmap). Defer recharts hoàn toàn — bundle giữ siêu nhẹ
- [x] **Chunk 3 /stats page done** (2026-05-13, commit `4aee6b3` trên fe → merge `42387aa` lên dev → sync `27e676d` xuống be):
  - `features/stats/retention.ts`: `getRetention(userId, weeks=12)` bucket `review_logs.state_after.stability` theo day trong user tz, return rolling daily avg + sampleSize, fill zero-sample days
  - `features/stats/activity.ts`: `getActivity(userId, days=30)` daily rating breakdown `{ again, hard, good, easy, total }` + `totalByRating` aggregate
  - `components/stats/retention-line.tsx` (~125 line): SVG area + polyline với grid + Y/X tick labels, skip zero-sample days từ line (giữ x-position)
  - `components/stats/activity-bar.tsx` (~150 line): SVG stacked vertical bar 4 segments per day (red/amber/emerald/sky) với title tooltips + legend swatches, static class strings để Tailwind JIT pick up
  - `components/stats/maturity-pie.tsx` (~140 line): SVG donut chart 4 segments + center "{total} tổng thẻ" label + sidebar list với % per segment + mature row highlight (≥21d stability)
  - `app/(app)/stats/page.tsx`: RSC `Promise.all([getRetention, getActivity, getMaturityCounts, getStreak])`, 4 MetricCard (total reviews / accuracy % / days active / mature) + 3 chart sections với VN copy + retention interpretation note "đường ổn định = thẻ học ngày càng đậm"
  - `app/(app)/stats/loading.tsx`: skeleton match layout
  - Build: `/stats` 184 B / **109 kB** First Load — RSC pure SVG, zero charting dep
- [x] **Chunk 4 /settings page done** (2026-05-13, commit `a640f02` trên fe → merge `0096632` lên dev → sync `eb6ec8f` xuống be):
  - `features/auth/profile.ts`: thêm `'use server'` directive + `updateProfile(input)` action với Zod schema (`displayName` trim+max 100, `timezone` string, `dailyNewCards` 1-50, `dailyReviewMax` 50-500), revalidate `/settings + /dashboard + /stats + /review` để stats queries pick up new tz/limits ngay
  - `components/settings/settings-form.tsx` (~225 line): 3 SettingsSection client components:
    - **Tài khoản**: email readonly mono + displayName input + timezone `<select>` 11 IANA TZ (VN diaspora-weighted: Asia/HCM/Bangkok/Singapore/Tokyo/Seoul/UTC/London/Paris/LA/NY/Sydney)
    - **Giới hạn**: dailyNewCards number (1-50 step 1) + dailyReviewMax number (50-500 step 10)
    - **Giao diện**: 3 button radio (Sun/Moon/Monitor) wired qua `useTheme()` next-themes, mounted gate cho hydration mismatch
  - Form submit qua `useTransition` + sonner toast; theme change immediate (client-only, không qua server action)
  - `app/(app)/settings/page.tsx`: RSC `ensureProfile(userId)` + `Promise.all([db.profile.findFirst, supabase.auth.getUser])`, fallback defaults nếu profile row chưa có
  - `app/(app)/settings/loading.tsx`: skeleton match 3 sections + submit button
  - Build: `/settings` 5.24 kB / **123 kB** First Load (client form + sonner + next-themes weight, tương đương `/login`)
- [x] **Auth perf hotfix** (2026-05-13): middleware `getUser()` → `getSession()` cắt network roundtrip ~200ms/click; `getCurrentUserId/requireUserId` wrap với `React.cache()` để dedupe per-request
- [x] **Tuần 4 chunk 4 done — sẵn ship dev → main `v0.2.0`**

---

## Tuần 5 — Minigames + Polish

- [x] **Chunk 1 mode picker + MCQ done** (2026-05-13, commit `2f6186e` trên fe → merge `dc7016a` lên dev):
  - `features/srs/queue.ts`: thêm `distractorPool: string[]` mỗi `ReviewQueueItem` — 1 SELECT bulk `cards WHERE lessonId IN (...)`, group by lesson, exclude self + dedupe, top-up từ global pool nếu lesson <4 cards, cap 8 entries
  - `features/srs/queue-utils.ts`: pure helpers `extractMeaningVi(defs)` + `buildDistractorPool(siblings, selfId, selfMeaning, globalPool)` — tách để unit test không khởi tạo DB
  - `components/review/mcq-utils.ts`: pure `shuffle<T>` (Fisher-Yates), `pickDistractors(correct, pool, n, rng?)` (case-insensitive dedupe, exclude correct), `assembleMcqChoices(correct, pool, rng?)` (4 choices shuffled + correctIndex), `createSeededRng(seed)` (Mulberry32) cho test deterministic
  - `components/review/mcq-card.tsx` (~180 line): word + IPA + POS + Volume2 phát âm + 4 choices grid (1-col mobile / 2-col sm:), keyboard 1-4, click → 900ms reveal (green=correct, red=wrong, dim others) → `onGrade(Good)` đúng / `onGrade(Again)` sai, `submittedRef` chống double-fire
  - `components/review/mode-picker.tsx`: radiogroup 4 buttons (Cloze/MCQ active, Typing/Listening disabled với "Sắp có" hint), pill style với `aria-checked`
  - `stores/review-session.ts`: thêm `mode: ReviewMode` + `setMode(mode)`, persist `mode` cùng `results` (F5 giữ pick), `rate()` truyền `reviewType: modeToReviewType(mode)` (cloze/typing → 'typing', mcq → 'mcq', listening → 'listening'), `ReviewResult.mode` optional cho backward compat hydration
  - `components/review/review-session.tsx`: render `<ModePicker>` trên cùng, branch theo `effectiveMode` (`cloze` + multi-word → fallback flashcard flip; `mcq` → `<MCQCard>`; còn lại → `<ClozeCard>`)
- [x] Tests: 49 → 72 — `queue.test.ts` thêm 11 (extractMeaningVi 4 + buildDistractorPool 6 + dedupe edge); `mcq-utils.test.ts` 12 (shuffle deterministic + immutable, pickDistractors dedupe/exclude/cap, assembleMcqChoices position shuffle/correct-once)
- [x] **Chunk 2 typing-from-definition done** (2026-05-13, commit `fe1861a` trên fe → merge `b4e062d` lên dev):
  - `components/review/typing-card.tsx` (~485 line, client): show `meaning_vi` 2xl center + `meaning_en` italic hint + pos/cefr badges → full-hidden input slots (`[_ _ _ _ _]` mono ring), letter-by-letter doc-level keydown, `?` reveal next letter, Esc give-up, Backspace xóa, Eraser button, wrong char shake (Framer Motion x 0.3s) + mistake counter
  - Unlock state: glassmorphism reveal panel (re-use cloze style — word + IPA + Volume2 phát âm + 2 examples + mnemonic + 2s countdown bar + 1-4 rating override)
  - Reuse `gradeFromCloze` + `speakWord` + `MaskSlot` type từ `cloze-utils.ts` (không trùng lặp grade heuristic). Mask helper `fullHiddenMask(word)` local — ép hidden TẤT CẢ letters (typing không có sentence context để cho A1/A2 hint như Cloze)
  - `mode-picker.tsx`: nút "Gõ nghĩa" enable (drop "Sắp có" badge)
  - `review-session.tsx`: branch `mode === 'typing'` → `<TypingCard>`, multi-word fallback rule mở rộng `cloze OR typing + multi-word → MultiWordFallback`, hint text "gõ từ từ nghĩa" cho typing
  - `commitlint.config.cjs`: add scope `'review'` (Tuần 5 chunks dùng nhiều, trước đây cảnh báo)
  - Cả Cloze và Typing share `reviewType='typing'` trong DB (cùng là typing-the-word minigames, khác cue). Split sau nếu retention analytics cần
- [x] **Chunk 3 Listening mode done** (2026-05-13, commit `063abca` trên fe → merge `68bec35` lên dev):
  - `components/review/listening-card.tsx` (~570 line, client): auto-play `speakWord()` on mount, Space replay, large circular speaker button với pulse animation khi "đang phát" (heuristic timer ~250ms/letter capped 2.2s vì Web Speech `end` event không reliable cross-browser)
  - Hide hoàn toàn definitions/translation trong cue phase (chỉ pos/cefr badge). Unlock reveal panel có full word + IPA + meaning_en + meaning_vi + 2 examples + mnemonic
  - Slots full-hidden như TypingCard. Reuse `gradeFromCloze` + `speakWord` + `MaskSlot` từ `cloze-utils.ts`
  - **No-speech fallback**: nếu `'speechSynthesis' in window === false` → toast warning + show word trong mono badge (degraded UX nhưng không dead-end). VolumeX icon thay Volume2
  - `mode-picker.tsx`: drop disabled flag — tất cả 4 mode giờ live
  - `review-session.tsx`: branch `mode === 'listening' → <ListeningCard>`, multi-word fallback rule mở rộng `(cloze OR typing OR listening) + multi-word → MultiWordFallback`, hint text "Space phát lại · gõ từ · ? hint"
  - `reviewType='listening'` ghi xuống `review_logs` cho FSRS retention analytics sau (split per mode nếu cần)
- [x] **Chunk 4 polish done** (2026-05-13, commit `e794630` trên fe → merge `73f6b56` lên dev):
  - `/review/page.tsx`: `Promise.all([getReviewQueue, getStreak])`, derive `isFirstReviewToday = streak.lastActiveDate === null || streak.lastActiveDate < todayKey(now, tz)`, pass meta (newLearnedToday/dailyNewLimit) + isFirstReviewToday + currentStreak qua props xuống `<ReviewSession>`
  - `<ReviewSession>` (props mới): `streakToastedRef`, `limitToastedRef`, `newCardsThisSessionRef` — refs dedupe, không re-render
  - Toast 1 — **Streak start of day**: fires once trên rate success đầu tiên nếu `isFirstReviewToday` true. Hiện `🔥 Streak ${currentStreak+1} ngày! Bắt đầu ngày học mới.` (sonner success, 4s)
  - Toast 2 — **Daily new-limit reached**: tracks new cards FE-side (state==='new' on capture before store advances), fires once khi `newLearnedToday + newCardsThisSession >= dailyNewLimit`. Hiện `🎯 Đã đạt mục tiêu N thẻ mới hôm nay` + description "thẻ mới sẽ mở lại ngày mai" (sonner info, 5s)
  - Toast lesson-complete: defer Tuần 6 (cần lesson-level mature query)
  - `/review/loading.tsx`: skeleton update — mode picker pill row (4 button placeholders) + counter row + card area (drop rating row vì các mode mới auto-grade, không có rating buttons hiển thị mặc định)
  - `/review` empty state: 2 CTA (BookOpen → /decks, link → /dashboard) thay inline link đơn lẻ — visual hierarchy tốt hơn cho user mới
- [x] **Tuần 5 ĐÓNG** — 4 minigame modes (Cloze/MCQ/Typing/Listening) + Mode Picker + Toast milestones + Skeleton polish.
- [x] **Đã ship `v0.2.0`** (2026-05-13, `main` SHA `eb18493`, tag `v0.2.0`) — "Dashboard + Stats + Settings + Minigames"

---

## Tuần 6 — Scale content + Ship

- [x] **Chunk 17 first-login onboarding tour done** (2026-05-17, BE commit `ddd55bf` trên be + FE commit `4e693d8` trên fe → merge `b18ecdc` lên dev → sync `081700a` xuống be):
  - **BE**: `src/lib/db/schema.ts` thêm `onboardedAt: timestamp('onboarded_at', { withTimezone: true })` (nullable, không default) vào `profiles` table. `pnpm db:gen` sinh `0001_magenta_umar.sql` với 1 dòng `ALTER TABLE profiles ADD COLUMN onboarded_at timestamptz`. RLS policy không cần update — `profiles` đã owner-scoped `auth.uid() = id`
  - **FE action** `src/features/onboarding/actions.ts`: `completeOnboardingTour()` server action — `requireUserId` → `ensureProfile` → `db.update(profiles).set({ onboardedAt: new Date() })` → `revalidatePath('/dashboard')`. Pattern mirror `updateProfile`
  - **FE modal** `src/features/onboarding/tour-modal.tsx` (~180 LOC client): 4-step native `<dialog>` reuse pattern `shortcuts-modal.tsx` (zero Radix dep). Steps Decks/Review/Stats/Settings với icon + body + hint. Progress dots 4 dot. Footer Trước/Tiếp/Bắt đầu học + Bỏ qua. Mọi dismiss path (button click / Esc / backdrop / onClose) → call action 1 lần qua `dismissedRef` guard
  - **Layout** `src/app/(app)/layout.tsx`: thêm `db.query.profiles.findFirst` đọc `onboardedAt`, conditional `{shouldShowTour && <TourModal />}` render khi `onboarded_at IS NULL`. Chỉ run khi `session?.user.id` tồn tại (middleware đã auth)
  - **Why null check vs date math**: single column boolean, queryable, không phải parse createdAt + window. Cost: existing dev/test users xem tour 1 lần
  - **Why dismiss on Esc/backdrop**: thấy = đã onboarded. Tránh annoying re-trigger. User có thể edit `profiles.onboarded_at = NULL` SQL nếu muốn xem lại
  - **Migration**: cần `pnpm db:push` trên DB live (user TODO mới) trước khi feature work
  - Tests: 179/179 unchanged (UI integration only, pattern shortcuts-modal ch14 + topbar ch15 cũng skip tests)
  - Build: tất cả route bundle unchanged (`/dashboard /decks /stats` 184 B / 109 kB, `/review` 5.01 kB / 126 kB, `/settings` 6.69 kB / 124 kB) — TourModal trong shared chunk
- [x] **Chunk 1 mobile responsive QA done** (2026-05-13, commit `22c79d7` trên fe → merge `c932e9b` lên dev → sync `691bab1` xuống be):
  - `components/layout/nav-items.ts` (new): extract `NAV_ITEMS` array dùng chung sidebar + mobile-nav
  - `components/layout/mobile-nav.tsx` (new, ~100 line, client): hamburger button `md:hidden` trong topbar → mở dialog overlay backdrop-blur + slide-in panel với 5 nav links + close button (X). Esc đóng. `document.body.style.overflow = 'hidden'` lock scroll khi open. Auto-close khi pathname đổi.
  - `components/layout/topbar.tsx`: prepend `<MobileNav />`, header gap `gap-3 px-4` → `gap-2 px-3 sm:gap-3 sm:px-4` (giảm padding mobile cho hamburger button)
  - `components/layout/sidebar.tsx`: refactor import NAV từ shared file, drop duplication
  - `app/(app)/layout.tsx`: main padding `px-6 py-6` → `px-4 py-5 sm:px-6 sm:py-6`
  - 4 minigame cards (Cloze/MCQ/Typing/Listening) + reveal panels: card outer `p-6` → `p-4 sm:p-6`, reveal panel `p-5` → `p-4 sm:p-5`. Khoảng thở thêm trên 375px
  - `app/(app)/stats/page.tsx`: MetricCard grid `sm:grid-cols-4` → `grid-cols-2 sm:grid-cols-4` — mobile 2 cột thay 4 hàng dọc tốn scroll
  - `components/settings/settings-form.tsx`: submit row `flex items-center` → `flex flex-col items-start sm:flex-row sm:items-center` — helper text stack dưới button trên mobile
  - Build: bundle unchanged (`/review` 176 kB, `/settings` 123 kB, `/stats` 109 kB) — MobileNav tham gia shared chunk topbar
- [x] **Chunk 2 Lighthouse audit fixes done** (2026-05-14, commit `1aec7ab` trên fe → merge `da3a05b` lên dev → sync `b50fc5d` xuống be):
  - **Perf**: code split 4 minigame cards + flashcard-flip qua `next/dynamic`. Mỗi card lazy load with `<div h-[320px] animate-pulse>` fallback. Mode picker + orchestrator vẫn eager
    - `/review` First Load JS **176 kB → 126 kB (−50 kB / −28%)** — biggest perf win
    - `/login` 130 kB (+1 kB do metadata import), khác routes không đổi
  - **A11y**:
    - Skip-to-content link `<a href="#main-content" className="sr-only focus:not-sr-only ...">` trong `(app)/layout.tsx`. Tab key reveal link → Enter skip qua sidebar/topbar straight to `<main id="main-content">`. Cần cho keyboard + screen reader users
    - Text contrast: 6 chỗ `text-xs text-zinc-400` → `text-zinc-500` trong cloze/typing/listening counter (`{input.length}/{word.length}`), flashcard-flip hint, review empty state line. Tailwind `zinc-400` (#a1a1aa) fail WCAG AA Normal (3.66:1 < 4.5); `zinc-500` (#71717a) pass (5.42:1)
  - **SEO**: per-page metadata title cho 6 pages — dashboard/review/decks/stats/settings/login. Root layout title template `'%s · EnStudy Hub'` auto-fills tab title. `/review/summary` skip vì client component, defer
  - Build: typecheck OK, lint OK, tests 72/72, build OK
- [ ] Gen thêm 500-1000 từ
- [x] **Chunk 3 CSV import UI done** (2026-05-14, commit `8aeb0e4` trên fe → merge `14ac3d4` lên dev → sync `0d22bb4` xuống be):
  - `/decks/import` page (RSC + client form) — upload file `.csv` hoặc paste text → debounced preview qua `previewCsv()` server action → submit qua `importCsvAsLesson()` → redirect tới lesson detail
  - Per-user collection pattern: tạo `personal-{userId.slice(0,8)}` với `isOfficial=false, ownerId=userId`, topic `imported`. Multi-tenant ready không cần migration (xem ADR-008)
  - CSV format 9 cột (`word,ipa,pos,cefr,meaning_vi,meaning_en,example_en,example_vi,mnemonic_vi`), max 200 thẻ × 256 KB. POS short aliases (`adj/adv/prep/...`) map sang full forms khớp `posSchema`. UTF-8 BOM tolerant. Dedup-in-file
  - Server-side parse với `papaparse@5.4.1` (pin exact) — không ship vào client bundle. `previewCsv()` no-DB validate, `importCsvAsLesson()` Drizzle transaction: upsert collection + topic, insert lesson (reject `SLUG_TAKEN`), bulk insert cards với `source:'csv-import'`, auto-enroll user_lessons + user_cards FSRS defaults
  - Ownership filter trong `getCollectionBySlug + getLessonByPath` (extra `userId` param) — Drizzle bypass RLS, app enforce trong code. `listUserOwnedCollections(userId)` mới song song `listOfficialCollections()`
  - `/decks` page: thêm CTA "Nhập CSV" + section "Bộ của bạn" nếu user có collection riêng
  - UI primitive mới: `<Textarea>` shadcn-style cho dán CSV
  - Tests: 19 mới (`csv-parse.test.ts`) — parse happy path, BOM, quoted comma, missing header, dedup, oversize, per-row errors, slug + schema validation. Tổng 72 → 91/91 pass
  - Build: `/decks/import` **25.5 kB / 152 kB** First Load (form + preview table + sonner). Khác routes không đổi
- [x] **Chunk 16 dashboard week summary card done** (2026-05-16, commit `ae64d37` trên fe → merge `b1154fb` lên dev → sync `413664b` xuống be):
  - "Tuần này" card trên `/dashboard` — 3 metric: reviews count, accuracy %, days-active /7. ISO 8601 week (Mon-Sun)
  - `features/stats/week-summary-utils.ts`: pure `summarizeWeek(activity, now, tz)` + `mondayOfWeek(todayKey)`. Filter cells qua dayKey string compare (safe vì YYYY-MM-DD lex === chrono). Accuracy = (good+easy)/total rounded; Hard counts as incorrect
  - `components/dashboard/week-summary-card.tsx`: 3-column metric với VN short weekday caption ("T2 ... → T7 ..."). Empty state nudge `/review`. Accuracy muted khi reviews=0
  - `/dashboard` page: thêm `getActivity(userId, 14, now)` vào Promise.all (14-day window cover worst-case Sunday-today + tz/DST buffer). Pin `now` const cho consistency across queries. Card render giữa StatCard row + enrolled list
  - Tests: 15 mới — mondayOfWeek (Mon thru Sun + month boundary), summarizeWeek (empty, slice, accuracy rounding, Hard incorrect, daysActive count, Sunday edge). Tổng 164 → 179/179 pass
  - Build: `/dashboard` **184 B / 109 kB unchanged** (RSC + raw HTML, zero client JS)
- [x] **Chunk 15 topbar polish + sign-out wire-up done** (2026-05-16, commit `148fbee` trên fe → merge `3992249` lên dev → sync `0ae3017` xuống be):
  - **P0 v1.0.0 blocker fix**: topbar dropdown trước đây ship 2 TODO hardcoded ("TODO: hiển thị email" + "Đăng xuất (TODO)"). signOut server action có sẵn từ Tuần 1, chỉ chưa wire UI
  - `app/(app)/layout.tsx`: convert async, đọc session qua `getSession()` (fast — no network, decode cookie locally; middleware đã verify auth upstream). Pass `userEmail` xuống Topbar
  - `components/layout/topbar.tsx`: accept `userEmail` prop. Dropdown content rewrite:
    1. Account header label (giữ nguyên)
    2. Sub-header "Đăng nhập với" + mono email (truncate)
    3. "Cài đặt" link tới `/settings` qua `DropdownMenuItem asChild + Link`
    4. "Đăng xuất" wire `signOut()` qua `useTransition`. Catch `NEXT_REDIRECT` throw (expected từ `redirect('/login')`), toast nếu fail thật. Spinner + "Đang đăng xuất…" pending. Red tone (text-red-600 + focus-bg-red-50) signal destructive intent
  - Tests: không (UI integration only). signOut() tested manual từ Tuần 1. 164/164 unchanged
  - Build: routes essentially unchanged. Side effect: `/review/summary` `○→ƒ` (dynamic) vì parent layout giờ async — auth routes vốn dynamic via middleware, build report chỉ thành explicit
- [x] **Chunk 14 keyboard shortcuts modal done** (2026-05-16, commit `b88f7ed` trên fe → merge `7d5ea62` lên dev → sync `71e1fca` xuống be):
  - Surface all app shortcuts vào 1 chỗ learnable — trước đây user phải discover piecemeal (Space cloze flip, 1-4 rating, ? hint, ⌘K palette, Esc cancel)
  - `components/layout/shortcuts-modal.tsx`: `<ShortcutsTrigger>` client với Keyboard icon button trong topbar + globally-bound `?` keydown listener. Toggle native `<dialog>` qua `showModal()` — free focus trap + backdrop + Esc-to-close, không cần Radix Dialog primitive
  - `?` listener skip nếu active element là `INPUT/TEXTAREA/contenteditable` — user vẫn gõ "?" trong form được
  - Backdrop click qua `target === currentTarget` check, inner panel `stopPropagation`
  - 3 sections grouped: **Toàn cục** (⌘K/?/Tab/Shift+Tab/Esc), **Ôn tập** (Space/1-4/?/Backspace/Enter), **Listening mode** (Space replay)
  - Wire vào topbar giữa search palette button + theme toggle — discoverable cạnh sibling chrome
  - Tests: không (UI integration only, native `<dialog>` browser-tested). 164/164 unchanged
  - Build: routes essentially unchanged (trigger trong shared topbar chunk) — `/dashboard /decks /stats` 184 B / 109 kB, `/review` 5.01 kB / 126 kB
- [x] **Chunk 13 forecast due 7 days done** (2026-05-16, commit `3b01347` trên fe → merge `3976889` lên dev → sync `08d7454` xuống be):
  - Section mới "Lịch ôn 7 ngày tới" trên `/stats`. Helps user plan ahead — FSRS-grounded forecast theo timezone user
  - `features/stats/forecast-utils.ts`: pure `bucketizeDueByDay(dueDates, now, tz, days)` — seed N empty buckets, scan due list, overdue → today bucket (with separate `overdue` count), future-beyond-window dropped. `labelForDay()` "Hôm nay" hoặc VN weekday short codes (CN/T2..T7)
  - `features/stats/forecast.ts`: `getDueForecast(userId, days=7, now)` — read profile.timezone, query user_cards with `state != 'new' + suspended = false + due ≤ windowEnd`. Same filter như `getReviewQueue` → forecast match queue actual
  - `components/stats/due-forecast-bar.tsx`: raw SVG 7-bar chart match activity-bar style. Amber bar today (overdue collapsed in), sky future. Y axis 0/mid/max. Count labels above bars. `<title>` tooltips include overdue count
  - `/stats/page.tsx`: section sau maturity donut với caveat copy về overdue collapse + suspended exclusion. Promise.all pickup query mới
  - Tests: 14 mới — empty seeds, days clamp, tz bucketing, overdue/today/future mix, UTC users, chronological order, isToday flag, weekday labels. Tổng 150 → 164/164 pass
  - Build: `/stats` **184 B / 109 kB** unchanged (RSC + raw SVG, zero client JS)
- [x] **Chunk 12 CSV re-upload overwrite done** (2026-05-16, commit `900737f` trên fe → merge `4eab9a7` lên dev → sync `4ca4225` xuống be):
  - Đóng biggest gap từ chunk 3 — re-upload cùng slug trước đây hard reject `SLUG_TAKEN`. Giờ opt-in checkbox "Ghi đè bài học cũ nếu trùng slug" cho user accept FSRS state loss
  - `csv-schema.ts`: `csvImportInputSchema` thêm field `overwrite: z.boolean().default(false)` với Zod preprocess coerce FormData string `'true'/'false'` → boolean (cho cả direct API call lẫn form)
  - `csv-import.ts`: `importCsvAsLesson` branch:
    - `overwrite=true` → `onConflictDoUpdate` lesson (refresh name + cardCount) + `db.delete(cards).where(lessonId)` trước bulk insert. Cascade wipes user_cards → auto-enroll re-creates với FSRS defaults
    - `overwrite=false` (default) → giữ original `onConflictDoNothing` + `SLUG_TAKEN` throw
  - `csv-import-form.tsx`: amber callout với checkbox + 2-line copy về FSRS-reset trade-off. State pass qua FormData. Toast variant "Đã ghi đè X thẻ" vs "Đã nhập X thẻ"
  - Tests: 4 mới — overwrite default false khi omitted, accept boolean true, coerce `'true'/'false'` string → boolean. Tổng 146 → 150/150 pass
  - Build: `/decks/import` **13.6 kB / 153 kB** (+0.3 kB checkbox markup). Khác routes không đổi
- [x] **Chunk 11 user data import done** (2026-05-16, commit `8f7dd8d` trên fe → merge `688b751` lên dev → sync `b0846ea` xuống be):
  - **Reverse của chunk 10** — restore JSON dump v1 ngược về account
  - `features/auth/import-schema.ts`: Zod runtime validation mirror types từ export-schema. `normalizeImportedCard()` re-validate qua `cardContentSchema` (skip malformed thay vì abort). `extractUserShortIdFromSlug()` parse 8-char hex prefix từ `personal-{hex8}` slug cho cross-user safety check
  - `features/auth/import.ts`: `importUserData(jsonText)` server action — 5 bước (JSON.parse + Zod validate → cross-user reject → main txn upsert collection/topic/lessons/cards + auto-enroll → outside txn apply notes → outside txn apply suspended). Flatten model: tất cả imported lessons → user's `personal-{id}/imported` (mất collection/topic hierarchy gốc, acceptable)
  - `components/settings/import-button.tsx`: file input `.json` + `window.confirm` warn về overwrite semantics, FileReader, useTransition, toast summary row counts (restored vs skipped)
  - `/settings` page: Import button cạnh Export, caption mới warn same-account-only + overwrite
  - **Same-user only**: nếu slug prefix không match current userId → reject "JSON từ tài khoản khác". Cross-user import defer (slug rewriting + many edge cases)
  - **Profile + stats NOT restored**: tránh clobber current settings + corrupt streak history. DB-level full restore qua GitHub Actions backup
  - Tests: 14 mới — importDataSchema accept v1/reject v2/exportedAt malformed/empty arrays/empty required, normalizeImportedCard valid/POS-alias-reject/missing-definitions-null, extractUserShortIdFromSlug 4 cases. Tổng 132 → 146/146 pass
  - Build: `/settings` **6.69 kB / 124 kB** (+0.8 kB Upload icon + ImportButton). Khác routes không đổi
- [x] **Chunk 10 user data export done** (2026-05-15, commit `1d3ace6` trên fe → merge `c62f0e3` lên dev → sync `2828d0f` xuống be):
  - **Pre-v1.0.0 data portability** — cho user một-click JSON dump của personal data
  - `features/auth/export-schema.ts`: pure types + `EXPORT_VERSION=1` + `exportFilename(userId, now)` helper. Filename pattern `enstudy-export-{8charPrefix}-{YYYY-MM-DD}.json` (UTC date cho deterministic naming)
  - `features/auth/export.ts`: server action `exportUserData()` — fetch profile + user_stats + notes (filtered isNotNull + ne('')) + suspended cards (=true) + custom collections (ownerId=userId + isOfficial=false) → topics → lessons → cards. Join through để mỗi entry có slug context (lessonSlug, collectionSlug) — self-describing dump không leak UUIDs
  - `components/settings/export-button.tsx`: client button calls server action → JSON.stringify pretty (2-space indent) → Blob + `<a download>` → URL.revokeObjectURL cleanup. Toast summary count notes + collections
  - `/settings` page: section mới "Dữ liệu cá nhân" với description what's included
  - **Excluded intentionally**: review_logs (huge, technical), user_cards FSRS state (không portable), official content (đã có trong seed). DB-level full dump qua GitHub Actions backup
  - Tests: 5 mới — EXPORT_VERSION sanity + exportFilename (UTC date, 8-char id, format pattern). Tổng 127 → 132/132 pass
  - Build: `/settings` **5.87 kB / 123 kB** (+0.6 kB Download icon + button). Khác routes không đổi
- [x] **Chunk 9 UX polish bundle done** (2026-05-15, commit `c575710` trên fe → merge `d12a230` lên dev → sync `469f13a` xuống be):
  - **CSV template download** (defer chunk 3): `csv-import-form.tsx` nút "Tải CSV mẫu" (lucide Download) cạnh "Dùng mẫu thử". Sinh client-side Blob với header + 3 sample rows (breakfast noun A1, happy adjective A2, run verb A1) → trigger download via in-memory `<a href=blob:>` rồi `URL.revokeObjectURL`. Zero server roundtrip. +0.4 kB cho icon
  - **Toast lesson complete** (defer Tuần 5 ch4): `getReviewQueue` extend `meta.lessonNames: Record<lessonId, name>` (1 extra query trên lessonIds đã dedup). Page pipe xuống ReviewSession. Session track `lessonTotalsRef` (count từ initialQueue) + `lessonRatedRef` + `lessonCompleteToastedRef: Set`. On rate success → increment counter cho lessonId của card vừa rate; nếu reach total → `toast.success('🎉 Hoàn thành bài "X"!')` 5s, dedup qua Set. Multiple lessons trong 1 session fire độc lập
  - Tests: 127/127 unchanged (không có pure helper mới — blob = DOM API, toast = side-effect integration)
  - Build: `/review` **5 kB / 126 kB** giữ baseline. `/decks/import` 13.3 kB / 153 kB (+0.4 kB Download icon)
- [x] **Chunk 8 lesson management done** (2026-05-15, commit `ec3faf4` trên fe → merge `e91063f` lên dev → sync `036ddc1` xuống be):
  - `features/vocab/lesson-edit.ts`: 3 server actions —
    - `renameLesson(lessonId, name)`: update `lessons.name`, slug stays unchanged (URL không break). Revalidate collection + lesson + dashboard
    - `deleteLesson(lessonId)`: cascade via FK wipes cards → user_cards → user_lessons. Topic + per-user collection stay (no GC empty collections pre-MVP). Revalidate `/decks layout` + dashboard + review + stats
    - `deleteCard(cardId)`: cascade wipes user_cards. `lesson.cardCount` stale (acceptable — chỉ hiển thị hint trong deck list)
  - Mỗi action: ownership chain check (reject khi `isOfficial=true` OR `ownerId !== userId`), typed Result discriminated union. Helper `getLessonOwnership(lessonId)` / `getCardOwnership(cardId)` 3-join 1-query
  - `lesson-edit-schema.ts`: 3 pure Zod schemas + types + `MAX_LESSON_NAME=80` constant. Test-isolated từ server module (pattern giống card-actions/csv)
  - `components/decks/lesson-actions.tsx` (~130 LOC client): header strip với 2 button — "Đổi tên" (Pencil) toggle inline form (Input + Save/Cancel), "Xoá bài học" (Trash, red border) fires `window.confirm` rồi redirect tới collection. Native confirm OK cho MVP — không cần dialog primitive mới
  - `components/decks/card-edit-form.tsx`: footer refactor `justify-between` — bên trái "Xoá thẻ" (red outline) với `window.confirm`, bên phải Huỷ + Lưu. Split `useTransition` thành `saving + deletingCard` để 2 button spin độc lập
  - `/decks/[col]/[topic]/[lesson]/page.tsx`: render `<LessonActions>` dưới `<EnrollButton>` khi `isEditable=true`. Reuse ownership flag từ chunk 5
  - Tests: 12 mới (`lesson-edit-schema.test.ts`) — rename name validation (3 chars min, 80 max, trim, whitespace-only reject, UUID), delete schemas. Tổng 115 → 127/127 pass
  - Build: `/decks/[col]/[topic]/[lesson]` **5.4 kB / 145 kB** (+1.2 kB / +14 kB cho LessonActions không lazy-load — chấp nhận vì chỉ ảnh hưởng personal collections, không phải critical path)
- [x] **Chunk 7 multi-def card edit done** (2026-05-15, commit `4d037b1` trên fe → merge `1be3ca5` lên dev → sync `47d79ab` xuống be):
  - `features/vocab/card-edit-schema.ts` refactor: `cardEditInputSchema = cardContentSchema.extend({cardId})` thay vì `csvRowSchema.extend(...)`. Multi-def + multi-example. Hằng `MIN/MAX_DEFINITIONS=1/5`, `MIN/MAX_EXAMPLES_PER_DEF=1/5` (mirror Zod constraints trong `definitionSchema`)
  - `cardToFormState` return arrays lồng nhau, seed 1 empty def + 1 empty ex nếu DB rỗng để form không "below min" lúc mount
  - `formStateToInput(form, cardId)`: trim mọi string, drop `mnemonic_vi` nếu rỗng sau trim
  - `features/vocab/card-edit.ts`: bỏ wrap qua `csvRowToCardContent`. Set `content.definitions` jsonb thẳng. Cùng ownership chain + FSRS state preservation
  - `components/decks/card-edit-form.tsx` refactor repeater pattern: `<DefinitionBlock>` per-def với meaning_vi/meaning_en + sub-repeater examples (grid `1fr 1fr auto` cho en/vi/trash). Add/remove buttons enforce bounds (disable add khi max, ẩn trash khi min). Counters `N / MAX`
  - Tests: rewrite `card-edit-schema.test.ts` — 16 cases (5 schema accept/reject, 4 projection, 3 formStateToInput). Cảnh báo: cardEditInputSchema KHÔNG có CSV POS alias mapping (`adj` reject) vì dùng canonical cardContentSchema; UI cung cấp full names. Tổng 108 → 115/115 pass
  - Build: `/decks/[col]/[topic]/[lesson]` **4.18 kB / 131 kB** unchanged (repeater UI swallowed bởi lazy-load chunk)
- [x] **Chunk 6 v1.0.0 prep done** (2026-05-15, commit chuẩn bị trên dev):
  - **README.md** rewrite production-grade — feature matrix (10 áo bao trùm 6 tuần), stack table, quickstart 3 bước (clone/setup/db/dev), architecture tree với key patterns (server-first, schema-impure split, multi-tenant collection ownership, code split), branch model diagram, releases table với planned v1.0.0, full docs index, MIT badge
  - **LICENSE** — MIT, © 2026 LineLuLan. Trước đó README ghi "Private" — release public GitHub repo cần explicit MIT
  - **`.github/workflows/backup.yml`** — daily 02:00 UTC cron (+ workflow_dispatch manual), install `postgresql-client-15`, pg_dump `public` schema → gzip → artifact 14-day retention. Concurrency group `backup-db`. Secret `BACKUP_DATABASE_URL` (direct connection 5432, không pooler 6543)
  - **`docs/ENVIRONMENT.md`** thêm section 7 "Daily DB backup" — setup steps (Supabase Direct URL → GitHub secret), download/restore instructions, lý do dùng Direct + bỏ `auth/storage/realtime`
  - **Defer (user phải làm)**: thêm secret `BACKUP_DATABASE_URL` trên GitHub repo settings → manual run workflow lần đầu verify → live golden path test → tag `v1.0.0`
- [x] **Chunk 5 card editing done** (2026-05-14, commit `2c25386` trên fe → merge `2e292b6` lên dev → sync `e936434` xuống be):
  - `features/vocab/card-edit.ts`: server action `updateCard(input)` — ownership chain walk (card → lesson → topic → collection) trong 1 query. Reject nếu `isOfficial=true` HOẶC `ownerId !== userId`. Patch `cards` row giữ user_cards FSRS state nguyên vẹn
  - `features/vocab/card-edit-schema.ts`: `cardEditInputSchema = csvRowSchema.extend({ cardId: uuid })` — reuse POS alias + CEFR uppercase coercion từ chunk 3. `cardToFormState(card)` projection helper DB → flat form (first def + first example only, multi-def lost on save)
  - `components/decks/card-edit-form.tsx`: inline form 9 fields (word/IPA mono inputs, POS + CEFR native selects, mnemonic textarea), Save/Cancel buttons với `useTransition` + sonner toast
  - `components/decks/card-preview.tsx`: thêm `isEditable` prop. Khi true + expanded → nút "Sửa" (Pencil icon) toggle sang `<CardEditForm>`. Form lazy-load qua `next/dynamic` để giữ deck page nhẹ
  - `/decks/[col]/[topic]/[lesson]/page.tsx`: derive `isEditable = !collection.isOfficial && collection.ownerId === userId` — chỉ user-owned (personal) collections mới edit được. Official content immutable từ FE
  - Tests: 9 mới (`card-edit-schema.test.ts`) — schema accepts/rejects/aliases + cardToFormState projection (full + null defaults + empty examples). Tổng 99 → 108/108 pass
  - Build: `/decks/[col]/[topic]/[lesson]` **3 → 4.19 kB** (+1.2 kB cho lucide Pencil + edit form stub), `/review` không đổi 126 kB
- [x] **Chunk 4 card actions done** (2026-05-14, commit `fb55d2c` trên fe → merge `35e2f60` lên dev → sync `cbd75ba` xuống be):
  - **Personal notes** (`user_cards.notes`, đã có cột từ Phase 0): textarea max 500 ký tự, '' để xoá → null
  - **Suspend/bury** (`user_cards.suspended`): toggle ẩn thẻ khỏi `getReviewQueue` (filter đã có sẵn từ Tuần 3)
  - `features/srs/card-actions.ts`: server action `updateUserCard({ userCardId, notes?, suspended? })`. Refine "phải có ít nhất 1 thay đổi". Ownership filter `(userCardId, userId)`. Revalidate `/review + /dashboard` chỉ khi suspended thay đổi
  - `features/srs/card-actions-schema.ts`: tách Zod schema + constants ra file riêng (pattern giống `csv-schema`/`csv-import`) để test không pull DB client
  - `components/review/card-actions.tsx` (~160 LOC, client): `<details>` collapsible với textarea + Save button + suspend toggle row. Sonner toast. `useEffect` reset state khi đổi card (key cycle)
  - Inject vào `<ReviewSession>` orchestrator dưới active card — work cho cả 4 mode (cloze/typing/listening/mcq) + multiword fallback mà KHÔNG sửa bất kỳ minigame card nào (~570 LOC mỗi card giữ nguyên)
  - **Code split** qua `next/dynamic` → `/review` First Load giữ **126 kB** (không tăng từ chunk 2 baseline)
  - `features/vocab/queries.ts`: thêm `getUserCardMetaByLesson(userId, lessonId)` → `Map<cardId, {hasNote, suspended}>` cho deck preview
  - `components/decks/card-preview.tsx`: chip "Note" (sky) + "Tạm dừng" (amber) inline với word, amber border khi suspended. Optional `userMeta` prop
  - `/decks/[col]/[topic]/[lesson]/page.tsx`: fetch userMetaByCard chỉ khi user enrolled
  - Tests: 8 mới cho `updateUserCardSchema` (notes-only/suspended-only/both/empty patch reject/empty string clears/oversize/UUID/bool). Tổng 91 → 99/99 pass
  - Build: `/review` 4.71 kB / 126 kB (giữ nguyên), `/decks/[col]/[topic]/[lesson]` 3 kB / 130 kB (+0.5 kB cho lucide icons)
- [ ] Lighthouse > 90 — chunk 2 đã làm code-side fixes; thực đo cần dev server + Chrome DevTools (defer chunk sau hoặc khi deploy)
- [x] GitHub Actions cron daily DB backup (chunk 6, 2026-05-15)
- [x] Update `README.md` (chunk 6, 2026-05-15)
- [ ] **CHỜ USER**: add `BACKUP_DATABASE_URL` GitHub secret + manual run backup workflow lần đầu verify
- [ ] **CHỜ USER**: live golden path test (login → import CSV → review → suspend/note/edit → screenshots)
- [ ] **CHỜ USER**: tag `v1.0.0` release — PR `dev → main`, merge, `git tag v1.0.0` + GitHub release với CHANGELOG

---

## Post-MVP UI Revamp (2026-05-16 → 17)

Mục tiêu: nâng cấp UX `/decks` lên production-grade sau khi seed 1340 cards live. 2 sessions:

### Session 2026-05-16 — `/decks` topic grid + topic detail page

- [x] **DB migration applied** — `0001_magenta_umar.sql` (profiles.onboarded_at) lên Supabase live, fix lỗi user gặp khi mở `/decks`
- [x] **`/decks/[col]` redesign** — Topic grid 3×N responsive (1/2/3 cột), icon từ `topic.icon` qua `<TopicIcon>`, lesson count + "Đang học X/Y" badge, priority indicator góc phải, badge ✨ "Khuyến nghị bắt đầu" cho 3 topic đầu
- [x] **New page `/decks/[col]/[topic]`** — Topic header với icon h-14, lesson list numbered (01/02/...), breadcrumb back collection
- [x] **CardPreview scroll focus** — `scrollIntoView({behavior:'smooth', block:'center'})` khi expand, ring amber + scale-[1.015]
- [x] **Query helper `getTopicBySlug`** — ownership gate giống `getCollectionBySlug`, trả `TopicDetail`
- Commit `eff2055` trên fe → merge `781251c` lên dev → sync `82dc173` xuống be

### Session 2026-05-17 — CardPreview polish + theme accent

- [x] **Theme accent tokens** (`globals.css`): `--accent` / `--accent-soft` / `--highlight`. Light (study4-inspired blue/yellow), Dark (low-chroma soft sage/cream — KHÔNG neon, eye-friendly). Swap `@media (prefers-color-scheme: dark)` → `.dark` selector cho next-themes class-based toggle (fix bug CSS vars không react theo toggle)
- [x] **CardPreview restyle** (`card-preview.tsx`):
  - Typography EN/VI: VN italic + `text-zinc-500` dim, EN giữ `text-zinc-900 dark:text-zinc-50`
  - Bold target word: regex `\b(card.word|card.lemma)\b` với escape, capture-group split → wrap `<strong>` text-accent
  - Glassmorphism badges (POS/CEFR/Note/suspend): `backdrop-blur-sm bg-white/60 dark:bg-black/30 ring-1`
  - Section dividers: `divide-y divide-zinc-100 dark:divide-zinc-900` between def / examples / syn-ant-col / mnemonic / etymology
  - Mnemonic blockquote: dashed `border-[var(--highlight)]/60` + gradient `from-highlight/10 to-accent-soft/30` + floating "💡 Mẹo nhớ" label absolute
  - Audio TTS button: `Volume2` icon cạnh IPA, `speechSynthesis` en-GB rate 0.9, `stopPropagation`, hydration-safe `ttsSupported` state
  - Hover lift closed: `hover:-translate-y-0.5 hover:shadow-sm`. Open state soft glow: `border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/10 ring-2 ring-[var(--accent)]/30` (thay amber solid)
  - Relabel suspend badge: "Tạm dừng" → "Đã thuộc" + `CheckCircle2` icon
- [x] **Lesson cards masonry** (`/decks/[col]/[topic]/[lesson]/page.tsx`): switch từ CSS grid `lg:grid-cols-2 items-start` → CSS columns `lg:columns-2` + `break-inside-avoid`. Eliminates row-height alignment artifacts khi cards uneven height
- Commit `d6cc9bc` + `c9fe61a` trên fe → merge `c2bf721` lên dev → sync `ae75f85` xuống be. Gates green (typecheck 0 / lint 0 / 179 tests)

### Defer (chưa làm)

- [ ] "Lưu từ" bookmark — cần DB migration `user_cards.bookmarked` boolean + server action
- [ ] "Báo lỗi" feature — cần form + table report mới
- [ ] Theme accent apply vào dashboard/stats/topbar (chỉ scope deck/card hiện tại)
- [ ] Conjugation matching cho bold target word (vd `accountant` vs `accountants`)

---

## Content expansion P5-P12 (Post-MVP) — Coverage Oxford 3000 lên 100%

Plan tổng: `docs/CONTENT_PLAN_FULL.md`. Target 192 lessons / 3840 cards.

- [x] **P5 Common Core** (10 lessons / 200 cards, 2026-05-16) — articles-determiners, pronouns-basic, prepositions-place, prepositions-time-other, conjunctions-basic, core-be-do-have, core-action-verbs, core-mental-verbs, core-adjectives, core-adverbs. New topic `common-core`.
- [x] **P6 A1 fillers** (15 lessons / 300 cards, 2026-05-16) — colors-basic, shapes-sizes, common-a1-verbs-1/2, common-a1-adj/adv/nouns, body-parts-ext, food-cooking, clothes-accessories-ext, transport-vehicles-ext, numbers-quantities-ext, weather-seasons-ext, time-words-ext, family-people-ext.
- [x] **P7a A2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `eb4c659` trên be → merge `09a3db8` lên dev → sync `f9bed4d` xuống fe):
  - `daily-life/shopping-money` — purchase, sell, price, cost, discount, sale, bargain, receipt, cash, basket, trolley, cashier, brand, customer, afford, offer, coupon, stock, deliver, fit
  - `people/feelings-extended` — anxious, disappointed, furious, delighted, amazed, upset, stressed, content, annoyed, shocked, terrified, thrilled, homesick, miserable, eager, astonished, regret, fear, joy, mood
  - `work-business/email-communication` — reply, forward, attach, attachment, subject, inbox, spam, draft, recipient, urgent, signature, sincerely, regards, delete, chat, message, sender, request, confirm, link
  - `education/study-techniques` — note, highlight, outline, flashcard, chapter, paragraph, search, define, lecture, goal, method, technique, resource, topic, chart, diagram, break, quote, format, organize
  - `daily-life/housing-utilities` — rent, deposit, lease, mortgage, landlord, tenant, utility, electricity, gas, internet, repair, plumber, electrician, furnished, basement, driveway, hallway, roof, lock, leak
  - Quality bar: British IPA, VN context dày (FPT/Vincom/Shopee/Lotte/Highlands/Tết/Vietcombank/Zalo/Momo/Grab/BlackPink/Hạ Long Bay…), mnemonic wordplay, etymology narratives, 0-3 syn / 0-2 ant / 4-5 collocations. Collision check via grep — 100/100 NEW words.
  - Gates green (typecheck 0, lint 0, 179/179 tests). Seed live: **72 lessons / 1440 cards** (~37% Oxford 3000).
- [x] **P7b A2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `f009659` trên be → merge `c99d978` lên dev → sync `955f4f2` xuống fe):
  - `places-travel/traffic-roads` — jam, lane, highway, roundabout, intersection, sidewalk, crossing, footpath, signal, rush, honk, overtake, speed, horn, seatbelt, petrol, diesel, collision, pedestrian, accident
  - `nature-environment/wildlife-ext` — eagle, owl, parrot, peacock, butterfly, bee, spider, ant, mosquito, shark, whale, octopus, turtle, crab, wolf, bear, fox, deer, squirrel, crocodile
  - `entertainment/sports-fitness` — workout, stretch, fitness, strength, flexibility, stamina, warmup, jog, hike, dive, surf, kick, throw, catch, race, referee, medal, trophy, dumbbell, push-up
  - `time-numbers/time-frequency` — seldom, frequently, daily, weekly, monthly, yearly, hourly, annual, regular, sudden, immediate, gradual, temporary, permanent, continuous, whenever, whilst, occasionally, constantly, repeatedly
  - `daily-life/health-symptoms` — headache, stomachache, toothache, flu, fever, cough, sneeze, dizzy, vomit, bleed, bandage, prescription, vaccine, medication, infection, virus, bacteria, injury, wound, rash
  - Quality bar: British IPA, VN context dày (FPT/Vincom/Shopee/Vinmec/Petrolimex/EVN/Côn Đảo/Cát Bà/Fansipan/Highlands/...), mnemonic wordplay, etymology narratives, 0-3 syn / 0-2 ant / 4-5 collocations. Collision check via grep — 100/100 NEW.
  - Gates green (Zod ALL VALID, typecheck 0, lint 0). Seed live: **77 lessons / 1540 cards** (~40% Oxford 3000).
- [x] **P7c A2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `cb3c24b` trên be → merge `0b6e512` lên dev → sync `61a1a1a` xuống fe):
  - `daily-life/cleaning-housework` — vacuum, sweep, mop, dust, laundry, iron, dishwasher, garbage, tidy, broom, bucket, wipe, polish, stain, sponge, detergent, rubbish, chore, maid, spotless
  - `entertainment/social-media` — follow, story, hashtag, profile, tag, filter, upload, download, notification, emoji, stream, subscribe, block, mute, caption, selfie, trending, unfollow, swipe, status
  - `people/work-relationships` — supervisor, subordinate, coworker, trainee, apprentice, recruit, counterpart, mentee, peer, associate, dismiss, quit, shift, rookie, veteran, chief, lead, specialist, junior, crew
  - `work-business/teamwork` — collaborate, role, task, contribute, cooperate, delegate, assign, achieve, accomplish, teamwork, unity, division, resolve, consensus, coordinate, align, responsibility, mutual, commit, complete
  - `time-numbers/measurements` — metre, kilometre, centimetre, millimetre, inch, mile, kilogram, gram, pound, litre, millilitre, gallon, weight, height, length, width, depth, distance, tonne, measure
  - Quality bar: British IPA, VN context dày (Vinhomes/Vietcombank/VPBank/Viettel/FPT/Vinpearl/Landmark 81/Mekong/Bến Thành/Sơn Tùng M-TP/Vietnam Airlines/Hạ Long Bay), mnemonic wordplay, etymology narratives, 0-3 syn / 0-2 ant / 4-5 collocations. Collision check via grep — 100/100 NEW.
  - Gates green (Zod ALL VALID). Seed live: **82 lessons / 1640 cards** (~43% Oxford 3000).
- [x] **P7d A2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `ae3af76` trên be → merge `17e4728` lên dev → sync `c98c46d` xuống fe) — **P7 CLOSED 20/20 lessons**:
  - `daily-life/personal-care` — toothpaste, shampoo, conditioner, lotion, deodorant, comb, makeup, perfume, razor, toothbrush, soap, nail, cream, spray, tissue, cotton, lipstick, sunscreen, shave, haircut
  - `education/online-learning` — mooc, webinar, livestream, podcast, tutorial, course, badge, enroll, register, module, app, digital, online, virtual, video, instructor, session, login, zoom, platform
  - `places-travel/tourism-experiences` — souvenir, guide, tour, attraction, landmark, brochure, itinerary, postcard, tourist, tourism, destination, cruise, backpack, hostel, map, exotic, local, adventure, explore, wander
  - `nature-environment/farm-rural` — crop, livestock, plough, barn, field, soil, irrigation, scarecrow, farmhouse, orchard, paddy, cattle, dairy, herd, graze, fertilizer, tractor, countryside, pasture, stable
  - `abstract-academic/cognition` — recognize, perceive, identify, distinguish, observe, examine, evaluate, consider, imagine, interpret, notice, realize, predict, infer, compare, contrast, recall, process, classify, estimate
  - Quality bar: British IPA, VN context dày (P/S/Sunsilk/Lifebuoy/Vinamilk/Watsons/Anessa/Coursera/Udemy/Vietcetera/Mai Châu/Mu Cang Chai/Bến Tre/Đắk Lắk/Mộc Châu/Hội An/Phú Quốc). Collision check via grep — 100/100 NEW.
  - Gates green (Zod ALL VALID). Seed live: **87 lessons / 1740 cards** (~45% Oxford 3000).
  - **P7 totals**: 20 lessons / 400 cards across 4 batches (P7a + P7b + P7c + P7d) hoàn thành 2026-05-17 trong cùng day.
- [~] **P8 B1 part 1** (25 lessons / 500 cards) — 5/25 done (P8a)
  - [x] **P8a B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `988796a` → merge `c7bb80e` → sync `e4acd1b`):
    - `abstract-academic/quality-quantity` — level, scale, range, proportion, extent, quantity, quality, portion, majority, minority, capacity, volume, density, rate, ratio, abundance, shortage, surplus, excess, plenty
    - `abstract-academic/change-process` — alter, transform, develop, evolve, modify, vary, switch, adjust, adapt, reform, expand, reduce, grow, decline, advance, deteriorate, maintain, preserve, sustain, innovate
    - `society-culture/social-issues` — poverty, inequality, equality, class, protest, movement, welfare, gender, discrimination, corruption, charity, diversity, immigrant, refugee, homeless, volunteer, donate, riot, petition, activist
    - `abstract-academic/communication` — debate, declare, state, announce, warn, insist, deny, admit, express, describe, complain, criticize, praise, respond, whisper, shout, persuade, convince, negotiate, inform
    - `work-business/decision-making` — decision, select, determine, hesitate, consult, advise, prefer, option, alternative, weigh, risk, priority, conclusion, compromise, approve, reject, postpone, prioritize, veto, finalize
    - Gates green. Seed live: **92 lessons / 1840 cards** (~48% Oxford 3000).
  - [x] **P8b B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `e56cf53` → merge `7f24339` → sync `3e4585a`):
    - `nature-environment/science-basics` — gravity, energy, force, mass, atom, molecule, particle, experiment, cell, element, matter, universe, space, planet, earth, moon, star, galaxy, orbit, equation
    - `daily-life/health-wellness` — mental, stress, anxiety, therapy, meditation, nutrition, vitamin, calorie, immune, recovery, wellness, wellbeing, diet, hydration, protein, carb, cardio, mindful, healing, nap
    - `work-business/marketing-sales` — advertise, target, campaign, sales, segment, launch, product, service, client, revenue, loyalty, niche, pitch, competitor, demographic, engagement, conversion, sponsor, endorse, slogan
    - `abstract-academic/time-sequence` — prior, subsequent, simultaneously, previously, meanwhile, finally, afterwards, beforehand, briefly, shortly, presently, formerly, subsequently, ongoing, earlier, later, consecutive, successive, imminent, prolonged
    - `entertainment/digital-culture` — meme, algorithm, streamer, gaming, esports, nft, crypto, metaverse, avatar, hack, cyber, reality, augmented, chatbot, database, cookie, browser, website, firewall, encryption
    - Gates green. Seed live: **97 lessons / 1940 cards** (~50% Oxford 3000 — milestone đầu tiên!).
  - [x] **P8c B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `1d6b923` → merge `2169324` → sync `b234dad`):
    - `abstract-academic/abstract-concepts` — concept, principle, paradigm, framework, notion, essence, aspect, context, approach, model, system, structure, nature, truth, value, property, feature, characteristic, component, trait
    - `society-culture/politics-government` — politics, policy, minister, president, congress, senator, mayor, candidate, diplomat, embassy, nation, federal, republic, monarchy, treaty, summit, speech, ballot, coalition, referendum
    - `work-business/leadership` — motivate, inspire, vision, mission, empower, charisma, integrity, accountability, authority, command, direct, oversee, supervise, govern, dominate, control, discipline, encourage, visionary, delegate
    - `daily-life/relationships-modern` — relationship, breakup, marriage, crush, flirt, honeymoon, spouse, fiance, bachelor, widow, soulmate, in-laws, ghost, ex, dating, intimacy, commitment, cohabit, blind-date, matchmaker
    - `nature-environment/sustainability` — organic, footprint, reuse, compost, biodegradable, environmental, protect, solar, electric, hybrid, vegan, consumption, waste, erosion, recyclable, natural, endangered, plant-based, zero-waste, biofuel
    - Gates green. Seed live: **102 lessons / 2040 cards** (~53% Oxford 3000).
  - [x] **P8d B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `96a7aa9` → merge `5bb6b28` → sync `2943625`):
    - `work-business/finance-investment` — bond, asset, portfolio, dividend, investor, investment, equity, fund, capital, broker, trader, finance, savings, inflation, recession, yield, liquidity, bull, hedge, gain
    - `entertainment/streaming-media` — original, trailer, spoiler, binge, finale, cliffhanger, cast, reboot, sequel, prequel, spinoff, crossover, thriller, sitcom, soundtrack, subscriber, rating, documentary, showrunner, playlist
    - `nature-environment/oceans-marine` — coral, reef, tide, current, marine, wave, seaweed, jellyfish, seal, squid, krill, plankton, aquatic, salinity, seabed, seafood, fisherman, underwater, sailor, tsunami
    - `abstract-academic/argument-logic` — rebuttal, premise, assumption, fallacy, valid, invalid, sound, reasoning, deduce, prove, disprove, contradict, imply, assertion, bias, objective, subjective, refute, justify, counter
    - `daily-life/aging-life-stages` — mature, prime, youth, infant, toddler, teen, adolescence, adulthood, midlife, retirement, pension, aging, wrinkle, birthday, milestone, lifespan, ancient, juvenile, nostalgic, legacy
    - Gates green. Seed live: **107 lessons / 2140 cards** (~56% Oxford 3000).
  - [x] **P10d B2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `87e2d73` → merge `f967e39`) — P10 20/25, token-efficient triage levers ON:
    - `time-numbers/historical-eras` — antiquity, medieval, renaissance, enlightenment, industrial-age, postwar, modern-era, prehistoric, millennium, epoch, colonial-era, cold-war, gilded-age, reformation, crusades, baroque, bronze-age, iron-age, victorian-era, atomic-age
    - `people/leadership-styles` — autocratic, democratic, transformational, charismatic, hands-off, micromanage, servant-leader, authoritarian, laissez-faire, inspirational, figurehead, directive, adaptive, emotional-intelligence, bureaucratic, pacesetting, coercive, affiliative, transactional, decisive
    - `daily-life/mental-health` — depression, mindfulness, burnout, self-care, cognitive, behavioral, trauma, panic-attack, counseling, psychiatrist, empathy, resilience, coping, grief, loneliness, gaslighting, mood-disorder, PTSD, vulnerability, overwhelmed
    - `work-business/startup-ecosystem` — accelerator, pre-seed, seed-round, series-A, pitch-deck, term-sheet, cap-table, equity-stake, venture-capital, angel-investor, burn-rate, product-market-fit, MVP, vesting, bridge-round, early-stage, venture-fund, syndicate, liquidation-preference, dilution
    - `abstract-academic/cognitive-biases` — confirmation-bias, anchoring, availability-heuristic, dunning-kruger, sunk-cost, framing-effect, halo-effect, hindsight-bias, in-group-bias, status-quo-bias, recency-bias, survivorship-bias, negativity-bias, loss-aversion, overconfidence, groupthink, herd-mentality, attribution, stereotyping, priming
    - Collision pivots: 4 historical-eras (century/decade/contemporary/era), 6 leadership-styles (mentor/delegate/consensus/empower/visionary/coach), 5 mental-health (anxiety/therapy/wellbeing/stigma/self-esteem) + 1 round-2 swap (meditation→gaslighting), 7 startup-ecosystem (valuation/unicorn/exit/cofounder/runway/incubator/due-diligence); **cognitive-biases ZERO collision** (entire 20-word set free on round 1).
    - **Lever D etymology**: ~60 cards skip (compound modern dominant in P10d — historical-eras has many _-age compounds, startup-ecosystem nearly all acronyms/compounds, cognitive-biases nearly all _-bias/\_-effect compounds). **Lever E collocation triage 3-5** applied. Zod schema green all 5. IPA flags 87/100 (startup-ecosystem 20/20 due to acronyms/compounds). Seed live: **pending user manual run** (target 157 lessons / 3140 cards).
  - [x] **P10c B2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `2843b9e` → merge `fdb67e8`) — P10 15/25, token-efficient triage levers ON:
    - `society-culture/social-movements` — civil-rights, abolition, march, boycott, demonstration, strike, picket, uprising, revolution, emancipation, segregation, solidarity, mobilize, whistleblower, dissent, nonviolence, rally, militant, collective-bargaining, unionize
    - `daily-life/sustainable-living` — minimalism, decluttering, carbon-footprint, upcycle, secondhand, reusable, veganism, ethical-consumption, fast-fashion, slow-fashion, thrift, refill, capsule-wardrobe, meal-prep, staycation, carbon-neutral, locally-sourced, offset, conscious-consumer, low-waste
    - `work-business/legal-business` — liability, breach, intellectual-property, patent, trademark, copyright, lawsuit, plaintiff, defendant, arbitration, mediation, tribunal, statute, clause, nondisclosure, compliance, due-diligence, indemnity, verdict, injunction
    - `abstract-academic/research-methodology` — methodology, citation, literature-review, longitudinal-study, qualitative, quantitative, survey, focus-group, sample-size, causation, control-group, confounding, validity, reliability, ethics-board, cross-sectional, meta-analysis, ethnography, case-study, mixed-methods
    - `entertainment/streaming-economy` — paywall, exclusive, freemium, microtransaction, ad-supported, cord-cutting, binge-watching, simulcast, on-demand, content-creator, monetization, watchlist, royalties, licensing, piracy, ad-blocker, creator-economy, platform-exclusive, engagement-rate, ad-revenue
    - **Lever D (etymology selective)**: 49/100 cards bỏ etymology (heavy compound topics — sustainable-living 16, streaming-economy 12, plus civil-rights/strike/uprising/whistleblower/nonviolence từ social-movements). **Lever E (collocation triage 3-5)**: tier theo độ phổ thông. **Lever C SKIP** vẫn 5 lessons/batch.
    - Heavy collision pivots round 1: dropped 9 social-movements words (reform/activism/grassroots/suffrage/inequality/equality/protest/discrimination/petition); 10 sustainable-living (vs nature-environment/sustainability); 2 legal-business (contract/jurisdiction); 8 research-methodology (hypothesis/peer-review/variable/etc); 5 streaming-economy (subscription/stream/algorithm/influencer/recommendation). Round 2 grep: ZERO collision. Zod schema green tất cả 5. IPA flags 85/100 (range P10b 83/100). Seed live: **pending user manual run** (target 152 lessons / 3040 cards).
  - [x] **P10b B2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `0390931` → merge `7567909`) — P10 10/25, token-efficient triage levers ON:
    - `work-business/finance-advanced` — derivative, arbitrage, volatility, par-value, capital-gain, amortization, depreciation, fiscal, monetary, forex, commodity, securities, benchmark, index-fund, short-selling, margin (2-def), collateral, maturity, premium (2-def), spread
    - `abstract-academic/linguistics` — morphology, semantics, pragmatics, phoneme, syntax, lexicon, cognate, inflection, orthography, phonetic, allophone, morpheme, syllable, intonation, discourse, corpus, phonology, sociolinguistics, grapheme, philology
    - `nature-environment/genetics-biology` — DNA, gene, chromosome, mutation, allele, hereditary, genome, transcription, genotype, phenotype, dominant, recessive, enzyme, mitosis, meiosis, ribosome, amino-acid, helix, nucleotide, mitochondria
    - `entertainment/literary-criticism` — symbolism, motif, archetype, hyperbole, juxtaposition, personification, denouement, catharsis, anachronism, allusion, foreshadowing, imagery, diction, alliteration, onomatopoeia, oxymoron, epiphany, pun, trope, parody
    - `places-travel/geopolitics` — alliance, soft-power, sphere-of-influence, border-dispute, sanctions, diplomacy, annexation, hegemony, multilateral, unilateral, proliferation, neutrality, geopolitics, nuclear-treaty, arms-race, nation-state, bilateral, isolationism, realpolitik, detente
    - **Lever D (etymology selective)**: 22/100 cards bỏ etymology (compounds modern, acronyms DNA/forex, từ Germanic/Latin không insightful). **Lever E (collocation triage 3-5)**: cards specialized 3 collo (allele, mitosis, helix, oxymoron…). **Lever C (smaller batch) SKIP**: B2 collisions ít → giữ 5 lessons/batch. **Lever B (prompt tighten)**: postpone.
    - Zero collision sau Round 1 + Round 2 grep. Zod schema green tất cả 5. IPA flags 15-19/20 mỗi file (83/100 total — same range với P10a). Lint-staged prettier reformat 5 files khi commit. Seed live: **pending user manual run** (target 147 lessons / 2940 cards).
  - [x] **P10a B2 expansion** (5 lessons / 100 cards, 2026-05-17, commit `c62d88f` → merge `a376d79` → sync `c69b4a4`) — P10 mở 5/25, lần đầu B2:
    - `abstract-academic/philosophy` — existentialism, dichotomy, paradigm-shift, epistemology, ontology, metaphysics, dualism, monism, nihilism, stoicism, dialectic, syllogism, ethics, morality, virtue, free-will, determinism, consciousness, relativism, paradox
    - `work-business/corporate-strategy` — diversification, synergy, vertical-integration, horizontal-integration, monopoly, oligopoly, conglomerate, holding-company, divestment, takeover, restructuring, downsize, outsource, merger, acquisition, market-share, consolidation, antitrust, shareholder, leverage
    - `nature-environment/ecosystem-services` — pollination, carbon-sequestration, biocapacity, nutrient-cycling, watershed, decomposition, biome, food-chain, food-web, succession, keystone, equilibrium, biosphere, photosynthesis, biomass, carbon-sink, wetland, rainforest, runoff, riparian
    - `entertainment/film-production` — cinematography, postproduction, screenwriting, montage, mise-en-scene, storyboard, cinematographer, screenplay, CGI, dolly, pan, fade, cut, shot, frame-rate, composition, lighting, b-roll, voice-over, blocking
    - `society-culture/governance-systems` — federalism, autocracy, jurisdiction, sovereignty, legislation, judiciary, executive, electorate, plebiscite, mandate, impeachment, ratify, amendment, tyranny, oligarchy, theocracy, dictatorship, anarchy, suffrage, partisan
    - Zod schema green tất cả 5. Seed live: **pending user manual run** (target 142 lessons / 2840 cards). **B2 vocabulary** — academic, lower collision than B1 zones.
  - [x] **P9e B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `110c582` → merge `d580ddd` → sync `806cc65`) — **P9 CLOSED 25/25**:
    - `daily-life/personal-finance` — interest-rate, emergency-fund, frugal, splurge, expense, income, insurance, earn, broke, paycheck, automate, stash, set-aside, side-income, recurring, subscription, thrifty, impulsive, planner, miser
    - `entertainment/board-games` — pawn, strategy, chess, checkers, opponent, turn, roll, bluff, deck, card, rook, knight, bishop, queen, king, poker, gamble, shuffle, bet, wager
    - `people/networking` — connect, contact, business-card, reach-out, warm-lead, small-talk, LinkedIn, elevator-pitch, icebreaker, mingle, referral, introduction, handshake, name-drop, prospect, networking-event, keep-in-touch, schmooze, rapport, cold-email
    - `work-business/data-analysis` — dataset, graph, visualize, KPI, insight, regression, correlation, outlier, histogram, median, mode, spreadsheet, forecast, cluster, query, big-data, anomaly, p-value, significant, distribution
    - `daily-life/sleep-routine` (pivoted from airport-procedures do airport-flight đã cover 12/20 candidates) — dream, snore, insomnia, melatonin, REM, doze, wake, alarm, bedside, drowsy, restless, fatigue, circadian, nightowl, earlybird, tossing, yawn, pillow, mattress, snooze
    - Zod schema green tất cả 5. Seed live: **pending user manual run** (target 137 lessons / 2740 cards).
  - [x] **P9d B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `7dcffaf` → merge `8dcdbc7` → sync `693b5af`) — P9 20/25:
    - `places-travel/road-trip` — pit-stop, gas-station, RV, detour, mileage, breakdown, interstate, GPS, navigation, rest-area, motorhome, camper, traffic-jam, speed-limit, registration, odometer, toll, carpool, dashboard, freeway
    - `entertainment/podcasting` — RSS, microphone, recording, edit, patron, monetize, podcaster, audio, headphones, playback, intro, outro, production, airtime, cohost, feed, mic, archive, soundcheck, pilot
    - `work-business/customer-service` — replacement, queue, helpdesk, agent, satisfaction, warranty, hotline, FAQ, apology, courteous, inquiry, grievance, dissatisfied, live-chat, escalation, resolution, callback, self-service, troubleshoot, onboarding
    - `nature-environment/oceans-deep` — depths, trench, deep-sea, submarine, sonar, abyss, pressure, undersea, scuba, benthic, seamount, hydrothermal, creature, fathom, kelp, eel, anemone, anglerfish, snorkel, oxygen
    - `abstract-academic/scientific-method` — observation, variable, replication, peer-review, falsifiable, repeatable, data, treatment, dependent, independent, reproducible, measurement, prediction, trial, null, inference, double-blind, placebo, replicate, protocol
    - Zod schema green tất cả 5. Seed live: **pending user manual run** (target 132 lessons / 2640 cards).
  - [x] **P9c B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `4d17ebe` → merge `2ed7135` → sync `b9cb9e8`) — P9 15/25:
    - `daily-life/home-renovation` — renovate, remodel, paint, wallpaper, decorate, layout, tile, flooring, plumbing, wiring, install, blueprint, permit, demolish, hardwood, refurbish, fixture, foundation, carpenter, drywall
    - `entertainment/visual-arts` — sketch, canvas, exhibit, abstract, portrait, landscape, mural, brushstroke, watercolor, easel, palette, masterpiece, realism, impressionism, curator, frame, illustration, pottery, charcoal, contemporary
    - `people/relationships-conflict` — conflict, forgive, grudge, reconcile, mediate, fallout, tension, escalate, deescalate, misunderstanding, accusation, blame, betray, vent, sulk, bicker, ultimatum, heartbreak, jealousy, separate
    - `education/study-abroad` — application, orientation, overseas, semester, accommodation, stipend, homesickness, adjustment, exchange-program, foreign-language, international, IELTS, TOEFL, host-country, language-test, study-permit, exchange-student, placement, recommendation, cross-cultural
    - `daily-life/parenting` (pivot from seasons-extreme do weather lessons saturated) — parenting, scold, bedtime, nursery, playtime, allowance, sibling, foster, adopt, stepmother, stepfather, tantrum, lullaby, daycare, spoil, nurture, babyproof, stroller, diaper, upbringing
    - Zod schema green tất cả 5. Quality bar maintained. Seed live: **pending user manual run** (target 127 lessons / 2540 cards).
  - [x] **P9b B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `47533fd` → merge `44b105f` → sync `eda2b53`) — P9 10/25:
    - `nature-environment/conservation` — wildlife, reserve, poach, smuggle, restore, sanctuary, ecological, threatened, ranger, conservation, recycling, replant, reforest, captive, breeding, hunt, plastic, illegal, advocate, protected
    - `society-culture/global-issues` — globalization, migration, prejudice, tolerance, fairness, oppression, gentrification, racism, sexism, privilege, activism, asylum, marginalize, exploit, systemic, underprivileged, grassroots, stigma, stereotype, xenophobia
    - `places-travel/cultural-immersion` — homestay, etiquette, taboo, hospitality, dialect, accent, regional, indigenous, exchange, integrate, immerse, customary, culture-shock, bilingual, monolingual, expat, host-family, ceremony, folklore, gesture
    - `abstract-academic/critical-thinking` — logical, irrational, skeptical, scrutinize, presume, critique, verify, rationalize, ponder, deliberate, anecdotal, empirical, credible, reliable, oversimplify, mislead, manipulate, dogma, qualify, dispute
    - `work-business/marketing-digital` — SEO, funnel, click-through, paid, retention, churn, impression, reach, targeting, optimization, metric, analytics, copywriter, backlink, keyword, ranking, ROI, retarget, ad, CTR
    - Zod schema green tất cả 5. Quality bar maintained. Seed live: **pending user manual run** (target 122 lessons / 2440 cards).
  - [x] **P9a B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `f860441` → merge `9d106e7` → sync `fedea80`) — P9 mở 5/25:
    - `daily-life/cooking-techniques` — simmer, sauté, marinate, knead, whisk, blanch, braise, garnish, roast, grill, deep-fry, steam, mince, dice, sear, glaze, baste, julienne, chop, stir
    - `people/communication-styles` — assertive, passive, aggressive, diplomatic, blunt, tactful, sarcasm, irony, hint, mumble, articulate, eloquent, concise, verbose, persuasive, confrontational, listener, interrupt, paraphrase, validate
    - `work-business/freelance-remote` — contractor, gig, retainer, deliverable, invoice, scope, async, timezone, productivity, workspace, billable, downtime, sabbatical, coworking, self-employed, solopreneur, telework, home-office, brief, side-gig
    - `entertainment/literature-genres` — novel, fiction, nonfiction, fantasy, sci-fi, mystery, biography, memoir, poetry, satire, allegory, protagonist, antagonist, metaphor, simile, prose, dialogue, climax, foreshadow, manuscript
    - `education/higher-ed` — undergraduate, graduate, postgraduate, masters, doctorate, PhD, dissertation, faculty, professor, lecturer, seminar, tuition, transcript, GPA, internship, major, minor, campus, dormitory, alumni
    - Zod schema green tất cả 5. Quality bar maintained từ P8e. Seed live: **pending user manual run** (target 117 lessons / 2340 cards).
  - [x] **P8e B1 expansion** (5 lessons / 100 cards, 2026-05-17, commit `93df61a` → merge `7f17792` → sync `b9ccaed`) — **P8 CLOSED 25/25**:
    - `work-business/entrepreneurship` — startup, founder, pivot, venture, funding, prototype, valuation, unicorn, exit, acquire, merge, cofounder, bootstrap, IPO, runway, burn, traction, hustle, incubator, disrupt
    - `entertainment/music-production` — beat, lyrics, riff, chord, tempo, remix, sample, producer, vocal, harmony, rhythm, bass, synth, record, mix, master, track, album, DJ, groove
    - `places-travel/extreme-travel` — expedition, backpacker, off-grid, nomad, trek, wilderness, frontier, pilgrimage, solo, voyage, scenic, checkpoint, gear, trail, ascent, altitude, peak, ridge, endurance, navigate
    - `nature-environment/natural-disasters` (pivoted from weather-disasters do 7 từ trùng với weather-seasons-ext) — earthquake, eruption, wildfire, blizzard, avalanche, landslide, tornado, monsoon, tremor, magnitude, epicenter, aftermath, evacuation, devastation, debris, rescue, hazard, casualty, shelter, alert
    - `abstract-academic/identity-self` — persona, ego, mindset, character, belief, conviction, dignity, autonomy, agency, introspection, individuality, authentic, genuine, worldview, self-image, self-esteem, self-aware, humility, reputation, narrative
    - Zod schema green tất cả 5. Quality bar raised: diverse example contexts, VN cultural refs, etymology + mnemonic_vi required mọi card. Seed live: **pending user manual run** (target 112 lessons / 2240 cards).
- [x] **P9 B1 part 2** (25 lessons / 500 cards) — **CLOSED 25/25**
- [~] **P10 B2 expansion** (25 lessons / 500 cards) — P10a/b/c/d done (20/25), TODO P10e
- [ ] **P11 Phrasal & Compound** (15 lessons / 300 cards) — TODO
- [ ] **P12 Final fill** (15 lessons / 300 cards) — TODO

**Progress**: 157/192 lessons (82%), 3140/3840 cards (82%), ~82% Oxford 3000 coverage. **P7 CLOSED (20/20)**, **P8 CLOSED (25/25)**, **P9 CLOSED (25/25)**, **P10 20/25 (B2 đang gen, levers D+E ON)**, next: P10e (5 lessons để đóng P10 25/25).

**Deferred**: light/dark mode bug (light mode broken) — user-requested fix sau khi gen toàn bộ Oxford 3000.

---

## Backlog (Post-MVP)

Xem `../VOCAB_APP_BLUEPRINT.md` Phần 9.
