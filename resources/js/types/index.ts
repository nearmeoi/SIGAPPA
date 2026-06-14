export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    type?: string;
    avatar?: string;
    avatar_url?: string;
    profile_photo_url?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Auth {
    user: User | null;
}

export interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

/**
 * PaginatedData — sesuai dengan response dari Laravel paginator.
 * Selalu gunakan tipe ini untuk semua data yang dipaginate dari backend.
 */
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T = unknown> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    first_page_url: string | null;
    last_page_url: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
}

export interface TestimoniItem {
    nama_pemberi: string;
    rating: number;
    pesan_ulasan: string;
}

export interface PkmData {
    id: number | null;
    nama: string;
    tahun: number;
    status: 'selesai' | 'berlangsung' | string;
    is_review?: boolean;
    deskripsi: string;
    thumbnail: string | null;
    laporan?: string | null;
    arsip_laporan?: string | null;
    dokumentasi?: string | null;
    tambahan?: { nama: string; url: string }[];
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    lat: number | string;
    lng: number | string;
    testimoni?: TestimoniItem[];
    jenis_pkm?: string;
    lokasi_tambahan?: unknown[];
    total_anggaran?: number;
    tim_kegiatan?: { nama: string; peran: string }[];
}

/** Digunakan oleh Admin/Dashboard untuk peta dengan info tambahan jenis PKM */
export interface PkmMapData extends Omit<PkmData, 'deskripsi' | 'thumbnail'> {
    jenis_nama: string;
    warna_icon: string;
}

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
}

export interface FeedbackDialogProps {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

/** Tipe stats visitor/views dari LandingController */
export interface VisitorStats {
    today_views: number;
    today_visitors: number;
    last_7_days_views: number;
    last_30_days_views: number;
    total_visitors: number;
}

export interface RabItem {
    nama_item: string;
    jumlah: number;
    harga: number;
    total: number;
}

export interface Submission {
    id: number;
    kode_unik?: string;
    judul: string;
    ringkasan: string;
    tanggal: string;
    status: string;
    catatan?: string;
    instansi_mitra?: string;
    no_telepon?: string;
    provinsi?: string;
    kota_kabupaten?: string;
    kecamatan?: string;
    kelurahan_desa?: string;
    alamat_lengkap?: string;
    latitude?: number | string;
    longitude?: number | string;
    lokasi_tambahan?: any;
    proposal?: string;
    surat_permohonan?: string;
    rab?: string;
    rab_items?: RabItem[];
    dana_perguruan_tinggi?: number;
    dana_pemerintah?: number;
    dana_lembaga_dalam?: number;
    dana_lembaga_luar?: number;
    sumber_dana?: string;
    total_anggaran?: number;
    tgl_mulai?: string;
    tgl_selesai?: string;
    is_tahun_saja?: boolean;
    jenis_pkm?: string;
    nama_pengusul?: string;
    email_pengusul?: string;
    kebutuhan?: string;
    tim_kegiatan?: { nama: string; peran: string; institusi?: string }[];
    aktivitas?: { status_pelaksanaan: string; catatan_pelaksanaan?: string };
    logs?: { id: number; status_lama: string | null; status_baru: string; catatan: string | null; created_at: string }[];
}
