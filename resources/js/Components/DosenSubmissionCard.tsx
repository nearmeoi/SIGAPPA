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
    tim_kegiatan?: { nama: string; peran: string }[];
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
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    kelurahan_desa: string;
    alamat_lengkap: string;
    latitude: number | null;
    longitude: number | null;
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
}: DosenSubmissionCardProps) {
    const [mainTab, setMainTab] = useState('pengajuan');
    const [expandedHubSections, setExpandedHubSections] = useState({ kegiatan: false, riwayat: false });
    const [expandedActivityId, setExpandedActivityId] = useState<number | null>(pkmListData[0]?.id ?? null);
    const [selectedDetail, setSelectedDetail] = useState<Submission | null>(null);
    const [isMockSubmitting, setIsMockSubmitting] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ show: false, type: 'success', title: '', message: '' });
    const [pegawaiOptions, setPegawaiOptions] = useState<{ dosen: string[], staff: string[] }>({ dosen: [], staff: [] });
    const [sortOption, setSortOption] = useState<'default' | 'status' | 'waktu_terbaru' | 'waktu_terlama'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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
        provinsi: '',
        kota_kabupaten: '',
        kecamatan: '',
        kelurahan_desa: '',
        alamat_lengkap: '',
        latitude: null,
        longitude: null,
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
        } catch {}

        const mappedData: FormData = {
            kode_pengajuan: editSubmission.kode_unik ?? null,
            id_jenis_pkm: jenisPkmOptions.find(o => o.label === editSubmission.jenis_pkm)?.value || jenisPkmOptions?.[0]?.value || '',
            nama_ketua: editSubmission.nama_pengusul || '',
            instansi: editSubmission.instansi_mitra || 'Politeknik Pariwisata Makassar',
            email: editSubmission.email_pengusul || '',
            whatsapp: editSubmission.no_telepon || '',
            judul_kegiatan: editSubmission.judul || '',
            kebutuhan: editSubmission.kebutuhan || editSubmission.ringkasan || '',
            provinsi: editSubmission.provinsi || '',
            kota_kabupaten: editSubmission.kota_kabupaten || '',
            kecamatan: editSubmission.kecamatan || '',
            kelurahan_desa: editSubmission.kelurahan_desa || '',
            alamat_lengkap: editSubmission.alamat_lengkap || '',
            latitude: editSubmission.latitude ? Number(editSubmission.latitude) : null,
            longitude: editSubmission.longitude ? Number(editSubmission.longitude) : null,
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
        if (!data.judul_kegiatan.trim()) {
            setFeedbackDialog({ show: true, type: 'error', title: 'Form Belum Lengkap', message: 'Mohon isi judul kegiatan PKM.' });
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
            provinsi: data.provinsi,
            kota_kabupaten: data.kota_kabupaten,
            kecamatan: data.kecamatan,
            kelurahan_desa: data.kelurahan_desa,
            alamat_lengkap: data.alamat_lengkap,
            latitude: data.latitude,
            longitude: data.longitude,
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
                    ringkasan: `Lokasi: ${data.kota_kabupaten} • Ketua: ${data.nama_ketua}`,
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
        } catch {}

        const mappedData: FormData = {
            kode_pengajuan: selectedDetail.kode_unik ?? null,
            id_jenis_pkm: jenisPkmOptions.find(o => o.label === selectedDetail.jenis_pkm)?.value || jenisPkmOptions?.[0]?.value || '',
            nama_ketua: selectedDetail.nama_pengusul || '',
            instansi: selectedDetail.instansi_mitra || 'Politeknik Pariwisata Makassar',
            email: selectedDetail.email_pengusul || '',
            whatsapp: selectedDetail.no_telepon || '',
            judul_kegiatan: selectedDetail.judul || '',
            kebutuhan: selectedDetail.kebutuhan || selectedDetail.ringkasan || '',
            provinsi: selectedDetail.provinsi || '',
            kota_kabupaten: selectedDetail.kota_kabupaten || '',
            kecamatan: selectedDetail.kecamatan || '',
            kelurahan_desa: selectedDetail.kelurahan_desa || '',
            alamat_lengkap: selectedDetail.alamat_lengkap || '',
            latitude: selectedDetail.latitude ? Number(selectedDetail.latitude) : null,
            longitude: selectedDetail.longitude ? Number(selectedDetail.longitude) : null,
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

    const renderDetailModal = () => {
        if (!selectedDetail) return null;
        const style = getSubmissionStatusStyle(selectedDetail.status);

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="absolute inset-0" onClick={() => setSelectedDetail(null)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-poltekpar-primary text-white flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-file-invoice text-lg"></i>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{selectedDetail.judul}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{selectedDetail.tanggal}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col items-center p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Pengajuan</span>
                            <div className="px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                <i className={`fa-solid ${style.icon}`}></i>
                                {style.label}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <section>
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Umum</h4>
                                <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100/60">
                                    <p><span className="text-slate-500">Nama Pengusul:</span> <span className="text-slate-900 font-semibold">{selectedDetail.nama_pengusul || '-'}</span></p>
                                    <p><span className="text-slate-500">Kategori:</span> <span className="text-slate-900 font-semibold">{selectedDetail.jenis_pkm || '-'}</span></p>
                                    <p><span className="text-slate-500">Instansi:</span> <span className="text-slate-900 font-semibold">{selectedDetail.instansi_mitra || '-'}</span></p>
                                    <p><span className="text-slate-500">Email:</span> <span className="text-slate-900 font-semibold">{selectedDetail.email_pengusul || '-'}</span></p>
                                    <p><span className="text-slate-500">WhatsApp:</span> <span className="text-slate-900 font-semibold">{selectedDetail.no_telepon || '-'}</span></p>
                                </div>
                            </section>

                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kebutuhan PKM</h4>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed italic">
                                        "{selectedDetail.kebutuhan || selectedDetail.ringkasan || '-'}"
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lokasi PKM</h4>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                        {selectedDetail.alamat_lengkap && <p className="mb-1">{selectedDetail.alamat_lengkap}</p>}
                                        <p>{[selectedDetail.kelurahan_desa, selectedDetail.kecamatan, selectedDetail.kota_kabupaten, selectedDetail.provinsi].filter(Boolean).join(', ')}</p>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tim Pelaksana</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 space-y-2">
                                        {selectedDetail.tim_kegiatan && selectedDetail.tim_kegiatan.length > 0 ? (
                                            selectedDetail.tim_kegiatan.filter(t => t.peran !== 'Ketua/Dosen Pengusul').map((t, i) => (
                                                <div key={i} className="flex flex-col mb-1.5 pb-1.5 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                                                    <span className="text-slate-900 font-semibold text-sm">{t.nama}</span>
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.peran === 'Dosen' ? 'Dosen Terlibat' : t.peran === 'Staff' ? 'Staf Terlibat' : 'Mahasiswa Terlibat'}</span>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-slate-400 italic">Data tim belum diatur.</p>}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Anggaran & Sumber Dana</h4>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100/60">
                                        <div className="p-2.5 bg-blue-50/50 rounded-lg flex justify-between items-center border border-blue-100/50">
                                            <span className="text-[10px] font-bold text-blue-700 uppercase">Total RAB</span>
                                            <span className="text-sm font-black text-poltekpar-primary">Rp {Number(selectedDetail.total_anggaran || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        {selectedDetail.rab_items && selectedDetail.rab_items.length > 0 && (
                                            <div className="pt-2 text-sm border-t border-slate-100/50">
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Rincian Komponen RAB</span>
                                                <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                                                    {selectedDetail.rab_items.map((item, i) => (
                                                        <li key={i}><span className="font-semibold">{item.nama_item}</span> ({item.jumlah} &times; Rp {Number(item.harga||0).toLocaleString('id-ID')}) <br/><span className="font-bold text-poltekpar-primary">Rp {Number(item.total||0).toLocaleString('id-ID')}</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-slate-100/50 space-y-1.5">
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 block">Sumber Dana</span>
                                            {(selectedDetail.dana_perguruan_tinggi || selectedDetail.dana_pemerintah || selectedDetail.dana_lembaga_dalam || selectedDetail.dana_lembaga_luar) ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedDetail.dana_perguruan_tinggi ? <div className="p-2 bg-white rounded-lg border border-slate-100"><span className="text-[9px] font-bold text-slate-400 uppercase block">Perguruan Tinggi</span><span className="text-xs font-bold text-slate-800">Rp {Number(selectedDetail.dana_perguruan_tinggi).toLocaleString('id-ID')}</span></div> : null}
                                                    {selectedDetail.dana_pemerintah ? <div className="p-2 bg-white rounded-lg border border-slate-100"><span className="text-[9px] font-bold text-slate-400 uppercase block">Pemerintah</span><span className="text-xs font-bold text-slate-800">Rp {Number(selectedDetail.dana_pemerintah).toLocaleString('id-ID')}</span></div> : null}
                                                    {selectedDetail.dana_lembaga_dalam ? <div className="p-2 bg-white rounded-lg border border-slate-100"><span className="text-[9px] font-bold text-slate-400 uppercase block">Lembaga Dalam Negeri</span><span className="text-xs font-bold text-slate-800">Rp {Number(selectedDetail.dana_lembaga_dalam).toLocaleString('id-ID')}</span></div> : null}
                                                    {selectedDetail.dana_lembaga_luar ? <div className="p-2 bg-white rounded-lg border border-slate-100"><span className="text-[9px] font-bold text-slate-400 uppercase block">Lembaga Luar Negeri</span><span className="text-xs font-bold text-slate-800">Rp {Number(selectedDetail.dana_lembaga_luar).toLocaleString('id-ID')}</span></div> : null}
                                                </div>
                                            ) : <p className="text-xs text-slate-400 italic">Belum ada data sumber dana.</p>}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dokumen & Tautan</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 flex flex-col gap-3">
                                        <div className="flex flex-col gap-2">
                                            {selectedDetail.surat_permohonan ? (
                                                <a href={selectedDetail.surat_permohonan} target="_blank" className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-colors border border-slate-200 shadow-sm">
                                                    <i className="fa-solid fa-file-contract text-poltekpar-primary w-4 text-center"></i> SURAT PERMOHONAN
                                                </a>
                                            ) : <span className="text-xs text-slate-400 flex items-center gap-1.5"><i className="fa-solid fa-triangle-exclamation"></i> Kosong</span>}
                                            {selectedDetail.proposal && (
                                                <a href={selectedDetail.proposal} target="_blank" className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-colors border border-slate-200 shadow-sm">
                                                    <i className="fa-solid fa-file-pdf text-poltekpar-primary w-4 text-center"></i> PROPOSAL
                                                </a>
                                            )}
                                        </div>
                                        {selectedDetail.rab && (
                                            <div className="space-y-2 pt-2 border-t border-slate-200">
                                                {(() => {
                                                    try {
                                                        const arr = JSON.parse(selectedDetail.rab);
                                                        if (Array.isArray(arr)) {
                                                            return arr.map((item, i) => (
                                                                <p key={i} className="text-[12px] bg-white p-2 rounded-lg border border-slate-100">
                                                                    <span className="text-slate-500 font-bold text-[10px] uppercase block mb-0.5">{item.name || `Tautan Tambahan ${i + 1}`}: </span>
                                                                    <a href={item.url} target="_blank" className="text-poltekpar-primary font-medium hover:underline break-all">{item.url}</a>
                                                                </p>
                                                            ));
                                                        }
                                                    } catch(e) {}
                                                    
                                                    return selectedDetail.rab.split(',').map((link, i) => {
                                                        const url = link.trim();
                                                        if (!url) return null;
                                                        return (
                                                            <p key={i} className="text-[12px] bg-white p-2 rounded-lg border border-slate-100">
                                                                <span className="text-slate-500 font-bold text-[10px] uppercase block mb-0.5">Tautan Tambahan {i + 1}: </span>
                                                                <a href={url} target="_blank" className="text-poltekpar-primary font-medium hover:underline break-all">{url}</a>
                                                            </p>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                        {selectedDetail.catatan && (
                            <section>
                                <h4 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-comment-dots"></i> Catatan Admin
                                </h4>
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <p className="text-sm text-amber-800 italic leading-relaxed">{selectedDetail.catatan}</p>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                        {selectedDetail.status === 'direvisi' && (
                            <button
                                onClick={() => {
                                    setSelectedDetail(null);
                                    router.visit(`/pengajuan?edit=${selectedDetail.kode_unik ?? selectedDetail.id}`);
                                }}
                                className="px-6 py-2 bg-poltekpar-primary text-white text-sm font-bold rounded-xl hover:bg-poltekpar-primary/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <i className="fa-solid fa-pen-to-square"></i> Edit Pengajuan
                            </button>
                        )}
                        {['diterima', 'berlangsung', 'selesai'].includes(selectedDetail.status) && (
                            <a target="_blank" rel="noopener noreferrer" href={`/kumpul-arsip/${selectedDetail.kode_unik || selectedDetail.id}`} className="px-6 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2">
                                <i className="fa-solid fa-folder-open"></i> Kumpul Arsip Laporan
                            </a>
                        )}
                        <button onClick={() => setSelectedDetail(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Tutup</button>
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
                            <div key={a.id} className="p-4"><strong className="text-sm font-semibold text-slate-900 block">{a.nama}</strong><p className="text-xs text-slate-500">{a.tahun} • {a.kabupaten}</p></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderSubmissionForm = () => (
        <div className="p-5 space-y-6">
            {/* Informasi Ketua */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Informasi Ketua Pengusul</h4>
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
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Detail Kegiatan</h4>
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
                        <textarea value={data.kebutuhan} onChange={e => setData('kebutuhan', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[80px]" placeholder="Jelaskan secara singkat kebutuhan atau tujuan utama kegiatan ini..." required />
                    </div>
                </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Lokasi Kegiatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Provinsi</label>
                        <input type="text" value={data.provinsi} onChange={e => setData('provinsi', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Provinsi" />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kota/Kabupaten</label>
                        <input type="text" value={data.kota_kabupaten} onChange={e => setData('kota_kabupaten', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kota/Kabupaten" />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kecamatan</label>
                        <input type="text" value={data.kecamatan} onChange={e => setData('kecamatan', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kecamatan" />
                    </div>
                    <div>
                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kelurahan/Desa</label>
                        <input type="text" value={data.kelurahan_desa} onChange={e => setData('kelurahan_desa', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary" placeholder="Kelurahan/Desa" />
                    </div>
                </div>
                <div>
                    <label className="text-[13px] font-bold text-slate-600 mb-1 block">Alamat Lengkap</label>
                    <textarea value={data.alamat_lengkap} onChange={e => setData('alamat_lengkap', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[60px]" placeholder="Alamat lengkap lokasi kegiatan..." />
                </div>
                <div className="space-y-1.5 mt-4">
                    <label className="text-[13px] font-bold text-slate-600 mb-1 block">Tandai Lokasi di Peta (Koordinat)</label>
                    <p className="text-[10px] text-slate-500 mb-2">Geser peta atau klik untuk menandai lokasi spesifik agar mempermudah tim survei.</p>
                    <MapLocationPicker
                        latitude={data.latitude}
                        longitude={data.longitude}
                        onChange={(lat, lng, address) => {
                            const newData: any = { latitude: lat, longitude: lng };
                            if (address) {
                                if (address.state || address.province) newData.provinsi = address.state || address.province;
                                if (address.city || address.town || address.county) newData.kota_kabupaten = address.city || address.town || address.county;
                                if (address.suburb || address.village) newData.kecamatan = address.suburb || address.village;
                                if (address.neighbourhood || address.residential || address.hamlet) newData.kelurahan_desa = address.neighbourhood || address.residential || address.hamlet;
                            }
                            Object.entries(newData).forEach(([key, val]) => setData(key as any, val as any));
                        }}
                    />
                    {formatCoordinate(data.latitude) && formatCoordinate(data.longitude) ? (
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">Lat: {formatCoordinate(data.latitude)}, Lng: {formatCoordinate(data.longitude)}</p>
                    ) : data.kelurahan_desa ? (
                        <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse flex items-center gap-1">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            Nama desa terisi namun titik peta belum ditandai. Mohon tandai di peta!
                        </p>
                    ) : null}
                </div>
            </div>

            {/* Tim */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Tim Pelaksana</h4>
                {(['tim_dosen', 'tim_staff', 'tim_mahasiswa'] as const).map(type => (
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
                ))}
            </div>

            {/* RAB */}
            <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Rencana Anggaran Biaya (RAB)</h4>
                {data.rab_items.map((item, idx) => (
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
                ))}
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
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Sumber Dana</h4>
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
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
            </div>

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
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900 border-l-4 border-poltekpar-primary pl-3">Daftar Riwayat Pengajuan</h3>
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
                    <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Nama Pengajuan</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Tanggal</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
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
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button type="button" className="px-4 py-1.5 bg-slate-100 hover:bg-poltekpar-primary hover:text-white text-slate-600 text-[11px] font-bold rounded-lg transition-all" onClick={() => setSelectedDetail(item)}>DETAIL</button>
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
                                                Belum ada riwayat pengajuan.
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
                                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl active:bg-slate-100 transition-colors"
                                                onClick={() => setSelectedDetail(item)}
                                            >
                                                DETAIL
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
                                Belum ada riwayat pengajuan.
                            </div>
                        )}
                    </div>
                </div>
                <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
                {renderDetailModal()}
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
        </div>
    );
}
