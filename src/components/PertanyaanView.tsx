import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { pertanyaan, type Pembanding, type Posisi, type Sumber } from "@/lib/pertanyaan";
import { simpul, formatTahun } from "@/lib/peta";

function karyaPemikir(id: string) {
  const s = simpul.find((x) => x.id === id);
  if (!s) return null;
  return {
    nama: s.nama,
    karya: s.karya_rujukan.judul,
    tahun: formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan),
  };
}

function DaftarSumber({ sumber }: { sumber: Sumber[] }) {
  return (
    <>
      <h4 className="mt-4 font-serif text-sm font-semibold">Sumber</h4>
      <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 text-sm">
        {sumber.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-sumber">
              {s.judul}
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}

function KartuPosisi({ p }: { p: Posisi }) {
  const info = karyaPemikir(p.pemikir);
  const tafsiran = p.kategori === "tafsiran";
  return (
    <article className="catalogue-node relative rounded-sm border border-foreground/50 bg-card p-4">
      <span className="small-label absolute right-3 top-3 rounded-sm border border-foreground/60 px-1.5 py-0.5 text-[9px]">
        {tafsiran ? "Tafsiran penyusun" : "Tekstual"}
      </span>
      <Link
        to="/"
        search={{ tampilan: "tradisi", simpul: p.pemikir }}
        className="link-sumber pr-24 font-serif text-lg font-bold leading-tight"
      >
        {info?.nama ?? p.pemikir}
      </Link>
      {info && (
        <p className="mt-1 text-xs italic text-muted-foreground">
          {info.karya} ({info.tahun})
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed">{p.ringkasan}</p>
      {tafsiran && p.alasan && (
        <div className="mt-3 border-l border-dashed border-foreground/60 pl-3 text-sm">
          <p className="font-serif font-semibold">Mengapa ini tafsiran</p>
          <p className="mt-1 leading-relaxed">{p.alasan}</p>
        </div>
      )}
      {p.kutipan && (
        <blockquote className="mt-3 border-l border-foreground/40 pl-3 text-sm italic leading-relaxed">
          {p.kutipan}
        </blockquote>
      )}
      <DaftarSumber sumber={p.sumber} />
    </article>
  );
}

function KartuPembanding({ b }: { b: Pembanding }) {
  return (
    <article className="relative rounded-sm border border-dashed border-foreground/50 bg-card/60 p-4">
      <span className="small-label absolute right-3 top-3 rounded-sm border border-foreground/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
        Di luar peta
      </span>
      <p className="pr-20 font-serif text-lg font-bold leading-tight">{b.nama}</p>
      <p className="mt-3 text-sm leading-relaxed">{b.ringkasan}</p>
      <DaftarSumber sumber={b.sumber} />
    </article>
  );
}

export function PertanyaanView() {
  const [aktifId, setAktifId] = useState(pertanyaan[0]?.id ?? "");
  const q = pertanyaan.find((x) => x.id === aktifId) ?? pertanyaan[0];
  if (!q) return null;

  const kolom = q.pilihan_sikap
    .map((s) => ({
      sikap: s,
      posisi: q.posisi.filter((p) => p.sikap === s.id),
      pembanding: q.pandangan_pembanding.filter((b) => b.sikap === s.id),
    }))
    .filter((k) => k.posisi.length + k.pembanding.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <nav className="shrink-0 overflow-y-auto border-b border-border px-6 py-3 md:w-[300px] md:border-b-0 md:border-r md:py-6" aria-label="Daftar pertanyaan">
        <h2 className="small-label text-[11px] text-muted-foreground">Daftar pertanyaan</h2>
        <ol className="mt-3 space-y-1">
          {pertanyaan.map((p, i) => {
            const on = p.id === q.id;
            return (
              <li key={p.id}>
                <button
                  onClick={() => setAktifId(p.id)}
                  aria-current={on}
                  className={`block w-full border-l-2 py-1.5 pl-3 text-left text-sm leading-snug transition-colors ${
                    on
                      ? "border-foreground font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mr-1.5 font-serif">{i + 1}.</span>
                  {p.teks}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6 md:px-10">
        <h2 className="max-w-3xl font-serif text-3xl font-semibold leading-tight">{q.teks}</h2>
        <p className="mt-2 max-w-3xl text-sm italic leading-relaxed text-muted-foreground">{q.pengantar}</p>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6 pb-6">
          {kolom.map((k) => (
            <section key={k.sikap.id}>
              <h3 className="small-label border-b border-foreground/40 pb-2 text-xs">{k.sikap.label}</h3>
              <div className="mt-4 space-y-4">
                {k.posisi.map((p) => (
                  <KartuPosisi key={p.pemikir} p={p} />
                ))}
                {k.pembanding.map((b) => (
                  <KartuPembanding key={b.nama} b={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
