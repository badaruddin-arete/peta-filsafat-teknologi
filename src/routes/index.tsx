import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
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
  useStore,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { simpul, relasi, KELOMPOK, JENIS, formatTahun, namaSimpul } from "@/lib/peta";

export const Route = createFileRoute("/")({
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

const COL_W = 380;
const ROW_H = 150;
const NODE_W = 220;
const FIT = { padding: 0.15, minZoom: 0.2 };
// Batas zoom agar teks nama (NAMA_PX) tetap tampil minimal ~14px di layar.
const NAMA_PX = 26;
const ZOOM_BACA = 0.55;
const kolomDari = (id: string) => kelompokUrut.indexOf(simpul.find((s) => s.id === id)?.kelompok ?? "");

// Relasi dalam satu kolom: lengkung keluar ke sisi kanan kolom agar tidak menembus simpul di antaranya.
function LengkungEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, interactionWidth }: EdgeProps) {
  const off = 60 + Math.abs(targetY - sourceY) * 0.35;
  const path = `M ${sourceX} ${sourceY} C ${sourceX + off} ${sourceY}, ${targetX + off} ${targetY}, ${targetX} ${targetY}`;
  return <BaseEdge id={id} path={path} style={style} {...(markerEnd ? { markerEnd } : {})} interactionWidth={interactionWidth ?? 20} />;
}
const edgeTypes = { lengkung: LengkungEdge };

function TombolPusat({ panelBuka }: { panelBuka: boolean }) {
  const { fitView, getZoom, getViewport, setViewport } = useReactFlow();
  const w = useStore((s) => s.width);
  const h = useStore((s) => s.height);

  // Ukuran kanvas berubah saat panel samping dibuka/ditutup; pusatkan ulang setelahnya.
  // Bila hasil fitView membuat teks terlalu kecil untuk dibaca, naikkan zoom sambil
  // menjaga titik yang sedang berada di tengah kanvas tetap di tengah.
  const pusatkan = useCallback(
    (animate = true) => {
      const d = animate ? 300 : 0;
      // beri waktu React Flow membaca ukuran kanvas yang baru
      const t1 = setTimeout(() => fitView({ ...FIT, duration: d }), 60);
      const t2 = setTimeout(() => {
        const z = getZoom();
        if (z >= ZOOM_BACA || !w || !h) return;
        const { x, y } = getViewport();
        const cx = w / 2;
        const cy = h / 2;
        const fx = (cx - x) / z;
        const fy = (cy - y) / z;
        setViewport({ x: cx - fx * ZOOM_BACA, y: cy - fy * ZOOM_BACA, zoom: ZOOM_BACA }, { duration: d });
      }, 60 + d + 80);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    },
    [fitView, getZoom, getViewport, setViewport, w, h],
  );

  useEffect(() => pusatkan(), [panelBuka, pusatkan]);
  return (
    <Panel position="top-right">
      <button onClick={() => pusatkan()}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted">
        Pusatkan ulang
      </button>
    </Panel>
  );
}
const kelompokUrut = Object.keys(KELOMPOK);

type PNode = Node<{ nama: string; color: string; dim: boolean; header?: boolean }>;

function PemikirNode({ data }: NodeProps<PNode>) {
  if (data.header)
    return (
      <div className="text-center font-serif font-semibold text-foreground" style={{ width: NODE_W, fontSize: NAMA_PX + 2, lineHeight: 1.15 }}>
        {data.nama}
      </div>
    );
  return (
    <div
      className="cursor-pointer rounded-lg border-2 bg-card px-4 py-3 text-center font-medium text-foreground shadow-sm transition-opacity"
      style={{ width: NODE_W, borderColor: data.color, opacity: data.dim ? 0.25 : 1, fontSize: NAMA_PX, lineHeight: 1.2 }}
    >
      <Handle id="tl" type="target" position={Position.Left} className="!opacity-0" />
      <Handle id="tr" type="target" position={Position.Right} className="!opacity-0" />
      <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: data.color }} />
      {data.nama}
      <Handle id="sl" type="source" position={Position.Left} className="!opacity-0" />
      <Handle id="sr" type="source" position={Position.Right} className="!opacity-0" />
    </div>
  );
}
const nodeTypes = { pemikir: PemikirNode };

type Pilihan = { tipe: "simpul"; id: string } | { tipe: "relasi"; idx: number } | null;

