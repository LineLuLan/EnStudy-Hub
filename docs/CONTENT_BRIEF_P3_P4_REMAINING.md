# Content Brief — P3-P4 Remaining (12 lessons / 240 cards + 5 topic metas)

> **Mục tiêu**: gen offline 12 lesson JSON còn lại để hoàn thành MVP Oxford 3000 (42 lessons / 840 cards) theo `docs/CONTENT_PLAN.md`. Sau khi user gen xong, AI sẽ validate + commit theo workflow chuẩn.
>
> **Tình trạng** (2026-05-15): đã ship 24 lessons / 480 cards + 5 topic metas (daily-life, people, time-numbers, places-travel, work-business). 12 lessons / 240 cards + 5 metas còn lại thuộc 5 topic: education, nature-environment, entertainment, society-culture, abstract-academic.

---

## 1. Quy trình gen

1. Mở Claude desktop (claude.ai) free tier — chọn Opus (nếu còn quota) hoặc Sonnet 4.6 (cũng đủ chất lượng cho A2-B2 content).
2. Mỗi lesson: paste **prompt template** (Phần 3) + thay placeholder bằng info ở Phần 4.
3. Claude desktop trả 1 JSON object đúng schema.
4. Lưu vào path đúng (xem Phần 4 mỗi lesson).
5. Đưa file lại cho Claude Code session → AI validate + commit batch.

Tạo `meta.json` cho 5 topic mới (template ở Phần 5) — JSON ngắn, có thể tự tạo không cần Claude.

## 2. Schema reference

Schema chuẩn (Zod validated bởi `src/features/vocab/content-schema.ts`):

```json
{
  "slug": "<lesson-slug-kebab>",
  "name": "<Tên hiển thị>",
  "description": "<1 câu mô tả VN>",
  "order_index": <int 1..N>,
  "estimated_minutes": 10,
  "cards": [
    {
      "word": "string",
      "lemma": "string",
      "ipa": "/.../",
      "pos": "noun | verb | adjective | adverb | preposition | conjunction | pronoun | interjection | determiner | auxiliary",
      "cefr": "A1 | A2 | B1 | B2 | C1 | C2",
      "definitions": [
        {
          "meaning_en": "...",
          "meaning_vi": "...",
          "examples": [
            { "en": "...", "vi": "..." },
            { "en": "...", "vi": "..." },
            { "en": "...", "vi": "..." }
          ]
        }
      ],
      "synonyms": ["..."],
      "antonyms": ["..."],
      "collocations": ["..."],
      "etymology_hint": "...",
      "mnemonic_vi": "..."
    }
  ]
}
```

Mẫu chất lượng tham khảo: bất cứ file nào trong `content/collections/oxford-3000/topics/work-business/` (vừa ship).

## 3. Prompt template (paste vào Claude desktop)

```
Tôi đang xây dataset học tiếng Anh cho người Việt (app EnStudy Hub). Gen JSON cho 1 lesson vocab theo schema dưới đây — KHÔNG thêm text giải thích trước/sau, chỉ trả 1 JSON object thuần (không markdown fence).

Lesson info:
- slug: {{LESSON_SLUG}}
- name: {{LESSON_NAME}}
- description: {{LESSON_DESCRIPTION}}
- order_index: {{ORDER_INDEX}}
- estimated_minutes: 10
- CEFR mix: {{CEFR_MIX}}
- Số card: 20

Wordlist (20): {{WORDS}}

Schema mỗi card:
{
  "word": "chữ thường, space cho phrasal verb",
  "lemma": "thường = word",
  "ipa": "/.../ British style",
  "pos": "noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection|determiner|auxiliary",
  "cefr": "A1|A2|B1|B2|C1|C2",
  "definitions": [
    {
      "meaning_en": "English def đơn giản, KHÔNG copy Oxford/Cambridge",
      "meaning_vi": "Định nghĩa Việt mượt, có thể nhiều nghĩa ngăn dấu chấm phẩy",
      "examples": [
        { "en": "Natural sentence 1.", "vi": "Câu Việt tự nhiên 1." },
        { "en": "Sentence 2.", "vi": "Câu 2." },
        { "en": "Sentence 3.", "vi": "Câu 3." }
      ]
    }
  ],
  "synonyms": ["..."],
  "antonyms": ["..."],
  "collocations": ["3-5 cụm phổ biến"],
  "etymology_hint": "1-2 câu nguồn gốc (Old English/Latin/Greek/Old French...)",
  "mnemonic_vi": "Mẹo nhớ vibe tiếng Việt — wordplay theo âm, image association, KHÔNG khô khan"
}

Top level: { slug, name, description, order_index, estimated_minutes, cards[] }

QUY ƯỚC ĐẶC BIỆT (giữ nhất quán với 24 lessons đã ship):
- IPA British style, slash bao quanh.
- Examples đậm bối cảnh Việt Nam (Hà Nội, Sài Gòn, Đà Lạt, Huế, Hội An, phở, bánh mì, áo dài, Tết, AEON, Vincom, Vietcombank, Grab, Shopee, etc.)
- Mnemonic_vi vibe-y wordplay tiếng Việt — chơi chữ theo âm (vd "FACE → 'phây' → FACEbook"), so sánh ảnh, hoặc giải parts (vd "GRAND + FATHER: cha lớn = ông")
- 4-5 collocations natural
- 3 examples mỗi definition

CẤM: copy nguyên văn Oxford/Cambridge/Merriam/Longman, dịch máy stiff, trộn IPA Mỹ/Anh.

Output: chỉ JSON object, không markdown fence, không text trước/sau.
```

