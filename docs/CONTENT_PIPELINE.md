# Content Pipeline — Quy trình gen nội dung học

> **Triết lý** (blueprint Phần 0): Content-first, gen offline 1 lần, version vào git, không gọi LLM runtime.
> **Mục tiêu**: 6 tuần có ~500-1000 từ chất lượng cao, hợp pháp, tiếng Việt mượt.

---

## 1. Nguồn (free, hợp pháp)

| Loại                 | Nguồn                                | Cách dùng                       | Bản quyền           |
| -------------------- | ------------------------------------ | ------------------------------- | ------------------- |
| Wordlist             | Oxford 3000/5000 (GitHub mirrors)    | Danh sách từ public             | OK (list)           |
| Wordlist             | NGSL — newgeneralservicelist.com     | 2800 từ phổ biến                | CC BY-SA            |
| Wordlist             | AWL (Wikipedia "Academic Word List") | 570 từ học thuật                | Public              |
| Wordlist             | COCA top 5000 — wordfrequency.info   | Tần suất corpus                 | Free sample         |
| Reference IPA/POS    | api.dictionaryapi.dev                | Cross-check sau gen             | Free, no key        |
| Reference định nghĩa | en.wiktionary.org/api/rest_v1        | Cross-check etymology           | CC BY-SA            |
| Cấu trúc bài học     | luyentu.com                          | Tham khảo cách chia topic       | **Chỉ học pattern** |
| Gen tiếng Việt       | Claude desktop / ChatGPT free        | Definitions, examples, mnemonic | Offline, free       |

### CẤM

- **Không copy nguyên văn** từ Oxford Learner's Dictionary, Cambridge Dictionary, Merriam-Webster, Longman.
- **Không crawl** luyentu.com / các app học tiếng Anh thương mại để lấy nội dung.
- Chỉ học cấu trúc, không copy text.

---

## 2. Cấu trúc tham khảo từ luyentu.com (notes manual)

> **TODO Tuần 2**: dành 1-2h khảo sát luyentu.com, ghi pattern ở đây.

Câu hỏi cần trả lời khi khảo sát:

- Chia topic theo chủ đề đời sống hay theo CEFR level?
- Mỗi lesson bao nhiêu từ (5? 10? 20? 30?)?
- Card layout: chỉ word, hay word + IPA + nghĩa + example?
- Có cho người học chọn lộ trình hay route tuyến tính?
- Cách họ phân biệt từ A1/A2/B1 trong UI?

(Sau khảo sát, cập nhật section này → áp dụng vào `meta.json` collections.)

---

## 3. Quy trình gen 1 lesson (~20-25 từ) — STANDARD

### Bước 1: Chọn topic

Tham khảo `TRACKER.md` để biết topic nào đang `[ ]`. Ưu tiên topic đời sống (Tuần 2 pilot), academic (Tuần 5+).

### Bước 2: Lấy từ

- Mở `content/wordlists/oxford-3000.csv`.
- Filter theo CEFR level (A1, A2, B1, B2, C1, C2) hoặc theo chủ đề.
- Chọn 20-25 từ chưa có trong các lesson khác (check `content/collections/`).

### Bước 3: Gen

1. Mở Claude desktop (claude.ai) hoặc ChatGPT free.
2. Paste **prompt template** dưới đây.
3. Paste 20-25 từ vào cuối prompt.
4. LLM trả JSON array.
5. Lưu vào `content/collections/<col>/topics/<topic>/<lesson>.json`.

### Bước 4: Validate

```bash
pnpm tsx scripts/validate-content.ts <lesson-file-path>
```

- Validate JSON schema (Zod).
- Gọi Free Dictionary API → so sánh IPA, POS.
- Output `docs/CONTENT_REPORT.md` (gitignored): từ nào lệch.

### Bước 5: Review thủ công

