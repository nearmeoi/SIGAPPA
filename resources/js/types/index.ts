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
 * PkmData — sesuai dengan response dari routes/web.php (landing) dan DashboardController.
 * Field ini di-mapping langsung dari model Pengajuan.
 */
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
