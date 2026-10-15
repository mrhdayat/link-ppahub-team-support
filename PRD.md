# PRD Rambu Navigasi — Halaman Link-in-Bio

Oct 15, 2026 · @Dwi Fitriadi

> **Catatan implementasi (proyek ini).** PRD di bawah ditulis untuk versi satu file HTML. Atas keputusan pemilik (15 Okt 2026) proyek ini tetap **Next.js + admin**: objek CONFIG disimpan di server (Neon atau `data/site.json`) dan diubah lewat `/admin`, bukan dengan mengedit file. Skema CONFIG ada di `src/lib/site.ts`. Pustaka QR memakai paket npm `qrcode`, bukan cdnjs. Selain itu desain, perilaku, token, dan copy mengikuti PRD ini apa adanya.

## Ringkasan produk

Rambu Navigasi adalah halaman link-in-bio satu halaman yang menyajikan semua tautan seorang kreator sebagai rambu lalu lintas, dengan sentuhan antarmuka teknologi dan gaya neubrutalism.

Masalah yang diselesaikan: halaman link biasa terlihat seragam dan menjadi berantakan ketika jumlah tautan bertambah. Rambu Navigasi memberi identitas visual yang khas dan tetap rapi untuk puluhan tautan lewat kategori (jalur), pencarian, dan tata letak yang menyesuaikan jumlah tautan.

Versi acuan: Rambu Navigasi v3. Versi sebelumnya: v2 dan v1.

## Tujuan dan metrik keberhasilan

Tujuan utama: pengunjung menemukan tautan yang dicari dalam waktu kurang dari 10 detik, dan lebih banyak pengunjung menghubungi lewat WhatsApp.

| Tujuan | Metrik | Target |
|---|---|---|
| Tautan mudah ditemukan | Waktu dari buka halaman sampai klik pertama | [ISI TARGET] detik |
| Tautan utama lebih sering diklik | Persentase klik ke Portofolio dan Toko online | [ISI TARGET] % |
| Lebih banyak kontak masuk | Klik tombol CHAT WhatsApp per minggu | [ISI TARGET] klik |
| Halaman cepat dibuka | Waktu tampil konten utama di jaringan 4G | di bawah 2 detik |
| Mudah dirawat | Waktu menambah satu tautan baru | di bawah 1 menit |

Angka dasar (baseline) belum ada. Isi setelah dua minggu pertama memakai alat analitik.

## Pengguna dan skenario

| Pengguna | Skenario | Yang dibutuhkan |
|---|---|---|
| Pengikut baru dari Instagram/TikTok | Ingin melihat karya lain dalam sekali klik | Tautan utama langsung terlihat di atas |
| Calon klien | Ingin memesan karya dan tahu kapan dibalas | Status pesanan, jam balas, tombol chat yang jelas |
| Pembeli | Mencari toko di marketplace tertentu | Pencarian dan jalur Toko |
| Pengunjung acara offline | Memindai dari poster atau kartu nama | Kode QR dan halaman ringan di HP |
| Pemilik halaman | Menambah atau mengubah tautan | Satu tempat pengaturan (CONFIG / admin), tanpa menyentuh desain |

## Konsep desain

Setiap tautan adalah rambu jalan yang menunjuk ke sebuah tujuan; tampilan teknologi menjadi "dasbor kendaraan", dan neubrutalism membuat semuanya tegas dan mudah disentuh.

- **Rambu lalu lintas:** pita kuning-hitam, rambu peringatan wajik untuk profil, papan petunjuk arah berwarna, papan gantry untuk tautan utama, rambu STOP untuk chat, rambu batas kecepatan untuk jam balas, patok KM 0 di kaki halaman.
- **Teknologi:** panel HUD bersudut bracket, lampu lalu lintas sebagai indikator status, jam digital, garis scan saat halaman dibuka, latar bergrid.
- **Neubrutalism:** border hitam 3–4 px, bayangan keras tanpa blur, warna datar, tombol "amblas" ke bayangannya saat ditekan.

Prinsip visual:

1. Warna punya arti. Hijau, biru, merah, dan kuning menandai kategori, bukan hiasan.
2. Satu bentuk, satu fungsi. Wajik untuk identitas, segi delapan hanya untuk chat, lingkaran merah hanya untuk batas waktu.
3. Gerak hanya sekali atau sebagai respons. Animasi pemasangan rambu saat dibuka; selebihnya gerak hanya saat disentuh.
4. Terbaca di jalan. Huruf Overpass (terinspirasi huruf rambu jalan raya), kontras tinggi, target sentuh minimal 44 px.

