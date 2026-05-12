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
- [ ] Edge case: exit mid-session resume (Zustand không persist — defer chunk 4)

---

## Tuần 4 — Dashboard & Stats

- [ ] Streak (timezone-aware, `date-fns-tz`)
- [ ] Heatmap component
- [ ] Dashboard: 3 stat cards + streak + lessons in progress
- [ ] Page `/stats`: retention chart, daily activity bar
- [ ] Card maturity distribution
- [ ] Page `/settings`: timezone, daily limits, theme

---

## Tuần 5 — Minigames + Polish

- [ ] MCQ mode (4 đáp án)
- [ ] Typing mode
- [ ] Listening mode (Web Speech API)
- [ ] Mode picker `/review`
- [ ] Toast cho milestones
- [ ] Loading states + skeletons
- [ ] Empty states

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