## 4. 12 lesson briefs

### Topic: `education` (4 lessons) — P3

#### Lesson 1 — `education/school-classroom`

- **slug**: `school-classroom`
- **name**: `School & Classroom`
- **description**: `Đồ vật và con người trong lớp học.`
- **order_index**: `1`
- **CEFR mix**: A1 (12) + A2 (8) = 20
- **Wordlist (20)**: `school, classroom, student, teacher, lesson, homework, textbook, notebook, pen, pencil, blackboard, chalk, desk, ruler, eraser, calculator, dictionary, library, principal, schoolbag`
- **Lưu**: `content/collections/oxford-3000/topics/education/school-classroom.json`

#### Lesson 2 — `education/subjects-academic`

- **slug**: `subjects-academic`
- **name**: `School Subjects`
- **description**: `Các môn học và khái niệm học thuật.`
- **order_index**: `2`
- **CEFR mix**: A2 (10) + B1 (10) = 20
- **Wordlist (20)**: `math, science, history, geography, literature, biology, chemistry, physics, art, music, philosophy, economics, sociology, psychology, linguistics, algebra, geometry, grammar, vocabulary, essay`
- **Lưu**: `content/collections/oxford-3000/topics/education/subjects-academic.json`

#### Lesson 3 — `education/exams-results`

- **slug**: `exams-results`
- **name**: `Exams & Results`
- **description**: `Kỳ thi, điểm số và bằng cấp.`
- **order_index**: `3`
- **CEFR mix**: A2 (8) + B1 (12) = 20
- **Wordlist (20)**: `exam, test, quiz, score, grade, pass, fail, certificate, diploma, degree, gpa, scholarship, deadline, assignment, project, presentation, research, thesis, plagiarism, academic`
- **Note**: `deadline` trùng với `work-business/meetings-comms` — đây nhấn về deadline học thuật (nộp bài, luận văn).
- **Lưu**: `content/collections/oxford-3000/topics/education/exams-results.json`

#### Lesson 4 — `education/learning-skills`

- **slug**: `learning-skills`
- **name**: `Learning Skills`
- **description**: `Kỹ năng học tập và phát triển bản thân.`
- **order_index**: `4`
- **CEFR mix**: A2 (8) + B1 (12) = 20
- **Wordlist (20)**: `learn, study, review, revise, memorize, understand, explain, practice, mistake, correct, improve, focus, concentrate, knowledge, skill, talent, ability, progress, fluency, mastery`
- **Note**: `skill` trùng với `work-business/career` — đây góc nhìn kỹ năng học tập tổng quát.
- **Lưu**: `content/collections/oxford-3000/topics/education/learning-skills.json`

**Topic meta** (Phần 5): `content/collections/oxford-3000/topics/education/meta.json`

---

### Topic: `nature-environment` (4 lessons) — P3

#### Lesson 5 — `nature-environment/animals-pets`

- **slug**: `animals-pets`
- **name**: `Animals & Pets`
- **description**: `Vật nuôi trong nhà và động vật hoang dã.`
- **order_index**: `1`
- **CEFR mix**: A1 (12) + A2 (8) = 20
- **Wordlist (20)**: `dog, cat, bird, fish, rabbit, hamster, horse, cow, pig, chicken, sheep, goat, mouse, snake, frog, lion, tiger, elephant, monkey, dolphin`
- **Lưu**: `content/collections/oxford-3000/topics/nature-environment/animals-pets.json`

