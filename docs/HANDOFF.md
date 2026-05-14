# Handoff — Session Notes

> **Quy ước**: Cuối mỗi session AI, APPEND entry MỚI ở ĐẦU file (entries gần nhất trước).
> Mục tiêu: session AI sau đọc 2-3 entry trên cùng là pick up cold được.

---

## 2026-05-15 (sáng) — dev (infra) — Claude Opus 4.7 (Tuần 6 chunk 6 v1.0.0 prep)

**Mục tiêu session**: Chuẩn bị ship v1.0.0 — viết README sản phẩm-quality, thêm LICENSE MIT (chuyển từ "Private" sang public-ready), wire GitHub Actions cron daily DB backup. KHÔNG auto-tag v1.0.0 — phần đó user duyệt cuối qua manual test + secret setup.

**Đã hoàn thành (commit trực tiếp trên dev — infra/docs, không thuộc fe/be).**

### Files thêm mới (2)

| Path                           | Vai trò                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`                      | MIT, © 2026 LineLuLan. Mở cho public repo. Wordlist samples lấy public/CC sources (Oxford 3000) — đã document trong CONTENT_PIPELINE  |
| `.github/workflows/backup.yml` | Daily cron 02:00 UTC (+ workflow_dispatch), install `postgresql-client-15`, pg_dump `--schema=public` → gzip → artifact retention 14d |

### Files edit (5)

- `README.md`: rewrite từ minimal (50 dòng) → production-grade (~150 dòng) — feature matrix 12 hàng (auth/decks/CSV/edit/queue/4 minigame/actions/stats/settings/keyboard/a11y/mobile), stack table, quickstart 3 bước, architecture tree với 5 key patterns (server-first, schema-impure split, multi-tenant ownership, Drizzle RLS bypass, code split), branch model diagram, releases table với planned v1.0.0, full docs index 12 hàng, MIT badge + workflow badge
- `docs/ENVIRONMENT.md`: thêm section 7 "Daily DB backup (GitHub Actions)" — setup 4 bước (Supabase Direct URL → GitHub secret `BACKUP_DATABASE_URL` → manual run verify), download/restore instructions, lý do dùng Direct (5432) thay vì Pooler (6543), lý do chỉ dump `public` schema. Original section 7 renamed → section 8
- `docs/TRACKER.md`: chunk 6 entry + tick GitHub Actions backup + README + 3 todos cho user
- `docs/SYNC.md`: branches table + log
- `docs/HANDOFF.md`: entry này

### Backup workflow notes

```yaml
# cron: '0 2 * * *' = 02:00 UTC daily = 09:00 GMT+7 (low-traffic)
# concurrency.cancel-in-progress: false → daily cron don't queue
# Direct URL (5432) only — pg_dump full schema introspection breaks on pooler (6543)
# --schema=public — auth/storage/realtime managed by Supabase, restorable từ dashboard
# --no-owner --no-privileges — portable across projects
# gzip -9 → ~80% smaller cho text SQL
# retention 14d → trade off cost vs disaster window
```

### Why these choices

- **MIT vs Apache**: solo project, no patent concerns, MIT simpler. README đã document Oxford 3000 attribution riêng
- **Backup secret tách `BACKUP_DATABASE_URL`** (không reuse `DATABASE_URL`): Supabase có 2 URL khác nhau (Pooler 6543 cho app runtime, Direct 5432 cho backup tools). App đang dùng Pooler nên DATABASE_URL = pooler — backup cần direct
- **No restore workflow**: restore = manual, rare. Document command trong ENVIRONMENT.md đủ
- **No S3/R2 upload**: artifact 14 days đủ cho MVP. Sau v1.0 nếu cần long-term, thêm step upload R2 (zero egress) hoặc S3

### Verify đã chạy

- `pnpm typecheck` ✓ 0 errors (không đổi source)
- `pnpm lint` ✓ 0 warnings (không đổi source)
- `pnpm test` ✓ 108/108 (5.46s) — không đổi tests
- **KHÔNG** test được `backup.yml` thật vì cần `BACKUP_DATABASE_URL` secret + GitHub Actions runtime. User phải verify lần đầu manual

### TODO cho user (chunk 6 final → v1.0.0)

1. **Setup backup secret** — Supabase Dashboard → Settings → Database → Direct connection URL → copy paste password → GitHub repo Settings → Secrets → Actions → new secret `BACKUP_DATABASE_URL`. Format: `postgresql://postgres.xxxxx:PASS@aws-0-region.compute.amazonaws.com:5432/postgres?sslmode=require`
2. **Verify backup workflow** — GitHub repo → Actions tab → "Backup Supabase DB" → Run workflow → branch main → wait ~3-5 min → download artifact, gunzip, verify SQL có `CREATE TABLE collections` etc.
3. **Live golden path test** — `pnpm dev` → login → /decks → "Nhập CSV" → upload sample CSV (gen offline qua Claude desktop hoặc paste 3-5 rows tay) → preview no errors → submit → land lesson page → "Sửa" inline edit 1 thẻ → save → review queue → "Hành động thẻ" add note + suspend → next session verify suspended thẻ ẩn
4. **Capture screenshots** cho README — login/dashboard/review/stats/import/edit. Add vào `docs/screenshots/` + reference trong README features section
5. **Tag v1.0.0** — sau khi (1-4) pass:
   ```bash
   git checkout main && git pull
   git merge dev --no-ff -m "release: v1.0.0"
   git tag -a v1.0.0 -m "v1.0.0 — Content lifecycle complete (CSV import + actions + editing + backup)"
   git push origin main --follow-tags
   ```
   GitHub UI → Releases → Draft new release với CHANGELOG (lấy từ TRACKER chunk 1-6)

### Next session — post v1.0.0

- **Content P1 batch** — gen 7 lessons offline → upload qua `/decks/import` → scale lên ~200 cards
- **Vercel deploy** — connect GitHub repo, env vars, preview deploys cho dev/fe/be PRs
- **Multi-def edit UI** — repeater pattern cho cards có >1 definition (defer từ chunk 5)
- **Lighthouse live audit** — Vercel preview URL + Chrome DevTools Lighthouse, capture score

---

## 2026-05-14 (khuya) — fe → dev — Claude Opus 4.7 (Tuần 6 chunk 5 card editing)

**Mục tiêu session**: Đóng nốt content lifecycle — sau CSV import (chunk 3) + suspend/notes (chunk 4), giờ cho user sửa thẳng word/IPA/meaning/example của card trong personal collection. Official cards remain immutable từ FE.

**Đã hoàn thành (commit `2c25386` trên fe → merge `2e292b6` lên dev → sync `e936434` xuống be).**

### Files thêm mới (4)

| Path                                          | Vai trò                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/vocab/card-edit-schema.ts`      | Pure Zod `cardEditInputSchema = csvRowSchema.extend({cardId: uuid})` + `cardToFormState(card)` projection DB → flat form initial values |
| `src/features/vocab/card-edit.ts`             | `'use server'`: `updateCard(input)` — ownership chain validation, patch cards row, preserve user_cards FSRS state                       |
| `src/features/vocab/card-edit-schema.test.ts` | 9 vitest cases — schema accepts/rejects + POS alias + CEFR coerce + cardToFormState projection edge cases                               |
| `src/components/decks/card-edit-form.tsx`     | Client inline form — 9 fields (Input/select/Textarea), useTransition + sonner, Save/Cancel                                              |

### Files edit (2)

- `src/components/decks/card-preview.tsx`: thêm `isEditable` prop (default false). Khi `open && isEditable` → "Sửa" button (Pencil); khi click → toggle sang form (lazy-loaded qua `next/dynamic` để defer ~25 kB bundle). `onSaved` + `onCancel` collapse về view mode
- `src/app/(app)/decks/[col]/[topic]/[lesson]/page.tsx`: derive `isEditable = !detail.collection.isOfficial && detail.collection.ownerId === userId`, pass xuống mỗi `<CardPreview>`

### Ownership chain validation

```ts
// 1 query, 3 joins — avoid 3 round-trips for chain check
db.select({ isOfficial, ownerId, slugs... })
  .from(cards).innerJoin(lessons).innerJoin(topics).innerJoin(collections)
  .where(eq(cards.id, cardId)).limit(1);

if (own.isOfficial || own.ownerId !== userId) return reject;
```

### Schema reuse strategy

`cardEditInputSchema` extends `csvRowSchema` từ chunk 3 → POS short aliases (`adj` → `adjective`) + CEFR uppercase coercion (`a2` → `A2`) hoạt động tự động. `csvRowToCardContent` cũng reuse trong server action để wrap flat row vào `definitions` jsonb shape — single source of truth cho "flat card input".

**Trade-off**: multi-definition cards (>1 def hoặc >1 example/def) bị collapse về first-only khi edit. Acceptable cho MVP vì all current cards seed với 1 def + 1-2 examples. Multi-def UI defer post-v1.0 (cần repeater pattern + reorder UX).

### Pattern reuse

- Lazy load form via `next/dynamic` — match CardActions (chunk 4) + CSV import form (chunk 3)
- Pure schema tách file: match `card-actions-schema.ts` (chunk 4) + `csv-schema.ts` (chunk 3)
- Server action shape `{ok, error}` — match enrollLesson/submitReview/updateUserCard
- Form: `useTransition` + sonner — match SettingsForm canonical

### Verify đã chạy

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 108/108 (4.55s) — 99 cũ + 9 mới
- `pnpm build` ✓ — `/decks/[col]/[topic]/[lesson]` **3 → 4.19 kB / 131 kB** (+1.2 kB Pencil icon + dynamic-import stub). `/review` 126 kB giữ nguyên. Khác routes không đổi

### Trạng thái nhánh

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `eb18493` | v0.2.0 (release tag, không đổi) |
| dev    | `0c796d8` | Tuần 6 chunk 5 + docs           |
| be     | `edf381b` | sync Tuần 6 chunk 5 + docs      |
| fe     | `cf77326` | sync Tuần 6 chunk 5 + docs      |

### Bỏ ngoài scope (defer)

- **Multi-definition / multi-example editing** — form chỉ 1 def + 1 example. User cần repeater UI nếu muốn richer cards. Defer post-v1.0
- **Edit synonyms/antonyms/collocations/etymology** — bỏ qua các field text[]/optional. CSV import cũng không support. Defer
- **Bulk edit** — sửa nhiều card cùng lúc. Cần selection UI. Defer
- **Edit history / audit log** — `content_version` column đã có sẵn nhưng chưa bump. Có thể sau v1.0 dùng cho undo
- **Optimistic UI** — hiện chờ server response mới collapse form. Acceptable vì update fast
- **Real-time validation** — input không live-validate (chỉ submit). Zod check ở server đủ cho MVP
- **Manual live test với Supabase** — chưa thử trên DB thật. User cần: login → import CSV → sửa 1 card → verify reflects trong /review queue

### Next session — Tuần 6 chunk 6 options (v1.0.0 prep)

1. **README.md update** — project tagline, tech stack, local setup (env + db push + rls + seed), screenshots placeholder, architecture diagram. Link blueprint. Branch model + contribution. License (MIT?)
2. **GitHub Actions cron daily DB backup** — `.github/workflows/backup.yml` chạy 02:00 UTC, pg_dump qua `DATABASE_URL` secret, upload artifact retention 14 days
3. **Live golden path test** — user chạy `pnpm dev`, đi qua full flow: login → /decks/import → upload CSV mẫu → review queue → suspend 1 → add note → edit content → verify changes persist → screenshot cho README
4. **Tag v1.0.0** — sau khi (1)+(2)+(3) xong, merge dev → main, tag `v1.0.0` với CHANGELOG entry
5. **Content P1 batch** — gen 7 lessons offline → upload qua `/decks/import` (test end-to-end với content scale lên ~200 cards)

---

## 2026-05-14 (tối) — fe → dev — Claude Opus 4.7 (Tuần 6 chunk 4 card actions)

**Mục tiêu session**: Mở khóa 2 backlog Tuần 6 (suspend/bury + personal notes) trong 1 chunk. Cả hai cùng dùng cột đã có sẵn trên `user_cards` (`notes`, `suspended`), không cần migration. Suspend đã được `getReviewQueue` filter từ Tuần 3 — chỉ cần surface toggle cho user.

**Đã hoàn thành (commit `fb55d2c` trên fe → merge `35e2f60` lên dev → sync `cbd75ba` xuống be).**

### Files thêm mới (4)

| Path                                      | Vai trò                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/srs/card-actions-schema.ts` | Pure Zod `updateUserCardSchema` + `MAX_NOTE_LENGTH`. Tách khỏi server file để test không pull DB client (pattern giống csv-schema)     |
| `src/features/srs/card-actions.ts`        | `'use server'`: `updateUserCard(input)` — patch notes/suspended trên user_cards, ownership filter `(userCardId, userId)`               |
| `src/features/srs/card-actions.test.ts`   | 8 vitest cases cho schema — both fields optional but ≥1 required, max length, '' clears, UUID validation                               |
| `src/components/review/card-actions.tsx`  | Client `<CardActions>` — `<details>` collapsible, textarea + Save button, suspend toggle row, sonner toast, reset state per userCardId |

### Files edit (4)

- `src/features/vocab/queries.ts`: thêm `getUserCardMetaByLesson(userId, lessonId) → Map<cardId, {hasNote, suspended}>` + type `UserCardMeta` export
- `src/components/decks/card-preview.tsx`: thêm optional `userMeta` prop → chip "Note" (sky NotebookPen) + "Tạm dừng" (amber PauseCircle) inline với word badge row, amber border khi suspended
- `src/components/review/review-session.tsx`: dynamic import `<CardActions>` với placeholder `<div h-9 animate-pulse>`, inject 1 lần dưới active card (key reset per userCardId)
- `src/app/(app)/decks/[col]/[topic]/[lesson]/page.tsx`: fetch `userMetaByCard` chỉ khi `userId && isEnrolled`, pass `userMetaByCard.get(card.id)` xuống mỗi `<CardPreview>`

### Integration approach

Inject `<CardActions>` 1 chỗ trong `<ReviewSession>` orchestrator (line ~195) thay vì sửa từng minigame card (~400-570 LOC mỗi cái). Trade-off: action panel hiện ngay khi card load (kể cả trước reveal) thay vì chỉ sau reveal. Acceptable vì collapsed by default — không distract.

Code split qua `next/dynamic`:

```ts
const CardActions = dynamic(() => import('./card-actions').then((m) => m.CardActions), {
  loading: () => <div className="h-9 animate-pulse rounded-md border ..." />,
});
```

Lý do: bundle CardActions ~23 kB (textarea + lucide icons + server-action proxy). Collapsed mặc định → đa số user không trigger ngay → defer download. `/review` First Load giữ **126 kB** (= chunk 2 baseline sau Lighthouse audit).

### Pattern reuse

- Form: `useTransition` + sonner toast — match settings-form/csv-import-form
- Server action shape: `{ok:true, data} | {ok:false, error}` — match enrollLesson/submitReview
- Pure schema extracted: pattern same as `csv-schema.ts` + `csv-parse.ts` (chunk 3)
- Ownership filter: `(userId, userCardId)` — match submitReview at `features/srs/actions.ts:87`

### Verify đã chạy

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 99/99 (3.83s) — 91 cũ + 8 mới
- `pnpm build` ✓ — `/review` **4.71 kB / 126 kB** (giữ nguyên chunk 2 baseline). `/decks/[col]/[topic]/[lesson]` **3 kB / 130 kB** (+0.5 kB cho lucide icons). Khác routes không đổi

### Trạng thái nhánh

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `eb18493` | v0.2.0 (release tag, không đổi) |
| dev    | `c9e0c36` | Tuần 6 chunk 4 + docs           |
| be     | `ec13bb7` | sync Tuần 6 chunk 4 + docs      |
| fe     | `2934a95` | sync Tuần 6 chunk 4 + docs      |

### Bỏ ngoài scope (defer)

- **Card content editing** (word/IPA/definitions/examples) cho cards trong personal collection user owned — defer chunk 5. Hiện chỉ CSV import là entry point thêm card; sau import muốn sửa thì re-upload với slug khác
- **Bulk suspend/unsuspend** — toggle 1-by-1 trong CardActions. Cần selection UI ở deck level → defer
- **Note search** — nếu user tích lũy nhiều notes, cần `/notes` page có search. Defer hậu MVP
- **Note rich-text** (markdown / `<mark>`) — hiện plain text. Defer
- **Suspend reason / re-activate date** — Anki có "Bury until tomorrow" tự động unsuspend. Hiện chỉ on/off manual
- **Audit log** notes change history — defer
- **Manual live test với Supabase real** — code-side mọi thứ pass nhưng chưa thử trên DB thật. User chạy `pnpm dev` → login → review queue → bấm "Hành động thẻ" → add note → suspend → verify next session ẩn thẻ

### Next session — Tuần 6 chunk 5 options

1. **Live test golden path Supabase real** — login, import CSV, review queue, suspend 1 thẻ, verify ẩn khỏi next session, add note, verify badge xuất hiện. Capture screenshots cho README
2. **Content P1 batch via CSV** — gen 7 lessons × 20 cards offline Claude desktop → format CSV → upload qua `/decks/import` (test end-to-end pipeline mới ship). Sau đó user dùng để study, suspend những thẻ đã thuộc, add notes
3. **Card editing UI** cho personal collection (mở khóa "fix typo without re-upload")
4. **README.md update** + chuẩn bị PR `dev → main` cho `v1.0.0`

---

## 2026-05-14 (chiều) — fe → dev — Claude Opus 4.7 (Tuần 6 chunk 3 CSV import UI)

**Mục tiêu session**: Ship `/decks/import` page — user upload CSV → tạo lesson cá nhân + cards + auto-enroll. Mở khóa "Scale content" Tuần 6 mà không phụ thuộc `pnpm seed` + git commit JSON.

**Đã hoàn thành (commit `8aeb0e4` trên fe → merge `14ac3d4` lên dev → sync `0d22bb4` xuống be).**

