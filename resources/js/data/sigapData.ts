const SIGAP_DEMO_DATA_ENABLED = import.meta.env.VITE_ENABLE_SIGAP_DEMO_DATA !== 'false';

const demoTestimoni = [
    { nama_pemberi: 'Budi Santoso', rating: 5, pesan_ulasan: 'Kegiatan sangat bermanfaat untuk masyarakat desa kami.' },
    { nama_pemberi: 'Siti Aminah', rating: 4, pesan_ulasan: 'Pelaksanaannya baik, materi mudah dipahami.' },
];

const demoPkmRecords = [
    {
        id: 1,
        nama: 'Pemberdayaan UMKM Kripik Pisang',
        tahun: 2020,
        jenis_pkm: 'pendampingan_desa',
        warna_icon: '#15325F',
        status: 'selesai',
        deskripsi: 'Program pendampingan pemasaran digital dan perbaikan kemasan untuk industri rumah tangga kripik pisang di wilayah Tamalanrea.',
        thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: 'https://drive.google.com/',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Makassar',
        kecamatan: 'Tamalanrea',
        desa: 'Bira',
        lat: -5.135,
        lng: 119.495,
    },
    {
        id: 2,
        nama: 'Edukasi Sanitasi Lingkungan',
        tahun: 2020,
        jenis_pkm: 'bimbingan_teknis',
        warna_icon: '#DCAF67',
        status: 'berlangsung',
        deskripsi: 'Penyuluhan mengenai pentingnya memilah sampah organik dan non-organik serta pembuatan bank sampah mandiri tingkat RW.',
        thumbnail: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Maros',
        kecamatan: 'Turikale',
        desa: 'Pettuadae',
        lat: -5.0104,
        lng: 119.5721,
    },
    {
        id: 3,
        nama: 'Pendampingan Desa Wisata Kuliner',
        tahun: 2021,
        jenis_pkm: 'pendampingan_desa',
        warna_icon: '#15325F',
        status: 'selesai',
        deskripsi: 'Pendampingan penguatan produk kuliner lokal dan tata kelola promosi destinasi berbasis masyarakat.',
        thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Gowa',
        kecamatan: 'Somba Opu',
        desa: 'Tombolo',
        lat: -5.2005,
        lng: 119.4502,
    },
    {
        id: 4,
        nama: 'Bimtek Pengelolaan Homestay',
        tahun: 2021,
        jenis_pkm: 'bimbingan_teknis',
        warna_icon: '#DCAF67',
        status: 'selesai',
        deskripsi: 'Pelatihan tata kelola homestay dan pelayanan tamu untuk kelompok sadar wisata.',
        thumbnail: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Takalar',
        kecamatan: 'Galesong',
        desa: 'Boddia',
        lat: -5.3163,
        lng: 119.3665,
    },
    {
        id: 5,
        nama: 'Kolaborasi Mahasiswa Prodi Tata Boga',
        tahun: 2022,
        jenis_pkm: 'mahasiswa_prodi',
        warna_icon: '#10b981',
        status: 'berlangsung',
        deskripsi: 'Program pengabdian mahasiswa prodi untuk edukasi pengolahan pangan dan branding produk lokal.',
        thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Parepare',
        kecamatan: 'Bacukiki',
        desa: 'Lumpue',
        lat: -4.0286,
        lng: 119.6289,
    },
    {
        id: 6,
        nama: 'Pendampingan UMKM Desa Pesisir',
        tahun: 2022,
        jenis_pkm: 'pendampingan_desa',
        warna_icon: '#15325F',
        status: 'selesai',
        deskripsi: 'Penguatan UMKM pesisir melalui pelatihan kemasan, pemasaran, dan pencatatan keuangan sederhana.',
        thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Bone',
        kecamatan: 'Tanete Riattang',
        desa: 'Waetuo',
        lat: -4.5386,
        lng: 120.327,
    },
    {
        id: 7,
        nama: 'Bimtek Penyusunan Paket Wisata',
        tahun: 2023,
        jenis_pkm: 'bimbingan_teknis',
        warna_icon: '#DCAF67',
        status: 'selesai',
        deskripsi: 'Bimbingan teknis untuk penyusunan paket wisata berbasis pengalaman dan layanan destinasi.',
        thumbnail: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Bulukumba',
        kecamatan: 'Ujung Bulu',
        desa: 'Caile',
        lat: -5.5515,
        lng: 120.1939,
    },
    {
        id: 8,
        nama: 'Aksi Mahasiswa Prodi Perhotelan',
        tahun: 2023,
        jenis_pkm: 'mahasiswa_prodi',
        warna_icon: '#10b981',
        status: 'berlangsung',
        deskripsi: 'Program pengabdian lintas prodi untuk pendampingan pelayanan dasar dan edukasi hospitality komunitas.',
        thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Makassar',
        kecamatan: 'Ujung Tanah',
        desa: 'Totaka',
        lat: -5.098,
        lng: 119.4263,
    },
    {
        id: 9,
        nama: 'Pendampingan Branding Desa Wisata',
        tahun: 2024,
        jenis_pkm: 'pendampingan_desa',
        warna_icon: '#15325F',
        status: 'selesai',
        deskripsi: 'Pendampingan branding desa wisata melalui kurasi atraksi, visual promosi, dan kanal digital.',
        thumbnail: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Bantaeng',
        kecamatan: 'Bantaeng',
        desa: 'Lembang',
        lat: -5.5167,
        lng: 119.9475,
    },
    {
        id: 10,
        nama: 'Bimtek Pemasaran Produk Desa',
        tahun: 2024,
        jenis_pkm: 'bimbingan_teknis',
        warna_icon: '#DCAF67',
        status: 'berlangsung',
        deskripsi: 'Pelatihan pemasaran digital dan strategi foto produk untuk kelompok usaha desa.',
        thumbnail: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Soppeng',
        kecamatan: 'Liliriaja',
        desa: 'Jampu',
        lat: -4.3518,
        lng: 119.8437,
    },
    {
        id: 11,
        nama: 'Program Mahasiswa Prodi Tata Hidang',
        tahun: 2025,
        jenis_pkm: 'mahasiswa_prodi',
        warna_icon: '#10b981',
        status: 'selesai',
        deskripsi: 'Penguatan kapasitas layanan konsumsi kegiatan desa melalui kolaborasi mahasiswa prodi.',
        thumbnail: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Pinrang',
        kecamatan: 'Watang Sawitto',
        desa: 'Jaya',
        lat: -3.7854,
        lng: 119.6524,
    },
    {
        id: 12,
        nama: 'Pendampingan Desa Wisata Bahari',
        tahun: 2025,
        jenis_pkm: 'pendampingan_desa',
        warna_icon: '#15325F',
        status: 'berlangsung',
        deskripsi: 'Pendampingan pengelolaan paket wisata bahari dan penyusunan standar pelayanan wisatawan.',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Pangkajene dan Kepulauan',
        kecamatan: 'Liukang Tupabbiring',
        desa: 'Mattiro Deceng',
        lat: -4.7859,
        lng: 119.509,
    },
    {
        id: 13,
        nama: 'Bimtek Layanan Event Desa',
        tahun: 2026,
        jenis_pkm: 'bimbingan_teknis',
        warna_icon: '#DCAF67',
        status: 'berlangsung',
        deskripsi: 'Pelatihan teknis pelaksanaan event desa, tata kelola tamu, dan SOP operasional kegiatan.',
        thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400',
        laporan: '',
        dokumentasi: '',
        provinsi: 'Sulawesi Selatan',
        kabupaten: 'Makassar',
        kecamatan: 'Tallo',
        desa: 'Lembo',
        lat: -5.1107,
        lng: 119.4518,
    },
];

