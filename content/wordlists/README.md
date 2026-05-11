# Wordlists — Public domain / CC-licensed sources

> **Hợp pháp**: Chỉ tải danh sách từ (word list). KHÔNG tải định nghĩa từ
> Oxford/Cambridge/Merriam (có bản quyền).

## Cách lấy

| File | Nguồn gợi ý | License |
|---|---|---|
| `oxford-3000.csv` | https://github.com/sapbmw/The-Oxford-3000 (CSV mirror) | OK (list only) |
| `oxford-5000.csv` | https://github.com/sapbmw/The-Oxford-3000 | OK |
| `ngsl.csv` | https://www.newgeneralservicelist.com/new-general-service-list | CC BY-SA |
| `awl.csv` | https://en.wikipedia.org/wiki/Academic_Word_List | Public |
| `coca-5000.csv` | https://www.wordfrequency.info/samples.asp | Free sample |

Tải về xong → đặt tên đúng convention `kebab-case.csv` → commit vào `content/wordlists/`.

CSV tối thiểu phải có cột `word` (UTF-8). Có thêm `cefr`, `frequency`, `pos` càng tốt.

## Sample

File `oxford-3000-sample.csv` trong folder này là **subset 40 từ** dùng cho pilot Phase 0.
Khi user đã quen quy trình → thay bằng file Oxford 3000 đầy đủ.
