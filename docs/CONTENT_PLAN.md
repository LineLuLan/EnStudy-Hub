# Content Plan — Oxford 3000

> Master plan cho việc gen content offline qua Claude desktop. Mỗi lesson ≈ 20 cards. Cover Oxford 3000 essentials, ưu tiên concrete → abstract.
>
> Đọc kèm: `docs/CONTENT_PIPELINE.md` (prompt template + quy trình), `VOCAB_APP_BLUEPRINT.md` Phần 1 (triết lý content-first).

---

## 1. Mục tiêu

| Mốc       | Target          | Lessons   | Cards      |
| --------- | --------------- | --------- | ---------- |
| Tuần 2 P0 | starter pilot   | 3         | ~60        |
| Tuần 2-3  | đủ data ship FE | 10        | ~200       |
| Tuần 4-5  | scale MVP       | 25-30     | ~500       |
| Tuần 6    | MVP ship        | **35-50** | ~700-1000  |
| Post-MVP  | full Oxford     | 100-150   | ~2000-3000 |

**Chiến lược**: gen từng batch theo phase. Mỗi batch ≈ 1 buổi Claude desktop (~30 phút). Không cần gen full 3000 trước khi ship — auth + SRS + UI có thể test với 60 cards.

## 2. Cấu trúc collection

Tất cả MVP nằm trong **1 collection `oxford-3000`** đã seed sẵn (`is_official=true`, CEFR A1-B2). Không tạo collection mới trong MVP — fork sang `ielts-academic` / `business-english` sau khi v1.0 stable.

**Folder convention** (đã chuẩn hóa Phase 0):

```
content/collections/oxford-3000/
├── meta.json                                  (đã có)
└── topics/
    └── <topic-slug>/
        ├── meta.json                          (1 file/topic)
        └── <lesson-slug>.json                 (n file/topic)
```

## 3. Topic tree đầy đủ (10 topics)

| #   | Topic slug         | Tên                      | CEFR  | Lessons MVP | Cards MVP | Phase |
| --- | ------------------ | ------------------------ | ----- | ----------- | --------- | ----- |
| 1   | daily-life         | Cuộc sống hằng ngày      | A1-A2 | 6           | 120       | P0/P1 |
| 2   | people             | Con người & cảm xúc      | A1-B1 | 5           | 100       | P1/P2 |
| 3   | places-travel      | Địa điểm & du lịch       | A2-B1 | 5           | 100       | P2    |
| 4   | time-numbers       | Thời gian, số, đơn vị    | A1-A2 | 3           | 60        | P0    |
| 5   | work-business      | Công việc & kinh doanh   | B1-B2 | 5           | 100       | P3    |
| 6   | education          | Giáo dục & học tập       | A2-B2 | 4           | 80        | P3    |
| 7   | nature-environment | Thiên nhiên & môi trường | A2-B1 | 4           | 80        | P3    |
| 8   | entertainment      | Giải trí & sở thích      | A2-B1 | 4           | 80        | P3    |
| 9   | society-culture    | Xã hội & văn hóa         | B1-B2 | 3           | 60        | P4    |
| 10  | abstract-academic  | Từ trừu tượng & academic | B2    | 3           | 60        | P4    |
|     | **Total MVP**      |                          |       | **42**      | **840**   |       |

**Phase coding**: P0 = Tuần 2 immediate, P1 = Tuần 2 stretch, P2 = Tuần 3, P3 = Tuần 4-5, P4 = Tuần 6 polish hoặc post-MVP.

---

## 4. Lesson breakdown chi tiết

### Topic 1: `daily-life` (6 lessons, 120 cards)

#### P0 — `daily-life/family` (đã có 5/20, cần thêm 15)

- **CEFR**: A1 (15 cards) + A2 (5 cards)
- **Đã có**: family, mother, father, son, daughter
- **Cần gen (15 từ)**: `brother, sister, parent, child, husband, wife, baby, grandfather, grandmother, uncle, aunt, cousin, nephew, niece, relative`

#### P0 — `daily-life/food-meals` (20)

- **CEFR**: A1 (15) + A2 (5)
- **Từ (20)**: `breakfast, lunch, dinner, food, water, bread, rice, fruit, vegetable, meat, fish, milk, tea, coffee, sugar, salt, egg, cheese, snack, dessert`

