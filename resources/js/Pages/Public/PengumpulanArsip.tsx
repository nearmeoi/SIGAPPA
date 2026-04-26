import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer';

interface Props {
    namaKegiatan?: string;
    kode: string;
}

export default function PengumpulanArsip({ namaKegiatan = 'NAMA KEGIATAN PKM', kode }: Props) {
    const { data, setData, post, processing } = useForm({
        laporan: '',
        dokumentasi: '',
        dokumen_lainnya: [{ nama_dokumen: '', url_dokumen: '' }]
    });

    const [submitted, setSubmitted] = useState(false);

    const handleAddLink = () => {
        setData('dokumen_lainnya', [...data.dokumen_lainnya, { nama_dokumen: '', url_dokumen: '' }]);
    };

    const handleLinkChange = (index: number, field: 'nama_dokumen' | 'url_dokumen', value: string) => {
        const updated = [...data.dokumen_lainnya];
        updated[index][field] = value;
        setData('dokumen_lainnya', updated);
    };
    
    const handleRemoveLink = (index: number) => {
        setData('dokumen_lainnya', data.dokumen_lainnya.filter((_, i) => i !== index));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(kode ? `/kumpul-arsip/${kode}` : '/kumpul-arsip/public', {
            onSuccess: () => setSubmitted(true),
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Head title={`Pengumpulan Arsip | ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}`} />
            
            <Navbar />
            
            <main className="flex-grow flex items-start justify-center pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-poltekpar-navy/5 to-transparent -z-10"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-poltekpar-primary/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-1/2 -left-24 w-80 h-80 bg-poltekpar-gold/5 rounded-full blur-3xl -z-10"></div>

                <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-poltekpar-navy/5 border border-slate-100 overflow-hidden">
                    
                    {/* Premium Header */}
                    <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-6 bg-gradient-to-br from-white to-slate-50/50">
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-xl shadow-poltekpar-primary/20 flex-shrink-0">
                            <i className="fa-solid fa-folder-arrow-up text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengumpulan Arsip PKM</h1>
                            <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-poltekpar-gold rounded-full"></span>
                                Dokumentasi & Pelaporan Sistem {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            {kode && (
                                <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Kode Unik</span>
                                    <span className="text-sm font-black text-poltekpar-navy tracking-widest">{kode}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-10">
                        {submitted ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                    <i className="fa-solid fa-check text-3xl text-green-600"></i>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Berhasil Dikumpulkan!</h2>
                                <p className="text-slate-500 font-bold">Data arsip Anda telah tersimpan.</p>
                            </div>
                        ) : (
                        <form onSubmit={submit} className="space-y-10">
                            
                            {/* Information Section */}
                            {kode && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-poltekpar-primary">
                                            <i className="fa-solid fa-circle-info"></i>
                                        </div>
                                        Informasi
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-3 leading-relaxed">
                                        Pastikan nama kegiatan sudah sesuai dengan data pengajuan Anda.
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nama Kegiatan Terdaftar</label>
                                        <div className="text-lg font-black text-poltekpar-navy leading-tight">
                                            {namaKegiatan}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {kode && <div className="h-px bg-slate-100 w-full"></div>}

                            {/* Links Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-poltekpar-primary">
                                            <i className="fa-solid fa-link"></i>
                                        </div>
                                        Arsip Tautan
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-3 leading-relaxed">
                                        Gunakan tautan valid untuk memudahkan tim reviewer mengakses dokumen Anda.
                                    </p>
                                </div>
                                <div className="md:col-span-2 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                                            Link Laporan Akhir <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-poltekpar-primary transition-colors">
                                                <i className="fa-solid fa-file-pdf"></i>
                                            </div>
                                            <input
                                                type="url"
                                                value={data.laporan}
                                                onChange={e => setData('laporan', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-poltekpar-primary focus:ring-4 focus:ring-poltekpar-primary/5 transition-all outline-none"
                                                placeholder="https://drive.google.com/..."
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                                            Link Dokumentasi Kegiatan <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-poltekpar-primary transition-colors">
                                                <i className="fa-solid fa-images"></i>
                                            </div>
                                            <input
                                                type="url"
                                                value={data.dokumentasi}
                                                onChange={e => setData('dokumentasi', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-poltekpar-primary focus:ring-4 focus:ring-poltekpar-primary/5 transition-all outline-none"
                                                placeholder="https://drive.google.com/..."
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Tautan Tambahan (Opsional)</label>
                                            <button type="button" onClick={handleAddLink} className="text-[10px] font-black text-poltekpar-primary flex items-center gap-2 hover:opacity-70 transition-opacity bg-poltekpar-primary/5 px-3 py-1.5 rounded-full">
                                                <i className="fa-solid fa-plus"></i>
                                                TAMBAH LAGI
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {data.dokumen_lainnya.map((item, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-3 group">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                                <i className="fa-solid fa-tag"></i>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={item.nama_dokumen} 
                                                                onChange={e => handleLinkChange(idx, 'nama_dokumen', e.target.value)} 
                                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 group-hover:bg-white border-2 border-transparent group-hover:border-slate-100 rounded-xl text-sm font-bold transition-all outline-none placeholder:text-slate-400" 
                                                                placeholder="Nama Tautan (Opsional)" 
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                                <i className="fa-solid fa-link"></i>
                                                            </div>
                                                            <input 
                                                                type="url" 
                                                                value={item.url_dokumen} 
                                                                onChange={e => handleLinkChange(idx, 'url_dokumen', e.target.value)} 
                                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 group-hover:bg-white border-2 border-transparent group-hover:border-slate-100 rounded-xl text-sm font-bold transition-all outline-none placeholder:text-slate-400" 
                                                                placeholder="https://..." 
                                                            />
                                                        </div>
                                                    </div>
                                                    {data.dokumen_lainnya.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveLink(idx)} className="w-full sm:w-12 h-12 mt-auto flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                            <i className="fa-solid fa-xmark"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button type="submit" disabled={processing} className="w-full py-5 bg-poltekpar-primary hover:bg-poltekpar-navy text-white font-black rounded-2xl shadow-xl shadow-poltekpar-primary/20 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 text-lg">
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    SIMPAN DATA ARSIP
                                </button>
                                <p className="text-center text-[11px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
                                    Pesan: Tautan yang Anda kirimkan bersifat rahasia dan hanya dapat diakses oleh tim internal.
                                </p>
                            </div>

                        </form>
                        )}
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
