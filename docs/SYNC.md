# Branch Sync Status

> **Quy ước**: Cập nhật bảng dưới sau MỖI lần merge `be`/`fe` → `dev` HOẶC `dev` → `be`/`fe`.
> Mục tiêu: nhìn 1 phát biết 3 nhánh đang lệch nhau bao xa.

## Trạng thái hiện tại

| Branch | Last commit (short SHA) | Last sync FROM dev        | Last merge TO dev      | Notes                                                        |
| ------ | ----------------------- | ------------------------- | ---------------------- | ------------------------------------------------------------ |
| main   | `5433a6f`               | —                         | —                      | initial commit only (`README.md`) — chưa nhận Phase 0/Tuần 1 |
| dev    | `675b08e`               | base                      | (sau merge fe)         | Tuần 1 done (UI shell + auth)                                |
| be     | `d8f4227`               | 2026-05-11 (sau fe merge) | 2026-05-11 (`486498b`) | BE auth + migration merged                                   |
| fe     | `b41ace0`               | 2026-05-11 (sau be merge) | 2026-05-11 (`b41ace0`) | FE login form merged                                         |

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

| Date       | Type   | From → To        | SHA after | Notes                                                                     |
| ---------- | ------ | ---------------- | --------- | ------------------------------------------------------------------------- |
| 2026-05-11 | init   | main → dev       | `9ba2508` | tạo dev, commit blueprint                                                 |
| 2026-05-11 | init   | dev → be         | `9ba2508` | tạo be                                                                    |
| 2026-05-11 | init   | dev → fe         | `9ba2508` | tạo fe                                                                    |
| 2026-05-11 | commit | (work) → dev     | `dd778af` | Phase 0 foundation: workflow + docs + scaffold + content pilot (66 files) |
| 2026-05-11 | sync   | dev → be         | `bea1a25` | merge --no-ff                                                             |
| 2026-05-11 | sync   | dev → fe         | `3206fd3` | merge --no-ff                                                             |
| 2026-05-11 | commit | (verify) → dev   | `f8cc446` | ESLint flat config + Supabase types + lockfile                            |
| 2026-05-11 | sync   | dev → be         | `016703e` |                                                                           |
| 2026-05-11 | sync   | dev → fe         | `b4bb87a` |                                                                           |
| 2026-05-11 | commit | (UI shell) → dev | `c0ca891` | Tuần 1 layout/theme/command palette                                       |
| 2026-05-11 | sync   | dev → be         | `beb419c` |                                                                           |
| 2026-05-11 | sync   | dev → fe         | `33dd7f8` |                                                                           |
| 2026-05-11 | commit | (BE auth) → be   | `486498b` | Drizzle migration + auth actions + callback                               |
| 2026-05-11 | merge  | be → dev         | `8bf9121` |                                                                           |
| 2026-05-11 | sync   | dev → fe         | `a04303f` |                                                                           |
| 2026-05-11 | commit | (FE login) → fe  | `b41ace0` | Login form with magic link + Google                                       |
| 2026-05-11 | merge  | fe → dev         | `675b08e` |                                                                           |
| 2026-05-11 | sync   | dev → be         | `d8f4227` |                                                                           |