#### Lesson 6 — `nature-environment/plants-trees`

- **slug**: `plants-trees`
- **name**: `Plants & Trees`
- **description**: `Cây cối và thực vật phổ biến.`
- **order_index**: `2`
- **CEFR mix**: A1 (8) + A2 (12) = 20
- **Wordlist (20)**: `tree, flower, grass, leaf, root, branch, seed, plant, rose, lily, bamboo, oak, pine, fruit-tree, vegetable, garden, forest, jungle, harvest, bloom`
- **Note**: `vegetable` trùng `daily-life/food-meals` — đây góc nhìn thực vật/cây trồng.
- **Lưu**: `content/collections/oxford-3000/topics/nature-environment/plants-trees.json`

#### Lesson 7 — `nature-environment/landscape-geography`

- **slug**: `landscape-geography`
- **name**: `Landscape & Geography`
- **description**: `Địa hình và cảnh quan thiên nhiên.`
- **order_index**: `3`
- **CEFR mix**: A2 (10) + B1 (10) = 20
- **Wordlist (20)**: `mountain, hill, valley, river, lake, sea, ocean, island, beach, desert, forest, jungle, cave, waterfall, coast, cliff, volcano, plain, peninsula, continent`
- **Note**: `forest, jungle` trùng plants-trees lesson — đây nhấn về địa lý lớn.
- **Lưu**: `content/collections/oxford-3000/topics/nature-environment/landscape-geography.json`

#### Lesson 8 — `nature-environment/climate-env`

- **slug**: `climate-env`
- **name**: `Climate & Environment`
- **description**: `Khí hậu và môi trường.`
- **order_index**: `4`
- **CEFR mix**: B1 (10) + B2 (10) = 20
- **Wordlist (20)**: `climate, pollution, recycle, environment, ecosystem, species, habitat, extinct, conserve, sustainable, renewable, fossil-fuel, greenhouse, deforestation, biodiversity, glacier, ozone, emission, carbon, eco-friendly`
- **Lưu**: `content/collections/oxford-3000/topics/nature-environment/climate-env.json`

**Topic meta** (Phần 5): `content/collections/oxford-3000/topics/nature-environment/meta.json`

---

### Topic: `entertainment` (4 lessons) — P3

#### Lesson 9 — `entertainment/sports-games`

- **slug**: `sports-games`
- **name**: `Sports & Games`
- **description**: `Các môn thể thao và trò chơi.`
- **order_index**: `1`
- **CEFR mix**: A1 (10) + A2 (10) = 20
- **Wordlist (20)**: `sport, football, basketball, tennis, badminton, swimming, running, cycling, yoga, gym, match, score, team, player, coach, win, lose, draw, championship, tournament`
- **Lưu**: `content/collections/oxford-3000/topics/entertainment/sports-games.json`

#### Lesson 10 — `entertainment/music-arts`

- **slug**: `music-arts`
- **name**: `Music & Arts`
- **description**: `Âm nhạc và nghệ thuật.`
- **order_index**: `2`
- **CEFR mix**: A2 (10) + B1 (10) = 20
- **Wordlist (20)**: `music, song, singer, band, concert, instrument, guitar, piano, violin, drum, art, painting, sculpture, exhibition, artist, gallery, theatre, dance, opera, melody`
- **Note**: `artist` trùng `work-business/jobs-occupations` — đây cụ thể về nghệ thuật.
- **Lưu**: `content/collections/oxford-3000/topics/entertainment/music-arts.json`

#### Lesson 11 — `entertainment/movies-tv`

- **slug**: `movies-tv`
- **name**: `Movies & TV`
- **description**: `Phim ảnh và truyền hình.`
- **order_index**: `3`
- **CEFR mix**: A2 (10) + B1 (10) = 20
- **Wordlist (20)**: `movie, film, cinema, actor, actress, director, scene, plot, genre, comedy, drama, horror, action, romance, series, episode, channel, subtitle, premiere, review`
- **Lưu**: `content/collections/oxford-3000/topics/entertainment/movies-tv.json`

#### Lesson 12 — `entertainment/hobbies-leisure`

- **slug**: `hobbies-leisure`
- **name**: `Hobbies & Leisure`
- **description**: `Sở thích và giải trí.`
- **order_index**: `4`
- **CEFR mix**: A2 (10) + B1 (10) = 20
- **Wordlist (20)**: `hobby, leisure, fun, enjoy, relax, vacation, picnic, camping, fishing, gardening, photography, collecting, board-game, video-game, puzzle, reading, drawing, knitting, traveling, sightseeing`
- **Note**: `relax` trùng `daily-life/daily-routine` — đây cụ thể về giải trí.
- **Lưu**: `content/collections/oxford-3000/topics/entertainment/hobbies-leisure.json`

