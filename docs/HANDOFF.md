# Handoff — Session Notes

> **Quy ước**: Cuối mỗi session AI, APPEND entry MỚI ở ĐẦU file (entries gần nhất trước).
> Mục tiêu: session AI sau đọc 2-3 entry trên cùng là pick up cold được.

---

## 2026-05-12 — be → dev → fe — Claude Opus 4.7 (Tuần 2 BE: seed live + validate smoke)

**Bối cảnh**: ngay sau release `v0.1.0-foundation` (merge `5fbd1c0` trên main, tag pushed). Mở Tuần 2 trên `be`.

**Đã hoàn thành:**

`scripts/seed.ts` (commit `72e1229` trên be → merge `8eac9aa` lên dev):

- Replace TODO bằng Drizzle transaction upsert thật:
  - Collections: `onConflictDoUpdate` by `slug`.
  - Topics: `onConflictDoUpdate` by `(collection_id, slug)` composite unique.
  - Lessons: `onConflictDoUpdate` by `(topic_id, slug)` composite unique.
  - Cards: `delete + insert` per `lesson_id` cho idempotent re-runs. Cascade wipes `user_cards/review_logs` — acceptable pre-MVP. TODO trước khi prod: thêm unique constraint `(lesson_id, word)` để true upsert.
- Dotenv load `.env.local` ở top of script (consistent với `drizzle.config.ts`). Lazy-import `db/client` SAU khi dotenv populate process.env.
- Post-write verify: COUNT() in ra 4 con số (collections/topics/lessons/cards) để operator confirm.
- `process.exit(0)` ở finally để postgres-js không treo event loop.

`scripts/validate-content.ts`: không cần đổi code (đã hoàn thiện sẵn từ Phase 0). Smoke-test với `family.json` pass — call dictionaryapi.dev, throttle 800ms, write `docs/CONTENT_REPORT.md` (gitignored).

**Verify trên Supabase (live run 2026-05-12):**

```
[seed] LIVE — scanning content/collections
[seed] Plan: 1 collection, 1 topic, 1 lesson (5 cards)
  ✓ collection oxford-3000
  ✓ topic oxford-3000/daily-life
  ✓ lesson oxford-3000/daily-life/family — 5 cards
[seed] ✓ DB state: 1 collections / 1 topics / 1 lessons / 5 cards.
```

Re-run idempotent (counts không đổi, no error).

**Validate report (`docs/CONTENT_REPORT.md`):**

5/5 cards flagged IPA mismatch — KHÔNG phải lỗi, là khác phong cách phiên âm (Oxford `/ˈfæm.əl.i/` vs dictionaryapi.dev `/ˈfɛm(ɘ)li/`). Quyết định IPA style là content decision, không block tech.

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                          |
| ------ | --------- | --------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi từ ship)         |
| dev    | `8eac9aa` | Tuần 2 BE merged (sẽ +1 commit cho doc batch) |
| be     | `72e1229` | post Tuần 2 BE work                           |
| fe     | `3db6e43` | sync post Tuần 2 BE                           |

**Blocker / chờ user:**

1. **Gen content 60-90 từ qua 3 lesson pilot qua Claude desktop** (offline, không LLM runtime). Trước mắt: 15 cards còn lại cho `family.json` (đã 5/20) + 2 lesson mới (vd `daily-life/food`, `daily-life/house`).
2. **Review `docs/CONTENT_REPORT.md`** sau khi validate batch xong — quyết định IPA style. Nếu muốn theo dictionaryapi → relax `normalizeIpa` (chấp nhận diff) hoặc bulk-replace IPA trong JSON.

**Next step gợi ý cho session AI sau:**