### Phương án multi-tenant

Không migration schema. Tận dụng `collections.ownerId` + `isOfficial=false` đã có từ Phase 0. Mỗi user upload → tạo per-user collection `personal-{userId.slice(0,8)}` với 1 topic `imported`; lesson + cards chain ownership qua FK. Xem **ADR-008** trong `docs/DECISIONS.md` cho trade-off đầy đủ (vs. cột `lessons.created_by_user_id` đã loại).

### Files thêm mới (9)

| Path                                         | Vai trò                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/features/vocab/csv-schema.ts`           | Zod `csvRowSchema` + `csvImportInputSchema`, POS short→full alias map, `slugify`, `RowError` type   |
| `src/features/vocab/csv-parse.ts`            | Pure `parseCsvRows(text)` qua papaparse — header check, BOM strip, dedup-in-file, per-row errors    |
| `src/features/vocab/csv-import.ts`           | `'use server'`: `previewCsv()` no-DB validate, `importCsvAsLesson()` Drizzle transaction            |
| `src/features/vocab/csv-parse.test.ts`       | 19 vitest cases — happy path, BOM, quoted commas, missing header, dedup, oversize, schemas, slugify |
| `src/components/ui/textarea.tsx`             | Shadcn-style textarea primitive (mono font, min-h 120px) cho paste CSV                              |
| `src/components/decks/csv-preview-table.tsx` | Pure client — file-level + row-level error groups, sticky-header table 50 rows visible              |
| `src/components/decks/csv-import-form.tsx`   | Client form 2-step (upload/paste → preview → submit) với debounced auto-preview 350ms               |
| `src/app/(app)/decks/import/page.tsx`        | RSC auth gate `getCurrentUserId() → redirect('/login')`, renders form                               |
| `src/app/(app)/decks/import/loading.tsx`     | Skeleton match form layout                                                                          |

### Files edit (5)

- `src/features/vocab/queries.ts`: thêm `listUserOwnedCollections(userId)`, refactor shared `withCounts(cols)` helper. `getCollectionBySlug` + `getLessonByPath` thêm tham số `userId` để filter `isOfficial OR ownerId=userId` (Drizzle bypass RLS → app enforce trong code, comment ghi rõ footgun cho route public sau này)
- `src/app/(app)/decks/page.tsx`: thêm "Nhập CSV" CTA top-right + section "Bộ của bạn" trên Section official nếu `owned.length > 0`, refactor `<CollectionGrid>` shared cho 2 variant (`official` badge xanh emerald, `owned` badge sky)
- `src/app/(app)/decks/[col]/page.tsx` + `[col]/[topic]/[lesson]/page.tsx`: pass `userId` xuống query (ownership gate)
- `package.json` + `pnpm-lock.yaml`: + `papaparse@5.4.1` (dep) + `@types/papaparse@5.3.15` (devDep), pin exact

### CSV spec

Header **required**, lowercase exact, order-tolerant. 9 cột: `word, ipa, pos, cefr, meaning_vi, meaning_en, example_en, example_vi, mnemonic_vi` (last optional).

- POS chấp nhận full (`noun, verb, adjective, ...`) hoặc short (`n, v, adj, adv, prep, conj, pron, interj, det, aux`) — alias map trong `csv-schema.ts:21-31`
- CEFR `{A1..C2}` case-insensitive (preprocess uppercase)
- Word regex `^[a-z][a-z\s'-]{0,79}$`
- Limits: max 200 rows × 256 KB
- Per-row Zod parse + dedup `Set<word>` — errors aggregate ở `RowError[]` (row, field, message)
- UTF-8 BOM auto-strip (line `csv-parse.ts:18`) cho Excel save

### Server flow

```
importCsvAsLesson FormData → csvImportInputSchema validate
  → requireUserId + ensureProfile
  → parseCsvRows re-validate (no trust client)
  → db.transaction:
       upsert collection personal-{userId.slice(0,8)}
       upsert topic 'imported'
       insert lesson (reject SLUG_TAKEN on (topic_id,slug) unique)
       bulk insert cards (source='csv-import')
       insert user_lessons + bulk user_cards (auto-enroll FSRS defaults)
  → revalidatePath /decks layout + /dashboard + /review
  → return { collectionSlug, topicSlug, lessonSlug, cardCount }
```

Client redirect: `router.push('/decks/{collectionSlug}/{topicSlug}/{lessonSlug}')` + sonner toast "Đã nhập N thẻ."

### Verify đã chạy

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 91/91 (4.54s) — 72 cũ + 19 mới
- `pnpm build` ✓ — `/decks/import` **25.5 kB / 152 kB** First Load. Khác routes không đổi

### Trạng thái nhánh

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `eb18493` | v0.2.0 (release tag, không đổi) |
| dev    | `14ac3d4` | Tuần 6 chunk 3 CSV import       |
| be     | `0d22bb4` | sync Tuần 6 chunk 3             |
| fe     | `8aeb0e4` | base Tuần 6 chunk 3             |

### Bỏ ngoài scope (defer)

- **Live test với real Supabase** — code-side mọi thứ pass, nhưng chưa upload CSV thực tế qua dev server. User chạy `pnpm dev` → login → `/decks/import` → upload sample 5 rows → verify lesson tạo + auto-enroll
- **JSON paste tab** — alternative cho `lessonContentSchema` (multi-definition + multi-example). Defer chunk 4
- **Overwrite cùng slug** — hiện reject `SLUG_TAKEN`. UI overwrite/rename modal defer
- **CSV template download** — nút "Tải mẫu CSV" cho user. Hiện chỉ có "Dùng mẫu thử" load inline 1 row
- **RLS tightening cho topics/lessons/cards** — current `USING (true)` permissive. Defense-in-depth defer chunk 4. Comment cảnh báo footgun đã có trong `queries.ts`
- **Drag-drop file input** — hiện native click → file picker đủ MVP
- **Cross-user E2E test** — yêu cầu 2 account test, defer khi có Playwright setup

### Next session — Tuần 6 chunk 4 options

1. **Live Lighthouse run + iterate** — user chạy `pnpm build && pnpm start` local, Lighthouse Chrome panel, capture score `/decks/import` (route mới, chưa tối ưu)
2. **Content P1 batch via CSV import** — gen 7 lessons × 20 cards offline Claude desktop free → format CSV → import qua UI mới ship. End-to-end content scale
3. **Card editing UI + personal notes** — inline edit, `user_cards.notes` đã có cột (schema.ts:176)
4. **README.md update** + `v1.0.0` prep — sau khi content scale + manual test golden path

---

## 2026-05-14 (sáng) — fe → dev — Claude Opus 4.7 (Tuần 6 chunk 2 Lighthouse audit fixes)

**Mục tiêu session**: Code-side fixes cho Lighthouse audit — perf + a11y + SEO. Không chạy được Lighthouse CLI thực tế (cần dev server + headless Chrome setup), nên focus vào các criteria phổ biến mà Lighthouse check và fix được từ source code.

**Đã hoàn thành (commit `1aec7ab` trên fe → merge `da3a05b` lên dev → sync `b50fc5d` xuống be).**

### Audit findings

| Category    | Issue                                                  | Fix                                                     |
| ----------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Perf        | `/review` First Load 176 kB (4 minigame cards eager)   | Code split via `next/dynamic` → 126 kB (−50 kB)         |
| A11y        | No skip-to-content link cho keyboard/screen reader     | `(app)/layout.tsx` thêm `<a sr-only focus:not-sr-only>` |
| A11y        | 6 chỗ `text-xs text-zinc-400` fail WCAG AA Normal      | Bump zinc-400 → zinc-500 (5.42:1 ≥ 4.5)                 |
| SEO         | Pages không có `<title>` riêng → tab luôn show default | Per-page `metadata.title` cho 6 pages                   |
| OK (no fix) | Root `<html lang="vi">` đã có                          | —                                                       |
| OK (no fix) | Heading hierarchy h1→h2→h3 đã chuẩn 9 pages            | —                                                       |
| OK (no fix) | Icon-only buttons đã có `aria-label` (11 files)        | —                                                       |
| OK (no fix) | Form inputs đã có `<Label htmlFor>` (settings, login)  | —                                                       |
| OK (no fix) | Geist fonts auto font-display: swap qua `geist/font`   | —                                                       |
| OK (no fix) | Stats SVG charts dùng viewBox + `w-full` scale         | —                                                       |

### Files edit (12)

**Code split:**

- `src/components/review/review-session.tsx`: thay 5 static imports (`ClozeCard`, `MCQCard`, `TypingCard`, `ListeningCard`, `FlashcardFlip`) bằng `dynamic(() => import('./xxx').then((m) => m.XxxCard))`. `CardLoading` placeholder = `<div h-[320px] animate-pulse rounded-xl border bg-zinc-50>`. Mode picker + orchestrator stay eager. Cloze (default mode) cũng lazy — chấp nhận skeleton flash ~50-100ms lần đầu render mode

**A11y:**

- `src/app/(app)/layout.tsx`: prepend skip link `<a href="#main-content">` với `sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:ring-2 focus:ring-sky-400`. `<main id="main-content">`. Tab key đầu trang reveal link, Enter skip
- `src/components/review/cloze-card.tsx`: line 345 `text-zinc-400` → `text-zinc-500` (input counter)
- `src/components/review/typing-card.tsx`: line 341 same
- `src/components/review/listening-card.tsx`: line 419 same
- `src/components/review/flashcard-flip.tsx`: line 57 "Bấm Space hoặc click để lật" same
- `src/app/(app)/review/page.tsx`: line 35 empty state "Đã học hôm nay: X / Y thẻ mới" same

**SEO:**

- 6 pages: `export const metadata: Metadata = { title: '...' }` — Dashboard / Ôn tập / Decks / Thống kê / Cài đặt / Đăng nhập. Root layout title template `'%s · EnStudy Hub'` (đã set từ Phase 0) tự động ghép → tab hiện "Dashboard · EnStudy Hub" etc.

### Verify đã chạy

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 72/72 (8.40s)
- `pnpm build` ✓ — **bundle delta:**

| Route        | Before     | After      | Δ          |
| ------------ | ---------- | ---------- | ---------- |
| `/review`    | 47.5 / 176 | 4.62 / 126 | **−50 kB** |
| `/login`     | 3.03 / 129 | 3.03 / 130 | +1 kB      |
| `/dashboard` | 184 / 109  | 184 / 109  | 0          |
| `/stats`     | 184 / 109  | 184 / 109  | 0          |
| `/settings`  | 5.26 / 123 | 5.26 / 123 | 0          |
| Shared       | 99.8       | 99.9       | +0.1       |

(Sizes: route-specific kB / First Load kB)

### Trạng thái nhánh

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `eb18493` | v0.2.0 (release tag, không đổi) |
| dev    | `da3a05b` | Tuần 6 chunk 2 Lighthouse       |
| be     | `b50fc5d` | sync Tuần 6 chunk 2 Lighthouse  |
| fe     | `1aec7ab` | base Tuần 6 chunk 2 Lighthouse  |

### Bỏ ngoài scope (defer)

- **Live Lighthouse run** — cần `pnpm start` (production server) + Chrome DevTools Lighthouse panel hoặc `lighthouse` npm CLI. User chạy local sau khi merge:

  ```powershell
  pnpm build
  pnpm start  # cổng 3000
  # Chrome → DevTools → Lighthouse → Mobile + Performance/Accessibility/Best Practices/SEO
  ```

  Mục tiêu > 90 mỗi category. Test: `/login` (public, dễ nhất), `/dashboard`, `/review`, `/stats`.

- **`/review/summary` metadata** — page là `'use client'`, Next App Router không cho export metadata từ client. Wrap server parent hoặc dùng `<title>` trong client — defer
- **Mode picker labels mobile rút ngắn** — vẫn wrap 2 hàng trên 375px, acceptable
- **`<picture>` / `<Image>`** — chưa có ảnh trong app, không cần optimize
- **Service Worker / PWA** — defer hậu MVP
- **Color contrast advanced** — 22 file dùng `text-zinc-400` nhưng phần lớn là `dark:text-zinc-400` (trên bg zinc-950 = high contrast). 6 chỗ light-mode body text đã fix. Còn `text-zinc-400` trong SVG slot letters / badges trên bg-zinc-100 — defer (ratio close 4.5:1, nhỏ)
- **Console errors / Best Practices** — chưa audit. Common Next 15 RC: typedRoutes warnings, hydration mismatches — cần dev server + DevTools console

### Next session — Tuần 6 chunk 3 options

1. **Live Lighthouse run + iterate** — user chạy production server local, mở Lighthouse, capture score, fix issues lộ ra
2. **CSV import UI** — `/decks/import` page, drag-drop, preview, bulk enroll. ~200 line FE + 80 BE
3. **Content P1 batch** — gen 7 lesson × 20 cards offline qua Claude desktop. Seed Supabase
4. **README.md update** + `v1.0.0` prep — sau khi content scale + Lighthouse pass

---

## 2026-05-13 (khuya) — fe → dev — Claude Opus 4.7 (Tuần 6 chunk 1 mobile responsive QA)

**Mục tiêu session**: Mở Tuần 6 với chunk 1 = mobile responsive QA tại viewport 375px (iPhone SE). Audit toàn bộ routes + fix critical issues.

**Đã hoàn thành (commit `22c79d7` trên fe → merge `c932e9b` lên dev → sync `691bab1` xuống be).**

**Audit findings (static review):**

| Severity | Issue                                                  | Fix                                              |
| -------- | ------------------------------------------------------ | ------------------------------------------------ |
| Critical | Sidebar `hidden md:flex`, topbar không có hamburger    | Add `<MobileNav>` drawer trong topbar            |
| High     | Page padding `px-6` quá đậm trên 375px (327px content) | Mobile `px-4 py-5 sm:px-6 sm:py-6`               |
| High     | 4 minigame cards inner `p-6` (24px) chiếm chỗ          | `p-4 sm:p-6` / reveal `p-4 sm:p-5`               |
| High     | Stats `grid sm:grid-cols-4` stack 4 cards dọc mobile   | `grid-cols-2 sm:grid-cols-4`                     |
| Medium   | Settings submit row wrap không đẹp                     | Stack helper text mobile: `flex-col sm:flex-row` |
| Low      | Stats SVG charts đã `w-full` viewBox                   | Không cần đổi                                    |
| Low      | Heatmap đã có `overflow-x-auto` wrapper                | Không cần đổi                                    |
| Low      | MCQ choices đã `grid-cols-1 sm:grid-cols-2`            | Không cần đổi                                    |

**Files mới (2):**

- `src/components/layout/nav-items.ts` (~20 line): extract `NAV_ITEMS` readonly array (5 items: Dashboard/Ôn tập/Decks/Thống kê/Cài đặt) dùng chung sidebar + mobile-nav. Drop duplication.
- `src/components/layout/mobile-nav.tsx` (~100 line, client): hamburger button `md:hidden` trong topbar. Open state via `useState` (component-local — không cần global store vì topbar là client component duy nhất chứa). Open → render `role="dialog" aria-modal` overlay:
  - Backdrop: full-screen `bg-zinc-950/40 backdrop-blur-sm` click → close
  - Panel: slide-in left `w-64 max-w-[85vw]` với logo + close button (X) + 5 nav links
  - Escape key đóng. `document.body.style.overflow = 'hidden'` lock scroll khi open.
  - Pathname effect auto-close khi điều hướng — tránh stale open state sau Link click

**Files edit (9):**

- `src/components/layout/sidebar.tsx`: drop inline `NAV` array, import `NAV_ITEMS` từ shared file
- `src/components/layout/topbar.tsx`: prepend `<MobileNav />`. Header `gap-3 px-4` → `gap-2 px-3 sm:gap-3 sm:px-4` (giảm padding mobile cho hamburger button thêm room)
- `src/app/(app)/layout.tsx`: `main className` `px-6 py-6` → `px-4 py-5 sm:px-6 sm:py-6`
- `src/components/review/cloze-card.tsx`: card outer `p-6 → p-4 sm:p-6`, reveal panel `p-5 → p-4 sm:p-5`
- `src/components/review/typing-card.tsx`: cùng pattern
- `src/components/review/listening-card.tsx`: cùng pattern
- `src/components/review/mcq-card.tsx`: card outer `p-6 → p-4 sm:p-6` (không có reveal panel riêng)
- `src/app/(app)/stats/page.tsx`: MetricCard grid `grid gap-3 sm:grid-cols-4` → `grid grid-cols-2 gap-3 sm:grid-cols-4`
- `src/components/settings/settings-form.tsx`: submit row `flex items-center gap-3` → `flex flex-col items-start gap-3 sm:flex-row sm:items-center`

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 72/72 (4.76s)
- `pnpm build` ✓
  - `/review` 47.5 kB / **176 kB First Load** (no change)
  - `/settings` 5.26 kB / 123 kB (+0.01 kB)
  - `/stats` 184 B / 109 kB (no change — Tailwind class only)
  - MobileNav vào shared chunk topbar — `/dashboard` 184 B / 109 kB (no change)

**Trạng thái nhánh:**

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `eb18493` | v0.2.0 (release tag, không đổi) |
| dev    | `c932e9b` | Tuần 6 chunk 1 mobile QA        |
| be     | `691bab1` | sync Tuần 6 chunk 1 mobile QA   |
| fe     | `22c79d7` | base Tuần 6 chunk 1 mobile QA   |

**Bỏ ngoài scope (defer Tuần 6 chunk sau):**

- Lighthouse audit thật trên dev server > 90 perf + a11y (cần `pnpm dev` + Chrome DevTools, mục tiêu chunk riêng)
- Mobile nav animation (hiện overlay render đột ngột — có thể add Framer Motion slide-in transition, nice-to-have)
- Mode picker labels rút ngắn mobile (hiện 4 buttons wrap 2 hàng trên 375px do "Trắc nghiệm" dài, vẫn functional — defer)
- Counter row trong `review-session.tsx` overflow kbd hints với mode Listening dài (acceptable wrap, không critical)
- Topbar TODO entries trong DropdownMenu (email hiển thị + logout) — không liên quan mobile

**Next session — Tuần 6 chunk 2 options:**

1. **Lighthouse audit + perf fixes** — chạy DevTools throttled CPU 4x, target > 90 a11y + perf. Có thể cần: image optimization (chưa có ảnh), code-split lazy load 4 minigame components (giảm `/review` 176 kB), font-display optimization
2. **CSV import UI** — `/decks/import` page, drag-drop CSV, preview rows, bulk enroll. Đụng vào server action mới. ~200 line FE + 80 line BE
3. **Content P1 batch** — gen 7 lesson × 20 cards = 140 từ qua Claude desktop (offline). Seed Supabase. Mở rộng wordlist coverage A2-B1
4. **Card editing UI** — `/decks/[col]/[topic]/[lesson]/[cardId]/edit` admin form. Đụng vào RLS update policy

**Open todo:**

- [ ] User test mobile drawer thực tế trên 375px (Chrome DevTools device toolbar) — golden path: tap hamburger → tap link → drawer auto-close → page nav
- [ ] User bật branch protection GitHub trên `main` (Settings UI)

---

## 2026-05-13 (tối, ship) — release `v0.2.0` — Claude Opus 4.7

**Mục tiêu session**: Đóng gói Tuần 4 + Tuần 5 thành 1 release tag. User vừa test xong 4 minigame modes → chốt ship trước khi mở Tuần 6.

**Trạng thái nhánh sau release:**

| Branch | SHA       | Note                                                      |
| ------ | --------- | --------------------------------------------------------- |
| main   | `eb18493` | release v0.2.0 — Dashboard + Stats + Settings + Minigames |
| dev    | `545c3eb` | sync main → dev (release merge + prettier fixes)          |
| be     | `070f9ee` | bulk catch-up Tuần 5 + post-release sync                  |
| fe     | `b0e723f` | post-release sync                                         |
| tag    | `v0.2.0`  | annotated, pushed origin                                  |

**Các bước đã chạy (theo plan `test-xong-nh-ng-giggly-lovelace.md`):**

1. **Phase 1 — Bulk sync `be ← dev`**: `git merge dev --no-ff` trên be (commit `8af8e17`). 0 conflict (Tuần 5 toàn FE + queue.ts đã tương thích). Push origin be.
2. **Phase 2 — Gates trên dev**:
   - `pnpm typecheck` ✓ 0 errors
   - `pnpm lint` ✓ 0 warnings
   - `pnpm test` ✓ 72/72 (vitest run, 5 files, 4.48s)
   - `pnpm build` ✓ — bundle sizes:
     - `/review` 47.5 kB / **176 kB First Load** (4 minigame components inline)
     - `/dashboard` 184 B / 109 kB (RSC pure)
     - `/stats` 184 B / 109 kB (RSC pure)
     - `/settings` 5.25 kB / 123 kB
     - `/login` 3.03 kB / 129 kB
     - Shared chunks 99.8 kB
3. **Phase 3 — Merge `dev → main` local + push**:
   - `git checkout main && git merge dev --no-ff` → 2 conflict
   - `src/app/(app)/settings/page.tsx`: HEAD stub Tuần 1 ("TODO Tuần 4") vs dev impl đầy đủ → take dev
   - `docs/CONTENT_PIPELINE.md`: HEAD bảng tiến độ TODO vs dev có entry family 5/20 → take dev
   - Commit `eb18493` (commit message `merge: dev -> main (release v0.2.0 — ...)` — phải dùng `merge:` thay `release:` vì commitlint không có `release` trong type-enum). Body lines < 100 char để qua `body-max-line-length` rule
   - User authorize push origin main (classifier chặn AI tự push default branch — user gõ `! git push origin main`)
4. **Phase 4 — Tag `v0.2.0`**: `git tag -a v0.2.0 -m "..."` + `git push origin v0.2.0` (no classifier block). 2 tags now: `v0.1.0-foundation`, `v0.2.0`.
5. **Phase 5 — Post-release sync**:
   - `dev`: `git merge main --no-ff` (commit `545c3eb`) — pull release merge commit + prettier auto-formatting (14 files changed) back vào dev
   - `be`: `git merge dev --no-ff` (commit `070f9ee`)
   - `fe`: `git merge dev --no-ff` (commit `b0e723f`)
6. **Phase 6 — Docs update** (commit này): SYNC.md status table + 5 log entries mới, TRACKER.md "Đã ship v0.2.0", HANDOFF.md prepend entry này.

**Note prettier auto-format**: husky pre-commit hook chạy `lint-staged` (prettier --write + eslint --fix) trên merge `dev → main`. 14 file content/blueprint/docs có khoảng trắng tinh chỉnh → vào merge commit, sau đó sync về dev/be/fe. Không thay đổi behavior, chỉ formatting.

**Verify final state:**

- `git rev-list --left-right --count main...dev` → `0 1` (dev có 1 sync merge commit phía trên main)
- `git rev-list --left-right --count main...be` → `0 6`
- `git rev-list --left-right --count main...fe` → `0 2`
- main fully reachable từ mọi downstream branch ✓

**Next session — Tuần 6 kickoff:**

Backlog ưu tiên cao (theo `TRACKER.md` Tuần 6):

1. **Content scale**: gen P1 batch (7 lesson × 20 cards = 140) qua Claude desktop → seed Supabase. Xem `docs/CONTENT_PLAN.md` Phần 5.
2. **CSV import UI**: trang `/decks/import` hoặc nút trong sidebar. User upload CSV/JSON → preview → enroll bulk.
3. **Mobile responsive QA**: 4 minigame layouts trên 375px (iPhone SE). Đặc biệt MCQ (4 choices) + Listening (speaker button + slots) + Cloze (sentence + slots).
4. **Lighthouse audit** target > 90 perf + a11y.
5. **README.md update** — hiện tại còn boilerplate Next.js scaffold.

Có thể defer:

- Card editing UI (admin tools, không urgent cho personal use)
- Suspend/bury cards
- Personal notes per card
- GitHub Actions cron daily DB backup
- Refactor `<WordTypingArea>` abstraction (3 cards share ~70% state machine — chỉ cleanup khi add mode 5+)

**Open todo (xem TRACKER.md):**

- [ ] User bật branch protection GitHub trên `main` (require PR) — Settings UI
- [ ] User review `docs/CONTENT_REPORT.md` quyết định pick IPA style (Oxford vs dictionaryapi)
- [ ] User gen P1 batch content offline

---

## 2026-05-13 (tối, tiếp theo 3) — fe → dev — Claude Opus 4.7 (Tuần 5 chunk 4 polish — ĐÓNG Tuần 5)

**Mục tiêu session**: Chunk 4 = polish + đóng Tuần 5. Toast milestones (streak, daily limit), skeleton update, empty state cải thiện.

**Đã hoàn thành (commit `e794630` trên fe → merge `73f6b56` lên dev). Chưa sync xuống `be` (sẽ sync bulk khi prep v0.2.0 release).**

**Files edit (3):**

- `src/app/(app)/review/page.tsx`:
  - `Promise.all([getReviewQueue, getStreak])` parallel fetch
  - Derive `isFirstReviewToday = streak.lastActiveDate === null || streak.lastActiveDate < today` (today = `todayKey(new Date(), streak.timezone)`)
  - Pass mới 4 props vào `<ReviewSession>`: `newLearnedToday`, `dailyNewLimit`, `isFirstReviewToday`, `currentStreak`
  - Empty state polished: 2 CTA buttons (BookOpen Xem decks / link Về dashboard) thay inline link đơn

- `src/components/review/review-session.tsx`:
  - Signature mới: `{ initialQueue, newLearnedToday, dailyNewLimit, isFirstReviewToday, currentStreak }`
  - 3 refs cho dedupe milestone: `streakToastedRef`, `limitToastedRef`, `newCardsThisSessionRef`
  - `handleRate(grade)`:
    - Capture `cardBefore = queue[currentIndex]` + `wasNewCard = state==='new'` TRƯỚC khi gọi `rate()` (store sẽ advance)
    - `await rate(grade)` → return early nếu fail (toast error giữ nguyên)
    - **Milestone 1 (streak start of day)**: `if (!streakToastedRef.current && isFirstReviewToday)` → `toast.success('🔥 Streak ${currentStreak+1} ngày! Bắt đầu ngày học mới.')` + set ref
    - **Milestone 2 (daily new limit)**: `if (wasNewCard) newCardsThisSessionRef.current++` → kiểm tra `newLearnedToday + newCardsThisSession >= dailyNewLimit` → `toast.info('🎯 Đã đạt mục tiêu N thẻ mới hôm nay', { description: 'thẻ mới sẽ mở lại ngày mai' })` + set ref
  - Refs (KHÔNG state) vì 2 lý do: (a) write-once flag không cần render churn, (b) không serialize qua Zustand persist

- `src/app/(app)/review/loading.tsx`: skeleton update
  - Thêm mode picker pill row (4 placeholder rounded-md)
  - Bỏ rating row (4 buttons grid) vì các mode mới auto-grade, không hiển thị rating buttons mặc định ở phase typing
  - Card area giữ nguyên `h-[320px] rounded-xl`

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 72/72 (KHÔNG thêm test — toast triggers là deterministic từ server props, manual test ok)
- `pnpm dev` ✓ vẫn live

**Trạng thái nhánh:**

| Branch | SHA       | Note                                                 |
| ------ | --------- | ---------------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                        |
| dev    | `73f6b56` | Tuần 5 chunk 4 polish — Tuần 5 ĐÓNG, sẵn ship v0.2.0 |
| be     | `eb6ec8f` | pending bulk sync Tuần 5 ch1..4 trước khi release    |
| fe     | `e794630` | base Tuần 5 chunk 4 polish                           |

**TUẦN 5 ĐÃ ĐÓNG — sẵn ship `dev → main` tag `v0.2.0`:**

Hoàn thành full Tuần 5:

- ✅ Chunk 1: Mode Picker scaffold + MCQ mode (4-choice) + distractorPool BE + tests +23
- ✅ Chunk 2: Typing-from-definition mode (TypingCard reuse cloze grade heuristic)
- ✅ Chunk 3: Listening mode (Web Speech API auto-play + Space replay + no-support fallback)
- ✅ Chunk 4: Toast milestones (streak start-of-day + daily new-limit) + skeleton update + empty state CTA

**4 minigame modes giờ live**:

1. **Cloze** (Tuần 3): sentence với blank, gõ word từ context
2. **Trắc nghiệm/MCQ** (Tuần 5 ch1): show word + IPA, 4 nghĩa VN
3. **Gõ nghĩa/Typing** (Tuần 5 ch2): show meaning_vi, gõ word
4. **Nghe/Listening** (Tuần 5 ch3): TTS phát word, gõ word

**Pre-release v0.2.0 checklist (next session):**

1. `git checkout be && git merge --no-ff dev -m "sync: dev -> be (Tuan 5 closed)"` — bulk catch up
2. `pnpm build` production verify — đảm bảo build pass, đo bundle size /review (predict ~150-180kB First Load do 4 minigame components share framer-motion + lucide-react)
3. Manual E2E full lap qua 4 modes: login → /review → switch Cloze→MCQ→Typing→Listening, mỗi mode submit 1-2 thẻ → /review/summary → /dashboard streak update
4. SQL spot check: `SELECT review_type, COUNT(*) FROM review_logs GROUP BY review_type` — phải có 'typing' + 'mcq' + 'listening' rows
5. Toast verify: F5 trang đã review → second time KHÔNG toast streak (vì `isFirstReviewToday` giờ false). Daily limit toast fire nếu enroll deck mới + ôn đủ N thẻ mới
6. PR `dev → main` qua GitHub UI, self-review, merge với `--no-ff`, tag `v0.2.0` "Dashboard + Stats + Settings + Minigames"

**Pending cho Tuần 6**:

- Scale content: gen 500-1000 cards (P1 + P2 batches qua Claude desktop)
- CSV import UI
- Card editing UI (admin tools cho personal use)
- Suspend/bury cards
- Personal notes per card (textarea trong card detail)
- Mobile responsive QA — minigame layouts cần test trên 375px screen
- Lighthouse > 90 (perf + a11y)
- GitHub Actions: cron daily DB backup (`pg_dump` qua scheduled workflow)
- README.md update
- Tag `v1.0.0`

**Refactor nợ kỹ thuật**: 3 cards (Cloze/Typing/Listening) share ~70% state machine. Tuần 6 cleanup có thể abstract `<WordTypingArea>` — defer, không urgency.

---

## 2026-05-13 (tối, tiếp theo 2) — fe → dev — Claude Opus 4.7 (Tuần 5 chunk 3: Listening mode)

**Mục tiêu session**: Chunk 3 = mode Nghe — auto-phát word qua Web Speech API, user gõ lại theo audio cue (giống dictation). Cùng tốc độ với Chunk 1+2 sáng nay.

**Đã hoàn thành (commit `063abca` trên fe → merge `68bec35` lên dev). Chưa sync xuống `be` (defer đến khi đóng Tuần 5).**

**File mới (1):**

- `src/components/review/listening-card.tsx` (~570 line, client): ListeningCard component
  - Top section: label "Nghe phát âm", nút tròn 20x20 (Volume2 icon) ở giữa, dưới là kbd hint "Space để phát lại" + pos/cefr badge. Nút có Framer Motion `scale` pulse animation 0.8s loop khi `playing=true`
  - State `playing: boolean` — set true khi gọi `playWord`, auto-clear sau heuristic `min(2200, max(500, word.length * 250))` ms vì Web Speech `'end'` event không fire reliable trên Firefox/Safari
  - `playWord` callback gọi `speakWord(word)` + set playing + return cleanup
  - Auto-play on mount: `useEffect([card.id])` check support → play hoặc setSupported(false) + toast warning
  - Unlock cũng replay audio (user nghe word kèm reveal panel)
  - Keyboard handler: trong `phase==='typing'` Space = replay (override default), Esc/?/Backspace/letter giống Typing. Trong `phase==='unlocked'` Space = submit derived grade (giữ behavior Cloze/Typing)
  - **No-support fallback**: nếu `'speechSynthesis' in window === false` → `setSupported(false)`, `toast.warning("Trình duyệt không hỗ trợ phát âm. Xem chính tả ở dưới rồi gõ lại để luyện.")`, render VolumeX icon disabled + show word trong mono badge `<div className="bg-zinc-100 font-mono">{word}</div>` để card không deadlock
  - Slots full-hidden qua `fullHiddenMask(word)` (local helper)
  - Unlock reveal: word + IPA + Volume2 nút (replay), full firstDef (en + vi), 2 examples, mnemonic, 2s countdown bar, 1-4 override grade
  - Reuse `gradeFromCloze` + `speakWord` + `MaskSlot` từ `cloze-utils.ts`

**Files edit:**

- `src/components/review/mode-picker.tsx`: `{ id: 'listening', enabled: true }` (drop hint "Sắp có"). Tất cả 4 mode giờ live
- `src/components/review/review-session.tsx`:
  - Import `<ListeningCard>`
  - `effectiveMode` rule mở rộng: `(cloze OR typing OR listening) + multi-word → 'multiword-fallback'`
  - Branch render: thêm nhánh `effectiveMode === 'listening' → <ListeningCard key={listening-${id}}>`
  - Hint text top: "Space phát lại · gõ từ · ? hint" cho mode listening

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 72/72 (KHÔNG thêm test mới — Listening reuse 100% logic đã test)
- `pnpm dev` chưa stop, vẫn live

**Trạng thái nhánh:**

| Branch | SHA       | Note                                 |
| ------ | --------- | ------------------------------------ |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)        |
| dev    | `68bec35` | Tuần 5 chunk 3 Listening mode merged |
| be     | `eb6ec8f` | chưa sync (defer đến hết Tuần 5)     |
| fe     | `063abca` | base Tuần 5 chunk 3                  |

