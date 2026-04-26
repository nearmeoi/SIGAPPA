import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Eye, MessageSquare, Star, Search, X, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';

interface TestimoniItem {
    id_testimoni: number;
    nama_pemberi: string;
    rating: number;
    pesan_ulasan: string;
    masukan?: string | null;
    created_at: string;
}

interface AktivitasItem {
    id_aktivitas: number;
    pengajuan?: {
        judul_kegiatan: string;
    };
    testimoni: TestimoniItem[];
}

interface PaginatedData {
    data: AktivitasItem[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    listGroupedTestimoni: PaginatedData;
    filters?: { search?: string };
}

const MetricCard = ({ title, val, subval }: { title: string, val: string | number, subval?: string }) => (
    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
            <div className="text-zinc-500 text-[13px] font-medium mb-1">{title}</div>
            <div className="text-zinc-900 text-[28px] font-bold tracking-tight leading-none flex items-end gap-2">
                {val} {subval && <span className="text-[14px] text-zinc-400 font-medium mb-1">{subval}</span>}
            </div>
        </div>
    </div>
);

const TestimoniPage: React.FC<Props> = ({ listGroupedTestimoni, filters }) => {
    const items = listGroupedTestimoni.data || [];
    
    // Flatten just to calculate average in the visible page easily
    const allTestimoni = items.flatMap(a => a.testimoni);
    const avgRating = allTestimoni.length > 0
        ? (allTestimoni.reduce((a, b) => a + b.rating, 0) / allTestimoni.length).toFixed(1)
        : '0.0';
    const totalReviews = allTestimoni.length;
    
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedTestimoni, setSelectedTestimoni] = useState<TestimoniItem | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [editingTestimoni, setEditingTestimoni] = useState<TestimoniItem | null>(null);
    const [editForm, setEditForm] = useState({ nama_pemberi: '', rating: 5, pesan_ulasan: '', masukan: '', created_at: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Get user role for permission checks
    const { props } = usePage();
    const userRole = (props as any).auth?.user?.role || 'admin';

    const toggleRow = (id: number) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/testimoni', { search }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/admin/testimoni/${deleteId}`, { 
                preserveScroll: true,
                onFinish: () => setDeleteId(null)
            });
        }
    };

    const openEditModal = (t: TestimoniItem) => {
        setEditingTestimoni(t);
        const dateVal = t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : '';
        setEditForm({ nama_pemberi: t.nama_pemberi, rating: t.rating, pesan_ulasan: t.pesan_ulasan || '', masukan: t.masukan || '', created_at: dateVal });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTestimoni) return;
        router.put(`/admin/testimoni/${editingTestimoni.id_testimoni}`, editForm, {
            preserveScroll: true,
            onSuccess: () => setEditingTestimoni(null),
        });
    };

    return (
        <AdminLayout title="Kelola Testimoni">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Kumpulan Ulasan PKM</h1>
                    <p className="text-zinc-500 text-[14px] mt-1">Ulasan disatukan berdasarkan Judul Kegiatan PKM.</p>
                </div>
                <div>
                    <form onSubmit={handleSearch} className="relative">
                        <input 
                            type="text" 
                            placeholder="Cari aktivitas..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-[13px] font-medium w-[250px] outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </form>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <MetricCard title="Total Aktivitas Terulas" val={listGroupedTestimoni.total} />
                <MetricCard title="Rata-rata Rating (Page ini)" val={avgRating} subval="/ 5.0" />
                <MetricCard title="Total Ulasan (Page ini)" val={totalReviews} />
            </div>

            {items.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                    <MessageSquare size={32} className="text-zinc-300 mb-3" />
                    <div className="text-zinc-900 text-[14px] font-medium">Belum ada aktivitas yang memiliki ulasan</div>
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[12px] uppercase text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Judul Kegiatan PKM</th>
                                <th className="px-6 py-4 font-bold">Jumlah Testimoni</th>
                                <th className="px-6 py-4 font-bold">Rata-rata Rating</th>
                                <th className="px-6 py-4 font-bold w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-[13.5px]">
                            {items.map(aktivitas => {
                                const count = aktivitas.testimoni.length;
                                const avg = count > 0 ? (aktivitas.testimoni.reduce((a, b) => a + b.rating, 0) / count).toFixed(1) : '0';
                                const isExpanded = expandedRow === aktivitas.id_aktivitas;

                                return (
                                    <React.Fragment key={aktivitas.id_aktivitas}>
                                        <tr 
                                            onClick={() => toggleRow(aktivitas.id_aktivitas)} 
                                            className={`hover:bg-zinc-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-50' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-zinc-900 line-clamp-2">
                                                    {aktivitas.pengajuan?.judul_kegiatan || 'Tanpa Judul'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-zinc-700">
                                                <span className="bg-poltekpar-primary/10 text-poltekpar-primary px-3 py-1 rounded-full text-[12px] font-bold">
                                                    {count} Ulasan
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800 flex items-center gap-1.5 pt-4">
                                                <Star size={16} className="text-yellow-400 fill-yellow-400" /> {avg}
                                            </td>
                                            <td className="px-6 py-4 text-center text-zinc-400">
                                                {isExpanded ? <ChevronUp size={20} className="mx-auto" /> : <ChevronDown size={20} className="mx-auto" />}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={4} className="bg-zinc-50 border-t border-zinc-100 p-0">
                                                    <div className="p-6 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <h4 className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Daftar Testimoni ({count})</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {aktivitas.testimoni.map((t, index) => (
                                                                <div key={t.id_testimoni} className="bg-white border rounded-xl p-4 shadow-sm border-zinc-200/80 hover:border-zinc-300 transition-colors flex flex-col h-full">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-poltekpar-primary to-blue-400 flex items-center justify-center text-white font-bold text-[12px] shadow-inner shadow-white/20">
                                                                                {t.nama_pemberi.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-[13px] text-zinc-900 tracking-tight">{t.nama_pemberi}</div>
                                                                                <div className="text-[10px] text-zinc-400 font-medium">{new Date(t.created_at).toLocaleDateString('id-ID', {day: 'numeric', month:'short', year:'numeric'})}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-0.5">
                                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                                <Star key={s} size={12} className={s <= t.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-zinc-200'} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-zinc-600 text-[13px] italic line-clamp-2 mb-4 flex-1">"{t.pesan_ulasan || 'Tidak ada pesan tertulis'}"</p>
                                                                    
                                                                    <div className="flex gap-2 mt-auto">
                                                                        <button onClick={() => setSelectedTestimoni(t)} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[12px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                                                            <Eye size={14}/> Detail
                                                                        </button>
                                                                        {userRole === 'superadmin' && (
                                                                            <button onClick={() => openEditModal(t)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[12px] py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                                                                                <Pencil size={13}/>
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => handleDelete(t.id_testimoni)} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[12px] py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                                                                            <Trash2 size={13}/>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Placeholder if needed */}

            {/* Modal Detail Individu Testimoni */}
            {selectedTestimoni && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                     onClick={() => setSelectedTestimoni(null)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
                         onClick={e => e.stopPropagation()}>
                        
                        {/* Header Modal */}
                        <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-poltekpar-primary to-blue-400 flex items-center justify-center text-white font-bold text-[18px] shadow-inner shadow-white/20">
                                    {selectedTestimoni.nama_pemberi.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold text-zinc-900 leading-snug">{selectedTestimoni.nama_pemberi}</h3>
                                    <div className="text-[12px] font-medium text-zinc-400">{new Date(selectedTestimoni.created_at).toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTestimoni(null)} className="p-2 bg-white rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all flex-shrink-0 shadow-sm shadow-zinc-200/50 hover:scale-105 active:scale-95">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 font-[Inter] space-y-5">
                            <div className="flex bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-100 w-max gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={18} className={s <= selectedTestimoni.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-zinc-200'} />
                                ))}
                            </div>
                            <div className="space-y-4">
                                {selectedTestimoni.pesan_ulasan && (
                                    <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                                        <div className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MessageSquare size={14}/> Kesan & Pesan</div>
                                        <p className="text-zinc-800 text-[14px] leading-relaxed italic">"{selectedTestimoni.pesan_ulasan}"</p>
                                    </div>
                                )}
                                {selectedTestimoni.masukan && (
                                    <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-5">
                                        <div className="text-[12px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Star size={14} className="fill-amber-400 opacity-50"/> Kritik & Saran (Masukan)</div>
                                        <p className="text-amber-900/90 text-[14px] leading-relaxed whitespace-pre-wrap">
                                            {selectedTestimoni.masukan}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                            <button onClick={() => setSelectedTestimoni(null)} className="px-6 py-2 bg-zinc-900 text-white text-[13px] font-bold rounded-lg hover:bg-zinc-800 transition-all">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Testimoni Modal (Superadmin Only) */}
            {editingTestimoni && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                     onClick={() => setEditingTestimoni(null)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                         onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <h3 className="text-[18px] font-bold text-zinc-900">Edit Testimoni</h3>
                            <button onClick={() => setEditingTestimoni(null)} className="p-2 bg-white rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Nama Pemberi</label>
                                <input type="text" value={editForm.nama_pemberi} onChange={e => setEditForm(prev => ({ ...prev, nama_pemberi: e.target.value }))} className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-poltekpar-primary" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setEditForm(prev => ({ ...prev, rating: s }))} className="p-1">
                                            <Star size={24} className={s <= editForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-200'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Kesan & Pesan</label>
                                <textarea value={editForm.pesan_ulasan} onChange={e => setEditForm(prev => ({ ...prev, pesan_ulasan: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-poltekpar-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Kritik & Saran</label>
                                <textarea value={editForm.masukan} onChange={e => setEditForm(prev => ({ ...prev, masukan: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-poltekpar-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700">Tanggal Pembuatan</label>
                                <input type="date" value={editForm.created_at} onChange={e => setEditForm(prev => ({ ...prev, created_at: e.target.value }))} className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-poltekpar-primary" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingTestimoni(null)} className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50">Batal</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-poltekpar-primary text-white font-bold text-sm hover:bg-poltekpar-navy">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default TestimoniPage;
