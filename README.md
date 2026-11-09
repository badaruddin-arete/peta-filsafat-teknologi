# Peta Pemikiran Filsafat Teknologi

Peta interaktif yang memperlihatkan hubungan antar pemikir filsafat teknologi, dari akar klasik (Aristoteles, Plato, Bacon) sampai teori adopsi teknologi dalam manajemen (Rogers, Davis). **Setiap hubungan dan setiap posisi wajib bersumber** dan dapat diperiksa lewat tautan.

Tiga tampilan:
- **I. Per Tradisi:** graf pemikir menurut tradisi dengan relasi bertipe (memengaruhi, mengkritik, membangun di atas, dan seterusnya).
- **II. Per Pertanyaan:** enam pertanyaan yang menjembatani filsafat dan teknologi (misalnya "Apakah teknologi bersifat netral?"), dengan posisi tiap pemikir, kutipan pendek, dan sumbernya.
- **III. Garis Waktu:** karya rujukan tiap pemikir pada sumbu waktu (skala dipatahkan antar zaman), dengan busur relasi yang sama. Tahun adalah tahun karya rujukan, bukan tahun hidup pemikir.

**Demo:** https://peta-filsafat-teknologi.lovable.app

## Prinsip data

Kesalahan atribusi ("A memengaruhi B" tanpa dasar) adalah kegagalan terburuk peta seperti ini, jadi aturannya dipaksakan oleh kode, bukan hanya niat baik.

- **12 pemikir, 14 relasi**, dikurasi manual. Data ada di [`src/data/peta.json`](src/data/peta.json).
- **6 pertanyaan, 18 posisi** di [`src/data/pertanyaan.json`](src/data/pertanyaan.json). Posisi berkategori *tekstual* (dapat dikutip dari sumber) atau *tafsiran* (kesimpulan penyusun, wajib menyertakan alasan). Pandangan yang tidak punya wakil di peta, misalnya "teknologi netral", dicantumkan sebagai pembanding supaya satu sisi tidak tampil sendirian.
- **Relasi tekstual** (11): klaim yang bersumber, misalnya "Feenberg mengkritik Heidegger" dengan rujukan bab dan halaman.
- **Relasi tematik** (3, garis putus-putus): *tafsiran penyusun*, bukan klaim pewarisan sejarah. Wajib memuat kolom `alasan` yang menyatakannya sebagai tafsiran.
- Setiap relasi punya sumber, dan relasi berstatus `terverifikasi` wajib memuat URL pada setiap sumbernya.
- Tahun sebelum 1000 harus ditandai perkiraan.

Aturan ini diperiksa oleh [`tools/validasi.py`](tools/validasi.py) dan [`tools/validasi_pertanyaan.py`](tools/validasi_pertanyaan.py) dengan 32 tes: data tanpa sumber, simpul yatim, relasi kembar, relasi anakronistik (misalnya karya yang mengkritik karya yang terbit sesudahnya), tafsiran tanpa alasan, pemikir yang tidak ada di peta, kutipan terlalu panjang, dan pertanyaan yang hanya memuat satu sisi ditolak.

```bash
cd tools
pip install -r requirements.txt
python validasi.py     # ringkasan data
python validasi_pertanyaan.py
python -m pytest -q    # 32 tes
```

## Menjalankan antarmuka

Butuh [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

## Keterbatasan

- Posisi berkategori tafsiran (5 dari 18) adalah kesimpulan penyusun dan dapat diperdebatkan; alasannya dicantumkan di setiap kartu.
- Peta ini **sengaja kecil** dan tidak mewakili seluruh filsafat teknologi. Banyak tokoh penting tidak ada, dan pemilihan simpul adalah keputusan penyusun.
- Relasi tematik adalah tafsiran. Pembaca dianjurkan menilainya sendiri.
- Ringkasan setiap pemikir hanyalah satu kalimat dan menyederhanakan banyak hal; rujuk karya aslinya.
- Ini bukan karya ilmiah yang ditelaah sejawat.

## Transparansi pembuatan

Rancangan model data, validator, dan pemeriksaan sumber saya susun dengan bantuan AI (Claude). Antarmukanya dibuat dengan Lovable. Kurasi dan tanggung jawab atas isi ada pada saya.

## Lisensi

Hak cipta dilindungi. Kode dan data boleh dibaca dan dinilai; penggunaan ulang memerlukan izin tertulis. Lihat [LICENSE](LICENSE).
