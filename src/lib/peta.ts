import data from "@/data/peta.json";

export type Simpul = (typeof data.simpul)[number];
export type Relasi = (typeof data.relasi)[number];
export const simpul: Simpul[] = data.simpul;
export const relasi: Relasi[] = data.relasi;

export const KELOMPOK: Record<string, { label: string; color: string }> = {
  klasik_modern_awal: { label: "Klasik & Modern Awal", color: "var(--g-klasik)" },
  fenomenologi: { label: "Fenomenologi", color: "var(--g-fen)" },
  jejaring_relasional: { label: "Jejaring Relasional", color: "var(--g-jej)" },
  filsafat_informasi: { label: "Filsafat Informasi", color: "var(--g-info)" },
  teknologi_dan_kekuasaan: { label: "Teknologi & Kekuasaan", color: "var(--g-kuasa)" },
  manajemen_teknologi: { label: "Manajemen Teknologi", color: "var(--g-man)" },
};

export const JENIS: Record<string, { label: string; color: string }> = {
  memengaruhi: { label: "memengaruhi", color: "var(--r-memengaruhi)" },
  mengkritik: { label: "mengkritik", color: "var(--r-mengkritik)" },
  membangun_di_atas: { label: "membangun di atas", color: "var(--r-membangun)" },
  menafsirkan_ulang: { label: "menafsirkan ulang", color: "var(--r-menafsirkan)" },
  merujuk: { label: "merujuk", color: "var(--r-merujuk)" },
  kaitan_tematik: { label: "kaitan tematik", color: "var(--r-tematik)" },
};

export function formatTahun(tahun: number, perkiraan: boolean) {
  const t = tahun < 0 ? `${-tahun} SM` : `${tahun}`;
  return perkiraan ? `sekitar ${t}` : t;
}

export const namaSimpul = (id: string) => simpul.find((s) => s.id === id)?.nama ?? id;
