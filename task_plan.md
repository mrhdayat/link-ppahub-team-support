# Task Plan — Link page tactile (hi-fi faceplate)

## Goal
Halaman link-in-bio milik tim: 1 halaman publik + 1 admin (password env) untuk kustomisasi penuh. Gaya hybrid tactile: neumorphism + detail skeuomorfik dunia perangkat audio hi-fi.

## Decisions
| Keputusan | Pilihan | Alasan |
|---|---|---|
| Chrome headless memotong 390px | 1 | Ukur via iframe 390px di browser Orca: scrollWidth 390 |
| Security review: brute force / spoof IP / DoS lockout | 3 | Lockout per-IP + throttle global 10s + wajib password ≥12 di prod |
| Akun | 1 admin, `ADMIN_PASSWORD` env, cookie HMAC | User: "cuma harus ada akun admin saja" |
| Data | 1 dokumen JSON `site`. Neon (`DATABASE_URL`) atau `data/site.json` | 1 halaman = 1 dokumen; tabel blocks/pages = YAGNI |
| ORM | Tidak pakai Drizzle, cukup `neon()` SQL tag | 1 tabel kv, 2 query |
| Cache | `use cache` + `cacheTag('site')`, simpan → `updateTag('site')` | Next 16 cacheComponents |
| Dunia visual | Perangkat audio hi-fi (pilihan user) | Lihat `.impeccable` surface brief / PRD §6 |
| Worker | Claude via Orca orchestration | Pilihan user |

## Phases
- [x] 1. Discovery: scaffold ada, PRD lama (LinkForge, glass) → diganti
- [x] 2. PRODUCT.md + arah visual (concept-seed → user pilih hi-fi)
- [x] 3. PRD.md v2 ditulis ulang
- [x] 4. Fondasi (coordinator): schema, store, auth, tokens CSS, Faceplate renderer, halaman publik
- [x] 5. Orca wave 1 (paralel): W1 editor admin · W2 audit a11y/edge-case halaman publik (read-only report)
- [x] 6. Integrasi + build hijau + self-check test
- [x] 7. Verifikasi visual (desktop + mobile), impeccable detect, fix 1 batch
- [ ] 8. DESIGN.md + laporan

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
