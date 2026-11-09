import data from "@/data/pertanyaan.json";

export type Pertanyaan = (typeof data.pertanyaan)[number];
export type Posisi = Pertanyaan["posisi"][number];
export type Pembanding = Pertanyaan["pandangan_pembanding"][number];
export type Sikap = Pertanyaan["pilihan_sikap"][number];

export const pertanyaan: Pertanyaan[] = data.pertanyaan;

export const pertanyaanDari = (id: string) => pertanyaan.find((q) => q.id === id);
