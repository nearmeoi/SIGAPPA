import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm, router } from '@inertiajs/react';
import ActionFeedbackDialog from './ActionFeedbackDialog';

interface TestimonialFormProps {
    onClose: () => void;
}

interface FormData {
    nama: string;
    jabatan: string;
    rating: number;
    ulasan: string;
}

export default function TestimonialForm({ onClose }: TestimonialFormProps) {
    const { data, setData, post, processing: inertiaProcessing, errors, setError, clearErrors, reset } = useForm<FormData>({
        nama: '',
        jabatan: '',
        rating: 0,
        ulasan: '',
    });

    const [mockProcessing, setMockProcessing] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState({ show: false, type: 'success' as const, title: '', message: '' });
    const requiredSubmissionIssues: string[] = [];

    if (!data.nama.trim()) requiredSubmissionIssues.push('Nama lengkap wajib diisi.');
    if (!data.jabatan.trim()) requiredSubmissionIssues.push('Jabatan atau peran wajib diisi.');
    if (data.rating === 0) requiredSubmissionIssues.push('Rating wajib dipilih sebelum testimoni dikirim.');
    if (!data.ulasan.trim()) requiredSubmissionIssues.push('Ulasan testimoni wajib diisi.');

    const hasStartedSubmission = Boolean(
        data.nama.trim() ||
        data.jabatan.trim() ||
        data.rating > 0 ||
        data.ulasan.trim()
    );

    const isSubmitDisabled = inertiaProcessing || mockProcessing || requiredSubmissionIssues.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        let hasErrors = false;
        if (!data.nama) { setError('nama', 'Nama wajib diisi'); hasErrors = true; }
        if (!data.jabatan) { setError('jabatan', 'Jabatan / Peran wajib diisi'); hasErrors = true; }
        if (data.rating === 0) { setError('rating', 'Silakan pilih rating (1-5 Bintang)'); hasErrors = true; }
        if (!data.ulasan) { setError('ulasan', 'Ulasan testimoni wajib diisi'); hasErrors = true; }

        if (hasErrors) {
            setFeedbackDialog({ show: true, type: 'error', title: 'Form Belum Siap Dikirim', message: 'Lengkapi seluruh field wajib sebelum mengirim testimoni.' });
            return;
        }

        setMockProcessing(true);

        const namaPemberi = data.jabatan.trim() ? `${data.nama} - ${data.jabatan}` : data.nama;

        router.post('/testimoni/public', {
            nama_pemberi: namaPemberi,
            rating: data.rating,
            pesan_ulasan: data.ulasan,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setMockProcessing(false);
                setFeedbackDialog({ show: true, type: 'success', title: 'Testimoni Berhasil Dikirim', message: 'Terima kasih, testimoni Anda sudah berhasil kami terima.' });
                reset();
            },
            onError: () => {
                setMockProcessing(false);
                setFeedbackDialog({ show: true, type: 'error', title: 'Gagal Mengirim', message: 'Terjadi kesalahan saat mengirim testimoni. Silakan coba lagi.' });
            },
        });
    };

    const renderInteractiveStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => setData('rating', i)}
                    className={`p-1 transition-all duration-200 outline-none ${
                        i <= data.rating ? 'text-amber-500 scale-110' : 'text-slate-300 scale-100'
                    } hover:text-amber-400`}
                    style={{ fontSize: '32px' }}
                    onMouseEnter={(e) => {
                        if (i > data.rating) e.currentTarget.style.color = '#fbbf24';
                    }}
                    onMouseLeave={(e) => {
                        if (i > data.rating) e.currentTarget.style.color = '#cbd5e1';
                    }}
                >
                    <i className="fa-solid fa-star"></i>
                </button>
            );
        }
        return <div className="flex gap-1.5 my-2 justify-center">{stars}</div>;
    };

    if (typeof document === 'undefined') {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-5 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Tulis Testimoni</h2>
                            <p className="text-sm text-slate-600 mt-1">Bagikan pengalaman Anda tentang program pengabdian ini.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nama */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                                errors.nama ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-poltekpar-primary focus-within:ring-2 focus-within:ring-blue-100'
                            }`}>
                                <i className="fa-solid fa-user text-slate-400"></i>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Masukkan Nama Anda"
                                    className="flex-1 outline-none text-slate-900 placeholder-slate-400"
                                />
                            </div>
                            {errors.nama && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.nama}</p>}
                        </div>

                        {/* Jabatan */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Jabatan / Peran <span className="text-red-500">*</span>
                            </label>
                            <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                                errors.jabatan ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-poltekpar-primary focus-within:ring-2 focus-within:ring-blue-100'
                            }`}>
                                <i className="fa-solid fa-id-card text-slate-400"></i>
                                <input
                                    type="text"
                                    value={data.jabatan}
                                    onChange={(e) => setData('jabatan', e.target.value)}
                                    placeholder="Cth: Anggota UMKM, Kepala Desa, Dosen..."
                                    className="flex-1 outline-none text-slate-900 placeholder-slate-400"
                                />
                            </div>
                            {errors.jabatan && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.jabatan}</p>}
                        </div>

                        {/* Rating */}
                        <div className="text-center">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Penilaian (Rating) <span className="text-red-500">*</span>
                            </label>
                            {renderInteractiveStars()}
                            {errors.rating && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.rating}</p>}
                        </div>

                        {/* Ulasan */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Ulasan / Pesan <span className="text-red-500">*</span>
                            </label>
                            <div className={`flex items-start gap-3 px-4 py-3 border rounded-xl transition-colors ${
                                errors.ulasan ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-poltekpar-primary focus-within:ring-2 focus-within:ring-blue-100'
                            }`}>
                                <i className="fa-solid fa-comment-dots text-slate-400 mt-1"></i>
                                <textarea
                                    value={data.ulasan}
                                    onChange={(e) => setData('ulasan', e.target.value)}
                                    placeholder="Ceritakan pengalaman dan kesan Anda tentang program ini..."
                                    rows={4}
                                    className="flex-1 outline-none text-slate-900 placeholder-slate-400 resize-none"
                                />
                            </div>
                            {errors.ulasan && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.ulasan}</p>}
                        </div>

                        {/* Validation Alert */}
                        {hasStartedSubmission && requiredSubmissionIssues.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
                                <div>
                                    <strong className="text-amber-900 text-sm">Testimoni belum bisa dikirim</strong>
                                    <p className="text-amber-700 text-sm mt-0.5">{requiredSubmissionIssues[0]}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={inertiaProcessing || mockProcessing}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitDisabled}
                                className={`flex-1 px-4 py-3 text-sm font-semibold text-white bg-poltekpar-primary hover:bg-poltekpar-navy rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    inertiaProcessing || mockProcessing ? 'opacity-75' : ''
                                }`}
                            >
                                {inertiaProcessing || mockProcessing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane"></i>
                                        <span>Kirim Testimoni</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ActionFeedbackDialog
                show={feedbackDialog.show}
                type={feedbackDialog.type}
                title={feedbackDialog.title}
                message={feedbackDialog.message}
                onClose={() => {
                    const wasSuccess = feedbackDialog.type === 'success';
                    setFeedbackDialog({ ...feedbackDialog, show: false });
                    if (wasSuccess) {
                        reset();
                        onClose();
                    }
                }}
            />
        </div>,
        document.body
    );
}