1. Hỏi user đã gen thêm content chưa. Nếu có → `pnpm validate:content` toàn bộ batch → `pnpm seed`.
2. Sau khi data đủ (~3 lesson, 60-90 cards) → chuyển sang `fe` build `/decks`:
   - `/decks` list collections (server component, query `collections WHERE is_official = true`).
   - `/decks/[colSlug]` list topics + lessons.
   - `/decks/[colSlug]/[topicSlug]/[lessonSlug]` detail page với card preview.
   - "Thêm vào học" button → server action insert `user_lessons` + bulk insert `user_cards` (state=new, due=now). RLS sẽ tự enforce owner.
3. Optional polish trên `be`: thêm unique constraint `(lesson_id, word)` cho cards qua migration mới + thay delete-replace bằng true upsert.

---

## 2026-05-12 — dev → main — Claude Opus 4.7 (Tuần 1 SHIP — `v0.1.0-foundation`)

**Mục tiêu hoàn thành**: verify auth flow real end-to-end với Supabase backend, đóng Tuần 1, tag release foundation.

**Verify Supabase backend (manual SQL trên Dashboard):**

- `pg_policies` schema `public`: **19 policies** trên 10 tables (≥ 12 expected) ✓
- `pg_trigger` `on_auth_user_created`: 1 row, `tgenabled = 'O'` ✓
- Auth → URL Configuration: Site URL `http://localhost:3000`, Redirect URLs có `http://localhost:3000/auth/callback` ✓
- Auth → Providers → Email: enabled, confirm OFF ✓

**Verify magic link flow real:**

- `pnpm dev` Ready in 6.7s, `.env.local` nhận đủ 4 Supabase keys.
- `/login` → submit email → "Đã gửi" state OK.
- Lần đầu click magic link → `otp_expired` (email scanner warm hoặc click 2 lần). Lần retry (click 1 lần, ngay sau submit) → OK, redirect `/auth/callback?code=…` → `/dashboard` render.
- 3 SELECT verify `auth.users` + `public.profiles` + `public.user_stats`: cả 3 trả 1 row, IDs khớp nhau ⇒ trigger `handle_new_user` chạy đúng.

**Doc updates trên `dev`:**

- `docs/TRACKER.md` Phase 0 + Tuần 1: tick `[x]` toàn bộ blocker user-side đã clear (Supabase keys, db:push, rls.sql). Mark `Tuần 1 ✅ DONE`. Skip `[-]` Vercel + Google OAuth (push về sau).
- `docs/HANDOFF.md`: entry này.
- `docs/SYNC.md`: thêm log row "release: v0.1.0-foundation" + 2 sync row sau merge.

**Release trên `main`:**

```bash
git checkout main && git pull
git merge dev --no-ff -m "release: v0.1.0-foundation (Phase 0 + Tuần 1)"
git tag -a v0.1.0-foundation -m "Foundation: scaffold + UI shell + auth magic link + Supabase RLS"
git push origin main --follow-tags
```

Sync `dev → be` và `dev → fe` ngay sau (`--no-ff`) để 3 nhánh đồng bộ điểm xuất phát Tuần 2.

**Trạng thái nhánh (sau release):**

| Branch | SHA                    | Note                                     |
| ------ | ---------------------- | ---------------------------------------- |
| main   | _(set sau merge)_      | nhận v0.1.0-foundation tag               |
| dev    | _(set sau commit doc)_ | base cho Tuần 2                          |
| be     | _(set sau sync)_       | sẽ làm Tuần 2 (seed + validate scripts)  |
| fe     | _(set sau sync)_       | chờ data từ be, sau đó build `/decks` UI |

**Còn lại (không block ship):**

1. Bật branch protection GitHub cho `main` (Settings → Branches → require PR, no force push). User-side, làm bất cứ lúc nào.
2. Gen 15 cards còn lại cho lesson `family` qua Claude desktop. Đẩy sang Tuần 2 content batch.

**Next step gợi ý cho session AI sau (vào Tuần 2):**

