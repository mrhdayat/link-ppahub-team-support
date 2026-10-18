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

1. Buat database Neon. Org Neon akun ini dikelola Vercel, jadi buat lewat Vercel: `vercel integration add neon --name link-teamppa` (pilih region Singapore), atau Vercel → Storage → Create Database → Neon.
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

Di Vercel atau hosting serverless lain, **wajib** isi `DATABASE_URL`, `ADMIN_PASSWORD` (min. 12 karakter), dan sebaiknya `SESSION_SECRET`. Disk serverless tidak permanen, jadi `data/site.json` akan hilang. `vercel.json` menaruh fungsi di `sin1` (Singapura) supaya dekat dengan database. Di VPS atau server biasa, file lokal sudah cukup.

## Cek

```bash
npm run check   # skema, URL aman, tata letak jalur, status & zona waktu, label, ikon, statistik
npm run build
```

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
