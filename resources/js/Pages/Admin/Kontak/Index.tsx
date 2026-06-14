import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Edit, Eye, Plus, Save, Trash2, X, Check } from 'lucide-react';
import BulkActionBar, { CheckboxCell, CheckboxHeader } from '@/Components/BulkActionBar';

interface Kontak {
    id_kontak: number;
    platform: string;
    nilai_kontak: string;
    label: string | null;
    ikon: string | null;
}

interface VisitorData {
    visitor_count: number;
    visitor_count_offset: number;
}

interface KontakIndexProps {
    auth: { user: { name: string; email: string; role: string } };
    kontaks: Kontak[];
    visitorData: VisitorData;
}

export default function KontakIndex({ auth, kontaks, visitorData }: KontakIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // ── Bulk Delete ──
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const allIdsOnPage = (kontaks as Kontak[]).map(k => k.id_kontak);
    const allChecked = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedIds.includes(id));
    const toggleAll = () => {
        if (allChecked) setSelectedIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
        else setSelectedIds(prev => [...new Set([...prev, ...allIdsOnPage])]);
    };
    const toggleOne = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleBulkDelete = () => {
        if (confirm(`Hapus ${selectedIds.length} kontak terpilih?`)) {
            router.delete('/admin/kontak/bulk', {
                data: { ids: selectedIds },
                onSuccess: () => setSelectedIds([]),
                preserveState: true,
            });
        }
    };
    // ── Visitor Offset Form ──
    const vd: VisitorData = visitorData ?? { visitor_count: 0, visitor_count_offset: 0 };
    const [offsetValue, setOffsetValue] = useState<string>(String(vd.visitor_count_offset));
    const [savingOffset, setSavingOffset] = useState(false);

    const handleSaveOffset = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(offsetValue, 10);
        if (isNaN(parsed) || parsed < 0) {
            return;
        }
        setSavingOffset(true);
        router.put('/admin/kontak/visitor-offset', { offset: parsed }, {
            onFinish: () => setSavingOffset(false),
            preserveScroll: true,
        });
    };

    const [form, setForm] = useState({
        platform: '',
        nilai_kontak: '',
        label: '',
        ikon: ''
    });

    const resetForm = () => {
        setForm({ platform: '', nilai_kontak: '', label: '', ikon: '' });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleEdit = (k: Kontak) => {
        setForm({
            platform: k.platform,
            nilai_kontak: k.nilai_kontak,
            label: k.label || '',
            ikon: k.ikon || ''
        });
        setEditingId(k.id_kontak);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/admin/kontak/${deleteId}`, {
                onFinish: () => setDeleteId(null)
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        if (editingId) {
            router.put(`/admin/kontak/${editingId}`, form, {
                onSuccess: () => {
                    resetForm();
                },
                onFinish: () => setSubmitting(false)
            });
        } else {
            router.post('/admin/kontak', form, {
                onSuccess: () => {
                    resetForm();
                },
                onFinish: () => setSubmitting(false)
            });
        }
    };

    const commonPlatforms = [
        { name: 'WhatsApp / Telepon', icon: 'fa-brands fa-whatsapp' },
        { name: 'Instagram', icon: 'fa-brands fa-instagram' },
        { name: 'Email', icon: 'fa-solid fa-envelope' },
        { name: 'Facebook', icon: 'fa-brands fa-facebook' },
        { name: 'Alamat / Lokasi', icon: 'fa-solid fa-map-marker-alt' },
        { name: 'Lainnya', icon: 'fa-solid fa-address-book' }
    ];

    const handlePlatformSelect = (p: any) => {
        setForm({ ...form, platform: p.name, ikon: p.icon });
    };

    return (
        <>
            <Head title="Manajemen Kontak" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Kontak</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola data kontak dinamis untuk ditampilkan pada Landing Page</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-poltekpar-primary text-white rounded-lg hover:bg-poltekpar-navy transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus size={18} />
                    <span>Tambah Kontak</span>
                </button>
            </div>


            <BulkActionBar selectedCount={selectedIds.length} onDelete={handleBulkDelete} onClear={() => setSelectedIds([])} entityLabel="kontak" />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <tr>
                                <CheckboxHeader allChecked={allChecked} onToggleAll={toggleAll} />
                                <th className="px-6 py-4 font-semibold w-16">No</th>
                                <th className="px-6 py-4 font-semibold">Ikon</th>
                                <th className="px-6 py-4 font-semibold">Platform & Label</th>
                                <th className="px-6 py-4 font-semibold">Detail Kontak</th>
                                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {kontaks.length > 0 ? (
                                kontaks.map((item: Kontak, index: number) => {
                                    const checked = selectedIds.includes(item.id_kontak);
                                    return (
                                    <tr key={item.id_kontak} className={`hover:bg-slate-50 transition-colors ${checked ? 'bg-red-50/40' : ''}`}>
                                        <CheckboxCell checked={checked} onChange={() => toggleOne(item.id_kontak)} />
                                        <td className="px-6 py-4 text-center">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-poltekpar-primary flex items-center justify-center">
                                                <i className={`${item.ikon || 'fa-solid fa-circle-info'} text-lg`}></i>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{item.platform}</p>
                                            {item.label && <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-pre-wrap">{item.nilai_kontak}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id_kontak)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Belum ada data kontak.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visitor Counter Card */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-poltekpar-primary/10 text-poltekpar-primary flex items-center justify-center flex-shrink-0">
                        <Eye size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Statistik Pengunjung Beranda</h3>
                        <p className="text-xs text-slate-500">Jumlah kunjungan ke halaman /beranda</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Kunjungan Tercatat</p>
                        <p className="text-2xl font-black text-slate-900">{vd.visitor_count.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Offset Awal</p>
                        <p className="text-2xl font-black text-slate-900">{vd.visitor_count_offset.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-poltekpar-primary/5 rounded-lg px-4 py-3 border border-poltekpar-primary/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-poltekpar-primary/70 mb-0.5">Total Ditampilkan</p>
                        <p className="text-2xl font-black text-poltekpar-primary">{(vd.visitor_count + vd.visitor_count_offset).toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <form onSubmit={handleSaveOffset} className="flex items-end gap-3">
                    <div className="flex-1 max-w-xs">
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">
                            Set Offset Awal
                            <span className="ml-1.5 text-xs font-normal text-slate-400">(angka awal yang ditambahkan ke counter)</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={offsetValue}
                            onChange={e => setOffsetValue(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary"
                            placeholder="0"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={savingOffset}
                        className="flex items-center gap-2 px-4 py-2.5 bg-poltekpar-primary text-white text-sm font-medium rounded-lg hover:bg-poltekpar-navy transition-colors shadow-sm disabled:opacity-70"
                    >
                        <Save size={15} />
                        {savingOffset ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </form>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={resetForm}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? 'Edit Kontak' : 'Tambah Kontak Baru'}
                            </h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto w-full custom-scrollbar">
                            <form id="kontakForm" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Preset Cepat (Opsional)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonPlatforms.map(p => (
                                            <button type="button" key={p.name} onClick={() => handlePlatformSelect(p)} 
                                                className="text-xs bg-slate-100 hover:bg-poltekpar-primary hover:text-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 transition-colors flex items-center gap-1.5">
                                                <i className={p.icon}></i> {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Nama Platform / Jenis <span className="text-rose-500">*</span></label>
                                    <input required type="text" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" placeholder="Cth: WhatsApp / Instagram" />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Nilai Kontak / Detail <span className="text-rose-500">*</span></label>
                                    <textarea required rows={3} value={form.nilai_kontak} onChange={e => setForm({...form, nilai_kontak: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" placeholder="Cth: 08123456789 atau link tautan" />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Label Keterangan (Opsional)</label>
                                    <input type="text" value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" placeholder="Cth: Hubungi kami hanya di jam kerja" />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Class Ikon FontAwesome (Opsional)</label>
                                    <input type="text" value={form.ikon} onChange={e => setForm({...form, ikon: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary font-mono text-xs" placeholder="fa-brands fa-whatsapp" />
                                    {form.ikon && <div className="mt-2 text-sm text-slate-500">Preview: <i className={`${form.ikon} ml-2 text-poltekpar-primary text-lg`}></i></div>}
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
                            <button type="submit" form="kontakForm" disabled={submitting} className="px-6 py-2 text-sm font-medium bg-poltekpar-primary text-white rounded-lg hover:bg-poltekpar-navy transition-colors shadow-sm disabled:opacity-70">
                                {submitting ? 'Menyimpan...' : 'Simpan Kontak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

KontakIndex.layout = (page: React.ReactNode) => <AdminLayout title="Manajemen Kontak">{page}</AdminLayout>;
