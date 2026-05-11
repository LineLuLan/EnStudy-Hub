# Environment Setup — Máy mới / Setup lần đầu

> **Đọc khi**: clone repo lần đầu, đổi máy, hoặc gặp lỗi env.

---

## 1. Yêu cầu hệ thống

| Tool             | Version               | Cài thế nào                              |
| ---------------- | --------------------- | ---------------------------------------- |
| Node.js          | 20 LTS (xem `.nvmrc`) | https://nodejs.org hoặc `nvm install 20` |
| pnpm             | 9.x                   | `npm i -g pnpm@9` hoặc `corepack enable` |
| Git              | 2.40+                 | https://git-scm.com                      |
| (Optional) `tsx` | runs ts scripts       | đã trong devDeps, gọi qua `pnpm tsx`     |

Khuyên cài thêm:

- **GitHub CLI** (`gh`) — quick PR ops.
- **Supabase CLI** — local Supabase nếu muốn dev offline (`brew install supabase/tap/supabase` hoặc scoop trên Windows).

---

## 2. Clone & install

```bash
git clone https://github.com/LineLuLan/EnStudy-Hub.git
cd EnStudy-Hub
git fetch --all                          # lấy be, fe, dev
git checkout dev                          # mặc định work trên dev
pnpm install
```

---

## 3. Tạo `.env.local`

```bash
cp .env.example .env.local
# Mở .env.local, paste keys từ API_KEYS.md
```

Tối thiểu cần (Tuần 1+):

```bash
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
DATABASE_URL=""
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Xem `API_KEYS.md` cho cách lấy từng key.

---

## 4. Verify setup

```bash
pnpm typecheck      # 0 errors
pnpm lint           # 0 errors
pnpm dev            # localhost:3000 mở được
```

Nếu Tuần 1 trở đi và đã có Supabase keys:

```bash
pnpm db:gen         # generate migration từ schema
pnpm db:push        # apply lên Supabase
# (chạy SQL RLS policies từ blueprint Phần 3.2 thủ công ở Supabase SQL editor)
```

---

## 5. Scripts có sẵn (`package.json`)

| Script                  | Mục đích                                         |
| ----------------------- | ------------------------------------------------ |
| `pnpm dev`              | Next.js dev server (`localhost:3000`)            |
| `pnpm build`            | Production build                                 |
| `pnpm start`            | Run production build                             |
| `pnpm lint`             | ESLint check                                     |
| `pnpm format`           | Prettier write                                   |
| `pnpm typecheck`        | `tsc --noEmit`                                   |
| `pnpm db:gen`           | `drizzle-kit generate`                           |
| `pnpm db:push`          | `drizzle-kit push`                               |
| `pnpm db:migrate`       | `drizzle-kit migrate`                            |
| `pnpm seed`             | Seed content JSON → Supabase                     |
| `pnpm seed:dry`         | Dry-run seed (log only)                          |
| `pnpm validate:content` | Validate content + cross-check dictionaryapi.dev |

---

## 6. Troubleshooting thường gặp

### `Error: Invalid environment variables` khi `pnpm dev`

- Mở `.env.local`, đảm bảo 4 Supabase keys điền đúng URL hợp lệ.
- Nếu Phase 0 chưa cấp Supabase: tạm thời tất cả keys = `""` (env.ts có fallback dev).

### `pnpm install` lỗi `EUNSUPPORTEDPROTOCOL`

- Update pnpm: `corepack prepare pnpm@latest --activate`

### Husky không chạy `pre-commit`

```bash
pnpm prepare      # rerun husky install
chmod +x .husky/*
```

### Next.js report `Module not found: @/lib/...`

- Check `tsconfig.json` `paths` config có `"@/*": ["./src/*"]`.
- Restart TS server (VSCode: Cmd+Shift+P → Restart TS Server).

### Drizzle `Cannot find module 'postgres'`

```bash
pnpm add postgres
```

### `pnpm db:push` báo `password authentication failed`

- Mở Supabase dashboard → Settings → Database → Reset database password.
- Update `DATABASE_URL` trong `.env.local`.

---

## 7. Dev workflow nhanh (cheat sheet)

```bash
# bắt đầu phiên BE
git checkout be && git pull && git merge dev --no-ff

# bắt đầu phiên FE
git checkout fe && git pull && git merge dev --no-ff

# integrate
git checkout dev && git pull && git merge <be|fe> --no-ff && git push

# release
git checkout dev && pnpm build && # tạo PR dev → main
```
