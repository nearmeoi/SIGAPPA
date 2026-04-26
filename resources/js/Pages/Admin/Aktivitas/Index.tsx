import React, { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Search, Calendar, MapPin,
    Download, Mail, X, Check, Loader2, Send, Eye, Trash2
} from 'lucide-react';

interface AktivitasItem {
    id_aktivitas: number;
    status_pelaksanaan: string;
    created_at?: string;
    pengajuan?: {
        judul_kegiatan: string;
        tgl_mulai?: string;
        tgl_selesai?: string;
        provinsi?: string;
        kota_kabupaten?: string;
        nama_pengusul?: string;
        email_pengusul?: string;
        user?: { name: string; email?: string };
        jenis_pkm?: { nama_jenis: string };
    };
}

interface PaginatedData {
    data: AktivitasItem[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    listAktivitas: PaginatedData;
    filters?: { sort?: string; direction?: string; status?: string; tahun?: string; jenis_pkm?: string };
    availableYears?: number[];
    listJenisPkm?: { id_jenis_pkm: number; nama_jenis: string; warna_icon: string }[];
}

const getRecipientName = (act: AktivitasItem): string =>
    act.pengajuan?.nama_pengusul || act.pengajuan?.user?.name || '-';

const getRecipientEmail = (act: AktivitasItem): string =>
    act.pengajuan?.email_pengusul || act.pengajuan?.user?.email || '';

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Akan ditentukan';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'belum_mulai', label: 'Belum Mulai' },
    { value: 'berjalan', label: 'Berjalan' },
    { value: 'selesai', label: 'Selesai' },
];

const normalizeStatusPelaksanaan = (status: string): string =>
    status === 'persiapan' ? 'belum_mulai' : status;

const canSendUndangan = (act: AktivitasItem): boolean => {
    const normalizedStatus = normalizeStatusPelaksanaan(act.status_pelaksanaan);
    return normalizedStatus === 'belum_mulai' && getRecipientEmail(act).includes('@');
};

