import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import type { PageProps } from '@/types';

// Import Specific Styling for Login
import '../../../css/login.css';

type AuthStep = 'nip-entry' | 'form-expand';
type AuthMode = 'login' | 'register';

interface LoginDosenPortalProps {
    initialNip?: string | null;
    autoCheck?: boolean;
}

export default function LoginDosenPortal({ initialNip = null, autoCheck = false }: LoginDosenPortalProps) {
    const { props } = usePage<PageProps & { flash?: { success?: string | null; error?: string | null } }>();
    const flash = props.flash ?? {};
    const [step, setStep] = useState<AuthStep>('nip-entry');
    const [mode, setMode] = useState<AuthMode>('login');
    const [nipStatus, setNipStatus] = useState<{
        status: 'idle' | 'checking' | 'registered' | 'claimable' | 'not_found' | 'error';
        message?: string;
    }>({ status: 'idle' });
    const [hasAutoChecked, setHasAutoChecked] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        nip: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        remember: false,
        login_source: 'dosen',
    });

    const verifyNip = async (nipValue: string) => {
        if (!nipValue) return;
        setNipStatus({ status: 'checking' });

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await axios.post('/check-nip', { nip: nipValue }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || ''
                }
            });
            const result = response.data;

            if (result.status === 'registered') {
                setNipStatus({ status: 'registered', message: 'Akun Anda telah terdaftar sebelumnya. Mengalihkan ke halaman login...' });
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2500);
            } else if (result.status === 'claimable') {
                setNipStatus({ status: 'claimable', message: result.message });
                setMode('register');
                clearErrors();
                setData((prev) => ({
                    ...prev,
                    nip: nipValue,
                    name: result.name,
                    email: '',
                    password: '',
                    password_confirmation: '',
                }));
                setStep('form-expand');
            } else if (result.status === 'not_found') {
                setNipStatus({ status: 'not_found', message: result.message });
                setMode('register');
                clearErrors();
                setData((prev) => ({
                    ...prev,
                    nip: nipValue,
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                }));
                setStep('form-expand');
            } else {
                setNipStatus({ status: 'error', message: result.message });
                setStep('nip-entry');
            }
        } catch (error) {
            setNipStatus({ status: 'error', message: 'Terjadi kesalahan sistem.' });
        }
    };

    const handleNipCheck = async () => {
        await verifyNip(data.nip);
    };

    useEffect(() => {
        if (!initialNip || !autoCheck || hasAutoChecked) {
            return;
        }

        const sanitizedNip = initialNip.replace(/\D/g, '');
        if (!sanitizedNip) {
            setHasAutoChecked(true);
            return;
        }

        setData((prev) => ({ ...prev, nip: sanitizedNip }));
        setHasAutoChecked(true);
        void verifyNip(sanitizedNip);
    }, [autoCheck, hasAutoChecked, initialNip]);

    const validateEmailDomain = () => {
        if (!data.email.endsWith('@poltekparmakassar.ac.id')) {
            return false;
        }
        return true;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmailDomain()) {
            return;
        }

        const endpoint = mode === 'login' ? '/login' : '/register?role=dosen&source=portal-dosen';
        post(endpoint, {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="login-page">
            <Head title="Portal Dosen - P3M Poltekpar Makassar" />

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header login-header-wide">
                        <img
                            src="https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png"
                            alt="Logo Poltekpar"
                            className="login-logo"
                        />
                        <div className="login-brand-text login-brand-text-wide">
                            <span className="brand-heading brand-heading-wide">
                                Portal Dosen & Staff {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}
                            </span>
                            <span className="brand-subheading brand-subheading-wide">Politeknik Pariwisata Makassar</span>
                        </div>
                    </div>

                    <div className="login-body">
                        <div className="role-badge role-badge-dosen">
                            <i className="fa-solid fa-user-tie"></i> Khusus Dosen
                        </div>
                        <h1 className="login-title">Verifikasi Identitas</h1>
                        <p className="login-subtitle">Masukkan NIP Anda untuk melanjutkan akses portal.</p>

                        {flash.error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-800">
                                <div className="font-semibold">Akses login tidak sesuai.</div>
                                <div className="mt-1 text-red-700">{flash.error}</div>
                            </div>
                        )}

                        {flash.success && (
                            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] text-emerald-800">
                                <div className="font-semibold">Akun dosen berhasil dibuat.</div>
                                <div className="mt-1 text-emerald-700">{flash.success}</div>
                            </div>
                        )}

                        <form onSubmit={submit}>
                            {/* NIP Input */}
                            <div className="input-group">
                                <label htmlFor="nip">NIP Pegawai</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="nip"
                                        name="nip"
                                        placeholder="Masukkan NIP Anda"
                                        value={data.nip}
                                        onChange={(e) => {
                                            setData('nip', e.target.value.replace(/\D/g, ''));
                                            if (step === 'form-expand') {
                                                setStep('nip-entry');
                                                setNipStatus({ status: 'idle' });
                                            }
                                        }}
                                        inputMode="numeric"
                                        disabled={nipStatus.status === 'checking'}
                                        required
                                    />
                                    <i className="fa-solid fa-id-card input-icon"></i>
                                    {step === 'nip-entry' && (
                                        <button
                                            type="button"
                                            onClick={handleNipCheck}
                                            disabled={!data.nip || nipStatus.status === 'checking'}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${!data.nip ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                            title="Cek ketersediaan NIP"
                                        >
                                            {nipStatus.status === 'checking' ? <i className="fa-solid fa-spinner fa-spin"></i> : 'CEK NIP'}
                                        </button>
                                    )}
                                </div>
                                {nipStatus.message && (
                                    <div className={`nip-check-badge mt-2 ${nipStatus.status === 'error' || nipStatus.status === 'not_found' ? 'error' : ''}`}>
                                        <i className={`fa-solid ${nipStatus.status === 'error' || nipStatus.status === 'not_found' ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
                                        {nipStatus.message}
                                    </div>
                                )}
                                {errors.nip && <span className="invalid-feedback">{errors.nip}</span>}
                            </div>

                            {/* Expanded Form Section */}
                            <div className={`expanded-form-container ${step === 'form-expand' ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Informasi Akun {mode === 'register' ? 'Baru' : ''}
                                    </div>

                                    {mode === 'register' && nipStatus.status === 'not_found' && (
                                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
                                            NIP ini belum memiliki akun dosen. Lengkapi form berikut untuk membuat akun baru dengan NIP tersebut.
                                        </div>
                                    )}

                                    {/* Name Field */}
                                    <div className="input-group">
                                        <label htmlFor="name">Nama Lengkap</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                readOnly={mode === 'login' || nipStatus.status === 'claimable'}
                                                className={mode === 'login' || nipStatus.status === 'claimable' ? 'bg-white/50' : ''}
                                                required
                                            />
                                            <i className="fa-solid fa-user input-icon"></i>
                                        </div>
                                        {errors.name && <span className="invalid-feedback">{errors.name}</span>}
                                    </div>

                                    {/* Email Field */}
                                    <div className="input-group">
                                        <label htmlFor="email">Email Institusi</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                id="email"
                                                placeholder="nama@poltekparmakassar.ac.id"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                readOnly={mode === 'login'}
                                                className={mode === 'login' ? 'bg-white/50' : ''}
                                                required
                                            />
                                            <i className="fa-solid fa-envelope input-icon"></i>
                                        </div>
                                        {mode === 'register' && !data.email.endsWith('@poltekparmakassar.ac.id') && data.email.length > 5 && (
                                            <span className="invalid-feedback">Wajib menggunakan domain @poltekparmakassar.ac.id</span>
                                        )}
                                        {errors.email && <span className="invalid-feedback">{errors.email}</span>}
                                    </div>

                                    {/* Password Field */}
                                    <div className="input-group">
                                        <label htmlFor="password">Kata Sandi</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="password"
                                                id="password"
                                                placeholder="••••••••"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                            />
                                            <i className="fa-solid fa-lock input-icon"></i>
                                        </div>
                                        {errors.password && <span className="invalid-feedback">{errors.password}</span>}
                                    </div>

                                    {mode === 'register' && (
                                        <div className="input-group">
                                            <label htmlFor="password_confirmation">Konfirmasi Kata Sandi</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="password"
                                                    id="password_confirmation"
                                                    placeholder="••••••••"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    required
                                                />
                                                <i className="fa-solid fa-shield-check input-icon"></i>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-login mt-4"
                                        disabled={processing || (mode === 'register' && !data.email.endsWith('@poltekparmakassar.ac.id'))}
                                    >
                                        {processing ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Dosen'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="login-divider"></div>

                        <div className="register-prompt">
                            Bukan Dosen?
                            <Link href="/login" className="register-link">
                                Kembali ke Login Umum
                            </Link>
                        </div>
                    </div>
                </div>

                <Link href="/" className="back-to-home">
                    <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
                </Link>
            </div>

            {/* Modal Redirect */}
            {nipStatus.status === 'registered' && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center scale-100 transition-transform duration-300">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
                            <i className="fa-solid fa-user-check"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Akun Ditemukan</h3>
                        <p className="text-[13px] font-medium text-slate-500 mb-6 leading-relaxed">
                            NIP Anda telah terhubung dengan sebuah akun yang aktif. Anda akan segera dialihkan ke halaman login utama.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-3 rounded-xl">
                            <i className="fa-solid fa-spinner fa-spin text-blue-500"></i> Mengalihkan...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
