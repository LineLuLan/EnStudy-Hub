# Branch Sync Status

> **Quy ước**: Cập nhật bảng dưới sau MỖI lần merge `be`/`fe` → `dev` HOẶC `dev` → `be`/`fe`.
> Mục tiêu: nhìn 1 phát biết 3 nhánh đang lệch nhau bao xa.

## Trạng thái hiện tại

| Branch | Last commit (short SHA) | Last sync FROM dev        | Last merge TO dev      | Notes                                            |
| ------ | ----------------------- | ------------------------- | ---------------------- | ------------------------------------------------ |
| main   | `5fbd1c0`               | —                         | 2026-05-12 (`ae65666`) | nhận v0.1.0-foundation (Phase 0 + Tuần 1) + tag  |
| dev    | `68bec35`               | base                      | 2026-05-13 (`063abca`) | Tuần 5 chunk 3 Listening mode merged             |
| be     | `eb6ec8f`               | 2026-05-13 (chunk 4 sync) | 2026-05-13 (`3627953`) | sync chunk 4 (/settings page) — chưa sync Tuần 5 |
| fe     | `063abca`               | 2026-05-13 (auth perf)    | 2026-05-13 (`063abca`) | base Tuần 5 chunk 3 (Listening mode)             |

> SHA hiện tại của `dev` thay đổi sau mỗi commit — chạy `git rev-parse --short HEAD` trên dev để lấy mới nhất.

## Quy trình sync chuẩn

### Sau khi commit trên `be`:

```bash
# (đang trên be)
git checkout dev
git pull
git merge be --no-ff -m "merge: be → dev"
git push origin dev
# update bảng SYNC.md ở trên
git checkout fe
git pull
git merge dev --no-ff -m "sync: dev → fe"
git push origin fe
git checkout be
```

### Sau khi commit trên `fe`:

```bash
# (đang trên fe)
git checkout dev
git pull
git merge fe --no-ff -m "merge: fe → dev"
git push origin dev
git checkout be
git pull
git merge dev --no-ff -m "sync: dev → be"
git push origin be
git checkout fe
```

### Khi nào `dev → main`:

- `pnpm build` pass
- Tất cả task trong `TRACKER.md` cho release đó `[x]`
- Manual test golden path đã chạy
- Tạo PR `dev → main` trên GitHub, self-review, merge, tag `vX.Y.Z`

## Conflict resolution

- Nếu `be` và `fe` cùng đụng 1 file (vd `package.json`):
  1. Merge `be → dev` trước.
  2. Sync `dev → fe`. Resolve conflict trên `fe`.
  3. Merge `fe → dev`.
- **Không bao giờ** `git rebase` 3 nhánh shared. Conflict cứ tay vào resolve commit thường.
- Nếu cần undo, dùng `git revert <sha>` — KHÔNG `reset --hard`.

## Log lịch sử merge