**Manual E2E checklist mới (browser):**

1. `pnpm dev` → login → `/review` (đã có queue)
2. Click **Nghe** trong picker → ListeningCard render
3. TTS auto-play ngay → speaker icon pulse trong 1-2s
4. Bấm Space → replay
5. Gõ word theo audio cue → mỗi letter đúng → slot fill, sai → shake + mistake counter
6. Word complete → unlock phase: word + IPA + replay audio, full meaning + examples + mnemonic, auto-submit Good sau 2s
7. Bấm `?` để hint (hintsUsed++) hoặc Esc để give-up (gaveUp → Again)
8. Test no-speech: tạm thời disable speechSynthesis trong DevTools (`speechSynthesis = undefined`) hoặc test Firefox với TTS off → toast warning hiện + speaker icon đổi sang VolumeX disabled + word hiện trong mono badge dưới
9. SQL check: `SELECT review_type, rating FROM review_logs ORDER BY reviewed_at DESC LIMIT 5;` → thấy `review_type='listening'`
10. Tuần 5 đến đây có **3 minigame** (MCQ, Typing, Listening) + **Cloze** (Tuần 3) — đủ 4 mode trong blueprint Tuần 5

**Refactor nợ kỹ thuật (sau Tuần 5)**:
3 cards (ClozeCard, TypingCard, ListeningCard) share ~70% state machine + keyboard + unlock panel. Có thể abstract thành `<WordTypingArea>` với props customizable cho prompt area (sentence-blank / definition / audio button). **Defer** — Chunk 4 (polish) hoặc Tuần 6 cleanup. Hiện không urgency vì 3 file ổn định, bug-free trong 1 session.

**Pending cho Chunk 4 — Polish (chunk cuối Tuần 5)**:

- Toast milestones:
  - Streak +1 khi user complete review đầu tiên trong ngày (kiểm tra `lastActiveDate` qua `getStreak`)
  - Lesson complete khi tất cả cards trong 1 lesson đạt `state='review'` (mature)
  - Daily limit reached khi `newLearnedToday >= dailyNewLimit`