function Index() {
  const [aktif, setAktif] = useState<Set<string>>(new Set(Object.keys(JENIS)));
  const [tematik, setTematik] = useState(true);
  const [pilih, setPilih] = useState<Pilihan>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
      setDark(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
      data: { nama: KELOMPOK[k]?.label ?? k, color: "", dim: false, header: true },
    }));
    kelompokUrut.forEach((k, c) => {
      simpul.filter((s) => s.kelompok === k).forEach((s, row) => {
        out.push({
          id: s.id, type: "pemikir", position: { x: c * COL_W, y: 70 + row * ROW_H + (c % 2) * (ROW_H / 2) },
          data: { nama: s.nama, color: KELOMPOK[k]?.color ?? "var(--muted-foreground)", dim: !!tetangga && !tetangga.has(s.id) },
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
          style: { stroke: color, strokeWidth: 2, strokeDasharray: r.kategori === "tematik" ? "6 5" : undefined, opacity: dim ? 0.12 : 1 },
          interactionWidth: 20,
        };
      }),
    [terlihat, pilih],
  );

  const toggle = (j: string) =>
    setAktif((p) => { const n = new Set(p); n.has(j) ? n.delete(j) : n.add(j); return n; });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border px-5 py-5">
        <h1 className="font-serif text-2xl font-semibold md:text-3xl">Peta Pemikiran Filsafat Teknologi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungan antar pemikir filsafat teknologi, setiap relasi disertai sumber.</p>
      </header>

      <section className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        {Object.entries(JENIS).map(([j, v]) => {
          const on = aktif.has(j);
          return (
            <button key={j} onClick={() => toggle(j)} aria-pressed={on}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${on ? "border-foreground/30 bg-card" : "border-border text-muted-foreground opacity-50"}`}>
              <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={v.color} strokeWidth="3" strokeDasharray={j === "kaitan_tematik" ? "4 3" : undefined} /></svg>
              {v.label}
            </button>
          );
        })}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={tematik} onChange={(e) => setTematik(e.target.checked)} className="accent-[var(--teal)]" />
          Tampilkan relasi tematik
        </label>
        <p className="w-full text-xs text-muted-foreground">
          Garis penuh = relasi tekstual. Putus-putus = tafsiran penyusun, bukan klaim pewarisan sejarah.
        </p>
      </section>

      <main className="relative flex flex-1 min-h-[70vh] overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={FIT} minZoom={0.2} colorMode={dark ? "dark" : "light"}
            nodesDraggable={false} nodesConnectable={false}
            onNodeClick={(_, n) => !n.id.startsWith("h-") && setPilih({ tipe: "simpul", id: n.id })}
            onEdgeClick={(_, e) => setPilih({ tipe: "relasi", idx: Number(e.id.slice(1)) })}
            onPaneClick={() => setPilih(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} fitViewOptions={FIT} />
            <TombolPusat panelBuka={!!pilih} />
          </ReactFlow>
        </div>
        {pilih && (
          <aside className="fixed inset-x-0 bottom-0 z-20 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-5 shadow-2xl md:static md:max-h-none md:w-96 md:rounded-none md:border-l md:border-t-0 md:shadow-none">
            <button onClick={() => setPilih(null)} className="float-right text-sm text-muted-foreground hover:text-foreground" aria-label="Tutup">✕</button>
            {pilih.tipe === "simpul" ? <PanelSimpul id={pilih.id} onPilih={setPilih} /> : <PanelRelasi idx={pilih.idx} />}
          </aside>
        )}
      </main>

      <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
        Data dikurasi manual dan setiap relasi bersumber. Kerangka dan kode dibuat dengan bantuan AI (Claude dan Lovable). Hak cipta dilindungi.
      </footer>
    </div>
  );
}

function PanelSimpul({ id, onPilih }: { id: string; onPilih: (p: Pilihan) => void }) {
  const s = simpul.find((x) => x.id === id)!;
  const daftar = (arah: "keluar" | "masuk") =>
    relasi.map((r, i) => ({ r, i })).filter(({ r }) => (arah === "keluar" ? r.dari === id : r.ke === id));
  return (
    <div>
      <p className="text-xs uppercase tracking-wide" style={{ color: KELOMPOK[s.kelompok]?.color }}>{KELOMPOK[s.kelompok]?.label}</p>
      <h2 className="mt-1 font-serif text-2xl font-semibold">{s.nama}</h2>
      <p className="mt-3 text-sm"><em>{s.karya_rujukan.judul}</em> ({formatTahun(s.karya_rujukan.tahun, s.karya_rujukan.perkiraan)})</p>
      <p className="mt-3 text-sm leading-relaxed">{s.ringkasan}</p>
      {(["keluar", "masuk"] as const).map((a) => (
        <div key={a} className="mt-5">
          <h3 className="font-serif text-sm font-semibold">Relasi {a}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {daftar(a).length === 0 && <li className="text-muted-foreground">Tidak ada.</li>}
            {daftar(a).map(({ r, i }) => (
              <li key={i}>
                <button onClick={() => onPilih({ tipe: "relasi", idx: i })} className="text-left hover:underline">
                  <span style={{ color: JENIS[r.jenis]?.color }}>{JENIS[r.jenis]?.label ?? r.jenis}</span>{" "}
                  {a === "keluar" ? `→ ${namaSimpul(r.ke)}` : `← ${namaSimpul(r.dari)}`}
                </button>
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
      <p className="text-xs uppercase tracking-wide" style={{ color: JENIS[r.jenis]?.color }}>{JENIS[r.jenis]?.label ?? r.jenis}</p>
      <h2 className="mt-1 font-serif text-xl font-semibold">{namaSimpul(r.dari)} → {namaSimpul(r.ke)}</h2>
      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${ok ? "bg-teal/15 text-teal" : "bg-violet/15 text-violet"}`}>
        {ok ? "terverifikasi" : "perlu verifikasi"}
      </span>
      <p className="mt-3 text-sm leading-relaxed">{r.ringkasan}</p>
      {r.kategori === "tematik" && (
        <div className="mt-4 rounded-lg border border-violet/40 bg-violet/10 p-3 text-sm">
          <p className="font-serif font-semibold text-violet">Tafsiran penyusun</p>
          <p className="mt-1">{r.alasan}</p>
        </div>
      )}
      <h3 className="mt-5 font-serif text-sm font-semibold">Sumber</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {r.sumber.map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-teal underline-offset-2 hover:underline">{s.judul}</a></li>
        ))}
      </ul>
    </div>
  );
}
