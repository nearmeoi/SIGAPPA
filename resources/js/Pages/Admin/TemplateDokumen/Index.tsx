import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { FileText, UploadCloud, FileDown, CheckCircle } from 'lucide-react';

interface TemplateProps {
    templates: Record<string, { id: number, jenis: string, nama_file: string, file_path: string, updated_at: string }>;
}

export default function Index({ templates }: TemplateProps) {
    return (
        <AdminLayout title="Atur Template Dokumen">
            <Head title="Admin - Atur Template Dokumen" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Surat Permohonan */}
                <TemplateUploaderCard
                    title="Template Surat Permohonan"
                    jenis="surat_permohonan"
                    templateData={templates['surat_permohonan']}
                    description="Upload template surat permohonan yang akan diunduh oleh dosen atau masyarakat saat mengajukan PKM."
                />

                {/* Card Proposal */}
                <TemplateUploaderCard
                    title="Template Proposal"
                    jenis="proposal"
                    templateData={templates['proposal']}
                    description="Upload template proposal kegiatan PKM sebagai format standar untuk pengajuan."
                />

                {/* Card Panduan */}
                <TemplateUploaderCard
                    title="Panduan Penggunaan"
                    jenis="panduan"
                    templateData={templates['panduan']}
                    description="Upload file PDF Panduan Penggunaan yang akan dilihat oleh user (masyarakat & dosen) di halaman menu Panduan."
                />
            </div>
        </AdminLayout>
    );
}

function TemplateUploaderCard({ title, jenis, templateData, description }: { title: string, jenis: string, templateData: any, description: string }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        jenis: jenis,
        file: null as File | null,
    });

    const [dragActive, setDragActive] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setData('file', e.target.files[0]);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/templates', {
            preserveScroll: true,
            onSuccess: () => setData('file', null),
        });
    };

    const confirmDelete = () => {
        router.delete(`/admin/templates/${jenis}`, {
            onFinish: () => setShowConfirm(false)
        });
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20 relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-poltekpar-primary/10 rounded-2xl flex items-center justify-center text-poltekpar-primary">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{title}</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{jenis.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                {description}
            </p>

            {/* Existing File Status */}
            {templateData ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="text-emerald-500 bg-emerald-100 p-2.5 rounded-xl">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-emerald-800 line-clamp-1">{templateData.nama_file}</h3>
                                <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-widest mt-0.5">Template Aktif</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a href={`/storage/${templateData.file_path}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-md shadow-emerald-600/20">
                            <FileDown size={16} /> Unduh
                        </a>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setShowConfirm(true);
                            }}
                            className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-[13px] font-bold transition-all shadow-sm"
                        >
                            <i className="fa-solid fa-trash-can"></i> Hapus
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center mb-6">
                        <div className="text-amber-600 text-sm font-bold">
                            Belum ada template yang diunggah.
                        </div>
                    </div>
                    {/* Upload Area */}
                    <form onSubmit={submit} className="flex flex-col gap-4 mb-2">
                        <div
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragActive ? 'border-poltekpar-primary bg-poltekpar-primary/5' : 'border-slate-300 hover:border-slate-400'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <UploadCloud className={`mx-auto mb-3 ${dragActive ? 'text-poltekpar-primary' : 'text-slate-400'}`} size={32} />
                            <div className="text-sm font-bold text-slate-600 flex flex-col items-center gap-3">
                                {data.file ? (
                                    <span className="text-poltekpar-primary">{data.file.name}</span>
                                ) : (
                                    <>
                                        <span>Tarik file ke sini, atau</span>
                                        <label className="bg-poltekpar-primary/10 border border-poltekpar-primary/20 text-poltekpar-primary px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-poltekpar-primary/20 cursor-pointer transition-all">
                                            <input type="file" className="hidden" onChange={handleChange} accept=".doc,.docx,.pdf" />
                                            Pilih File
                                        </label>
                                    </>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-3">Mendukung .PDF, .DOC, .DOCX (Max 10MB)</p>
                            {errors.file && <p className="text-red-500 text-xs font-bold mt-2">{errors.file}</p>}
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={!data.file || processing}
                                className="bg-poltekpar-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Template'}
                            </button>
                        </div>
                        {progress && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-poltekpar-primary h-1.5 rounded-full transition-all" style={{ width: `${progress.percentage}%` }}></div>
                            </div>
                        )}
                    </form>
                </>
            )}

            <ConfirmDialog 
                open={showConfirm} 
                title="Hapus Template" 
                message={`Yakin ingin menghapus template ${title.toLowerCase()}? Tindakan ini tidak dapat dibatalkan.`} 
                onConfirm={confirmDelete} 
                onCancel={() => setShowConfirm(false)} 
                variant="danger" 
            />
        </div>
    );
}
