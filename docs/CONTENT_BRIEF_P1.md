# Content Brief — P1 Batch (7 lessons / 140 cards)

> **Mục tiêu**: gen 7 lesson JSON cho P1 batch theo `docs/CONTENT_PLAN.md` Phần 4. User gen offline qua Claude desktop free tier, đưa lại để AI integrate vào `content/collections/oxford-3000/topics/`.
>
> **Status**: chunk 17 onboarding tour đã ship 2026-05-17. P1 content brief này pending user gen. Sau khi có JSON, AI sẽ chạy validate → commit trên `be` → merge `dev` → sync `fe`.

---

## 1. Quy trình

1. Mở Claude desktop (claude.ai) free tier.
2. Mỗi lesson: paste **prompt template** (Phần 3) + **wordlist của lesson đó** (Phần 4).
3. Claude desktop trả JSON theo schema chuẩn.
4. Lưu JSON vào file (đặt tên match `slug` lesson).
5. Đưa lại cho Claude Code session → AI validate + commit.

Hoặc gen từng batch nhỏ (5-10 từ một lượt) để dễ kiểm tra chất lượng.

## 2. Schema reference

Schema chuẩn (validated bởi `src/features/vocab/content-schema.ts`):

```json
{
  "slug": "<lesson-slug-kebab>",
  "name": "<Tên hiển thị>",
  "description": "<1 câu mô tả VN>",
  "order_index": <int 1..N>,
  "estimated_minutes": 10,
  "cards": [
    {
      "word": "string (có thể có space cho phrasal verbs vd 'wake up')",
      "lemma": "string (thường giống word)",
      "ipa": "/.../",
      "pos": "noun | verb | adjective | adverb | preposition | conjunction | pronoun | interjection | determiner | auxiliary",
      "cefr": "A1 | A2 | B1 | B2 | C1 | C2",
      "definitions": [
        {
          "meaning_en": "English definition",
          "meaning_vi": "Định nghĩa tiếng Việt mượt, không dịch máy",
          "examples": [
            { "en": "Natural English sentence.", "vi": "Câu Việt tự nhiên." },
            { "en": "Second example.", "vi": "Ví dụ thứ hai." },
            { "en": "Third example.", "vi": "Ví dụ thứ ba." }
          ]
        }
      ],
      "synonyms": ["..."],
      "antonyms": ["..."],
      "collocations": ["common phrase 1", "common phrase 2"],
      "etymology_hint": "1-2 câu nguồn gốc từ — học thuộc dễ hơn",
      "mnemonic_vi": "Mẹo nhớ vibe tiếng Việt — wordplay, âm thanh, hình ảnh"
    }
  ]
}
```

Lesson mẫu tham khảo: `content/collections/oxford-3000/topics/daily-life/family.json` (đã có trong repo).

## 3. Prompt template (paste vào Claude desktop)

```
Tôi đang xây dataset học tiếng Anh cho người Việt (app EnStudy Hub). Gen JSON cho 1 lesson vocab theo schema dưới đây — KHÔNG thêm text giải thích trước/sau, chỉ trả 1 JSON object.

Lesson info:
- slug: {{LESSON_SLUG}}
- name: {{LESSON_NAME}}
- description: {{LESSON_DESCRIPTION}}
- order_index: {{ORDER_INDEX}}
- estimated_minutes: 10
- Mục tiêu CEFR: {{CEFR_MIX}}
- Số card: {{N}}

Wordlist: {{WORDS}}

Yêu cầu mỗi card:
1. word: chữ thường, dùng space cho phrasal verb (vd "wake up"). Không gạch nối trừ khi từ ghép cố định (vd "merry-go-round").
2. ipa: chuẩn Oxford British style, slash bao quanh /…/.
3. pos: dùng đúng 1 trong 10 giá trị: noun | verb | adjective | adverb | preposition | conjunction | pronoun | interjection | determiner | auxiliary. Không dùng alias "adj"/"adv". Nếu từ đa từ loại, chọn nghĩa phổ biến nhất.
4. cefr: A1 | A2 | B1 | B2 | C1 | C2. Cố gắng phân bố theo CEFR mix yêu cầu.
5. definitions: ít nhất 1 nghĩa. Mỗi definition có meaning_en (định nghĩa Anh đơn giản, KHÔNG copy nguyên văn Oxford/Cambridge/Merriam), meaning_vi (mượt, tự nhiên, có thể nhiều cách dịch ngăn cách dấu chấm phẩy), 2-3 examples (en + vi). Câu ví dụ phải natural, context đời thường người Việt.
6. synonyms / antonyms / collocations: array string, có thể rỗng []. Collocations 3-5 cụm phổ biến nhất.
7. etymology_hint: 1-2 câu nguồn gốc (Old English / Latin / Greek / Old French...), giúp người học nhớ vibe nghĩa.
8. mnemonic_vi: mẹo nhớ tiếng Việt — wordplay theo âm (vd "FAM → 'phăm' như tiếng gọi cả nhà về ăn cơm"), so sánh từ tương tự, hoặc image association. Phải vibe-y, dễ nhớ, KHÔNG khô khan.

CẤM:
- Copy nguyên văn từ Oxford Learner's, Cambridge, Merriam-Webster, Longman.
- Dịch máy stiff. Phải đọc lại to lên xem tự nhiên không.
- IPA Mỹ trộn lẫn với Anh (chọn 1 style nhất quán — ưu tiên British).

Output: chỉ 1 JSON object đầy đủ schema trên, gồm slug/name/description/order_index/estimated_minutes + cards[]. Không markdown fence, không text trước/sau.
```

