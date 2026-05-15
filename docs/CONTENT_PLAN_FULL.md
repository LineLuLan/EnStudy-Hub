# Content Plan — Full Oxford 3000 Coverage (Post-MVP)

> Master plan để mở rộng từ 14.4% coverage hiện tại lên 100% Oxford 3000. Đặt **chất lượng lên trên tốc độ** — đây là sản phẩm học từ vựng, mỗi card phải đáng học.
>
> **Tình trạng**: 2026-05-16 sau khi đóng MVP P0-P4 (42 lessons / 840 cards). Phân tích coverage tại `docs/COVERAGE_REPORT.md`.

---

## 1. Mục tiêu & tổng quan

| Mốc                        | Lessons | Cards     | Oxford coverage | Trạng thái         |
| -------------------------- | ------- | --------- | --------------- | ------------------ |
| **MVP (P0-P4)**            | 42      | 840       | 14.4%           | ✅ DONE 2026-05-16 |
| **P5 Common Core**         | +10     | +200      | ~22%            | Plan này           |
| **P6 A1 fillers**          | +15     | +300      | ~30%            | Plan này           |
| **P7 A2 expansion**        | +20     | +400      | ~42%            | Plan này           |
| **P8 B1 part 1**           | +25     | +500      | ~55%            | Plan này           |
| **P9 B1 part 2**           | +25     | +500      | ~68%            | Plan này           |
| **P10 B2 expansion**       | +25     | +500      | ~80%            | Plan này           |
| **P11 Phrasal & Compound** | +15     | +300      | ~88%            | Plan này           |
| **P12 Final fill**         | +15     | +300      | **100%**        | Plan này           |
| **Total target**           | **192** | **3,840** | **100%**        |                    |

**Why 192 lessons / 3,840 cards?** Mục tiêu coverage 100% Oxford 3000 (3,846 unique entries), trừ đi ~250 từ đã cover trong 840 cards hiện tại theo strict match + ~244 từ ta thêm vào (multi-word / modern terms) không nằm trong Oxford 3000. Tổng new cards cần: ~3000, tức ~150 lessons mới. Buffer thêm 6-15 lessons cho compound/phrasal/edge cases.

## 2. Database capacity — đủ thoải mái ✅

**Schema** (`src/lib/db/schema.ts`):

- `cards` table: word, lemma, ipa, pos, cefr, **definitions jsonb**, synonyms[], antonyms[], collocations[], etymology, mnemonic
- Storage per card (DB): ~1.5-2 KB compressed (jsonb + indexes)

**Sizing**:

| Mốc        | Cards                                             | DB storage (cards) | + indexes     | Total           | Free tier (500MB) |
| ---------- | ------------------------------------------------- | ------------------ | ------------- | --------------- | ----------------- |
| MVP        | 840                                               | ~1.5 MB            | ~3 MB         | ~4 MB           | 0.8%              |
| P5-P12     | 3,840                                             | ~7 MB              | ~14 MB        | ~22 MB          | 4.4%              |
| + 1k users | 3,840 cards × 1k user_cards = 3.84M rows × ~200 B | —                  | ~800 MB extra | ⚠ scale concern |

**Verdict**:

