import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DefaultLayout from '@/Layouts/DefaultLayout';
import { User, Mail, Lock, ShieldCheck, KeyRound, Eye, EyeOff, ArrowLeft, BadgeCheck, Briefcase } from 'lucide-react';

interface UserData {
    id_user: number;
    name: string;
    email: string;
    role: string;
}

interface PegawaiData {
    nip: string | null;
    jabatan: string | null;
    posisi: string | null;
}

interface EditProfileProps {
    userData: UserData;
    pegawaiData: PegawaiData | null;
}

export default function EditProfile({ userData, pegawaiData }: EditProfileProps) {
    const { props } = usePage();
    const flash = (props as any).flash || {};

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(!!flash.success);

    const { data, setData, put, processing, errors, reset } = useForm({
        name: userData.name,
        email: userData.email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile/edit', {
            preserveScroll: true,
            onSuccess: () => {
                reset('password', 'password_confirmation');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 4000);
            },
        });
    };

    const isAdminRole = ['admin', 'superadmin', 'secret_account'].includes(userData.role);
    const isDosen = userData.role === 'dosen';

    const initial = userData.name?.charAt(0)?.toUpperCase() || '?';

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'superadmin': return 'bg-purple-100 text-purple-700';
            case 'admin': return 'bg-amber-100 text-amber-700';
            case 'dosen': return 'bg-blue-100 text-blue-700';
            case 'secret_account': return 'bg-slate-800 text-slate-200';
            default: return 'bg-emerald-100 text-emerald-700';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'superadmin': return 'Super Admin';
            case 'admin': return 'Administrator';
            case 'dosen': return 'Dosen';
            case 'secret_account': return 'Developer';
            default: return 'Masyarakat';
        }
    };

    const formContent = (
        <>
            <Head title="Edit Profil" />

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-3 fade-in duration-300">
                    <div className="flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 font-bold text-sm">
                        <BadgeCheck size={18} />
                        Profil berhasil diperbarui!
                        <button onClick={() => setShowSuccess(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
                    </div>
                </div>
            )}

            <div className="py-8 px-6 sm:px-10 lg:px-16">
                {/* Back button */}
                {!isAdminRole && (
                    <a href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-poltekpar-primary font-medium text-sm mb-6 transition-colors group">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 group-hover:border-poltekpar-primary group-hover:bg-poltekpar-primary/5 transition-colors">
                            <ArrowLeft size={14} />
                        </span>
                        Kembali
                    </a>
                )}

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-800">Edit Profil</h1>
                    <p className="text-sm text-slate-500 mt-1">Perbarui informasi akun Anda</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 flex items-center gap-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-poltekpar-primary/20 shrink-0">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-900 truncate">{userData.name}</h2>
                            <p className="text-sm text-slate-500 truncate">{userData.email}</p>
                            <span className={`inline-block mt-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${getRoleBadgeStyle(userData.role)}`}>
                                {getRoleLabel(userData.role)}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Informasi Pribadi */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><User size={14} /></span>
                                Informasi Pribadi
                            </h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-colors focus:bg-white focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/10 ${errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
                                        placeholder="Nama lengkap beserta gelar"
                                        required
                                    />
                                </div>
                                {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Alamat Email <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-colors focus:bg-white focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/10 ${errors.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
                                        placeholder="email@contoh.com"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section: Info Dosen (read-only) */}
                    {isDosen && pegawaiData && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><Briefcase size={14} /></span>
                                    Informasi Kepegawaian
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        NIP <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">(tidak dapat diubah)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={pegawaiData.nip || '-'}
                                            readOnly
                                            className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Jabatan <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">(tidak dapat diubah)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Briefcase size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={pegawaiData.jabatan || pegawaiData.posisi || '-'}
                                            readOnly
                                            className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-info text-[10px]"></i>
                                    Data kepegawaian hanya dapat diubah melalui administrator.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Section: Ubah Kata Sandi */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><KeyRound size={14} /></span>
                                Ubah Kata Sandi
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1 ml-9">Kosongkan jika tidak ingin mengubah kata sandi</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-colors focus:bg-white focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/10 ${errors.password ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
                                        placeholder="Minimal 8 karakter"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none transition-colors focus:bg-white focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/10"
                                        placeholder="Ketik ulang kata sandi baru"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-poltekpar-primary hover:bg-poltekpar-navy text-white font-black rounded-2xl shadow-lg shadow-poltekpar-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                        {processing ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <BadgeCheck size={18} />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </form>
            </div>
        </>
    );

    // Dynamic layout selection based on role
    if (isAdminRole) {
        return (
            <AdminLayout title="Edit Profil">
                {formContent}
            </AdminLayout>
        );
    }

    return (
        <DefaultLayout>
            {formContent}
        </DefaultLayout>
    );
}
