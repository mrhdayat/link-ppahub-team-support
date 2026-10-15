# PRD — Halaman Link Tactile

**Versi:** 2.1 (dunia visual diganti ke bengkel; lihat §12)
**Tanggal:** 15 Oktober 2026
**Status:** Dalam eksekusi

Perubahan dari v1.0: multi-user, login OAuth, editor blok bento, dan prompt→page dihapus. Produk ini **satu halaman publik milik tim + satu admin**. Arah visual berganti dari frosted glass ke **hybrid tactile** (neumorphism + skeuomorphism) dengan dunia visual **perangkat audio hi-fi**.

---

## 1. Ringkasan

Halaman link-in-bio milik sendiri. Pengunjung membuka satu halaman dan mengetuk link yang dicari. Admin masuk ke `/admin` dengan password, mengatur isi dan tampilan, melihat hasilnya langsung, lalu menyimpan.

Halaman dirancang seperti sebuah perangkat hi-fi: satu panel cetak dari satu bahan, avatar duduk sebagai kerucut speaker di balik grille, setiap link adalah tombol preset dengan lampu indikator.

## 2. Masalah

- Halaman Linktree terlihat sama semua; hanya beda warna.
- Layanan pihak ketiga menampilkan branding dan iklan mereka, serta membatasi kustomisasi di paket gratis.
- Neumorphism yang biasa dibuat orang punya kontras rendah dan tombol yang tidak terlihat bisa ditekan.

## 3. Pengguna

| Peran | Situasi | Kebutuhan |
|---|---|---|
| Pengunjung | Dari bio IG, QR, atau WhatsApp, hampir selalu di ponsel | Menemukan link yang benar dalam beberapa detik |
| Admin | Satu orang di tim, bukan desainer | Mengubah link & gaya tanpa developer, melihat hasil sebelum simpan |

## 4. Tujuan & Ukuran Berhasil

1. Halaman publik terbaca dan bisa dipakai dalam < 3 detik di 4G (statis, tanpa JS untuk konten).
2. Admin bisa mengganti link, urutan, dan tema dalam < 2 menit tanpa bantuan.
3. Kontras teks ≥ 4.5:1 di **setiap** kombinasi warna yang bisa dipilih admin (dijamin oleh kode, bukan oleh admin).
4. Lighthouse mobile ≥ 95 (Performa, Aksesibilitas, Best Practices).

## 5. Ruang Lingkup v1

### 5.1 Halaman publik `/`
- Profil: nama, bio (≤ 160 karakter), avatar (URL atau unggahan kecil). Tanpa avatar → inisial.
- Link (≤ 40): label, URL, ikon (18 pilihan), tampil/sembunyi, **lit** (lampu menyala permanen untuk link utama).
- Sosial (≤ 12): baris tombol bulat (Instagram, TikTok, YouTube, WhatsApp, LinkedIn, X, Facebook, Email, Website).
- Animasi tanda tangan: **power-on** — lampu tombol berkedip berurutan sekali saat halaman dibuka, lalu lampu daya menyala. Dimatikan oleh `prefers-reduced-motion`.
- SEO dasar: title, description, Open Graph dari profil. `theme-color` mengikuti warna meja.

### 5.2 Admin `/admin`
- Login password tunggal (`ADMIN_PASSWORD`). Cookie httpOnly bertanda tangan HMAC, 7 hari.
- Editor dua panel: kontrol di kiri, preview langsung di kanan (ponsel: preview di atas/tab).
- Kontrol isi: ubah profil, tambah/ubah/hapus/urutkan link dan sosial, ubah avatar.
- Kontrol tampilan:
  - **Bahan** (preset): Kapur, Grafit, Zaitun, Baja, atau warna bebas.
  - **Warna lampu** (LED).
  - **Radius sudut** 0–28 px, **Kedalaman** bayangan 0–100%.
  - **Gaya tombol**: timbul, cekung, pil.
  - **Huruf**: Archivo, Barlow, Bricolage Grotesque.
  - **Grille** speaker: tampil/sembunyi.
- Simpan → validasi server (Zod) → cache halaman publik langsung diperbarui (`updateTag`).
- Tanda belum disimpan, peringatan saat meninggalkan halaman, pesan galat yang menyebut bagian yang salah.

### 5.3 Di luar lingkup v1
Multi-user, statistik klik, domain kustom, jadwal tampil link, embed video, form email, prompt→halaman. Bisa menyusul di v2 bila dibutuhkan.

## 6. Prinsip Desain

Gaya: **hybrid tactile**, dunia visual **perangkat audio hi-fi**.

1. **Satu bahan.** Semua bayangan, sorotan, dan permukaan diturunkan dari satu warna dasar (`themeVars`). Admin memilih dua warna; sistem menurunkan sisanya.
2. **Kontras dijamin kode.** Warna tinta dihitung dari luminans warna dasar dan dipaksa ≥ 4.5:1. Admin tidak bisa membuat halaman yang tidak terbaca.
3. **Status lewat lampu, bukan bayangan saja.** Kelemahan neumorphism adalah tombol tak terbedakan; di sini setiap tombol punya LED (mati = sel gelap yang tetap terlihat, menyala = aktif/utama/fokus).
4. **Tekan terasa fisik.** Tombol turun 2 px dan bayangannya berbalik ke dalam dalam 90 ms. Hover hanya untuk mouse.
5. **Satu momen gerak.** Power-on saat halaman dibuka. Tidak ada animasi masuk per-bagian.
6. **Tidak generik.** Tanpa kicker/eyebrow, tanpa gradient text, tanpa glass dekoratif, tanpa kartu ikon seragam, tanpa emoji sebagai ikon.
7. **Mobile dulu.** `100svh`, safe area, input ≥ 16 px, target sentuh ≥ 44 px, tanpa tap highlight.

