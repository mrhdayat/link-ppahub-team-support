import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RambuPage } from "@/components/rambu/rambu-page";
import { DEFAULT_SITE, IKON, siteSchema, WARNA, type Link, type Site } from "@/lib/site";

// Dev-only stress lab: every fixture enters through the same `site` prop the real page uses.
// /lab?data=worst&live=1&dir=rtl — live=1 drops preview mode (sticky header, storage, shortcuts).

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

const link = (i: number, kategori: string, patch: Partial<Link> = {}): Link => ({
  id: `x${i}`,
  judul: `Tujuan ${i + 1}`,
  url: `https://example.com/${i}`,
  kategori,
  kategoriLain: [],
  catatan: "",
  kataKunci: "",
  panduan: "",
  arsip: false,
  utama: false,
  ...patch,
});

const WORST: Site = {
  safetyTalk: [{ teks: "Gunakan APD lengkap sebelum masuk area tambang, cek ulang tali pengaman dan sepatu safety" }],
  shift: ["06:00", "14:00", "22:00"],
  cuaca: { aktif: true, nama: "Site dengan nama sangat panjang", lat: -3.4337, lon: 115.5287, adm4: "63.10.12.2003", sumber: "gabungan" },
  tema: "otomatis",
  tim: [
    { id: "t1", nama: "Aleksandra Wiśniewska-Kowalczyk", peran: "Koordinator lapangan shift malam", jalur: "toko", foto: "", wa: "https://wa.me/6281200000000", telp: "tel:+6281200000000" },
    { id: "t2", nama: "Jo", peran: "", jalur: "", foto: "", wa: "", telp: "" },
  ],
  profil: {
    nama: "Aleksandra Wiśniewska-Kowalczyk · Studio",
    inisial: "AW",
    bio: "Ilustrator dan pembuat konten dari Yogyakarta. Menggambar setiap hari, berbagi setiap minggu; pesanan dibuka sampai akhir bulan ini, ya 🙏",
  },
  status: { mode: "manual", zona: "Asia/Jakarta", jamBuka: 9, jamTutup: 21, hariLibur: [0, 6], manual: "kuning" },
  balasMaksJam: 168,
  tampilKlik: true,
  whatsapp: "",
  teksBerjalan: [],
  kategori: [
    { id: "toko", nama: "Toko", warna: "red", ikon: "alat" },
    { id: "kelas", nama: "Kelas & Lokakarya Daring", warna: "yellow", ikon: "dokumen" },
    { id: "sosial", nama: "Sosial 🌐", warna: "green", ikon: "umum" },
    { id: "arab", nama: "متجر", warna: "blue", ikon: "air" },
    { id: "putih", nama: "Arsip", warna: "white", ikon: "perisai" },
    ...Array.from({ length: 7 }, (_, i) => ({ id: `k${i}`, nama: `Kategori ${i + 6}`, warna: WARNA[i % WARNA.length], ikon: IKON[i % IKON.length] })),
  ],
  link: [
    link(0, "toko", { judul: "tokopedia.com/aleksandrawisniewskastudioofficial", catatan: "diskon 50% khusus pembelian lewat aplikasi s.d. 31 Desember!", utama: true, label: "promo", labelSampai: "2099-12-31" }),
    link(1, "kelas", { judul: "Kelas Menggambar Karakter untuk Pemula (Zoom)", catatan: "tiap Sabtu 19.00 WIB", utama: true, label: "baru" }),
    link(2, "toko", { judul: "Shopee", label: "populer" }),
    link(3, "toko", { judul: "Promo kemarin", catatan: "label ini sudah kedaluwarsa", label: "promo", labelSampai: "2020-01-01" }),
    link(4, "toko", { judul: "tokopedia.com/aleksandrawisniewskastudioofficial", catatan: "diskon 50% khusus pembelian lewat aplikasi s.d. 31 Desember!", label: "baru" }),
    ...Array.from({ length: 7 }, (_, i) => link(5 + i, "toko", { judul: ["Lazada", "Blibli", "TikTok Shop", "Etsy", "Bukalapak", "Jo", "Amazon Handmade"][i], catatan: i % 2 ? "stiker & cetak" : "" })),
    link(12, "kelas", { judul: "🎨 Kelas Gambar 👩‍🎨", catatan: "🖌️✨ semua level" }),
    link(13, "sosial", { judul: "Instagram", catatan: "@aleksandra.wisniewska.kowalczyk.studio", url: "mailto:halo@example.com" }),
    link(14, "arab", { judul: "متجر الملصقات", catatan: "شحن مجاني لكل الطلبات", label: "baru" }),
    link(15, "arab", { judul: "חנות מדבקות", catatan: "משלוח חינם" }),
    link(16, "putih", { judul: "Arsip 2019–2024", catatan: "tel: lewat telepon", url: "tel:+62811000000" }),
    link(17, "putih", { judul: "Telepon", url: "tel:+62811000000" }),
    link(18, "putih", { judul: "Arsip lama" }),
    link(19, "putih", { judul: "Arsip lama 2" }),
    link(20, "putih", { judul: "Arsip lama 3" }),
    ...Array.from({ length: 7 }, (_, i) => link(21 + i, `k${i}`, { judul: `Tautan ${i + 6}` })),
  ],
};

