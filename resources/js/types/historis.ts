/**
 * Type definitions untuk fitur Import Data Historis PKM.
 *
 * Digunakan oleh:
 * - Pages/Admin/Historis/Index.tsx
 * - Components/pkm/FormHistoris.tsx
 */

/** Satu baris data historis PKM (manual maupun hasil parsing Excel) */
export interface HistorisRow {
    id: string;
    judul_kegiatan: string;
    id_jenis_pkm: string | number;
    tgl_mulai: string;
    tgl_selesai: string;
    /** true = user hanya tahu tahun, bukan tanggal lengkap */
    is_tahun_saja: boolean;

    // --- Lokasi ---
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    kelurahan_desa: string;
    alamat_lengkap: string;
    latitude: number | null;
    longitude: number | null;

    // --- Tim Pelaksana ---
    ketua_tim: string;
    dosen_terlibat: string[];
    staff_terlibat: string[];
    mahasiswa_terlibat: string[];

    // --- Pendanaan ---
    total_anggaran: number | string;
    sumber_dana_tambahan?: string;
    dana_perguruan_tinggi?: number | string;
    dana_pemerintah?: number | string;
    dana_lembaga_dalam?: number | string;
    dana_lembaga_luar?: number | string;

    // --- Arsip Eksternal ---
    link_laporan_akhir: string;
    link_dokumentasi: string;
    link_tambahan: LinkTambahan[];

    // --- Testimoni ---
    testimoni_nama: string;
    testimoni_link: string;
}

/** Link dokumen tambahan yang bisa ditambah secara dinamis */
export interface LinkTambahan {
    nama: string;
    url: string;
}

/** Data pegawai ringkas untuk dropdown autocomplete */
export interface PegawaiDropdownItem {
    id_pegawai: number;
    nama_pegawai: string;
    nip: string;
    role: string | null;
}

/** Data jenis PKM untuk dropdown select */
export interface JenisPkmItem {
    id_jenis_pkm: number | string;
    nama_jenis: string;
}

/** Props yang diterima halaman Historis dari Laravel (Inertia) */
export interface HistorisPageProps {
    listPegawai: PegawaiDropdownItem[];
    listJenisPkm: JenisPkmItem[];
}

/** Props untuk komponen FormHistoris */
export interface FormHistorisProps {
    data: HistorisRow;
    setData: (partialOrFunc: Partial<HistorisRow> | ((prev: HistorisRow) => HistorisRow)) => void;
    listPegawai: PegawaiDropdownItem[];
    listJenisPkm: JenisPkmItem[];
}
