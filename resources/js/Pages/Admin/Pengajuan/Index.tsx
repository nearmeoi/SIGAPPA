// BUILD_VERSION: 2026-04-08-STRICT-CHECK-V2
import React, { useState, useCallback } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmDialog from '@/Components/ConfirmDialog';
import {
    Filter, Search, ChevronRight, Clock, X,
    Trash2, AlertCircle, Check
} from 'lucide-react';

interface Pengajuan {
    id_pengajuan: number;
    judul_kegiatan: string;
    status_pengajuan: string;
    no_telepon?: string;
    instansi_mitra?: string;
    created_at: string;
    kebutuhan?: string;
    proposal?: string;
    surat_permohonan?: string;
    total_anggaran?: number;
    rab_items?: { nama_item?: string; jumlah?: number; harga?: number; total?: number }[];
    dana_perguruan_tinggi?: number;
    dana_pemerintah?: number;
    dana_lembaga_dalam?: number;
    dana_lembaga_luar?: number;
    sumber_dana?: string;
    nama_pengusul?: string;
    email_pengusul?: string;
    tipe_pengusul?: string;
    user?: { name: string; email: string; role?: string };
    jenis_pkm?: { nama_jenis: string };
    provinsi?: string;
    kota_kabupaten?: string;
    tim_kegiatan?: { nama_mahasiswa?: string; peran_tim?: string; pegawai?: { nama_pegawai?: string } }[];
}