- Skeleton screens: `app/(app)/review/loading.tsx` hiện simple — cải thiện match new layout (mode picker pill + card section)
- Empty states: `/review` empty state đã có (link `/decks`). `/dashboard` enrolled list có. Có thể add suggested deck link trong `/review` empty state khi user chưa enroll gì
- Skeleton cho card area khi đổi mode đột ngột (Suspense boundary?)

**Pending cho v0.2.0 release**: vẫn defer đến hết Tuần 5. Khi xong Chunk 4 → tag `v0.2.0` "Dashboard + Stats + Settings + Minigames".

---

## 2026-05-13 (tối, tiếp theo) — fe → dev — Claude Opus 4.7 (Tuần 5 chunk 2: Typing-from-definition)

**Mục tiêu session**: Mở Chunk 2 của Tuần 5 ngay sau khi Chunk 1 ship — minigame thứ 2 = gõ word từ definition (khác Cloze: Cloze có sentence với blank, Typing chỉ có meaning_vi làm cue).

**Đã hoàn thành (commit `fe1861a` trên fe → merge `b4e062d` lên dev). Chưa sync xuống `be` (defer đến khi đóng Tuần 5).**

**File mới (1):**

- `src/components/review/typing-card.tsx` (~485 line, client): TypingCard component
  - Top section: `<div className="text-center">` với "Nghĩa tiếng Việt" label + meaning_vi 2xl semibold + meaning_en italic xs + pos/cefr badge
  - Slots: `<TypingSlots>` đặt giữa với shake wrapper, full-hidden mask qua `fullHiddenMask(word)` — KHÁC Cloze ở chỗ Cloze A1/A2 cho hint vowels/first-last, Typing thì ép hidden hoàn toàn (vì không có sentence context để "cheat")
  - State machine giống Cloze: `phase: 'typing' | 'unlocked'`, `input`, `hintsUsed`, `mistakes`, `gaveUp`, `shakeKey`, `mountedAtRef`, `submittedRef`
  - Doc-level keydown handler giống Cloze (đoạn typing): letter match → advance, mismatch → mistake + shake, `?` hint, Esc give-up, Backspace xóa, auto-fill non-letter chars (apostrophe/hyphen)
  - Unlock reveal panel: glassmorphism với word + IPA + Volume2 → speakWord, 2 examples, mnemonic, 2s countdown bar, 1-4 override grade
  - Reuse từ `cloze-utils.ts`: `gradeFromCloze` (heuristic), `speakWord` (TTS), `MaskSlot` (type) — KHÔNG duplicate grade logic

**Files edit:**

- `src/components/review/mode-picker.tsx`: `{ id: 'typing', enabled: true }` (drop hint)
- `src/components/review/review-session.tsx`:
  - Import `<TypingCard>`
  - `effectiveMode` logic: `(cloze OR typing) + multi-word → 'multiword-fallback'` (đổi tên từ `cloze-multiword`)
  - Branch render: thêm nhánh `effectiveMode === 'typing' → <TypingCard key={typing-${id}}>` (key prefix khác nhau giúp React rebuild khi đổi mode)
  - Hint text: "gõ từ từ nghĩa · ? hint · Esc bỏ qua" cho mode typing
- `commitlint.config.cjs`: add `'review'` vào `scope-enum` (Chunk 1 commit warn vì `feat(review):`)

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 72/72 (KHÔNG thêm test mới — TypingCard reuse `gradeFromCloze` đã có 7 tests trong `cloze-utils.test.ts`, không lib mới)
- `pnpm dev` chưa stop, dev server vẫn live từ session trước

**Trạng thái nhánh:**

| Branch | SHA       | Note                                  |
| ------ | --------- | ------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)         |
| dev    | `b4e062d` | Tuần 5 chunk 2 typing-from-def merged |
| be     | `eb6ec8f` | chưa sync (defer đến hết Tuần 5)      |
| fe     | `fe1861a` | base Tuần 5 chunk 2                   |

**Manual E2E checklist mới (browser):**

1. `pnpm dev` → login → `/review` (đã có queue)
2. Click **Gõ nghĩa** trong picker → card đổi sang TypingCard
3. Top hiện meaning_vi to (vd: "con mèo") + meaning_en italic + pos/cefr badge
4. Slots `[_ _ _]` ở giữa, hint area dưới
5. Gõ "cat" — mỗi letter đúng → slot fill, sai → shake + mistake counter
6. Word complete → unlock phase: word + IPA + Volume2 phát "cat", auto-submit Good sau 2s
7. Bấm `?` để hint thêm 1 letter (hintsUsed++)
8. Bấm Esc để give-up → auto rating Again
9. Test edge: nếu queue có thẻ multi-word (hiếm, P0 không có) → fallback flashcard flip thay vì TypingCard
10. SQL check: `SELECT review_type, rating FROM review_logs ORDER BY reviewed_at DESC LIMIT 5;` — thấy `review_type='typing'` cho cả Cloze và Typing (cùng enum, khác mode FE)

**Refactor tiềm năng (defer)**:
TypingCard và ClozeCard share ~70% code (state machine + keyboard + unlock panel). Có thể trừu tượng `<WordTypingArea>` chia sẻ logic, nhưng giờ KHÔNG urgency — chunk 2 ưu tiên ship sản phẩm hơn DRY. Nếu Chunk 3 (Listening) cũng share pattern này thì refactor sẽ rõ ràng hơn.

**Pending cho Chunk 3 (next session) — Listening mode**:

- Top: nút lớn "🔊 Nghe" + small "Bấm phím Space để phát lại"
- Auto-phát `speakWord(card.word)` on mount + Space replay
- Hide định nghĩa hoàn toàn (chỉ pos/cefr badge)
- Input slots như TypingCard (full hidden)
- Submit → unlock reveal (word + IPA + def + examples)
- `reviewType: 'listening'` (đã sẵn enum)
- Enable button trong ModePicker
- Edge case: browser không có speechSynthesis → toast cảnh báo + fallback show word (degraded UX)

**Pending cho Chunk 4 — Polish**:

- Toast milestones: streak +1, lesson complete, daily limit reached
- Skeleton screens: cải thiện `review/loading.tsx` match new layout (mode picker + card)
- Empty states: hiện ổn, nhưng có thể add suggested deck links

**Pending cho v0.2.0 release**: vẫn defer đến hết Tuần 5.

---

## 2026-05-13 (tối) — fe → dev — Claude Opus 4.7 (Tuần 5 chunk 1: Mode Picker + MCQ mode)

**Mục tiêu session**: Mở Tuần 5 với chunk 1 = Mode Picker scaffolding + MCQ mode đầu tiên — đụng đủ chain (BE queue → store → UI component → test) để xác nhận pattern Tuần 5 chạy trước khi scale sang Typing/Listening.

**Đã hoàn thành (commit `2f6186e` trên fe → merge `dc7016a` lên dev). Chưa sync xuống `be` (BE không thay đổi, để sync lúc kết Tuần 5).**

**Files mới (4):**

- `src/components/review/mcq-card.tsx` (~180 line, client): MCQCard component
  - Layout: word + IPA + POS + CEFR badge + Volume2 phát âm + prompt "Nghĩa nào đúng với từ này?" + 4 ChoiceButton grid (1-col mobile / sm:2-col)
  - State: `selectedIndex: number | null`, `submittedRef` ngăn double-fire
  - `assembleMcqChoices(correct, distractorPool)` qua useMemo (key card.id), trả về `{ choices, correctIndex }` shuffled
  - Keyboard 1-4: pick choice (ignore khi đang focus input)
  - Click → setState revealed → 900ms `setTimeout` → `onGrade(Rating.Good)` đúng / `onGrade(Rating.Again)` sai (binary grade vì MCQ chỉ có pass/fail signal)
  - Reveal styling: correct → emerald, selected wrong → red, others → dim opacity-60
  - Cleanup `speechSynthesis.cancel()` on unmount
- `src/components/review/mcq-utils.ts` (~85 line, pure): helpers cho MCQ
  - `shuffle<T>(arr, rng?)`: Fisher-Yates immutable
  - `pickDistractors(correct, pool, n, rng?)`: case-insensitive dedupe + exclude correct + shuffle + slice n
  - `assembleMcqChoices(correct, pool, rng?)`: ghép correct + 3 distractor + shuffle vị trí + return `correctIndex`
  - `createSeededRng(seed)`: Mulberry32 cho test deterministic
- `src/components/review/mcq-utils.test.ts` (12 tests): shuffle (immutable + deterministic + permutation), pickDistractors (case-insensitive exclude + dedupe + cap + empty pool + skip whitespace), assembleMcqChoices (correct exactly once + 4 distinct choices + shuffle position across 30 seeds + graceful fallback)
- `src/components/review/mode-picker.tsx`: radiogroup component
  - 4 buttons: Cloze (Pencil, active) / Trắc nghiệm (ListChecks, active) / Gõ nghĩa (Keyboard, disabled "Sắp có") / Nghe (Headphones, disabled "Sắp có")
  - Pill style, active state đảo màu (`bg-zinc-900 text-zinc-50`), disabled state mờ + cursor-not-allowed + tooltip
  - `aria-checked` + `role=radio` + `role=radiogroup` cho accessibility

**Files edit:**

- `src/features/srs/queue.ts`:
  - `ReviewQueueItem` thêm `distractorPool: string[]`
  - Sau khi fetch due+new: collect unique `lessonIds`, 1 SELECT bulk `cards WHERE lessonId IN (...)` → group by lessonId
  - Per-item: `buildDistractorPool(siblings, card.id, selfMeaning, globalPool)` — fallback global pool khi lesson <4 cards
- `src/features/srs/queue-utils.ts`: thêm 2 pure helpers
  - `extractMeaningVi(defs)`: trim `definitions[0].meaning_vi`, null-safe (defensive vs jsonb)
  - `buildDistractorPool(siblings, selfId, selfMeaning, globalPool)`: dedupe siblings (skip self + selfMeaning), top-up từ global khi <3 distinct, cap 8 candidates
  - `SiblingMeaning = { cardId, meaningVi }` type export
- `src/features/srs/queue.test.ts`: thêm 11 tests
  - `extractMeaningVi`: trim, empty array, null, missing field, whitespace-only
  - `buildDistractorPool`: exclude self card + meaning, dedupe meanings, siblings-only when ≥3, global fallback when <3, cap 8 from fat global, returns [] gracefully when pool exhausts, handles null self meaning
- `src/stores/review-session.ts`:
  - `ReviewMode = 'cloze' | 'mcq' | 'typing' | 'listening'` exported
  - State thêm `mode: ReviewMode` (default 'cloze') + action `setMode(mode)` (reset cardStartedAt + flipped)
  - `rate()` đọc `currentMode = s.mode`, append vào ReviewResult, truyền `reviewType: modeToReviewType(currentMode)` thay vì hard-code `'typing'`
  - `modeToReviewType`: cloze/typing → 'typing', mcq → 'mcq', listening → 'listening' (Tuần 5 chunk 2 sẽ split typing-from-definition nếu cần)
  - `partialize: { results, mode }` — F5 giữ pick
  - `ReviewResult.mode?` optional cho backward compat (results cũ chưa có field này)
- `src/components/review/review-session.tsx`:
  - Render `<ModePicker>` trên đầu
  - `effectiveMode`: nếu user chọn `cloze` mà thẻ multi-word → fallback `cloze-multiword` (flashcard flip)
  - Branch render: `mcq` → `<MCQCard>`, `cloze-multiword` → `<MultiWordFallback>`, else → `<ClozeCard>`
  - Hint text top thay đổi theo mode

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings (next lint flat config)
- `pnpm test` ✓ 72/72 (49 cũ + 23 mới: 11 queue-utils + 12 mcq-utils)
- `pnpm dev` ✓ server up (browser verify thuộc về user trước khi mở chunk 2)

**Commitlint note**: scope `review` chưa có trong enum `commitlint.config.cjs` — warning only, commit pass. Lần sau dùng scope `ui` hoặc `srs` (đã có). Chunk 2+ nên cân nhắc add scope `review` vào `commitlint.config.cjs`.

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                          |
| ------ | --------- | --------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                 |
| dev    | `dc7016a` | Tuần 5 chunk 1 mode picker + MCQ merged       |
| be     | `eb6ec8f` | chưa sync Tuần 5 ch1 (chỉ FE thay đổi, defer) |
| fe     | `2f6186e` | base Tuần 5 chunk 1                           |

**Manual E2E checklist cho user (browser, sau pull):**

1. `pnpm dev` → login → `/review` (đảm bảo có queue, nếu hết: enroll deck mới ở `/decks`)
2. Picker hiện ở top với 4 nút — Cloze active mặc định (pill đen)
3. Click **Trắc nghiệm** → card đổi sang 4-choice MCQ. Word + IPA hiện trên, 4 nghĩa VN bên dưới
4. Pick đúng → nút green flash, 900ms sau auto-advance, kiểm tra Supabase SQL: `SELECT review_type, rating, reviewed_at FROM review_logs ORDER BY reviewed_at DESC LIMIT 5;` → thấy `review_type='mcq'`, `rating=3`
5. Pick sai → nút red, đáp án đúng cũng highlight green, advance với `rating=1` (Again)
6. Bấm phím `1-4` thay vì click — phải work
7. Click **Gõ nghĩa** / **Nghe** → disabled, không react, tooltip "Sắp có"
8. F5 trang → mode đang chọn được giữ (kiểm `localStorage['review-session-results']` có `mode: 'mcq'`)
9. Quay lại **Cloze** → cloze typing vẫn chạy bình thường, regression-free
10. `/dashboard` sau session → streak/heatmap recompute đúng

**Bundle impact** (chưa build production trong session này — chỉ dev verify):

- `/review` sẽ tăng nhẹ vì MCQCard + ModePicker (lazy, không lib mới). Đo lúc build chunk cuối Tuần 5.

**Pending cho Chunk 2 (next session)**: Typing-from-definition mode

- Show `definitions[0].meaning_vi` ở top, ô input rỗng → user gõ word
- Validate: case-insensitive, trim, accept hyphen/apostrophe đúng vị trí
- Grade: 0 mistake + <5s → Good, 1-2 mistake → Hard, 3+ mistake / give-up → Again (tương tự `gradeFromCloze`)
- Có thể tái dùng nhiều logic từ `cloze-utils.ts` — refactor ra `typing-utils.ts` chung
- Enable nút "Gõ nghĩa" trong ModePicker (xóa disabled flag)
- Quyết định: split `reviewType` thành `'typing'` (cloze) vs `'typing-def'` (mới) hay giữ chung — recommend giữ chung lần đầu, split nếu retention analytics cần

**Pending cho v0.2.0 release** (sẵn từ Tuần 4 nhưng defer đến hết Tuần 5):

- `dev → main` merge + tag `v0.2.0` — defer đến khi Tuần 5 polish xong để release "Minigames + Dashboard" thành 1 bản

---

## 2026-05-13 (chiều muộn) — fe → dev → be — Claude Opus 4.7 (Tuần 4 chunk 4: /settings page + đóng Tuần 4)

**Mục tiêu session**: build `/settings` form 3 sections để user chỉnh displayName / timezone / daily limits / theme. Đóng Tuần 4 sẵn ship `v0.2.0`.

**Đã hoàn thành (commit `a640f02` trên fe → merge `0096632` lên dev → sync `eb6ec8f` xuống be):**

**Files mới (2):**

- `src/components/settings/settings-form.tsx` (~225 line, client):
  - Props: `{ initial: { email, displayName, timezone, dailyNewCards, dailyReviewMax } }`
  - State local: 4 useState cho 4 trường + `useTransition` cho submit pending
  - 3 `<SettingsSection>` (bordered card layout với title + description):
    - **Tài khoản**: Email `<Input disabled>` mono (read-only), displayName text input, timezone `<select>` 11 IANA TZ
    - **Giới hạn hằng ngày**: dailyNewCards number 1-50 + dailyReviewMax number 50-500, grid 2-col sm:grid-cols-2
    - **Giao diện**: `<ThemeRadio>` — 3 button (Sun/Moon/Monitor) wired qua `useTheme()` next-themes, mounted state gate cho SSR hydration
  - Submit: `e.preventDefault() → startTransition(updateProfile)` → sonner toast success/error
  - Theme change: handled bởi `setTheme()` client-only, KHÔNG đi qua server action (next-themes lưu localStorage)
- `src/app/(app)/settings/loading.tsx`: skeleton 3 sections + submit button

**Files edit:**

- `src/features/auth/profile.ts`:
  - Add `'use server'` directive (toàn file → server actions)
  - Add `updateProfile(input)` action với Zod schema `UpdateProfileSchema`:
    - `displayName`: trim + max 100 + transform '' → null
    - `timezone`: string min 1 max 64
    - `dailyNewCards`: coerce int 1-50
    - `dailyReviewMax`: coerce int 50-500
  - `requireUserId()` → `ensureProfile` → update row → revalidate `/settings` + `/dashboard` + `/stats` + `/review` (4 routes vì timezone/limits ảnh hưởng tất cả stats queries + queue)
  - Trả `{ ok: true } | { ok: false, error: string }` cho client toast
- `src/app/(app)/settings/page.tsx` (replace placeholder):
  - `force-dynamic` + `getCurrentUserId() ?? redirect('/login?next=/settings')`
  - `ensureProfile(userId)` trước (idempotent, đảm bảo row tồn tại)
  - `Promise.all([db.query.profiles.findFirst, createSupabaseServerClient])` parallel — sau đó `await supabase.auth.getUser()` để lấy email (vì email không lưu ở profiles, chỉ ở auth.users)
  - Fallback defaults nếu profile null (race condition with trigger)
  - Render `<SettingsForm initial={{...}}>`

**Verify đã chạy:**

- `pnpm test` ✓ 49/49 (không đổi)
- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes:
  - `/settings` ƒ dynamic 5.24 kB / **123 kB** First Load — form + sonner + next-themes (tương đương `/login` 129 kB)