| Date       | Type   | From → To           | SHA after | Notes                                                                     |
| ---------- | ------ | ------------------- | --------- | ------------------------------------------------------------------------- |
| 2026-05-11 | init   | main → dev          | `9ba2508` | tạo dev, commit blueprint                                                 |
| 2026-05-11 | init   | dev → be            | `9ba2508` | tạo be                                                                    |
| 2026-05-11 | init   | dev → fe            | `9ba2508` | tạo fe                                                                    |
| 2026-05-11 | commit | (work) → dev        | `dd778af` | Phase 0 foundation: workflow + docs + scaffold + content pilot (66 files) |
| 2026-05-11 | sync   | dev → be            | `bea1a25` | merge --no-ff                                                             |
| 2026-05-11 | sync   | dev → fe            | `3206fd3` | merge --no-ff                                                             |
| 2026-05-11 | commit | (verify) → dev      | `f8cc446` | ESLint flat config + Supabase types + lockfile                            |
| 2026-05-11 | sync   | dev → be            | `016703e` |                                                                           |
| 2026-05-11 | sync   | dev → fe            | `b4bb87a` |                                                                           |
| 2026-05-11 | commit | (UI shell) → dev    | `c0ca891` | Tuần 1 layout/theme/command palette                                       |
| 2026-05-11 | sync   | dev → be            | `beb419c` |                                                                           |
| 2026-05-11 | sync   | dev → fe            | `33dd7f8` |                                                                           |
| 2026-05-11 | commit | (BE auth) → be      | `486498b` | Drizzle migration + auth actions + callback                               |
| 2026-05-11 | merge  | be → dev            | `8bf9121` |                                                                           |
| 2026-05-11 | sync   | dev → fe            | `a04303f` |                                                                           |
| 2026-05-11 | commit | (FE login) → fe     | `b41ace0` | Login form with magic link + Google                                       |
| 2026-05-11 | merge  | fe → dev            | `675b08e` |                                                                           |
| 2026-05-11 | sync   | dev → be            | `d8f4227` |                                                                           |
| 2026-05-11 | commit | (db fix) → be       | `5c47f9c` | fix(db): drizzle-kit env loading + skip auth.users CREATE in migration    |
| 2026-05-11 | merge  | be → dev            | `4f17bb9` | bring db migrate fix back to dev                                          |
| 2026-05-12 | commit | (docs ship) → dev   | `ae65666` | docs: tick Phase 0 + Tuần 1 done, auth flow verified real (2026-05-12)    |
| 2026-05-12 | merge  | dev → main          | `5fbd1c0` | release: v0.1.0-foundation + tag                                          |
| 2026-05-12 | sync   | dev → be            | `b9b075c` | post-release sync                                                         |
| 2026-05-12 | sync   | dev → fe            | `741c601` | post-release sync                                                         |
| 2026-05-12 | commit | (Tuần 2 BE) → be    | `72e1229` | feat(seed): scripts/seed.ts upsert thật vào Supabase                      |
| 2026-05-12 | merge  | be → dev            | `8eac9aa` | bring Tuần 2 seed work back to dev                                        |
| 2026-05-12 | sync   | dev → fe            | `3db6e43` | sync Tuần 2 BE để fe sẵn sàng build /decks UI khi có data                 |
| 2026-05-12 | commit | (family+15) → be    | `83dc6e1` | feat(content): family lesson +15 cards (đủ 20)                            |
| 2026-05-12 | merge  | be → dev            | `f4dbc0f` | bring family 20 cards to dev                                              |
| 2026-05-12 | sync   | dev → fe            | `f831cf6` | sync family 20 cards                                                      |
| 2026-05-12 | commit | (food-meals) → be   | `3a2eb17` | feat(content): add lesson daily-life/food-meals (20 cards)                |
| 2026-05-12 | merge  | be → dev            | `edb90f4` | bring food-meals to dev                                                   |
| 2026-05-12 | sync   | dev → fe            | `97a7a68` | sync food-meals                                                           |
| 2026-05-12 | commit | (home-rooms) → be   | `2bb295e` | feat(content): add lesson daily-life/home-rooms (20 cards) — P0 done      |
| 2026-05-12 | merge  | be → dev            | `5bda7a9` | bring home-rooms to dev — P0 batch 60 cards live                          |
| 2026-05-12 | sync   | dev → fe            | `d857f72` | sync home-rooms — P0 done                                                 |
| 2026-05-12 | commit | (decks UI) → fe     | `0156c17` | feat(decks): list collections + topics + lessons + enroll                 |
| 2026-05-12 | merge  | fe → dev            | `6bc6448` | bring /decks FE to dev                                                    |
| 2026-05-12 | sync   | dev → be            | `354d89a` | sync /decks FE (post Tuần 2 FE)                                           |
| 2026-05-12 | commit | (docs ship) → dev   | `7083cd2` | docs(infra): handoff Tuần 2 FE done — UI polish + render bug PENDING      |
| 2026-05-12 | sync   | dev → fe            | `2104629` | bring handoff docs back to fe                                             |
| 2026-05-12 | commit | (polish) → fe       | `78d8bdd` | fix(vocab): error/loading boundaries + 2-col grid + typography polish     |
| 2026-05-12 | merge  | fe → dev            | `ff527be` | bring Tuần 2 FE polish (render bug fix + UI tinh chỉnh) to dev            |
| 2026-05-12 | sync   | dev → be            | `8e90de0` | sync Tuần 2 FE polish to be                                               |
| 2026-05-12 | commit | (docs polish) → dev | `0e38bcb` | docs(infra): handoff Tuần 2 FE polish done + Cloze ideation               |
| 2026-05-12 | sync   | dev → be            | `da3c708` | bring polish docs to be trước khi mở Tuần 3                               |
| 2026-05-12 | commit | (Tuần 3 BE) → be    | `87da8ef` | feat(srs): Tuần 3 BE foundation — fsrs + queue + submitReview + tests     |
| 2026-05-12 | merge  | be → dev            | `ae89cb2` | bring Tuần 3 BE foundation to dev                                         |
| 2026-05-12 | sync   | dev → fe            | `eb844d0` | sync Tuần 3 BE foundation (ready cho /review UI)                          |
| 2026-05-12 | commit | (BE docs) → dev     | `b535823` | docs(infra): handoff Tuần 3 BE foundation done                            |
| 2026-05-12 | commit | (chunk 2 FE) → fe   | `3206996` | feat(srs): /review FE shell — flashcard flip + Zustand + summary          |
| 2026-05-12 | merge  | fe → dev            | `311feb3` | bring Tuần 3 chunk 2 /review FE shell to dev                              |
| 2026-05-12 | sync   | dev → be            | `70d9780` | sync chunk 2 cho BE đọc submitReview signature                            |
| 2026-05-12 | commit | (chunk 3 FE) → fe   | `8fa69ef` | feat(srs): /review Terminal Cloze (Tuan 3 chunk 3) — masks + grade derive |
| 2026-05-12 | merge  | fe → dev            | `a57327f` | bring Tuần 3 chunk 3 Terminal Cloze to dev                                |
| 2026-05-12 | sync   | dev → be            | `2c7d234` | sync chunk 3 cho BE đọc layout Cloze + reviewType='typing'                |
| 2026-05-12 | commit | (chunk 4 FE) → fe   | `f13577d` | feat(srs): persist review results to localStorage                         |
| 2026-05-12 | merge  | fe → dev            | `de97b64` | bring Tuần 3 chunk 4 persist to dev                                       |
| 2026-05-12 | sync   | dev → be            | `8d7c212` | sync chunk 4 (persist middleware) xuống be                                |
| 2026-05-12 | commit | (Tuần 4 BE) → be    | `139afed` | feat(stats): Tuan 4 BE foundation - streak + heatmap + maturity           |
| 2026-05-12 | commit | (commitlint) → be   | `c0cfba1` | chore(config): allow 'stats' scope in commitlint                          |
| 2026-05-12 | merge  | be → dev            | `3443d13` | bring Tuần 4 BE foundation stats to dev                                   |
| 2026-05-12 | sync   | dev → fe            | `1e3201a` | sync Tuần 4 BE foundation (ready cho /dashboard UI session)               |
| 2026-05-13 | commit | (chunk 2 FE) → fe   | `e229e1f` | feat(ui): Tuan 4 chunk 2 /dashboard FE (stats + heatmap)                  |
| 2026-05-13 | merge  | fe → dev            | `dad126c` | bring Tuần 4 chunk 2 /dashboard FE to dev                                 |
| 2026-05-13 | sync   | dev → be            | `048d99a` | sync chunk 2 (dashboard FE) xuống be                                      |
| 2026-05-13 | commit | (chunk 3 FE) → fe   | `4aee6b3` | feat(stats): Tuan 4 chunk 3 /stats page (retention + activity + maturity) |
| 2026-05-13 | merge  | fe → dev            | `42387aa` | bring Tuần 4 chunk 3 /stats page to dev                                   |
| 2026-05-13 | sync   | dev → be            | `27e676d` | sync chunk 3 (/stats page) xuống be                                       |
| 2026-05-13 | commit | (auth perf) → be    | `3627953` | fix(auth): drop network roundtrip on every navigation                     |
| 2026-05-13 | merge  | be → dev            | `962e5dc` | bring auth perf fix (getSession + React.cache) to dev                     |
| 2026-05-13 | sync   | dev → fe            | `cbb5499` | sync auth perf fix to fe                                                  |
| 2026-05-13 | commit | (chunk 4 FE) → fe   | `a640f02` | feat(auth): Tuan 4 chunk 4 /settings page (profile + limits + theme)      |
| 2026-05-13 | merge  | fe → dev            | `0096632` | bring Tuần 4 chunk 4 /settings page to dev                                |
| 2026-05-13 | sync   | dev → be            | `eb6ec8f` | sync chunk 4 (/settings page) xuống be                                    |
| 2026-05-13 | commit | (T5 ch1 FE) → fe    | `2f6186e` | feat(review): Tuan 5 chunk 1 mode picker + MCQ mode                       |
| 2026-05-13 | merge  | fe → dev            | `dc7016a` | bring Tuần 5 chunk 1 (mode picker + MCQ) to dev                           |
| 2026-05-13 | commit | (T5 ch2 FE) → fe    | `fe1861a` | feat(review): Tuan 5 chunk 2 typing-from-definition mode                  |
| 2026-05-13 | merge  | fe → dev            | `b4e062d` | bring Tuần 5 chunk 2 (typing-from-definition) to dev                      |
| 2026-05-13 | commit | (T5 ch3 FE) → fe    | `063abca` | feat(review): Tuan 5 chunk 3 Listening mode (Web Speech API)              |
| 2026-05-13 | merge  | fe → dev            | `68bec35` | bring Tuần 5 chunk 3 (Listening mode) to dev                              |
