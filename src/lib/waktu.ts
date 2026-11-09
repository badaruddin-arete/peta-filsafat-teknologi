import { simpul, type Simpul } from "@/lib/peta";

export const ZAMAN = [
  { id: "kuno", label: "Zaman Kuno (abad ke-4 SM)" },
  { id: "modern", label: "Modern Awal (abad ke-17)" },
  { id: "kontemporer", label: "Abad ke-20 sampai 21" },
] as const;

export function zamanKarya(tahun: number) {
  return tahun < 0 ? "kuno" : tahun < 1900 ? "modern" : "kontemporer";
}

export function posisiTahun(tahun: number) {
  if (tahun < 0) return 140 + ((tahun + 370) / 20) * 220;
  if (tahun < 1900) return 640;
  return 960 + ((tahun - 1954) / (2014 - 1954)) * 900;
}

export function susunWaktu(daftar: readonly Simpul[] = simpul) {
  const urut = [...daftar].sort((a, b) => a.karya_rujukan.tahun - b.karya_rujukan.tahun);
  const batas: number[][] = [[], []];
  return urut.map((s, index) => {
    const x = posisiTahun(s.karya_rujukan.tahun);
    const sisi = index % 2;
    let jalur = 0;
    while ((batas[sisi]?.[jalur] ?? -Infinity) > x - 100) jalur++;
    const jalurSisi = batas[sisi];
    if (jalurSisi) jalurSisi[jalur] = x + 100;
    return { simpul: s, x, atas: sisi === 0, jalur, zaman: zamanKarya(s.karya_rujukan.tahun) };
  });
}