- **Browser verify**: chưa test — user có thể chạy `pnpm dev` mở `/settings`, thử đổi tz → click "Lưu thay đổi" → `/dashboard` xem streak có recompute theo tz mới không

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                 |
| ------ | --------- | ------------------------------------ |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)        |
| dev    | `0096632` | Tuần 4 chunk 4 /settings page merged |
| be     | `eb6ec8f` | sync chunk 4 (/settings page)        |
| fe     | `a640f02` | base chunk 4 /settings page          |

---

**Tuần 4 ĐÃ ĐÓNG — sẵn ship `dev → main` tag `v0.2.0`:**

Hoàn thành full Tuần 4:

- ✅ Chunk 1 BE foundation (`features/stats/{dates,streak,heatmap,maturity}` + 17 tests)
- ✅ Chunk 2 `/dashboard` FE (RSC parallel fetch + 3 stat cards + heatmap SVG + enrolled list)
- ✅ Chunk 3 `/stats` FE (retention line + activity stacked bar + maturity donut, raw SVG)
- ✅ Chunk 4 `/settings` (form 3 sections + updateProfile action + theme radio)
- ✅ Perf hotfix (middleware getSession + React.cache)

**Bundle sizes cuối Tuần 4 (build production):**

| Route                             | Page size | First Load JS |
| --------------------------------- | --------- | ------------- |
| `/` static                        | 184 B     | 109 kB        |
| `/dashboard` ƒ                    | 184 B     | 109 kB        |
| `/decks` ƒ                        | 184 B     | 109 kB        |
| `/decks/[col]/[topic]/[lesson]` ƒ | 2.53 kB   | 129 kB        |
| `/login` ƒ                        | 3.03 kB   | 129 kB        |
| `/review` ƒ                       | 43.4 kB   | 172 kB        |
| `/review/summary` ○               | 2.54 kB   | 122 kB        |
| `/settings` ƒ                     | 5.24 kB   | 123 kB        |
| `/stats` ƒ                        | 184 B     | 109 kB        |

Middleware bundle: 99.5 kB. Test suite: 49/49.

---

**Next step session sau (Ship Tuần 4 → main):**

1. **Manual verify end-to-end** trên `pnpm dev`:
   - Login → /dashboard (cache hot sau perf hotfix)
   - /settings → đổi `dailyNewCards: 20 → 10`, đổi timezone → "Lưu thay đổi"
   - /review → verify queue cap ≤ 10 new cards
   - /dashboard → verify streak/heatmap không bị reset, daily limits subtitle update
   - /settings → đổi theme dark/light → verify swap smooth, persist sau F5
2. **Pre-release checks**:
   - `git log main..dev --oneline` — đảm bảo clean
   - `pnpm build && pnpm start` test production preview (verify perf snappy không cần dev compile)
   - Browser smoke test: tất cả 6 routes load < 500ms TTFB sau initial compile
3. **Ship dev → main `v0.2.0`**:
   ```bash
   git checkout main && git pull
   git merge dev --no-ff -m "release: v0.2.0 - Tuần 4 Dashboard + Stats + Settings"
   git tag -a v0.2.0 -m "Tuần 4: Dashboard, Stats, Settings, auth perf fix"
   git push origin main --follow-tags
   git checkout be && git merge main --no-ff -m "sync: main -> be (v0.2.0 release)" && git push
   git checkout fe && git merge main --no-ff -m "sync: main -> fe (v0.2.0 release)" && git push
   ```
4. **Tuần 5 mở (Minigames + Polish)**:
   - MCQ mode (4 đáp án, generate distractors từ same lesson)
   - Typing mode (đã có Cloze, có thể là biến thể)
   - Listening mode (Web Speech TTS hoặc audio_url)
   - Mode picker `/review?mode=cloze|mcq|typing|listening`
   - Toast milestones (streak +1, lesson hoàn thành)

**Critical paths cần đọc khi mở Tuần 5:**

- `src/components/review/cloze-card.tsx` — pattern card state machine reuse
- `src/components/review/review-session.tsx` — wrapper logic, dispatch mode based on query param
- `src/features/srs/actions.ts:22` — `reviewType` enum đã có 'mcq' + 'typing' + 'listening'
- `src/features/srs/queue.ts` — `ReviewQueueItem.card` có `synonyms/antonyms/collocations` reuse cho MCQ distractors
- `VOCAB_APP_BLUEPRINT.md` Phần 6 Tuần 5 nếu có spec chi tiết

**Lưu ý tech (carry-over):**

- `/settings` form không validate client-side trước submit — Zod server validate trả error qua sonner toast (UX acceptable, không cần thêm react-hook-form complexity)
- Theme `system` mode tôn trọng `prefers-color-scheme` OS, KHÔNG ghi `theme` cookie/localStorage. Theme `light`/`dark` ghi `theme` key vào localStorage qua next-themes ClassProvider
- `getCurrentUserId` đã cached qua React.cache — `/settings` page gọi 1 lần đầu, không bị duplicate auth call
- Email get qua `supabase.auth.getUser()` trong page — KHÔNG cached (next-themes useTheme là client). Có thể wrap `getAuthUser()` với cache nếu cần dedupe sau

---

## 2026-05-13 (chiều) — be → dev → fe — Claude Opus 4.7 (perf hotfix: drop auth network roundtrip on every nav)

**Mục tiêu session**: user báo "click tab rất lag/load lâu". Diagnose root cause + apply 2 fix nhỏ trước khi shipping chunk 4 settings.

**Diagnosis (ranked impact):**

1. **#1 (major)**: `supabase.auth.getUser()` gọi 2 lần/click — middleware + `getCurrentUserId()` trong page. Mỗi call là HTTP roundtrip tới Supabase Auth server VN ↔ Singapore ~150-300ms. Tổng ~400ms auth check/click thuần backend.
2. **#2 (major, dev-only)**: Next 15 dev mode compile route on-demand lần đầu — `/review` 172 kB tốn 10-20s lần đầu trên Windows cold cache. Production build không bị.
3. **#3 (moderate)**: `force-dynamic` everywhere + Promise.all 5 queries `/dashboard` mỗi click = no cache, ~500ms DB. `/stats` 4 queries ~400ms.
4. **#4 (minor)**: Middleware matcher rộng → chạy thêm cho `_next/data` + RSC prefetch → multiply auth checks.

**Đã hoàn thành (commit `3627953` trên be → merge `962e5dc` lên dev → sync `cbb5499` xuống fe):**

**File edit:**

- `src/lib/supabase/middleware.ts`:
  - `supabase.auth.getUser()` → `supabase.auth.getSession()`
  - `getSession()` chỉ đọc cookie + verify JWT signature **local** (no Supabase network call). Cắt ~200ms/middleware run.
  - Comment giải thích trade-off: middleware = lightweight gate; page-level `getCurrentUserId()` vẫn dùng `getUser()` cho authoritative check trước data access.
- `src/lib/auth/session.ts`:
  - Wrap `getCurrentUserId` + `requireUserId` với `cache()` từ `react` (React 19 stable API)
  - Defensive: multiple Server Components trong cùng request render share 1 auth call. Hiện tại mỗi page chỉ gọi 1 lần nên zero benefit immediate, nhưng future-proof cho layout + page cùng gọi.
  - Vẫn giữ `getUser()` (authoritative network check) — chỉ dedupe trong same request.

**Verify đã chạy:**

- `pnpm test` ✓ 49/49 (không đổi)
- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes — middleware bundle vẫn 99.5 kB
- **Browser verify**: chưa retest sau fix. Cần user kiểm chứng — `pnpm dev` → click tab → cảm nhận snappy hơn.

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                      |
| ------ | --------- | ----------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)             |
| dev    | `962e5dc` | perf(auth): middleware getSession + cache |
| be     | `3627953` | base auth perf fix                        |
| fe     | `cbb5499` | sync auth perf fix                        |

---

**Expected impact:**

- Mỗi click tab `/dashboard` `/review` `/stats` `/decks`: **-200ms** backend (middleware auth)
- Lần đầu vào route trong dev session: vẫn lag 5-15s do **#2 dev compile** (Next 15 dev behavior, không fix được bằng code — chỉ pre-warm bằng `pnpm build && pnpm start`)
- Subsequent clicks tab đã visited: snappy hơn rõ rệt

**Future perf optimizations (chưa làm, defer):**

- Wrap `getProfile(userId)` với `cache()` để dedupe 4 queries `getStreak/getHeatmap/getRetention/getActivity` mỗi cái fetch `profiles.timezone` riêng → 4 roundtrips → 1
- Narrow middleware matcher: thêm `_next/data` vào exclude
- Bỏ `force-dynamic` ở `/decks` (content public, có thể `revalidate: 60`)
- Production demo: `pnpm build && pnpm start` thay vì `pnpm dev`

---

**Next step (Tuần 4 chunk 4 — /settings):**

1. User retest browser: `pnpm dev` → click tab khắp app, expect snappier
2. Nếu vẫn lag → DevTools Network → check TTFB. Nếu >500ms → wrap getProfile + bỏ force-dynamic /decks
3. Tiếp chunk 4: `/settings` form 3 sections (Account/Daily limits/Appearance) + server action `updateProfile`
4. Sau chunk 4: ship Tuần 4 → main tag `v0.2.0`

---

## 2026-05-13 (trưa) — fe → dev → be — Claude Opus 4.7 (Tuần 4 chunk 3: /stats page — retention + activity + maturity)

**Mục tiêu session**: build `/stats` page với 3 chart sections — retention line, daily activity stacked bar, maturity donut pie. Charting lib: raw SVG (zero dep, consistency với heatmap chunk 2).

**Đã hoàn thành (commit `4aee6b3` trên fe → merge `42387aa` lên dev → sync `27e676d` xuống be):**

**Files mới (5):**

- `src/features/stats/retention.ts` (~80 line, BE):
  - `getRetention(userId, weeks=12, now)` → `Retention = { points: [{date, avgStability, sampleSize}], timezone, max, start, end }`
  - Query `review_logs.reviewedAt + stateAfter` jsonb 12 tuần qua (default), bucket by user tz day, compute avg stability per day, fill zero-sample days với `avgStability=0, sampleSize=0` để UI render gaps
  - Cast `stateAfter` jsonb → `{ stability?: number }` defensive (handle null/missing)
- `src/features/stats/activity.ts` (~95 line, BE):
  - `getActivity(userId, days=30, now)` → `Activity = { cells: [{date, again, hard, good, easy, total}], timezone, max, total, totalByRating, start, end }`
  - Query `review_logs.reviewedAt + rating` 30 ngày, bucket by user tz day, breakdown 4 ratings per day + global `totalByRating` aggregate
  - Empty cell filler trên missing days
- `src/components/stats/retention-line.tsx` (~125 line, RSC SVG):
  - viewBox 720×200, padding 36/12/16/28 (L/R/T/B), Y axis "Xd" (days), X axis MM-DD ticks first/mid/last
  - Sky-tinted area path + polyline cho non-zero sample days (filter `n > 0`), small dots tại mỗi sample point
  - Grid lines dashed zinc-200, Y ticks at 0/50%/100% of `Math.max(5, Math.ceil(max))`
- `src/components/stats/activity-bar.tsx` (~150 line, RSC SVG):
  - viewBox 720×200, slot per day = plotWidth/days, bar width 75% slot
  - 4 stacked segments per day: Again (red-400), Hard (amber-400), Good (emerald-500), Easy (sky-500) — static fillClass + swatchClass cho Tailwind JIT pick up
  - `<title>` per rect "YYYY-MM-DD: Good ×5" cho hover tooltip
  - Legend dưới chart với colored swatches
- `src/components/stats/maturity-pie.tsx` (~140 line, RSC SVG):
  - viewBox 200×200, donut outer R=80 / inner R=50 / center label
  - `polar(angle, r)` + `donutPath(start, end)` clockwise từ 12 o'clock
  - 4 segments fill từ `MaturityCounts`: new (zinc-300), learning (amber-400), review (emerald-500), relearning (red-400)
  - Edge case: arc.end === arc.start (count=0) → bump +0.001 để tránh degenerate path; nhưng cũng filter `count === 0` trả null
  - Sidebar list flex column trên mobile / row trên sm: hiển thị label + count + pct per segment + mature row "Thuộc (≥21d stability)" tách bằng border-t

**Files edit:**

- `src/app/(app)/stats/page.tsx` (replace placeholder, ~155 line):
  - `'force-dynamic'` + `redirect('/login?next=/stats')` nếu chưa login
  - `Promise.all([getRetention, getActivity, getMaturityCounts, getStreak])` parallel
  - 4 MetricCard row top (Total reviews 30d / Accuracy % / Days active / Mature `N`) — accuracy = `(good + easy) / total` rounded
  - 3 chart sections: retention với interpretation note, activity với 30d label, maturity với "snapshot hiện tại"
  - "← Về dashboard" link cuối
- `src/app/(app)/stats/loading.tsx` (mới): skeleton match — 4 cards + 3 chart blocks

**Verify đã chạy:**

- `pnpm test` ✓ 49/49 (không đổi — RSC + pure SVG)
- `pnpm typecheck` ✓ 0 errors (sau cast `stateAfter as { stability?: number } | null`)
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes sau khi clear `.next/` (dev server vừa stop để lại cache stale → `Cannot find module for page: /login`):
  - `/stats` ƒ dynamic 184 B / **109 kB** First Load — RSC pure SVG, zero charting deps
  - `/dashboard` không đổi 184 B / 109 kB
- KHÔNG manual verify browser session này (chunk 2 đã verify, chunk 3 cùng layout pattern)

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                              |
| ------ | --------- | --------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)     |
| dev    | `42387aa` | Tuần 4 chunk 3 /stats page merged |
| be     | `27e676d` | sync chunk 3 (/stats page)        |
| fe     | `4aee6b3` | base chunk 3 /stats page          |

---

**Next step session sau (Tuần 4 chunk 4 — /settings):**

1. Manual verify `/stats` browser (`pnpm dev` → clear `.next/` nếu cache cũ rồi mới build/dev):
   - Login → /stats → 4 MetricCard hiển thị data 30d từ session Cloze + Dashboard chunks
   - Retention line: dot tại ngày hôm nay nếu có review, area dưới đường
   - Activity bar: stacked color 4 segments cho ngày hôm nay
   - Maturity pie: 4 segments (chủ yếu "Đang học" hoặc "Mới" với content P0 hiện tại)
   - Hover bar/pie segment → title tooltip browser
2. Vào `fe` build `/settings`:
   - **Form 3 sections**: Account (displayName text + timezone select 20 IANA TZ list), Daily limits (dailyNewCards range 1-50, dailyReviewMax 50-500), Appearance (theme select light/dark/system qua next-themes)
   - Server action `updateProfile` cập nhật `profiles` table (Zod validate input)
   - Reuse pattern form từ `src/components/auth/login-form.tsx`
   - Theme toggle: client component qua `useTheme()` từ next-themes
3. **Verify Tuần 4 end-to-end**:
   - Manual: change daily new cards limit 20→10 trên /settings → /review → đảm bảo getReviewQueue trả ≤10 thẻ mới
   - Manual: change timezone → /dashboard streak có recompute đúng theo tz mới?
4. **Ship Tuần 4 → main**:
   - Merge dev → main `--no-ff` với tag `v0.2.0-tuần-4-done`
   - Sync `main → be/fe` post-release

**Critical paths cần đọc khi vào chunk 4:**

- `src/components/auth/login-form.tsx` — pattern form với useFormStatus + server action
- `src/features/auth/actions.ts` — pattern server action với Zod validate
- `src/features/auth/profile.ts` — đã có `ensureProfile`, có thể extend hoặc tạo `updateProfile`
- `src/lib/db/schema.ts:129-141` — `profiles` fields (displayName, timezone, locale, dailyNewCards, dailyReviewMax, uiPrefs jsonb)
- `next-themes` docs — pattern `setTheme('light' | 'dark' | 'system')`

**Lưu ý tech:**

- `/stats` 109 kB First Load — bằng `/dashboard`, không thêm bloat. Recharts chưa cần install.
- Build cache: nếu vừa dùng `pnpm dev` trước khi build, có thể gặp `PageNotFoundError: Cannot find module for page: /login`. Solution: `rm -rf .next` rồi `pnpm build` lại. Đây là Next 15 RSC streaming dev cache vs prod compile mismatch.
- Retention line skip zero-sample days từ polyline (giữ x-position) → tránh đường rơi xuống 0 đột ngột. UI trade-off: dấu chấm thưa nếu user không review hằng ngày.
- Activity bar legend swatch class `bg-{tone}-{shade}` static trong SEGMENTS array để Tailwind JIT compile (không dùng `.replace('fill-','bg-')` dynamic).
- Maturity donut: edge case 1 segment 100% (e.g. tất cả "Đang học") → arc full circle. Bump `+0.001` cho start===end là defensive cho count=0 edge nhưng đã filter `count === 0` trả null. OK both belt + suspenders.
- Accuracy formula: `(good + easy) / ratingTotal` — Hard không tính đúng vì user vẫn vật lộn. Có thể debate; chunk 4 có thể add toggle "Strict accuracy" hoặc "Lenient accuracy".

---

## 2026-05-13 (sáng) — fe → dev → be — Claude Opus 4.7 (Tuần 4 chunk 2: /dashboard FE với stats + heatmap)

**Mục tiêu session**: wire `/dashboard` UI từ BE foundation chunk 1. RSC parallel fetch, 3 stat cards, enrolled lessons list với progress bars, GitHub-style heatmap 12 tuần SVG, empty state cho user mới.

**Đã hoàn thành (commit `e229e1f` trên fe → merge `dad126c` lên dev → sync `048d99a` xuống be):**

**Files mới (2):**