interface PaginatedData {
    data: Pengajuan[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface IndexProps {
    listPengajuan: PaginatedData;
    filters: { search: string; tab: string; sort?: string; direction?: string; tahun?: string };
    availableYears: number[];
}

const STATUS_BADGE: Record<string, { label: string; text: string; bg: string; dot: string }> = {
    diproses: { label: 'Diproses', text: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-400' },
    diterima: { label: 'Diterima', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    direvisi: { label: 'Revisi', text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
    ditolak: { label: 'Ditolak', text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-400' },
};

const TABS = [
    { id: '', label: 'Semua' },
    { id: 'pengajuan', label: 'Pengajuan' },
    { id: 'reviu', label: 'Reviu' },
    { id: 'direvisi', label: 'Revisi' },
    { id: 'diterima', label: 'Diterima' },
    { id: 'ditolak', label: 'Ditolak' },
    { id: 'selesai', label: 'Selesai' },
];

const getSubmitterType = (item: Pengajuan): 'dosen' | 'masyarakat' => {
    const source = String(item.tipe_pengusul || item.user?.role || '').toLowerCase();
    return source === 'dosen' ? 'dosen' : 'masyarakat';
};

const getKetuaName = (item: Pengajuan): string => {
    const ketua = item.tim_kegiatan?.find((member) =>
        String(member.peran_tim || '').toLowerCase().includes('ketua')
    );
    return ketua?.pegawai?.nama_pegawai || ketua?.nama_mahasiswa || '';
};

const getSubmitterName = (item: Pengajuan): string =>
    item.nama_pengusul || (getSubmitterType(item) === 'dosen' ? getKetuaName(item) : '') || item.user?.name || '-';

const getSubmitterEmail = (item: Pengajuan): string =>
    item.email_pengusul || item.user?.email || '-';

const getIncompleteReasons = (item: Pengajuan): string[] => {
    const reasons: string[] = [];
    const isDosen = getSubmitterType(item) === 'dosen';

    // Helper to check if a value is effectively empty
    const isEmpty = (val: any) => {
        if (val === null || val === undefined) return true;
        const s = String(val).trim();
        return s === '' || s === '-' || s === '[]' || s === '{}' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
    };

    // Submitter Info
    const sName = getSubmitterName(item);
    const sEmail = getSubmitterEmail(item);
    if (isEmpty(sName)) reasons.push('nama pengusul');
    if (isEmpty(sEmail)) reasons.push('email pengusul');
    if (isEmpty(item.no_telepon)) reasons.push('kontak/wa');
    if (isEmpty(item.instansi_mitra)) reasons.push('instansi');

    // Common fields
    if (isEmpty(item.kebutuhan)) reasons.push(isDosen ? 'deskripsi kegiatan' : 'kebutuhan pkm');
    if (isEmpty(item.provinsi) || isEmpty(item.kota_kabupaten)) reasons.push('lokasi (provinsi/kota)');
    if (isEmpty(item.surat_permohonan)) reasons.push('surat permohonan');

    // RAB Check (Consistent with Detail page)
    const hasRabItems = Array.isArray(item.rab_items) && item.rab_items.length > 0 && item.rab_items.some((ri) =>
        !isEmpty(ri.nama_item) && Number(ri.jumlah || 0) > 0
    );
    
    // Fallback for Masyarakat who might use the link field instead of table
    const hasRabLink = !isEmpty((item as any).rab);
    
    if (!hasRabItems && !hasRabLink) reasons.push('dokumen/rincian RAB');

    // Team Check
    const tim = item.tim_kegiatan || [];
    const hasKetua = tim.some(m => !isEmpty(m.peran_tim) && String(m.peran_tim).toLowerCase().includes('ketua'));
    
    if (isDosen) {
        if (!hasKetua) reasons.push('ketua tim');
        const anggotaCount = tim.filter(m => !String(m.peran_tim || '').toLowerCase().includes('ketua')).length;
        if (anggotaCount === 0) reasons.push('anggota tim (dosen/staff/mhs)');
        
        if (isEmpty(item.judul_kegiatan)) reasons.push('judul kegiatan');
        
        const hasFunding = Number(item.dana_perguruan_tinggi || 0) > 0
            || Number(item.dana_pemerintah || 0) > 0
            || Number(item.dana_lembaga_dalam || 0) > 0
            || Number(item.dana_lembaga_luar || 0) > 0
            || (!isEmpty(item.sumber_dana));
            
        if (!hasFunding) reasons.push('sumber dana');
    }

    return reasons;
};

const Index: React.FC<IndexProps> = ({ listPengajuan, filters, availableYears }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [tab, setTab] = useState(filters.tab || '');
    const [tahun, setTahun] = useState(filters.tahun || '');
    const [sortField, setSortField] = useState(filters.sort || 'created_at');
    const [sortDir, setSortDir] = useState(filters.direction || 'desc');

    // ── Bulk Delete ──────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);

    // ── Filter helpers ─────────────────────────────────
    const applyFilters = useCallback((newSortField?: string, newSortDir?: string, newTahun?: string) => {
        setSelectedIds([]);
        setSelectAllAcrossPages(false);
        router.get('/admin/pengajuan', {
            search: search || undefined,
            tab: tab || undefined,
            tahun: newTahun !== undefined ? newTahun : (tahun || undefined),
            sort: newSortField !== undefined ? newSortField : sortField,
            direction: newSortDir !== undefined ? newSortDir : sortDir,
        }, { preserveState: true, replace: true });
    }, [search, tab, sortField, sortDir, tahun]);

    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        applyFilters(field, newDir);
    };

    const handleTabChange = (newTab: string) => {
        setTab(newTab);
        setSelectedIds([]);
        setSelectAllAcrossPages(false);
        router.get('/admin/pengajuan', {
            search: search || undefined,
            tab: newTab || undefined,
            tahun: tahun || undefined,
            sort: sortField,
            direction: sortDir,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch(''); setTab(''); setTahun(''); setSortField('created_at'); setSortDir('desc');
        setSelectedIds([]);
        setSelectAllAcrossPages(false);
        router.get('/admin/pengajuan', {}, { preserveState: true, replace: true });
    };

    const allIdsOnPage = listPengajuan.data.map(p => p.id_pengajuan);
    const allChecked = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedIds.includes(id));

    const toggleAll = () => {
        if (allChecked || selectAllAcrossPages) {
            setSelectedIds([]);
            setSelectAllAcrossPages(false);
        } else {
            setSelectedIds(allIdsOnPage);
        }
    };

    const toggleOne = (id: number) => {
        if (selectAllAcrossPages) {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
        }
    };

    const handleBulkDelete = () => {
        const count = selectAllAcrossPages ? (listPengajuan.total - selectedIds.length) : selectedIds.length;
        if (confirm(`Apakah Anda yakin ingin menghapus ${count} pengajuan terpilih?`)) {
            router.delete('/admin/pengajuan/bulk', {
                data: { 
                    ids: !selectAllAcrossPages ? selectedIds : [],
                    select_all: selectAllAcrossPages,
                    excluded_ids: selectAllAcrossPages ? selectedIds : [],
                    filters: { search, tab, tahun }
                },
                onSuccess: () => {
                    setSelectedIds([]);
                    setSelectAllAcrossPages(false);
                },
                preserveState: true,
            });
        }
    };

    const isAllPageSelected = allChecked && listPengajuan.total > listPengajuan.data.length;

    // ── Delete ──────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; judul: string } | null>(null);

    const handleDelete = (id: number, judul: string) => {
        setDeleteTarget({ id, judul });
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            router.delete(`/admin/pengajuan/${deleteTarget.id}`, {
                onSuccess: () => setDeleteTarget(null),
                onError: () => setDeleteTarget(null),
            });
        }
    };

    const hasFilters = search || tab || tahun;

    return (
        <AdminLayout title="">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Kelola Pengajuan</h1>
                    <p className="text-[14px] text-zinc-500 mt-1">Review dan kelola semua pengajuan proposal kegiatan PKM.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                                tab === t.id
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cari proposal..."
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
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    {hasFilters && (
                        <button onClick={clearFilters} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors" title="Hapus filter">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
                            <Check size={12} className="text-white" />
                        </div>
                        <span className="font-bold text-red-800">
                            {selectAllAcrossPages ? listPengajuan.total : selectedIds.length} item terpilih
                        </span>
                        <span className="text-red-300">|</span>
                        
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white border border-red-700 rounded-lg text-[12px] font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 size={13} /> Hapus Terpilih
                        </button>

                        <button
                            onClick={() => {
                                setSelectedIds([]);
                                setSelectAllAcrossPages(false);
                            }}
                            className="ml-auto px-2 py-1 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors font-medium"
                            title="Hapus semua pilihan"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {isAllPageSelected && !selectAllAcrossPages && (
                        <div className="flex items-center justify-center py-2 px-4 bg-indigo-50 border border-indigo-100 rounded-xl text-[12px] text-indigo-700 font-medium animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-indigo-400" />
                                <span>Semua <b>{selectedIds.length}</b> pengajuan di halaman ini terpilih.</span>
                                <button 
                                    onClick={() => setSelectAllAcrossPages(true)}
                                    className="px-2 py-1 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Pilih semua {listPengajuan.total} pengajuan
                                </button>
                            </div>
                        </div>
                    )}

                    {selectAllAcrossPages && (
                        <div className="flex items-center justify-center py-2 px-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[12px] text-emerald-700 font-medium animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400" />
                                <span>Semua <b>{listPengajuan.total}</b> pengajuan terpilih (lintas halaman).</span>
                                <button 
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setSelectAllAcrossPages(false);
                                    }}
                                    className="px-2 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-md font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                                >
                                    Batalkan pilihan global
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50/50">
                                <th className="py-3 px-4 w-12 text-center">
                                    <button
                                        onClick={toggleAll}
                                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 mx-auto"
                                        style={{
                                            borderColor: allChecked ? '#ef4444' : '#d4d4d8',
                                            backgroundColor: allChecked ? '#ef4444' : 'transparent',
                                        }}
                                        title="Pilih semua"
                                    >
                                        {allChecked && <Check size={12} className="text-white" />}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('judul_kegiatan')}>
                                    Nama Kegiatan {sortField === 'judul_kegiatan' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Pengaju</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Detail</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Kelengkapan</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-center cursor-pointer hover:bg-zinc-100" onClick={() => handleSort('status_pengajuan')}>
                                    Status {sortField === 'status_pengajuan' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {listPengajuan.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-[14px]">
                                        {hasFilters ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Belum ada data pengajuan.'}
                                    </td>
                                </tr>
                            ) : (
                                listPengajuan.data.map((item) => {
                                    const st = STATUS_BADGE[item.status_pengajuan] || STATUS_BADGE.diproses;
                                    const submitterType = getSubmitterType(item);
                                    const submitterName = getSubmitterName(item);
                                    const incompleteReasons = getIncompleteReasons(item);
                                    const isIncomplete = incompleteReasons.length > 0;
                                    const checked = selectedIds.includes(item.id_pengajuan);
                                    return (
                                        <tr key={item.id_pengajuan} className={`hover:bg-zinc-50/50 transition-colors group ${checked ? 'bg-red-50/40' : ''}`}>
                                            <td className="py-3 px-4 text-center border-r border-zinc-100">
                                                <button
                                                    onClick={() => toggleOne(item.id_pengajuan)}
                                                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 mx-auto"
                                                    style={{
                                                        borderColor: checked ? '#ef4444' : '#d4d4d8',
                                                        backgroundColor: checked ? '#ef4444' : 'transparent',
                                                    }}
                                                >
                                                    {checked && <Check size={12} className="text-white" />}
                                                </button>
                                            </td>
                                            {/* Nama Kegiatan */}
                                            <td className="py-3 px-4">
                                                <Link href={`/admin/pengajuan/${item.id_pengajuan}`} className="text-[14px] font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors leading-snug truncate max-w-[260px] block">
                                                    {item.judul_kegiatan}
                                                </Link>
                                                <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>

                                            {/* Pengaju */}
                                            <td className="py-3 px-4">
                                                <div className="text-[13px] font-medium text-zinc-800">{submitterName}</div>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${submitterType === 'dosen' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                                                        {submitterType === 'dosen' ? 'Auth Dosen' : 'Auth Masyarakat'}
                                                    </span>
                                                </div>
                                                {item.no_telepon && (
                                                    <div className="text-[11px] text-zinc-400 mt-1">No. HP: {item.no_telepon}</div>
                                                )}
                                            </td>

                                            {/* Detail: Jenis & Lokasi */}
                                            <td className="py-3 px-4">
                                                <div className="text-[13px] text-zinc-700 font-medium">{item.jenis_pkm?.nama_jenis || '-'}</div>
                                                <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[180px]">
                                                    {item.kota_kabupaten ? `${item.kota_kabupaten}, ${item.provinsi}` : 'Lokasi: TBD'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                {isIncomplete ? (
                                                    <div className="max-w-[250px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                                                            <div>
                                                                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                                                    Data Perlu Dilengkapi
                                                                </div>
                                                                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                                                                    Beberapa isian belum lengkap. Hubungi pengaju untuk melengkapi data.
                                                                </p>
                                                                <p className="mt-1 text-[10px] text-amber-700">
                                                                    Kurang: {incompleteReasons.slice(0, 3).join(', ')}{incompleteReasons.length > 3 ? ', ...' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                                                        <Check size={10} className="text-emerald-500" />
                                                        Data Terverifikasi Lengkap
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status badge */}
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase border ${st.bg} ${st.text} border-zinc-100`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                                    {st.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/pengajuan/${item.id_pengajuan}`}
                                                        className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <ChevronRight size={15} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id_pengajuan, item.judul_kegiatan)}
                                                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {listPengajuan.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50/50">
                        <div className="text-[12px] font-medium text-zinc-500">
                            Menampilkan {(listPengajuan.current_page - 1) * listPengajuan.per_page + 1}
                            –{Math.min(listPengajuan.current_page * listPengajuan.per_page, listPengajuan.total)}
                            {' '}dari {listPengajuan.total} items
                        </div>
                        <div className="flex items-center gap-1">
                            {listPengajuan.links.map((link, i) => {
                                const isFirst = i === 0;
                                const isLast = i === listPengajuan.links.length - 1;
                                return (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => { if (link.url) { setSelectedIds([]); setSelectAllAcrossPages(false); router.get(link.url, {}, { preserveState: true }); } }}
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

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Pengajuan"
                message={`Hapus pengajuan "${deleteTarget?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                variant="danger"
            />
        </AdminLayout>
    );
};

export default Index;