- ✅ Content tables (cards/lessons/topics): **không lo gì cả** — full Oxford 3000 chiếm ~22 MB DB, < 5% free tier.
- ⚠ `user_cards` table (FSRS state per user × per card) sẽ phình theo (#users × #cards). 1,000 users × 3,840 cards = 3.84M rows → ~800 MB. Cần chuyển Pro plan ($25/mo, 8 GB) khi user base lớn.
- **Hiện tại safe**: 1 user × 3,840 cards = 3,840 rows ~ < 1 MB.

**Action**: không đổi schema. Khi scale user → upgrade Supabase Pro.

## 3. 🎯 Chất lượng bar (BẮT BUỘC mỗi card)

Đây là **app học từ vựng cho người Việt** — mỗi card cần tốt hơn việc dùng từ điển. Quy chuẩn:

### 3.1 Word selection

- ✅ Ưu tiên từ tần suất cao trước (A1 → C1 theo Oxford CEFR map)
- ✅ Mỗi lesson 20 từ thematically related (semantic field hoặc grammatical category)
- ✅ Tránh trùng lặp với 840 cards đã có (check qua `docs/COVERAGE_REPORT.md` "Words in both")
- ✅ Nếu trùng intentional (vd `learn` có cả 2 góc: learning-skills + common-core), ghi rõ trong commit message

### 3.2 IPA

- ✅ British style strict (Received Pronunciation)
- ✅ Slash-wrapped `/.../`
- ✅ Multi-word: IPA từng từ kèm space `/ɪn ˈkɒntrɑːst/`
- ✅ Phụ âm cuối (r) optional `/ˈsɪstə(r)/`
- ❌ KHÔNG mix US/UK trong cùng card
- ❌ KHÔNG dùng IPA simplified (vd `/lov/`)

### 3.3 Definitions

- ✅ `meaning_en`: ngắn, đơn giản, **không copy nguyên Oxford/Cambridge/Longman**
- ✅ `meaning_vi`: mượt như người Việt viết, ngăn `;` nếu nhiều nghĩa con
- ✅ 1 definition / card cho từ đơn nghĩa; 2 defs cho từ đa nghĩa thực sự quan trọng
- ❌ KHÔNG dịch máy stiff (vd "to make use of" → "làm dùng" thay vì "sử dụng")
- ❌ KHÔNG định nghĩa lòng vòng (vd "a teacher is someone who teaches")

### 3.4 Examples (3 per definition)

- ✅ Câu thật natural — đọc to nghe như người bản xứ nói
- ✅ **Bối cảnh Việt Nam đậm**: Hà Nội, Sài Gòn, Đà Lạt, Huế, Hội An, Sa Pa, Phú Quốc, Vinhomes, Vincom, Vietcombank, MB Bank, Techcombank, Grab, Shopee, Tiki, ĐH Bách Khoa, RMIT, Bệnh viện Bạch Mai, phở, bánh mì, áo dài, Tết, Tết Trung Thu, đá cầu, lì xì, etc.
- ✅ Mỗi câu 1 ngữ cảnh khác — không lặp 3 câu cùng frame
- ✅ Câu thứ 1: hội thoại / câu nói thông thường
- ✅ Câu thứ 2: bối cảnh chuyên (work / school / family)
- ✅ Câu thứ 3: idiomatic hoặc câu mang sắc thái
- ❌ KHÔNG "She is happy" / "He goes to school" — lặp khuôn cấp 2
- ❌ KHÔNG dùng tên Anh-Mỹ trong example trừ khi chủ ý so sánh văn hoá

### 3.5 Mnemonic Vi (mẹo nhớ)

- ✅ Wordplay theo âm tiếng Việt: vd `STUDY → 'sờ Túi Đi' học có sách trong túi`
- ✅ Image association: vd `BAMBOO → 'bám bù' đâm thẳng đứng = tre`
- ✅ Compound breakdown: vd `GRANDFATHER = GRAND + FATHER → ông`
- ✅ Etymology gợi nhớ: vd `JOURNALIST = JOURNAL (báo) + IST (người) → nhà báo`
- ❌ KHÔNG "S-T-U-D-Y viết tắt" lạnh
- ❌ KHÔNG mnemonic dài, lan man — 1 câu vibe-y là đủ
- 🎯 **Tone**: gần gũi, hơi tinh nghịch, dễ nhớ. Test nhanh: đọc to lên, có buồn cười / có visual không?

### 3.6 Etymology

- ✅ 1-2 câu narrative, kể nguồn (Old English / Latin / Greek / Old French / Sanskrit / etc.)
- ✅ Bonus: thêm 1 detail thú vị (vd "calculus = pebble used to count")
- ❌ Không liệt kê khô khan "PIE root \*XYZ"

### 3.7 Synonyms / antonyms / collocations

- ✅ Synonyms cùng CEFR level (vd B1 word → synonyms cùng B1)
- ✅ 0-3 synonyms, 0-2 antonyms — không nhồi
- ✅ Collocations: 4-5 cụm THẬT natural (test: native có nói không?)
- ❌ KHÔNG nhồi từ hiếm để show off
- ❌ KHÔNG dịch literal collocation (vd "do the math" ≠ "làm toán học")

### 3.8 POS chuẩn schema

- ✅ POS = 1 trong 10 enum: `noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection, determiner, auxiliary`
- ✅ Multi-word phrase POS = từ chính (vd "in contrast" = adverb, "fossil fuel" = noun)
- ✅ Cross-check với dictionaryapi.dev khi cần (qua `pnpm validate:content`)

## 4. Phase breakdown

### Phase 5 — Common Core (10 lessons / 200 cards) — A1-A2

**Topic mới**: `common-core` (order_index 11, icon `blocks`, color `#64748b`)

| #   | Lesson                  | CEFR mix      | Loại từ                                                                                     |
| --- | ----------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| 1   | articles-determiners    | A1×15 + A2×5  | a, an, the, this, that, some, many, every, all, no, each, another, both, either, neither, … |
| 2   | pronouns-basic          | A1×15 + A2×5  | I, you, he, she, we, they, me, him, my, his, ours, myself, …                                |
| 3   | prepositions-place      | A1×15 + A2×5  | in, on, at, by, into, near, between, behind, above, below, beside, inside, …                |
| 4   | prepositions-time-other | A1×10 + A2×10 | for, with, of, about, before, after, during, until, against, towards, …                     |
| 5   | conjunctions-basic      | A1×10 + A2×10 | and, but, or, so, if, when, then, while, that, as, unless, whether, …                       |
| 6   | core-be-do-have         | A1×20         | be, am, is, are, was, were, do, does, did, have, has, had, will, would, can, …              |
| 7   | core-action-verbs       | A1×20         | make, take, get, go, come, give, put, find, see, look, want, work, play, …                  |
| 8   | core-mental-verbs       | A1×10 + A2×10 | know, think, feel, say, tell, ask, hope, hear, remember, forget, agree, decide, …           |
| 9   | core-adjectives         | A1×15 + A2×5  | good, bad, big, small, new, old, easy, hard, nice, important, fast, free, …                 |
| 10  | core-adverbs            | A1×15 + A2×5  | very, really, always, never, often, sometimes, usually, now, then, here, …                  |

### Phase 6 — A1 fillers (15 lessons / 300 cards)

**Mục tiêu**: cover toàn bộ A1 còn thiếu trong Oxford 3000 (~150-200 từ A1) + thêm A2 cùng topic.

**Topics mới hoặc mở rộng**:

- `common-core/numbers-quantities-ext` (large numbers, fractions, percentages)
- `common-core/colors-shapes` (color, red, blue, green, shape, round, square, …)
- `common-core/basic-time-words` (today, yesterday, tomorrow, week, month, year, …) — bổ sung time-numbers
- `daily-life/body-health-ext` (head, hand, foot, eye, ear, hurt, sick, doctor, …) — bổ sung body-health hiện có
- `daily-life/food-cooking` (cook, fry, boil, bake, hot, cold, taste, smell, …) — mở rộng food-meals
- Cộng thêm 9-10 lessons khác phủ A1 verbs/adj còn thiếu

### Phase 7 — A2 expansion (20 lessons / 400 cards)

Tăng cường A2 trên các topic đã có và mở topic mới:

- `daily-life/shopping-money` (shop, buy, sell, price, expensive, cheap, change, receipt, …)
- `daily-life/transport-traffic` (mở rộng places-travel)
- `people/feelings-extended` (proud, ashamed, jealous, lonely, anxious, …)
- `work-business/email-communication` (write, send, reply, attach, cc, bcc, subject, …)
- `education/study-techniques` (note, summary, highlight, outline, draft, revise, …)
- … (~14 more A2 lessons)

### Phase 8 — B1 part 1 (25 lessons / 500 cards)

B1 vocabulary trên 8-10 semantic fields:

- `abstract/quality-quantity` (degree, amount, level, scale, range, …)
- `abstract/change-process` (alter, transform, develop, evolve, gradual, sudden, …)
- `society/social-issues` (poverty, inequality, opportunity, …)
- `technology/digital-life` (app, website, password, account, download, upload, …)
- … (~20 more)

### Phase 9 — B1 part 2 (25 lessons / 500 cards)

Tiếp B1, focus areas chưa cover:

- `science/everyday-science` (gravity, energy, force, mass, …)
- `health/wellness` (mental, stress, anxiety, therapy, …)
- `business/marketing` (brand, product, customer, advertise, …)
- `culture/lifestyle` (trend, lifestyle, generation, era, …)

### Phase 10 — B2 expansion (25 lessons / 500 cards)

B2 across all topics:

- Academic verbs (illustrate, demonstrate, indicate, suggest, imply, …)
- Linking & discourse markers (provided, given, supposing, suppose, …)
- Abstract nouns (concept, framework, paradigm, principle, …)
- Formal vocabulary (notwithstanding, hereby, hence, thus, …)
- Idiomatic phrases (take into account, on the grounds that, …)

### Phase 11 — Phrasal verbs & compounds (15 lessons / 300 cards)

Multi-word entries từ Oxford 3000:

- Phrasal verbs: give up, look for, take off, set up, find out, put on, work out, run out, …
- Set phrases: in fact, no doubt, of course, on the whole, in particular, …
- Compounds: living room, fire engine, swimming pool, …

### Phase 12 — Final fill (15 lessons / 300 cards)

Quét cleanup các từ Oxford 3000 còn thiếu sau P5-P11:

- Specialized vocabulary
- Less common but listed words
- Re-check coverage script, fill gaps to 100%

## 5. Workflow per phase

### 5.1 Trước phase

1. Chạy `pnpm validate:content` → check coverage report
2. Đọc `docs/COVERAGE_REPORT.md` → list missing words còn lại
3. Group missing words theo POS + semantic field → đề xuất lesson list
4. Brief lesson breakdown (slugs + wordlists) — confirm với user trước khi gen

### 5.2 Trong phase

1. Tạo topic meta JSON (nếu topic mới)
2. Gen 20 cards / lesson theo chất lượng bar mục 3
3. Schema validate inline (Zod) sau mỗi lesson
4. Cross-check IPA/POS với dictionaryapi.dev (acceptable: stylistic differences)
5. Track collisions với existing 840 cards — note rõ angle riêng nếu có

### 5.3 Sau phase

1. 1 commit feat(content) per topic (hoặc 1 commit gom nếu nhỏ)
2. Sync `be → dev → fe` `--no-ff`
3. Gates green: `pnpm typecheck && pnpm test && pnpm lint`
4. `pnpm seed` → upsert lên Supabase (idempotent)
5. Re-run coverage script → bump % trong TRACKER + plan này
6. Append entry vào `docs/HANDOFF.md`
7. Topic meta update nếu thêm lesson vào topic cũ

## 6. Risks & mitigations

| Risk                                                           | Mitigation                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Context window quá tải (200+ lessons × 600 lines = 120k+ dòng) | Tách phase nhỏ, mỗi session 1-2 phase. Compact transcript giữa các phase.                           |
| Chất lượng giảm dần khi gen nhiều                              | Re-read chất lượng bar mục 3 mỗi đầu lesson. Spot-check random card mỗi 5 lessons.                  |
| Trùng từ vô ý                                                  | Trước mỗi lesson, grep `content/collections/oxford-3000` xem từ đã có chưa.                         |
| IPA mâu thuẫn US/UK                                            | Mặc định British. Khi nghi ngờ, lookup Cambridge/Oxford online.                                     |
| Mnemonic không sáng tạo                                        | Brainstorm 2-3 lựa chọn, chọn vibe nhất. Đừng gắng gượng nếu không nghĩ ra — bỏ trống còn hơn lazy. |
| Supabase free tier hết                                         | Watch storage. Khi đạt 80% (~400 MB), upgrade Pro $25/mo.                                           |
| User mất hứng giữa chừng                                       | Phase nhỏ (10-25 lessons) để mỗi phase ship được. Không cần đợi 100% mới release.                   |

## 7. Estimate effort

**Cho mỗi session AI gen** (per phase batch):

- Đọc context + plan: ~5 min
- Gen 10-20 lessons (200-400 cards): ~30-60 min (model thinking time)
- Validate + commit + sync + seed: ~5 min
- Update docs: ~5 min
- **Total / session**: ~45-75 phút

**Toàn bộ P5-P12**:

- 8 phases × ~50 min/phase = ~7 giờ tổng (chia ra nhiều session)
- Hoặc 4-5 session lớn nếu gộp 2 phases / session

## 8. Sau khi đóng P12 (100% coverage)

- Tag `v0.4.0-content-full`
- Run final coverage script → verify 100%
- Update `docs/CONTENT_PLAN.md` mục 1 (mục tiêu đạt được)
- Generate `docs/CONTENT_REPORT_FULL.md` để document coverage và quality
- Considera audio (TTS via ElevenLabs/Azure) cho 3840 cards — chi phí ~$50-100 batch
- Considera image associations cho noun cards — Unsplash + curation

## 9. Workflow tóm tắt cho session sau

```
"gen tiếp P5"  → AI đọc plan này → propose P5 lesson breakdown → user OK → gen + commit + sync + seed
"gen tiếp P6"  → cùng pattern
…
"gen tiếp P12" → final cleanup
```

Hoặc per lesson granularity:

```
"gen lesson common-core/articles-determiners" → AI gen 1 lesson → commit
```

## 10. Quy ước commit & branch

Giữ nguyên 4-branch workflow (main / dev / be / fe), `--no-ff` merges. Commit pattern:

```
feat(content): add common-core topic — 10 lessons (200 cards) + topic meta
feat(content): expand daily-life with food-cooking + transport-traffic (40 cards)
docs(infra): mark P5 closed (52/192 lessons, 27% MVP-full)
```

Per phase: 1-3 commits feat(content) trên `be` + 1 commit docs. Pattern đã chuẩn hoá ở P0-P4.
