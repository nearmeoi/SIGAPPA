import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import Pagination from '../../../Components/Pagination';
import { Download, Edit, Trash2, X, Plus, Search, Upload, User } from 'lucide-react';
import BulkActionBar, { CheckboxCell, CheckboxHeader } from '../../../Components/BulkActionBar';

interface Pegawai {
    id_pegawai: number;
    nip?: string;
    nama_pegawai: string;
    jabatan?: string;
    posisi?: string;
}

interface LinkItem {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: Pegawai[];
    current_page: number;
    last_page: number;
    total: number;
    links: LinkItem[];
    from: number;
    to: number;
}

interface Props {
    listPegawai: PaginatedData;
    filters: {
        search: string;
    };
}

const PegawaiPage: React.FC<Props> = ({ listPegawai, filters }) => {
    const data = listPegawai.data || [];
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ nip: '', nama_pegawai: '', jabatan: '', posisi: '' });
    const [editId, setEditId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                router.get('/admin/pegawai', { search }, {
                    preserveState: true,
                    replace: true,
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const openCreate = () => { setEditId(null); setForm({ nip: '', nama_pegawai: '', jabatan: '', posisi: '' }); setModalOpen(true); };
    const openEdit = (item: Pegawai) => { setEditId(item.id_pegawai); setForm({ nip: item.nip || '', nama_pegawai: item.nama_pegawai, jabatan: item.jabatan || '', posisi: item.posisi || '' }); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditId(null); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === 'nip' ? value.replace(/\D/g, '') : value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            router.put(`/admin/pegawai/${editId}`, form, { onSuccess: closeModal });
        } else {
            router.post('/admin/pegawai', form, { onSuccess: closeModal });
        }
    };

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            router.delete(`/admin/pegawai/${deleteTarget}`, {
                onFinish: () => setDeleteTarget(null),
            });
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    // ── Bulk Delete ──
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const allIdsOnPage = data.map(p => p.id_pegawai);
    const allChecked = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedIds.includes(id));
    
    const toggleAll = () => {
        if (allChecked) {
            setSelectedIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
            setIsAllSelected(false);
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...allIdsOnPage])]);
        }
    };

    const toggleOne = (id: number) => {
        setSelectedIds(prev => {
            const newIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            if (newIds.length < listPegawai.total) setIsAllSelected(false);
            return newIds;
        });
    };

    const handleBulkDelete = () => {
        const count = isAllSelected ? listPegawai.total : selectedIds.length;
        if (confirm(`Hapus ${count} pegawai terpilih?`)) {
            router.delete('/admin/pegawai/bulk', {
                data: { 
                    ids: isAllSelected ? [] : selectedIds,
                    all: isAllSelected,
                    search: filters.search
                },
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsAllSelected(false);
                },
                preserveState: true,
            });
        }
    };

    const handleSelectAllInDatabase = () => {
        setIsAllSelected(true);
        // We don't necessarily need to fill selectedIds with everything if we use the flag,
        // but it's good for UI consistency if we have some IDs
    };

    const handleCsvUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xls,.xlsx';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                router.post('/admin/pegawai/import', formData);
            }
        };
        input.click();
    };

    const handleDownloadTemplate = () => {
        const rows = [
            {
                NO: 1,
                NAMA: 'Dr. Contoh Nama, S.ST., M.M.',
                NIP: '198801012014041001',
                JABATAN: 'Dosen',
                POSISI: 'Ketua Program Studi',
            },
            {
                NO: 2,
                NAMA: 'Contoh Staf Administrasi',
                NIP: '197912312005021002',
                JABATAN: 'Staf Administrasi',
                POSISI: 'Pengelola Data',
            },
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pegawai');
        XLSX.writeFile(workbook, 'Template_Import_Pegawai.xlsx');
    };



    return (
        <AdminLayout title="">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Data Pegawai</h1>
                    <p className="text-zinc-500 text-[14px] mt-1">Manajemen pegawai, dosen & staf.</p>
                    <p className="text-zinc-400 text-[12px] mt-2">Format import: kolom NAMA, NIP, JABATAN, dan POSISI.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
                        <Download size={14} /> Unduh Template
                    </button>
                    <button onClick={handleCsvUpload} className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
                        <Upload size={14} /> Import Excel
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-white shadow-sm transition-colors bg-zinc-900 hover:bg-zinc-800">
                        <Plus size={16} /> Tambah Pegawai
                    </button>
                </div>
            </div>



            <BulkActionBar selectedCount={isAllSelected ? listPegawai.total : selectedIds.length} onDelete={handleBulkDelete} onClear={() => { setSelectedIds([]); setIsAllSelected(false); }} entityLabel="pegawai" />

            {allChecked && listPegawai.total > data.length && !isAllSelected && (
                <div className="bg-poltekpar-navy text-white px-6 py-2 text-[13px] flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <span>Semua <b>{data.length}</b> pegawai di halaman ini terpilih.</span>
                    <button onClick={handleSelectAllInDatabase} className="underline font-bold hover:text-poltekpar-gold transition-colors">
                        Pilih semua {listPegawai.total} pegawai di database
                    </button>
                </div>
            )}
            {isAllSelected && (
                <div className="bg-poltekpar-gold text-poltekpar-navy px-6 py-2 text-[13px] flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <span>Semua <b>{listPegawai.total}</b> pegawai telah terpilih.</span>
                    <button onClick={() => setIsAllSelected(false)} className="underline font-bold hover:text-red-600 transition-colors">
                        Batalkan pilihan semua
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-zinc-200/80 bg-zinc-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau NIP..."
                            className="w-full bg-white border border-zinc-200 pl-9 pr-4 py-1.5 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200">
                                <CheckboxHeader allChecked={allChecked} onToggleAll={toggleAll} />
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider w-12 border-r border-zinc-100 bg-zinc-50">No</th>
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Nama Lengkap & NIP</th>
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Jabatan / Posisi</th>
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {data.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-zinc-400 text-[13px]">Tidak ada data.</td></tr>
                            ) : data.map((item, i) => {
                                const checked = selectedIds.includes(item.id_pegawai);
                                return (
                                <tr key={item.id_pegawai} className={`hover:bg-zinc-50/50 transition-colors group ${checked ? 'bg-red-50/40' : ''}`}>
                                    <CheckboxCell checked={checked} onChange={() => toggleOne(item.id_pegawai)} />
                                    <td className="py-4 px-6 text-zinc-500 text-[13px] font-mono border-r border-zinc-100 bg-zinc-50/30 text-center font-medium">{String(listPegawai.from + i).padStart(2, '0')}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-zinc-900 text-[14px]">{item.nama_pegawai}</div>
                                                <div className="text-zinc-500 text-[12px] mt-0.5 font-mono">{item.nip || 'NIP TBD'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-zinc-900 text-[13px] font-medium">{item.jabatan || '-'}</div>
                                        <div className="text-zinc-500 text-[12px] mt-0.5">{item.posisi || '-'}</div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"><Edit size={15} /></button>
                                            <button onClick={() => handleDelete(item.id_pegawai)} className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[12px] font-medium text-zinc-500">Menampilkan {listPegawai.from || 0} sampai {listPegawai.to || 0} dari {listPegawai.total} pegawai</span>
                    <Pagination links={listPegawai.links} />
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0" onClick={closeModal}>
                    <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-xl shadow-lg border border-zinc-200 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-zinc-900">{editId ? 'Edit Pegawai' : 'Register New Pegawai'}</h3>
                            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Nama Lengkap & Gelar <span className="text-red-500">*</span></label>
                                <input name="nama_pegawai" value={form.nama_pegawai} onChange={handleChange} required placeholder="Masukkan Nama Lengkap & Gelar"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">NIP</label>
                                <input name="nip" value={form.nip} onChange={handleChange} placeholder="Masukkan NIP Pegawai" inputMode="numeric"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Jabatan</label>
                                <input name="jabatan" value={form.jabatan} onChange={handleChange} placeholder="Contoh: Dosen, Staf Administrasi, Direktur"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-zinc-700 block mb-1.5">Posisi</label>
                                <input name="posisi" value={form.posisi} onChange={handleChange} placeholder="Contoh: Ketua Program Studi, Wakil Direktur I"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 text-zinc-900 placeholder-zinc-400 transition-all" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 py-2 rounded-md text-[13px] font-medium text-white shadow-sm bg-zinc-900 hover:bg-zinc-800 transition-all">
                                    {editId ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 py-2 rounded-md text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Hapus Pegawai"
                message="Data pegawai ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                variant="danger"
            />
        </AdminLayout>
    );
};

export default PegawaiPage;
