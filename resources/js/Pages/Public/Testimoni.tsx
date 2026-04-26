import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer';

interface Props {
    namaKegiatan?: string;
    kode: string;
}

export default function Testimoni({ namaKegiatan = 'NAMA KEGIATAN PKM', kode }: Props) {
    const { data, setData, post, processing } = useForm({
        nama_pemberi: '',
        rating: 0,
        pesan_ulasan: '',
        masukan: '',
    });

    const [hover, setHover] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.rating === 0) {
            alert('Mohon berikan rating (bintang) terlebih dahulu.');
            return;
        }
        post(kode ? `/testimoni/${kode}` : '/testimoni/public', {
            onSuccess: () => setSubmitted(true),
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Head title={`Testimoni Pengunjung | ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}`} />

            <Navbar />

            <main className="flex-grow flex items-start justify-center pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-poltekpar-navy/5 to-transparent -z-10"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-1/2 -left-24 w-80 h-80 bg-poltekpar-primary/5 rounded-full blur-3xl -z-10"></div>

                <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-poltekpar-navy/5 border border-slate-100 overflow-hidden">

                    {/* Premium Header */}
                    <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-6 bg-gradient-to-br from-white to-slate-50/50">
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-poltekpar-gold to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 flex-shrink-0">
                            <i className="fa-solid fa-star text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Testimoni & Review</h1>
                            <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-poltekpar-gold rounded-full"></span>
                                Feedback Pengunjung Sistem {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            {kode && (
                                <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID Kode</span>
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
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Terima Kasih!</h2>
                                <p className="text-slate-500 font-bold">Testimoni Anda berhasil dikirim.</p>
                            </div>
                        ) : (
                        <form onSubmit={submit} className="space-y-10">

                            {/* Info Section */}
                            {kode && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-poltekpar-primary">
                                            <i className="fa-solid fa-bookmark"></i>
                                        </div>
                                        Konteks
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-3 leading-relaxed">
                                        Data testimoni Anda akan dipublikasikan sebagai bahan evaluasi kegiatan.
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nama Kegiatan Terkait</label>
                                        <div className="text-lg font-black text-poltekpar-navy leading-tight">
                                            {namaKegiatan}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {kode && <div className="h-px bg-slate-100 w-full"></div>}

                            {/* Main Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-poltekpar-primary">
                                            <i className="fa-solid fa-pen-nib"></i>
                                        </div>
                                        Isi Ulasan
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-3 leading-relaxed">
                                        Berikan rating dan ulasan jujur mengenai pengalaman Anda.
                                    </p>
                                </div>
                                <div className="md:col-span-2 space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                                            Nama Lengkap Anda <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama_pemberi}
                                            onChange={e => setData('nama_pemberi', e.target.value)}
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-poltekpar-primary focus:ring-4 focus:ring-poltekpar-primary/5 transition-all outline-none"
                                            placeholder="Contoh: Budi Santoso / Perwakilan Warga..."
                                            required
                                        />
                                    </div>

                                    {/* Star Rating Premium */}
                                    <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">BERIKAN RATING BINTANG</label>
                                        <div className="flex gap-4">
                                            {[...Array(5)].map((_, index) => {
                                                const starValue = index + 1;
                                                const isSelected = starValue <= (hover || data.rating);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={starValue}
                                                        className={`text-5xl transition-all duration-300 hover:scale-125 active:scale-90 ${isSelected ? 'text-poltekpar-gold drop-shadow-[0_0_15px_rgba(234,196,73,0.4)]' : 'text-slate-200'}`}
                                                        onClick={() => setData('rating', starValue)}
                                                        onMouseEnter={() => setHover(starValue)}
                                                        onMouseLeave={() => setHover(0)}
                                                    >
                                                        <i className={`fa-solid fa-star ${isSelected ? 'fa-star' : 'fa-star'}`}></i>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 h-5">
                                             {data.rating > 0 && (
                                                <span className="text-sm font-black text-poltekpar-gold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">
                                                    {['Sangat Kurang', 'Kurang', 'Cukup', 'Puas', 'Sangat Puas'][data.rating - 1]}
                                                </span>
                                             )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                                            Pesan dan Kesan <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.pesan_ulasan}
                                            onChange={e => setData('pesan_ulasan', e.target.value)}
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-poltekpar-primary focus:ring-4 focus:ring-poltekpar-primary/5 transition-all outline-none min-h-[140px]"
                                            placeholder="Tuliskan pengalaman dan kesan Anda selama mengikuti kegiatan ini..."
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                                            Masukan / Saran <span className="text-slate-400 font-bold ml-1 tracking-normal capitalize">(Opsional)</span>
                                        </label>
                                        <textarea
                                            value={data.masukan}
                                            onChange={e => setData('masukan', e.target.value)}
                                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none min-h-[100px]"
                                            placeholder="Tuliskan masukan atau saran perbaikan untuk kegiatan di masa mendatang..."
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="pt-8">
                                <button type="submit" disabled={processing} className="w-full py-5 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy hover:to-poltekpar-primary text-white font-black rounded-2xl shadow-2xl shadow-poltekpar-primary/20 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 text-lg">
                                    <i className="fa-solid fa-paper-plane"></i>
                                    KIRIM TESTIMONI
                                </button>
                                <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-poltekpar-gold shadow-sm flex-shrink-0">
                                         <i className="fa-solid fa-shield-halved"></i>
                                     </div>
                                     <div>
                                         <span className="block text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1 leading-none">Privacy Note</span>
                                         <p className="text-[11px] font-bold text-amber-800/80 leading-relaxed">
                                             Terima kasih telah meluangkan waktu. Setiap masukan yang Anda berikan sangat berarti bagi kami untuk meningkatkan kualitas pelayanan pariwisata.
                                         </p>
                                     </div>
                                </div>
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