## Kebutuhan fungsional

P0 wajib untuk rilis, P1 penting, P2 pelengkap.

| Fitur | Perilaku | Prioritas |
|---|---|---|
| Profil HUD | Menampilkan inisial, nama, bio, status pesanan, jam, jumlah tujuan | P0 |
| Tautan dari CONFIG | Semua tautan, kategori, dan profil diatur di satu tempat | P0 |
| Jalur kategori | Tautan dikelompokkan per kategori, tiap kategori punya warna rambu | P0 |
| Tab jalur menempel | Tab kategori menempel di atas saat digulir, dengan jumlah tautan per tab | P0 |
| Papan gantry | Maksimal 2 tautan bertanda utama tampil paling atas | P0 |
| Tombol CHAT | Rambu STOP menuju WhatsApp, dengan rambu batas jam balas | P0 |
| Pencarian | Menyaring judul, catatan, dan nama kategori secara langsung; tombol / untuk fokus, Esc untuk hapus | P1 |
| Tata letak adaptif | Lebih dari 4 tautan dalam satu jalur berubah ke grid 2 kolom yang ringkas | P1 |
| Lipat jalur panjang | Lebih dari 6 tautan dalam satu jalur dilipat, ada tombol "Tampilkan n tujuan lainnya" | P1 |
| Status otomatis | Lampu hijau saat jam buka, kuning di luar jam, merah di hari libur; bisa diganti manual | P1 |
| Label berbatas waktu | Label BARU, POPULER, PROMO hilang sendiri setelah tanggal labelSampai | P1 |
| Tautan berbagi per jalur | URL #jalur-toko langsung membuka jalur Toko | P1 |
| Mode siang/malam | Tombol di pojok kanan atas, pilihan disimpan di perangkat pengunjung | P1 |
| Bagikan dan kode QR | Menu bagikan bawaan HP atau salin tautan; QR untuk poster dan kartu nama | P2 |
| Jejak kunjungan | Tautan yang sudah diklik ditandai "dilewati" di perangkat pengunjung | P2 |
| Putar balik | Tombol rambu U-turn untuk kembali ke atas setelah menggulir jauh | P2 |
| Kilau reflektif dan animasi pemasangan | Efek visual saat disentuh dan saat halaman pertama dibuka | P2 |

## Struktur konten dan banyak tautan

Bentuk halaman tidak berubah saat tautan bertambah; yang berubah hanya cara tiap jalur menata isinya, berdasarkan jumlah tautan di jalur itu.

Urutan halaman dari atas ke bawah:

1. Pita peringatan dan tab jalur (menempel)
2. Panel profil HUD
3. Kolom pencarian
4. Papan gantry (tautan utama)
5. Jalur-jalur kategori, sesuai urutan di CONFIG
6. Rambu STOP chat dan batas jam balas
7. Bagikan dan kode QR
8. Marka jalan dan patok KM 0

| Jumlah tautan dalam satu jalur | Tampilan |
|---|---|
| 1–4 | Papan rambu lebar, lengkap dengan panah, catatan, dan jarak |
| 5–6 | Grid 2 kolom rambu ringkas (di layar di bawah 340 px kembali 1 kolom) |
| 7 atau lebih | Grid ringkas, 6 pertama tampil, sisanya di balik tombol "Tampilkan n tujuan lainnya" |

Aturan lain:

- Saat mencari, semua hasil tampil tanpa dilipat, dan papan gantry disembunyikan.
- Saat memilih satu tab, hanya jalur itu yang tampil, termasuk tautan utama dari jalur tersebut.
- Kategori tanpa tautan otomatis tidak muncul di tab maupun di halaman.
- Disarankan maksimal 8 kategori agar tab tetap mudah digeser; tidak ada batas teknis jumlah tautan (skema: 200).

## Design tokens

Warna rambu tetap sama di mode siang dan malam, yang berganti hanya latar.

