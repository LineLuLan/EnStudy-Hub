# Tracker — Roadmap 6 tuần + Phase 0

> **Quy ước**: `[ ]` todo, `[~]` đang làm, `[x]` xong, `[!]` blocker, `[-]` skip/đẩy lùi.
> Cập nhật trạng thái mỗi lần bắt đầu / kết thúc task.

---

## Phase 0 — Foundation (current)

**Mục tiêu**: repo có khung, docs, scaffold, content pilot — không cần Supabase chạy được `pnpm dev`.

- [x] Tạo nhánh `dev`, `be`, `fe` từ `main` + push remote
- [x] `.gitignore` + `docs/` (9 file)
- [~] Next.js 15 + TS strict + Tailwind v4 scaffold trong root
- [ ] Config files: `tsconfig`, `next.config`, `tailwind`, `drizzle`, `eslint`, `prettier`, `commitlint`
- [ ] Folder skeleton `src/{app,features,components,lib,stores}` theo blueprint 2.2
- [ ] Drizzle schema full (blueprint 3.1) trong `src/lib/db/schema.ts`
- [ ] Supabase clients (`server.ts`, `client.ts`, `middleware.ts`)
- [ ] `src/lib/env.ts` Zod-validated env + `.env.example`
- [ ] Husky + lint-staged + commitlint
- [ ] Content wordlist: download Oxford 3000 CSV
- [ ] Pilot lesson `daily-life/family` (20 từ) — JSON file
- [ ] `scripts/seed.ts` + `scripts/validate-content.ts` (stubs)
- [ ] Commit `dev` → merge `dev → be`, `dev → fe` → update `SYNC.md`
- [ ] **CHỜ USER**: cấp Supabase URL + 3 keys (xem `API_KEYS.md`)

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
