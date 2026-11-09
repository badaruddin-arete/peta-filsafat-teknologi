import data from "@/data/pertanyaan.json";

export interface Sumber {
  judul: string;
  url: string;
}

export interface Sikap {
  id: string;
  label: string;
}

export interface Posisi {
  pemikir: string;
  sikap: string;
  kategori: "tekstual" | "tafsiran";
  ringkasan: string;
  kutipan?: string;
  alasan?: string;
  sumber: Sumber[];
  status: string;
}

export interface Pembanding {
  nama: string;
  sikap: string;
  ringkasan: string;
  sumber: Sumber[];
}

export interface Pertanyaan {
  id: string;
  teks: string;
  pengantar: string;
  pilihan_sikap: Sikap[];
  posisi: Posisi[];
  pandangan_pembanding: Pembanding[];
}

export const pertanyaan: Pertanyaan[] = data.pertanyaan as Pertanyaan[];