const demoSubmissionHistoryByRole = {
    dosen: [
        {
            id: 'history-accepted',
            judul: 'PKM Literasi Digital Pelaku UMKM',
            tanggal: '14 Feb 2026',
            status: 'diterima',
            ringkasan: 'Pengajuan dinyatakan lengkap dan lolos ke tahap pelaksanaan setelah review akhir tim P3M.',
            catatan: 'Dokumen proposal, RAB, dan susunan tim dinilai telah sesuai.',
        },
        {
            id: 'history-suspended',
            judul: 'PKM Pelatihan Hygiene Kuliner',
            tanggal: '28 Jan 2026',
            status: 'ditangguhkan',
            ringkasan: 'Pengajuan perlu revisi pada bagian luaran kegiatan dan penyesuaian jadwal pelaksanaan.',
            catatan: 'Perlu unggah ulang dokumen proposal revisi sebelum diproses kembali.',
        },
        {
            id: 'history-rejected',
            judul: 'PKM Penguatan Branding Desa Wisata',
            tanggal: '07 Des 2025',
            status: 'ditolak',
            ringkasan: 'Pengajuan belum dapat dilanjutkan karena ruang lingkup program belum selaras dengan skema yang tersedia.',
            catatan: 'Disarankan menyiapkan proposal baru dengan fokus kegiatan yang lebih spesifik.',
        },
    ],
    masyarakat: [
        {
            id: 'history-accepted',
            judul: 'PKM Literasi Digital Pelaku UMKM',
            tanggal: '14 Feb 2026',
            status: 'diterima',
            ringkasan: 'Pengajuan dinyatakan lengkap dan lolos ke tahap pelaksanaan setelah review akhir tim P3M.',
            catatan: 'Dokumen pengantar dan kebutuhan kegiatan dinilai telah sesuai.',
        },
        {
            id: 'history-suspended',
            judul: 'PKM Pelatihan Hygiene Kuliner',
            tanggal: '28 Jan 2026',
            status: 'ditangguhkan',
            ringkasan: 'Pengajuan perlu revisi pada penjelasan kebutuhan kegiatan dan penyesuaian jadwal pelaksanaan.',
            catatan: 'Lengkapi detail kebutuhan dan unggah ulang dokumen pendukung sebelum diproses kembali.',
        },
        {
            id: 'history-rejected',
            judul: 'PKM Penguatan Branding Desa Wisata',
            tanggal: '07 Des 2025',
            status: 'ditolak',
            ringkasan: 'Pengajuan belum dapat dilanjutkan karena ruang lingkup program belum selaras dengan skema yang tersedia.',
            catatan: 'Disarankan menyiapkan pengajuan baru dengan fokus kegiatan yang lebih spesifik.',
        },
    ],
};