#### P0 — `daily-life/home-rooms` (20)

- **CEFR**: A1 (15) + A2 (5)
- **Từ (20)**: `house, home, room, kitchen, bathroom, bedroom, living-room, garden, door, window, wall, floor, ceiling, stairs, balcony, garage, furniture, table, chair, bed`

#### P1 — `daily-life/clothes-appearance` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `clothes, shirt, trousers, dress, skirt, shoe, hat, coat, jacket, sock, belt, jeans, shorts, suit, scarf, glove, uniform, fashion, style, size`

#### P1 — `daily-life/body-health` (20)

- **CEFR**: A1 (12) + A2 (8)
- **Từ (20)**: `head, face, eye, ear, nose, mouth, hand, arm, leg, foot, hair, tooth, skin, heart, stomach, doctor, medicine, pain, healthy, sick`

#### P1 — `daily-life/daily-routine` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `wake-up, sleep, eat, drink, wash, shower, brush, dress, leave, return, rest, relax, exercise, cook, clean, shopping, evening, morning, afternoon, weekend`

---

### Topic 2: `people` (5 lessons, 100 cards)

#### P1 — `people/personality` (20)

- **CEFR**: A2 (10) + B1 (10)
- **Từ (20)**: `kind, friendly, shy, polite, honest, brave, lazy, smart, funny, serious, generous, patient, confident, quiet, talkative, careful, careless, selfish, calm, rude`

#### P1 — `people/emotions` (20)

- **CEFR**: A1 (8) + A2 (8) + B1 (4)
- **Từ (20)**: `happy, sad, angry, tired, bored, excited, worried, nervous, surprised, scared, proud, embarrassed, jealous, lonely, grateful, frustrated, relaxed, confused, ashamed, hopeful`

#### P2 — `people/greetings-social` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `hello, goodbye, please, thanks, sorry, welcome, meet, introduce, friend, neighbor, stranger, guest, host, party, invite, accept, refuse, agree, disagree, apologize`

#### P2 — `people/relationships` (20)

- **CEFR**: A2 (10) + B1 (10)
- **Từ (20)**: `love, marry, divorce, partner, boyfriend, girlfriend, fiancé, couple, single, engaged, wedding, anniversary, trust, respect, support, care, share, miss, argue, break-up`

#### P2 — `people/life-stages` (20)

- **CEFR**: A2 (8) + B1 (12)
- **Từ (20)**: `birth, childhood, teenager, adult, elderly, retire, generation, ancestor, descendant, grow-up, raise, education, career, parenthood, mid-life, senior, lifetime, legacy, mortal, era`

---

### Topic 3: `places-travel` (5 lessons, 100 cards)

#### P2 — `places-travel/city-places` (20)

- **CEFR**: A1 (8) + A2 (12)
- **Từ (20)**: `city, town, village, country, street, road, building, hospital, school, bank, restaurant, hotel, station, library, museum, park, supermarket, shop, market, church`

#### P2 — `places-travel/transportation` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `car, bus, train, plane, ship, bike, motorcycle, taxi, subway, ticket, driver, passenger, fuel, traffic, journey, arrive, depart, transfer, schedule, fare`

#### P2 — `places-travel/countries-nationalities` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `Vietnam, Vietnamese, America, American, Britain, British, France, French, Japan, Japanese, China, Chinese, Korea, Korean, Germany, German, language, foreign, native, abroad`

#### P3 — `places-travel/hotel-restaurant` (20)

- **CEFR**: A2 (10) + B1 (10)
- **Từ (20)**: `reservation, check-in, check-out, room-service, menu, order, waiter, chef, bill, tip, vegetarian, allergic, recommend, cancel, complaint, refund, lobby, suite, breakfast-buffet, takeaway`

#### P3 — `places-travel/airport-flight` (20)

- **CEFR**: A2 (5) + B1 (15)
- **Từ (20)**: `airport, flight, gate, terminal, passport, visa, luggage, boarding-pass, customs, delay, takeoff, landing, layover, departure, arrival, jet-lag, duty-free, cabin, aisle, window-seat`

---

### Topic 4: `time-numbers` (3 lessons, 60 cards)

#### P0 — `time-numbers/time-dates` (20)

