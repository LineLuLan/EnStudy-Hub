# EnStudy-Hub

Web học từ vựng tiếng Anh cho người Việt — kiến trúc clean để mở rộng SaaS.
Solo dev, vibe coding với Claude Opus 4.7.

## Quickstart

```bash
git clone https://github.com/LineLuLan/EnStudy-Hub.git
cd EnStudy-Hub
git checkout dev          # hoặc be / fe tuỳ task
pnpm install
cp .env.example .env.local  # điền keys từ docs/API_KEYS.md
pnpm dev
```

## Tài liệu

| File | Mục đích |
|---|---|
| [`VOCAB_APP_BLUEPRINT.md`](./VOCAB_APP_BLUEPRINT.md) | Blueprint kỹ thuật A→Z (source of truth) |
| [`docs/README.md`](./docs/README.md) | Index docs nội bộ |
| [`docs/TRACKER.md`](./docs/TRACKER.md) | Roadmap 6 tuần |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | Note session-to-session |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Git workflow + commit conventions |
| [`docs/API_KEYS.md`](./docs/API_KEYS.md) | Keys cần cung cấp |

## Stack

Next.js 15 (App Router) · TypeScript strict · Supabase (Postgres + Auth + RLS) ·
Drizzle ORM · Zod · shadcn/ui · Tailwind v4 · Framer Motion · ts-fsrs · Zustand ·
React Hook Form · cmdk · next-themes · date-fns + date-fns-tz · Vercel.

## Branch model

```
main   (production, never push thẳng)
 ↑
dev    (integration / staging)
 ↑ ↑
be fe  (backend / frontend long-running)
```

Chi tiết xem [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md).

## License

Private — solo project. Toàn bộ wordlist tham khảo lấy từ nguồn public/CC licensed
(xem `docs/CONTENT_PIPELINE.md`).