const FIXTURES: Record<string, Site> = {
  demo: DEFAULT_SITE,
  worst: WORST,
  empty: { ...DEFAULT_SITE, link: [] },
  one: { ...DEFAULT_SITE, kategori: [DEFAULT_SITE.kategori[0]], link: [link(0, DEFAULT_SITE.kategori[0].id, { judul: "Purchasing", catatan: "Apps Script" })] },
  many: { ...DEFAULT_SITE, link: Array.from({ length: 200 }, (_, i) => link(i, DEFAULT_SITE.kategori[i % 4].id, { utama: i < 2 })) },
  cats12: { ...WORST, whatsapp: DEFAULT_SITE.whatsapp, teksBerjalan: DEFAULT_SITE.teksBerjalan },
};
// Loud in dev if a fixture drifts from the schema: a fixture the admin could never save proves nothing.
for (const [k, s] of Object.entries(FIXTURES)) {
  const r = siteSchema.safeParse(s);
  if (!r.success) throw new Error(`lab fixture "${k}": ${r.error.message}`);
}

export default function Lab(props: PageProps<"/lab">) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <Fixture searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Fixture({ searchParams }: Pick<PageProps<"/lab">, "searchParams">) {
  const sp = await searchParams;
  const data = typeof sp.data === "string" && sp.data in FIXTURES ? sp.data : "worst";
  const live = sp.live === "1";
  const rtl = sp.dir === "rtl";
  const href = (p: Record<string, string | undefined>) => {
    const q = new URLSearchParams({ data, ...(live && { live: "1" }), ...(rtl && { dir: "rtl" }) });
    for (const [k, v] of Object.entries(p)) v === undefined ? q.delete(k) : q.set(k, v);
    return `/lab?${q}`;
  };
  return (
    <>
      <div dir={rtl ? "rtl" : undefined}>
        <RambuPage key={data} site={FIXTURES[data]} preview={!live} />
      </div>
      <nav aria-label="Lab" style={bar}>
        {Object.keys(FIXTURES).map((k) => (
          <a key={k} href={href({ data: k })} style={{ ...seg, ...(k === data && on) }}>
            {k}
          </a>
        ))}
        <a href={href({ live: live ? undefined : "1" })} style={{ ...seg, ...(live && on) }}>
          live
        </a>
        <a href={href({ dir: rtl ? undefined : "rtl" })} style={{ ...seg, ...(rtl && on) }}>
          rtl
        </a>
      </nav>
    </>
  );
}

const bar = {
  position: "fixed",
  left: "50%",
  bottom: 8,
  translate: "-50% 0",
  zIndex: 100,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 2,
  maxWidth: "calc(100vw - 16px)",
  padding: 2,
  borderRadius: 8,
  background: "#d4d4d4",
  font: "12px/1 system-ui, sans-serif",
} as const;
const seg = { padding: "6px 8px", borderRadius: 6, color: "#222", textDecoration: "none" } as const;
const on = { background: "#fff" } as const;
