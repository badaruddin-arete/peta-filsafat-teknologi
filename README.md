# Peta Pemikiran Filsafat Teknologi

Peta interaktif yang memperlihatkan hubungan antar pemikir filsafat teknologi, dari akar klasik (Aristoteles, Plato, Bacon) sampai teori adopsi teknologi dalam manajemen (Rogers, Davis). **Setiap hubungan wajib bersumber** dan dapat diperiksa lewat tautan di panel samping.

**Demo:** https://peta-filsafat-teknologi.lovable.app

## Prinsip data

Kesalahan atribusi ("A memengaruhi B" tanpa dasar) adalah kegagalan terburuk peta seperti ini, jadi aturannya dipaksakan oleh kode, bukan hanya niat baik.

- **12 pemikir, 14 relasi**, dikurasi manual. Data ada di [`src/data/peta.json`](src/data/peta.json).
- **Relasi tekstual** (11): klaim yang bersumber, misalnya "Feenberg mengkritik Heidegger" dengan rujukan bab dan halaman.
- **Relasi tematik** (3, garis putus-putus): *tafsiran penyusun*, bukan klaim pewarisan sejarah. Wajib memuat kolom `alasan` yang menyatakannya sebagai tafsiran.
- Setiap relasi punya sumber, dan relasi berstatus `terverifikasi` wajib memuat URL pada setiap sumbernya.
- Tahun sebelum 1000 harus ditandai perkiraan.

Aturan ini diperiksa oleh [`tools/validasi.py`](tools/validasi.py) dan 15 tes di [`tools/test_peta.py`](tools/test_peta.py): data tanpa sumber, simpul yatim, relasi kembar, relasi tematik tanpa alasan, dan sebagainya ditolak.

```bash
cd tools
pip install -r requirements.txt
python validasi.py     # ringkasan data
python -m pytest -q    # 15 tes
```

## Menjalankan antarmuka

Butuh [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

## Keterbatasan

- Peta ini **sengaja kecil** dan tidak mewakili seluruh filsafat teknologi. Banyak tokoh penting tidak ada, dan pemilihan simpul adalah keputusan penyusun.
- Relasi tematik adalah tafsiran. Pembaca dianjurkan menilainya sendiri.
- Ringkasan setiap pemikir hanyalah satu kalimat dan menyederhanakan banyak hal; rujuk karya aslinya.
- Ini bukan karya ilmiah yang ditelaah sejawat.

## Transparansi pembuatan

Rancangan model data, validator, dan pemeriksaan sumber saya susun dengan bantuan AI (Claude). Antarmukanya dibuat dengan Lovable. Kurasi dan tanggung jawab atas isi ada pada saya.

## Lisensi

Hak cipta dilindungi. Kode dan data boleh dibaca dan dinilai; penggunaan ulang memerlukan izin tertulis. Lihat [LICENSE](LICENSE).
