import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

// Reusing the highly-polished Login CSS for absolute visual consistency
import '../../../css/login.css';

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Initialize Inertia's useForm hook for state management and validation handling
    const { data, setData, post, processing, errors, reset } = useForm<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Cleanup: Reset passwords on unmount
    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    // Handle form submission using form.post
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/register', {
            // Reset the password fields if the registration attempt fails
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="login-page">
            <Head title="Daftar Akun - P3M Poltekpar Makassar" />

            <div className="login-container">
                <div className="login-card" style={{ maxWidth: '480px' }}>
                    {/* Header Banner */}
                    <div className="login-header login-header-wide">
                        <img
                            src="https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png"
                            alt="Logo Poltekpar"
                            className="login-logo"
                        />
                        <div className="login-brand-text login-brand-text-wide">
                            <span className="brand-heading brand-heading-wide">
                                Sistem Informasi Geospasial dan Akses Pelayanan Pengabdian Kepada Masyarakat
                            </span>
                            <span className="brand-heading brand-heading-wide">({import.meta.env.VITE_APP_NAME || 'SIGAPPA'})</span>
                            <span className="brand-subheading brand-subheading-wide">Politeknik Pariwisata Makassar</span>
                        </div>
                    </div>

                    {/* Register Form Body */}
                    <div className="login-body">
                        <h1 className="login-title">Daftar Akun</h1>
                        <p className="login-subtitle">
                            Bergabunglah dengan sistem informasi P3M
                        </p>

                        <form onSubmit={submit}>

                            {/* Name Input */}
                            <div className="input-group">
                                <label htmlFor="name">Nama Lengkap</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="Nama Lengkap beserta Gelar"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'is-invalid' : ''}
                                        autoComplete="name"
                                        required
                                        autoFocus
                                    />
                                    <i className="fa-regular fa-user input-icon"></i>
                                </div>
                                {errors.name && (
                                    <span className="invalid-feedback">{errors.name}</span>
                                )}
                            </div>

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
                                        autoComplete="email"
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
                                        placeholder="Minimal 8 karakter"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={errors.password ? 'is-invalid' : ''}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <i className="fa-solid fa-lock input-icon"></i>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password visibility"
                                    >
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="invalid-feedback">{errors.password}</span>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div className="input-group" style={{ marginBottom: '32px' }}>
                                <label htmlFor="password_confirmation">Konfirmasi Kata Sandi</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        placeholder="Ketik ulang kata sandi"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className={errors.password_confirmation ? 'is-invalid' : ''}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <i className="fa-solid fa-shield-halved input-icon"></i>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <span className="invalid-feedback">{errors.password_confirmation}</span>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button type="submit" className="btn-login" disabled={processing}>
                                {processing ? (
                                    <>
                                        Memproses <i className="fa-solid fa-spinner fa-spin"></i>
                                    </>
                                ) : (
                                    <>
                                        Daftar Akun <i className="fa-solid fa-user-plus"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-divider"></div>

                        {/* Login Prompt Link */}
                        <div className="register-prompt">
                            Sudah memiliki akun?
                            <Link href="/login" className="register-link">
                                Masuk di sini
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
