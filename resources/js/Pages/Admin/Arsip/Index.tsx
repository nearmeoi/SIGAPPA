import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import { ExternalLink, Search, Folder, X, FileText, Eye, Plus, Trash2, Edit, Check } from 'lucide-react';
import BulkActionBar, { CheckboxCell } from '../../../Components/BulkActionBar';

interface ArsipItem {
    id_arsip: number;
    id_aktivitas?: number;
    id_pengajuan?: number;
    nama_dokumen: string;
    jenis_arsip: string;
    url_dokumen?: string;
    keterangan?: string;
    created_at: string;
    updated_at: string;
    pengajuan?: {
        judul_kegiatan: string;
    };
}

interface AktivitasGroupedArsip {
    id_aktivitas: number;
    id_pengajuan: number;
    created_at: string;
    pengajuan?: {
        judul_kegiatan: string;
        user?: { name: string };
        jenis_pkm?: { nama_jenis: string };
    };
    arsip: ArsipItem[];
}

interface PaginatedData {
    data: AktivitasGroupedArsip[];
    current_page: number;
    last_page: number;
    total: number;
}

interface AvailableAktivitas {
    id_aktivitas: number;
    id_pengajuan: number;
    judul_kegiatan: string;
}

interface Props {
    listGroupedArsip: PaginatedData;
    listAvailableAktivitas: AvailableAktivitas[];
    filters: {
        search: string;
        sort?: string;
        direction?: string;
    };
}

const jenisOptions = [
    { value: 'laporan_akhir', label: 'Laporan Akhir' },
    { value: 'dokumentasi', label: 'Dokumentasi' },
    { value: 'dokumen_lain', label: 'Dokumen Lain' },
];

const jenisLabel: Record<string, string> = {
    laporan_akhir: 'Laporan Akhir',
    dokumentasi: 'Dokumentasi',
    dokumen_lain: 'Dokumen Lain',
};

