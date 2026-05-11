# Glossary — Thuật ngữ

> **Đọc khi**: gặp acronym trong blueprint/docs/code không hiểu.

---

## Spaced Repetition

| Term | Giải thích |
|---|---|
| **SRS** | Spaced Repetition System — hệ thống lặp lại ngắt quãng. Tăng interval mỗi lần nhớ đúng. |
| **FSRS** | Free Spaced Repetition Scheduler — thuật toán SRS thế hệ mới (open source) dùng trong app này. Lib: `ts-fsrs`. |
| **Rating** | Đánh giá user khi ôn 1 card: `1 = Again`, `2 = Hard`, `3 = Good`, `4 = Easy`. |
| **Card state** | `new` (chưa học), `learning` (đang học bước đầu), `review` (đã thuộc, ôn định kỳ), `relearning` (rớt, học lại). |
| **Stability** | (FSRS) Độ ổn định nhớ — càng cao càng lâu mới phải ôn lại. |
| **Difficulty** | (FSRS) Độ khó cá nhân của card này với user này. |
| **Due** | Thời điểm card sẵn sàng ôn lại. |
| **Interval** | Khoảng thời gian giữa 2 lần ôn. |
| **Maturity** | Card được coi là `mature` khi stability vượt threshold (vd 21 ngày). |
| **Retention rate** | % card user nhớ đúng khi tới hạn. Target FSRS thường set `0.9`. |

---

## Database & Backend

| Term | Giải thích |
|---|---|
| **RLS** | Row Level Security — Postgres feature: filter row theo user qua policy SQL. Supabase dùng cùng `auth.uid()`. |
| **RSC** | React Server Components — Next.js 15 default. Render server, không ship JS xuống client. |
| **Server Action** | Next.js mutation function chạy server-side, gọi từ form/onClick mà không cần API route. |
| **CRUD** | Create, Read, Update, Delete. |
| **ORM** | Object-Relational Mapping. Ở đây dùng Drizzle (type-safe SQL builder). |
| **Migration** | File SQL describe schema change, run tuần tự để build DB từ rỗng đến trạng thái hiện tại. |
| **Upsert** | Insert hoặc Update tùy có conflict không (Postgres: `ON CONFLICT DO UPDATE`). |
| **Pooler** | Connection pooler (PgBouncer) giúp app share connections, tránh hết quota Postgres. Supabase cung cấp pooler URL ở port 6543. |
| **Idempotency** | Operation chạy nhiều lần kết quả như chạy 1 lần. Dùng `clientReviewId` để chống double-submit. |
| **Transaction** | Group nhiều SQL thành atomic unit — all-or-nothing. |

---

## Multi-tenancy & Auth

| Term | Giải thích |
|---|---|
| **Multi-tenant** | App phục vụ nhiều user, mỗi user thấy chỉ data của mình. Ở đây: mọi user row có `user_id`. |
| **Magic link** | Auth flow: gửi email link → click → đăng nhập, không password. |
| **OAuth** | Authorization protocol: user grant app quyền qua provider (Google, GitHub...). |
| **Service role key** | Supabase admin key bypass RLS. Chỉ dùng server-side, không expose client. |
| **Anon key** | Supabase public key, gắn với RLS policies. Safe để expose client. |
| **JWT** | JSON Web Token — Supabase Auth issue cho user, gắn `auth.uid()` claim. |

---

## Content & Linguistics

| Term | Giải thích |
|---|---|
| **CEFR** | Common European Framework of Reference — A1 (vỡ lòng) → C2 (proficient). |
| **POS** | Part of Speech — noun, verb, adjective, adverb, ... |
| **IPA** | International Phonetic Alphabet — phiên âm /ɪˈfem.ər.əl/. |
| **Lemma** | Dạng từ điển của từ (vd `run` là lemma của `running`, `ran`, `runs`). |
| **Collocation** | Cụm từ tự nhiên đi với nhau (vd `make a decision`, `heavy rain`). |
| **NGSL** | New General Service List — 2800 từ phổ biến nhất English. |
| **AWL** | Academic Word List — 570 từ học thuật. |
| **COCA** | Corpus of Contemporary American English — corpus tần suất nguồn cho wordlist. |
| **Mnemonic** | Mẹo nhớ. Ở đây dùng cho người Việt: liên tưởng âm thanh/hình ảnh. |

---

## Frontend

| Term | Giải thích |
|---|---|
| **shadcn/ui** | Component library copy-paste (không phải npm package), build trên Radix + Tailwind. |
| **Radix UI** | Headless primitives (Dialog, Dropdown, ...) không có style. |
| **Zustand** | State management nhẹ. Ở đây chỉ cho review session (transient state). |
| **Framer Motion** | Animation library. |
| **cmdk** | Command palette library (Ctrl+K menu). |
| **Sonner** | Toast notification library. |
| **next-themes** | Light/dark mode switching cho Next.js. |
| **Optimistic update** | UI cập nhật ngay khi user action, rollback nếu server fail. |

---

## Workflow

| Term | Giải thích |
|---|---|
| **ADR** | Architecture Decision Record — file ngắn ghi 1 quyết định kỹ thuật + lý do. |
| **Conventional Commits** | Spec format commit message: `type(scope): subject`. |
| **PR** | Pull Request — branch xin merge vào branch khác qua GitHub UI. |
| **Branch protection** | GitHub rule chặn force push, require PR, ... trên 1 branch. |
| **Handoff** | Note từ session làm việc này sang session làm việc kế tiếp. |
| **Phase 0** | Foundation setup trước khi vào Tuần 1 roadmap. |
| **MVP** | Minimum Viable Product — 6 tuần đầu, đủ dùng cho 1 user (chính mình). |
