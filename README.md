# TEAM SUPPORT · Rambu Navigasi

Halaman tautan kerja TEAM SUPPORT ("Berjaya di darat, laut dan udara") bergaya rambu lalu lintas (HUD + neubrutalism). Satu halaman publik di `/`, satu admin di `/admin` untuk mengubah CONFIG (profil, status, kategori/jalur, tautan) tanpa menyentuh kode. Spesifikasi lengkap ada di [PRD.md](PRD.md).

## Jalankan lokal

```bash
cp .env.example .env.local   # isi ADMIN_PASSWORD (min. 12 karakter acak)
npm install
npm run dev
```

- Halaman publik: http://localhost:3000
- Admin: http://localhost:3000/admin
- Contoh data ekstrem (dev saja): http://localhost:3000/lab

Tanpa `DATABASE_URL`, data disimpan di `data/site.json`. Isi awal (4 kategori, 53 tautan) ada di `src/lib/default-site.json`.

## Environment

| Variabel | Wajib | Isi |
|---|---|---|
| `ADMIN_PASSWORD` | Ya | Password admin. Di production minimal 12 karakter. |
| `SESSION_SECRET` | Tidak | Kunci tanda tangan cookie. Kalau kosong, diturunkan dari password dengan scrypt. |
| `DATABASE_URL` | Saat deploy serverless | Connection string Neon Postgres (pooled). Tabel `site_doc` dan `hits` dibuat otomatis. |

## Database (Neon)

1. Database Neon `link-teamppa` (project `autumn-bird-28712909`, aws-us-east-1) dibuat lewat integrasi Vercel, karena org Neon akun ini dikelola Vercel: `vercel integration add neon --name link-teamppa --no-connect`.
2. Salin connection string **pooled** ke `.env.local` sebagai `DATABASE_URL`.
3. Buat tabel dan isi CONFIG awal:

```bash
npm run db:setup            # tabel site_doc + hits, isi CONFIG kalau belum ada
npm run db:setup -- --force # timpa CONFIG di Neon dengan data/site.json
```

| Tabel | Isi |
|---|---|
| `site_doc` | 1 baris `key = 'site'`, kolom `value` (jsonb) berisi seluruh CONFIG |
| `hits` | Statistik agregat: `(day, k, n)`, tanpa data pengunjung |

## Deploy

Di Vercel atau hosting serverless lain, **wajib** isi `DATABASE_URL`, `ADMIN_PASSWORD` (min. 12 karakter), dan sebaiknya `SESSION_SECRET`. Disk serverless tidak permanen, jadi `data/site.json` akan hilang. `vercel.json` menaruh fungsi di `iad1` (Washington), satu region dengan database Neon di us-east-1. Halaman publik tetap dilayani dari CDN terdekat karena dirender statis. Di VPS atau server biasa, file lokal sudah cukup.

## Cek

```bash
npm run check   # skema, URL aman, tata letak jalur, status & zona waktu, label, ikon, statistik
npm run build
```

## Header keamanan

`next.config.ts` mengirim CSP, HSTS (2 tahun, termasuk subdomain), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, dan `X-Frame-Options: DENY` (plus `frame-ancestors 'none'`) di semua rute.

CSP `script-src` memakai `'self' 'unsafe-inline'`. Ini disengaja. Next 16 menaruh data halaman (RSC payload, `self.__next_f.push(...)`) sebagai skrip inline yang isinya berubah setiap CONFIG disimpan, jadi tidak bisa di-hash saat build. Nonce memang bisa, tapi Next hanya menempelkannya saat render dinamis. Akibatnya semua halaman harus dirender per request, dan itu tidak cocok dengan halaman statis/PPR dari `cacheComponents` (lihat `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`). Jangan menambah hash atau nonce di samping `'unsafe-inline'`, karena browser lalu mengabaikan `'unsafe-inline'` dan skrip Next berhenti jalan. Yang tetap ketat: tidak ada skrip dari domain lain, tanpa `eval` di production (Zod dijalankan `jitless`), `object-src 'none'`, `base-uri`, `form-action`, dan `connect-src` hanya ke situs ini, Open-Meteo, dan BMKG. Mode dev menambah `'unsafe-eval'` dan `ws:` untuk HMR.

