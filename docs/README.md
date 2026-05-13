# EnStudy-Hub — Docs Index

> **Đọc đầu tiên mỗi session AI / mỗi khi quay lại sau vài ngày.**
> Mục tiêu của `docs/` là để mọi session AI và mọi nhánh (`be`, `fe`, `dev`) đều cùng "thấy" trạng thái dự án.

## Mục lục

| File                                         | Mục đích                                  | Khi nào đọc                    |
| -------------------------------------------- | ----------------------------------------- | ------------------------------ |
| [TRACKER.md](./TRACKER.md)                   | Roadmap 6 tuần + trạng thái từng task     | Đầu mỗi session                |
| [HANDOFF.md](./HANDOFF.md)                   | Session trước dừng ở đâu, ai làm gì       | Đầu mỗi session                |
| [SYNC.md](./SYNC.md)                         | 3 nhánh `be`/`fe`/`dev` đang ở commit nào | Trước khi merge                |
| [DECISIONS.md](./DECISIONS.md)               | ADR — quyết định kỹ thuật + lý do         | Khi định đổi quyết định        |
| [API_KEYS.md](./API_KEYS.md)                 | Keys/APIs cần user cung cấp               | Khi gặp env error / setup mới  |
| [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md) | Quy trình gen content + nguồn tham khảo   | Khi cần thêm từ vựng           |
| [CONTRIBUTING.md](./CONTRIBUTING.md)         | Quy tắc git + commit + branch flow        | Trước push/merge               |
| [ENVIRONMENT.md](./ENVIRONMENT.md)           | Setup máy mới + `.env` chi tiết           | Setup lần đầu / máy mới        |
| [GLOSSARY.md](./GLOSSARY.md)                 | Thuật ngữ (FSRS, SRS, RLS, RSC...)        | Khi đọc blueprint mà chưa hiểu |

## Source of truth

- **Kỹ thuật:** `../VOCAB_APP_BLUEPRINT.md` (root) — không sửa trừ khi có DECISIONS entry mới.
- **Tiến độ thực tế:** `TRACKER.md`.
- **Bối cảnh hiện tại:** `HANDOFF.md`.

## Quy ước cập nhật

- **Cuối mỗi session AI**: cập nhật `HANDOFF.md` (append entry mới ở đầu file).
- **Mỗi lần merge `be`/`fe` → `dev`**: cập nhật `SYNC.md`.
- **Mỗi lần đổi stack/schema/quyết định lớn**: thêm entry vào `DECISIONS.md`.
- **Mỗi lần thêm lesson content**: cập nhật bảng tiến độ trong `CONTENT_PIPELINE.md`.

## Đường ngắn nhất để bắt đầu code

1. Đọc `HANDOFF.md` — entry mới nhất.
2. Đọc `TRACKER.md` — task đang `in_progress`.
3. Đọc section liên quan trong `../VOCAB_APP_BLUEPRINT.md`.
4. Đọc `CONTRIBUTING.md` nếu sắp commit.
5. Code.
