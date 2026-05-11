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
- [ ] **CHỜ USER**: chạy `pnpm install` + `pnpm dev` verify (xem `docs/ENVIRONMENT.md`)
- [ ] **CHỜ USER**: cấp Supabase URL + 3 keys (xem `docs/API_KEYS.md`) để vào Tuần 1
- [ ] **CHỜ USER**: bật branch protection GitHub cho `main` (require PR)
- [ ] **CHỜ USER**: gen thêm 15 cards còn lại cho lesson `family` qua Claude desktop (đã có 5, cần thêm 15 để đủ 20 theo blueprint)

---

## Tuần 1 — Foundation (blueprint)

- [ ] Supabase project tạo + keys cấp
- [ ] `pnpm db:gen` + `pnpm db:push` → tables tạo
- [ ] RLS policies SQL (blueprint Phần 3.2) chạy thủ công Supabase SQL editor
- [ ] Auth magic link + Google OAuth
- [ ] `middleware.ts` protect `(app)` routes
- [ ] Layout shell: sidebar + topbar (shadcn)
- [ ] Theme provider (next-themes) + Geist fonts
- [ ] Command palette skeleton (cmdk)
- [ ] Deploy Vercel
- [ ] Merge `dev → main`, tag `v0.1.0-foundation`

---

## Tuần 2 — Content & Seed

- [ ] Gen content 60-90 từ qua 3 lesson pilot (Claude desktop)
- [ ] `scripts/validate-content.ts` hoàn thiện (gọi dictionaryapi.dev)
- [ ] `scripts/seed.ts` hoàn thiện (đọc JSON → upsert Supabase)
- [ ] CRUD collections/topics/lessons (admin UI đơn giản)
- [ ] Page `/decks` list collections
- [ ] Page `/decks/[col]/[topic]/[lesson]` chi tiết + cards
- [ ] Lesson enrollment ("Thêm vào học")
- [ ] Card detail modal

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