- Nếu validate báo lệch → mở Claude desktop, hỏi lại 1 từ đó, sửa JSON.
- Đọc qua 1 lượt để bắt lỗi dịch máy / mnemonic vô nghĩa.

### Bước 6: Commit

```bash
# trên nhánh be (vì content thuộc data/seed)
git checkout be
git add content/collections/<col>/topics/<topic>/<lesson>.json
git commit -m "feat(content): add lesson <topic>/<lesson> (20 words)"
```

### Bước 7: Seed (sau khi có Supabase)

```bash
pnpm seed
```

---

## 4. Prompt template (paste vào Claude desktop / ChatGPT)

```
Tôi đang xây dataset học tiếng Anh cho người Việt. Với danh sách từ dưới đây,
trả về JSON array đúng format sau, không thêm text giải thích nào trước/sau:

[
  {
    "word": "ephemeral",
    "lemma": "ephemeral",
    "ipa": "/ɪˈfem.ər.əl/",
    "pos": "adjective",
    "cefr": "C1",
    "definitions": [
      {
        "meaning_en": "lasting for a very short time",
        "meaning_vi": "phù du, chóng tàn, ngắn ngủi",
        "examples": [
          {
            "en": "Fame in the digital age is often ephemeral.",
            "vi": "Sự nổi tiếng thời số thường rất phù du."
          },
          {
            "en": "The cherry blossoms are beautiful but ephemeral.",
            "vi": "Hoa anh đào đẹp nhưng ngắn ngủi."
          },
          {
            "en": "Her happiness proved ephemeral, lasting only a few days.",
            "vi": "Niềm vui của cô chỉ là ngắn ngủi, chỉ kéo dài vài ngày."
          }
        ]
      }
    ],
    "synonyms": ["transient", "fleeting", "short-lived"],
    "antonyms": ["permanent", "lasting", "enduring"],
    "collocations": ["ephemeral nature", "ephemeral beauty", "ephemeral pleasure"],
    "etymology_hint": "From Greek 'ephēmeros' = lasting only a day",
    "mnemonic_vi": "EPH (ếch) + ÊM (êm) + RAL: con ếch kêu êm 1 ngày rồi tắt"
  }
]

Yêu cầu chất lượng:
- 3 ví dụ mỗi nghĩa, ngữ cảnh tự nhiên (không sách giáo khoa)
- Dịch tiếng Việt mượt, không word-by-word
- IPA chuẩn British English
- Mnemonic giúp người Việt nhớ (âm thanh / hình ảnh / liên tưởng)
- Nếu từ có nhiều nghĩa, tách thành nhiều definitions object
- pos: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection
- cefr: A1, A2, B1, B2, C1, C2

Danh sách từ:
[paste 20-30 từ ở đây]
```

---

## 5. Tiến độ content

> Cập nhật sau mỗi lesson hoàn thành.

| Collection  | Topic      | Lesson | Số từ | Validate pass | Seeded? |
| ----------- | ---------- | ------ | ----- | ------------- | ------- |
| oxford-3000 | daily-life | family | 20    | TODO          | No      |
| ...         | ...        | ...    | ...   | ...           | ...     |

---

## 6. Tips chất lượng

- **Mnemonic Việt**: Cố gắng liên tưởng âm thanh hoặc hình ảnh quen với người Việt. Ví dụ `ephemeral` → `ếch êm rồi tắt`. Tránh mnemonic kiểu "viết tắt chữ cái đầu" vì khó nhớ.
- **Examples**: Tránh "I am a student", "She is beautiful" — quá sách giáo khoa. Cho ngữ cảnh có thật (workplace, social media, văn hoá Việt).
- **Dịch tiếng Việt**: Đọc to thử. Nếu nghe gượng → sửa.
- **IPA**: Ưu tiên British English (RP). Nếu American khác, ghi note trong `examples`.
- **CEFR**: Nếu không chắc, dùng Cambridge English Profile (https://www.englishprofile.org/wordlists) để tra.
