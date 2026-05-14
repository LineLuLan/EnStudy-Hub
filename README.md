# EnStudy-Hub

Web học từ vựng tiếng Anh cho người Việt — kiến trúc multi-tenant ready,
content-first, FSRS-powered. Solo dev, vibe coding với Claude Opus 4.7.

[![CI status](https://github.com/LineLuLan/EnStudy-Hub/actions/workflows/backup.yml/badge.svg?branch=main)](https://github.com/LineLuLan/EnStudy-Hub/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Tính năng

| Khu vực            | Đã có                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**           | Magic link (Supabase Auth) + auto-create profile/user_stats trigger.                                                                            |
| **Decks**          | Browse collections → topics → lessons → cards. Enroll bài học → tự tạo `user_cards` với FSRS state mặc định.                                    |
| **CSV import**     | `/decks/import` upload CSV → preview validate → tạo personal collection riêng cho mỗi user (multi-tenant). Auto-enroll sau import.              |
| **Edit cards**     | Inline edit word/IPA/meaning/example cho cards trong personal collection. Official cards immutable từ FE.                                       |
| **Review queue**   | `getReviewQueue` chia due + new theo timezone user, limit `dailyNewCards` từ profile. Exclude suspended cards.                                  |
| **4 minigame**     | **Cloze** (đục lỗ sentence), **MCQ** (4 choices từ sibling cards), **Typing-from-definition**, **Listening** (Web Speech API).                  |
| **Card actions**   | Personal notes (max 500 char) + suspend/bury toggle per card. Surface trong review session + chip trên deck preview.                            |
| **Stats**          | `/dashboard` streak + heatmap 12 tuần + due/mature counts. `/stats` retention line, activity bar, maturity donut (zero charting lib — raw SVG). |
| **Settings**       | Tên hiển thị, timezone (11 IANA), daily new/review limits, theme (Sun/Moon/Monitor).                                                            |
| **Keyboard-first** | ⌘K command palette, Space lật flashcard, 1-4 rating, `?` hint, Esc skip.                                                                        |
| **Accessibility**  | Skip-to-content link, semantic headings, WCAG AA contrast, `aria-label` icon buttons, lang="vi".                                                |
| **Mobile**         | Responsive ≥375px (iPhone SE), hamburger menu, grid cols-2 mobile.                                                                              |

## Stack

| Layer      | Lib                                                                  |
| ---------- | -------------------------------------------------------------------- |
| Framework  | Next.js 15 App Router · TypeScript strict                            |
| DB         | Supabase Postgres + RLS + Auth                                       |
| ORM        | Drizzle ORM 0.36                                                     |
| Validation | Zod 3                                                                |
| UI         | shadcn-style primitives + Tailwind v4 + Framer Motion + Lucide icons |
| SRS        | ts-fsrs 4 (FSRS-4.5 algorithm)                                       |
| State      | Zustand (review session only — rest is RSC/Server Actions)           |
| Toast      | sonner                                                               |
| Theme      | next-themes (Sun/Moon/Monitor)                                       |
| Date/TZ    | date-fns + date-fns-tz                                               |
| Tests      | Vitest (108 unit tests)                                              |
| Hosting    | Vercel (planned)                                                     |

## Quickstart

### Requirements

- Node.js 20 LTS
- pnpm 9.x (`corepack enable`)
- Supabase project (free tier OK) — see [`docs/API_KEYS.md`](./docs/API_KEYS.md)

### Setup

```bash
git clone https://github.com/LineLuLan/EnStudy-Hub.git
cd EnStudy-Hub
git checkout dev          # work branch (main is release-only)
pnpm install
cp .env.example .env.local  # paste keys from docs/API_KEYS.md
```

### Database

```bash
pnpm db:push              # apply Drizzle schema to Supabase
# Then run src/lib/db/rls.sql in Supabase SQL Editor (one-time)
pnpm seed                 # seed P0 content (3 lessons × 20 cards)
```

### Dev

```bash
pnpm dev                  # localhost:3000
pnpm test                 # vitest run (108 tests)
pnpm typecheck && pnpm lint && pnpm build  # full verify
```

## Architecture

```
src/
├── app/(auth)/login              auth route
├── app/(app)/{dashboard,decks,review,stats,settings}
├── components/{layout,ui,review,decks,dashboard,stats,settings,auth}
├── features/
│   ├── auth/{actions,profile}    server actions for auth
│   ├── vocab/{queries,enrollment,content-schema,
│   │          csv-schema,csv-parse,csv-import,
│   │          card-edit-schema,card-edit}
│   ├── srs/{queue,queue-utils,fsrs,actions,
│   │        card-actions-schema,card-actions}
│   └── stats/{dates,streak,heatmap,maturity,
│              retention,activity}
├── lib/
│   ├── db/{schema,client,rls.sql,migrations/}
│   ├── auth/session              cached requireUserId/getCurrentUserId
│   ├── supabase/{server,client,middleware}
│   ├── env                       Zod-validated env
│   └── utils/cn
├── stores/review-session         Zustand persist (results + mode)
└── middleware.ts                 protect (app) routes
```

**Key patterns**:

- **Server-first**: RSC + Server Actions cho mọi data mutation. Zustand chỉ giữ review session state.
- **Pure schema + impure action split**: `*-schema.ts` (Zod, testable) tách khỏi `*.ts` (`'use server'`) — vitest không pull DB client.
- **Multi-tenant via collection ownership**: official content `isOfficial=true`; user-imported tạo `collections.ownerId=userId, isOfficial=false`. Chain topics→collections→lessons→cards.
- **Drizzle bypass RLS**: service-role connection → app enforce ownership trong queries. See [ADR-008](./docs/DECISIONS.md).
- **Code split** với `next/dynamic` cho minigame cards, CardActions, CardEditForm — initial `/review` First Load = 126 kB.

Full architecture spec: [`VOCAB_APP_BLUEPRINT.md`](./VOCAB_APP_BLUEPRINT.md) (980 lines).

## Branch model

```
main   release-only, tag vX.Y.Z khi ship
 ↑     (PR only, never push thẳng)
dev    integration / staging
 ↑ ↑
be     backend long-running (queries, server actions, schema)
fe     frontend long-running (RSC, client, components)
```

Quy ước: `--no-ff` mọi merge, không rebase 4 nhánh shared, `git revert` thay vì `reset --hard`.

Chi tiết: [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md).

## Releases

| Tag                 | Ngày       | Highlights                                          |
| ------------------- | ---------- | --------------------------------------------------- |
| `v0.1.0-foundation` | 2026-05-12 | Auth + scaffold + Drizzle schema + RLS              |
| `v0.2.0`            | 2026-05-13 | Dashboard + Stats + Settings + 4 minigame modes     |
| `v1.0.0` (planned)  | 2026-05-?? | + CSV import + card actions + card editing + backup |

## Documentation

| File                                                     | Purpose                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| [`VOCAB_APP_BLUEPRINT.md`](./VOCAB_APP_BLUEPRINT.md)     | Full technical spec (stack, schema, SRS, UX)   |
| [`docs/README.md`](./docs/README.md)                     | Docs index                                     |
| [`docs/TRACKER.md`](./docs/TRACKER.md)                   | 6-week roadmap + status                        |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md)                   | Session-to-session notes (cold-start friendly) |
| [`docs/SYNC.md`](./docs/SYNC.md)                         | Branch sync state + merge log                  |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md)               | ADRs (architecture decision records)           |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)         | Git workflow + commit conventions              |
| [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md)           | First-time setup + troubleshooting             |
| [`docs/API_KEYS.md`](./docs/API_KEYS.md)                 | Supabase + secrets cheatsheet                  |
| [`docs/CONTENT_PIPELINE.md`](./docs/CONTENT_PIPELINE.md) | How vocab content is generated + validated     |
| [`docs/CONTENT_PLAN.md`](./docs/CONTENT_PLAN.md)         | 10-topic, 42-lesson MVP content plan           |
| [`docs/GLOSSARY.md`](./docs/GLOSSARY.md)                 | Domain terms                                   |

## License

[MIT](./LICENSE) — © 2026 LineLuLan.

Wordlist samples derived from public/CC sources (Oxford 3000, etc.) — see `docs/CONTENT_PIPELINE.md` for attribution.
