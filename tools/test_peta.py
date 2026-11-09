import copy
import json

import pytest
from pydantic import ValidationError

from validasi import BERKAS_BAWAAN, Peta, muat, ringkas


@pytest.fixture
def mentah() -> dict:
    return json.loads(BERKAS_BAWAAN.read_text(encoding="utf-8"))


def _ubah(mentah: dict, fn) -> dict:
    salinan = copy.deepcopy(mentah)
    fn(salinan)
    return salinan


def test_data_asli_lolos_validasi():
    peta = muat()
    assert len(peta.simpul) == 12
    assert ringkas(peta).startswith("12 simpul")


def test_setiap_simpul_punya_relasi():
    peta = muat()
    terhubung = {r.dari for r in peta.relasi} | {r.ke for r in peta.relasi}
    assert {s.id for s in peta.simpul} <= terhubung


def test_relasi_terverifikasi_selalu_punya_url():
    for r in muat().relasi:
        if r.status == "terverifikasi":
            assert all(s.url for s in r.sumber), (r.dari, r.ke)


def test_relasi_tematik_menyatakan_diri_sebagai_tafsiran():
    tematik = [r for r in muat().relasi if r.kategori == "tematik"]
    assert tematik
    assert all(r.alasan for r in tematik)


def test_relasi_tanpa_sumber_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["relasi"][0].update(sumber=[]))
    with pytest.raises(ValidationError):
        Peta.model_validate(data)


def test_simpul_yatim_ditolak(mentah):
    def tambah(d):
        d["simpul"].append(
            {
                "id": "yatim",
                "nama": "Yatim",
                "kelompok": "x",
                "karya_rujukan": {"judul": "x", "tahun": 2000, "perkiraan": False},
                "ringkasan": "x",
                "status": "perlu_verifikasi",
            }
        )

    with pytest.raises(ValidationError, match="tanpa relasi"):
        Peta.model_validate(_ubah(mentah, tambah))


def test_relasi_ke_simpul_tak_dikenal_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["relasi"][0].update(ke="tidak_ada"))
    with pytest.raises(ValidationError, match="tak dikenal"):
        Peta.model_validate(data)


def test_id_simpul_ganda_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["simpul"][1].update(id=d["simpul"][0]["id"]))
    with pytest.raises(ValidationError, match="ganda"):
        Peta.model_validate(data)


def test_relasi_kembar_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["relasi"].append(copy.deepcopy(d["relasi"][0])))
    with pytest.raises(ValidationError, match="kembar"):
        Peta.model_validate(data)


def test_relasi_ke_diri_sendiri_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["relasi"][0].update(ke=d["relasi"][0]["dari"]))
    with pytest.raises(ValidationError):
        Peta.model_validate(data)


def test_tematik_tanpa_alasan_ditolak(mentah):
    def hapus(d):
        r = next(r for r in d["relasi"] if r["kategori"] == "tematik")
        r.pop("alasan")

    with pytest.raises(ValidationError, match="alasan"):
        Peta.model_validate(_ubah(mentah, hapus))


def test_kategori_dan_jenis_harus_berpasangan(mentah):
    data = _ubah(mentah, lambda d: d["relasi"][0].update(jenis="kaitan_tematik"))
    with pytest.raises(ValidationError, match="kaitan_tematik"):
        Peta.model_validate(data)


def test_terverifikasi_tanpa_url_ditolak(mentah):
    def hapus_url(d):
        r = next(r for r in d["relasi"] if r["status"] == "terverifikasi")
        r["sumber"][0].pop("url", None)

    with pytest.raises(ValidationError, match="url"):
        Peta.model_validate(_ubah(mentah, hapus_url))


def test_tahun_kuno_wajib_perkiraan(mentah):
    data = _ubah(mentah, lambda d: d["simpul"][0]["karya_rujukan"].update(perkiraan=False))
    with pytest.raises(ValidationError, match="perkiraan"):
        Peta.model_validate(data)


def test_tahun_masa_depan_ditolak(mentah):
    data = _ubah(mentah, lambda d: d["simpul"][3]["karya_rujukan"].update(tahun=2099))
    with pytest.raises(ValidationError, match="melewati"):
        Peta.model_validate(data)