**Topic meta** (Phần 5): `content/collections/oxford-3000/topics/entertainment/meta.json`

---

### Topic: `society-culture` (3 lessons) — P4

#### Lesson 13 — `society-culture/government-law`

- **slug**: `government-law`
- **name**: `Government & Law`
- **description**: `Chính phủ, pháp luật và công dân.`
- **order_index**: `1`
- **CEFR mix**: B1 (8) + B2 (12) = 20
- **Wordlist (20)**: `government, law, election, court, police, crime, evidence, witness, lawyer, judge, jury, justice, freedom, democracy, rights, duty, parliament, constitution, vote, citizen`
- **Note**: `lawyer` trùng `work-business/jobs-occupations` — đây cụ thể về pháp luật.
- **Lưu**: `content/collections/oxford-3000/topics/society-culture/government-law.json`

#### Lesson 14 — `society-culture/traditions-festivals`

- **slug**: `traditions-festivals`
- **name**: `Traditions & Festivals`
- **description**: `Truyền thống, lễ hội và tôn giáo.`
- **order_index**: `2`
- **CEFR mix**: A2 (8) + B1 (12) = 20
- **Wordlist (20)**: `tradition, custom, festival, holiday, celebrate, religion, faith, temple, church, prayer, wedding, funeral, anniversary, parade, costume, ritual, heritage, ancestor, generation, identity`
- **Note**: nhiều từ trùng (`wedding, anniversary, ancestor, generation` từ people topics) — đây góc nhìn văn hoá tổng quan.
- **Lưu**: `content/collections/oxford-3000/topics/society-culture/traditions-festivals.json`

#### Lesson 15 — `society-culture/news-media`

- **slug**: `news-media`
- **name**: `News & Media`
- **description**: `Tin tức, truyền thông và mạng xã hội.`
- **order_index**: `3`
- **CEFR mix**: B1 (10) + B2 (10) = 20
- **Wordlist (20)**: `news, media, journalist, reporter, article, headline, broadcast, channel, publish, censor, propaganda, fake-news, social-media, influencer, post, share, comment, follower, viral, trend`
- **Lưu**: `content/collections/oxford-3000/topics/society-culture/news-media.json`

**Topic meta** (Phần 5): `content/collections/oxford-3000/topics/society-culture/meta.json`

---

### Topic: `abstract-academic` (3 lessons) — P4

#### Lesson 16 — `abstract-academic/thinking-knowledge`

- **slug**: `thinking-knowledge`
- **name**: `Thinking & Knowledge`
- **description**: `Suy nghĩ, lý luận và tri thức.`
- **order_index**: `1`
- **CEFR mix**: B1 (8) + B2 (12) = 20
- **Wordlist (20)**: `think, believe, assume, conclude, evidence, theory, hypothesis, analyze, perspective, opinion, fact, doubt, knowledge, wisdom, intuition, logic, reason, argument, claim, proof`
- **Note**: `conclude` trùng `work-business/meetings-comms` — đây góc nhìn tư duy học thuật.
- **Lưu**: `content/collections/oxford-3000/topics/abstract-academic/thinking-knowledge.json`

#### Lesson 17 — `abstract-academic/cause-effect`

- **slug**: `cause-effect`
- **name**: `Cause & Effect`
- **description**: `Quan hệ nguyên nhân và kết quả.`
- **order_index**: `2`
- **CEFR mix**: B1 (10) + B2 (10) = 20
- **Wordlist (20)**: `cause, effect, result, lead-to, due-to, because, therefore, consequence, impact, influence, factor, outcome, reaction, response, trigger, since, thus, hence, owing-to, eventually`
- **Note**: nhiều từ là phrasal/preposition phrases. POS có thể là conjunction/preposition. `because, since, therefore, thus, hence` = conjunction.
- **Lưu**: `content/collections/oxford-3000/topics/abstract-academic/cause-effect.json`

#### Lesson 18 — `abstract-academic/linking-words`

