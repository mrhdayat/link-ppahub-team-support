# Halaman Link Tactile

Halaman link-in-bio milik sendiri. Satu halaman publik di `/`, satu admin di `/admin`. Gaya visual: panel perangkat audio hi-fi (neumorphism + skeuomorphism). Detail produk ada di [PRD.md](PRD.md).

## Jalankan lokal

```bash
cp .env.example .env.local   # isi ADMIN_PASSWORD (min. 12 karakter acak)
npm install
npm run dev
```

- Halaman publik: http://localhost:3000
- Admin: http://localhost:3000/admin
- Contoh data ekstrem (dev saja): http://localhost:3000/lab

Tanpa `DATABASE_URL`, data disimpan di `data/site.json`.

## Environment

| Variabel | Wajib | Isi |
|---|---|---|
| `ADMIN_PASSWORD` | Ya | Password admin. Di production minimal 12 karakter. |
| `SESSION_SECRET` | Tidak | Kunci tanda tangan cookie. Kalau kosong, diturunkan dari password dengan scrypt. |
| `DATABASE_URL` | Saat deploy serverless | Connection string Neon Postgres. Tabel `site_doc` dibuat otomatis. |

## Deploy

Di Vercel atau hosting serverless lain, **wajib** isi `DATABASE_URL`. Disk serverless tidak permanen, jadi `data/site.json` akan hilang. Di VPS atau server biasa, file lokal sudah cukup.

## Cek

```bash
npx tsx src/lib/site.check.ts   # kontras warna & validasi URL
npm run build
```

## Struktur

| File | Isi |
|---|---|
| `src/lib/site.ts` | Skema data (Zod), preset bahan, `themeVars()` yang menurunkan semua warna dari 2 pilihan |
| `src/lib/color.ts` | Hitung kontras, pilih warna tinta yang lolos WCAG AA |
| `src/lib/store.ts` | Baca/simpan 1 dokumen `site` (Neon atau file), di-cache dengan tag `site` |
| `src/lib/auth.ts` | Sesi admin (cookie HMAC), batas percobaan login |
| `src/app/actions.ts` | Server action: `login`, `logout`, `save` |
| `src/components/faceplate.*` | Tampilan halaman publik, juga dipakai untuk preview di editor |
| `src/components/editor/*` | Editor admin |
