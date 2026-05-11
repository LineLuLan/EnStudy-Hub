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

- [x] `scripts/seed.ts` upsert thật vào Supabase (Drizzle tx; idempotent; delete-replace cards per lesson; verify counts). Live run 2026-05-12: 1/1/1/5 (collections/topics/lessons/cards)
- [x] `scripts/validate-content.ts` smoke-test với `family.json` — call dictionaryapi.dev, throttle 800ms, write `docs/CONTENT_REPORT.md`. 5/5 cards IPA mismatch (stylistic Oxford vs dict) — manual review pending
- [x] **Content master plan**: `docs/CONTENT_PLAN.md` — 10 topics, 42 lessons MVP, ~840 cards, phased P0-P4 với word list sẵn sàng paste vào Claude desktop
- [ ] **CHỜ USER**: gen P0 batch (3 lesson, ~55 cards): `daily-life/family` (+15), `daily-life/food-meals` (20), `daily-life/home-rooms` (20) qua Claude desktop
- [ ] **CHỜ USER**: review `docs/CONTENT_REPORT.md`, quyết định pick IPA style (giữ Oxford hay theo dictionaryapi)
- [ ] CRUD collections/topics/lessons (admin UI đơn giản) — defer post-MVP, content gen offline đủ
- [ ] Page `/decks` list collections (FE work)
- [ ] Page `/decks/[col]/[topic]/[lesson]` chi tiết + cards (FE work)
- [ ] Lesson enrollment ("Thêm vào học") — server action + DB write
- [ ] Card detail modal (FE work)

---

## Tuần 3 — SRS Core

- [ ] Cài `ts-fsrs`, viết `features/srs/`
- [ ] Review queue algorithm + tests (`vitest`)
- [ ] Page `/review` với Zustand session store
- [ ] Flashcard component + Framer Motion flip
- [ ] Rating buttons với hint thời gian
- [ ] Keyboard shortcuts
- [ ] Optimistic update + idempotency (`clientReviewId`)
- [ ] Server action `submitReview`
- [ ] Page `/review/summary`
- [ ] Daily new cards limit
- [ ] Edge case: empty queue, exit mid-session resume

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
