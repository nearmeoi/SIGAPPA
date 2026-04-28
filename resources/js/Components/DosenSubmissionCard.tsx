import React, { useRef, useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import ActionFeedbackDialog from './ActionFeedbackDialog';
import MapLocationPicker from './MapLocationPicker';
import DocumentationGallery from './DocumentationGallery';
import TestimonialSidebarDisplay from './TestimonialSidebarDisplay';
import type { PkmData } from '@/types';

interface Submission {
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

interface DosenSubmissionCardProps {
    onSubmitted?: (submission: Submission) => void;
    submissionStatus?: string;
    onUpdateSubmissionStatus?: (status: string) => void;
    pkmStatusData?: PkmData | null;
    pkmListData?: PkmData[];
    submissionHistory?: Submission[];
    hideMainTabNav?: boolean;
    onlyShowStatus?: boolean;
    jenisPkmOptions?: { value: number; label: string }[];
    editSubmission?: Submission | null;
    pagination?: {
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    } | null;
    filters?: {
        search?: string;
    };
}

interface RabItem {
    nama_item: string;
    jumlah: number;
    harga: number;
    total: number;
}

interface FormData {
    kode_pengajuan?: string | null;
    id_jenis_pkm: number | string;
    nama_ketua: string;
    instansi: string;
    email: string;
    whatsapp: string;
    judul_kegiatan: string;
    kebutuhan: string;
    lokasi_list: {
        id_ui: number;
        provinsi: string;
        kota_kabupaten: string;
        kecamatan: string;
        kelurahan_desa: string;
        alamat_lengkap: string;
        latitude: number | null;
        longitude: number | null;
    }[];
    tgl_mulai: string | null;
    tgl_selesai: string | null;
    is_tahun_saja: boolean;

    tim_dosen: string[];
    tim_staff: string[];
    tim_mahasiswa: string[];

    rab_items: RabItem[];

    dana_perguruan_tinggi: number;
    dana_pemerintah: number;
    dana_lembaga_dalam: number;
    dana_lembaga_luar: number;

    surat_permohonan: File | null;
    surat_proposal: File | null;
    existing_surat_permohonan?: string;
    existing_surat_proposal?: string;
    link_tambahan: { name: string; url: string }[];
    sumber_dana: string[];
}

const createSubmittedLabel = (): string => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
const getPkmStatusLabel = (status: string): string => status === 'berlangsung' ? 'Berlangsung' : 'Selesai';
const formatCoordinate = (value: unknown): string | null => {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    return Number.isFinite(parsed) ? parsed.toFixed(6) : null;
};

const getSubmissionStatusStyle = (status: string) => {
    const styles: Record<string, { label: string; icon: string; bg: string; color: string }> = {
        diproses: { label: 'Diproses', icon: 'fa-clock', bg: '#dbeafe', color: '#1E4A8C' },
        ditangguhkan: { label: 'Revisi', icon: 'fa-file-pen', bg: '#fef3c7', color: '#b45309' },
        'Menunggu Keputusan Direktur': { label: 'Menunggu Keputusan Direktur', icon: 'fa-user-tie', bg: '#ede9fe', color: '#5b21b6' },
        ditolak: { label: 'Ditolak', icon: 'fa-circle-xmark', bg: '#fee2e2', color: '#b91c1c' },
        diterima: { label: 'Diterima', icon: 'fa-circle-check', bg: '#dcfce7', color: '#15803d' },
        berlangsung: { label: 'Berlangsung', icon: 'fa-person-walking', bg: '#fef3c7', color: '#b45309' },
        selesai: { label: 'Selesai', icon: 'fa-flag-checkered', bg: '#dcfce7', color: '#15803d' },
        direvisi: { label: 'Direvisi', icon: 'fa-file-pen', bg: '#fff7ed', color: '#ea580c' },
        belum_diajukan: { label: 'Belum Diajukan', icon: 'fa-file-circle-plus', bg: '#f1f5f9', color: '#64748b' },
    };
    return styles[status] || styles.belum_diajukan;
};

export default function DosenSubmissionCard({
    onSubmitted,
    submissionStatus = 'belum_diajukan',
    onUpdateSubmissionStatus,
    pkmStatusData = null,
    pkmListData = [],
    submissionHistory = [],
    hideMainTabNav = false,
    onlyShowStatus = false,
    jenisPkmOptions = [],
    editSubmission = null,
    pagination = null,
    filters = {},
}: DosenSubmissionCardProps) {
    const [mainTab, setMainTab] = useState('pengajuan');
    const [expandedHubSections, setExpandedHubSections] = useState({ kegiatan: false, riwayat: false });
    const [expandedActivityId, setExpandedActivityId] = useState<number | null>(pkmListData[0]?.id ?? null);
    const [selectedDetail, setSelectedDetail] = useState<Submission | null>(null);
    const [selectedStatusLog, setSelectedStatusLog] = useState<Submission | null>(null);

    const [searchValue, setSearchValue] = useState(filters.search || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchValue !== (filters.search || '')) {
                router.get(
                    window.location.pathname,
                    { search: searchValue },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchValue]);
    const [isMockSubmitting, setIsMockSubmitting] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ show: false, type: 'success', title: '', message: '' });
    const [pegawaiOptions, setPegawaiOptions] = useState<{ dosen: string[], staff: string[] }>({ dosen: [], staff: [] });
    const [sortOption, setSortOption] = useState<'default' | 'status' | 'waktu_terbaru' | 'waktu_terlama'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [collapsedLocations, setCollapsedLocations] = useState<Record<number, boolean>>({});

    const toggleLocationCollapse = (idUi: number) => {
        setCollapsedLocations(prev => ({ ...prev, [idUi]: !prev[idUi] }));
    };

    const sortedHistory = useMemo(() => {
        let history = [...submissionHistory];
        switch (sortOption) {
            case 'default':
                history.sort((a, b) => {
                    const isAPri = a.status === 'direvisi' || a.status === 'diproses';
                    const isBPri = b.status === 'direvisi' || b.status === 'diproses';
                    if (isAPri && !isBPri) return -1;
                    if (!isAPri && isBPri) return 1;
                    const diff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
            case 'status':
                history.sort((a, b) => a.status.localeCompare(b.status));
                break;
            case 'waktu_terbaru':
                history.sort((a, b) => {
                    const diff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
            case 'waktu_terlama':
                history.sort((a, b) => {
                    const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
        }
        return history;
    }, [submissionHistory, sortOption]);

    useEffect(() => {
        axios.get('/api/pegawai-options')
            .then(res => setPegawaiOptions(res.data))
            .catch(err => console.error("Could not fetch pegawai options", err));
    }, []);

    const { data, setData, errors, setError, clearErrors, reset } = useForm<FormData>({
        id_jenis_pkm: jenisPkmOptions?.[0]?.value || '',
        nama_ketua: '',
        instansi: 'Politeknik Pariwisata Makassar',
        email: '',
        whatsapp: '',
        judul_kegiatan: '',
        kebutuhan: '',
        lokasi_list: [{
            id_ui: Date.now(),
            provinsi: '',
            kota_kabupaten: '',
            kecamatan: '',
            kelurahan_desa: '',
            alamat_lengkap: '',
            latitude: null,
            longitude: null,
        }],
        tgl_mulai: null,
        tgl_selesai: null,
        is_tahun_saja: false,
        tim_dosen: [''],
        tim_staff: [''],
        tim_mahasiswa: [''],
        rab_items: [{ nama_item: '', jumlah: 1, harga: 0, total: 0 }],
        dana_perguruan_tinggi: 0,
        dana_pemerintah: 0,
        dana_lembaga_dalam: 0,
        dana_lembaga_luar: 0,
        surat_permohonan: null,
        surat_proposal: null,
        link_tambahan: [{ name: '', url: '' }],
        sumber_dana: [],
    });

    // Pre-fill form when editSubmission is provided (from /pengajuan?edit=ID)
    useEffect(() => {
        if (!editSubmission) return;

        let parsedLinks = [{ name: '', url: '' }];
        try {
            if (editSubmission.rab) {
                const arr = JSON.parse(editSubmission.rab);
                if (Array.isArray(arr) && arr.length > 0) {
                    parsedLinks = arr.map((item: any) => ({ name: item.name || '', url: item.url || '' }));
                }
            }
        } catch { }

        const mappedData: FormData = {
            kode_pengajuan: editSubmission.kode_unik ?? null,
            id_jenis_pkm: jenisPkmOptions.find(o => o.label === editSubmission.jenis_pkm)?.value || jenisPkmOptions?.[0]?.value || '',
            nama_ketua: editSubmission.nama_pengusul || '',
            instansi: editSubmission.instansi_mitra || 'Politeknik Pariwisata Makassar',
            email: editSubmission.email_pengusul || '',
            whatsapp: editSubmission.no_telepon || '',
            judul_kegiatan: editSubmission.judul || '',
            kebutuhan: editSubmission.kebutuhan || editSubmission.ringkasan || '',
            lokasi_list: (() => {
                const arr = [{
                    id_ui: Date.now(),
                    provinsi: editSubmission.provinsi || '',
                    kota_kabupaten: editSubmission.kota_kabupaten || '',
                    kecamatan: editSubmission.kecamatan || '',
                    kelurahan_desa: editSubmission.kelurahan_desa || '',
                    alamat_lengkap: editSubmission.alamat_lengkap || '',
                    latitude: editSubmission.latitude ? Number(editSubmission.latitude) : null,
                    longitude: editSubmission.longitude ? Number(editSubmission.longitude) : null,
                }];
                try {
                    const tambahanStr = (editSubmission as any).lokasi_tambahan;
                    if (tambahanStr) {
                        const parsed = typeof tambahanStr === 'string' ? JSON.parse(tambahanStr) : tambahanStr;
                        if (Array.isArray(parsed)) {
                            parsed.forEach((loc, i) => {
                                arr.push({
                                    id_ui: Date.now() + i + 1,
                                    provinsi: loc.provinsi || '',
                                    kota_kabupaten: loc.kota_kabupaten || '',
                                    kecamatan: loc.kecamatan || '',
                                    kelurahan_desa: loc.kelurahan_desa || '',
                                    alamat_lengkap: loc.alamat_lengkap || '',
                                    latitude: loc.latitude ? Number(loc.latitude) : null,
                                    longitude: loc.longitude ? Number(loc.longitude) : null,
                                });
                            });
                        }
                    }
                } catch { }
                return arr;
            })(),
            tgl_mulai: editSubmission.tgl_mulai || null,
            tgl_selesai: editSubmission.tgl_selesai || null,
            is_tahun_saja: !!editSubmission.is_tahun_saja,
            tim_dosen: [''],
            tim_staff: [''],
            tim_mahasiswa: [''],
            rab_items: editSubmission.rab_items && editSubmission.rab_items.length > 0
                ? (editSubmission.rab_items as RabItem[])
                : [{ nama_item: '', jumlah: 1, harga: 0, total: 0 }],
            dana_perguruan_tinggi: Number(editSubmission.dana_perguruan_tinggi) || 0,
            dana_pemerintah: Number(editSubmission.dana_pemerintah) || 0,
            dana_lembaga_dalam: Number(editSubmission.dana_lembaga_dalam) || 0,
            dana_lembaga_luar: Number(editSubmission.dana_lembaga_luar) || 0,
            surat_permohonan: null,
            surat_proposal: null,
            existing_surat_permohonan: editSubmission.surat_permohonan,
            existing_surat_proposal: editSubmission.proposal,
            link_tambahan: parsedLinks,
            sumber_dana: editSubmission.sumber_dana ? editSubmission.sumber_dana.split(',').map(s => s.trim()) : [],
        };

        if (editSubmission.tim_kegiatan) {
            const dosen = editSubmission.tim_kegiatan.filter(t => t.peran === 'Dosen').map(t => t.nama);
            const staff = editSubmission.tim_kegiatan.filter(t => t.peran === 'Staff').map(t => t.nama);
            const mahasiswa = editSubmission.tim_kegiatan.filter(t => t.peran === 'Mahasiswa').map(t => t.nama);
            if (dosen.length) mappedData.tim_dosen = dosen;
            if (staff.length) mappedData.tim_staff = staff;
            if (mahasiswa.length) mappedData.tim_mahasiswa = mahasiswa;
        }

        setData(mappedData);
        setMainTab('pengajuan');
    }, [editSubmission]);

    const handleAddMember = (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa') => setData(type, [...data[type], '']);
    const handleRemoveMember = (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa', idx: number) => setData(type, data[type].filter((_, i) => i !== idx));
    const handleMemberChange = (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa', idx: number, val: string) => {
        const updated = [...data[type]];
        updated[idx] = val;
        setData(type, updated);
    };

    const handleAddRab = () => setData('rab_items', [...data.rab_items, { nama_item: '', jumlah: 1, harga: 0, total: 0 }]);
    const handleRemoveRab = (idx: number) => setData('rab_items', data.rab_items.filter((_, i) => i !== idx));
    const handleRabChange = (idx: number, field: keyof RabItem, val: string | number) => {
        const updated = [...data.rab_items];
        const item = { ...updated[idx], [field]: val };
        if (field === 'jumlah' || field === 'harga') item.total = Number(item.jumlah) * Number(item.harga);
        updated[idx] = item;
        setData('rab_items', updated);
    };

    const handleAddLink = () => setData('link_tambahan', [...data.link_tambahan, { name: '', url: '' }]);
    const handleRemoveLink = (idx: number) => setData('link_tambahan', data.link_tambahan.filter((_, i) => i !== idx));
    const handleLinkChange = (idx: number, field: 'name' | 'url', val: string) => {
        const updated = [...data.link_tambahan];
        updated[idx] = { ...updated[idx], [field]: val };
        setData('link_tambahan', updated);
    };

    const totalRAB = useMemo(() => data.rab_items.reduce((sum, item) => sum + (item.total || 0), 0), [data.rab_items]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.judul_kegiatan.trim() || !data.nama_ketua.trim() || (!data.surat_proposal && !data.kode_pengajuan)) {
            setFeedbackDialog({ show: true, type: 'error', title: 'Form Belum Lengkap', message: 'Mohon lengkapi judul kegiatan, nama ketua, dan dokumen proposal.' });
            return;
        }
        setIsMockSubmitting(true);

        const payload = {
            id_jenis_pkm: data.id_jenis_pkm || null,
            judul_kegiatan: data.judul_kegiatan,
            kebutuhan: data.kebutuhan,
            nama_dosen: data.nama_ketua,
            email: data.email,
            instansi_mitra: data.instansi,
            no_telepon: data.whatsapp,
            lokasi_list: JSON.stringify(data.lokasi_list),
            tgl_mulai: data.tgl_mulai,
            tgl_selesai: data.tgl_selesai,
            is_tahun_saja: data.is_tahun_saja ? '1' : '0',

            dosen_terlibat: data.tim_dosen.filter(v => v.trim() !== ''),
            staff_terlibat: data.tim_staff.filter(v => v.trim() !== ''),
            mahasiswa_terlibat: data.tim_mahasiswa.filter(v => v.trim() !== ''),
            sumber_dana: data.sumber_dana.join(', ') || '',
            dana_perguruan_tinggi: data.dana_perguruan_tinggi > 0 ? data.dana_perguruan_tinggi : null,
            dana_pemerintah: data.dana_pemerintah > 0 ? data.dana_pemerintah : null,
            dana_lembaga_dalam: data.dana_lembaga_dalam > 0 ? data.dana_lembaga_dalam : null,
            dana_lembaga_luar: data.dana_lembaga_luar > 0 ? data.dana_lembaga_luar : null,
            total_anggaran: totalRAB || 0,
            surat_proposal: data.surat_proposal,
            surat_permohonan: data.surat_permohonan,
            rab: JSON.stringify(data.link_tambahan.filter(v => v.url.trim() !== '')),
            rab_items: data.rab_items
                .filter(item => item.nama_item.trim() !== '' && Number(item.jumlah) > 0)
                .map(item => ({
                    nama_item: item.nama_item.trim(),
                    jumlah: Number(item.jumlah) || 0,
                    harga: Number(item.harga) || 0,
                    total: (Number(item.jumlah) || 0) * (Number(item.harga) || 0),
                })),
        };

        const url = data.kode_pengajuan ? `/pengajuan/${data.kode_pengajuan}` : '/pengajuan';
        const finalPayload = data.kode_pengajuan ? { ...payload, _method: 'put' } : payload;

        router.post(url, finalPayload as any, {
            preserveScroll: true,
            onSuccess: () => {
                setIsMockSubmitting(false);
                onSubmitted?.({
                    id: Date.now(),
                    judul: data.judul_kegiatan,
                    ringkasan: `Lokasi: ${data.lokasi_list[0]?.kota_kabupaten || '-'} • Ketua: ${data.nama_ketua}`,
                    tanggal: createSubmittedLabel(),
                    status: 'diproses',
                });
                onUpdateSubmissionStatus?.('diproses');
                const isEditMode = !!data.kode_pengajuan;
                setFeedbackDialog({ show: true, type: 'success', title: 'Pengajuan Berhasil', message: `Data pengajuan PKM Dosen telah ${isEditMode ? 'diperbarui' : 'disimpan'}.${isEditMode ? ' Mengarahkan ke halaman status...' : ''}` });
                if (isEditMode) {
                    setTimeout(() => router.visit('/cek-status'), 1800);
                }
                reset();
            },
            onError: () => {
                setIsMockSubmitting(false);
                setFeedbackDialog({ show: true, type: 'error', title: 'Gagal Mengirim', message: 'Terjadi kesalahan saat mengirim pengajuan.' });
            },
        });
    };

    const handleEditPengajuan = () => {
        if (!selectedDetail) return;

        let parsedLinks = [{ name: '', url: '' }];
        try {
            if (selectedDetail.rab) {
                const arr = JSON.parse(selectedDetail.rab);
                if (Array.isArray(arr) && arr.length > 0) {
                    parsedLinks = arr.map((item: any) => ({ name: item.name || '', url: item.url || '' }));
                }
            }
        } catch { }

        const mappedData: FormData = {
            kode_pengajuan: selectedDetail.kode_unik ?? null,
            id_jenis_pkm: jenisPkmOptions.find(o => o.label === selectedDetail.jenis_pkm)?.value || jenisPkmOptions?.[0]?.value || '',
            nama_ketua: selectedDetail.nama_pengusul || '',
            instansi: selectedDetail.instansi_mitra || 'Politeknik Pariwisata Makassar',
            email: selectedDetail.email_pengusul || '',
            whatsapp: selectedDetail.no_telepon || '',
            judul_kegiatan: selectedDetail.judul || '',
            kebutuhan: selectedDetail.kebutuhan || selectedDetail.ringkasan || '',
            lokasi_list: (() => {
                const arr = [{
                    id_ui: Date.now(),
                    provinsi: selectedDetail.provinsi || '',
                    kota_kabupaten: selectedDetail.kota_kabupaten || '',
                    kecamatan: selectedDetail.kecamatan || '',
                    kelurahan_desa: selectedDetail.kelurahan_desa || '',
                    alamat_lengkap: selectedDetail.alamat_lengkap || '',
                    latitude: selectedDetail.latitude ? Number(selectedDetail.latitude) : null,
                    longitude: selectedDetail.longitude ? Number(selectedDetail.longitude) : null,
                }];
                try {
                    const tambahanStr = (selectedDetail as any).lokasi_tambahan;
                    if (tambahanStr) {
                        const parsed = typeof tambahanStr === 'string' ? JSON.parse(tambahanStr) : tambahanStr;
                        if (Array.isArray(parsed)) {
                            parsed.forEach((loc, i) => {
                                arr.push({
                                    id_ui: Date.now() + i + 1,
                                    provinsi: loc.provinsi || '',
                                    kota_kabupaten: loc.kota_kabupaten || '',
                                    kecamatan: loc.kecamatan || '',
                                    kelurahan_desa: loc.kelurahan_desa || '',
                                    alamat_lengkap: loc.alamat_lengkap || '',
                                    latitude: loc.latitude ? Number(loc.latitude) : null,
                                    longitude: loc.longitude ? Number(loc.longitude) : null,
                                });
                            });
                        }
                    }
                } catch { }
                return arr;
            })(),
            tgl_mulai: selectedDetail.tgl_mulai || null,
            tgl_selesai: selectedDetail.tgl_selesai || null,
            is_tahun_saja: !!selectedDetail.is_tahun_saja,
            tim_dosen: [''],
            tim_staff: [''],
            tim_mahasiswa: [''],
            rab_items: selectedDetail.rab_items && selectedDetail.rab_items.length > 0
                ? (selectedDetail.rab_items as RabItem[])
                : [{ nama_item: '', jumlah: 1, harga: 0, total: 0 }],
            dana_perguruan_tinggi: Number(selectedDetail.dana_perguruan_tinggi) || 0,
            dana_pemerintah: Number(selectedDetail.dana_pemerintah) || 0,
            dana_lembaga_dalam: Number(selectedDetail.dana_lembaga_dalam) || 0,
            dana_lembaga_luar: Number(selectedDetail.dana_lembaga_luar) || 0,
            surat_permohonan: null,
            surat_proposal: null,
            existing_surat_permohonan: selectedDetail.surat_permohonan,
            existing_surat_proposal: selectedDetail.proposal,
            link_tambahan: parsedLinks,
            sumber_dana: selectedDetail.sumber_dana ? selectedDetail.sumber_dana.split(',').map(s => s.trim()) : [],
        };

        if (selectedDetail.tim_kegiatan) {
            const dosen = selectedDetail.tim_kegiatan.filter(t => t.peran === 'Dosen').map(t => t.nama);
            const staff = selectedDetail.tim_kegiatan.filter(t => t.peran === 'Staff').map(t => t.nama);
            const mahasiswa = selectedDetail.tim_kegiatan.filter(t => t.peran === 'Mahasiswa').map(t => t.nama);
            if (dosen.length) mappedData.tim_dosen = dosen;
            if (staff.length) mappedData.tim_staff = staff;
            if (mahasiswa.length) mappedData.tim_mahasiswa = mahasiswa;
        }

        setData(mappedData);
        setSelectedDetail(null);
        setMainTab('pengajuan');
        onUpdateSubmissionStatus?.('belum_diajukan');
    };

    const getFullUrl = (path: string | null | undefined) => {
        if (!path) return '';
        if (path.startsWith('blob:') || path.startsWith('http')) return path;
        const origin = window.location.origin;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${origin}${cleanPath}`;
    };

    const renderDetailModal = () => {
        if (!selectedDetail) return null;
        const style = getSubmissionStatusStyle(selectedDetail.status);

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
                <div className="absolute inset-0" onClick={() => setSelectedDetail(null)}></div>
                <div
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[90vh] relative z-10 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Modern & Sleek */}
                    <div className="relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative px-6 py-6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                                    <i className="fa-solid fa-file-invoice text-xl text-white"></i>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
                                            #{selectedDetail.kode_unik || selectedDetail.id}
                                        </span>
                                        <span 
                                            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                                            style={{ backgroundColor: style.bg, color: style.color, borderColor: `${style.color}30` }}
                                        >
                                            {style.label}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white leading-tight truncate max-w-[200px] sm:max-w-[300px]">{selectedDetail.judul}</h3>
                                    <p className="text-white/60 text-[10px] font-medium">Diajukan {selectedDetail.tanggal}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDetail(null)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 shrink-0"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Content Area: Single Column Vertical Flow */}
                    <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 text-[13px]">
                        <div className="space-y-7">
                            
                            {/* Section: Submitter Info */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-poltekpar-primary border border-blue-100">
                                        <i className="fa-solid fa-user-tie text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Informasi Pengusul</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ketua Pengusul</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedDetail.nama_pengusul || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kategori PKM</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedDetail.jenis_pkm || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                            <p className="text-sm font-bold text-slate-900 truncate">{selectedDetail.email_pengusul || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                                            <div className="flex items-center gap-2">
                                                <i className="fa-brands fa-whatsapp text-green-500"></i>
                                                <p className="text-sm font-bold text-slate-900">{selectedDetail.no_telepon || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Tim Pelaksana */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                                        <i className="fa-solid fa-users text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tim Pelaksana</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    {selectedDetail.tim_kegiatan && selectedDetail.tim_kegiatan.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedDetail.tim_kegiatan.map((t, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0 font-bold text-xs uppercase">
                                                        {t.nama.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-900 truncate">{t.nama}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-poltekpar-primary/10 text-poltekpar-primary">
                                                                {t.peran}
                                                            </span>
                                                            {t.institusi && <span className="text-[9px] text-slate-400 truncate max-w-[80px]">{t.institusi}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-4">Belum ada tim yang didaftarkan</p>
                                    )}
                                </div>
                            </section>

                            {/* Section: RAB */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                        <i className="fa-solid fa-receipt text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Rencana Anggaran Biaya</h4>
                                </div>
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50/80 border-b border-slate-100">
                                            <tr>
                                                <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Keterangan Item</th>
                                                <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Biaya</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(() => {
                                                const rab = (selectedDetail as any).rab_items || [];
                                                if (Array.isArray(rab) && rab.length > 0) {
                                                    return rab.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <p className="font-bold text-slate-700">{item.nama_item}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{item.jumlah} Unit x Rp {Number(item.harga).toLocaleString()}</p>
                                                            </td>
                                                            <td className="px-5 py-3 text-right font-black text-slate-900">
                                                                Rp {Number(item.total).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ));
                                                }
                                                return <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-300 italic">Data RAB tidak tersedia</td></tr>;
                                            })()}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50">
                                            <tr className="border-t-2 border-slate-100">
                                                <td className="px-5 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Total Anggaran</td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="px-3 py-1.5 bg-poltekpar-primary text-white text-sm font-black rounded-xl shadow-lg shadow-poltekpar-primary/20">
                                                        Rp {Number(selectedDetail.total_anggaran || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </section>

                            {/* Section: Sumber Dana */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
                                        <i className="fa-solid fa-hand-holding-dollar text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Sumber Dana</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal PT</span>
                                        <span className="text-[11px] font-black text-slate-900">Rp {Number(selectedDetail.dana_perguruan_tinggi || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemerintah</span>
                                        <span className="text-[11px] font-black text-slate-900">Rp {Number(selectedDetail.dana_pemerintah || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lembaga DN</span>
                                        <span className="text-[11px] font-black text-slate-900">Rp {Number(selectedDetail.dana_lembaga_dalam || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lembaga LN</span>
                                        <span className="text-[11px] font-black text-slate-900">Rp {Number(selectedDetail.dana_lembaga_luar || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Locations */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                        <i className="fa-solid fa-map-pin text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lokasi Kegiatan</h4>
                                </div>
                                <div className="space-y-4">
                                    {/* Primary Location (Lokasi 1) */}
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI 1</div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                                {[selectedDetail.kelurahan_desa, selectedDetail.kecamatan, selectedDetail.kota_kabupaten, selectedDetail.provinsi].filter(Boolean).join(', ') || '-'}
                                            </p>
                                            <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                                <i className="fa-solid fa-location-dot text-emerald-400 text-[10px] mt-1 group-hover:animate-bounce"></i>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{selectedDetail.alamat_lengkap || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Locations (Lokasi 2, 3, etc.) */}
                                    {(() => {
                                        try {
                                            const tambahan = (selectedDetail as any).lokasi_tambahan;
                                            if (!tambahan) return null;
                                            const parsed = typeof tambahan === 'string' ? JSON.parse(tambahan) : tambahan;
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.map((loc, i) => (
                                                    <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                                        <div className="absolute top-0 right-0 px-3 py-1 bg-slate-400 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI {i + 2}</div>
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                                                {[loc.kelurahan_desa, loc.kecamatan, loc.kota_kabupaten, loc.provinsi].filter(Boolean).join(', ') || '-'}
                                                            </p>
                                                            <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                                                <i className="fa-solid fa-location-dot text-slate-300 text-[10px] mt-1 group-hover:text-emerald-400 transition-colors"></i>
                                                                <p className="text-[10px] text-slate-400 leading-relaxed truncate">{loc.alamat_lengkap || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            }
                                        } catch (e) { }
                                        return null;
                                    })()}
                                </div>
                            </section>

                            {/* Section: Documents */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                        <i className="fa-solid fa-folder-open text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Berkas Lampiran</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedDetail.surat_permohonan && (
                                        <a href={getFullUrl(selectedDetail.surat_permohonan)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-poltekpar-primary group transition-all border border-slate-100 hover:border-poltekpar-primary shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-poltekpar-primary group-hover:scale-110 transition-transform shadow-sm">
                                                    <i className="fa-solid fa-file-pdf text-lg"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">Surat</p>
                                                    <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Wajib</p>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                        </a>
                                    )}
                                    {selectedDetail.proposal && (
                                        <a href={getFullUrl(selectedDetail.proposal)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-sky-600 group transition-all border border-slate-100 hover:border-sky-600 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform shadow-sm">
                                                    <i className="fa-solid fa-file-contract text-lg"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">Proposal</p>
                                                    <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Utama</p>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                        </a>
                                    )}
                                    {(() => {
                                        try {
                                            const rab = (selectedDetail as any).rab;
                                            const parsed = rab ? (typeof rab === 'string' ? JSON.parse(rab) : rab) : [];
                                            if (Array.isArray(parsed)) {
                                                return parsed.map((link, i) => (
                                                    <a key={i} href={getFullUrl(link.url)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-600 group transition-all border border-slate-100 hover:border-indigo-600 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                                                <i className="fa-solid fa-link text-lg"></i>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">{link.name || link.label || `Tautan ${i + 1}`}</p>
                                                                <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Eksternal</p>
                                                            </div>
                                                        </div>
                                                        <i className="fa-solid fa-external-link text-slate-300 group-hover:text-white mr-1 text-[10px]"></i>
                                                    </a>
                                                ));
                                            }
                                        } catch (e) { }
                                        return null;
                                    })()}
                                </div>
                            </section>

                            {/* Section: Catatan Admin (If any) */}
                            {selectedDetail.catatan && (
                                <section className="animate-in slide-in-from-bottom-2">
                                    <div className="bg-amber-50 border-2 border-amber-100/50 p-5 rounded-3xl relative overflow-hidden group">
                                        <div className="absolute right-[-10px] top-[-10px] text-amber-200/20 text-6xl group-hover:scale-110 transition-transform">
                                            <i className="fa-solid fa-quote-right"></i>
                                        </div>
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-700 shrink-0">
                                                <i className="fa-solid fa-comment-dots text-sm"></i>
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mb-1">Catatan Admin</h5>
                                                <p className="text-sm text-amber-900 font-bold italic leading-relaxed">{selectedDetail.catatan}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Footer: Action Bar */}
                    <div className="px-8 py-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-end gap-4 shrink-0">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {selectedDetail.status === 'direvisi' && (
                                <button
                                    onClick={handleEditPengajuan}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-poltekpar-primary text-white text-xs font-black rounded-xl hover:bg-poltekpar-navy transition-all shadow-lg shadow-poltekpar-primary/20 flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i> EDIT PENGAJUAN
                                </button>
                            )}
                            {['diterima', 'berlangsung', 'selesai'].includes(selectedDetail.status) && (
                                <a target="_blank" rel="noopener noreferrer" href={`/kumpul-arsip/${selectedDetail.kode_unik || selectedDetail.id}`} className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-folder-open"></i> KUMPUL ARSIP
                                </a>
                            )}
                            <button 
                                onClick={() => setSelectedDetail(null)} 
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all"
                            >
                                TUTUP
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStatusLogModal = () => {
        if (!selectedStatusLog) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
                <div className="absolute inset-0" onClick={() => setSelectedStatusLog(null)}></div>
                <div
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh] relative z-10 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                        <div className="px-8 py-6 text-white relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <i className="fa-solid fa-clock-rotate-left text-xl text-white"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">Lacak Status</h3>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 line-clamp-1">{selectedStatusLog.judul}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStatusLog(null)}
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                        {selectedStatusLog.logs && selectedStatusLog.logs.length > 0 ? (
                            <div className="space-y-0 pl-1">
                                {selectedStatusLog.logs.map((log, i) => {
                                    const stBaru = getSubmissionStatusStyle(log.status_baru);
                                    const stLama = log.status_lama ? getSubmissionStatusStyle(log.status_lama) : null;
                                    const isLast = i === (selectedStatusLog.logs?.length || 0) - 1;

                                    return (
                                        <div key={log.id} className="flex gap-6 pb-8 relative last:pb-0 group">
                                            {!isLast && (
                                                <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-slate-200 to-transparent group-hover:from-poltekpar-primary/30 transition-colors" />
                                            )}
                                            <div className="relative">
                                                <div
                                                    className="w-5 h-5 rounded-full shrink-0 mt-1 border-4 border-white z-10 shadow-sm relative group-hover:scale-125 transition-transform"
                                                    style={{ backgroundColor: stBaru.color }}
                                                />
                                                {i === 0 && (
                                                    <div className="absolute inset-[-4px] rounded-full bg-poltekpar-primary/10 animate-ping opacity-20" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 -mt-0.5">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    {stLama && (
                                                        <span
                                                            className="text-[9px] font-black px-2 py-0.5 rounded-md border border-slate-100 bg-white text-slate-400 uppercase tracking-wider"
                                                        >
                                                            {stLama.label}
                                                        </span>
                                                    )}
                                                    {stLama && <i className="fa-solid fa-arrow-right text-slate-300 text-[8px]"></i>}
                                                    <span
                                                        className="text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border uppercase tracking-wider"
                                                        style={{ backgroundColor: stBaru.bg, color: stBaru.color, borderColor: `${stBaru.color}20` }}
                                                    >
                                                        {stBaru.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                    <i className="fa-regular fa-calendar-check text-[10px]"></i>
                                                    <p className="text-[11px] font-bold">{log.created_at}</p>
                                                </div>
                                                {log.catatan && (
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3 relative overflow-hidden group/note hover:border-poltekpar-primary/20 transition-colors">
                                                        <div className="absolute right-[-10px] top-[-10px] text-slate-50 text-4xl group-hover/note:text-poltekpar-primary/5 transition-colors">
                                                            <i className="fa-solid fa-quote-right"></i>
                                                        </div>
                                                        <i className="fa-solid fa-comment-dots text-slate-200 mt-1 text-xs shrink-0 relative z-10"></i>
                                                        <p className="text-[12px] text-slate-600 font-medium leading-relaxed relative z-10">{log.catatan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-200 mb-4 border-4 border-white shadow-inner">
                                    <i className="fa-solid fa-timeline text-4xl"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Belum Ada Riwayat</h4>
                                <p className="text-xs text-slate-400 mt-1">Status pengajuan Anda saat ini sedang dalam antrean.</p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-5 bg-white border-t border-slate-100 shrink-0 flex justify-center">
                        <button
                            onClick={() => setSelectedStatusLog(null)}
                            className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 border border-slate-200/50 uppercase tracking-widest"
                        >
                            Selesai & Tutup
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderArchiveTab = () => (
        <div className="p-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <button type="button" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors" onClick={() => setExpandedHubSections(p => ({ ...p, kegiatan: !p.kegiatan }))}>
                    <h4 className="text-sm font-bold text-slate-900">Daftar Kegiatan</h4>
                    <i className={`fa-solid fa-chevron-${expandedHubSections.kegiatan ? 'up' : 'down'} text-slate-400`}></i>
                </button>
                {expandedHubSections.kegiatan && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {pkmListData.map(a => (
                            <div key={a.id} className="p-4">
                                <strong className="text-sm font-semibold text-slate-900 block">{a.nama}</strong>
                                <p className="text-xs text-slate-500">{a.tahun} • {a.kabupaten}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );


    const renderSubmissionForm = () => (
        <div className="p-4 space-y-6">
            {/* Notifikasi Catatan Revisi */}
            {editSubmission && editSubmission.status === 'direvisi' && editSubmission.catatan && (
                <div className="bg-amber-50 border-2 border-amber-200/50 rounded-2xl p-5 flex gap-4 items-start shadow-sm animate-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black text-amber-800 uppercase tracking-wider mb-1">Catatan Revisi dari Admin</h4>
                        <p className="text-sm text-amber-700 leading-relaxed font-bold italic">"{editSubmission.catatan}"</p>
                        <p className="text-[10px] text-amber-600/70 mt-2 font-bold uppercase tracking-widest">Silakan perbaiki data usulan Anda sesuai dengan catatan tersebut.</p>
                    </div>
                </div>
            )}

            {/* Informasi Ketua */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">Informasi Ketua Pengusul</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input type="text" value={data.nama_ketua} onChange={e => setData('nama_ketua', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Nama lengkap & gelar" required />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Instansi</label>
                        <input type="text" value={data.instansi} onChange={e => setData('instansi', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Email <span className="text-red-500">*</span></label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="email@contoh.com" required />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">No. WhatsApp <span className="text-red-500">*</span></label>
                        <input type="tel" value={data.whatsapp} onChange={e => setData('whatsapp', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="08xxxxxxxxxx" required />
                    </div>
                </div>
            </div>

            {/* Judul & Kebutuhan */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">Detail Kegiatan</h4>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">Jenis PKM</label>
                            <select value={data.id_jenis_pkm} onChange={e => setData('id_jenis_pkm', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary">
                                <option value="">-- Pilih Jenis PKM --</option>
                                {jenisPkmOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Judul Kegiatan PKM <span className="text-red-500">*</span></label>
                        <textarea value={data.judul_kegiatan} onChange={e => setData('judul_kegiatan', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[60px]" placeholder="Masukkan judul kegiatan pengabdian masyarakat..." required />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kebutuhan / Deskripsi Singkat <span className="text-red-500">*</span></label>
                        <textarea value={data.kebutuhan} onChange={e => setData('kebutuhan', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[140px]" placeholder="Jelaskan secara singkat kebutuhan atau tujuan utama kegiatan ini..." required />
                    </div>
                </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">Lokasi Kegiatan PKM</h4>

                <div className="space-y-6">
                    {data.lokasi_list.map((lokasi, idx) => (
                        <div key={lokasi.id_ui} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
                            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleLocationCollapse(lokasi.id_ui)}>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {data.lokasi_list.length > 1 ? `Lokasi Kegiatan ${idx + 1}` : 'Lokasi Kegiatan'} {lokasi.kota_kabupaten ? ` - ${lokasi.kota_kabupaten}` : ''}
                                </span>
                                <div className="flex items-center gap-2">
                                    {idx > 0 && (
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setData('lokasi_list', data.lokasi_list.filter((_, i) => i !== idx)); }} className="w-8 h-8 flex justify-center items-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    )}
                                    <button type="button" className="w-8 h-8 flex justify-center items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow-sm">
                                        <i className={`fa-solid fa-chevron-${collapsedLocations[lokasi.id_ui] ? 'down' : 'up'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {!collapsedLocations[lokasi.id_ui] && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">Provinsi</label>
                                            <input type="text" value={lokasi.provinsi} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].provinsi = e.target.value; setData('lokasi_list', newList); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Provinsi" />
                                        </div>
                                        <div>
                                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kota/Kabupaten</label>
                                            <input type="text" value={lokasi.kota_kabupaten} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kota_kabupaten = e.target.value; setData('lokasi_list', newList); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kota/Kabupaten" />
                                        </div>
                                        <div>
                                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kecamatan</label>
                                            <input type="text" value={lokasi.kecamatan} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kecamatan = e.target.value; setData('lokasi_list', newList); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kecamatan" />
                                        </div>
                                        <div>
                                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kelurahan/Desa</label>
                                            <input type="text" value={lokasi.kelurahan_desa} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kelurahan_desa = e.target.value; setData('lokasi_list', newList); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kelurahan/Desa" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Alamat Lengkap</label>
                                        <textarea value={lokasi.alamat_lengkap} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].alamat_lengkap = e.target.value; setData('lokasi_list', newList); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[60px]" placeholder="Alamat lengkap lokasi kegiatan..." />
                                    </div>
                                    <div className="space-y-1.5 mt-4">
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Tandai Lokasi di Peta (Koordinat)</label>
                                        <p className="text-[10px] text-slate-500 mb-2">Geser peta atau klik untuk menandai lokasi spesifik agar mempermudah tim survei.</p>
                                        <MapLocationPicker
                                            latitude={lokasi.latitude}
                                            longitude={lokasi.longitude}
                                            onChange={(lat, lng, address) => {
                                                const newList = [...data.lokasi_list];
                                                newList[idx].latitude = lat;
                                                newList[idx].longitude = lng;
                                                if (address) {
                                                    if (address.state || address.province) newList[idx].provinsi = address.state || address.province;
                                                    if (address.city || address.town || address.county) newList[idx].kota_kabupaten = address.city || address.town || address.county;
                                                    if (address.suburb || address.village) newList[idx].kecamatan = address.suburb || address.village;
                                                    if (address.neighbourhood || address.residential || address.hamlet) newList[idx].kelurahan_desa = address.neighbourhood || address.residential || address.hamlet;
                                                }
                                                setData('lokasi_list', newList);
                                            }}
                                        />
                                        {formatCoordinate(lokasi.latitude) && formatCoordinate(lokasi.longitude) ? (
                                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Lat: {formatCoordinate(lokasi.latitude)}, Lng: {formatCoordinate(lokasi.longitude)}</p>
                                        ) : lokasi.kelurahan_desa ? (
                                            <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse flex items-center gap-1">
                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                                Nama desa terisi namun titik peta belum ditandai. Mohon tandai di peta!
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={() => setData('lokasi_list', [...data.lokasi_list, { id_ui: Date.now(), provinsi: '', kota_kabupaten: '', kecamatan: '', kelurahan_desa: '', alamat_lengkap: '', latitude: null, longitude: null }])} className="w-full py-3 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary rounded-xl text-sm font-bold border border-poltekpar-primary/20 hover:border-poltekpar-primary transition-all flex justify-center items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Tambah Lokasi Lainnya
                    </button>
                </div>
            </div>

            {/* Tim */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">Tim Pelaksana</h4>
                {
                    (['tim_dosen', 'tim_staff', 'tim_mahasiswa'] as const).map(type => (
                        <div key={type}>
                            <label className="text-[13px] font-bold text-slate-600 mb-1 block">
                                {type === 'tim_dosen' ? 'Dosen Terlibat' : type === 'tim_staff' ? 'Staf Terlibat' : 'Mahasiswa Terlibat'}
                            </label>
                            {data[type].map((member, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input type="text" list={type === 'tim_dosen' ? 'dosen-suggestions' : type === 'tim_staff' ? 'staff-suggestions' : undefined} value={member} onChange={e => handleMemberChange(type, idx, e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder={`Nama ${type === 'tim_dosen' ? 'dosen' : type === 'tim_staff' ? 'staf' : 'mahasiswa'}...`} />
                                    {data[type].length > 1 && (
                                        <button type="button" onClick={() => handleRemoveMember(type, idx)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => handleAddMember(type)} className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70">
                                <i className="fa-solid fa-plus"></i> Tambah
                            </button>
                        </div>
                    ))
                }
            </div>

            {/* RAB */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Rencana Anggaran Biaya (RAB)</h4>
                {
                    data.rab_items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                                <label className="text-[12px] font-bold text-slate-500 mb-1 block">Nama Item</label>
                                <input type="text" value={item.nama_item} onChange={e => handleRabChange(idx, 'nama_item', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Item..." />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[12px] font-bold text-slate-500 mb-1 block">Jumlah</label>
                                <input type="number" value={item.jumlah} onChange={e => handleRabChange(idx, 'jumlah', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" min={1} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[12px] font-bold text-slate-500 mb-1 block">Harga</label>
                                <input type="number" value={item.harga || ''} onChange={e => handleRabChange(idx, 'harga', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" min={0} placeholder="0" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[12px] font-bold text-slate-500 mb-1 block">Total</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 border border-slate-100">
                                    Rp {item.total.toLocaleString('id-ID')}
                                </div>
                            </div>
                            <div className="col-span-1">
                                {data.rab_items.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveRab(idx)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                }
                <div className="flex items-center justify-between">
                    <button type="button" onClick={handleAddRab} className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70">
                        <i className="fa-solid fa-plus"></i> Tambah Item
                    </button>
                    <div className="text-sm font-bold text-poltekpar-primary">
                        Total RAB: Rp {totalRAB.toLocaleString('id-ID')}
                    </div>
                </div>
            </div>

            {/* Sumber Dana */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">Sumber Dana</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { label: 'Perguruan Tinggi', key: 'dana_perguruan_tinggi' },
                        { label: 'Pemerintah', key: 'dana_pemerintah' },
                        { label: 'Lembaga Dalam Negeri', key: 'dana_lembaga_dalam' },
                        { label: 'Lembaga Luar Negeri', key: 'dana_lembaga_luar' },
                    ].map(option => (
                        <div key={option.key} className="px-4 py-3 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-poltekpar-primary/20 transition-all">
                            <label className="text-[13px] font-bold text-slate-600 mb-1.5 block">{option.label}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={(data[option.key as keyof FormData] as number) || ''}
                                    onChange={e => setData(option.key as any, e.target.value ? Number(e.target.value) : 0)}
                                    className="w-full pl-8 pr-3 py-2 bg-transparent rounded-lg text-sm font-semibold outline-none text-slate-900 placeholder-slate-400"
                                    placeholder="0"
                                    min={0}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dokumen */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">
                    <i className="fa-solid fa-link text-poltekpar-primary"></i> Dokumen & Tautan
                </h4>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">Surat Permohonan <span className="text-red-500">*</span></label>
                            <a href="/template/surat_permohonan" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5"><i className="fa-solid fa-download"></i> Download Template Surat Permohonan</a>
                        </div>
                        {data.existing_surat_permohonan && (
                            <a href={data.existing_surat_permohonan} target="_blank" className="flex items-center gap-2 p-2 bg-blue-50/50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                                <i className="fa-solid fa-file-pdf"></i> File Saat Ini (Biarkan kosong jika tidak diubah)
                            </a>
                        )}
                        <input type="file" accept=".pdf" onChange={e => setData('surat_permohonan', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary" required={!data.kode_pengajuan} />
                        {data.surat_permohonan && data.surat_permohonan instanceof File && data.surat_permohonan.type === 'application/pdf' && (
                            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden h-64 bg-slate-50 relative shadow-inner">
                                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded-md opacity-50 z-10">Preview</span>
                                <object data={URL.createObjectURL(data.surat_permohonan)} type="application/pdf" className="w-full h-full relative z-20">
                                    <div className="flex items-center justify-center h-full text-xs text-slate-400">Browser tidak mendukung preview PDF secara instan.</div>
                                </object>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">Proposal {data.kode_pengajuan ? '(Biarkan kosong jika tetap)' : '(Wajib)'} {!data.kode_pengajuan && <span className="text-red-500">*</span>}</label>
                            <a href="/template/proposal" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5"><i className="fa-solid fa-download"></i> Download Template Proposal</a>
                        </div>
                        {data.existing_surat_proposal && (
                            <a href={data.existing_surat_proposal} target="_blank" className="flex items-center gap-2 p-2 bg-blue-50/50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                                <i className="fa-solid fa-file-pdf"></i> File Saat Ini (Biarkan kosong jika tidak diubah)
                            </a>
                        )}
                        <input type="file" accept=".pdf" onChange={e => setData('surat_proposal', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary" required={!data.kode_pengajuan} />
                        {data.surat_proposal && data.surat_proposal instanceof File && data.surat_proposal.type === 'application/pdf' && (
                            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden h-64 bg-slate-50 relative shadow-inner">
                                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded-md opacity-50 z-10">Preview</span>
                                <object data={URL.createObjectURL(data.surat_proposal)} type="application/pdf" className="w-full h-full relative z-20">
                                    <div className="flex items-center justify-center h-full text-xs text-slate-400">Browser tidak mendukung preview PDF.</div>
                                </object>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Link Tambahan (Drive, Bukti lain...)</label>
                            <button type="button" onClick={handleAddLink} className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70">
                                <i className="fa-solid fa-plus"></i> Tambah
                            </button>
                        </div>
                        {data.link_tambahan.map((link, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-start">
                                <div className="flex-1 flex flex-col md:flex-row gap-2">
                                    <input type="text" value={link.name} onChange={e => handleLinkChange(idx, 'name', e.target.value)} className="w-full md:w-1/3 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Nama Tautan" />
                                    <input type="url" value={link.url} onChange={e => handleLinkChange(idx, 'url', e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="https://..." />
                                </div>
                                {data.link_tambahan.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveLink(idx)} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div >

            {/* Submit */}
            <div className="pt-2">
                <button type="submit" disabled={isMockSubmitting} className="w-full py-3 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy text-white font-bold rounded-xl shadow-lg shadow-poltekpar-primary/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2">
                    {isMockSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
            </div>
        </div>
    );

    if (onlyShowStatus) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari judul pengajuan..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary transition-all bg-slate-50/50"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                    className="flex bg-white hover:bg-slate-50 transition-colors border border-slate-200 rounded-xl items-center shadow-sm overflow-hidden group w-full sm:w-[220px]"
                                >
                                    <div className="pl-3.5 pr-1.5 py-2 text-slate-400 group-hover:text-poltekpar-primary transition-colors flex items-center justify-center">
                                        <i className="fa-solid fa-filter text-xs"></i>
                                    </div>
                                    <div className="flex-1 text-left py-2 pl-1.5 text-[11px] font-bold text-slate-700 truncate">
                                        {sortOption === 'default' ? 'Prioritas (Revisi & Diproses)' :
                                            sortOption === 'status' ? 'Berdasarkan Status' :
                                                sortOption === 'waktu_terbaru' ? 'Waktu (Terbaru)' : 'Waktu (Terlama)'}
                                    </div>
                                    <div className={`pr-3.5 text-slate-400 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}>
                                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                                    </div>
                                </button>

                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)}></div>
                                        <div className="absolute top-11 right-0 w-full sm:w-[220px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button onClick={() => { setSortOption('default'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors ${sortOption === 'default' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-star text-amber-400 mr-2 opacity-70"></i>Prioritas (Revisi & Diproses)</button>
                                            <button onClick={() => { setSortOption('status'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'status' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-list-check text-indigo-400 mr-2 opacity-70"></i>Berdasarkan Status</button>
                                            <button onClick={() => { setSortOption('waktu_terbaru'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'waktu_terbaru' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-regular fa-clock text-sky-400 mr-2 opacity-70"></i>Waktu (Terbaru)</button>
                                            <button onClick={() => { setSortOption('waktu_terlama'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'waktu_terlama' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-clock-rotate-left text-slate-400 mr-2 opacity-70"></i>Waktu (Terlama)</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Nama Pengajuan</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Tanggal</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map(item => {
                                        const style = getSubmissionStatusStyle(item.status);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5 text-left">
                                                    <strong className="text-[14px] font-bold text-slate-900 block group-hover:text-poltekpar-primary transition-colors text-left">{item.judul}</strong>
                                                    <span className="text-[11px] text-slate-400 font-medium line-clamp-1 text-left">{item.ringkasan}</span>
                                                </td>
                                                <td className="px-6 py-5 text-[13px] text-slate-600 font-medium whitespace-nowrap text-left">{item.tanggal}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                                            <i className={`fa-solid ${style.icon} text-[9px]`}></i>{style.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button type="button" className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5" onClick={() => setSelectedDetail(item)}>
                                                            <i className="fa-solid fa-circle-info text-[9px]"></i> DETAIL
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="px-4 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                                                            onClick={() => setSelectedStatusLog(item)}
                                                        >
                                                            <i className="fa-solid fa-clock-rotate-left text-[9px]"></i> LACAK STATUS
                                                        </button>
                                                        {item.status === 'direvisi' && (
                                                            <button
                                                                type="button"
                                                                className="px-4 py-1.5 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                                                                onClick={() => router.visit(`/pengajuan?edit=${item.kode_unik ?? item.id}`)}
                                                            >
                                                                <i className="fa-solid fa-pen-to-square text-[9px]"></i> EDIT
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-bold italic">
                                            <div className="flex flex-col items-center gap-3">
                                                <i className="fa-solid fa-folder-open text-4xl text-slate-200"></i>
                                                {searchValue ? `Tidak ditemukan hasil untuk "${searchValue}"` : 'Belum ada riwayat pengajuan.'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="sm:hidden space-y-4">
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map(item => {
                                const style = getSubmissionStatusStyle(item.status);
                                return (
                                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight">{item.judul}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                                                    <i className="fa-solid fa-calendar text-[9px]"></i> {item.tanggal}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shrink-0 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                                <i className={`fa-solid ${style.icon} text-[8px]`}></i>{style.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl active:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                                onClick={() => setSelectedDetail(item)}
                                            >
                                                <i className="fa-solid fa-circle-info text-[10px]"></i> DETAIL
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-2 bg-sky-50 text-sky-600 text-xs font-bold rounded-xl active:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                                                onClick={() => setSelectedStatusLog(item)}
                                            >
                                                <i className="fa-solid fa-clock-rotate-left text-[10px]"></i> LACAK
                                            </button>
                                            {item.status === 'direvisi' && (
                                                <button
                                                    type="button"
                                                    className="flex-1 py-2 bg-poltekpar-primary text-white text-xs font-bold rounded-xl active:bg-poltekpar-navy transition-colors flex items-center justify-center gap-2"
                                                    onClick={() => router.visit(`/pengajuan?edit=${item.kode_unik ?? item.id}`)}
                                                >
                                                    <i className="fa-solid fa-pen-to-square text-[10px]"></i> EDIT
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-slate-400 text-xs font-bold italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <i className="fa-solid fa-folder-open text-3xl text-slate-200 mb-2 block"></i>
                                {searchValue ? `Tidak ditemukan hasil untuk "${searchValue}"` : 'Belum ada riwayat pengajuan.'}
                            </div>
                        )}
                    </div>

                    {/* Pagination Links */}
                    {pagination && pagination.links.length > 3 && (
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {pagination.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                                        link.active 
                                            ? 'bg-poltekpar-primary text-white border-poltekpar-primary shadow-md' 
                                            : !link.url 
                                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-poltekpar-primary hover:text-poltekpar-primary'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
                {renderDetailModal()}
                {renderStatusLogModal()}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-md"><i className="fa-solid fa-file-signature text-lg"></i></div>
                <div><h3 className="text-base font-bold text-slate-900">Form Pengajuan PKM Dosen</h3><p className="text-sm text-slate-500 mt-0.5">Silakan lengkapi data usulan pengabdian</p></div>
            </div>
            {!hideMainTabNav && (
                <div className="flex border-b border-slate-100">
                    <button type="button" onClick={() => setMainTab('pengajuan')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === 'pengajuan' ? 'text-poltekpar-primary border-b-2 border-poltekpar-primary' : 'text-slate-500 hover:text-slate-700'}`}>Pengajuan</button>
                    <button type="button" onClick={() => setMainTab('arsip')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === 'arsip' ? 'text-poltekpar-primary border-b-2 border-poltekpar-primary' : 'text-slate-500 hover:text-slate-700'}`}>Arsip</button>
                </div>
            )}
            {!hideMainTabNav && mainTab === 'arsip' ? renderArchiveTab() : (
                <form onSubmit={handleSubmit}>
                    {renderSubmissionForm()}
                </form>
            )}

            <datalist id="dosen-suggestions">
                {pegawaiOptions.dosen.map((name, i) => <option key={`d-${i}`} value={name} />)}
            </datalist>
            <datalist id="staff-suggestions">
                {pegawaiOptions.staff.map((name, i) => <option key={`s-${i}`} value={name} />)}
            </datalist>

            <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
            {renderDetailModal()}
            {renderStatusLogModal()}
        </div>
    );
}