const AktivitasPage: React.FC<Props> = ({ listAktivitas, filters, availableYears = [], listJenisPkm = [] }) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState(filters?.status || '');
    const [tahun, setTahun] = useState(filters?.tahun || '');
    const [filterJenisPkm, setFilterJenisPkm] = useState(filters?.jenis_pkm || '');
    const [sortField, setSortField] = useState(filters?.sort || 'created_at');
    const [sortDir, setSortDir] = useState(filters?.direction || 'desc');

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showUndangan, setShowUndangan] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [undanganSubject, setUndanganSubject] = useState('');
    const [undanganBody, setUndanganBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const data = listAktivitas.data || [];
    const firstSelected = data.find(a => selectedIds.includes(a.id_aktivitas));

    const buildDefaultSubject = useCallback((): string => {
        const judul = firstSelected?.pengajuan?.judul_kegiatan || 'Kegiatan PKM';
        return `Undangan: ${judul}`;
    }, [firstSelected]);

    const buildDefaultBody = useCallback((): string => {
        const p = firstSelected?.pengajuan;
        const tglMulai = formatDate(p?.tgl_mulai);
        const tglSelesai = formatDate(p?.tgl_selesai);
        const lokasiParts = [p?.kota_kabupaten, p?.provinsi].filter(Boolean);
        const lokasi = lokasiParts.length > 0 ? lokasiParts.join(', ') : 'Akan ditentukan';

        return `Dengan hormat,

Kami mengundang Bapak/Ibu untuk menghadiri kegiatan Program Kreativitas Masyarakat (PKM) yang akan dilaksanakan pada:

Tanggal: ${tglMulai} s/d ${tglSelesai}
Lokasi: ${lokasi}

Mohon kehadiran dan persiapan Bapak/Ibu sebelum tanggal pelaksanaan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

Hormat kami,
Tim SIGAPPA
Politeknik Pariwisata Makassar`;
    }, [firstSelected]);

    const openUndanganModal = useCallback(() => {
        setUndanganSubject(buildDefaultSubject());
        setUndanganBody(buildDefaultBody());
        setShowUndangan(true);
    }, [buildDefaultSubject, buildDefaultBody]);

    const applyFilters = useCallback((newSortField?: string, newSortDir?: string, newTahun?: string, newJenisPkm?: string) => {
        const params: Record<string, string> = {
            sort: newSortField !== undefined ? newSortField : sortField,
            direction: newSortDir !== undefined ? newSortDir : sortDir,
        };
        if (filterStatus) params.status = filterStatus;
        if (newTahun !== undefined ? newTahun : tahun) params.tahun = newTahun !== undefined ? newTahun : tahun;
        const resolvedJenisPkm = newJenisPkm !== undefined ? newJenisPkm : filterJenisPkm;
        if (resolvedJenisPkm) params.jenis_pkm = resolvedJenisPkm;
        router.get('/admin/aktivitas', params, { preserveState: true, replace: true });
    }, [filterStatus, sortField, sortDir, tahun, filterJenisPkm]);

    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        applyFilters(field, newDir);
    };

    const handleStatusChange = (newStatus: string) => {
        setFilterStatus(newStatus);
        const params: Record<string, string> = { sort: sortField, direction: sortDir };
        if (newStatus) params.status = newStatus;
        if (tahun) params.tahun = tahun;
        if (filterJenisPkm) params.jenis_pkm = filterJenisPkm;
        router.get('/admin/aktivitas', params, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setFilterStatus('');
        setTahun('');
        setFilterJenisPkm('');
        router.get('/admin/aktivitas', { sort: sortField, direction: sortDir }, { preserveState: true, replace: true });
    };

    const hasFilters = filterStatus || tahun || filterJenisPkm;

    const handleExport = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterStatus) params.set('status', filterStatus);
        if (tahun) params.set('tahun', tahun);
        if (filterJenisPkm) params.set('jenis_pkm', filterJenisPkm);
        window.location.href = `/admin/aktivitas/export?${params.toString()}`;
    };

    const allIdsOnPage = data.map(a => a.id_aktivitas);
    const allChecked = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedIds.includes(id));

    const toggleAll = () => {
        if (allChecked) {
            setSelectedIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...allIdsOnPage])]);
        }
    };

    const toggleOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const undanganRecipients = data.filter(
        a => selectedIds.includes(a.id_aktivitas)
    );

    const recipientsWithEmail = undanganRecipients.filter(canSendUndangan);

    const handleSendUndangan = () => {
        if (recipientsWithEmail.length === 0) return;
        setIsSending(true);

        router.post('/admin/aktivitas/send-undangan', {
            ids: recipientsWithEmail.map(a => a.id_aktivitas),
            subject: undanganSubject,
            body: undanganBody,
        }, {
            preserveState: true,
            onFinish: () => {
                setIsSending(false);
                setShowUndangan(false);
                setShowPreview(false);
                setSelectedIds([]);
            },
        });
    };

    const handleBulkDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} aktivitas terpilih?`)) {
            router.delete('/admin/aktivitas/bulk', {
                data: { ids: selectedIds },
                onSuccess: () => setSelectedIds([]),
                preserveState: true,
            });
        }
    };

    return (
        <AdminLayout title="">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Aktivitas</h1>
                    <p className="text-[14px] text-zinc-500 mt-1">Pantau seluruh status pelaksanaan kegiatan PKM.</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 w-full">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg overflow-x-auto max-w-full">
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleStatusChange(opt.value)}
                                className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap overflow-hidden ${
                                    filterStatus === opt.value
                                        ? 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Cari kegiatan..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="bg-white border border-zinc-200 rounded-md py-2 pl-9 pr-4 text-[13px] text-zinc-700 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 outline-none w-56 shadow-sm transition-all"
                            />
                        </div>

                        <select
                            value={tahun}
                            onChange={e => {
                                setTahun(e.target.value);
                                applyFilters(sortField, sortDir, e.target.value);
                            }}
                            className="bg-white border border-zinc-200 rounded-md py-2 px-3 text-[13px] text-zinc-700 outline-none shadow-sm cursor-pointer min-w-[120px]"
                        >
                            <option value="">Semua Tahun</option>
                            {(availableYears || []).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select
                            value={filterJenisPkm}
                            onChange={e => {
                                setFilterJenisPkm(e.target.value);
                                applyFilters(sortField, sortDir, tahun, e.target.value);
                            }}
                            className="bg-white border border-zinc-200 rounded-md py-2 px-3 text-[13px] text-zinc-700 outline-none shadow-sm cursor-pointer min-w-[140px]"
                        >
                            <option value="">Semua Jenis PKM</option>
                            {(listJenisPkm || []).map(j => (
                                <option key={j.id_jenis_pkm} value={j.id_jenis_pkm}>{j.nama_jenis}</option>
                            ))}
                        </select>

                        {hasFilters && (
                            <button onClick={clearFilters} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors" title="Hapus filter">
                                <X size={14} />
                            </button>
                        )}

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 shadow-sm rounded-md text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[13px] text-indigo-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                    </div>
                    <span className="font-bold">{selectedIds.length} item dipilih</span>
                    <span className="text-indigo-300">|</span>
                    
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-[12px] font-bold hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={13} /> Hapus Terpilih
                    </button>

                    {recipientsWithEmail.length > 0 && (
                        <button
                            onClick={openUndanganModal}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 transition-all hover:shadow-md active:scale-95"
                        >
                            <Mail size={13} /> Kirim Undangan ({recipientsWithEmail.length})
                        </button>
                    )}
                    <button
                        onClick={() => setSelectedIds([])}
                        className="ml-auto px-2 py-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Hapus semua pilihan"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50/50">
                                <th className="py-3 px-4 w-12">
                                    <button
                                        onClick={toggleAll}
                                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110"
                                        style={{
                                            borderColor: allChecked ? '#4f46e5' : '#d4d4d8',
                                            backgroundColor: allChecked ? '#4f46e5' : 'transparent',
                                        }}
                                        title="Pilih semua"
                                    >
                                        {allChecked && <Check size={12} className="text-white" />}
                                    </button>
                                </th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-12 border-r border-zinc-100 bg-zinc-50 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('id_aktivitas')}>
                                    No {sortField === 'id_aktivitas' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('created_at')}>
                                    Nama Kegiatan {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Jenis & Lokasi</th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-right w-32 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('status_pelaksanaan')}>
                                    Status {sortField === 'status_pelaksanaan' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-400 text-[14px]">
                                        {hasFilters ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Belum ada aktivitas.'}
                                    </td>
                                </tr>
                            ) : data.map((act) => {
                                const normalizedStatus = normalizeStatusPelaksanaan(act.status_pelaksanaan);
                                const checked = selectedIds.includes(act.id_aktivitas);
                                return (
                                    <tr
                                        key={act.id_aktivitas}
                                        className={`hover:bg-zinc-50/50 transition-colors group cursor-pointer ${checked ? 'bg-indigo-50/40' : ''}`}
                                        onClick={() => window.location.href = `/admin/aktivitas/${act.id_aktivitas}`}
                                    >
                                        <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleOne(act.id_aktivitas)}
                                                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110"
                                                style={{
                                                    borderColor: checked ? '#4f46e5' : '#d4d4d8',
                                                    backgroundColor: checked ? '#4f46e5' : 'transparent',
                                                }}
                                            >
                                                {checked && <Check size={12} className="text-white" />}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-zinc-500 text-[13px] font-mono border-r border-zinc-100 bg-zinc-50/30">
                                            {((listAktivitas.current_page - 1) * listAktivitas.per_page + data.indexOf(act) + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <a href={`/admin/aktivitas/${act.id_aktivitas}`} className="font-semibold text-zinc-900 text-[14px] group-hover:text-indigo-600 transition-colors block">
                                                {act.pengajuan?.judul_kegiatan || '-'}
                                            </a>
                                            <div className="flex items-center gap-1.5 text-zinc-500 text-[12px] mt-1.5">
                                                <Calendar size={13} className="text-zinc-400" />
                                                {act.pengajuan?.tgl_mulai ? new Date(act.pengajuan.tgl_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'TBD'}
                                                {' – '}
                                                {act.pengajuan?.tgl_selesai ? new Date(act.pengajuan.tgl_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-zinc-700 text-[13px] mb-1">
                                                {act.pengajuan?.jenis_pkm?.nama_jenis || 'General / Lainnya'}
                                            </div>
                                            <div className="flex items-center gap-1 text-zinc-500 text-[12px]">
                                                <MapPin size={12} className="text-zinc-400" />
                                                {act.pengajuan?.kota_kabupaten ? `${act.pengajuan.kota_kabupaten}, ${act.pengajuan.provinsi}` : 'Lokasi TBD'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                                                normalizedStatus === 'selesai'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : normalizedStatus === 'belum_mulai'
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    normalizedStatus === 'selesai' ? 'bg-emerald-500'
                                                    : normalizedStatus === 'belum_mulai' ? 'bg-slate-400'
                                                    : 'bg-amber-500'
                                                }`}></span>
                                                {normalizedStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {listAktivitas.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50/50">
                        <div className="text-[12px] font-medium text-zinc-500">
                            Menampilkan {(listAktivitas.current_page - 1) * listAktivitas.per_page + 1}
                            –{Math.min(listAktivitas.current_page * listAktivitas.per_page, listAktivitas.total)}
                            {' '}dari {listAktivitas.total} items
                        </div>
                        <div className="flex items-center gap-1">
                            {listAktivitas.links.map((link, i) => {
                                const isFirst = i === 0;
                                const isLast = i === listAktivitas.links.length - 1;
                                return (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-medium transition-colors shadow-sm focus:outline-none disabled:cursor-not-allowed ${link.active
                                            ? 'bg-zinc-900 text-white'
                                            : 'border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:opacity-40'
                                            }`}
                                    >
                                        {isFirst ? '‹' : isLast ? '›' : link.label.replace('&laquo;', '‹').replace('&raquo;', '›').replace('&hellip;', '…')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ════════ Undangan Modal ════════ */}
            {showUndangan && !showPreview && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => !isSending && setShowUndangan(false)} />

                    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden" style={{ animation: 'slideUp 0.25s ease-out' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                                    <Mail size={14} />
                                </div>
                                <span className="text-[14px] font-bold">Kirim Undangan</span>
                                <span className="text-[11px] bg-white/15 rounded-md px-2 py-0.5 font-medium">{recipientsWithEmail.length} penerima</span>
                            </div>
                            <button onClick={() => !isSending && setShowUndangan(false)} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Recipients */}
                        <div className="flex items-start gap-2 px-5 py-3 border-b border-zinc-100 max-h-[120px] overflow-y-auto">
                            <span className="text-[12px] text-zinc-400 mt-1 w-14 shrink-0 font-medium">Kepada</span>
                            <div className="flex flex-wrap gap-1.5 flex-1">
                                {recipientsWithEmail.map(a => (
                                    <span key={a.id_aktivitas} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-semibold border border-indigo-100">
                                        <span className="truncate max-w-[140px]">{getRecipientName(a)}</span>
                                        <span className="text-indigo-400 text-[10px] truncate max-w-[120px]">({getRecipientEmail(a)})</span>
                                        <button onClick={() => toggleOne(a.id_aktivitas)} className="hover:text-red-500 ml-0.5 shrink-0">
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {undanganRecipients.length > recipientsWithEmail.length && (
                                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        {undanganRecipients.length - recipientsWithEmail.length} tidak eligible
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-100">
                            <span className="text-[12px] text-zinc-400 w-14 shrink-0 font-medium">Subjek</span>
                            <input
                                type="text"
                                value={undanganSubject}
                                onChange={e => setUndanganSubject(e.target.value)}
                                className="flex-1 text-[13px] text-zinc-800 font-medium outline-none placeholder-zinc-300"
                                placeholder="Tulis subjek email..."
                            />
                        </div>

                        {/* Body */}
                        <textarea
                            value={undanganBody}
                            onChange={e => setUndanganBody(e.target.value)}
                            className="px-5 py-4 text-[13px] text-zinc-700 outline-none resize-none min-h-[180px] placeholder-zinc-300 leading-relaxed"
                            placeholder="Tulis isi undangan..."
                        />

                        {/* Actions */}
                        <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-t border-zinc-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors font-medium"
                                >
                                    <Eye size={13} /> Preview
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowUndangan(false)}
                                    disabled={isSending}
                                    className="px-4 py-2 text-[12px] text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors font-medium disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSendUndangan}
                                    disabled={isSending || recipientsWithEmail.length === 0 || !undanganSubject.trim() || !undanganBody.trim()}
                                    className="px-5 py-2 text-[12px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" /> Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={13} /> Kirim Undangan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ════════ Preview Modal ════════ */}
            {showPreview && (
                <>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowPreview(false)} />

                    <div className="fixed inset-4 sm:inset-8 z-50 bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden" style={{ animation: 'slideUp 0.25s ease-out' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                                    <Eye size={14} />
                                </div>
                                <span className="text-[14px] font-bold">Preview Email</span>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-y-auto bg-zinc-100 p-4 sm:p-8">
                            <div className="max-w-[600px] mx-auto bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                                {/* Email Header */}
                                <div className="bg-gradient-to-br from-[#0D1F3C] via-[#15325F] to-[#1E4A8C] px-8 py-8 text-center">
                                    <div className="inline-block bg-[rgba(220,175,103,0.15)] border border-[rgba(220,175,103,0.35)] rounded-full px-4 py-1.5 mb-4">
                                        <span className="text-[10px] font-bold text-[#DCAF67] tracking-[2.5px] uppercase">Politeknik Pariwisata Makassar</span>
                                    </div>
                                    <img src="https://poltekparmakassar.ac.id/storage/2020/10/Group-41.png" alt="Logo" className="h-[48px] w-auto mx-auto my-4 block" />
                                    <h1 className="text-[28px] font-extrabold text-white tracking-tight">SIGAPPA</h1>
                                    <p className="text-[11px] text-white/50 mt-2">Sistem Informasi Geospasial & Akses Pelayanan PKM</p>
                                    <div className="w-10 h-[3px] bg-[#DCAF67] rounded-full mx-auto mt-4 opacity-70"></div>
                                </div>

                                {/* Tag */}
                                <div className="bg-[#F5E5BC] border-b border-[#e8d09a] px-8 py-3 text-center">
                                    <span className="text-[11px] font-bold text-[#8a6420] tracking-[2px] uppercase">&#9993; Surat Undangan Kegiatan PKM</span>
                                </div>

                                {/* Body */}
                                <div className="px-8 py-8">
                                    <p className="text-[17px] font-bold text-[#0D1F3C] mb-4">Yth. {recipientsWithEmail.map(getRecipientName).join(', ')},</p>
                                    <p className="text-[14px] text-[#475569] leading-[1.8] mb-7">
                                        Dengan hormat, kami mengundang Bapak/Ibu untuk hadir dalam kegiatan Program Kreativitas Masyarakat (PKM) yang akan dilaksanakan dengan rincian sebagai berikut:
                                    </p>

                                    {/* Detail Card */}
                                    <div className="bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7] border border-[#E2E8F0] border-l-4 border-l-[#15325F] rounded-xl p-6 mb-7">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-[6px] h-[6px] bg-[#DCAF67] rounded-full"></div>
                                            <span className="text-[10px] font-bold text-[#1E4A8C] uppercase tracking-[2px]">Detail Kegiatan</span>
                                        </div>
                                        <p className="text-[16px] font-extrabold text-[#0D1F3C] mb-3">{firstSelected?.pengajuan?.judul_kegiatan || '-'}</p>
                                        {firstSelected?.pengajuan?.jenis_pkm && (
                                            <span className="inline-block bg-[#EEF2F7] border border-[#E2E8F0] rounded-md px-2.5 py-1 text-[12px] font-semibold text-[#64748B] mb-4">
                                                {firstSelected.pengajuan.jenis_pkm.nama_jenis}
                                            </span>
                                        )}
                                        <div className="border-t border-[#E2E8F0] mt-4 pt-4">
                                            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Lokasi Kegiatan</p>
                                            <p className="text-[14px] font-bold text-[#0D1F3C]">
                                                {[firstSelected?.pengajuan?.kota_kabupaten, firstSelected?.pengajuan?.provinsi].filter(Boolean).join(', ') || 'Akan ditentukan'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="bg-[#FAFAFA] border border-[#F1F5F9] rounded-xl p-5 mb-7">
                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[2px] mb-3">Pesan dari Penyelenggara</p>
                                        <p className="text-[14px] text-[#334155] leading-[1.85] whitespace-pre-wrap">{undanganBody}</p>
                                    </div>

                                    {/* CTA */}
                                    <div className="text-center mb-8">
                                        <div className="inline-block bg-gradient-to-r from-[#15325F] to-[#1E4A8C] rounded-xl px-10 py-3.5">
                                            <span className="text-[14px] font-bold text-white">Lihat Detail Kegiatan →</span>
                                        </div>
                                    </div>

                                    {/* Signature */}
                                    <div className="border-t border-[#F1F5F9] pt-6 flex items-center gap-4">
                                        <img src="https://poltekparmakassar.ac.id/storage/2020/10/Group-41.png" alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
                                        <div>
                                            <p className="text-[14px] font-bold text-[#0D1F3C]">Tim SIGAPPA</p>
                                            <p className="text-[12px] text-[#64748B]">Politeknik Pariwisata Makassar</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-[#F8FAFC] border-t border-[#F1F5F9] px-8 py-7 text-center">
                                    <p className="text-[12px] font-bold text-[#15325F] mb-1.5">
                                        SIGAPPA <span className="inline-block w-1 h-1 bg-[#DCAF67] rounded-full mx-2 align-middle"></span> Politeknik Pariwisata Makassar
                                    </p>
                                    <p className="text-[11px] text-[#94A3B8] mb-1">
                                        Dikirim pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    {recipientsWithEmail.length > 0 && (
                                        <p className="text-[11px] text-[#94A3B8] mb-3">
                                            Email ini dikirim ke <span className="text-[#64748B] font-medium">{recipientsWithEmail.map(getRecipientEmail).join(', ')}</span>
                                        </p>
                                    )}
                                    <p className="text-[11px] text-[#CBD5E1] mb-2">© {new Date().getFullYear()} Semua hak dilindungi undang-undang.</p>
                                    <p className="text-[10px] text-[#CBD5E1] leading-[1.6]">Email ini dikirim otomatis oleh sistem SIGAPPA. Mohon tidak membalas email ini.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-white border-t border-zinc-200 flex-shrink-0">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-5 py-2 text-[12px] text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors font-medium"
                            >
                                Kembali Edit
                            </button>
                            <button
                                onClick={handleSendUndangan}
                                disabled={isSending || recipientsWithEmail.length === 0}
                                className="px-5 py-2 text-[12px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" /> Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Send size={13} /> Kirim Sekarang
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </AdminLayout>
    );
};

export default AktivitasPage;
