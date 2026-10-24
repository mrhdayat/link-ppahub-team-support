import { Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Anggota, Site } from "@/lib/site";
import { KategoriIkon, UTurn } from "@/components/rambu/signs";
import { Foto, Inisial } from "./foto";
import { kelompokTim } from "./tim";
import "@/components/rambu/tokens.css";
import "@/components/rambu/rambu.css";
import "./tim.css";

/** Team page: who handles which lane, and a call or chat away. Same road, same signs as the home page. */
export function TimPage({ site }: { site: Site }) {
  const groups = kelompokTim(site);

  return (
    <div className="rambu tim">
      <header className="tim-top">
        <div className="tim-hazard" aria-hidden />
        <div className="tim-top-row">
          <Balik />
        </div>
      </header>

      <main className="road">
        <div className="tim-head">
          <h1 className="plate tim-title" data-warna="green">
            <span>
              Tim<span className="tim-dot">·</span><bdi>{site.profil.nama}</bdi>
            </span>
          </h1>
          {groups.length > 0 && <p className="tim-lead">Hubungi petugas sesuai jalurnya. Telepon atau WhatsApp langsung dari sini.</p>}
        </div>

        {groups.length === 0 ? (
          <section className="tim-empty" aria-labelledby="tim-empty-h">
            <Inisial nama="?" size={96} />
            <h2 id="tim-empty-h">Daftar tim belum diisi</h2>
            <p>Untuk sementara, hubungi lewat halaman utama.</p>
          </section>
        ) : (
          groups.map((g) => (
            <section key={g.id || "semua"} className="lane" aria-labelledby={`tim-${g.id || "semua"}`}>
              <h2 id={`tim-${g.id || "semua"}`} className="plate" data-warna={g.k?.warna ?? "yellow"}>
                <KategoriIkon ikon={g.k?.ikon ?? "umum"} />
                <span>{g.k ? <>Jalur <bdi>{g.k.nama}</bdi></> : "Seluruh tim"}</span>{" "}
                <span className="plate-n">{g.anggota.length}</span>
              </h2>
              <ul className="petugas-list">
                {g.anggota.map((a) => (
                  <Petugas key={a.id} a={a} warna={g.k?.warna ?? "yellow"} />
                ))}
              </ul>
            </section>
          ))
        )}

        <footer className="tim-foot">
          <Balik />
        </footer>
      </main>
    </div>
  );
}

function Balik() {
  return (
    <a className="act tim-back" href="/">
      <UTurn />
      Putar balik ke halaman utama
    </a>
  );
}

/** "Papan petugas": a duty board with the person's photo or initials, role, and two big contact buttons. */
function Petugas({ a, warna }: { a: Anggota; warna: string }) {
  return (
    <li className="petugas" data-warna={warna}>
      <Foto src={a.foto} nama={a.nama} />
      <div className="petugas-id">
        <p className="petugas-nama" dir="auto">{a.nama}</p>
        {a.peran && <p className="petugas-peran" dir="auto">{a.peran}</p>}
      </div>
      {(a.telp || a.wa) && (
        <div className="petugas-kontak">
          {a.telp && (
            <a className="act" href={a.telp}>
              <Phone weight="bold" aria-hidden />
              Telepon<span className="sr-only"> {a.nama}</span>
            </a>
          )}
          {a.wa && (
            <a className="act" data-warna="green" href={a.wa} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo weight="bold" aria-hidden />
              WhatsApp<span className="sr-only"> {a.nama}</span>
            </a>
          )}
        </div>
      )}
    </li>
  );
}