- `src/components/dashboard/heatmap.tsx` (~135 line, RSC pure SVG):
  - Props: `{ data: Heatmap }` từ `features/stats/heatmap`
  - Layout: 12 weeks × 7 days grid, Sunday-aligned padding (firstCell `.getUTCDay()` quyết empty cells đầu col 0)
  - Cell: 12×12 px + 3px gap, rx=2, color theo intensity `count / max` chia 5 level (0=zinc-100, <=.25=sky-200, <=.5=sky-300, <=.75=sky-500, else sky-600), dark mode mirror
  - Labels: VN month "Th 1..Th 12" trên column boundary đầu mỗi tháng; day-of-week "T2/T4/T6" mỗi 2 row trái
  - Accessibility: `<svg role="img" aria-label="...">` + `<title>` per cell với "YYYY-MM-DD: N thẻ"
  - Empty state: hiện `<p>Chưa có hoạt động ôn tập trong 12 tuần qua.</p>` nếu cells rỗng
- `src/app/(app)/dashboard/loading.tsx`: skeleton 3 stat cards + CTA + list + heatmap block, match layout

**Files edit:**

- `src/features/vocab/queries.ts`: thêm `getEnrolledLessonsWithProgress(userId)`:
  - Query 1: join `user_lessons → lessons → topics → collections` order `desc(userLessons.startedAt)`
  - Query 2: `user_cards WHERE userId AND lessonId IN (...)` group state ≠ 'new' → Map<lessonId, count>
  - Return `EnrolledLessonProgress[]` với `{ lessonId, lessonSlug, lessonName, cardCount, topicSlug/Name, colSlug/Name, learned, total }`
- `src/app/(app)/dashboard/page.tsx` (replace placeholder, ~240 line):
  - `'force-dynamic'` + `getCurrentUserId() ?? redirect('/login?next=/dashboard')`
  - `Promise.all([getStreak, getHeatmap, getMaturityCounts, getReviewQueue, getEnrolledLessonsWithProgress])` parallel fetch
  - 3 `<StatCard>` (Flame amber, Inbox sky, GraduationCap emerald) với value + suffix + subtitle adapt theo data state
  - CTA `<Button asChild>` → /review nếu `dueTotal > 0`, else /decks "Thêm bài học mới"
  - "Bài đang học" section: top 5 enrolled với progress bar emerald + percentage
  - Heatmap section + brand-new-user Sparkles banner empty state

**Verify đã chạy:**

- `pnpm test` ✓ 49/49 (không đổi)
- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes: `/dashboard` ƒ dynamic 181 B / **109 kB** First Load

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                |
| ------ | --------- | ----------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)       |
| dev    | `dad126c` | Tuần 4 chunk 2 /dashboard FE merged |
| be     | `048d99a` | sync chunk 2 (dashboard FE)         |
| fe     | `e229e1f` | base chunk 2 /dashboard FE          |

---

**Next step session sau (Tuần 4 chunk 3 — /stats page):**

1. Manual verify `/dashboard` browser thật (`pnpm dev`):
   - Login → /dashboard → 3 stat cards có data từ session chunk 3 Cloze, enrolled lessons hiển thị `learned/total`, heatmap có cells sky tint cho ngày hôm nay
2. Chunk 3 `/stats` page:
   - Retention chart từ `review_logs.state_after.stability` theo time
   - Daily activity bar chart (X=day, Y=reviews) — reuse `heatmap.cells` hoặc query mới với rating breakdown
   - Maturity pie chart (4 segments: new/learning/review/relearning + mature)
   - Charting lib: `pnpm add recharts` (~50 kB tree-shake) hoặc raw SVG. Recommend recharts cho retention line + daily bar; raw SVG cho pie
3. Chunk 4 `/settings`: timezone select + dailyNewCards 1-50 + dailyReviewMax 50-500 + theme toggle (already wired via next-themes). Form pattern reuse `/login`.

**Critical paths cần đọc khi vào chunk 3:**

- `src/lib/db/schema.ts:195-217` — `reviewLogs.stateAfter` jsonb với `{ stability, scheduledDays, ... }`
- `src/features/stats/heatmap.ts` — pattern bucket by day reuse
- `src/components/dashboard/heatmap.tsx` — SVG pattern reuse cho bar/pie nếu không dùng recharts
- `package.json` — cần `pnpm add recharts` nếu chọn lib

**Lưu ý tech:**

- `/dashboard` 109 kB First Load — gọn vì pure RSC + tiny client Button wrapper. Chunk 3 recharts có thể tăng `/stats` ~150 kB
- Heatmap Sunday-aligned padding: firstCell rơi Sunday → 0 empty, Saturday → 6 empty → 13 cols total
- Streak strict-today: hiển thị 0 nếu user chưa review hôm nay dù chuỗi dài hôm qua. Subtitle "Kỷ lục: X · Y ngày học" cho user thấy lịch sử. Chunk 3 hoặc 4 có thể soft policy
- `enrolled.slice(0, 5)` — chưa pagination, dùng `/decks` link đầy đủ
- `Button asChild + disabled`: không strict disable Link, fallback href conditional sang `/decks` đảm bảo CTA luôn productive

---

## 2026-05-13 (sáng sớm) — be → dev → fe — Claude Opus 4.7 (Tuần 4 BE foundation: streak + heatmap + maturity)

**Mục tiêu session**: mở Tuần 4 Dashboard. Theo pattern Tuần 3 chunk 1 (BE foundation trước, FE chunk sau), build query layer `features/stats/` + vitest pure helpers. Để dành UI cho session FE kế tiếp.

**Đã hoàn thành (commit `139afed` + `c0cfba1` trên be → merge `3443d13` lên dev → sync `1e3201a` xuống fe):**

**Files mới (5):**

- `src/features/stats/dates.ts` (~75 line, PURE):
  - `dayKey(date: Date, tz: string): string` — `date-fns-tz.formatInTimeZone(d, tz, 'yyyy-MM-dd')`. Test: UTC 17:00 ICT → next day, UTC 16:59:59 ICT → same day.
  - `todayKey(now, tz)` — alias cho `dayKey(now, tz)`
  - `shiftDay(key, delta)` — parse `YYYY-MM-DD` ở UTC 12:00 (tránh edge midnight), `setUTCDate(+delta)`, format lại. Handle month/year wrap.
  - `computeStreaks(daysAsc, today): { current, longest }` — longest = walk forward + reset trên gap; current = strict today policy (nếu latest !== today → 0). Walk backward khi latest === today.
- `src/features/stats/dates.test.ts` (~95 line, 17 tests):
  - dayKey: ICT boundary 17:00 UTC vs 16:59:59 UTC, UTC tz pass-through, todayKey alias
  - shiftDay: +1 normal, +1 month end → next month, +1 year end → next year, -1 Jan 1 → prev Dec 31, delta 0, -83 days (heatmap rollback)
  - computeStreaks: empty (0/0), today only (1/1), yesterday only (0/1), 3 consec today (3/3), ends yesterday (0/2), longest > current (2/4), gaps in ongoing (2/2)
- `src/features/stats/streak.ts` (~50 line):
  - `getStreak(userId, now)` → `Streak = { current, longest, daysActive, timezone, lastActiveDate }`
  - Đọc `profiles.timezone` (default Asia/Ho_Chi_Minh), SELECT distinct days từ `review_logs.reviewedAt ORDER BY DESC`, bucket vào Set bằng `dayKey(d, tz)`, gọi `computeStreaks`
- `src/features/stats/heatmap.ts` (~70 line):
  - `getHeatmap(userId, days=84, now)` → `Heatmap = { cells: [{date, count}], timezone, total, max, start, end }`
  - Default 84 days = 12 weeks (GitHub-style sidebar widget proportion)
  - Query reviewedAt >= `now - (days+1)*24h` (buffer 1d cho tz offset), bucket theo user tz, fill empty days với count=0
- `src/features/stats/maturity.ts` (~50 line):
  - `getMaturityCounts(userId)` → `MaturityCounts = { new, learning, review, relearning, mature, total }`
  - Single SELECT `state, stability` từ `user_cards WHERE user_id`, aggregate trong JS
  - `MATURE_STABILITY_DAYS = 21` (Anki convention) — mature = `state='review' AND stability >= 21d`

**File edit:**

- `commitlint.config.cjs`: thêm `'stats'` vào scope-enum (giữa `srs` và `vocab`) — chuẩn hóa cho future commits feat(stats):

**Verify đã chạy:**

- `pnpm test` ✓ **49/49** (32 cũ + 17 mới)
- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes — bundle KHÔNG đổi (BE-only, không touch FE)

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                           |
| ------ | --------- | ---------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                  |
| dev    | `3443d13` | Tuần 4 BE foundation merged                    |
| be     | `c0cfba1` | base Tuần 4 BE foundation + commitlint scope   |
| fe     | `1e3201a` | sync Tuần 4 BE (sẵn cho /dashboard UI session) |

---

**Next step session sau (Tuần 4 chunk 2 — Dashboard FE):**

1. Switch sang `fe` branch
2. Quyết định charting lib (RECOMMEND: **raw SVG cho heatmap** đơn giản đỡ deps + **recharts** cho retention/maturity nếu cần; defer recharts tới khi vào /stats nếu /dashboard chỉ cần heatmap)
3. Build `/dashboard` (RSC fetch parallel `Promise.all([getStreak, getHeatmap, getMaturityCounts, getReviewQueue, getEnrolledLessons])`):
   - 3 stat cards: streak (🔥 N ngày), due (X cần ôn), mature (Y thuộc)
   - "Bắt đầu ôn tập" CTA button → `/review` (disable nếu queue rỗng)
   - "Bài đang học" list với progress %
   - Heatmap section: 12 tuần × 7 ngày grid SVG ở dưới
4. Empty states cho mỗi section
5. Mobile responsive: stat cards stack vertical sm:grid-cols-3
6. **Chunk 3** (sau): page `/stats` chi tiết với retention chart từ `state_after.stability` + daily activity bar + maturity pie
7. **Chunk 4** (sau): page `/settings` — timezone select, daily new/review max, theme toggle

**Critical paths cần đọc khi vào chunk 2 FE:**

- `src/features/stats/streak.ts` + `heatmap.ts` + `maturity.ts` — type signatures cho RSC fetch
- `src/features/srs/queue.ts:33` — `getReviewQueue(userId)` đã sẵn cho due count
- `src/features/vocab/queries.ts` — pattern queries, có `getEnrolledLessonIds`, có thể cần thêm helper `getEnrolledLessonsWithProgress`
- `src/app/(app)/decks/page.tsx` — pattern RSC fetch + render cards
- `src/components/ui/skeleton.tsx` — primitive cho loading state
- `src/lib/auth/session.ts` — `getCurrentUserId() ?? redirect('/login')`

**Lưu ý tech:**

- Heatmap `max` trả về 0 nếu user chưa review → UI cần guard `cell.count / Math.max(1, max)`
- Streak strict today: nếu mở /dashboard buổi sáng trước khi review, thấy streak=0 dù hôm qua 10. Cân nhắc field "yesterdayCount" hoặc "graceUntil" để UI hiển thị "🔥 10 (chưa review hôm nay)" — soft policy
- `getHeatmap` query buffer 1 ngày dư cover tz offset; DST edge cells có thể off-by-one. Acceptable cho MVP
- `user_stats.currentStreak/longestStreak` columns vẫn ở schema nhưng chunk này KHÔNG update lazy. Có thể wire ở chunk 2 hoặc bỏ hẳn 2 cột
- `/dashboard` hiện 157B placeholder; chunk 2 sẽ tăng ~120-150 kB

---

## 2026-05-12 (đêm muộn) — fe → dev → be — Claude Opus 4.7 (Tuần 3 chunk 4: persist review results to localStorage)

**Mục tiêu session**: hoàn tất Tuần 3 với persist Zustand cho `results` (deferred từ chunk 3) → `/review/summary` survive F5. Manual verify Cloze trên browser thực qua `pnpm dev` đã PASS user-side trước khi vào chunk 4.

**Đã hoàn thành (commit `f13577d` trên fe → merge `de97b64` lên dev → sync `8d7c212` xuống be):**

**File edit:**

- `src/stores/review-session.ts`:
  - Import thêm `persist, createJSONStorage` từ `zustand/middleware`
  - Wrap `create<ReviewSessionState>()(persist((set, get) => ({...}), { config }))`
  - Config: `name: 'review-session-results'`, `storage: createJSONStorage(() => localStorage)`, `partialize: (state) => ({ results: state.results })`
  - Chỉ persist `results` — `queue/currentIndex/flipped/cardStartedAt` KHÔNG persist
  - Reason: `queue` chứa Date objects (due/lastReview/createdAt) → JSON serialization mất type, rehydrate stale risk. `init()` được gọi mỗi khi `/review` mount với fresh server-fetched queue → tự nhiên reset state. Persist `results` thuần là để `/review/summary` không blank khi user F5.
  - Comment trong code giải thích trade-off cho future-self
- Indentation lệch tay sau khi wrap → lint-staged prettier tự fix khi commit (95 insertions / 79 deletions cho re-format)

**Verify đã chạy:**

- `pnpm test` ✓ 32/32 (không đổi vs chunk 3)
- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes:
  - `/review` ƒ dynamic 43.4 kB / **172 kB** First Load (+1 kB cho persist middleware)
  - `/review/summary` ○ 2.54 kB / **122 kB** First Load (+1 kB)
- Manual: chưa retest browser sau persist (low risk — partialize chỉ áp results, không đổi flow ReviewSession/ClozeCard)

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                          |
| ------ | --------- | ----------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi) |
| dev    | `de97b64` | Tuần 3 chunk 4 persist merged |
| be     | `8d7c212` | sync chunk 4                  |
| fe     | `f13577d` | base chunk 4 persist          |

---

**Next step session sau (Tuần 4 — Dashboard & Stats):**

Tuần 3 đã DONE (4 chunks: BE foundation → /review FE shell → Terminal Cloze → persist). Mở Tuần 4.

1. Vào `be` branch trước cho query layer:
   - **Streak helper** `src/features/stats/streak.ts`: từ `review_logs.reviewedAt`, group by day theo `profiles.timezone` qua `date-fns-tz`, đếm consecutive days từ today về quá khứ, return `{ current, longest, lastActiveDate }`. Update `user_stats` qua cron hoặc lazy on `/dashboard` mount.
   - **Heatmap data** `src/features/stats/heatmap.ts`: query `review_logs WHERE userId AND reviewedAt >= 12 weeks ago`, group by date, return `Array<{ date, count }>`. UI render qua component giống GitHub contributions.
   - **Retention chart** `src/features/stats/retention.ts`: query `state_after.stability` từ `review_logs` group by day, compute average stability progression theo thời gian.
   - **Card maturity** `src/features/stats/maturity.ts`: `SELECT state, COUNT(*) FROM user_cards WHERE userId GROUP BY state` → 4-slice pie (new/learning/review/relearning) + mature count (state='review' AND stability > 30 days).
   - Vitest cho streak edge cases (timezone boundary, skip day mid-streak, future date guard).
2. Sau khi BE query layer xanh → switch `fe`:
   - **Dashboard `/dashboard`**: 3 stat cards (streak / total reviews / mature) + heatmap section + "Bài đang học" list (enrolled lessons với progress %)
   - **Page `/stats`**: retention line chart + daily activity bar + maturity pie
   - Reuse component pattern từ `/decks` (RSC fetch + client components nested)
   - Charting lib: chọn 1 trong: `recharts` (tree-shakable React, ~50kB), `chart.js` + `react-chartjs-2` (~80kB), hoặc raw SVG (zero dep, custom impl). Recommend **recharts** cho speed-to-build; raw SVG cho heatmap (đơn giản, đỡ dep).
3. **Settings page** `/settings`: 3 form sections — Account (display name, timezone select), Daily limits (newCards 1-50, reviewMax 50-500), Appearance (theme toggle). Server actions update `profiles`. Đã có route stub.

**Critical paths cần đọc khi vào Tuần 4:**

- `src/lib/db/schema.ts:195-217` — `reviewLogs` schema (reviewedAt, rating, stateBefore/After jsonb)
- `src/lib/db/schema.ts:230-241` — `studySessions` + `userStats` schemas (đã có nhưng chưa wire)
- `src/features/srs/queue-utils.ts` — pattern pure helper `dayStartUtc(now, timezone)` reuse cho streak
- `src/features/srs/queue.test.ts` — pattern vitest test cho timezone-aware date helpers
- `src/components/decks/card-preview.tsx` — pattern client component reuse
- `src/app/(app)/decks/page.tsx` — pattern RSC fetch + render cho dashboard sections
- `VOCAB_APP_BLUEPRINT.md` Tuần 4 phần 4 nếu có spec chi tiết heatmap/streak (chưa đọc kỹ — đọc khi vào)

**Lưu ý tech:**

- Persist localStorage cap ~5MB browser-side — chỉ persist `results` (mỗi entry ~200 bytes, 100 entries < 25KB) → an toàn. Không quá lo bloat.
- Persist không sync giữa tabs nếu user mở 2 tab `/review` cùng lúc → mỗi tab có state độc lập, ghi đè lẫn nhau khi tab cuối close. Edge case, không block MVP.
- SSR hydration với persist: server render initial `results: []`, client rehydrate từ localStorage trước React mount → có thể hydration mismatch warning. Summary page đã có snapshot pattern (`useEffect` setState từ rehydrated state) → mitigated. Test browser sau session để confirm không có warning.
- Tuần 4 sẽ cần `recharts` hoặc tương đương → check bundle impact ngay sau install (lazy load `/stats` nếu cần).
- `user_stats.lastActiveDate` field đã có sẵn trong schema (text YYYY-MM-DD) → reuse cho streak; KHÔNG cần migration.

---

## 2026-05-12 (đêm) — fe → dev → be — Claude Opus 4.7 (Tuần 3 chunk 3: Terminal Cloze làm primary `/review`)

**Mục tiêu session**: thay FlashcardFlip placeholder bằng Terminal-style Inline Cloze làm primary mode `/review`. Pure helpers + state machine + auto-grade + Web Speech audio + animation polish.

