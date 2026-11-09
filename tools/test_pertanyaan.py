import copy
import json

import pytest
from pydantic import ValidationError

from validasi import muat as muat_peta
from validasi_pertanyaan import (
    BERKAS_PERTANYAAN,
    KUTIPAN_MAKSIMAL,
    PetaPertanyaan,
    muat,
    ringkas,
)


@pytest.fixture
def mentah() -> dict:
    return json.loads(BERKAS_PERTANYAAN.read_text(encoding="utf-8"))


def _ubah(mentah: dict, fn) -> dict:
    salinan = copy.deepcopy(mentah)
    fn(salinan)
    return salinan


def _periksa(data: dict) -> None:
    PetaPertanyaan.model_validate(data).periksa_terhadap(muat_peta())


def test_data_asli_lolos_validasi():
    data = muat()
    assert len(data.pertanyaan) == 6
    assert ringkas(data).startswith("6 pertanyaan")


def test_semua_pemikir_di_peta_muncul_di_minimal_satu_pertanyaan():
    dipakai = {p.pemikir for q in muat().pertanyaan for p in q.posisi}
    assert {s.id for s in muat_peta().simpul} <= dipakai


def test_setiap_pertanyaan_punya_dua_sikap_atau_lebih():
    for q in muat().pertanyaan:
        dipakai = {p.sikap for p in q.posisi} | {b.sikap for b in q.pandangan_pembanding}
        assert len(dipakai) >= 2, q.id


def test_semua_tafsiran_menyatakan_alasan():
    posisi = [p for q in muat().pertanyaan for p in q.posisi if p.kategori == "tafsiran"]
    assert posisi
    assert all(p.alasan for p in posisi)


def test_kutipan_tetap_pendek():
    for q in muat().pertanyaan:
        for p in q.posisi:
            if p.kutipan:
                assert len(p.kutipan) <= KUTIPAN_MAKSIMAL


def test_pemikir_tak_dikenal_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["pertanyaan"][0]["posisi"][0].update(pemikir="tidak_ada"))
    with pytest.raises(ValueError, match="tak ada di peta"):
        _periksa(data)


def test_sikap_tak_dikenal_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["pertanyaan"][0]["posisi"][0].update(sikap="ngawur"))
    with pytest.raises(ValidationError, match="sikap tak dikenal"):
        PetaPertanyaan.model_validate(data)


def test_posisi_tanpa_sumber_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["pertanyaan"][0]["posisi"][0].update(sumber=[]))
    with pytest.raises(ValidationError):
        PetaPertanyaan.model_validate(data)


def test_tafsiran_tanpa_alasan_ditolak(mentah):
    def hapus(d):
        p = next(p for q in d["pertanyaan"] for p in q["posisi"] if p["kategori"] == "tafsiran")
        p.pop("alasan")

    with pytest.raises(ValidationError, match="alasan"):
        PetaPertanyaan.model_validate(_ubah(mentah, hapus))


def test_terverifikasi_tanpa_url_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["pertanyaan"][0]["posisi"][0]["sumber"][0].pop("url"))
    with pytest.raises(ValidationError, match="url"):
        PetaPertanyaan.model_validate(data)


def test_kutipan_terlalu_panjang_ditolak(mentah):
    data = _ubah(
        mentah,
        lambda d: d["pertanyaan"][0]["posisi"][0].update(kutipan="x" * (KUTIPAN_MAKSIMAL + 1)),
    )
    with pytest.raises(ValidationError, match="kutipan"):
        PetaPertanyaan.model_validate(data)


def test_pemikir_ganda_dalam_satu_pertanyaan_ditolak(mentah):
    def gandakan(d):
        q = d["pertanyaan"][0]
        q["posisi"].append(copy.deepcopy(q["posisi"][0]))

    with pytest.raises(ValidationError, match="dua kali"):
        PetaPertanyaan.model_validate(_ubah(mentah, gandakan))


def test_pertanyaan_satu_sisi_ditolak(mentah):
    def satu_sisi(d):
        q = d["pertanyaan"][0]
        q["pandangan_pembanding"] = []
        for p in q["posisi"]:
            p["sikap"] = "tidak_netral"

    with pytest.raises(ValidationError, match="bukan perdebatan"):
        PetaPertanyaan.model_validate(_ubah(mentah, satu_sisi))


def test_pembanding_tanpa_url_ditolak(mentah):
    data = _ubah(
        mentah,
        lambda d: d["pertanyaan"][0]["pandangan_pembanding"][0]["sumber"][0].pop("url"),
    )
    with pytest.raises(ValidationError, match="url"):
        PetaPertanyaan.model_validate(data)


def test_id_pertanyaan_ganda_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["pertanyaan"][1].update(id=d["pertanyaan"][0]["id"]))
    with pytest.raises(ValidationError, match="ganda"):
        PetaPertanyaan.model_validate(data)