const previewSummaryByRole = {
    dosen: 'Pratinjau status pengajuan untuk halaman akun dosen.',
    masyarakat: 'Pratinjau status pengajuan untuk halaman akun masyarakat.',
};

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const resolveCollection = (serverData, demoData) => {
    if (Array.isArray(serverData)) {
        return cloneData(serverData);
    }

    if (!SIGAP_DEMO_DATA_ENABLED) {
        return [];
    }

    return cloneData(demoData);
};

const getPreviewStatusFromLocation = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return new URLSearchParams(window.location.search).get('preview_status');
};

export const resolvePublicPkmData = (serverData) => {
    const data = resolveCollection(serverData, demoPkmRecords);
    return data.map((item) => ({
        ...item,
        deskripsi_jenis: item.deskripsi_jenis ?? '',
        testimoni: item.testimoni ?? (item.status === 'selesai' ? demoTestimoni : []),
    }));
};

export const resolveUserPkmData = (serverData) => resolveCollection(serverData, demoPkmRecords);

export const resolveUserSubmissionHistory = (serverData, role = 'dosen') => (
    resolveCollection(serverData, demoSubmissionHistoryByRole[role] ?? [])
);

export const resolveUserSubmissionData = (serverData, { role = 'dosen', previewStatus } = {}) => {
    if (Array.isArray(serverData)) {
        return cloneData(serverData);
    }

    if (!SIGAP_DEMO_DATA_ENABLED) {
        return [];
    }

    const activePreviewStatus = previewStatus ?? getPreviewStatusFromLocation();
    const allowedStatuses = ['diproses', 'ditangguhkan', 'ditolak', 'diterima', 'berlangsung', 'selesai'];

    if (!activePreviewStatus || activePreviewStatus === 'belum_diajukan' || !allowedStatuses.includes(activePreviewStatus)) {
        return [];
    }

    return [{
        id: `demo-${role}-${activePreviewStatus}`,
        judul: 'Demo Status Pengajuan PKM',
        ringkasan: previewSummaryByRole[role] ?? previewSummaryByRole.dosen,
        tanggal: '28 Mar 2026',
        status: activePreviewStatus,
    }];
};

export { SIGAP_DEMO_DATA_ENABLED };
