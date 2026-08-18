# Ular Tangga Edukasi 🐍🪜📘

Game papan Ular Tangga yang dimodifikasi untuk pembelajaran: setiap kali pemain
berhenti di **kotak soal**, muncul pertanyaan pilihan ganda secara **acak**.
Jawab benar → tetap lanjut di kotak baru. Jawab salah → pemain **tetap di
tempat semula** (giliran habis).

- **Frontend**: HTML/CSS/JS statis → cocok di-*deploy* ke **GitHub Pages**.
- **Backend**: **Google Apps Script** + **Google Sheets** sebagai database
  (gratis, tidak perlu server sendiri).
- **Panel Admin**: ubah tampilan (judul, warna), ukuran papan, posisi kotak
  soal, tangga/ular, dan kelola bank soal (tambah satuan / massal, edit, hapus).

## Struktur folder

```
├── index.html          # Halaman permainan
├── admin.html           # Panel admin
├── css/
│   ├── style.css         # Tema visual utama
│   └── admin.css         # Tema panel admin
├── js/
│   ├── config.js          # ⚠️ isi URL Web App Apps Script di sini
│   ├── api.js              # Wrapper pemanggilan API
│   ├── game.js              # Logika permainan
│   └── admin.js              # Logika panel admin
└── apps-script/
    └── Code.gs                # Backend (tempel ke Google Apps Script)
```

## 1. Pasang Backend (Google Apps Script)

1. Buka [sheets.google.com](https://sheets.google.com) → buat **Spreadsheet baru** (judul bebas, mis. "DB Ular Tangga").
2. Menu **Extensions → Apps Script**.
3. Hapus kode default di `Code.gs`, lalu **salin-tempel seluruh isi** file `apps-script/Code.gs` dari folder ini.
4. Di dropdown pemilih fungsi (atas), pilih `setupSheets`, lalu klik ▶️ **Run**.
   - Izinkan akses saat Google meminta otorisasi (klik akun Anda → Advanced → Go to project (unsafe) → Allow). Ini normal untuk skrip milik sendiri.
   - Ini akan otomatis membuat sheet `Config`, `Questions`, `Log` beserta 3 contoh soal.
5. Klik **Deploy → New deployment**.
   - Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
   - **Execute as**: Me
   - **Who has access**: Anyone
   - Klik **Deploy**, lalu **Authorize access** jika diminta.
6. Salin **URL Web app** yang muncul (formatnya `https://script.google.com/macros/s/XXXX/exec`).

> Password admin default: **`admin123`** — segera ganti lewat tab "Akun Admin" di panel admin setelah login pertama.

### Kalau nanti mengubah isi Code.gs
Setelah edit kode, buat **Manage deployments → Edit (pensil) → New version → Deploy** agar perubahan ikut ter-update di URL yang sama.

## 2. Hubungkan Frontend ke Backend

Buka `js/config.js`, ganti baris:

```js
const API_URL = 'PASTE_URL_WEB_APP_APPS_SCRIPT_DI_SINI';
```

dengan URL Web App dari langkah 1 (diakhiri `/exec`).

## 3. Deploy Frontend ke GitHub Pages

1. Buat repository baru di GitHub (public), misalnya `ular-tangga-edukasi`.
2. Upload semua isi folder ini (index.html, admin.html, css/, js/) ke repo tersebut — **kecuali folder `apps-script/`** yang sudah dipasang di langkah 1 (folder itu boleh ikut di-upload juga untuk arsip, tidak masalah).
3. Di repo GitHub: **Settings → Pages**.
   - **Source**: Deploy from a branch
   - **Branch**: `main` / folder `/ (root)`
   - Klik **Save**.
4. Tunggu 1–2 menit, situs akan aktif di:
   `https://<username-anda>.github.io/ular-tangga-edukasi/`

Selesai! Bagikan link tersebut ke murid untuk bermain, dan buka
`.../admin.html` untuk masuk ke panel admin (guru).

## Cara pakai panel admin

- **Papan & Tampilan**: ubah judul, jumlah kotak papan, jumlah pemain
  maksimal, nomor kotak yang berisi soal (dipisah koma), posisi tangga/ular
  (`kotakAsal=kotakTujuan` satu per baris), dan warna tema.
- **Bank Soal**:
  - *Tambah satuan*: isi form pertanyaan + 4 opsi + jawaban benar.
  - *Tambah massal*: tempel banyak baris sekaligus dengan format
    `Pertanyaan|Opsi A|Opsi B|Opsi C|Opsi D|IndeksBenar` (0=A, 1=B, 2=C, 3=D).
  - Semua soal disimpan sebagai satu **pool acak** — sistem otomatis memilih
    soal berbeda tiap kali pemain (bahkan pemain yang sama) berhenti di kotak
    soal, sehingga soal tidak selalu sama walau berhenti di kotak yang sama.
- **Akun Admin**: ganti password admin.

## Aturan permainan

1. Setiap pemain bergiliran mengocok dadu (1–6) dan pion bergerak sesuai angka.
2. Untuk mencapai kotak terakhir harus dengan angka **pas** (tidak boleh lebih), jika lebih giliran dilewati.
3. Jika berhenti di **kotak soal (❓)** → muncul soal pilihan ganda acak.
   - **Benar** → pion tetap di kotak baru, lanjut cek tangga/ular.
   - **Salah** → pion **kembali ke posisi sebelum melangkah**, giliran habis.
4. Jika berhenti di kaki **tangga (🪜)** → naik otomatis ke kotak tujuan.
5. Jika berhenti di kepala **ular (🐍)** → turun otomatis ke kotak tujuan.
6. Pemain pertama yang mencapai kotak terakhir (tepat) menang.

## Catatan keamanan

- Password admin disimpan sederhana di Google Sheets (cocok untuk kebutuhan
  kelas/sekolah, bukan sistem tingkat perusahaan). Jangan gunakan password
  yang juga dipakai di akun penting lain.
- Jawaban benar **tidak pernah dikirim ke browser** sebelum pemain menjawab —
  pengecekan jawaban dilakukan di server (Apps Script), hanya hasil
  benar/salah yang dikirim balik.

## Kustomisasi lanjutan (opsional)

- Warna & font utama diatur lewat variabel CSS di `css/style.css` (bagian `:root`) jika ingin dikustom di luar panel admin.
- Tambah lebih banyak field tema (misal gambar latar) bisa dikembangkan di `Code.gs` (`DEFAULT_CONFIG.theme`) dan `admin.js`/`game.js`.
