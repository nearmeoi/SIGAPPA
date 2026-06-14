# Product Requirement Document (PRD) - SIGAPPA

## 1. Pendahuluan
**SIGAPPA** (Sistem Informasi Pengajuan Pengabdian Kepada Masyarakat Politeknik Pariwisata Makassar) adalah sebuah platform berbasis web yang digunakan untuk mengelola seluruh siklus pengajuan, pelaksanaan, hingga pengarsipan kegiatan Pengabdian Kepada Masyarakat (PKM) di lingkungan Politeknik Pariwisata Makassar.

Sistem ini memfasilitasi kolaborasi antara Dosen/Staff (sebagai pengusul PKM), P3M (sebagai Administrator), Direktur (sebagai pihak penyetuju), serta masyarakat umum (sebagai mitra penerima manfaat).

---

## 2. Tujuan Sistem
- Memfasilitasi pendaftaran dan pengajuan usulan PKM oleh Dosen dan Staff secara digital.
- Menyederhanakan proses verifikasi identitas dosen menggunakan NIP yang terintegrasi dengan data kepegawaian institusi.
- Menyediakan transparansi status pengajuan bagi dosen pengusul maupun anggota tim yang terlibat.
- Mempermudah pihak Manajemen (Direktur & P3M) dalam meninjau, memberi catatan revisi, dan menyetujui usulan PKM.
- Mengotomatisasi pengumpulan arsip laporan akhir, dokumentasi kegiatan, serta pengisian testimoni dari mitra secara langsung di lapangan menggunakan QR Code/Link unik.
- Menyediakan dashboard interaktif dengan peta persebaran kegiatan PKM untuk kebutuhan publik dan monitoring pimpinan.

---

## 3. Aktor & Peran (User Roles)
Sistem memiliki 4 aktor utama dengan hak akses masing-masing:

### 3.1. Dosen / Staff (Pengusul)
- **Verifikasi NIP & Registrasi:** Melakukan registrasi mandiri dengan memasukkan NIP. Sistem akan memverifikasi NIP ke dalam tabel pegawai. Jika NIP valid dan akun belum terdaftar, dosen dapat menetapkan email dan password untuk membuat akun.
- **Login:** Masuk menggunakan email dan password yang telah didaftarkan.
- **Pengajuan PKM:** Mengisi form pengajuan PKM baru (judul, skema, lokasi, tim terlibat, anggaran, dsb).
- **Cek Status:** Memantau status usulan PKM yang diajukan sendiri maupun usulan di mana ia terdaftar sebagai anggota tim (dosen terlibat).
- **Revisi Mandiri:** Mengedit/memperbaiki draf pengajuan jika mendapatkan instruksi revisi dari Admin atau Direktur.

### 3.2. Administrator (P3M)
- **Dashboard Admin:** Melihat statistik pengajuan masuk, aktivitas aktif, dan grafik perkembangan PKM.
- **Manajemen Pengajuan:** Meninjau pengajuan baru, mengubah status, mengedit detail lokasi (koordinat), dan memproses kelayakan awal sebelum diteruskan ke Direktur.
- **Manajemen Pegawai & User:** Mengelola database pegawai (termasuk import NIP) dan mengelola akun user terdaftar.
- **Manajemen Aktivitas & Tim:** Memperbarui detail pelaksanaan kegiatan PKM, menambahkan tim pelaksana (dosen, staff, mahasiswa), dan menyinkronkan data tim.
- **Master Data Jenis PKM:** Mengelola daftar kategori/skema PKM yang tersedia.
- **Template Dokumen:** Mengunggah template proposal/laporan akhir agar dapat diunduh oleh dosen.
- **Pengarsipan & Testimoni:** Mengelola tautan pengumpulan arsip laporan dan review testimoni dari mitra kegiatan.
- **Import Historis:** Mengimpor data PKM lama dari file Excel ke dalam database dengan sistem pencocokan nama pegawai/dosen yang cerdas (toleran terhadap gelar akademis dan spasi).