- **slug**: `linking-words`
- **name**: `Linking Words`
- **description**: `Từ nối và liên kết trong văn viết học thuật.`
- **order_index**: `3`
- **CEFR mix**: B2 (20) = 20
- **Wordlist (20)**: `however, although, despite, moreover, furthermore, nevertheless, in-contrast, on-the-other-hand, similarly, likewise, in-conclusion, for-instance, in-addition, in-fact, indeed, regarding, with-respect-to, in-other-words, namely, overall`
- **Note**: nhiều từ là phrase nhiều chữ (`in contrast, on the other hand, ...`). POS thường là conjunction hoặc adverb. Mỗi mục ghi cả phrase nếu cần.
- **Lưu**: `content/collections/oxford-3000/topics/abstract-academic/linking-words.json`

**Topic meta** (Phần 5): `content/collections/oxford-3000/topics/abstract-academic/meta.json`

---

## 5. 5 topic meta files (tự tạo, không cần Claude desktop)

Lưu lần lượt theo path tương ứng:

```json
// education/meta.json
{
  "slug": "education",
  "name": "Education",
  "description": "Trường học, môn học và kỹ năng học tập.",
  "order_index": 6,
  "icon": "graduation-cap",
  "color": "#8b5cf6"
}
```

```json
// nature-environment/meta.json
{
  "slug": "nature-environment",
  "name": "Nature & Environment",
  "description": "Thiên nhiên, động thực vật và môi trường.",
  "order_index": 7,
  "icon": "tree-pine",
  "color": "#22c55e"
}
```

```json
// entertainment/meta.json
{
  "slug": "entertainment",
  "name": "Entertainment",
  "description": "Thể thao, âm nhạc, phim ảnh và sở thích.",
  "order_index": 8,
  "icon": "film",
  "color": "#f43f5e"
}
```

```json
// society-culture/meta.json
{
  "slug": "society-culture",
  "name": "Society & Culture",
  "description": "Chính phủ, văn hoá, truyền thống và truyền thông.",
  "order_index": 9,
  "icon": "landmark",
  "color": "#0ea5e9"
}
```

```json
// abstract-academic/meta.json
{
  "slug": "abstract-academic",
  "name": "Abstract & Academic",
  "description": "Tư duy, lý luận và từ nối học thuật.",
  "order_index": 10,
  "icon": "lightbulb",
  "color": "#a855f7"
}
```

## 6. Sau khi user gen xong từng file

Đưa file JSON (hoặc paste content) vào next Claude Code session với câu:

> "Đây là JSON cho lesson `<slug>`. Validate + commit giúp."

AI sẽ:

1. Lưu file vào path đúng.
2. Chạy schema validate inline (Zod via `content-schema.ts`).
3. Nếu OK: commit trên `be` với pattern `feat(content): add lesson <topic>/<slug> (N cards)`.
4. Có thể batch nhiều file/topic vào 1 commit để gọn (recommended).
5. Merge `be → dev --no-ff` → sync `dev → fe`.
6. Update `docs/TRACKER.md` Tuần 4/5/6 tick lesson.
7. Sau khi đủ topic hoặc batch lớn → 1 entry HANDOFF tổng kết.

## 7. Tổng kết scope còn lại

| Topic              | Lessons | Cards   | Phase | Done? |
| ------------------ | ------- | ------- | ----- | ----- |
| education          | 4       | 80      | P3    | [ ]   |
| nature-environment | 4       | 80      | P3    | [ ]   |
| entertainment      | 4       | 80      | P3    | [ ]   |
| society-culture    | 3       | 60      | P4    | [ ]   |
| abstract-academic  | 3       | 60      | P4    | [ ]   |
| **TOTAL**          | **18**  | **360** |       |       |

Wait — đếm lại: 4+4+4+3+3 = 18 lessons × 20 = 360 cards. Plus 5 topic metas.

**Tổng MVP target**: 42 lessons / 840 cards. Đã có 24 lessons / 480 cards. Còn 18 lessons / 360 cards.

## 8. Tips Vietnamese pedagogy (review JSON Claude trả)

- **Mnemonic**: phải nghe được bằng âm Việt (vd `philosophy` → `phi-lô-sô-phi` → 'phi lò sờ phi' kiểu bếp triết học). KHÔNG xài tắt chữ cái đầu lạnh lùng.
- **Examples**: phải bám ngữ cảnh người Việt. Tránh "I am a student". Thay "She works in a Hà Nội hospital" hoặc "He plays đá cầu after school".
- **Định nghĩa Việt**: đọc to thử. Nghe gượng → sửa.
- **IPA**: ưu tiên British. Phrase nhiều từ thì IPA viết theo từng từ kèm space.
- **Synonyms / antonyms**: chọn từ cùng level. Không nhồi từ hiếm.
- **Collocations**: tối thiểu 3, tối đa 5. Chọn cụm thật natural.
