## Branch flow

- **From**: `be` / `fe` / `dev` (chọn 1)
- **To**: `dev` / `main` (chọn 1)
- **Related blueprint section / TRACKER task**: ...

## Tóm tắt

2-3 dòng mô tả thay đổi & lý do.

## Checklist

- [ ] `pnpm typecheck` pass
- [ ] `pnpm lint` pass
- [ ] `pnpm build` pass
- [ ] Manual test golden path (mô tả ở phần Test plan)
- [ ] `docs/TRACKER.md` cập nhật task status
- [ ] `docs/SYNC.md` cập nhật bảng trạng thái nhánh
- [ ] Schema thay đổi? → migration generated + committed
- [ ] Env vars mới? → `.env.example` cập nhật + `docs/API_KEYS.md` ghi

## Test plan

```
1. ...
2. ...
3. ...
```

## Screenshots (nếu thay đổi UI)

(paste hoặc drag image)

## Risk / rollback

- Mức độ rủi ro: Low / Medium / High
- Cách rollback nếu lỗi: `git revert <merge-sha>`
