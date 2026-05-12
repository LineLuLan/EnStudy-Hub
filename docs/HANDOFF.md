# Handoff — Session Notes

> **Quy ước**: Cuối mỗi session AI, APPEND entry MỚI ở ĐẦU file (entries gần nhất trước).
> Mục tiêu: session AI sau đọc 2-3 entry trên cùng là pick up cold được.

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