Untuk mengecek, jalankan server production lalu cari pelanggaran CSP lewat headless Chrome (tanpa dependensi):

```bash
npm run build && npx next start -p 3130
node --env-file-if-exists=.env.local scripts/csp-check.mjs   # /, /admin/login, /tim, dan /admin kalau ADMIN_PASSWORD ada
```

Kalau menambah sumber eksternal baru (font, API, gambar non-https), tambahkan ke CSP di `next.config.ts`, lalu jalankan cek ini.

## Tes otomatis (GitHub Actions)

`.github/workflows/ci.yml` berjalan di setiap push dan pull request ke `main`. Urutannya: `npm ci`, `npm run check`, `next typegen` + `tsc`, `npm run build` (memakai file store dengan password CI sekali pakai, tanpa database), lalu `scripts/smoke.mjs` di server production. Smoke test mengecek beranda (TEAM SUPPORT + jalur), pencarian, login salah lalu benar, `/api/hit` (204 dan 400), dan CSP. Run lama yang tertimpa push baru otomatis dibatalkan.

Untuk menjalankan smoke test secara lokal (server dari langkah di atas harus sudah jalan; `BASE` default `http://localhost:3130`):

```bash
node --env-file-if-exists=.env.local scripts/smoke.mjs
```

Catatan: smoke test mengirim 1 hit `view` dan 1 percobaan login salah ke `BASE`. Jangan arahkan ke production.

## Backup otomatis

Setiap Selasa 07:00 WITA (Senin 23:00 UTC), `.github/workflows/backup.yml` mengunduh CONFIG dari `/api/backup`. Isinya konten halaman: profil, kategori, tautan termasuk yang diarsipkan, dan tim. Statistik, riwayat versi, dan password admin tidak ikut. File disimpan di branch `backups` sebagai `backups/config-YYYY-MM-DD.json`, dan hanya 26 file terbaru yang disimpan (sekitar 6 bulan). Bisa juga dijalankan manual dari tab Actions (**Run workflow**).

| Di mana | Nama | Isi |
|---|---|---|
| Vercel → Environment Variables | `BACKUP_TOKEN` | String acak minimal 32 karakter, misalnya `openssl rand -hex 32`. Kalau kosong atau salah, `/api/backup` menjawab 404. |
| GitHub → Settings → Secrets → Actions | `BACKUP_TOKEN` | Nilai yang sama dengan di Vercel. |
| GitHub → Settings → Variables → Actions | `SITE_URL` (opsional) | URL production. Default `https://link-ppahub-team-support.vercel.app`. |

Memulihkan: buka file backup di branch `backups`, hapus field `exportedAt`, lalu simpan isinya sebagai CONFIG. Caranya bisa lewat `data/site.json` + `npm run db:setup -- --force`, atau tempel per bagian di panel admin.

## Struktur

| File | Isi |
|---|---|
| `src/lib/site.ts` | Skema CONFIG (Zod), aturan tata letak jalur, status lampu per zona waktu, label berbatas tanggal |
| `src/lib/db.ts` | Koneksi Neon + pembuatan tabel |
| `src/lib/default-site.json` | Isi awal halaman (kategori + tautan TEAM SUPPORT) |
| `src/lib/store.ts` | Baca/simpan 1 dokumen `site` (Neon atau file), di-cache dengan tag `site` |
| `src/lib/auth.ts` | Sesi admin (cookie HMAC), batas percobaan login |
| `src/app/actions.ts` | Server action: `login`, `logout`, `save` |
| `src/components/rambu/*` | Halaman publik (juga preview di editor): token desain, rambu SVG, CSS |
| `src/components/dashboard/*` | Dashboard admin: ringkasan, tautan, kategori, profil, pengaturan |
| `scripts/db-setup.ts` | `npm run db:setup`: buat tabel Neon dan isi CONFIG |
