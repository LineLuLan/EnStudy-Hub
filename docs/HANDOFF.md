# Handoff — Session Notes

> **Quy ước**: Cuối mỗi session AI, APPEND entry MỚI ở ĐẦU file (entries gần nhất trước).
> Mục tiêu: session AI sau đọc 2-3 entry trên cùng là pick up cold được.

---

## 2026-05-11 — dev — Claude Opus 4.7 (Phase 0 setup)

**Đã làm:**
- Tạo nhánh `dev`, `be`, `fe` từ `main`, push remote.
- Commit `VOCAB_APP_BLUEPRINT.md` vào `dev` (was untracked).
- Tạo `.gitignore` (Next.js + env + AI tools + content reports).
- Tạo `docs/` với 9 file: README, TRACKER, HANDOFF, SYNC, DECISIONS, API_KEYS, CONTENT_PIPELINE, CONTRIBUTING, ENVIRONMENT, GLOSSARY.

**Đang làm dở:**
- Next.js scaffold + config files trong root (chưa init `package.json`).

**Blocker / chờ user:**
- **Supabase project keys** (4): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`. Cần để chạy `pnpm db:push` ở Tuần 1. Xem hướng dẫn lấy ở `API_KEYS.md`.

**Next step gợi ý:**
1. Đọc `TRACKER.md` mục Phase 0 cho task còn `[ ]`.
2. Tiếp tục Next.js scaffold: tạo `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, etc.
3. Sau khi `pnpm install` + `pnpm dev` chạy được → merge `dev → be` + `dev → fe`.

**Decisions taken:**
- Phase 0 scaffold làm full trên `dev` (không split `be`/`fe`), lý do: hạ tầng dùng chung. Tách BE/FE từ Tuần 2.
- Schema Drizzle copy full từ blueprint 3.1 ngay từ đầu (không làm dần) — tránh rebase migration sau.

---