## 4. 7 lesson briefs

Mỗi lesson dưới đây paste vào prompt template ở Phần 3 thay vào các `{{...}}` placeholder.

### Lesson 1 — `daily-life/clothes-appearance`

- **slug**: `clothes-appearance`
- **name**: `Clothes & Appearance`
- **description**: `Quần áo và phụ kiện thường ngày.`
- **order_index**: `4`
- **CEFR mix**: A1 (10 từ) + A2 (10 từ) = 20
- **Wordlist (20)**: `clothes, shirt, trousers, dress, skirt, shoe, hat, coat, jacket, sock, belt, jeans, shorts, suit, scarf, glove, uniform, fashion, style, size`
- **Lưu file**: `content/collections/oxford-3000/topics/daily-life/clothes-appearance.json`

### Lesson 2 — `daily-life/body-health`

- **slug**: `body-health`
- **name**: `Body & Health`
- **description**: `Các bộ phận cơ thể và từ vựng sức khỏe cơ bản.`
- **order_index**: `5`
- **CEFR mix**: A1 (12 từ) + A2 (8 từ) = 20
- **Wordlist (20)**: `head, face, eye, ear, nose, mouth, hand, arm, leg, foot, hair, tooth, skin, heart, stomach, doctor, medicine, pain, healthy, sick`
- **Lưu file**: `content/collections/oxford-3000/topics/daily-life/body-health.json`

### Lesson 3 — `daily-life/daily-routine`

- **slug**: `daily-routine`
- **name**: `Daily Routine`
- **description**: `Các hoạt động và thời điểm trong sinh hoạt hằng ngày.`
- **order_index**: `6`
- **CEFR mix**: A1 (10 từ) + A2 (10 từ) = 20
- **Wordlist (20)**: `wake up, sleep, eat, drink, wash, shower, brush, dress, leave, return, rest, relax, exercise, cook, clean, shopping, evening, morning, afternoon, weekend`
- **Note**: `wake up` là phrasal verb (2 từ, có space). `dress` ở đây là verb (mặc quần áo), khác với `dress` noun ở lesson 1.
- **Lưu file**: `content/collections/oxford-3000/topics/daily-life/daily-routine.json`

### Lesson 4 — `people/personality`

- **slug**: `personality`
- **name**: `Personality Traits`
- **description**: `Tính cách và đặc điểm bản chất của một người.`
- **order_index**: `1`
- **CEFR mix**: A2 (10 từ) + B1 (10 từ) = 20
- **Wordlist (20)**: `kind, friendly, shy, polite, honest, brave, lazy, smart, funny, serious, generous, patient, confident, quiet, talkative, careful, careless, selfish, calm, rude`
- **Lưu file**: `content/collections/oxford-3000/topics/people/personality.json`
- **Topic meta cần thêm** (1 file riêng): `content/collections/oxford-3000/topics/people/meta.json` với nội dung:
  ```json
  {
    "slug": "people",
    "name": "People & Emotions",
    "description": "Con người, tính cách, cảm xúc và các mối quan hệ xã hội.",
    "order_index": 2,
    "icon": "users",
    "color": "#ec4899"
  }
  ```

### Lesson 5 — `people/emotions`

