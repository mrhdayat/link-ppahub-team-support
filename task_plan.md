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
- [x] 8. DESIGN.md + laporan

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|

## Iterasi 2 — Workshop (2026-10-15)
Permintaan: tampilan lebih menarik, mirip head unit truk / toolbox mekanik, motion mikro + makro, background tidak monoton, pakai scroll-craft.
| Keputusan | Pilihan | Alasan |
|---|---|---|
| Dunia | Radio head unit double-DIN di atas lemari perkakas (roll cab) di bengkel | Menggabungkan "radio hi-fi" + "toolbox mekanik/headunit truk" jadi satu adegan nyata |
| Link | Laci dengan pegangan aluminium + kartu label | Toolbox grammar; laci "ditarik" saat ditekan |
| Sosial | 6 tombol preset radio (maks 6) | Head unit punya 6 preset |
| Background | Pegboard + perkakas SVG, lampu kerja berayun, lantai beton; scene garasi/malam/polos | Tidak monoton, berlapis (scroll-craft hero-depth) |
| Motion makro | Boot (lampu berkedip, VFD warm-up, laci settle), lamp sway, scroll-driven drift per plane + kenop VOL berputar | CSS-only, off main thread |
| Motion mikro | Laci keluar saat hover/press, tombol preset turun 3px + LED, VFD menampilkan link yang disorot | Feedback + state |
| Aset foto | Tidak dipakai (KIE_AI_API_KEY tidak ada); semua digambar CSS/SVG | Material interaktif harus kode |
- [x] Kontrak tema baru (da50ae5)
- [x] Halaman publik workshop (6a4bae2)
- [x] T5 editor admin workshop (worker)
- [x] T6 audit workshop (worker)
- [ ] Integrasi, verifikasi, DESIGN.md update

## Iterasi 3 — Rambu Navigasi (2026-10-15 malam)
User: desain workshop kurang; tampil terbatas 6; minta "papan pengumuman" atau ikuti PRD baru "Rambu Navigasi" (ubah semua), mobile-first. Platform: tetap Next.js + admin (dipilih user).
- [x] Skema CONFIG baru + self-check (681f17d), PRD disimpan (d56b98a)
- [x] Halaman publik Rambu (d4b34e0), verifikasi 390 siang/malam, jalur 10 tautan lipat
- [ ] T7 editor admin CONFIG (worker, retry ctx_88cafc3ed7bf)
- [ ] T8 audit publik (worker ctx_cea4f04afddb)
- [ ] Integrasi, build, DESIGN.md baru

## Iterasi 4 — Analitik + dashboard (2026-10-16..18)
- [x] "dilewati" dihapus → jumlah klik per tautan (tampilKlik), /api/hit + /api/hits, Neon/file (8b4cd5b, d7d00ad)
- [x] Bug preview admin kosong: marquee melebarkan preview (contain: inline-size)
- [x] T9 dashboard: Ringkasan analitik, CRUD tautan/kategori, profil, pengaturan, satu Toaster (merge 72d6d19)
- [x] Rasio klik → klik per kunjungan
- [ ] Neon: menunggu user `npx neon@latest login`, lalu link project + env + migrasi data
- [ ] Deploy Vercel (butuh persetujuan user)
