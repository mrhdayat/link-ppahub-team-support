# 🌐 Support Berjaya — PPA Link Hub Internal

![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

Web Application **Link Hub Internal** resmi untuk **Support Berjaya — PT Putra Perkasa Abadi (PPA)**. Aplikasi ini berfungsi sebagai pusat portal digital terpadu bagi seluruh karyawan, pengawas, dan mitra kerja untuk mengakes sistem operasional pertambangan, portal K3/SHE, presensi HRIS, formulir visitor, serta media sosial korporat.

---

## 🌟 Fitur-Fitur Utama

### 📱 1. Halaman Publik (Tanpa Login & Bebas Friksi)
- **Akses Instan**: Siapa pun (karyawan, pengawas site, tamu) dapat langsung membuka dan mengklik link tanpa perlu berbelit-belit login.
- **Pencarian Cepat (Live Search)**: Filter otomatis berdasarkan judul link, deskripsi, URL, maupun kategori divisi.
- **Visual Multi-Logo Corporate**:
  - **Atas**: Logo Utama PPA (`PT Putra Perkasa Abadi`).
  - **Bawah**: 3 Logo Sektor Operasional (`Support Truck`, `Dewatering`, `High Voltage`).
- **Mode Tampilan 3-Theme Switcher**:
  - ✨ `Glassmorphism`: Tampilan modern dengan efek *ambient radial navy-orange glow* & backdrop blur.
  - 🌙 `Dark Mode`: Mode gelap solid slate-navy ber-kontras tinggi untuk kondisi minim cahaya.
  - ☀️ `Light Mode`: Tampilan bersih & terang yang nyaman dibaca di siang hari.
- **Dukungan Bilingual (ID / EN)**: Pengubah bahasa Bahasa Indonesia dan English secara *real-time*.

### 🔑 2. Admin Panel & Management System (`/admin`)
- **Keamanan Login Admin**: Dilindungi oleh NextAuth v5 dengan enkripsi password bcrypt.
- **Real-Time CRUD Link**: Tambah, edit, duplikasi, dan hapus link portal secara instan.
- **Fitur Auto Schedule (Penjadwalan Link)**: Atur tanggal & waktu mulai tayang (`Auto Show`) dan selesai tayang (`Auto Hide`).
- **Drag & Drop Reordering (DND)**: Geser dan urutkan susunan posisi link secara visual (`@hello-pangea/dnd`).
- **Manajemen Kategori Department**: Pengelompokan divisi (K3/SHE, Operasional Mining, HRIS, Visitor, dsb).
- **Analitik & Grafik Interaktif Klik**: Visualisasi statistik klik per link dan grafik tren klik harian dengan **Recharts**.
- **Dynamic Site Settings (Tanpa Sentuh Kode)**:
  - Ubah Nama Perusahaan, Sub-judul, dan Slogan Resmi.
  - Ubah URL Logo Utama & 3 Logo Operasional.
  - Aktifkan **Running Announcement Banner** (Banner Pengumuman Berjalan).
  - Aktifkan **Mode Pemeliharaan (Maintenance Mode)**.
  - Atur Email & Hotline Kontak IT Support.

---

## 🛠️ Teknologi & Stack

- **Framework**: Next.js 15+ (App Router, Server Components & Client Components)
- **Bahasa**: TypeScript 5+
- **Database & ORM**: Neon Serverless PostgreSQL + Prisma ORM 6
- **Autentikasi**: Auth.js / NextAuth v5 (Credentials Provider & Bcrypt Hashing)
- **Styling**: Tailwind CSS v4, Custom CSS Variables (Glass/Neu/Clay Design Tokens)
- **Animasi & Transisi**: Framer Motion & CSS Compositor Transitions
- **Ikon Set**: Custom PPA Restyled SVG Icons
- **Grafik Analitik**: Recharts

---

## 🚀 Panduan Memulai di Lokal (Local Development)

### 1. Prasyarat System
- Node.js v18.x atau v20+
- npm v9+

### 2. Kloning Repository & Install Dependensi
```bash
git clone https://github.com/USERNAME-ANDA/ppa-linkhub.git
cd ppa-linkhub
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local` dan `.env`:
```bash
cp .env.example .env.local
cp .env.example .env
```
Isi variabel `DATABASE_URL` dengan Connection String Neon PostgreSQL Anda:
```env
DATABASE_URL="postgresql://neondb_owner:npg_xxxxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="support-berjaya-ppa-secret-2026-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push Skema & Seeding Database
Jalankan perintah ini untuk membuat tabel dan mengisi data awal (termasuk 5 link resmi perusahaan):
```bash
# Push skema tabel ke database
npx prisma db push

# Isi data awal kategori, link resmi & admin
npm run db:seed
```

### 5. Jalankan Server Lokal
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔐 Akses Login Admin Default

| Parameter | Credential |
|---|---|
| **URL Login** | `http://localhost:3000/admin/login` |
| **Email Admin** | `admin@ppa.co.id` |
| **Password Default** | `PPA@Safety1st!` *(atau PIN: `123456`)* |

---

## 🌐 Panduan Deployment ke Vercel

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: Support Berjaya PPA Link Hub production build"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/ppa-linkhub.git
   git push -u origin main
   ```
2. **Deploy di Vercel**:
   - Buka **[Vercel.com](https://vercel.com)** ➔ Import repository `ppa-linkhub`.
   - Di bagian **Environment Variables**, isi `DATABASE_URL`, `AUTH_SECRET`, dan `NEXT_PUBLIC_APP_URL`.
   - Klik **Deploy**!

---

## 🔒 Proteksi Keamanan Repository GitHub

File `.gitignore` pada proyek ini telah dikonfigurasi secara aman untuk memastikan **TIDAK ADA** data rahasia yang ter-push ke GitHub publik:
- 🚫 `*.env` & `*.env.*` *(Menyembunyikan kredensial database & secret keys)*
- 🚫 `node_modules/` *(Folder dependensi)*
- 🚫 `.next/` & `out/` *(Output build Next.js)*
- 🚫 `.DS_Store` & file metadata OS/IDE

---

## 📄 Lisensi & Hak Cipta

© 2026 **PT Putra Perkasa Abadi (PPA)** — Support Berjaya. All Rights Reserved.
