"""Validator data peta pemikiran.

Aturannya sengaja ketat: setiap klaim hubungan antar pemikir wajib bersumber.
Salah atribusi adalah kesalahan yang paling merusak kredibilitas peta seperti
ini, jadi ia ditolak di pintu masuk, bukan ditemukan pembaca.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

BERKAS_BAWAAN = Path(__file__).resolve().parent.parent / "src" / "data" / "peta.json"
TAHUN_MAKSIMAL = 2026

Status = Literal["terverifikasi", "perlu_verifikasi"]
JenisRelasi = Literal[
    "memengaruhi",
    "mengkritik",
    "membangun_di_atas",
    "menafsirkan_ulang",
    "merujuk",
    "kaitan_tematik",
]


class KaryaRujukan(BaseModel):
    judul: str = Field(min_length=1)
    tahun: int
    perkiraan: bool

    @model_validator(mode="after")
    def _tahun_masuk_akal(self) -> KaryaRujukan:
        if self.tahun > TAHUN_MAKSIMAL:
            raise ValueError(f"tahun {self.tahun} melewati {TAHUN_MAKSIMAL}")
        # Tahun sebelum 1000 hanya bisa perkiraan; angka pasti di sana adalah klaim palsu.
        if self.tahun < 1000 and not self.perkiraan:
            raise ValueError(f"tahun {self.tahun} harus ditandai perkiraan")
        return self


class Simpul(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    nama: str = Field(min_length=1)
    kelompok: str = Field(min_length=1)
    karya_rujukan: KaryaRujukan
    ringkasan: str = Field(min_length=1)
    status: Status


class Sumber(BaseModel):
    judul: str = Field(min_length=1)
    url: str | None = None


class Relasi(BaseModel):
    dari: str
    ke: str
    jenis: JenisRelasi
    kategori: Literal["tekstual", "tematik"]
    ringkasan: str = Field(min_length=1)
    alasan: str | None = None
    sumber: list[Sumber] = Field(min_length=1)
    status: Status

    @model_validator(mode="after")
    def _konsisten(self) -> Relasi:
        if self.dari == self.ke:
            raise ValueError("relasi ke diri sendiri tidak berarti")
        # Kategori tematik dan jenis kaitan_tematik harus berpasangan, supaya tafsiran
        # penyusun tidak menyamar sebagai klaim tekstual.
        if (self.jenis == "kaitan_tematik") != (self.kategori == "tematik"):
            raise ValueError("jenis 'kaitan_tematik' harus berkategori 'tematik' dan sebaliknya")
        if self.kategori == "tematik" and not (self.alasan or "").strip():
            raise ValueError("relasi tematik wajib memuat 'alasan' yang menyatakan ia tafsiran")
        # 'terverifikasi' berarti halaman sumber dibuka; tanpa url klaim itu tidak bisa diperiksa orang lain.
        if self.status == "terverifikasi" and any(not s.url for s in self.sumber):
            raise ValueError("relasi terverifikasi wajib memiliki url pada setiap sumber")
        return self


class Peta(BaseModel):
    versi: str
    catatan: str
    simpul: list[Simpul]
    relasi: list[Relasi]

    @model_validator(mode="after")
    def _utuh(self) -> Peta:
        ids = [s.id for s in self.simpul]
        ganda = [i for i, n in Counter(ids).items() if n > 1]
        if ganda:
            raise ValueError(f"id simpul ganda: {ganda}")
        dikenal = set(ids)

        for r in self.relasi:
            for ujung in (r.dari, r.ke):
                if ujung not in dikenal:
                    raise ValueError(f"relasi menunjuk simpul tak dikenal: {ujung}")

        kunci = Counter((r.dari, r.ke, r.jenis) for r in self.relasi)
        kembar = [k for k, n in kunci.items() if n > 1]
        if kembar:
            raise ValueError(f"relasi kembar: {kembar}")

        terhubung = {r.dari for r in self.relasi} | {r.ke for r in self.relasi}
        yatim = sorted(dikenal - terhubung)
        if yatim:
            raise ValueError(f"simpul tanpa relasi bersumber: {yatim}")
        return self


def muat(berkas: Path = BERKAS_BAWAAN) -> Peta:
    return Peta.model_validate(json.loads(berkas.read_text(encoding="utf-8")))


def ringkas(peta: Peta) -> str:
    status_relasi = Counter(r.status for r in peta.relasi)
    kategori = Counter(r.kategori for r in peta.relasi)
    return (
        f"{len(peta.simpul)} simpul, {len(peta.relasi)} relasi "
        f"({kategori['tekstual']} tekstual, {kategori['tematik']} tematik); "
        f"relasi terverifikasi {status_relasi['terverifikasi']}, "
        f"perlu verifikasi {status_relasi['perlu_verifikasi']}."
    )


if __name__ == "__main__":
    jalur = Path(sys.argv[1]) if len(sys.argv) > 1 else BERKAS_BAWAAN
    print(ringkas(muat(jalur)))