```css
:root {
  /* warna rambu */
  --black:  #000000;
  --yellow: #ffd100; /* peringatan, aksi utama */
  --green:  #00704a; /* petunjuk arah */
  --blue:   #0050b5; /* informasi */
  --red:    #d7261e; /* larangan, chat */
  --white:  #f7f7f2; /* panel */

  /* latar (siang) */
  --ground: #e7e3d8;
  --grid:   rgba(0,0,0,.07);
  --beam:   #2b2b2b;
  --glow:   0 0 0 transparent;

  /* bentuk */
  --border:       4px solid var(--black);
  --border-small: 3px solid var(--black);
  --radius-sign:  12px;
  --radius-plate: 8px;
  --shadow-lg: 8px 8px 0 var(--black);
  --shadow-md: 6px 6px 0 var(--black);
  --shadow-sm: 4px 4px 0 var(--black);

  /* jarak (kelipatan 2 dan 4) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 28px;
  --tap-min: 44px;
}

:root[data-theme="dark"] {
  --ground: #1c1c1c;
  --grid:   rgba(255,255,255,.06);
  --beam:   #5a5a5a;
  --glow:   0 0 22px rgba(255,255,230,.18); /* rambu memantulkan cahaya */
}
```

| Peran | Huruf | Ukuran / tebal |
|---|---|---|
| Nama profil | Overpass | 30 px / 900 |
| Judul rambu | Overpass | 23 px / 900 (ringkas 18 px) |
| Papan jalur | Overpass | 18 px / 900 |
| Isi dan bio | Overpass | 15–16 px / 600 |
| Data HUD, catatan, jarak | Overpass Mono | 12–13 px / 500–700 |

## Komponen UI

Setiap komponen punya satu tugas dan satu bentuk rambu yang tetap.

| Komponen | Bentuk | Isi | Keadaan |
|---|---|---|---|
| Pita peringatan | Garis kuning-hitam + teks berjalan + tombol mode | Teks dari teksBerjalan | Berhenti saat disorot; diam jika gerak dikurangi |
| Tab jalur | Pelat kecil berwarna kategori | Nama kategori + jumlah | Aktif: tertekan, tanpa bayangan, ada titik wajik |
| Rambu profil | Wajik kuning bergaris hitam | Inisial 2 huruf | Statis |
| Panel HUD | Kotak putih, sudut bracket biru | Nama, bio, status, jam, jumlah rute | Garis scan sekali saat dibuka |
| Lampu status | Tiga lampu kecil | Merah, kuning, hijau | Satu lampu menyala sesuai status |
| Kolom pencarian | Kotak putih bergaris tebal | Placeholder contoh kata | Tombol hapus muncul saat terisi |
| Papan gantry | Balok gelap, 1–2 papan hijau, dua tiang | Judul, catatan, panah | Turun 3 px saat disentuh |
| Pelat jalur | Pelat berwarna dengan garis dalam | "Jalur Nama" + jumlah | Statis |
| Rambu tautan | Papan berwarna, garis dalam putih | Panah, judul, label, catatan, jarak | Sorot: amblas 4 px + kilau; tekan: amblas penuh |
| Rambu ringkas | Versi kecil di grid 2 kolom | Panah, judul, label, catatan | Sama seperti rambu tautan |
| Label | Plat kecil | BARU, POPULER, PROMO | BARU berkedip 3 kali lalu diam |
| Penanda dilewati | Plat hitam kecil di pojok | "dilewati" | Muncul setelah tautan diklik |
| Rambu STOP | Segi delapan merah, tepi putih dan hitam | CHAT + WhatsApp | Bergeser 3 px saat disentuh |
| Batas jam balas | Lingkaran putih bertepi merah | Angka jam | Statis |
| Tombol aksi | Kotak kuning / putih | Bagikan, Kode QR | Amblas saat disentuh |
| Dialog QR | Kotak putih dengan bayangan keras | Kode QR halaman | Tutup dengan tombol atau Esc |
| Rambu putar balik | Kotak biru, ikon U-turn | — | Muncul setelah gulir 700 px |
| Patok KM | Patok putih bertopi merah | KM 0 | Statis |

## CONFIG

Di proyek ini CONFIG diubah lewat `/admin`. Bentuknya (lihat `src/lib/site.ts`):

```js
{
  profil: { nama, inisial, bio },
  // mode: "otomatis" (pakai jam) atau "manual"; manual: "hijau" | "kuning" | "merah"; hariLibur: 0 = Minggu … 6 = Sabtu
  status: { mode: "otomatis", jamBuka: 9, jamTutup: 21, hariLibur: [0], manual: "hijau" },
  balasMaksJam: 24,
  whatsapp: "https://wa.me/62XXXXXXXXXX",
  teksBerjalan: ["Jalur kreatif aktif", "Konten baru tiap minggu"],
  // warna: "green" | "blue" | "red" | "yellow" | "white"
  kategori: [{ id: "sosial", nama: "Sosial", warna: "green" }, …],
  // utama: true -> papan gantry (maksimal 2); label: "baru" | "populer" | "promo"; labelSampai: "YYYY-MM-DD"
  link: [{ id, judul, url, kategori, catatan, utama, label?, labelSampai? }, …]
}
```

