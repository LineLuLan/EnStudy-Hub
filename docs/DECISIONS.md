# Architecture Decision Records (ADR)

> **Quy ước**: Mỗi quyết định kỹ thuật quan trọng → 1 entry mới, gắn ID liên tiếp.
> Format ngắn: Bối cảnh → Quyết định → Lý do → Hậu quả.

---

## ADR-001 — Branch model 4 nhánh `main`/`dev`/`be`/`fe`

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: Solo dev, dùng AI agent như cộng tác viên BE/FE. Cần tách context để 1 session AI không trộn lẫn schema + UI.

**Quyết định**: 4 nhánh long-running. BE/FE → `dev` (merge commit, no squash). `dev → main` khi release. Không rebase.

**Lý do**:

- History rõ ràng "BE và FE meet ở đâu" → dễ debug regression.
- Tách prompt cho AI: 1 session chỉ focus 1 nhánh, đỡ loãng context.
- `dev` làm staging trước khi production.

**Hậu quả**:

- Phải sync `dev → be`/`fe` thường xuyên (mỗi sau merge vào dev) tránh divergence.
- Có overhead so với GitHub Flow đơn giản nhưng phù hợp với mô hình AI-assisted.

---

## ADR-002 — Phase 0 scaffold làm full trên `dev`, không split `be`/`fe`

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: Phase 0 chủ yếu là infra (configs, schema, tooling) dùng chung BE/FE.

**Quyết định**: Mọi setup Phase 0 commit trên `dev`, sau đó merge `dev → be` và `dev → fe` cùng lúc.

**Lý do**: Không có code "BE-only" hay "FE-only" thuần ở Phase 0. Tách sớm tốn công, dễ conflict.

**Hậu quả**: Từ Tuần 2 trở đi mới thực sự split branch theo nature of work.

---

## ADR-003 — Drizzle schema làm full ngay Phase 0, không làm dần

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: Blueprint Phần 3.1 đã có schema hoàn chỉnh. Nếu làm dần, mỗi lần thêm bảng → regenerate migration → rebase nightmare giữa nhánh.

**Quyết định**: Copy full schema blueprint 3.1 vào `src/lib/db/schema.ts` ngay Phase 0, kể cả khi chưa connect DB.

**Lý do**: Migration history là `append-only`. Schema final ngay từ đầu = chỉ 1 migration `0000_init.sql` cho toàn MVP. Nếu cần thêm bảng sau, generate migration mới (không sửa cũ).

**Hậu quả**: TypeScript types có sẵn cho FE consume từ Tuần 2. Phải chăm chú không sai schema lần đầu.

---

## ADR-004 — Content gen offline, không gọi LLM runtime

**Date**: 2026-05-11
**Status**: Accepted (theo blueprint Phần 0 nguyên tắc 1)

**Bối cảnh**: User tự gen content tiếng Việt bằng Claude desktop free. Mỗi từ ~2-3 example + IPA + mnemonic.

**Quyết định**: Mọi content vào `content/collections/*.json`, version trong git. `scripts/seed.ts` upsert vào DB. Không có code path nào gọi Anthropic/OpenAI API runtime.

**Lý do**:

- Chi phí $0.
- Deterministic, reproducible.
- Có thể review content qua git diff trước khi merge.

**Hậu quả**: Khi muốn AI tutor realtime → Post-MVP, sau khi có revenue.

---

## ADR-005 — Cross-check content qua Free Dictionary API + Wiktionary

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: LLM gen có thể sai IPA / POS / nghĩa cơ bản. Cần guard rail.

**Quyết định**: Sau khi gen JSON, chạy `scripts/validate-content.ts`:

1. Validate JSON schema bằng Zod.
2. Gọi `https://api.dictionaryapi.dev/api/v2/entries/en/<word>` (free, no key) — so IPA + POS.
3. Output `docs/CONTENT_REPORT.md` (gitignored): từ nào lệch để user review thủ công.

**Lý do**: 2 nguồn (LLM + reference dict) > 1 nguồn. Tăng độ tin cậy mà không tốn xu nào.

**Hậu quả**: Cần network khi validate. Có thể cache response. Free Dictionary API không có rate limit công bố nhưng nên throttle ~1 req/s.

---

## ADR-007 — `auth.users` declared in schema.ts nhưng KHÔNG migrate

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: Drizzle pgSchema('auth').table('users') ở `src/lib/db/schema.ts` được dùng làm FK target cho profiles/userCards/.... Drizzle-kit generate tự sinh `CREATE TABLE IF NOT EXISTS "auth"."users"` trong SQL migration. Supabase đã quản lý `auth.users` thuộc schema lock — pooler user không có permission tạo bảng trong schema `auth` → `pnpm db:migrate` fail với `permission denied for schema auth`.

**Quyết định**: Giữ `authUsers` declaration trong `schema.ts` (cần cho FK typing) NHƯNG manual-edit `0000_breezy_swarm.sql` xoá block `CREATE TABLE "auth"."users"`. FK constraints đến `auth.users(id)` vẫn resolve được vì bảng đã tồn tại từ Supabase Auth.

**Lý do**:

- Drizzle ORM chưa support `external: true` cho pgSchema → không có cách clean để bảo "table này tồn tại sẵn, đừng tạo".
- Alternative (xoá authUsers khỏi schema.ts + dùng raw SQL FK) làm mất type safety và phức tạp hơn.
- Manual edit chỉ 1 lần khi initial migration; future migrations chỉ diff vs snapshot nên không re-emit CREATE.

**Hậu quả**:

- Nếu sau này regen `0000_breezy_swarm.sql` (vd `drizzle-kit drop` + `generate`), phải xoá block auth.users CREATE lại.
- Note inline đã thêm trong SQL file để remind.
- Khi drizzle-orm hỗ trợ external table flag → migrate sang.

---

## ADR-006 — Tham khảo cấu trúc từ luyentu.com, KHÔNG copy nội dung

**Date**: 2026-05-11
**Status**: Accepted

**Bối cảnh**: User gợi ý luyentu.com làm reference cho cách tổ chức bài học.

**Quyết định**: Manual visit luyentu.com → quan sát cách họ chia topic/lesson/card → document pattern vào `CONTENT_PIPELINE.md`. **KHÔNG crawl, KHÔNG copy text/IPA/example.**

**Lý do**: Pattern (structure) không có bản quyền. Nội dung cụ thể (definitions, examples) có thể có bản quyền tác giả.

**Hậu quả**: Cần dành 1-2h khảo sát thủ công + ghi note. Không có rủi ro pháp lý.
