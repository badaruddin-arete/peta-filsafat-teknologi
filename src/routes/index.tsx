import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

const COL_W = 260;
const ROW_H = 110;
const kelompokUrut = Object.keys(KELOMPOK);

type PNode = Node<{ nama: string; color: string; dim: boolean; header?: boolean }>;

function PemikirNode({ data }: NodeProps<PNode>) {
  if (data.header)
    return <div className="w-[220px] text-center font-serif text-base font-semibold text-foreground">{data.nama}</div>;
  return (
    <div
      className="w-[200px] rounded-lg border-2 bg-card px-3 py-2 text-center text-sm font-medium text-foreground shadow-sm transition-opacity"
      style={{ borderColor: data.color, opacity: data.dim ? 0.25 : 1 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: data.color }} />
      {data.nama}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
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
      id: `h-${k}`, type: "pemikir", position: { x: c * COL_W, y: 0 }, selectable: false, draggable: false,
      data: { nama: KELOMPOK[k].label, color: "", dim: false, header: true },
    }));
    kelompokUrut.forEach((k, c) => {
      simpul.filter((s) => s.kelompok === k).forEach((s, row) => {
        out.push({
          id: s.id, type: "pemikir", position: { x: c * COL_W + 10, y: 60 + row * ROW_H },
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
          id: `e${i}`, source: r.dari, target: r.ke,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          style: { stroke: color, strokeWidth: 2, strokeDasharray: r.kategori === "tematik" ? "6 5" : undefined, opacity: dim ? 0.12 : 1 },
          interactionWidth: 16,
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

      <main className="relative flex flex-1 min-h-[70vh]">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView colorMode={dark ? "dark" : "light"}
            nodesDraggable={false} nodesConnectable={false}
            onNodeClick={(_, n) => !n.id.startsWith("h-") && setPilih({ tipe: "simpul", id: n.id })}
            onEdgeClick={(_, e) => setPilih({ tipe: "relasi", idx: Number(e.id.slice(1)) })}
            onPaneClick={() => setPilih(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} />
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
