import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

// Import Specific Styling for Login
import '../../../css/login.css';

interface LoginFormData {
    email: string;
    password: string;
    remember: boolean;
    login_source: string;
}

export default function Login() {
    const { props } = usePage<PageProps & { flash?: { success?: string | null; error?: string | null } }>();
    const flash = props.flash ?? {};
    const [showPassword, setShowPassword] = useState(false);

    // Initialize Inertia's useForm hook for state management and validation handling
    const { data, setData, post, processing, errors, reset } = useForm<LoginFormData>({
        email: '',
        password: '',
        remember: false,
        login_source: 'general',
    });

    // Handle form submission using form.post
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/login', {
            // Reset the password field if the login attempt fails
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="login-page">
            <Head title="Masuk Sisfo - P3M Poltekpar Makassar" />

            <div className="login-container">
                <div className="login-card">
                    {/* Header Banner */}
                    <div className="login-header login-header-wide">
                        <img
                            src="https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png"
                            alt="Logo Poltekpar"
                            className="login-logo"
                        />
                        <div className="login-brand-text login-brand-text-wide">
                            <span className="brand-heading brand-heading-wide">
                                Sistem Informasi Geospasial dan Akses Pelayanan Pengabdian ({import.meta.env.VITE_APP_NAME || 'SIGAPPA'})
                            </span>
                            <span className="brand-subheading brand-subheading-wide">Politeknik Pariwisata Makassar</span>
                        </div>
                    </div>

                    {/* Login Form Body */}
                    <div className="login-body">
                        <h1 className="login-title">Selamat Datang Kembali</h1>
                        <p className="login-subtitle">Silakan masuk menggunakan Akun Anda</p>

                        {flash.error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-800">
                                <div className="font-semibold">Akses login tidak sesuai.</div>
                                <div className="mt-1 text-red-700">{flash.error}</div>
                            </div>
                        )}

                        <form onSubmit={submit}>
                            {/* Email Input */}
                            <div className="input-group">
                                <label htmlFor="email">Alamat Email</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="nama@poltekparmakassar.ac.id"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={errors.email ? 'is-invalid' : ''}
                                        autoComplete="username"
                                        required
                                    />
                                    <i className="fa-regular fa-envelope input-icon"></i>
                                </div>
                                {errors.email && (
                                    <span className="invalid-feedback">{errors.email}</span>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="input-group">
                                <label htmlFor="password">Kata Sandi</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={errors.password ? 'is-invalid' : ''}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <i className="fa-solid fa-lock input-icon"></i>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                        aria-pressed={showPassword}
                                        title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                    >
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="invalid-feedback">{errors.password}</span>
                                )}
                            </div>

                            {/* Form Options (Remember Me & Forgot Pass) */}
                            <div className="form-options">
                                <label className="custom-checkbox" htmlFor="remember">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                    <span>Ingat saya</span>
                                </label>
                                <Link href="#" className="forgot-link">
                                    Lupa sandi?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" className="btn-login" disabled={processing}>
                                {processing ? (
                                    <>
                                        Memproses <i className="fa-solid fa-spinner fa-spin"></i>
                                    </>
                                ) : (
                                    <>
                                        Masuk ke Sistem <i className="fa-solid fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-divider-text">ATAU</div>

                        <Link
                            href="/login/dosen"
                            className="btn-login group w-full text-center"
                            style={{
                                background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                                textDecoration: 'none',
                                marginTop: '12px'
                            }}
                        >
                            <i className="fa-solid fa-user-tie"></i>
                            Daftar sebagai Dosen <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </Link>

                        <div className="login-divider"></div>

                        {/* Registration Prompt Link */}
                        <div className="register-prompt">
                            Belum memiliki akun?
                            {/* The register route is a placeholder as requested */}
                            <Link href="/register" className="register-link">
                                Daftar sekarang
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Back to Home Link */}
                <Link href="/" className="back-to-home">
                    <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