### 3.3. Direktur
- **Dashboard Direktur:** Memantau pengajuan PKM yang siap ditinjau.
- **Persetujuan & Revisi:** Memberikan persetujuan (*Approve*), penolakan (*Decline*), atau instruksi perbaikan (*Revise*) pada dokumen pengajuan dosen.

### 3.4. Masyarakat (Mitra / Umum)
- **Peta PKM:** Melihat visualisasi peta persebaran lokasi pelaksanaan PKM beserta informasi dasar kegiatan.
- **Kumpul Laporan/Dokumen:** Mengunggah file laporan akhir atau dokumentasi melalui link pengumpulan arsip publik.
- **Testimoni Kegiatan:** Mengisi form ulasan/testimoni mengenai kebermanfaatan kegiatan PKM yang dilakukan di wilayah mereka.

---

## 4. Alur Kerja Utama (Core Workflows)

### 4.1. Alur Registrasi & Login Dosen (NIP Bound Flow)
```mermaid
sequenceDiagram
    actor D as Dosen
    participant S as Sistem (SIGAPPA)
    participant DB as Database
    
    D->>S: Input NIP Kepegawaian
    S->>DB: Cek kecocokan NIP di tabel Pegawai
    alt NIP Tidak Terdaftar
        DB-->>S: NIP tidak ditemukan
        S-->>D: Tampilkan error "NIP tidak terdaftar"
    alt NIP Valid & Belum Punya Akun
        DB-->>S: Pegawai ditemukan, id_user NULL
        S-->>D: Buka form registrasi (Email & Password)
        D->>S: Submit email & password
        S->>DB: Buat User baru & hubungkan id_user ke Pegawai
        S-->>D: Login otomatis & arahkan ke Cek Status
    alt NIP Valid & Sudah Punya Akun
        DB-->>S: Pegawai ditemukan, id_user terisi
        S-->>D: Buka form login langsung (Masukkan Password)
        D->>S: Submit password
        S-->>D: Login berhasil & arahkan ke Cek Status
    end
```

### 4.2. Siklus Hidup Pengajuan PKM (Submission Lifecycle)
1. **Draf / Pengusulan:** Dosen mengisi form pengajuan. Status awal: `pending_admin` (menunggu verifikasi P3M).
2. **Review Admin:** Admin memeriksa kelengkapan administrasi dan koordinat peta. Status dapat diubah menjadi `pending_direktur` (diteruskan) atau `ditolak_admin`.
3. **Persetujuan Direktur:** Direktur meninjau usulan.
   - Jika disetujui: Status berubah menjadi `disetujui` (siap dilaksanakan).
   - Jika butuh perbaikan: Status menjadi `perlu_revisi` (dosen dapat mengedit kembali).
   - Jika ditolak: Status menjadi `ditolak_direktur`.
4. **Pelaksanaan & Pelaporan:** Kegiatan dilaksanakan di lapangan. Setelah selesai, status diubah menjadi `selesai`. Link pengumpulan arsip publik dan pengisian testimoni diaktifkan untuk diisi oleh mitra/dosen di lapangan.

---

## 5. Fitur & Spesifikasi Teknis
- **Teknologi Utama:** Laravel 11, React (TypeScript), Inertia.js, Tailwind CSS, Vite.
- **Visualisasi Peta:** Leaflet.js dengan integrasi API Nominatim/Geocode OpenStreetMap untuk pencarian dan pemetaan koordinat lokasi PKM secara real-time.
- **Fuzzy Name Matching (Excel Import):** Algoritma pembersihan string yang menghapus gelar akademis (seperti Dr., Prof., M.Pd, S.E, dll.) dan membandingkan nama pegawai menggunakan pencocokan batas kata (*word boundary*) untuk mencegah kesalahan integrasi anggota tim saat import data historis.
- **Pencarian Global:** Fitur pencarian terpadu bagi administrator untuk melacak data pengajuan, aktivitas, pegawai, dan pengguna secara instan dari dashboard.
