"""Validator data peta pertanyaan (Tahap B).

Setiap posisi pemikir harus menunjuk simpul yang ada di peta.json, memakai
sikap yang sah untuk pertanyaannya, dan bersumber. Tafsiran penyusun wajib
menyatakan alasannya supaya tidak menyamar sebagai klaim tekstual.
Sebuah pertanyaan juga harus memuat minimal dua sikap berbeda, karena
satu sikap saja berarti bukan perdebatan, melainkan satu sisi.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from validasi import Peta, Status, Sumber
from validasi import muat as muat_peta

BERKAS_PERTANYAAN = Path(__file__).resolve().parent.parent / "src" / "data" / "pertanyaan.json"
KUTIPAN_MAKSIMAL = 200  # kutipan sengaja pendek: rujukan, bukan salinan


class Sikap(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=1)


class Posisi(BaseModel):
    pemikir: str
    sikap: str
    kategori: Literal["tekstual", "tafsiran"]
    ringkasan: str = Field(min_length=1)
    kutipan: str | None = None
    alasan: str | None = None
    sumber: list[Sumber] = Field(min_length=1)
    status: Status

    @model_validator(mode="after")
    def _konsisten(self) -> Posisi:
        if self.kategori == "tafsiran" and not (self.alasan or "").strip():
            raise ValueError("posisi tafsiran wajib memuat 'alasan'")
        if self.kutipan is not None and len(self.kutipan) > KUTIPAN_MAKSIMAL:
            raise ValueError(f"kutipan melebihi {KUTIPAN_MAKSIMAL} karakter")
        if self.status == "terverifikasi" and any(not s.url for s in self.sumber):
            raise ValueError("posisi terverifikasi wajib memiliki url pada setiap sumber")
        return self


class Pembanding(BaseModel):
    """Pandangan di luar peta, dicantumkan agar satu sisi tidak tampil sendirian."""

    nama: str = Field(min_length=1)
    sikap: str
    ringkasan: str = Field(min_length=1)
    sumber: list[Sumber] = Field(min_length=1)

    @model_validator(mode="after")
    def _bersumber_jelas(self) -> Pembanding:
        if any(not s.url for s in self.sumber):
            raise ValueError("pandangan pembanding wajib memiliki url pada setiap sumber")
        return self


class Pertanyaan(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    teks: str = Field(min_length=1)
    pengantar: str = Field(min_length=1)
    pilihan_sikap: list[Sikap] = Field(min_length=2)
    posisi: list[Posisi] = Field(min_length=2)
    pandangan_pembanding: list[Pembanding] = []

    @model_validator(mode="after")
    def _utuh(self) -> Pertanyaan:
        sah = {s.id for s in self.pilihan_sikap}
        if len(sah) != len(self.pilihan_sikap):
            raise ValueError(f"[{self.id}] id sikap ganda")

        for p in self.posisi:
            if p.sikap not in sah:
                raise ValueError(f"[{self.id}] sikap tak dikenal: {p.sikap}")
        for b in self.pandangan_pembanding:
            if b.sikap not in sah:
                raise ValueError(f"[{self.id}] sikap tak dikenal pada pembanding: {b.sikap}")

        ganda = [k for k, n in Counter(p.pemikir for p in self.posisi).items() if n > 1]
        if ganda:
            raise ValueError(f"[{self.id}] pemikir muncul dua kali: {ganda}")

        dipakai = {p.sikap for p in self.posisi} | {b.sikap for b in self.pandangan_pembanding}
        if len(dipakai) < 2:
            raise ValueError(f"[{self.id}] hanya satu sikap terwakili; bukan perdebatan")
        return self


class PetaPertanyaan(BaseModel):
    versi: str
    catatan: str
    pertanyaan: list[Pertanyaan]

    @model_validator(mode="after")
    def _id_unik(self) -> PetaPertanyaan:
        ganda = [k for k, n in Counter(q.id for q in self.pertanyaan).items() if n > 1]
        if ganda:
            raise ValueError(f"id pertanyaan ganda: {ganda}")
        return self

    def periksa_terhadap(self, peta: Peta) -> None:
        """Pastikan setiap pemikir yang dirujuk ada di peta.json."""
        dikenal = {s.id for s in peta.simpul}
        for q in self.pertanyaan:
            for p in q.posisi:
                if p.pemikir not in dikenal:
                    raise ValueError(f"[{q.id}] pemikir tak ada di peta: {p.pemikir}")


def muat(berkas: Path = BERKAS_PERTANYAAN, peta: Peta | None = None) -> PetaPertanyaan:
    data = PetaPertanyaan.model_validate(json.loads(berkas.read_text(encoding="utf-8")))
    data.periksa_terhadap(peta if peta is not None else muat_peta())
    return data


def ringkas(data: PetaPertanyaan) -> str:
    posisi = [p for q in data.pertanyaan for p in q.posisi]
    kategori = Counter(p.kategori for p in posisi)
    return (
        f"{len(data.pertanyaan)} pertanyaan, {len(posisi)} posisi "
        f"({kategori['tekstual']} tekstual, {kategori['tafsiran']} tafsiran)."
    )


if __name__ == "__main__":
    jalur = Path(sys.argv[1]) if len(sys.argv) > 1 else BERKAS_PERTANYAAN
    print(ringkas(muat(jalur)))
