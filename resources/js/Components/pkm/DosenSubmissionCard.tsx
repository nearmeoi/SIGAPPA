import React, { useRef, useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import ActionFeedbackDialog from '@/Components/ui/ActionFeedbackDialog';
import MapLocationPicker from '@/Components/map/MapLocationPicker';
import DocumentationGallery from '@/Components/pkm/DocumentationGallery';
import TestimonialSidebarDisplay from '@/Components/testimonial/TestimonialSidebarDisplay';
import type { PkmData, Submission, RabItem } from '@/types';

import RabTable from './form/RabTable';
import TeamList from './form/TeamList';
import LocationList from './form/LocationList';
import DocumentSection from './form/DocumentSection';
import SubmissionDetailModal from './SubmissionDetailModal';
import SubmissionStatusLogModal from './SubmissionStatusLogModal';

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
            <LocationList
                lokasiList={data.lokasi_list}
                collapsedLocations={collapsedLocations}
                toggleLocationCollapse={toggleLocationCollapse}
                onUpdateLocation={(idx, newLoc) => {
                    const newList = [...data.lokasi_list];
                    newList[idx] = newLoc;
                    setData('lokasi_list', newList);
                }}
                onAddLocation={() => setData('lokasi_list', [...data.lokasi_list, { id_ui: Date.now(), provinsi: '', kota_kabupaten: '', kecamatan: '', kelurahan_desa: '', alamat_lengkap: '', latitude: null, longitude: null }])}
                onRemoveLocation={(idx) => setData('lokasi_list', data.lokasi_list.filter((_, i) => i !== idx))}
                formatCoordinate={formatCoordinate}
            />

            {/* Tim */}
            <TeamList
                timDosen={data.tim_dosen}
                timStaff={data.tim_staff}
                timMahasiswa={data.tim_mahasiswa}
                onAdd={handleAddMember}
                onRemove={handleRemoveMember}
                onChange={handleMemberChange}
            />

            {/* RAB */}
            <RabTable
                items={data.rab_items}
                onAdd={handleAddRab}
                onRemove={handleRemoveRab}
                onChange={handleRabChange}
                totalRAB={totalRAB}
            />

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
            <DocumentSection
                kodePengajuan={data.kode_pengajuan}
                suratPermohonan={data.surat_permohonan}
                suratProposal={data.surat_proposal}
                existingSuratPermohonan={data.existing_surat_permohonan}
                existingSuratProposal={data.existing_surat_proposal}
                linkTambahan={data.link_tambahan}
                onChangeFile={(field, file) => setData(field, file)}
                onAddLink={handleAddLink}
                onRemoveLink={handleRemoveLink}
                onChangeLink={handleLinkChange}
            />

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
                <SubmissionDetailModal 
                    selectedDetail={selectedDetail} 
                    onClose={() => setSelectedDetail(null)} 
                    onEdit={handleEditPengajuan} 
                    getFullUrl={getFullUrl} 
                    getSubmissionStatusStyle={getSubmissionStatusStyle} 
                />
                <SubmissionStatusLogModal 
                    selectedStatusLog={selectedStatusLog} 
                    onClose={() => setSelectedStatusLog(null)} 
                    getSubmissionStatusStyle={getSubmissionStatusStyle} 
                />
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
            <SubmissionDetailModal 
                selectedDetail={selectedDetail} 
                onClose={() => setSelectedDetail(null)} 
                onEdit={handleEditPengajuan} 
                getFullUrl={getFullUrl} 
                getSubmissionStatusStyle={getSubmissionStatusStyle} 
            />
            <SubmissionStatusLogModal 
                selectedStatusLog={selectedStatusLog} 
                onClose={() => setSelectedStatusLog(null)} 
                getSubmissionStatusStyle={getSubmissionStatusStyle} 
            />
        </div>
    );
}
