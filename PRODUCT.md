# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Admin (satu orang / satu tim kecil):** pemilik halaman. Login ke `/admin`, menyusun link, mengatur tampilan, lalu menyimpan. Bukan desainer; butuh hasil bagus tanpa menyentuh kode.
- **Pengunjung:** membuka halaman publik dari bio sosial media, QR, atau pesan WhatsApp, hampir selalu dari ponsel. Tugasnya satu: menemukan link yang dicari dan mengetuknya.

## Product Purpose
Halaman link-in-bio milik sendiri (alternatif Linktree) untuk tim. Satu halaman publik yang daftar link dan tampilannya diatur penuh oleh admin. Berhasil kalau pengunjung menemukan link yang benar dalam beberapa detik, dan admin bisa mengubah isi atau gaya tanpa bantuan developer.

## Positioning
Di-host sendiri, tanpa akun pengunjung, tanpa iklan, tanpa branding pihak ketiga. Kustomisasi menyentuh cat, nyala layar, pegangan laci, scene, trim, tipografi, dan urutan, bukan hanya pilih preset.

## Capabilities and Constraints
- Satu akun admin, password dari env `ADMIN_PASSWORD`. Tidak ada registrasi publik.
- Pengunjung tidak login; halaman publik read-only.
- Penyimpanan: Neon Postgres bila `DATABASE_URL` tersedia, selain itu file JSON lokal (dev).
- Stack yang sudah ada: Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind v4, Zod, Phosphor icons, Motion.
- Open: nama produk akhir, domain, logo/aset brand tim.

## Brand Commitments
- Arah visual dipilih user: **hybrid tactile** yang skeuomorfik dan detail. Sejak 15 Okt 2026 dunianya **bengkel**: radio head unit truk di atas lemari perkakas mekanik (permintaan user: "mirip toolbox mekanik atau headunit truck", "sedetail dan semirip mungkin"). Kontras harus tetap memenuhi WCAG AA.

## Evidence on Hand
Belum ada konten nyata (nama tim, link, avatar, logo). Isi awal adalah contoh yang diberi label jelas dan harus diganti admin; jangan mengarang klaim, angka, atau testimoni.

## Product Principles
1. Pengunjung datang untuk satu ketukan; jangan halangi dengan dekorasi.
2. Default sudah bagus; kustomisasi menambah, bukan menyelamatkan.
3. Setiap perubahan admin terlihat langsung sebelum disimpan.
4. Native dan tanpa dependensi baru kecuali benar-benar perlu.

## Accessibility & Inclusion
WCAG 2.2 AA: kontras teks ≥ 4.5:1 (masalah klasik neumorphism), fokus keyboard terlihat, target sentuh ≥ 44px, `prefers-reduced-motion` dan `prefers-contrast` dihormati.
