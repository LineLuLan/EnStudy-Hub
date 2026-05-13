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
- [ ] **CHỜ USER**: gen P1 batch (7 lesson, 140 cards): clothes-appearance, body-health, daily-routine, people/personality, people/emotions, time-numbers/time-dates, time-numbers/numbers-quantities — xem `docs/CONTENT_PLAN.md` Phần 5
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
- [x] **Tuần 5 ĐÓNG** — 4 minigame modes (Cloze/MCQ/Typing/Listening) + Mode Picker + Toast milestones + Skeleton polish. Sẵn ship `dev → main` tag `v0.2.0` "Dashboard + Stats + Settings + Minigames"

---

## Tuần 6 — Scale content + Ship

- [ ] Gen thêm 500-1000 từ
- [ ] CSV import UI
- [ ] Card editing UI
- [ ] Suspend/bury cards
- [ ] Personal notes per card
- [ ] Mobile responsive QA
- [ ] Lighthouse > 90
- [ ] GitHub Actions cron daily DB backup
- [ ] Update `README.md`
- [ ] Tag `v1.0.0` release

---

## Backlog (Post-MVP)

Xem `../VOCAB_APP_BLUEPRINT.md` Phần 9.
