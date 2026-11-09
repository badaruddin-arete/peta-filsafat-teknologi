import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { KELOMPOK, JENIS, formatTahun, type Relasi, type Simpul } from "@/lib/peta";
import { susunWaktu, ZAMAN } from "@/lib/waktu";

type Props = {
  terlihat: { r: Relasi; i: number }[];
  dipilih?: string;
  relasiDipilih?: number;
  onSimpul: (id: string) => void;
  onRelasi: (idx: number) => void;
};

export function WaktuView({ terlihat, dipilih, relasiDipilih, onSimpul, onRelasi }: Props) {
  const titik = useMemo(() => susunWaktu(), []);
  // Kanvas selebar 2400px diperkecil agar seluruh garis waktu muat di layar; dihitung setelah mount
  // supaya HTML dari server dan klien tetap sama.
  const gulir = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(1);
  useEffect(() => {
    const el = gulir.current;
    if (!el) return;
    const hitung = () => setSkala(Math.max(0.5, Math.min(1, el.clientWidth / 2400)));
    hitung();
    const ro = new ResizeObserver(hitung);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const tetangga = new Set(dipilih ? [dipilih] : []);
  terlihat.forEach(({ r }) => {
    if (r.dari === dipilih) tetangga.add(r.ke);
    if (r.ke === dipilih) tetangga.add(r.dari);
  });
  const kartu = (s: Simpul) => (
    <Button variant="outline" aria-pressed={dipilih === s.id} onClick={() => onSimpul(s.id)}
      className={`waktu-card catalogue-node ${dipilih && !tetangga.has(s.id) ? "waktu-dim" : ""}`}
      style={{ borderColor: `var(--w-${s.kelompok})` }}>
      <span className="font-serif text-xl font-semibold leading-tight">{s.nama}</span>
      <em className="text-sm leading-tight">{s.karya_rujukan.judul}</em>
      <span className="text-sm text-muted-foreground">{formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan)}</span>
    </Button>
  );

  return (
    <>
      <div className="waktu-legend flex flex-wrap gap-x-5 gap-y-2 border-b border-border px-6 py-2">
        {Object.entries(KELOMPOK).map(([id, k]) => <span key={id} className="flex items-center gap-2 text-xs">
          <span className="waktu-swatch" style={{ borderColor: `var(--w-${id})` }} />{k.label}
        </span>)}
      </div>
      <div className="waktu-scroll" ref={gulir}>
        <div className="waktu-horizontal" style={{ zoom: skala }}>
          <div className="waktu-era waktu-era-kuno">{ZAMAN[0].label}</div>
          <div className="waktu-era waktu-era-modern">{ZAMAN[1].label}</div>
          <div className="waktu-era waktu-era-kini">{ZAMAN[2].label}</div>
          <svg className="waktu-lines" viewBox="0 0 2400 940" aria-label="Relasi antar karya pada garis waktu">
            <path d="M 60 470 H 450 M 530 470 H 760 M 840 470 H 2340" className="waktu-axis" />
            {terlihat.map(({ r, i }) => {
              const a = titik.find((t) => t.simpul.id === r.dari);
              const b = titik.find((t) => t.simpul.id === r.ke);
              if (!a || !b) return null;
              const dim = dipilih ? r.dari !== dipilih && r.ke !== dipilih : relasiDipilih !== undefined && relasiDipilih !== i;
              const tinggi = Math.min(390, 65 + Math.abs(a.x - b.x) * 0.2 + (i % 3) * 22);
              const path = a.x === b.x
                ? `M ${a.x} 470 C ${a.x - 55} ${470 - tinggi}, ${a.x + 55} ${470 - tinggi}, ${b.x} 470`
                : `M ${a.x} 470 C ${a.x} ${470 - tinggi}, ${b.x} ${470 - tinggi}, ${b.x} 470`;
              return <g key={i} className="waktu-arc" style={{ opacity: dim ? 0.1 : dipilih ? 1 : 0.55 }}>
                <path d={path} fill="none" stroke={JENIS[r.jenis]?.color} strokeWidth={dipilih && !dim ? 2 : 1}
                  strokeDasharray={r.kategori === "tematik" ? "6 5" : undefined} />
                <path d={path} className="waktu-arc-hit" onClick={() => onRelasi(i)} aria-label={`${a.simpul.nama} ke ${b.simpul.nama}: ${JENIS[r.jenis]?.label ?? r.jenis}`} />
              </g>;
            })}
            {titik.map(({ simpul: s, x, atas, jalur }) => {
              const y = atas ? 280 - jalur * 175 : 550 + jalur * 175;
              return <g key={s.id} opacity={dipilih && !tetangga.has(s.id) ? 0.22 : 1}>
                <line x1={x} x2={x} y1="470" y2={atas ? y + 150 : y} className="waktu-stem" />
                <circle cx={x} cy="470" r={dipilih === s.id ? 5 : 3} className="waktu-dot" />
              </g>;
            })}
          </svg>
          <span className="waktu-break" style={{ left: 490 }}>//</span>
          <span className="waktu-break" style={{ left: 800 }}>//</span>
          {titik.map(({ simpul: s, x, atas, jalur }) => (
            <div key={s.id} className="waktu-position" style={{ left: x - 95, top: atas ? 280 - jalur * 175 : 550 + jalur * 175 }}>
              {kartu(s)}
            </div>
          ))}
          {titik.map(({ simpul: s, x }, index) => <span key={s.id} className="waktu-year" style={{ left: x, top: index % 2 ? 498 : 445 }}>
            {formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan)}
          </span>)}
          <p className="waktu-note text-sm italic text-muted-foreground">Skala dipatahkan antar zaman. Tahun adalah tahun karya rujukan, bukan tahun hidup pemikir atau waktu pengaruhnya.</p>
        </div>
        <div className="waktu-mobile">
          {ZAMAN.map((z) => <section key={z.id} className="mb-8">
            <h2 className="mb-4 border-b border-border pb-2 font-serif text-xl font-semibold">{z.label}</h2>
            <ol className="waktu-list">
              {titik.filter((t) => t.zaman === z.id).map(({ simpul: s }) => <li key={s.id}>
                <p className="mb-2 text-sm italic">{formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan)}</p>
                {kartu(s)}
              </li>)}
            </ol>
          </section>)}
          <p className="text-sm italic text-muted-foreground">Skala dipatahkan antar zaman. Tahun adalah tahun karya rujukan, bukan tahun hidup pemikir atau waktu pengaruhnya.</p>
        </div>
      </div>
    </>
  );
}