Urutan kategori = urutan jalur di halaman; urutan tautan = urutan rambu.

## Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Aksesibilitas | Kontras teks minimal 4.5:1; target sentuh minimal 44 px; fokus keyboard terlihat (garis biru 4 px); tautan "Lompat ke pencarian"; tab memakai aria-pressed; hasil pencarian diumumkan ke pembaca layar; ikon dekoratif disembunyikan dari pembaca layar |
| Gerak | Semua animasi dimatikan jika perangkat memakai pengaturan kurangi gerakan |
| Responsif | Mobile-first. Lebar konten maksimal 500 px; di bawah 400 px profil bertumpuk; di bawah 340 px grid ringkas jadi 1 kolom; aman untuk layar berponi (safe area) |
| Performa | Tanpa gambar; hanya font Overpass dan pustaka QR (dimuat saat dialog QR dibuka) |
| Privasi | Mode tampilan dan jejak "dilewati" hanya disimpan di perangkat pengunjung; tidak ada pelacak |
| Tautan keluar | Tautan https:// dibuka di tab baru dengan rel="noopener" |
| Browser | Chrome, Safari, Firefox, Edge versi 2 tahun terakhir; Safari iOS 15 ke atas |

## Copywriting siap pakai

Pilihan bio (maksimal 2 kalimat):

- Ilustrator dan pembuat konten. Silakan pilih tujuan di bawah.
- Menggambar setiap hari, berbagi setiap minggu. Pilih jalurmu.
- Desainer visual untuk brand lokal. Semua rute karya ada di sini.
- Membuat stiker, poster, dan kelas menggambar. Mau ke mana hari ini?

Pilihan teks berjalan: Jalur kreatif aktif · Konten baru tiap minggu · Kurangi kecepatan, nikmati karya · Pesanan dibuka, antrean terbatas · Promo akhir bulan sedang berlangsung

| Tempat | Teks |
|---|---|
| Judul rambu STOP | Berhenti sebentar |
| Ajakan chat | Mau kerja sama atau pesan karya? Langsung chat saja. |
| Batas jam balas | Batas waktu balas pesan paling lama |
| Status hijau | dibuka sampai 21.00 |
| Status kuning | dibalas mulai 09.00 / antrean penuh |
| Status merah | libur hari ini / sedang libur |
| Pencarian kosong | Tujuan tidak ditemukan. Coba kata lain, atau lihat semua jalur. |
| Tombol lipat | Tampilkan 3 tujuan lainnya / Ringkas jalur ini |
| Notifikasi salin | Tautan halaman disalin |
| Dialog QR | Pindai untuk mampir. Arahkan kamera HP ke kode ini untuk membuka halaman. |
| Kaki halaman | Titik awal semua rute. |

## Rilis, checklist QA, dan pertanyaan terbuka

Langkah rilis: isi CONFIG lewat `/admin` dengan data asli, deploy (wajib `DATABASE_URL` di hosting serverless), pasang tautan di bio dan cetak QR.

Checklist QA:

- [ ] Semua tautan membuka tujuan yang benar
- [ ] Nomor WhatsApp memakai format https://wa.me/62... tanpa angka 0 di depan
- [ ] Status lampu sesuai jam buka dan hari libur
- [ ] Label PROMO hilang setelah tanggal labelSampai
- [ ] Pencarian menemukan tautan dari judul dan catatan
- [ ] Jalur dengan lebih dari 6 tautan bisa dibuka dan diringkas
- [ ] Tampilan rapi di layar 360 px dan 430 px
- [ ] Mode siang dan malam sama-sama terbaca
- [ ] Seluruh halaman bisa dipakai hanya dengan keyboard
- [ ] Kode QR membuka halaman yang benar setelah dipasang di domain final

Pertanyaan terbuka:

- Alat analitik apa yang dipakai untuk mengukur klik (misalnya Plausible atau Umami)?
- Apakah butuh foto profil asli sebagai ganti inisial di rambu wajik?
- Apakah halaman perlu dua bahasa (Indonesia dan Inggris)?
- Domain apa yang akan dipakai?