**Đã hoàn thành (commit `8fa69ef` trên fe → merge `a57327f` lên dev → sync `2c7d234` xuống be):**

**Files mới (3):**

- `src/components/review/cloze-utils.ts` (~65 line, PURE):
  - `getClozeMask(word, cefr): MaskSlot[]` — A1 visible(first, last), A2 visible(first + vowels {a,e,i,o,u}), B1+/null full hidden. Non-letter (apostrophe, hyphen, space) luôn visible.
  - `gradeFromCloze({hintsUsed, mistakes, durationMs, gaveUp}): Grade` — gaveUp || mistakes≥3 || hints≥2 → Again; 1 hint || 1-2 mistakes → Hard; 0/0/<5s → Easy; default Good
  - `speakWord(word)` — Web Speech API `speechSynthesis.speak()` với `lang='en-US' rate=0.9`, no-op nếu browser không support
- `src/components/review/cloze-utils.test.ts` (87 line, 15 tests):
  - Mask A1 cho `family` (slot 0+5 visible), A2 cho `mother` (m/o/e visible, t/h/r hidden), B2 cho `ephemeral` (all hidden), null defaults B1+, single letter `a` always visible, `don't` apostrophe visible
  - Grade: Easy <5s, Good ≥5s, Hard 1 hint, Hard 1-2 mistakes, Again gaveUp, Again 3+ mistakes, Again 2+ hints
- `src/components/review/cloze-card.tsx` (~360 line, primary):
  - Props: `{ item, onGrade(grade), pending }` — fully self-contained
  - State machine: `phase: 'typing' | 'unlocked'`, `input: string`, `hintsUsed`, `mistakes`, `gaveUp`, `shakeKey` (force re-mount Framer Motion shake), `mountedAtRef` (duration), `submittedRef` (idempotent submit)
  - Doc-level `keydown` listener (skip nếu target là input/textarea):
    - Phase `typing`: `[a-zA-Z]` → check expected next char (auto-fill non-letters trước), match → append + check unlock; mismatch → `mistakes++` + shake. `Backspace` → trim 1 char. `?` → auto-fill non-letters + next letter + `hintsUsed++`. `Escape` → `gaveUp=true` → unlock instant.
    - Phase `unlocked`: `1-4` → override grade. `Enter`/`Space` → submit derived. Letters no-op.
  - Render:
    - **Typing**: câu ví dụ với inline `<ClozeSlots>` (mono khung `[ _ _ ]`, slot active underline sky), VN dịch `backdrop-blur-[3px]` hover toggle, action row `Lightbulb`/`X`/`Eraser` buttons + counter `input/word · hint N · sai N`
    - **Unlocked**: `AnimatePresence` glassmorphism panel `bg-white/70 backdrop-blur ring-sky-100` với `boxShadow 0 0 24px rgba(56,189,248,0.18)`, header word + IPA mono + POS + CEFR badge + `Volume2` replay button, definitions (en+vi), 2 examples còn lại (border-l sky-200), collocations slice(0,4), mnemonic amber, countdown bar Framer Motion `width 100%→0% 2s linear`, label "Tự chấm Good trong 2s · bấm 1-4 để override", rating buttons row với derived highlighted (`activeTone: ring-{tone}-300`)
  - Cleanup: `clearTimeout` + `speechSynthesis.cancel()` on unmount
  - `splitSentence(sentence, word)` regex `\b...\b` case-insensitive với escape special chars cho từ có meta chars

**Files edit:**

- `src/components/review/review-session.tsx` (re-design):
  - Detect `isMultiWord = current.card.word.includes(' ')`:
    - True → `<MultiWordFallback>` với `<FlashcardFlip>` + Space lật + 1-4 chấm (giữ logic chunk 2 dạng fallback)
    - False → `<ClozeCard key={current.userCard.id}>` (key prop reset state per card)
  - Removed: global keydown listener (mỗi card type tự quản), `RATING_BUTTONS` constant, `flipped` selector ở top level (chỉ MultiWordFallback dùng)
  - Meta hint conditional: multi-word `Space lật · 1-4 chấm` vs cloze `gõ từ · ? hint · Esc bỏ qua`
- `src/stores/review-session.ts`:
  - `submitReview` call: `reviewType: 'flashcard'` → `'typing'` (Cloze IS typing mode theo `reviewTypeEnum`)
  - Giữ `flipped` + `flip()` cho MultiWordFallback path

**Verify đã chạy:**

- `pnpm test` ✓ 32/32 (17 BE + 15 cloze, 3 files, 9.91s)
- `pnpm typecheck` ✓ 0 errors (fix `isLetter(ch: string | undefined)` + bounds check trong while loop với `noUncheckedIndexedAccess`)
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 12/12 routes:
  - `/review` ƒ dynamic 43.4 kB / **171 kB** First Load (+4 kB so chunk 2 cho ClozeCard + AnimatePresence)
  - `/review/summary` ○ 2.48 kB / 121 kB (không đổi)

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                            |
| ------ | --------- | ----------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                   |
| dev    | `a57327f` | Tuần 3 chunk 3 Terminal Cloze merged            |
| be     | `2c7d234` | sync chunk 3 (BE đọc layout Cloze + reviewType) |
| fe     | `8fa69ef` | base chunk 3 Terminal Cloze                     |

---

**Next step session sau (Tuần 3 chunk 4 — polish + persist + open Tuần 4 dashboard):**

1. Vào `fe` branch (hoặc `be` tùy task)
2. **Persist Zustand** (option deferred từ chunk 3):
   - `import { persist } from 'zustand/middleware'` wrap `create<ReviewSessionState>`
   - `partialize: (state) => ({ results: state.results })` — chỉ persist results để `/review/summary` survive F5
   - Queue/currentIndex KHÔNG persist (stale risk — RSC refetch khi reload)
   - Storage: `localStorage` với name `'review-session-results'`
3. **Manual verify Cloze trên browser thực** (user side):
   - Login → /decks → enroll `daily-life/family`
   - /review → card `family` (A1) hiện câu `My [ f _ _ _ _ y ] lives in Hanoi.`
   - Gõ `a` `m` `i` `l` → unlock + audio + 2s countdown → auto Good
   - Card kế: gõ sai 1 lần → shake → tiếp tục → derived Hard
   - Card sau: `?` reveal → derived Hard
   - Card cuối: `Esc` → instant Again
   - /review/summary → counts đúng
4. **Tuần 4 Dashboard** mở (nếu chunk 4 không cần thiết bỏ qua, lên thẳng Tuần 4):
   - Streak timezone-aware với `date-fns-tz` qua `profiles.timezone`
   - Heatmap component (đọc `review_logs.reviewedAt` group by day)
   - Dashboard layout: 3 stat cards (streak / total reviews / mature cards) + heatmap + lessons in progress
   - Page `/stats`: retention chart từ `state_after.stability`, daily activity bar
5. (Optional) **Tuần 5 mode picker** sớm:
   - Đã có `reviewTypeEnum` 'flashcard'|'mcq'|'typing'|'listening'
   - Query param `/review?mode=cloze|flip` để chọn — Cloze hiện hardcode primary
   - MCQ + Listening minigames mới

**Critical paths cần đọc khi vào chunk 4:**

- `src/components/review/cloze-card.tsx` — toàn bộ state machine + keyboard, nếu tweak Cloze
- `src/stores/review-session.ts` — wrap `create` bằng `persist` middleware
- `src/app/(app)/review/summary/page.tsx` — đã có snapshot pattern, persist results sẽ làm snapshot ít cần thiết
- `src/features/srs/queue.ts` — pattern cho dashboard streak/heatmap queries
- `src/lib/db/schema.ts:195-217` — `reviewLogs` với `reviewedAt + reviewType + state_before/after` jsonb audit
- `VOCAB_APP_BLUEPRINT.md` Tuần 4 phần dashboard nếu có spec chi tiết

**Lưu ý tech:**

- Bundle `/review` 171 kB OK nhưng dần lên trần — chunk 4-5 nếu add nhiều dep (Recharts cho stats, etc.) cần lazy load.
- `speechSynthesis` Firefox cần `prefs media.webspeech.synth.enabled=true`. Edge/Chrome bật mặc định. iOS Safari có nhưng cần user gesture (đã đảm bảo: phát sau khi user gõ phím).
- `getClozeMask('y', 'A1')` cho A1 single-letter word: i===0 AND i===len-1 → visible. Cover trong test #5.
- `noUncheckedIndexedAccess` flag trong tsconfig — đã verify bằng cách extract `const ch = wordLower[pos]` + check `undefined`. Pattern cần dùng cho mọi truy cập index string/array.
- `submittedRef.current` đảm bảo override 1-4 trong countdown KHÔNG gây double-submit nếu user click rồi 2s timer cũng nổ. Idempotent từ FE side, BE side đã có `clientReviewId` idempotency.

---

## 2026-05-12 (khuya) — fe → dev → be — Claude Opus 4.7 (Tuần 3 chunk 2: /review FE shell với flashcard flip + Zustand + summary)

**Mục tiêu session**: Build FE shell cho `/review` lấy data từ `getReviewQueue` (BE foundation đã merge sáng nay), Zustand session store, flashcard flip placeholder cho Cloze, rating buttons + keyboard shortcuts, summary page.

**Đã hoàn thành (commit `3206996` trên fe → merge `311feb3` lên dev → sync `70d9780` xuống be):**

**Files mới (6):**

- `src/stores/review-session.ts` (129 line) — Zustand store:
  - State: `queue: ReviewQueueItem[]`, `currentIndex`, `flipped`, `cardStartedAt`, `results: ReviewResult[]`
  - `init(queue)`: reset + bootstrap, ghi `cardStartedAt = Date.now()`
  - `flip()`: toggle flipped
  - `rate(rating)`: generate `clientReviewId` qua `crypto.randomUUID()` (fallback `crv-${ts}-${rand}` cho non-crypto env), compute `durationMs` từ `cardStartedAt`, OPTIMISTIC advance currentIndex + reset flipped, await `submitReview`, update result status `'pending' → 'ok' | 'error'`
  - `reset()`: blank state cho session mới
- `src/components/review/flashcard-flip.tsx` (97 line):
  - Outer `<div role="button">` (không `<button>` vì conflict với 3D transform)
  - Framer Motion `animate={{ rotateY: flipped ? 180 : 0 }}` duration 0.5s
  - Inline style `perspective: 1200px` + `transformStyle: preserve-3d` + `backfaceVisibility: hidden` cho front/back
  - Front: word `text-4xl tracking-tight`, IPA `font-mono`, POS pill, hint "Bấm Space hoặc click để lật"
  - Back: word + IPA + CEFR sky badge, first definition (en+vi), first example, mnemonic amber softened
- `src/components/review/review-session.tsx` (128 line):
  - 4 rating buttons với color tone (red/amber/emerald/sky) + `<kbd>` hint
  - `useEffect` bootstrap store từ `initialQueue` prop một lần
  - `useEffect` push `/review/summary` khi `currentIndex >= queue.length`
  - Global keyboard handler: Space (preventDefault + flip), 1-4 (chỉ khi flipped, ignore khi target là input/textarea)
  - `useTransition` cho rating dispatch + disabled state khi pending
  - Toast Sonner khi `rate()` return error
- `src/app/(app)/review/page.tsx` (RSC, replace placeholder 10-line):
  - `getCurrentUserId() ?? redirect('/login?next=/review')`
  - `getReviewQueue(userId)` → `due + newCards`
  - Empty state nếu cả 2 = 0: `Sparkles` icon + link `/decks` + counter `learnedToday/dailyLimit`
  - Otherwise: header với meta `{due} ôn lại · {new} thẻ mới · {learned}/{limit} hôm nay` + `<ReviewSession initialQueue={all} />`
