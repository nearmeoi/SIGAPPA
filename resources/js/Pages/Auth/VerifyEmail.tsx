import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ActionFeedbackDialog from '@/Components/ActionFeedbackDialog';
import type { PageProps } from '@/types';

import '../../../css/login.css';
import '../../../css/verify-email.css';

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps): JSX.Element {
    const { props } = usePage<PageProps & { flash?: { success?: string | null; error?: string | null } }>();
    const flash = props.flash ?? {};
    const authUser = props.auth?.user ?? null;
    const isVerified = Boolean(authUser?.email_verified_at);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const { post, processing } = useForm({});

    useEffect(() => {
        if (flash.success) {
            setShowSuccessDialog(true);
        }
    }, [flash.success]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <div className="login-page">
            <Head title="Verifikasi Email - P3M Poltekpar Makassar" />

            <ActionFeedbackDialog
                show={showSuccessDialog}
                type="success"
                title={isVerified ? 'Email Berhasil Diverifikasi' : 'Akun Berhasil Terdaftar'}
                message={flash.success ?? ''}
                actionLabel="Lanjutkan"
                onClose={() => setShowSuccessDialog(false)}
            />

            <div className="login-container">
                <div className="login-card" style={{ maxWidth: '480px' }}>
                    <div className="login-header">
                        <img
                            src="https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png"
                            alt="Logo Poltekpar"
                            className="login-logo"
                        />
                        <div className="login-brand-text">
                            <span className="brand-line">PUSAT PENELITIAN DAN</span>
                            <span className="brand-line">PENGABDIAN MASYARAKAT</span>
                            <span className="brand-line">POLITEKNIK PARIWISATA MAKASSAR</span>
                            <span className="brand-subline">Centre for Marine Tourism</span>
                        </div>
                    </div>

                    <div className="login-body verify-email-body">
                        <div className="verify-icon-wrapper">
                            <div className="verify-icon-circle">
                                <i className={`${isVerified ? 'fa-solid fa-circle-check' : 'fa-regular fa-envelope-open'} verify-icon`}></i>
                            </div>
                            <div className="verify-icon-dot dot-1"></div>
                            <div className="verify-icon-dot dot-2"></div>
                            <div className="verify-icon-dot dot-3"></div>
                        </div>

                        <h1 className="login-title" style={{ textAlign: 'center' }}>
                            {isVerified ? 'Email Sudah Terverifikasi' : 'Verifikasi Email Anda'}
                        </h1>
                        <p className="login-subtitle verify-subtitle">
                            {isVerified
                                ? 'Akun dosen Anda sudah aktif. Anda bisa melanjutkan penggunaan portal dengan email institusi yang telah diverifikasi.'
                                : `Akun dosen berhasil dibuat. Kami telah mengirim tautan verifikasi ke ${authUser?.email ?? 'email Anda'}. Silakan buka email tersebut untuk mengaktifkan akun.`}
                        </p>

                        {!isVerified && (
                            <div className="verify-info-box">
                                <div className="verify-info-box__icon">
                                    <i className="fa-solid fa-envelope-circle-check"></i>
                                </div>
                                <div className="verify-info-box__content">
                                    <strong>Verifikasi email wajib dilakukan terlebih dahulu.</strong>
                                    <span>
                                        Cek inbox atau folder spam untuk email verifikasi yang sudah kami kirim. Setelah email terverifikasi, akun dosen baru bisa digunakan.
                                    </span>
                                </div>
                            </div>
                        )}

                        {flash.error && (
                            <div className="verify-warning-box">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{flash.error}</span>
                            </div>
                        )}

                        {status === 'verification-link-sent' && (
                            <div className="verify-success-alert">
                                <i className="fa-solid fa-circle-check"></i>
                                <span>
                                    Tautan verifikasi baru telah dikirim ke alamat email yang Anda gunakan saat mendaftar.
                                </span>
                            </div>
                        )}

                        {!isVerified ? (
                            <form onSubmit={submit}>
                                <button
                                    type="submit"
                                    className="btn-login verify-btn-resend"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            Mengirim <i className="fa-solid fa-spinner fa-spin"></i>
                                        </>
                                    ) : (
                                        <>
                                            Kirim Ulang Email Verifikasi <i className="fa-solid fa-paper-plane"></i>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <Link href="/" className="btn-login verify-btn-resend">
                                Lanjut ke {import.meta.env.VITE_APP_NAME || 'SIGAPPA'} <i className="fa-solid fa-arrow-right"></i>
                            </Link>
                        )}

                        <div className="login-divider"></div>

                        {!isVerified && (
                            <div className="verify-logout-section">
                                <p className="verify-logout-text">
                                    Salah memasukkan email?
                                </p>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="verify-btn-logout"
                                >
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                    Keluar &amp; Daftar Ulang
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <Link href="/" className="back-to-home">
                    <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