const ArsipPage: React.FC<Props> = ({ listGroupedArsip, listAvailableAktivitas, filters }) => {
    const [previewItem, setPreviewItem] = useState<ArsipItem | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [sortField, setSortField] = useState(filters.sort || 'created_at');
    const [sortDir, setSortDir] = useState(filters.direction || 'desc');
    const [modalOpen, setModalOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [editing, setEditing] = useState<ArsipItem | null>(null);
    const [form, setForm] = useState({
        id_pengajuan: '',
        id_aktivitas: '',
        nama_dokumen: '',
        jenis_arsip: 'laporan_akhir',
        url_dokumen: '',
        keterangan: '',
    });

    const items = listGroupedArsip.data || [];

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                router.get('/admin/arsip', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const applySort = (field: string) => {
        const isAsc = sortField === field && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        router.get('/admin/arsip', {
            search: search || undefined,
            sort: field,
            direction: newDir,
        }, { preserveState: true, replace: true });
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ id_pengajuan: '', id_aktivitas: '', nama_dokumen: '', jenis_arsip: 'laporan_akhir', url_dokumen: '', keterangan: '' });
        setModalOpen(true);
    };

    const openEdit = (a: ArsipItem, id_aktivitas: number, id_pengajuan: number) => {
        setEditing(a);
        setForm({
            id_pengajuan: id_pengajuan.toString() || '',
            id_aktivitas: id_aktivitas.toString() || '',
            nama_dokumen: a.nama_dokumen,
            jenis_arsip: a.jenis_arsip,
            url_dokumen: a.url_dokumen || '',
            keterangan: a.keterangan || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            router.put(`/admin/arsip/${editing.id_arsip}`, {
                nama_dokumen: form.nama_dokumen,
                jenis_arsip: form.jenis_arsip,
                url_dokumen: form.url_dokumen,
                keterangan: form.keterangan,
            }, { onSuccess: () => setModalOpen(false) });
        } else {
            router.post('/admin/arsip', form, { onSuccess: () => setModalOpen(false) });
        }
    };

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            router.delete(`/admin/arsip/${deleteTarget}`, {
                onFinish: () => setDeleteTarget(null),
            });
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    // ── Bulk Delete for Arsip ──
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const toggleOneArsip = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleBulkDelete = () => {
        if (confirm(`Hapus ${selectedIds.length} arsip terpilih?`)) {
            router.delete('/admin/arsip/bulk', {
                data: { ids: selectedIds },
                onSuccess: () => setSelectedIds([]),
                preserveState: true,
            });
        }
    };

    return (
        <AdminLayout title="">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Kelola Arsip</h1>
                    <p className="text-zinc-500 text-[14px] mt-1">Sistem direktori dokumen pengabdian kepada masyarakat.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-white shadow-sm transition-colors bg-zinc-900 hover:bg-zinc-800"
                >
                    <Plus size={16} /> Arsip Baru
                </button>
            </div>

            <BulkActionBar selectedCount={selectedIds.length} onDelete={handleBulkDelete} onClear={() => setSelectedIds([])} entityLabel="arsip" />

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-200/80 bg-zinc-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cari dokumen berdasarkan nama atau kegiatan..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-zinc-200 pl-9 pr-4 py-1.5 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-zinc-200">
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-10"></th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer hover:bg-zinc-100" onClick={() => applySort('judul_kegiatan')}>
                                    Nama Kegiatan {sortField === 'judul_kegiatan' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Ketua Tim</th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer hover:bg-zinc-100" onClick={() => applySort('created_at')}>
                                    Last Update {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-right w-24">Jumlah File</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium text-[13px]">Tidak ada dokumen arsip yang ditemukan.</td>
                                </tr>
                            ) : items.map((a) => {
                                const isExpanded = expandedIds.includes(a.id_aktivitas);
                                return (
                                    <React.Fragment key={a.id_aktivitas}>
                                        <tr className="hover:bg-zinc-50/50 transition-colors group cursor-pointer" onClick={() => toggleExpand(a.id_aktivitas)}>
                                            <td className="py-4 px-6 text-center">
                                                <button className="text-zinc-400 hover:text-zinc-600">
                                                    {isExpanded ? '▼' : '▶'}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-[14px] font-semibold text-zinc-900 truncate max-w-[300px]" title={a.pengajuan?.judul_kegiatan}>
                                                {a.pengajuan?.judul_kegiatan || 'Tidak Ada Judul'}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-zinc-600">
                                                {a.pengajuan?.user?.name || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-zinc-500">
                                                {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-6 text-right font-medium text-zinc-700">
                                                {a.arsip?.length || 0} File
                                            </td>
                                        </tr>
                                        {isExpanded && (a.arsip?.length > 0) && (
                                            <tr className="bg-zinc-50/50">
                                                <td colSpan={5} className="p-0 border-b border-zinc-100">
                                                    <div className="px-12 py-4 bg-zinc-50/30 shadow-inner">
                                                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Daftar Arsip</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {a.arsip.map(arsip => {
                                                                const checked = selectedIds.includes(arsip.id_arsip);
                                                                return (
                                                                <div key={arsip.id_arsip} className={`flex items-center justify-between bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${checked ? 'border-red-300 bg-red-50/30' : 'border-zinc-200'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); toggleOneArsip(arsip.id_arsip); }}
                                                                            className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                                                            style={{ borderColor: checked ? '#ef4444' : '#d4d4d8', backgroundColor: checked ? '#ef4444' : 'transparent' }}
                                                                        >
                                                                            {checked && <Check size={12} className="text-white" />}
                                                                        </button>
                                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 flex-shrink-0">
                                                                            <FileText size={14} />
                                                                        </div>
                                                                        <div className="overflow-hidden">
                                                                            <div className="font-semibold text-zinc-900 text-[13px] truncate" title={arsip.nama_dokumen}>
                                                                                {arsip.nama_dokumen}
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5 inline-flex items-center gap-1">
                                                                                <Folder size={10} className="opacity-70" /> {jenisLabel[arsip.jenis_arsip] || arsip.jenis_arsip}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button onClick={(e) => { e.stopPropagation(); setPreviewItem({...arsip, pengajuan: a.pengajuan}); }} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" title="Preview"><Eye size={14} /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(arsip, a.id_aktivitas, a.id_pengajuan); }} className="p-1.5 rounded-md text-zinc-400 hover:text-amber-600 hover:bg-amber-50" title="Edit"><Edit size={14} /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(arsip.id_arsip); }} className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Hapus"><Trash2 size={14} /></button>
                                                                    </div>
                                                                </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-zinc-500">{listGroupedArsip.total} grup aktivitas</span>
                </div>
            </div>

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0" onClick={() => setPreviewItem(null)}>
                    <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg border border-zinc-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-zinc-900">{previewItem.nama_dokumen}</div>
                                    <div className="text-[12px] text-zinc-500 mt-0.5">{previewItem.pengajuan?.judul_kegiatan || '-'}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewItem(null)}
                                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Link Akses Dokumen</div>
                                <div className="bg-zinc-50 rounded-md border border-zinc-200 p-3">
                                    <p className="text-[12px] text-zinc-700 break-all font-mono">{previewItem.url_dokumen || '-'}</p>
                                </div>
                            </div>
                            {previewItem.keterangan && (
                                <div>
                                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Informasi Tambahan</div>
                                    <div className="bg-zinc-50 rounded-md border border-zinc-200 p-3">
                                        <p className="text-[13px] text-zinc-700">{previewItem.keterangan}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                {previewItem.url_dokumen && (
                                    <a
                                        href={previewItem.url_dokumen}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm"
                                    >
                                        <ExternalLink size={14} /> Buka di Tab Baru
                                    </a>
                                )}
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="flex-1 py-2 rounded-md text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Arsip Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0" onClick={() => setModalOpen(false)}>
                    <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-xl shadow-lg border border-zinc-200 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-zinc-900">{editing ? 'Edit Arsip' : 'Tambah Arsip'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Pilih Aktivitas (Selesai pada tahun ini) <span className="text-red-500">*</span></label>
                                <select 
                                    name="id_aktivitas" 
                                    value={form.id_aktivitas} 
                                    onChange={e => {
                                        const selId = e.target.value;
                                        setForm({ 
                                            ...form, 
                                            id_aktivitas: selId, 
                                            id_pengajuan: listAvailableAktivitas.find(a => a.id_aktivitas.toString() === selId)?.id_pengajuan.toString() || '' 
                                        });
                                    }} 
                                    disabled={!!editing}
                                    required
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all font-semibold"
                                >
                                    <option value="" disabled>-- Pilih Aktivitas --</option>
                                    {listAvailableAktivitas.map(a => (
                                        <option key={a.id_aktivitas} value={a.id_aktivitas}>{a.judul_kegiatan}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Judul Dokumen <span className="text-red-500">*</span></label>
                                <input value={form.nama_dokumen} onChange={e => setForm({ ...form, nama_dokumen: e.target.value })} required placeholder="E.g., Laporan Akhir v2"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Jenis <span className="text-red-500">*</span></label>
                                <select value={form.jenis_arsip} onChange={e => setForm({ ...form, jenis_arsip: e.target.value })}
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 transition-all cursor-pointer">
                                    {jenisOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Link Akses Dokumen <span className="text-red-500">*</span></label>
                                <input value={form.url_dokumen} onChange={e => setForm({ ...form, url_dokumen: e.target.value })} required type="url" placeholder="https://drive.google.com/..."
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Informasi Tambahan</label>
                                <textarea value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Optional description" rows={2}
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all resize-none" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="submit" className="flex-1 py-2 rounded-md text-[13px] font-medium text-white shadow-sm bg-zinc-900 hover:bg-zinc-800 transition-all">{editing ? 'Simpan Perubahan' : 'Simpan Dokumen'}</button>
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 rounded-md text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Arsip"
                message="Data arsip ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                variant="danger"
            />
        </AdminLayout>
    );
};

export default ArsipPage;