- `src/app/(app)/review/loading.tsx`: skeleton match flashcard + 4 rating buttons
- `src/app/(app)/review/summary/page.tsx` (client) (103 line):
  - `useReviewSession` selector cho `results` + `reset`
  - Snapshot pattern: `useEffect` snapshot `results` ngay mount, render từ snapshot — tránh blank page khi user click "Học tiếp" → reset()
  - 4 stat cards (Again/Hard/Good/Easy) với tone, total + duration + accuracy %, error count với idempotency note
  - "Học tiếp" (reset + Link /review) + "Về dashboard"

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm test` ✓ 17/17 (BE tests vẫn pass)
- `pnpm build` ✓ 12/12 routes:
  - `/review` ƒ dynamic 38.8 kB / **167 kB** First Load JS (framer-motion + zustand + actions client weight)
  - `/review/summary` ○ static 2.48 kB / 121 kB First Load JS

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                             |
| ------ | --------- | ------------------------------------------------ |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                    |
| dev    | `311feb3` | Tuần 3 chunk 2 /review FE shell merged           |
| be     | `70d9780` | sync chunk 2 (cho BE đọc submitReview signature) |
| fe     | `3206996` | base chunk 2 /review FE shell                    |

---

**Next step session sau (Tuần 3 chunk 3 — Terminal Inline Cloze):**

1. Vào `fe` branch
2. Build `<ClozeCard>` thay `<FlashcardFlip>` làm primary trong `<ReviewSession>`:
   - State machine: `locked → typing → unlocked`
   - Locked: 1 câu ví dụ với từ bị đục lỗ `[>_     ]` + VN dịch mờ backdrop-blur
   - Active typing: arrow keys nav (cần điều chỉnh keyboard handler), focus auto vào input, real-time char check
   - Unlocked: play `audio_url` (nếu có) + neon glow + glassmorphism reveal IPA + collocations + 2 examples còn lại, 2s sau auto-collapse + focus card kế
3. Difficulty auto theo CEFR card.cefrLevel:
   - A1 → first+last visible (`e____l` cho `ephemeral`)
   - A2 → first+vowels visible (`e_h_m_r_l`)
   - B1+ → full đục lỗ
4. Hint key `?` reveal 1 letter (-1 effective grade)
5. Grade mapping: full chính xác lần đầu → Rating.Easy hoặc Good (tùy speed), hint → Hard, bỏ cuộc → Again
6. Add `persist` middleware cho Zustand (localStorage) để resume mid-session khi reload

**Critical paths cần đọc khi vào chunk 3:**

- `src/components/review/flashcard-flip.tsx` — pattern client component đã có, copy structure
- `src/components/review/review-session.tsx` — swap `<FlashcardFlip>` thành `<ClozeCard>` (hoặc conditional dựa trên difficulty/audio availability)
- `src/stores/review-session.ts` — `rate()` API đã sẵn, Cloze chỉ cần đếm hints/typos → quyết grade
- `src/features/srs/fsrs.ts` — `Rating` enum, `rate()` signature
- Schema `cards.audio_url` đã exist nhưng content P0 hiện tại chưa fill — cần seed thêm audio hoặc dùng Web Speech API `speechSynthesis` fallback

**Lưu ý tech:**

- Bundle size `/review` 167 kB — chấp nhận được nhưng nếu chunk 3 add nhiều animation/audio thư viện thì cẩn thận. Có thể lazy load Cloze component.
- Zustand store hiện tại KHÔNG persist — nếu user F5 mid-session, mất hết. Acceptable cho MVP (session ngắn 5-10 phút), nhưng add `persist({ name: 'review-session', storage: localStorage })` cho UX tốt hơn.
- `cardStartedAt` reset mỗi card → đo time từ khi advance, KHÔNG từ khi flip. Có thể chính xác hơn nếu đo từ khi flip (= time user thực sự xem). Có thể tinh chỉnh sau.

---

## 2026-05-12 (tối) — be → dev → fe — Claude Opus 4.7 (Tuần 3 SRS BE foundation: fsrs + queue + submitReview + 17 tests)

**Mục tiêu session**: bắt đầu Tuần 3 — BE foundation cho SRS. Wire `ts-fsrs` (đã có sẵn trong deps), viết `features/srs/`, server action `submitReview` với idempotency, vitest tests. Để dành Cloze UI cho session FE kế tiếp.

**Đã hoàn thành (commit `87da8ef` trên be → merge `ae89cb2` lên dev → sync `eb844d0` xuống fe):**

**Schema confirmed (đọc `src/lib/db/schema.ts`):**

- `user_cards` đã có đủ FSRS fields: `stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, lastReview, due, suspended, fsrsVersion`
- `review_logs.clientReviewId` (notNull) có unique index `(userId, clientReviewId)` cho idempotency
- `cardStateEnum` ('new', 'learning', 'review', 'relearning') khớp ts-fsrs State enum
- `reviewTypeEnum` có 'typing' sẵn cho Cloze mode
- `profiles.dailyNewCards` (default 20), `profiles.timezone` (default 'Asia/Ho_Chi_Minh')
- `ts-fsrs ^4.4.6` đã cài (resolved 4.7.1), `zustand`, `framer-motion`, `date-fns-tz` cũng sẵn

**Files mới:**

- `src/features/srs/fsrs.ts` (140 line):
  - `DB_TO_FSRS_STATE` / `FSRS_TO_DB_STATE` enum mapping bidirectional
  - `toFsrsCard(card)` / `fromFsrsCard(fsrsCard)` — chuyển đổi shape giữa DB và ts-fsrs
  - `rate(current, rating, now)` → `{ next: SrsUpdate, fsrsLog: { stateBefore, stateAfter, scheduledDays, elapsedDays, stability, difficulty } }`
  - `initialFsrsState(now)` — FSRS defaults cho user_card mới (match DB defaults)
  - Singleton FSRS instance với `enable_fuzz: true, enable_short_term: true`
- `src/features/srs/queue.ts` (100 line):
  - `getReviewQueue(userId, now)` → `{ due: ReviewQueueItem[], newCards: ReviewQueueItem[], meta: { dueCount, newAvailable, newLearnedToday, dailyNewLimit, timezone } }`
  - Due reviews: `state ≠ 'new' AND due ≤ now AND !suspended`, order `due ASC`
  - New cards: `state = 'new'`, order `createdAt ASC`, LIMIT `dailyNewLimit - learnedToday`
  - `learnedToday` đếm `user_cards WHERE state ≠ 'new' AND reps = 1 AND lastReview ≥ todayStart(UTC từ profile.timezone)`
- `src/features/srs/queue-utils.ts` (17 line): pure helpers `computeNewRemaining` + `dayStartUtc` (extract để test không phải khởi tạo DB client — `db/client.ts` throws nếu thiếu DATABASE_URL ở module load)
- `src/features/srs/actions.ts` (164 line): `submitReview(input)` server action:
  - Input schema (zod): `{ userCardId, rating (Grade 1-4), clientReviewId, durationMs?, reviewType? }`
  - Idempotency: check existing `review_logs` by `(userId, clientReviewId)` trước, return `{ idempotent: true }` nếu trùng (kèm nextDue/nextState từ user_card hiện tại)
  - Validate user_card thuộc về userId
  - Compute next state qua `rate()`, transaction update `user_cards` + insert `review_logs` với `state_before`/`state_after` jsonb audit
  - `revalidatePath('/review')` + `revalidatePath('/dashboard')`
  - Return `{ ok: true, idempotent, nextDue, nextState, reps, lapses }`
- `vitest.config.ts`: node env, include `src/**/*.{test,spec}.{ts,tsx}`, alias `@` → `src`
- `src/features/srs/fsrs.test.ts` (132 line, 9 tests):
  - State mapping roundtrip cho 4 DbCardState
  - `fromDbState('new')` = `State.New`, `fromDbState('review')` = `State.Review`
  - `initialFsrsState`: state='new', reps=0, lapses=0, stability=0, difficulty=0
  - Rate new card: Again → learning + reps=1 + due ≤ 10min; Easy → review + reps=1 + due ≥ 1 day; Good → learning or review + reps=1
  - Rate review card: Again → relearning + lapses=1; Good → stays review + scheduledDays grows
  - `lastReview` luôn = now sau rating
- `src/features/srs/queue.test.ts` (44 line, 8 tests):
  - `computeNewRemaining`: 20-0=20, 20-7=13, 20-25=0, 0-5=0
  - `dayStartUtc`: Asia/Ho_Chi_Minh 14:30 ICT → `2026-05-11T17:00:00Z`, UTC noon → `2026-05-12T00:00:00Z`, just-past-midnight ICT boundary
- `package.json` scripts: `test`, `test:watch`, `test:ui`; devDeps `vitest@^4.1.6 + @vitest/ui@^4.1.6`

**Verify đã chạy:**

- `pnpm test` ✓ 17/17 pass, 2 files, 4.78s
- `pnpm typecheck` ✓ 0 errors (sau khi fix destructure trên count query: `const [{ n }] = await db.select(...)` → `const rows = ...; const n = rows[0]?.n ?? 0`)
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 10/10 routes (route `/review` vẫn placeholder 157 B — sẽ wire ở session FE kế tiếp)

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                                     |
| ------ | --------- | -------------------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                            |
| dev    | `ae89cb2` | Tuần 3 BE foundation merged + 17 tests pass              |
| be     | `87da8ef` | base Tuần 3 BE foundation                                |
| fe     | `eb844d0` | sync Tuần 3 BE foundation (ready cho /review UI session) |

---

**Next step gợi ý cho session AI sau (Tuần 3 chunk 2 — FE shell):**

1. Switch sang `fe` branch
2. Build `/review` page (RSC fetch queue qua `getReviewQueue`):
   - Empty state nếu `due.length === 0 && newCards.length === 0`
   - Hiển thị meta (due count + new count + daily limit progress)
   - Render danh sách cards stack hoặc 1 card tại 1 thời điểm (cần quyết)
3. Zustand store `src/stores/review-session.ts`:
   - State: `currentIndex, ratings: Map<userCardId, rating>, startedAt, durationMs per card`
   - Actions: `next()`, `rate(rating)` (call submitReview), `restart()`
4. Wire `submitReview` action từ FE — generate `clientReviewId` qua `crypto.randomUUID()` cho mỗi rating-attempt
5. Flashcard flip placeholder (chưa Cloze yet) — đơn giản: word → flip → meaning + 4 rating buttons (1-4)
6. Sau khi flip + queue chạy ổn → mở Chunk 3 Terminal Cloze

**Critical paths cần đọc ở session FE:**

- `src/features/srs/queue.ts` — type `ReviewQueue` + `ReviewQueueItem`
- `src/features/srs/actions.ts` — `submitReview` signature + return shape
- `src/features/srs/fsrs.ts` — `Rating` enum re-export
- `src/components/decks/card-preview.tsx` — pattern collapsible client component, reuse cho flashcard
- `src/app/(app)/decks/[col]/[topic]/[lesson]/page.tsx` — pattern RSC + client interactivity wiring

**Lưu ý tech:**

- `db/client.ts` line 12-14 throws ở module load nếu `DATABASE_URL` thiếu — pure helpers phải tách ra file riêng không import `db` (đã làm với `queue-utils.ts`)
- `crypto.randomUUID()` available trong browser nếu HTTPS hoặc localhost — OK cho dev + Vercel prod
- Vitest 4.1.6 (latest) + Node 22.14 — peer dep warning `vite 8 wants esbuild ^0.27.0 || ^0.28.0` (found 0.19.12 từ drizzle-kit) — không ảnh hưởng

---

## 2026-05-12 (chiều) — fe → dev → be — Claude Opus 4.7 (Tuần 2 FE polish: render bug fixed + UI tinh chỉnh + Cloze ideated cho Tuần 3)

**Mục tiêu session**: fix render bug `/decks` "missing required error components" + polish UI 3 routes `/decks/*` (typography, spacing, 2-col grid, dark mode tones, empty state, skeleton). Ghi nhận ý tưởng Terminal-style Inline Cloze cho Tuần 3.

**Đã hoàn thành (commit `78d8bdd` trên fe → merge `ff527be` lên dev):**

**Render bug fix:**

- CREATE `src/app/(app)/error.tsx` — Client Component error boundary với `RefreshCcw` button "Thử lại", show error.message + digest trong dev mode, generic msg trong prod.
- CREATE `src/app/(app)/loading.tsx` — top-level skeleton.
- CREATE route-level `loading.tsx` cho `/decks`, `/decks/[col]`, `/decks/[col]/[topic]/[lesson]` — skeleton match đúng layout từng route.
- CREATE `src/components/ui/skeleton.tsx` — shadcn-style primitive (`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800`).

**UI polish:**

- `/decks/page.tsx`: heading thêm explicit contrast `text-zinc-900 dark:text-zinc-50`, description `leading-relaxed`, card collection title `tracking-tight`, empty state với `BookOpen` icon centered.
- `/decks/[col]/page.tsx`: topic header bump `text-lg → text-xl tracking-tight` + icon `h-4 → h-5`, section spacing `space-y-8 → space-y-10`, divider mềm `divide-zinc-100 dark:divide-zinc-900`, lesson title `tracking-tight`, lesson meta `mt-0.5 → mt-1`, empty state có `Layers` icon.
- `/decks/[col]/[topic]/[lesson]/page.tsx`: container `max-w-3xl → max-w-5xl`, cards `space-y-3 → grid items-start gap-3 lg:grid-cols-2` (desktop 2-col, tablet/mobile 1-col), thêm empty state cho `cards.length === 0`.
- `card-preview.tsx`: mnemonic amber chuyển từ `bg-amber-50/...amber-900` solid → `bg-amber-50/60 ring-1 ring-amber-100 text-amber-950` (dịu hơn dark mode), CEFR badge `blue-100 → sky-100` (đỡ chói).

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ 10/10 static pages, lesson detail 2.53 kB / 129 kB First Load (tăng 0.02 kB vì thêm `BookOpen` icon import).

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                                               |
| ------ | --------- | -------------------------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)                      |
| dev    | `ff527be` | Tuần 2 FE polish merged + Cloze ideation (TRACKER) |
| be     | `8e90de0` | sync Tuần 2 FE polish (post merge)                 |
| fe     | `78d8bdd` | base Tuần 2 FE polish                              |

---

**📝 Ý tưởng Cloze cho Tuần 3 (đã ghi TRACKER, chưa code):**

User design **Terminal-style Inline Cloze** làm primary mode `/review` thay flashcard flip:

- **Locked**: 1 câu ví dụ với từ bị đục lỗ `[>_      ]` + nghĩa VN mờ (backdrop-blur) làm hint.
- **Active typing**: arrow keys nav, focus auto vào input, real-time char check (đúng → trắng, sai → shake + nháy đỏ).
- **Unlocked**: phát `audio_url` + neon glow + glassmorphism reveal IPA/collocations/2 examples còn lại, 2s sau auto-collapse + focus card kế.
- **Difficulty auto theo CEFR**: A1 → first+last `e_____l`, A2 → first+vowels, B1+ → full word. Hint `?` reveal 1 letter (-1 grade).
- **FSRS mapping**: full đúng → 3-4, có hint → 2, fail → 1.

**Tech sẽ cần (audit Tuần 3):**

- Kiểm tra `cards.audio_url` field đã có trong schema (blueprint 3.1 mục `cards`)
- Web Audio API hoặc `<audio>` element cho playback
- `useReducer` hoặc Zustand cho per-card state machine (locked → typing → unlocked)
- Framer Motion + Tailwind `backdrop-blur` cho glassmorphism
- Global keyboard handler (arrow keys, char input, `?` hint, `Escape` quit)

**Critical paths cần đọc khi vào session Tuần 3:**

- `src/lib/db/schema.ts` — verify `cards.audio_url` + ts-fsrs state fields (`due, stability, difficulty, elapsed, scheduled, reps, lapses, state, learning_steps`)
- `src/features/vocab/queries.ts` — pattern cho `getReviewQueue(userId)` mới
- `src/app/(app)/decks/[col]/[topic]/[lesson]/page.tsx` — example RSC + client interactivity wiring để follow cho `/review`

**Next step gợi ý cho session AI sau:**

1. User chạy `pnpm dev` (kill PID 1736 nếu còn) → mở `http://localhost:3000/decks` verify visual mới (2-col grid, mnemonic dịu, skeleton loading, error boundary).
2. Nếu user nói "ưng rồi" → mở **Tuần 3 SRS Core**:
   - `pnpm add ts-fsrs zustand framer-motion`
   - Scaffold `src/features/srs/{fsrs.ts,queue.ts,session.ts}`
   - Page `/review` với Terminal Cloze prototype (single card trước, mở rộng sau)
3. Nếu user còn muốn polish thêm `/decks` → đợi feedback cụ thể.

---

## 2026-05-12 — fe → dev → be — Claude Opus 4.7 (Tuần 2 FE /decks built — UI polish PENDING)

**Mục tiêu session**: gen P0 content batch (3 lessons / 60 cards) + build `/decks` UI để có golden path: login → /decks → /decks/[col] → /decks/[col]/[topic]/[lesson] → enroll.

**Đã hoàn thành:**

Content P0 (commits `83dc6e1`, `3a2eb17`, `2bb295e` trên be):

- `daily-life/family` +15 cards (đủ 20 cards, A1×18 + A2×2)
- `daily-life/food-meals` (20 cards mới, A1×18 + A2×2) — ngữ cảnh phở/cơm tấm/bún chả/bánh mì
- `daily-life/home-rooms` (20 cards mới, A1×17 + A2×3) — ngữ cảnh nhà ống Phố cổ, chung cư Sài Gòn
- Live seed Supabase: **1 / 1 / 3 / 60** (collections / topics / lessons / cards)

FE `/decks` (commit `0156c17` trên fe → merge `6bc6448` lên dev):

- `src/features/vocab/queries.ts`: `listOfficialCollections` (with topic/lesson counts), `getCollectionBySlug` (topics+lessons nested), `getLessonByPath` (3-table join + cards), `getEnrolledLessonIds(userId)`.
- `src/features/vocab/enrollment.ts`: server action `enrollLesson(formData)` — `requireUserId` → `ensureProfile` → insert `user_lessons` (onConflictDoNothing) → bulk insert `user_cards` (FSRS defaults state=new, due=now, onConflictDoNothing on `(user_id, card_id)`) → `revalidatePath('/decks', 'layout')` + `/dashboard` + `/review`.
- 3 RSC pages:
  - `/decks`: grid official collections với badges (count topic/lesson, CEFR range, Official).
  - `/decks/[col]`: sections per topic + lesson list, mark "Đang học" nếu enrolled.
  - `/decks/[col]/[topic]/[lesson]`: header + EnrollButton + 20 CardPreview.
- Client components:
  - `CardPreview` (`components/decks/card-preview.tsx`): collapsible, hiển thị word + IPA mono + pos badge + CEFR badge + 1 dòng nghĩa Việt khi đóng; expand → definitions (en+vi) + 3 examples + synonyms/antonyms/collocations + mnemonic vàng + etymology italic.
  - `EnrollButton` (`components/decks/enroll-button.tsx`): `useTransition` + sonner toast, disabled "Đang học" với check icon nếu đã enrolled.

**Verify đã chạy:**

- `pnpm typecheck` ✓ 0 errors
- `pnpm lint` ✓ 0 warnings
- `pnpm build` ✓ tất cả `/decks/*` routes compile sạch, `/decks/[col]/[topic]/[lesson]` 2.51 kB / 129 kB First Load JS (client interactivity weight).
- HTTP smoke-test: `/login` → 200, `/decks` → 307 redirect `/login?next=/decks` (middleware auth gate đúng).

**Trạng thái nhánh (sau cycle):**

| Branch | SHA       | Note                            |
| ------ | --------- | ------------------------------- |
| main   | `5fbd1c0` | v0.1.0-foundation (không đổi)   |
| dev    | `6bc6448` | Tuần 2 FE merged, sẵn sàng test |
| be     | `354d89a` | sync Tuần 2 FE (post merge)     |
| fe     | `0156c17` | base Tuần 2 FE                  |

---

**⚠️ BLOCKER cho ngày mai (CHƯA FIX):**

User chạy `pnpm dev`, mở `http://localhost:3001/decks` (port 3001 vì 3000 bị stale node.exe PID 1736 chiếm) thì **không render page**, chỉ thấy thông báo Next.js dev mode `"missing required error components, refreshing..."`.

User feedback ngắn: "UI cần phải fix vì vẫn chưa ưng lắm". Hand-off để tiếp tục.

**Hypothesis ưu tiên debug ngày mai (test theo thứ tự):**

1. **Stale node process trên port 3000** (PID 1736 từ 01:23 cùng ngày — leftover từ một `pnpm dev` session trước đó). Có thể đây là dev server cũ đang chạy code lỗi thời. Kill trước khi debug khác:

   ```powershell
   taskkill /PID 1736 /F
   ```

   Sau đó `pnpm dev` lại từ thư mục project → kỳ vọng bind được port 3000 với code mới.

2. **Thiếu error.tsx / loading.tsx boundary trong `(app)` group**. Next 15 streaming RSC dev mode thường yêu cầu explicit error boundary; thiếu sẽ show `"missing required error components, refreshing..."` rồi loop. Tạo 2 file:
   - `src/app/(app)/error.tsx` (Client Component, props `{ error, reset }`, render lỗi + retry button)
   - `src/app/(app)/loading.tsx` (Skeleton 3-4 row)

3. **Compile time first hit**: lần đầu mở `/decks` Next phải compile route + tất cả dependencies (drizzle, postgres-js, ...). Có thể mất 10-30s trên Windows. Đợi ~30s sau khi page chuyển trắng xem có resolve không. Nếu vẫn loop sau >1 phút → bug khác.

4. **RSC streaming error trong queries**: nếu `listOfficialCollections` throw (vd connection pool timeout pgBouncer), không có error boundary thì Next dev sẽ stuck. Add `try/catch` log ở queries hoặc check dev server stderr.

5. **Đã verify `pnpm build` pass production** — nếu cần đảm bảo route logic đúng, chạy `pnpm build && pnpm start` để bypass dev mode hooks, sẽ thấy page render thật.

**UI polish backlog** (user muốn tinh chỉnh):

- Typography hierarchy (heading size, weight, tracking)
- Spacing density (card padding, list gaps)
- Mobile responsive (collections grid sm:grid-cols-2 OK, lesson detail cần review)
- Dark mode contrast (zinc palette OK; mnemonic amber có thể chói)
- IPA font (đang dùng `font-mono` của system — có thể wire `IBM Plex Mono` hoặc `JetBrains Mono`)
- Card preview density: 20 cards stack dài, có thể cân nhắc 2-col grid trên desktop hoặc virtual scroll
- Empty state design (chưa có)
- Skeleton loading state (thiếu — cũng giải quyết hypothesis #2)

**Critical paths cần đọc khi vào session mới:**

- `src/features/vocab/queries.ts` (read helpers, có thể là nguồn lỗi RSC)
- `src/features/vocab/enrollment.ts` (server action insert user_lessons + bulk user_cards)
- `src/app/(app)/decks/page.tsx` + `[col]/page.tsx` + `[col]/[topic]/[lesson]/page.tsx`
- `src/components/decks/card-preview.tsx` + `enroll-button.tsx`
- `src/middleware.ts` + `src/lib/supabase/middleware.ts` (auth gate)

**Next step gợi ý cho session AI sau:**

1. Hỏi user: đã kill PID 1736 / restart máy chưa? Đang ở browser nào?
2. `pnpm dev`, đợi `Ready in Xs` rồi đợi thêm 10s. Mở `/decks` trong browser cùng session đã login (magic link đã verify trước đó).
3. Nếu vẫn lỗi → mở DevTools Network/Console, copy lỗi cụ thể. Kiểm tra dev server stderr.
4. Add `error.tsx` + `loading.tsx` boundaries (Hypothesis #2) — luôn cần cho prod UX dù không phải nguyên nhân chính.
5. Sau khi page render → user feedback cụ thể về UI polish → tinh chỉnh từng item trong backlog trên.
6. Sau khi `/decks` golden path xanh + UI ưng → mở Tuần 3 SRS hoặc tiếp P1 content batch.

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