- **CEFR**: A1 (15) + A2 (5)
- **Từ (20)**: `time, day, week, month, year, today, yesterday, tomorrow, hour, minute, second, morning, evening, night, midnight, calendar, date, century, decade, season`

#### P1 — `time-numbers/numbers-quantities` (20)

- **CEFR**: A1 (12) + A2 (8)
- **Từ (20)**: `one, hundred, thousand, million, first, second, third, last, few, many, several, half, whole, double, triple, dozen, percent, quarter, single, pair`

#### P1 — `time-numbers/weather-seasons` (20)

- **CEFR**: A1 (10) + A2 (10)
- **Từ (20)**: `weather, hot, cold, warm, cool, rain, snow, wind, sun, cloud, storm, thunder, lightning, foggy, humid, dry, spring, summer, autumn, winter`

---

### Topic 5: `work-business` (5 lessons, 100 cards) — P3 Tuần 4

- `work-business/jobs-occupations` (20) — `doctor, teacher, engineer, lawyer, nurse, farmer, chef, accountant, designer, artist, scientist, mechanic, secretary, salesperson, manager, ceo, employee, employer, freelancer, intern`
- `work-business/office-workplace` (20) — `office, desk, computer, email, phone, document, file, folder, printer, meeting-room, colleague, boss, hr, department, headquarters, branch, cubicle, reception, coffee-break, overtime`
- `work-business/meetings-comms` (20) — `meeting, agenda, discuss, present, propose, decide, agree, conclude, minutes, schedule, conference, deadline, brainstorm, feedback, follow-up, action-item, stakeholder, update, briefing, summary`
- `work-business/money-finance` (20) — `money, salary, bonus, tax, budget, profit, loss, save, spend, invest, loan, interest, bank, account, credit, debit, currency, exchange-rate, debt, wealth`
- `work-business/career` (20) — `job, career, hire, fire, resign, promote, demote, qualification, experience, skill, training, interview, resume, contract, full-time, part-time, remote, network, mentor, retire`

---

### Topic 6: `education` (4 lessons, 80 cards) — P3 Tuần 4

- `education/school-classroom` (20) — `school, classroom, student, teacher, lesson, homework, textbook, notebook, pen, pencil, blackboard, chalk, desk, ruler, eraser, calculator, dictionary, library, principal, schoolbag`
- `education/subjects-academic` (20) — `math, science, history, geography, literature, biology, chemistry, physics, art, music, philosophy, economics, sociology, psychology, linguistics, algebra, geometry, grammar, vocabulary, essay`
- `education/exams-results` (20) — `exam, test, quiz, score, grade, pass, fail, certificate, diploma, degree, gpa, scholarship, deadline, assignment, project, presentation, research, thesis, plagiarism, academic`
- `education/learning-skills` (20) — `learn, study, review, revise, memorize, understand, explain, practice, mistake, correct, improve, focus, concentrate, knowledge, skill, talent, ability, progress, fluency, mastery`

---

### Topic 7: `nature-environment` (4 lessons, 80 cards) — P3 Tuần 4-5

- `nature-environment/animals-pets` (20) — `dog, cat, bird, fish, rabbit, hamster, horse, cow, pig, chicken, sheep, goat, mouse, snake, frog, lion, tiger, elephant, monkey, dolphin`
- `nature-environment/plants-trees` (20) — `tree, flower, grass, leaf, root, branch, seed, plant, rose, lily, bamboo, oak, pine, fruit-tree, vegetable, garden, forest, jungle, harvest, bloom`
- `nature-environment/landscape-geography` (20) — `mountain, hill, valley, river, lake, sea, ocean, island, beach, desert, forest, jungle, cave, waterfall, coast, cliff, volcano, plain, peninsula, continent`
- `nature-environment/climate-env` (20) — `climate, pollution, recycle, environment, ecosystem, species, habitat, extinct, conserve, sustainable, renewable, fossil-fuel, greenhouse, deforestation, biodiversity, glacier, ozone, emission, carbon, eco-friendly`

---

### Topic 8: `entertainment` (4 lessons, 80 cards) — P3 Tuần 5

