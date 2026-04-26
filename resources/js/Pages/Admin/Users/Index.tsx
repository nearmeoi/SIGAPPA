import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import Pagination from '../../../Components/Pagination';
import { Users, Plus, Edit, Trash2, Search, Activity, X, Eye, EyeOff, Check } from 'lucide-react';
import BulkActionBar, { CheckboxCell, CheckboxHeader } from '../../../Components/BulkActionBar';

interface User {
    id_user: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

interface PaginatedData {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    users: PaginatedData;
    filters: {
        search: string;
    };
    errors: any;
}

const ManajemenUser: React.FC<Props> = ({ users, filters, errors }) => {
    const data = users.data || [];
    const [search, setSearch] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'masyarakat', nip: '', force_create_pegawai: false });
    const [showPassword, setShowPassword] = useState(false);
    const [forceCreateModal, setForceCreateModal] = useState(false);
    
    // Get current user from Inertia props
    const { auth } = usePage<any>().props;
    const isSuperadmin = auth?.user?.role === 'superadmin';

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                router.get('/admin/users', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openCreate = () => {
        setEditId(null);
        setForm({ name: '', email: '', password: '', role: 'masyarakat', nip: '', force_create_pegawai: false });
        setShowPassword(false);
        setModalOpen(true);
    };

    const openEdit = (user: User) => {
        setEditId(user.id_user);
        setForm({ name: user.name, email: user.email, password: '', role: user.role, nip: '', force_create_pegawai: false });
        setShowPassword(false);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditId(null);
        setForceCreateModal(false);
    };

    const handleSubmit = (e?: React.FormEvent, isForce = false) => {
        if (e) e.preventDefault();
        
        const payload = { ...form, force_create_pegawai: isForce };
        
        const options = {
            onSuccess: () => closeModal(),
            onError: (errs: any) => {
                if (errs.nip_not_found) {
                    setForceCreateModal(true);
                }
            }
        };

        if (editId) {
            router.put(`/admin/users/${editId}`, payload, options);
        } else {
            router.post('/admin/users', payload, options);
        }
    };

    const handleForceCreate = () => {
        setForm(prev => ({ ...prev, force_create_pegawai: true }));
        setForceCreateModal(false);
        handleSubmit(undefined, true);
    };

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            router.delete(`/admin/users/${deleteTarget}`, {
                onFinish: () => setDeleteTarget(null),
            });
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    // ── Bulk Delete ──
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const allIdsOnPage = data.map(u => u.id_user);
    const allChecked = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedIds.includes(id));

    const toggleAll = () => {
        if (allChecked) {
            setSelectedIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
            setIsAllSelected(false);
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...allIdsOnPage])]);
        }
    };

    const toggleOne = (id: number) =>
        setSelectedIds(prev => {
            const newIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            if (newIds.length < users.total) setIsAllSelected(false);
            return newIds;
        });

    const handleBulkDelete = () => {
        const count = isAllSelected ? users.total : selectedIds.length;
        if (confirm(`Hapus ${count} user terpilih?`)) {
            router.delete('/admin/users/bulk', {
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
    };

    return (
        <AdminLayout title="">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Manajemen User</h1>
                    <p className="text-zinc-500 text-[14px] mt-1">Kelola pengguna SIGAP P3M.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium text-white shadow-sm transition-colors bg-zinc-900 hover:bg-zinc-800">
                    <Plus size={16} /> Tambah User
                </button>
            </div>

            <BulkActionBar selectedCount={isAllSelected ? users.total : selectedIds.length} onDelete={handleBulkDelete} onClear={() => { setSelectedIds([]); setIsAllSelected(false); }} entityLabel="user" />

            {allChecked && users.total > data.length && !isAllSelected && (
                <div className="bg-poltekpar-navy text-white px-6 py-2 text-[13px] flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <span>Semua <b>{data.length}</b> user di halaman ini terpilih.</span>
                    <button onClick={handleSelectAllInDatabase} className="underline font-bold hover:text-poltekpar-gold transition-colors">
                        Pilih semua {users.total} user di database
                    </button>
                </div>
            )}
            {isAllSelected && (
                <div className="bg-poltekpar-gold text-poltekpar-navy px-6 py-2 text-[13px] flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <span>Semua <b>{users.total}</b> user telah terpilih.</span>
                    <button onClick={() => setIsAllSelected(false)} className="underline font-bold hover:text-red-600 transition-colors">
                        Batalkan pilihan semua
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-200/80 bg-zinc-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text" placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-zinc-200 pl-9 pr-4 py-1.5 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all placeholder-zinc-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200">
                                <CheckboxHeader allChecked={allChecked} onToggleAll={toggleAll} />
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">User</th>
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Role</th>
                                <th className="py-3 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Tanggal Dibuat</th>
                                <th className="py-3 px-6 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-400 text-[13px]">
                                        Tidak ada data yang cocok.
                                    </td>
                                </tr>
                            ) : data.map((user) => {
                                const checked = selectedIds.includes(user.id_user);
                                return (
                                <tr key={user.id_user} className={`hover:bg-zinc-50/50 transition-colors group ${checked ? 'bg-red-50/40' : ''}`}>
                                    <CheckboxCell checked={checked} onChange={() => toggleOne(user.id_user)} />
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-poltekpar-navy text-white flex items-center justify-center text-[12px] font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-zinc-900 text-[14px]">{user.name}</div>
                                                <div className="text-zinc-500 text-[13px]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${user.role === 'superadmin' ? 'bg-poltekpar-gold/20 text-poltekpar-navy border-poltekpar-gold/50' : user.role === 'admin' ? 'bg-zinc-100 text-zinc-900 border-zinc-200' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-[13px] text-zinc-500 font-medium">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(user)} className="p-1.5 rounded-md text-zinc-400 hover:text-poltekpar-primary hover:bg-zinc-100 transition-colors">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(user.id_user)} className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[12px] font-medium text-zinc-500">Menampilkan {users.from || 0} sampai {users.to || 0} dari {users.total} user</span>
                    <Pagination links={users.links} />
                </div>
            </div>

            {/* Form Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-t-xl">
                            <h3 className="text-[16px] font-bold text-zinc-900">{editId ? 'Edit Data User' : 'Tambah User Baru'}</h3>
                            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors bg-white p-1 rounded-md border shadow-sm"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[12px] font-bold text-zinc-700 block mb-1">Nama Lengkap</label>
                                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-lg border-2 border-zinc-100 px-3 py-2 text-[13px] bg-zinc-50 focus:bg-white outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-300 font-bold transition-all" />
                                {errors?.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-zinc-700 block mb-1">Alamat Email</label>
                                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-lg border-2 border-zinc-100 px-3 py-2 text-[13px] bg-zinc-50 focus:bg-white outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-300 font-medium transition-all" />
                                {errors?.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                            </div>
                            
                            <div>
                                <label className="text-[12px] font-bold text-zinc-700 block mb-1">Hak Akses (Role)</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full rounded-lg border-2 border-zinc-100 px-3 py-2 text-[13px] bg-white outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-300 font-bold transition-all appearance-none cursor-pointer">
                                    {isSuperadmin && <option value="superadmin">Superadmin</option>}
                                    <option value="admin">Admin</option>
                                    <option value="dosen">Dosen</option>
                                    <option value="masyarakat">Masyarakat</option>
                                    <option value="staff">Staff/Mahasiswa</option>
                                </select>
                            </div>

                            {form.role === 'dosen' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-[12px] font-bold text-poltekpar-primary block mb-1">NIP Dosen (Wajib)</label>
                                    <input type="text" required={form.role === 'dosen'} value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })}
                                        className="w-full rounded-lg border-2 border-poltekpar-primary/20 px-3 py-2 text-[13px] bg-poltekpar-primary/5 focus:bg-white outline-none focus:ring-4 focus:ring-poltekpar-primary/10 focus:border-poltekpar-primary font-bold transition-all text-poltekpar-navy" placeholder="Masukkan NIP..." />
                                </div>
                            )}

                            <div>
                                <label className="text-[12px] font-bold text-zinc-700 block mb-1">Kata Sandi</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} required={!editId} placeholder={editId ? '(Kosongkan jika tak diubah)' : 'Min. 8 karakter'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full rounded-lg border-2 border-zinc-100 pl-3 pr-10 py-2 text-[13px] bg-zinc-50 focus:bg-white outline-none focus:ring-4 focus:ring-zinc-100 focus:border-zinc-300 transition-all font-medium" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="submit" className="flex-1 py-2 rounded-lg text-[13px] font-extrabold text-white shadow-md bg-poltekpar-navy hover:bg-poltekpar-primary transition-all active:scale-95">
                                    {editId ? 'Simpan' : 'Buat Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Nip NOT FOUND Confirmation Modal */}
            {forceCreateModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                            <Activity size={32} />
                        </div>
                        <h3 className="text-[18px] font-bold text-zinc-900 mb-2">NIP Tidak Dikenali</h3>
                        <p className="text-[13px] text-zinc-600 leading-relaxed mb-6">
                            Sistem mendeteksi NIP <b>{form.nip}</b> belum terdaftar pada Master Data Pegawai. Apakah Anda ingin sekaligus membuat Data Pegawai baru dengan form ini?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleForceCreate} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[13px] py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/30">Ya, Buat Data Pegawai</button>
                            <button onClick={() => setForceCreateModal(false)} className="flex-1 bg-zinc-100 border-zinc-200 text-zinc-700 font-bold text-[13px] py-2.5 rounded-xl transition-all">Tutup & Periksa NIP</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog open={deleteTarget !== null} title="Hapus Akun Pengguna" message="Akun ini akan dihapus. Bila direlasikan, mungkin akan menggagalkan akses ke pengajuan historis miliknya. Lanjutkan?" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} variant="danger" />
        </AdminLayout>
    );
};

export default ManajemenUser;
