import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ActionFeedbackDialog from '@/Components/ActionFeedbackDialog';
import { FeedbackDialogProps } from '@/types';

import '../../../css/login.css';

interface PkmOption {
    id: string;
    name: string;
    location: string;
}

const pkmOptions: PkmOption[] = [
    { id: '1', name: 'Pemberdayaan UMKM Kripik Pisang', location: 'Bira, Tamalanrea' },
    { id: '2', name: 'Edukasi Sanitasi Lingkungan', location: 'Tamalanrea Indah, Makassar' },
    { id: '3', name: 'Pelatihan Pemasaran Digital Desa Wisata', location: 'Maros, Sulawesi Selatan' },
];

interface FormData {
    pkmId: string;
    linkDokumentasi: string;
    linkLaporan: string;
}

export default function SubmitDokumentasiLaporan(): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        pkmId: '',
        linkDokumentasi: '',
        linkLaporan: '',
    });
    const [pkmQuery, setPkmQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialogProps>({ show: false, type: 'success', title: '', message: '' });
    const [processing, setProcessing] = useState(false);
    const requiredSubmissionIssues: string[] = [];

    if (!formData.pkmId) requiredSubmissionIssues.push('Kegiatan PKM wajib dipilih terlebih dahulu.');
    if (!formData.linkDokumentasi.trim()) requiredSubmissionIssues.push('Link dokumentasi wajib diisi.');
    if (!formData.linkLaporan.trim()) requiredSubmissionIssues.push('Link laporan wajib diisi.');
    const hasStartedSubmission = Boolean(
        formData.pkmId ||
        pkmQuery.trim() ||
        formData.linkDokumentasi.trim() ||
        formData.linkLaporan.trim()
    );

    const isSubmitDisabled = processing || requiredSubmissionIssues.length > 0;

    const filteredPkm = pkmOptions.filter((pkm) =>
        pkm.name.toLowerCase().includes(pkmQuery.toLowerCase()) ||
        pkm.location.toLowerCase().includes(pkmQuery.toLowerCase())
    );

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handlePkmQueryChange = (value: string) => {
        setPkmQuery(value);
        setFormData((prev) => ({ ...prev, pkmId: '' }));
        setErrors((prev) => ({ ...prev, pkmId: '' }));
        setIsSearchOpen(true);
    };

    const handlePkmSelect = (pkm: PkmOption) => {
        setPkmQuery(pkm.name);
        setFormData((prev) => ({ ...prev, pkmId: pkm.id }));
        setErrors((prev) => ({ ...prev, pkmId: '' }));
        setIsSearchOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nextErrors: Partial<Record<keyof FormData, string>> = {};
        if (!formData.pkmId) {
            nextErrors.pkmId = 'Kegiatan PKM belum dipilih.';
        }
        if (!formData.linkDokumentasi.trim()) {
            nextErrors.linkDokumentasi = 'Link dokumentasi belum diisi.';
        }
        if (!formData.linkLaporan.trim()) {
            nextErrors.linkLaporan = 'Link laporan belum diisi.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setProcessing(true);
        window.setTimeout(() => {
            setProcessing(false);
            setFeedbackDialog({
                show: true,
                type: 'success',
                title: 'Link Berhasil Dikirim',
                message: 'Tautan dokumentasi dan laporan kegiatan PKM sudah berhasil dikirim untuk diperiksa lebih lanjut.',
            });
            setFormData({
                pkmId: '',
                linkDokumentasi: '',
                linkLaporan: '',
            });
            setPkmQuery('');
        }, 900);
    };

    return (
        <div className="login-page">
            <Head title="Submit Dokumentasi & Laporan - P3M Poltekpar Makassar" />

            <div className="login-container" style={{ maxWidth: '520px' }}>
                <div className="login-card">
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

                    <div className="login-body">
                        <h1 className="login-title">Submit Dokumentasi & Laporan</h1>
                        <p className="login-subtitle">Lengkapi form berikut untuk mengirim tautan dokumentasi kegiatan PKM.</p>

                        <form onSubmit={handleSubmit} noValidate>
                            {(Object.values(errors).some(Boolean) || (hasStartedSubmission && requiredSubmissionIssues.length > 0)) && (
                                <div className="auth-error-box" aria-live="assertive">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    <span>{requiredSubmissionIssues[0] ?? 'Form belum bisa dikirim. Masih ada kolom yang belum diisi, silakan lengkapi terlebih dahulu.'}</span>
                                </div>
                            )}

                            <div className="input-group">
                                    <label htmlFor="pkmSearch">Pilih Kegiatan PKM</label>
                                    <div className="input-wrapper input-wrapper-search">
                                        <input
                                            type="text"
                                            id="pkmSearch"
                                            placeholder="Cari nama kegiatan PKM..."
                                            value={pkmQuery}
                                            onChange={(e) => handlePkmQueryChange(e.target.value)}
                                            onFocus={() => setIsSearchOpen(true)}
                                            onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 150)}
                                            className={errors.pkmId ? 'is-invalid' : ''}
                                            autoComplete="off"
                                            required
                                        />
                                        <i className="fa-solid fa-magnifying-glass input-icon"></i>
                                        {pkmQuery && (
                                            <button
                                                type="button"
                                                className="input-clear-button"
                                                onClick={() => {
                                                    setPkmQuery('');
                                                    setFormData((prev) => ({ ...prev, pkmId: '' }));
                                                    setIsSearchOpen(false);
                                                }}
                                                aria-label="Hapus pencarian"
                                            >
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        )}
                                    </div>
                                    {isSearchOpen && pkmQuery && (
                                        <div className="auth-search-dropdown">
                                            {filteredPkm.length > 0 ? (
                                                filteredPkm.map((pkm) => (
                                                    <button
                                                        type="button"
                                                        key={pkm.id}
                                                        className="auth-search-item"
                                                        onMouseDown={() => handlePkmSelect(pkm)}
                                                    >
                                                        <span className="auth-search-title">{pkm.name}</span>
                                                        <span className="auth-search-meta">{pkm.location}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="auth-search-empty">Kegiatan PKM tidak ditemukan.</div>
                                            )}
                                        </div>
                                    )}
                                    {errors.pkmId && <span className="invalid-feedback">{errors.pkmId}</span>}
                                    <span className="form-helper-text">Wajib diisi. Ketik nama kegiatan lalu pilih hasil yang sesuai.</span>
                            </div>

                            <div className="input-group">
                                    <label htmlFor="linkDokumentasi">Link Dokumentasi</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="url"
                                            id="linkDokumentasi"
                                            placeholder="https://drive.google.com/..."
                                            value={formData.linkDokumentasi}
                                            onChange={(e) => handleChange('linkDokumentasi', e.target.value)}
                                            className={errors.linkDokumentasi ? 'is-invalid' : ''}
                                            required
                                        />
                                        <i className="fa-solid fa-link input-icon"></i>
                                    </div>
                                    <span className="form-helper-text">Wajib diisi. Masukkan link dokumentasi kegiatan yang dapat diakses oleh reviewer.</span>
                                    {errors.linkDokumentasi && <span className="invalid-feedback">{errors.linkDokumentasi}</span>}
                            </div>

                            <div className="input-group" style={{ marginBottom: '28px' }}>
                                    <label htmlFor="linkLaporan">Link Laporan</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="url"
                                            id="linkLaporan"
                                            placeholder="https://drive.google.com/..."
                                            value={formData.linkLaporan}
                                            onChange={(e) => handleChange('linkLaporan', e.target.value)}
                                            className={errors.linkLaporan ? 'is-invalid' : ''}
                                            required
                                        />
                                        <i className="fa-solid fa-link input-icon"></i>
                                    </div>
                                    <span className="form-helper-text">Wajib diisi. Masukkan link laporan akhir kegiatan.</span>
                                    {errors.linkLaporan && <span className="invalid-feedback">{errors.linkLaporan}</span>}
                            </div>

                            <button type="submit" className="btn-login" disabled={isSubmitDisabled}>
                                {processing ? (
                                    <>
                                        Memproses <i className="fa-solid fa-spinner fa-spin"></i>
                                    </>
                                ) : (
                                    <>
                                        Kirim Link <i className="fa-solid fa-paper-plane"></i>
                                    </>
                                )}
                            </button>
                        </form>

                    </div>
                </div>

                <Link href="/" className="back-to-home">
                    <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
                </Link>
            </div>

            <ActionFeedbackDialog
                show={feedbackDialog.show}
                type={feedbackDialog.type}
                title={feedbackDialog.title}
                message={feedbackDialog.message}
                onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })}
            />
        </div>
    );
}
