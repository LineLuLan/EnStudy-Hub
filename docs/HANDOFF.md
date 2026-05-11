# Handoff — Session Notes

> **Quy ước**: Cuối mỗi session AI, APPEND entry MỚI ở ĐẦU file (entries gần nhất trước).
> Mục tiêu: session AI sau đọc 2-3 entry trên cùng là pick up cold được.

---

## 2026-05-11 — dev — Claude Opus 4.7 (Phase 0 verify pass + bắt đầu Tuần 1)

**Verify Phase 0 trên máy user (Windows / pnpm 9):**

- `pnpm install`: 522 packages cài OK (retry 1 lần do Windows EPERM lock). Tailwind v4 stable = `4.3.0`.
- `pnpm typecheck`: ✓ 0 errors
- `pnpm lint`: ✓ 0 warnings
- `pnpm dev`: ✓ Ready in 4s trên `http://localhost:3000`
- HTTP test 6 routes (`/`, `/dashboard`, `/review`, `/decks`, `/stats`, `/settings`, `/login`) — đều **HTTP 200**.

**3 lỗi tìm thấy & fix trong commit `f8cc446`:**

1. ESLint 9 cần flat config — xoá `.eslintrc.json`, tạo `eslint.config.mjs` (FlatCompat).
2. `@supabase/ssr` `setAll` implicit any — thêm `type CookieToSet` ở `server.ts`/`middleware.ts`.
3. Unused `eslint-disable no-var` trong `db/client.ts` — bỏ comment.
4. Bonus: commit `pnpm-lock.yaml` để 3 nhánh share dep tree.

**Trạng thái nhánh (sau verify):**
| Branch | SHA |
|---|---|
| main | `5433a6f` |
| dev | `f8cc446` |
| be | `016703e` |
| fe | `b4bb87a` |

**Tiếp Tuần 1 (đang triển khai):**

- Layout shell shadcn (sidebar + topbar)
- ThemeProvider (next-themes) + Toaster (sonner) wired ở root layout
- Command palette (cmdk, ⌘K) skeleton
- Login page UI + magic link server action
- Drizzle migration generate (SQL file, không cần DB)

---

## 2026-05-11 — dev — Claude Opus 4.7 (Phase 0 hoàn thành)

**Đã làm (Phase 0 foundation):**

- Tạo + push 3 nhánh `dev`, `be`, `fe` (model 4-branch, không động `main`).
- Commit `VOCAB_APP_BLUEPRINT.md` lên `dev`.
- `docs/` (9 file): README, TRACKER, HANDOFF, SYNC, DECISIONS, API_KEYS, CONTENT_PIPELINE, CONTRIBUTING, ENVIRONMENT, GLOSSARY.
- Codebase Next.js 15 + TS strict + Tailwind v4: package.json, tsconfig, next.config, postcss, drizzle.config.
- Tooling: ESLint, Prettier (+ prettier-plugin-tailwindcss), Husky (pre-commit + commit-msg), commitlint, lint-staged.
- `.env.example` đầy đủ keys + `.gitignore` + `.nvmrc` (node 20).
- `src/lib/db/schema.ts` — FULL theo blueprint 3.1 (collections/topics/lessons/cards + profiles/userLessons/userCards/reviewLogs/studySessions/userStats + enums).
- `src/lib/supabase/{server,client,middleware}.ts` via `@supabase/ssr` (Phase-0 no-op nếu env chưa cấp).
- `src/lib/env.ts` Zod-validated, `getServerEnv()` guard chống import vào client bundle.
- `src/lib/utils/{cn,dates,ids}.ts` + `src/lib/auth/session.ts`.
- `src/middleware.ts` + `src/app/{layout,page,globals.css}` (Geist fonts, Tailwind v4 syntax).
- Routes stubs: `(auth)/login` + `(app)/{layout,dashboard,review,decks,stats,settings}`.
- `src/features/vocab/content-schema.ts` (Zod schemas cho JSON content).
- Folder skeleton `src/{features,components,stores}` với `.gitkeep`.
- `scripts/seed.ts` (dry-run) + `scripts/validate-content.ts` (cross-check dictionaryapi.dev) + `scripts/sync-branches.ps1`.
- Content pilot: Oxford 3000 collection + Daily Life topic + family lesson **5 cards** (family, mother, father, son, daughter).
- `.github/PULL_REQUEST_TEMPLATE.md`.
- Commit Phase 0 trên `dev` → merge xuống `be` + `fe` qua `--no-ff` → push cả 3 nhánh.

**Trạng thái nhánh (sau Phase 0):**
| Branch | SHA |
|---|---|
| main | `5433a6f` (chưa nhận Phase 0) |
| dev | `dd778af` |
| be | `bea1a25` |
| fe | `3206fd3` |

**Đang làm dở:**

- Chưa chạy `pnpm install` + `pnpm dev` để verify (chạy local trên máy user, hook husky cần `prepare`).
- 15 cards còn lại của lesson `family` (đã có 5/20) — user gen qua Claude desktop khi rảnh.

**Blocker / chờ user:**

1. **Chạy `pnpm install`** trên máy local — kiểm tra deps cài được, Husky setup hook.
2. **Chạy `pnpm dev`** — verify localhost:3000 hiển thị landing page.
3. **Chạy `pnpm typecheck` + `pnpm lint` + `pnpm build`** — sanity check.
4. **Cấp Supabase keys (4)** — xem `docs/API_KEYS.md`. Cần để vào Tuần 1.
5. **Bật branch protection trên GitHub** cho `main` (Settings → Branches → require PR, no force push).
6. (Optional) **Tải Oxford 3000 CSV đầy đủ** thay sample (40 từ).

**Next step gợi ý cho session AI sau:**

1. Hỏi user đã chạy verify chưa.
2. Nếu đã có Supabase keys → vào Tuần 1: `pnpm db:gen` + `pnpm db:push` + chạy SQL RLS policies blueprint 3.2 trên Supabase SQL Editor.
3. Tiếp Tuần 1: auth magic link + Google OAuth + sidebar/topbar component thực (shadcn install).

**Decisions taken (xem `docs/DECISIONS.md`):**

- ADR-001: 4-branch model.
- ADR-002: Phase 0 scaffold full trên `dev`, không split BE/FE.
- ADR-003: Schema full ngay Phase 0.
- ADR-004: Content gen offline (không LLM runtime).
- ADR-005: Cross-check content qua Free Dictionary API.
- ADR-006: Tham khảo cấu trúc luyentu.com, không copy nội dung.

---