- **slug**: `emotions`
- **name**: `Emotions & Feelings`
- **description**: `Cảm xúc và trạng thái tinh thần.`
- **order_index**: `2`
- **CEFR mix**: A1 (8 từ) + A2 (8 từ) + B1 (4 từ) = 20
- **Wordlist (20)**: `happy, sad, angry, tired, bored, excited, worried, nervous, surprised, scared, proud, embarrassed, jealous, lonely, grateful, frustrated, relaxed, confused, ashamed, hopeful`
- **Lưu file**: `content/collections/oxford-3000/topics/people/emotions.json`

### Lesson 6 — `time-numbers/time-dates`

- **slug**: `time-dates`
- **name**: `Time & Dates`
- **description**: `Đơn vị thời gian và ngày tháng.`
- **order_index**: `1`
- **CEFR mix**: A1 (15 từ) + A2 (5 từ) = 20
- **Wordlist (20)**: `time, day, week, month, year, today, yesterday, tomorrow, hour, minute, second, morning, evening, night, midnight, calendar, date, century, decade, season`
- **Note**: `morning, evening` trùng với lesson `daily-routine` — định nghĩa ở đây nhấn về "đơn vị thời gian trong ngày" thay vì "thời điểm sinh hoạt"; cả hai lesson có thể giữ cùng từ vì khác bối cảnh.
- **Lưu file**: `content/collections/oxford-3000/topics/time-numbers/time-dates.json`
- **Topic meta cần thêm** (1 file riêng): `content/collections/oxford-3000/topics/time-numbers/meta.json` với nội dung:
  ```json
  {
    "slug": "time-numbers",
    "name": "Time & Numbers",
    "description": "Thời gian, ngày tháng, số đếm và đơn vị đo lường cơ bản.",
    "order_index": 4,
    "icon": "clock",
    "color": "#f59e0b"
  }
  ```

### Lesson 7 — `time-numbers/numbers-quantities`

- **slug**: `numbers-quantities`
- **name**: `Numbers & Quantities`
- **description**: `Số đếm, thứ tự và đơn vị đo lượng.`
- **order_index**: `2`
- **CEFR mix**: A1 (12 từ) + A2 (8 từ) = 20
- **Wordlist (20)**: `one, hundred, thousand, million, first, second, third, last, few, many, several, half, whole, double, triple, dozen, percent, quarter, single, pair`
- **Note**: `second` ở đây là ordinal "thứ hai", khác `second` ở lesson `time-dates` (đơn vị giây). Chọn 1 nghĩa nổi bật cho card; có thể thêm definition phụ giải thích nghĩa kia.
- **Lưu file**: `content/collections/oxford-3000/topics/time-numbers/numbers-quantities.json`

---

## 5. Sau khi user gen xong

Đưa file JSON (hoặc paste content) vào next Claude Code session với câu:

> "Đây là JSON cho lesson `<slug>`. Validate + commit giúp."

AI sẽ:

1. `pnpm tsx scripts/validate-content.ts <path>` → schema + dictionaryapi cross-check.
2. Nếu OK: lưu file vào path đúng, commit trên `be` với `feat(content): add lesson <topic>/<slug> (N cards)`.
3. Merge `be → dev --no-ff` → sync `dev → fe`.
4. Update `docs/TRACKER.md` Tuần 2 P1 (line 76) tick lesson đó.
5. Sau cả 7 lesson + 2 topic meta: 1 entry HANDOFF tổng kết.

## 6. Tổng kết scope

| #   | Topic        | Lesson             | Cards | CEFR mix             | Done? |
| --- | ------------ | ------------------ | ----- | -------------------- | ----- |
| 1   | daily-life   | clothes-appearance | 20    | A1 (10) + A2 (10)    | [ ]   |
| 2   | daily-life   | body-health        | 20    | A1 (12) + A2 (8)     | [ ]   |
| 3   | daily-life   | daily-routine      | 20    | A1 (10) + A2 (10)    | [ ]   |
| 4   | people       | personality        | 20    | A2 (10) + B1 (10)    | [ ]   |
| 5   | people       | emotions           | 20    | A1 (8)+A2 (8)+B1 (4) | [ ]   |
| 6   | time-numbers | time-dates         | 20    | A1 (15) + A2 (5)     | [ ]   |
| 7   | time-numbers | numbers-quantities | 20    | A1 (12) + A2 (8)     | [ ]   |

**Topic meta riêng** (2 file, JSON ngắn — có thể user tự tạo theo template trong lessons 4 & 6 ở Phần 4 trên):

- `content/collections/oxford-3000/topics/people/meta.json`
- `content/collections/oxford-3000/topics/time-numbers/meta.json`

Tổng: **2 topic meta + 7 lesson = 9 file mới** trong `content/collections/oxford-3000/topics/{daily-life,people,time-numbers}/`.