- `entertainment/sports-games` (20) — `sport, football, basketball, tennis, badminton, swimming, running, cycling, yoga, gym, match, score, team, player, coach, win, lose, draw, championship, tournament`
- `entertainment/music-arts` (20) — `music, song, singer, band, concert, instrument, guitar, piano, violin, drum, art, painting, sculpture, exhibition, artist, gallery, theatre, dance, opera, melody`
- `entertainment/movies-tv` (20) — `movie, film, cinema, actor, actress, director, scene, plot, genre, comedy, drama, horror, action, romance, series, episode, channel, subtitle, premiere, review`
- `entertainment/hobbies-leisure` (20) — `hobby, leisure, fun, enjoy, relax, vacation, picnic, camping, fishing, gardening, photography, collecting, board-game, video-game, puzzle, reading, drawing, knitting, traveling, sightseeing`

---

### Topic 9: `society-culture` (3 lessons, 60 cards) — P4 Tuần 6

- `society-culture/government-law` (20) — B1-B2 từ về government, law, election, court, police, crime, evidence, witness, lawyer, judge, jury, justice, freedom, democracy, rights, duty, parliament, constitution, vote, citizen
- `society-culture/traditions-festivals` (20) — A2-B1 từ về tradition, custom, festival, holiday, celebrate, religion, faith, temple, church, prayer, wedding, funeral, anniversary, parade, costume, ritual, heritage, ancestor, generation, identity
- `society-culture/news-media` (20) — B1-B2 từ về news, media, journalist, reporter, article, headline, broadcast, channel, publish, censor, propaganda, fake-news, social-media, influencer, post, share, comment, follower, viral, trend

---

### Topic 10: `abstract-academic` (3 lessons, 60 cards) — P4 Tuần 6

- `abstract-academic/thinking-knowledge` (20) — B2 từ về think, believe, assume, conclude, evidence, theory, hypothesis, analyze, perspective, opinion, fact, doubt, knowledge, wisdom, intuition, logic, reason, argument, claim, proof
- `abstract-academic/cause-effect` (20) — B1-B2 từ về cause, effect, result, lead-to, due-to, because, therefore, consequence, impact, influence, factor, outcome, reaction, response, trigger, since, thus, hence, owing-to, eventually
- `abstract-academic/linking-words` (20) — B2 từ về however, although, despite, moreover, furthermore, nevertheless, in-contrast, on-the-other-hand, similarly, likewise, in-conclusion, for-instance, in-addition, in-fact, indeed, regarding, with-respect-to, in-other-words, namely, overall

---

## 5. Phase ordering recommendation

### P0 — Tuần 2 này (3 lesson, 55 cards)

1. `daily-life/family` (+15 — đã có 5)
2. `daily-life/food-meals` (20)
3. `daily-life/home-rooms` (20)

**Vì sao**: ship FE `/decks` với 3 lesson đủ test golden path + nội dung A1 nhất quán.

### P1 — Tuần 2 stretch / Tuần 3 (7 lesson, 140 cards)

4. `daily-life/clothes-appearance` (20)
5. `daily-life/body-health` (20)
6. `daily-life/daily-routine` (20)
7. `people/personality` (20)
8. `people/emotions` (20)
9. `time-numbers/time-dates` (20)
10. `time-numbers/numbers-quantities` (20)

### P2 — Tuần 3 (5 lesson, 100 cards)

11. `time-numbers/weather-seasons` (20)
12. `places-travel/city-places` (20)
13. `places-travel/transportation` (20)
14. `places-travel/countries-nationalities` (20)
15. `people/greetings-social` (20)

### P3 — Tuần 4-5 (15 lesson, 300 cards)

Topic `work-business` + `education` + `nature-environment` + `entertainment` (mỗi topic 4 lesson).

### P4 — Tuần 6 polish (5-10 lesson, 100-200 cards)

Topic `society-culture` + `abstract-academic` + bù lesson còn thiếu.

**Tổng MVP**: ~700-1000 cards.

---

## 6. Quy trình gen 1 lesson (Claude desktop)

> Reference đầy đủ: `docs/CONTENT_PIPELINE.md` Phần 3-4. Tóm tắt fast-path:

1. Pick lesson từ Phần 4 trên (vd `daily-life/food-meals`).
2. Mở Claude desktop / claude.ai (free tier OK).
3. Paste **prompt template** (`docs/CONTENT_PIPELINE.md` Phần 4) + 20 từ trong "Cần gen".
4. Copy JSON output → save vào `content/collections/oxford-3000/topics/<topic>/<lesson>.json`.
   - Đảm bảo file có wrapper: `{ "slug": "...", "name": "...", "description": "...", "order_index": N, "estimated_minutes": 10, "cards": [...] }`. LLM thường chỉ trả `cards` array — bạn thêm wrapper.