1. Check `git log main..dev` — không lệch, sạch sẽ.
2. Vào Tuần 2 trên `be`:
   - Hoàn thiện `scripts/seed.ts` (đọc `content/wordlists/*.csv` + `content/lessons/**/*.json` → upsert Supabase qua service-role key, bypass RLS).
   - Hoàn thiện `scripts/validate-content.ts` (gọi `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`, throttle ~1 req/s, output `content/validation-report.json`).
3. Sau khi seed pass với 5 cards `family` hiện có → user gen thêm 15 cards + 2 lesson nữa (60-90 từ) qua Claude desktop.
4. Mở `fe` build `/decks` (list) + `/decks/[col]/[topic]/[lesson]` (detail) khi đã có data thật.

---

## 2026-05-11 — dev — Claude Opus 4.7 (Tuần 1 done — chờ Supabase keys)

**Đã hoàn thành (cycle BE/FE → dev → sync):**

UI shell (commit `c0ca891` trên dev, đã sync xuống be+fe):

- 5 UI primitives shadcn-style: button (cva variants), input, label, separator, dropdown-menu
- Providers: ThemeProvider (next-themes class strategy), Toaster (sonner)
- Sidebar (active-route highlight, brand), Topbar (search trigger, theme toggle, user menu)
- CommandPalette ⌘K (cmdk) ở root layout — navigate 5 trang chính
- Deps: `@radix-ui/react-{slot,dropdown-menu,label,separator}`

BE work (commit `486498b` trên be → merge `8bf9121` lên dev):

- `pnpm db:gen` → `src/lib/db/migrations/0000_breezy_swarm.sql` (11 tables, FKs, indexes)
- `src/lib/db/rls.sql` — RLS policies + trigger `handle_new_user` (paste vào Supabase SQL Editor)
- `src/features/auth/actions.ts`: signInWithMagicLink (Zod email), signInWithGoogle, signOut
- `src/features/auth/profile.ts`: ensureProfile fallback (idempotent insert profiles + user_stats)
- `src/app/auth/callback/route.ts`: exchange ?code= → session, redirect ?next= hoặc /dashboard

FE work (commit `b41ace0` trên fe → merge `675b08e` lên dev):

- `src/components/auth/login-form.tsx` (client): email input + magic link submit (useFormStatus pending), Google OAuth button, success state "Đã gửi", toast on error
- `src/app/(auth)/login/page.tsx` (server): async searchParams, branded header, render LoginForm

**Trạng thái nhánh:**
| Branch | SHA |
|---|---|
| main | `5433a6f` (vẫn untouched) |
| dev | `675b08e` |
| be | `d8f4227` |
| fe | `b41ace0` |

**Verified locally:**

- pnpm typecheck/lint: 0 errors mỗi commit
- pnpm dev: /login, /dashboard, /review, /decks, /stats, /settings, /auth/callback đều OK (callback redirect đúng khi thiếu code)

**Blocker / chờ user (TUYỆT ĐỐI):**

1. **Cấp Supabase project + 4 keys** trong `.env.local` (xem `docs/API_KEYS.md` Phần 1):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (pooler URL, port 6543)
2. Chạy `pnpm db:push` để apply migration `0000_breezy_swarm.sql` lên Supabase.
3. Mở Supabase Dashboard → SQL Editor → paste `src/lib/db/rls.sql` → Run.
4. (Optional) Setup Google OAuth client + paste credentials vào Supabase Auth → Providers → Google.
5. Test auth flow thực: `/login` → enter email → check inbox → click magic link → land on `/dashboard`.

**Next step gợi ý cho session AI sau:**

1. Hỏi user đã cấp Supabase + chạy `db:push` + `rls.sql` chưa.
2. Nếu xong → test auth flow real, fix nếu lỗi (thường lỗi redirect URL hoặc Auth → URL Configuration).
3. Sau khi auth pass: merge `dev → main`, tag `v0.1.0-foundation`.
4. Tiếp Tuần 2 (Content & Seed) trên `be`: hoàn thiện `scripts/seed.ts` upsert thật + admin CRUD page /decks.

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
