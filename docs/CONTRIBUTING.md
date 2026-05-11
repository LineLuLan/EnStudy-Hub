# Contributing — Git Workflow & Code Conventions

> **Đọc trước khi**: push, merge, rebase, hay đụng vào branch protection.

---

## 1. Mô hình nhánh

```
main          (production, never push thẳng)
  ↑
 dev          (integration / staging)
  ↑     ↑
 be    fe    (long-running, tách context BE / FE)
```

- **`be`**: code backend (Drizzle schema, server actions, `features/*`, `scripts/seed.ts`, content JSON).
- **`fe`**: code frontend (components, app routes UI, styles, stores Zustand).
- **`dev`**: integration, dùng chung config + lib utils. BE/FE merge vào đây để test together.
- **`main`**: production. Chỉ nhận merge từ `dev` qua PR + tag.

---

## 2. Daily workflow (solo dev)

### Khi bắt đầu task BE
```bash
git checkout be
git pull
git merge dev --no-ff -m "sync: dev → be"   # đảm bảo có updates mới nhất từ dev
# code...
git add <files>
git commit -m "feat(srs): add fsrs scheduler"
git push origin be
```

### Khi bắt đầu task FE
```bash
git checkout fe
git pull
git merge dev --no-ff -m "sync: dev → fe"
# code...
git add <files>
git commit -m "feat(ui): add flashcard component"
git push origin fe
```

### Khi muốn integrate (`be`/`fe` → `dev`)
```bash
git checkout dev
git pull
git merge be --no-ff -m "merge: be → dev (feat: srs core)"
# test pnpm dev / pnpm build
git push origin dev
# update docs/SYNC.md bảng trạng thái
```

### Khi release (`dev` → `main`)
```bash
# verify
git checkout dev
pnpm typecheck && pnpm lint && pnpm build
# tạo PR trên GitHub: dev → main
# self-review, merge merge-commit
# tag
git checkout main && git pull
git tag -a v0.X.Y -m "release v0.X.Y: <feature summary>"
git push origin v0.X.Y
```

---

## 3. Quy tắc bất di bất dịch

| Quy tắc | Lý do |
|---|---|
| KHÔNG `git rebase` `main`, `dev`, `be`, `fe` | Mất history, conflict 3-way phức tạp |
| KHÔNG `git push --force` lên 4 nhánh trên | Phá history remote, mất commit của session khác |
| KHÔNG `git reset --hard` trên 4 nhánh trên | Mất commit không phục hồi được |
| Undo bằng `git revert <sha>` | Tạo commit mới đảo ngược, history vẫn nguyên |
| Conflict tay vào resolve, commit thường | Đơn giản, an toàn |
| Merge bằng `--no-ff` (merge commit) | Giữ rõ "khi nào BE/FE meet" trong history |
| Không commit `.env*` (trừ `.env.example`) | Lộ secrets |

### Hook tự động (sau khi cài Husky ở Phase 0)
- `pre-commit`: `lint-staged` chạy ESLint + Prettier trên file đã stage.
- `commit-msg`: `commitlint` chặn message sai format.

---

## 4. Commit convention (Conventional Commits)

Format:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat`: tính năng mới
- `fix`: sửa bug
- `chore`: maintenance (deps, config, no logic change)
- `docs`: chỉ sửa docs
- `refactor`: đổi code không đổi behavior
- `test`: thêm/sửa test
- `style`: format (không đổi semantics)
- `perf`: cải thiện performance
- `ci`: CI/CD config
- `build`: build system

### Scopes ưu tiên
- `srs`, `vocab`, `auth`, `db`, `ui`, `content`, `seed`, `infra`, `docs`

### Ví dụ
```
feat(srs): add fsrs scheduler wrapper
fix(auth): handle expired magic link token
chore(deps): bump drizzle-orm to 0.30
docs(handoff): add Tuần 2 entry
refactor(vocab): extract enrollLesson to features layer
```

### Body khi cần
```
feat(srs): add review queue interleaving

Trộn new cards vào reviews thay vì dồn cuối queue.
Step = floor(reviews / news). Edge case empty queue handled.

Closes #12
```

---

## 5. Code conventions (theo blueprint Phần 2.3)

- File: `kebab-case.ts`
- Component: `PascalCase`, file `kebab-case.tsx`
- Server Action: `verbNoun()` — `submitReview`, `createCard`
- DB column: `snake_case`
- TS type: `PascalCase`
- Zod schema: `xxxSchema`
- Server Action return: `{ ok: true, data } | { ok: false, error }` — không throw

---

## 6. Khi gặp conflict 3-way (`be` ↔ `fe` qua `dev`)

1. Merge nhánh "đi trước" vào `dev` trước (vd `be` nếu commit timestamp sớm hơn).
2. Sync `dev → fe` — resolve conflict trên `fe` local.
3. Test `pnpm build` trên `fe` sau resolve.
4. Push `fe`.
5. Merge `fe → dev` sau cùng.

Nếu conflict trong `package.json` lock → xóa `pnpm-lock.yaml`, chạy `pnpm install`, commit lock mới.

---

## 7. PR template (`.github/PULL_REQUEST_TEMPLATE.md` — sẽ tạo)

Khi tạo PR (chủ yếu `dev → main`):
- Branch from / Branch to
- Tóm tắt 2-3 dòng
- Checklist:
  - [ ] `pnpm typecheck` pass
  - [ ] `pnpm lint` pass
  - [ ] `pnpm build` pass
  - [ ] Manual test golden path
  - [ ] `TRACKER.md` cập nhật
  - [ ] `SYNC.md` cập nhật
- Test plan: liệt kê step manual test