## 7. Arsitektur

| Bagian | Pilihan |
|---|---|
| Framework | Next.js 16 App Router, Cache Components |
| Data | 1 dokumen JSON `site`. Neon Postgres bila `DATABASE_URL` ada; selain itu `data/site.json` |
| Cache | `getSite()` = `'use cache'` + `cacheTag('site')`; simpan → `updateTag('site')` |
| Validasi | Zod (`siteSchema`), URL hanya `http(s)`, `mailto`, `tel` |
| Auth | `ADMIN_PASSWORD`, HMAC cookie, perbandingan constant-time |
| Gaya | CSS biasa + custom properties untuk faceplate; Tailwind v4 tersedia |
| Ikon | Phosphor (SSR) |

File inti: `src/lib/site.ts` (skema, preset, `themeVars`), `src/lib/color.ts`, `src/lib/store.ts`, `src/lib/auth.ts`, `src/app/actions.ts`, `src/components/faceplate.tsx|css`.

## 8. Rencana Eksekusi (Orca orchestration)

| Task | Pemilik | Isi | Dependensi |
|---|---|---|---|
| T1 Fondasi | Koordinator | Skema, store, auth, actions, faceplate, halaman publik | — |
| T2 Editor admin | Worker Claude (worktree) | `/admin/login`, `/admin`, panel kontrol, preview | T1 |
| T3 Audit publik | Worker Claude (worktree) | Uji data ekstrem + a11y + mobile, laporan + perbaikan kecil di faceplate | T1 |
| T4 Integrasi | Koordinator | Merge, build, verifikasi visual, DESIGN.md | T2, T3 |

## 9. Risiko

| Risiko | Mitigasi |
|---|---|
| File lokal hilang di hosting serverless | Wajib `DATABASE_URL` saat deploy ke Vercel; dicatat di README |
| Tebak password | Jeda 600 ms per gagal; v2: rate limit per IP |
| Avatar besar membengkakkan dokumen | Editor mengecilkan ke 256 px WebP; skema membatasi 200 KB |
| Neumorphism tidak terbaca | Kontras dihitung & diuji (`site.check.ts`) |

## 10. Definisi Selesai

- [ ] `npm run build` hijau, `npx tsx src/lib/site.check.ts` lulus.
- [ ] Admin bisa login, mengubah semua isi & tema, preview sinkron, simpan, dan halaman publik berubah.
- [ ] Halaman publik benar di 390 px dan 1440 px, tanpa overflow pada data ekstrem.
- [ ] `prefers-reduced-motion` dan `prefers-contrast` dihormati; fokus keyboard terlihat.
- [ ] DESIGN.md mendokumentasikan sistem yang dibangun.

---

## 12. Revisi 2.1 — Dunia bengkel (15 Oktober 2026)

Menggantikan dunia "perangkat hi-fi" di §1, §5 dan §6. Permintaan: bentuk benar-benar seperti radio head unit truk / toolbox mekanik, detail, motion mikro dan makro, background tidak monoton.

### Bentuk
- **Radio head unit** (double-DIN, plastik hitam bertekstur) berdiri di atas lemari: layar VFD dot-matrix (font Doto) dengan jam dan meter level, kenop VOL dan TUNE bergerigi, **6 tombol preset karet = media sosial** (maksimal 6).
- **Lemari perkakas** (roll cab, cat powder coat): stiker vinyl berisi avatar, **nama di label Dymo** (huruf timbul), **bio ditulis spidol di selotip kertas**, gembok, pegangan samping, kick plate diamond plate, roda.
- **Setiap link = laci** dengan pegangan aluminium dan kartu label putih di bingkai krom. Link utama = laci lebih dalam dengan LED menyala di ujung pegangan.
- **Latar:** pegboard dengan perkakas tergantung (kunci, obeng, palu, tang, meteran), lampu kerja, lantai beton. Scene lain: *malam* (dinding seng, cahaya bulan) dan *polos*.

### Kustomisasi admin
Cat lemari (Merah bengkel, Hitam doff, Biru baja, Hijau army, Kuning safety, atau bebas), warna nyala layar, pegangan laci (batang/mangkuk/lidah), scene, trim logam (krom/hitam), radio tampil/sembunyi, huruf (Barlow Condensed/Big Shoulders/Archivo), radius, kedalaman bayangan.

### Motion
| Jenis | Gerak | Alasan |
|---|---|---|
| Makro, sekali | Lampu menyala (satu kedip), radio turun ke tempatnya, VFD warm-up, laci-laci "duduk" berurutan | Momen pembuka yang diingat |
| Makro, scroll | Dinding, lampu bergeser dengan kecepatan berbeda; kenop VOL berputar mengikuti scroll | Kedalaman berlapis (scroll-craft hero-depth), CSS `animation-timeline` |
| Makro, ambien | Lampu berayun sekali lalu diam | Tidak ada loop tanpa akhir |
| Mikro | Laci keluar sedikit saat hover, tertarik saat ditekan; tombol preset turun 3 px + LED; VFD menampilkan nama link yang disorot/difokus | Feedback & state |
Semua gerak dimatikan oleh `prefers-reduced-motion`; scroll-driven turun ke statis di browser yang belum mendukung.

### Tetap berlaku
Kontras dijamin kode (teks ≥ 4.5:1; warna nyala diangkat otomatis bila terlalu gelap), target sentuh ≥ 44 px, fokus terlihat, tanpa dependensi baru.
