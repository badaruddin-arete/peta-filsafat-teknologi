import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  BaseEdge,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Moon, Sun, X } from "lucide-react";
import { simpul, relasi, KELOMPOK, JENIS, formatTahun, namaSimpul } from "@/lib/peta";
import { PertanyaanView } from "@/components/PertanyaanView";

const cariSchema = z.object({
  tampilan: fallback(z.string(), "tradisi").default("tradisi"),
  simpul: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(cariSchema),
  head: () => ({
    meta: [
      { title: "Peta Pemikiran Filsafat Teknologi" },
      { name: "description", content: "Hubungan antar pemikir filsafat teknologi, setiap relasi disertai sumber." },
      { property: "og:title", content: "Peta Pemikiran Filsafat Teknologi" },
      { property: "og:description", content: "Hubungan antar pemikir filsafat teknologi, setiap relasi disertai sumber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const COL_W = 340;
const ROW_H = 235;
const NODE_W = 220;
const FIT = { padding: 0.08, minZoom: 0.05 };
const NAMA_PX = 34;
const ROMAWI = ["I", "II", "III", "IV", "V", "VI"];
const kolomDari = (id: string) => kelompokUrut.indexOf(simpul.find((s) => s.id === id)?.kelompok ?? "");

// Relasi dalam satu kolom: lengkung keluar ke sisi kanan kolom agar tidak menembus simpul di antaranya.
function LengkungEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, interactionWidth }: EdgeProps) {
  const off = 60 + Math.abs(targetY - sourceY) * 0.35;
  const path = `M ${sourceX} ${sourceY} C ${sourceX + off} ${sourceY}, ${targetX + off} ${targetY}, ${targetX} ${targetY}`;
  return <BaseEdge id={id} path={path} style={style} {...(markerEnd ? { markerEnd } : {})} interactionWidth={interactionWidth ?? 20} />;
}
const edgeTypes = { lengkung: LengkungEdge };

function TombolPusat() {
  const { fitView } = useReactFlow();
  return (
    <Panel position="top-right">
      <Button variant="outline" size="sm" onClick={() => fitView({ ...FIT, duration: 300 })}>
        Pusatkan ulang
      </Button>
    </Panel>
  );
}
const kelompokUrut = Object.keys(KELOMPOK);

type PNode = Node<{ nama: string; color: string; dim: boolean; header?: boolean; karya?: string; tahun?: string; dividerHeight?: number }>;

function PemikirNode({ data }: NodeProps<PNode>) {
  if (data.header)
    return (
      <div className="tradition-heading font-serif font-semibold text-foreground" style={{ width: NODE_W, fontSize: 28, lineHeight: 1.15 }}>
        {data.nama}
        {data.dividerHeight && <span className="tradition-divider" style={{ height: data.dividerHeight }} />}
      </div>
    );
  return (
    <div
      className="catalogue-node cursor-pointer rounded-sm border border-foreground/50 bg-card px-3 py-4 text-center text-foreground transition-opacity"
      style={{ width: NODE_W, opacity: data.dim ? 0.25 : 1, lineHeight: 1.15 }}
    >
      <Handle id="tl" type="target" position={Position.Left} className="!opacity-0" />
      <Handle id="tr" type="target" position={Position.Right} className="!opacity-0" />
      <div className="font-serif font-bold" style={{ fontSize: NAMA_PX }}>{data.nama}</div>
      <div className="mt-2 text-[22px] italic leading-tight">{data.karya}</div>
      <div className="mt-1 text-[20px] text-muted-foreground">{data.tahun}</div>
      <Handle id="sl" type="source" position={Position.Left} className="!opacity-0" />
      <Handle id="sr" type="source" position={Position.Right} className="!opacity-0" />
    </div>
  );
}
const nodeTypes = { pemikir: PemikirNode };

type Pilihan = { tipe: "simpul"; id: string } | { tipe: "relasi"; idx: number } | null;

export function Index() {
  const { tampilan, simpul: simpulParam } = Route.useSearch();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="title-page relative px-6 pb-2 pt-4 text-center md:px-16">
        <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setDark((v) => !v)} aria-label={dark ? "Mode terang" : "Mode gelap"} title={dark ? "Mode terang" : "Mode gelap"}>
          {dark ? <Sun /> : <Moon />}
        </Button>
        <h1 className="book-title mx-auto max-w-3xl font-serif text-2xl font-semibold md:text-3xl">Peta Pemikiran Filsafat Teknologi</h1>
        <blockquote className="mt-2 text-base italic">“The essence of technology is by no means anything technological.”</blockquote>
        <p className="mt-0.5 text-xs text-muted-foreground">Martin Heidegger, <em>The Question Concerning Technology</em> (1954)</p>
      </header>

      <nav className="flex justify-center gap-8 px-6 pt-1" aria-label="Tampilan">
        {([["tradisi", "I. Per Tradisi"], ["pertanyaan", "II. Per Pertanyaan"]] as const).map(([id, label]) => (
          <Link key={id} to="/" search={{ tampilan: id, simpul: "" }} aria-current={tampilan === id ? "page" : undefined}
            className={`small-label border-b-2 pb-1.5 text-xs ${tampilan === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tampilan === "pertanyaan" ? <PertanyaanView /> : <TampilanTradisi simpulAwal={simpulParam} dark={dark} />}

      <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
        Data dikurasi manual dan setiap relasi bersumber. Kerangka dan kode dibuat dengan bantuan AI (Claude dan Lovable). Hak cipta dilindungi.
      </footer>
    </div>
  );
}

function TampilanTradisi({ simpulAwal, dark }: { simpulAwal: string; dark: boolean }) {
  const navigate = useNavigate({ from: "/" });
  const [aktif, setAktif] = useState<Set<string>>(new Set(Object.keys(JENIS)));
  const [tematik, setTematik] = useState(true);
  const [pilih, setPilih] = useState<Pilihan>(null);

  // Tautan dari tampilan Per Pertanyaan: buka panel simpul sekali, lalu bersihkan param.
  useEffect(() => {
    if (simpulAwal && simpul.some((s) => s.id === simpulAwal)) {
      setPilih({ tipe: "simpul", id: simpulAwal });
      navigate({ search: (prev) => ({ ...prev, simpul: "" }), replace: true });
    }
  }, [simpulAwal, navigate]);

  const terlihat = useMemo(
    () => relasi.map((r, i) => ({ r, i })).filter(({ r }) => aktif.has(r.jenis) && (tematik || r.kategori !== "tematik")),
    [aktif, tematik],
  );

  const tetangga = useMemo(() => {
    if (pilih?.tipe !== "simpul") return null;
    const s = new Set([pilih.id]);
    terlihat.forEach(({ r }) => {
      if (r.dari === pilih.id) s.add(r.ke);
      if (r.ke === pilih.id) s.add(r.dari);
    });
    return s;
  }, [pilih, terlihat]);

  const nodes: PNode[] = useMemo(() => {
    const out: PNode[] = kelompokUrut.map((k, c) => ({
      id: `h-${k}`, type: "pemikir", position: { x: c * COL_W, y: 0 }, style: { cursor: "default" }, selectable: false, draggable: false,
      data: { nama: `${ROMAWI[c]}. ${KELOMPOK[k]?.label ?? k}`, color: "", dim: false, header: true, ...(c < kelompokUrut.length - 1 ? { dividerHeight: 580 } : {}) },
    }));
    kelompokUrut.forEach((k, c) => {
      simpul.filter((s) => s.kelompok === k).forEach((s, row) => {
        out.push({
          id: s.id, type: "pemikir", position: { x: c * COL_W, y: 110 + row * ROW_H + (c % 2) * (ROW_H / 2) },
          data: { nama: s.nama, color: KELOMPOK[k]?.color ?? "var(--muted-foreground)", dim: !!tetangga && !tetangga.has(s.id), karya: s.karya_rujukan.judul, tahun: formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan) },
        });
      });
    });
    return out;
  }, [tetangga]);

  const edges: Edge[] = useMemo(
    () =>
      terlihat.map(({ r, i }) => {
        const color = JENIS[r.jenis]?.color ?? "var(--muted-foreground)";
        const dim = pilih?.tipe === "simpul" ? r.dari !== pilih.id && r.ke !== pilih.id : pilih?.tipe === "relasi" && pilih.idx !== i;
        return {
          ...(() => {
            const a = kolomDari(r.dari), b = kolomDari(r.ke);
            if (a === b) return { type: "lengkung", sourceHandle: "sr", targetHandle: "tr" };
            return a < b ? { type: "default", sourceHandle: "sr", targetHandle: "tl" } : { type: "default", sourceHandle: "sl", targetHandle: "tr" };
          })(),
          id: `e${i}`, source: r.dari, target: r.ke,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          style: { stroke: color, strokeWidth: 1.25, strokeDasharray: r.kategori === "tematik" ? "6 5" : undefined, opacity: dim ? 0.12 : r.kategori === "tematik" ? 0.45 : 0.85 },
          interactionWidth: 20,
        };
      }),
    [terlihat, pilih],
  );

  const toggle = (j: string) =>
    setAktif((p) => { const n = new Set(p); n.has(j) ? n.delete(j) : n.add(j); return n; });

  return (
    <>
      <section className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-border px-6 py-1.5">
        <h2 className="small-label mr-1 text-[11px]">Cara membaca</h2>
        {Object.entries(JENIS).map(([j, v]) => {
          const on = aktif.has(j);
          return (
            <Button variant="ghost" size="sm" key={j} onClick={() => toggle(j)} aria-pressed={on}
              className={`h-auto rounded-none px-0 py-0.5 text-xs ${on ? "text-foreground" : "text-muted-foreground opacity-40"}`}>
              <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={v.color} strokeWidth="3" strokeDasharray={j === "kaitan_tematik" ? "4 3" : undefined} /></svg>
              {v.label}
            </Button>
          );
        })}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={tematik} onChange={(e) => setTematik(e.target.checked)} className="accent-primary" />
          Tampilkan relasi tematik
        </label>
        <span className="text-[11px] text-muted-foreground">
          Garis penuh = relasi tekstual; putus-putus = tafsiran penyusun.
        </span>
      </section>

      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={FIT} minZoom={0.05} colorMode={dark ? "dark" : "light"}
            nodesDraggable={false} nodesConnectable={false}
            onNodeClick={(_, n) => !n.id.startsWith("h-") && setPilih({ tipe: "simpul", id: n.id })}
            onEdgeClick={(_, e) => setPilih({ tipe: "relasi", idx: Number(e.id.slice(1)) })}
            onPaneClick={() => setPilih(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Controls showInteractive={false} showFitView={false} />
            <TombolPusat />
          </ReactFlow>
        </div>
        {pilih && (
          <aside className="notes-panel absolute bottom-0 right-0 top-0 z-20 w-[min(360px,90%)] overflow-y-auto border-l border-foreground/30 bg-card p-6">
            <Button variant="ghost" size="icon" onClick={() => setPilih(null)} className="float-right -mr-3 -mt-3 text-muted-foreground" aria-label="Tutup"><X /></Button>
            {pilih.tipe === "simpul" ? <PanelSimpul id={pilih.id} onPilih={setPilih} /> : <PanelRelasi idx={pilih.idx} />}
          </aside>
        )}
      </main>
    </>
  );
}

function PanelSimpul({ id, onPilih }: { id: string; onPilih: (p: Pilihan) => void }) {
  const s = simpul.find((x) => x.id === id);
  if (!s) return null;
  const daftar = (arah: "keluar" | "masuk") =>
    relasi.map((r, i) => ({ r, i })).filter(({ r }) => (arah === "keluar" ? r.dari === id : r.ke === id));
  return (
    <div>
      <p className="small-label text-xs text-muted-foreground">{KELOMPOK[s.kelompok]?.label}</p>
      <h2 className="mt-2 border-b border-foreground/40 pb-3 font-serif text-3xl font-semibold">{s.nama}</h2>
      <p className="mt-3 text-sm"><em>{s.karya_rujukan.judul}</em> ({formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan)})</p>
      <p className="mt-3 text-sm leading-relaxed">{s.ringkasan}</p>
      {(["keluar", "masuk"] as const).map((a) => (
        <div key={a} className="mt-5">
          <h3 className="font-serif text-sm font-semibold">Relasi {a}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {daftar(a).length === 0 && <li className="text-muted-foreground">Tidak ada.</li>}
            {daftar(a).map(({ r, i }) => (
              <li key={i}>
                <Button variant="link" onClick={() => onPilih({ tipe: "relasi", idx: i })} className="h-auto justify-start whitespace-normal p-0 text-left text-sm text-foreground">
                  <span style={{ color: JENIS[r.jenis]?.color }}>{JENIS[r.jenis]?.label ?? r.jenis}</span>{" "}
                  {a === "keluar" ? `→ ${namaSimpul(r.ke)}` : `← ${namaSimpul(r.dari)}`}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PanelRelasi({ idx }: { idx: number }) {
  const r = relasi[idx];
  if (!r) return null;
  const ok = r.status === "terverifikasi";
  return (
    <div>
      <p className="small-label text-xs text-muted-foreground">{JENIS[r.jenis]?.label ?? r.jenis}</p>
      <h2 className="mt-2 border-b border-foreground/40 pb-3 font-serif text-2xl font-semibold">{namaSimpul(r.dari)} → {namaSimpul(r.ke)}</h2>
      <span className="small-label mt-3 inline-block rounded-sm border border-foreground/60 px-2 py-1 text-[10px] text-foreground">
        {ok ? "terverifikasi" : "perlu verifikasi"}
      </span>
      <p className="mt-3 text-sm leading-relaxed">{r.ringkasan}</p>
      {r.kategori === "tematik" && (
        <div className="mt-4 border-l border-dashed border-foreground/60 pl-4 text-sm">
          <p className="font-serif font-semibold text-foreground">Tafsiran penyusun</p>
          <p className="mt-1">{r.alasan}</p>
        </div>
      )}
      <h3 className="mt-5 font-serif text-sm font-semibold">Sumber</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
        {r.sumber.map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="link-sumber">{s.judul}</a></li>
        ))}
      </ol>
    </div>
  );
}
