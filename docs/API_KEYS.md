# API Keys & Services — User cần cung cấp

> **Quy ước**: Khi gặp env error / setup mới → đọc bảng dưới.
> KHÔNG bao giờ commit value thật vào git. Chỉ commit `.env.example` rỗng.

---

## Tổng quan

| Key / Service | Cần khi | Bắt buộc | Free? |
|---|---|---|---|
| Supabase project (4 keys) | Tuần 1 onwards | **Có** | Free tier 500MB |
| Google OAuth | Tuần 1 (Google login) | Optional | Free |
| Vercel | Cuối Tuần 1 (deploy) | Optional | Free hobby tier |
| Free Dictionary API | Tuần 2 (validate content) | Optional | **Free, no key** |
| Wiktionary API | Tuần 2 (validate) | Optional | **Free, no key** |
| ElevenLabs / Coqui TTS | Post-MVP (audio cache) | Không | $5/mo (paid) |
| Anthropic API | Post-MVP (AI tutor) | Không | Pay-per-token |

---

## 1. Supabase (BẮT BUỘC từ Tuần 1)

### Cách lấy

1. Vào https://supabase.com/dashboard
2. **New project** → đặt tên `enstudy-hub`, password DB mạnh (lưu password manager), region `Southeast Asia (Singapore)`.
3. Đợi ~2 phút project provision xong.
4. Vào **Settings → API**:
   - `Project URL` → copy vào `NEXT_PUBLIC_SUPABASE_URL`
   - `Project API keys → anon public` → copy vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Project API keys → service_role` → copy vào `SUPABASE_SERVICE_ROLE_KEY` (**TUYỆT ĐỐI KHÔNG expose client**)
5. Vào **Settings → Database → Connection pooling**:
   - Connection string (mode: `Transaction`) → copy vào `DATABASE_URL`
   - Lưu ý: thay `[YOUR-PASSWORD]` bằng DB password set ở bước 2.

### Cấu hình thêm

- **Auth → Providers**: enable `Email (magic link)` mặc định.
- **Auth → URL Configuration**: thêm `http://localhost:3000/auth/callback` vào `Redirect URLs`.

---

## 2. Google OAuth (OPTIONAL — magic link đủ test)

### Cách lấy

1. Vào https://console.cloud.google.com
2. **Create project** `enstudy-hub-auth`
3. **APIs & Services → OAuth consent screen**: External, app name `EnStudy Hub`, support email = your email.
4. **Credentials → Create credentials → OAuth client ID**:
   - Application type: `Web application`
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Copy `Client ID` → `GOOGLE_OAUTH_CLIENT_ID`
6. Copy `Client secret` → `GOOGLE_OAUTH_CLIENT_SECRET`
7. Trên Supabase: **Auth → Providers → Google** → paste 2 giá trị này, save.

---

## 3. Vercel (OPTIONAL — deploy)

### Cách lấy

1. Vào https://vercel.com → sign in bằng GitHub.
2. **Add New → Project** → chọn repo `LineLuLan/EnStudy-Hub`.
3. **Build settings**: defaults OK (Next.js auto-detect).
4. **Environment Variables**: paste tất cả keys ở phần Supabase + Google OAuth (cho Production + Preview).
5. Deploy.
6. (Optional) Vercel CLI: `npm i -g vercel && vercel login` để deploy local.

---

## 4. Free Dictionary API (KHÔNG cần key)

- Base URL: `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`
- Ví dụ: `https://api.dictionaryapi.dev/api/v2/entries/en/ephemeral`
- Free, không rate limit công bố. Nên throttle ~1 req/s khi validate batch.

## 5. Wiktionary REST API (KHÔNG cần key)

- Base URL: `https://en.wiktionary.org/api/rest_v1/page/definition/<word>`
- Free, không rate limit. CC BY-SA license.

---

## Template `.env.local` (user tự tạo, không commit)

```bash
# === Supabase (BẮT BUỘC từ Tuần 1) ===
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."          # SERVER ONLY
DATABASE_URL="postgresql://postgres.xxxxx:[PWD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# === Google OAuth (Optional) ===
GOOGLE_OAUTH_CLIENT_ID=""
GOOGLE_OAUTH_CLIENT_SECRET=""

# === App ===
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## Quy tắc bảo mật

1. **Không bao giờ** commit `.env.local`, `.env.production`, hay bất kỳ file chứa secret.
2. `SUPABASE_SERVICE_ROLE_KEY` bypass RLS — chỉ dùng server-side (Server Actions, scripts). Nếu lộ → revoke ngay ở Supabase dashboard.
3. Nếu xác định 1 key đã commit nhầm: `git filter-repo` để xóa khỏi history + rotate key.
4. Trên Vercel, env vars set qua dashboard — không hard-code.