5. Tạo `meta.json` cho topic nếu chưa có:
   ```json
   {
     "slug": "food-meals",
     "name": "Food & Meals",
     "description": "...",
     "order_index": 2,
     "icon": "utensils",
     "color": "#f97316"
   }
   ```
6. `pnpm validate:content content/collections/oxford-3000/topics/<topic>/<lesson>.json` — đọc `docs/CONTENT_REPORT.md`, sửa IPA/POS lệch nếu cần.
7. `pnpm seed` — verify counts in tăng đúng.
8. Commit trên `be`:
   ```bash
   git checkout be
   git add content/
   git commit -m "feat(content): add lesson <topic>/<lesson> (N cards)"
   ```
9. Sync `be → dev` qua workflow chuẩn (xem `docs/SYNC.md`).

---

## 7. Tips Vietnamese pedagogy

Apply khi review JSON LLM trả:

- **Mnemonic**: phải nghe được bằng âm Việt (`ephemeral` → `ếch êm rồi tắt`). Không xài tắt chữ cái đầu.
- **Examples**: bám ngữ cảnh người Việt (Hà Nội, Sài Gòn, công ty IT, Tết, đám cưới…). Tránh "I am a student".
- **Định nghĩa Việt**: đọc to thử. Nghe gượng → sửa. Tránh dịch word-by-word.
- **IPA**: ưu tiên British RP. Nếu American khác nhiều, ghi vào trường `etymology_hint` hoặc thêm vào `examples` note. (Hiện schema chỉ có 1 trường IPA — accept Oxford style).
- **Synonyms / antonyms**: chọn từ phổ biến cùng level. Không nhồi từ hiếm để show off.
- **Collocations**: tối thiểu 3, tối đa 5. Chọn cụm thật natural (không artificial).

---

## 8. Progress tracking

Cập nhật table này sau mỗi lesson xong + seed. Source-of-truth là DB (`pnpm seed` in `[seed] ✓ DB state: ...`).

| Topic              | Lesson                  | Cards        | Validated | Seeded  | Commit SHA |
| ------------------ | ----------------------- | ------------ | --------- | ------- | ---------- |
| daily-life         | family                  | 5/20         | ⚠ IPA     | ✅ live | (initial)  |
| daily-life         | food-meals              | 0/20         | —         | —       | —          |
| daily-life         | home-rooms              | 0/20         | —         | —       | —          |
| daily-life         | clothes-appearance      | 0/20         | —         | —       | —          |
| daily-life         | body-health             | 0/20         | —         | —       | —          |
| daily-life         | daily-routine           | 0/20         | —         | —       | —          |
| people             | personality             | 0/20         | —         | —       | —          |
| people             | emotions                | 0/20         | —         | —       | —          |
| people             | greetings-social        | 0/20         | —         | —       | —          |
| people             | relationships           | 0/20         | —         | —       | —          |
| people             | life-stages             | 0/20         | —         | —       | —          |
| places-travel      | city-places             | 0/20         | —         | —       | —          |
| places-travel      | transportation          | 0/20         | —         | —       | —          |
| places-travel      | countries-nationalities | 0/20         | —         | —       | —          |
| places-travel      | hotel-restaurant        | 0/20         | —         | —       | —          |
| places-travel      | airport-flight          | 0/20         | —         | —       | —          |
| time-numbers       | time-dates              | 0/20         | —         | —       | —          |
| time-numbers       | numbers-quantities      | 0/20         | —         | —       | —          |
| time-numbers       | weather-seasons         | 0/20         | —         | —       | —          |
| work-business      | (5 lessons)             | 0/100        | —         | —       | —          |
| education          | (4 lessons)             | 0/80         | —         | —       | —          |
| nature-environment | (4 lessons)             | 0/80         | —         | —       | —          |
| entertainment      | (4 lessons)             | 0/80         | —         | —       | —          |
| society-culture    | (3 lessons)             | 0/60         | —         | —       | —          |
| abstract-academic  | (3 lessons)             | 0/60         | —         | —       | —          |
| **TOTAL MVP**      |                         | **5 / ~840** |           |         |            |
