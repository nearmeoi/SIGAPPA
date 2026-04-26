import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts/DefaultLayout';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';

export default function Evaluasi() {
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [form, setForm] = useState({
        nama: '',
        asal_instansi: '',
        no_telp: '',
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        q5: 0,
        masukan: ''
    });

    const questions = [
        `1. Website ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'} mudah diakses dan memiliki navigasi yang jelas (menu, halaman, dan fitur mudah dipahami).`,
        "2. Informasi yang tersedia (data PKM, peta spasial, dan statistik) lengkap, akurat, and mudah dipahami.",
        `3. Fitur peta (WebGIS) pada ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'} membantu saya dalam memahami sebaran kegiatan PKM dan informasi pariwisata.`,
        `4. Proses pengajuan layanan PKM melalui ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'} mudah dilakukan dan sesuai kebutuhan stakeholder (masyarakat, pemerintah, dan industri).`,
        `5. Secara keseluruhan, saya puas terhadap layanan dan fitur yang disediakan oleh website ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}.`
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Cek validasi bintang minimal 1
        if (form.q1 === 0 || form.q2 === 0 || form.q3 === 0 || form.q4 === 0 || form.q5 === 0) {
            alert('Mohon isi semua penilaian bintang pada kuesioner.');
            return;
        }

        setSubmitting(true);
        router.post('/evaluasi-sistem', form, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                setForm({ nama: '', asal_instansi: '', no_telp: '', q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, masukan: '' });
                setTimeout(() => setShowSuccess(false), 5000);
            },
            onFinish: () => setSubmitting(false)
        });
    };

    const handleRating = (qKey: string, val: number) => {
        setForm(prev => ({ ...prev, [qKey]: val }));
    };

    return (
        <Layout mainClassName="site-main-content">
            <Head title={`Feedback ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}`} />
            
            <div className="bg-poltekpar-navy text-white pt-8 pb-16 sm:pt-12 sm:pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse-slow"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-sm">
                        <MessageSquare size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl md:text-5xl font-black mb-3 sm:mb-4 tracking-tight">Feedback {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}</h1>
                    <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-medium">Bantu kami meningkatkan kualitas layanan P3M Politeknik Pariwisata Makassar melalui umpan balik dan penilaian Anda.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-3 sm:px-6 -mt-10 sm:-mt-16 mb-12 sm:mb-20 relative z-20">
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl p-4 sm:p-10 border border-slate-100">
                    {showSuccess ? (
                        <div className="text-center py-16 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-3">Feedback Berhasil Dikirim!</h2>
                            <p className="text-slate-500 max-w-md mx-auto">Terima kasih banyak atas waktu dan penilaian Anda. Umpan balik Anda sangat berharga bagi pengembangan {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}.</p>
                            <button onClick={() => setShowSuccess(false)} className="mt-8 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                Kirim Respon Lainnya
                            </button>
                        </div>
                    ) : (
                        <form id="evalForm" onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">1. Data Responden</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                                        <input type="text" required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} 
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-poltekpar-primary focus:bg-white transition-all font-medium" placeholder="Cth: John Doe" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 block mb-2">No. Telepon / WA <span className="text-red-500">*</span></label>
                                        <input type="text" required value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} 
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-poltekpar-primary focus:bg-white transition-all font-medium" placeholder="Cth: 08123456789" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Asal Instansi (Opsional)</label>
                                    <input type="text" value={form.asal_instansi} onChange={e => setForm({...form, asal_instansi: e.target.value})} 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-poltekpar-primary focus:bg-white transition-all font-medium" placeholder="Cth: Universitas XYZ / Desa ABC" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-3 gap-2">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">2. Kuesioner Feedback</h3>
                                    <span className="text-[11px] font-bold text-poltekpar-primary bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Bintang 1 (Sangat Tidak Setuju) - 5 (Sangat Setuju)</span>
                                </div>
                                
                                {questions.map((qText, index) => {
                                    const qKey = `q${index + 1}` as keyof typeof form;
                                    const currentVal = form[qKey] as number;
                                    return (
                                        <div key={index} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-poltekpar-primary/30 transition-colors">
                                            <p className="text-[15px] font-bold text-slate-700 leading-relaxed mb-5">{qText}</p>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex gap-2">
                                                {[1,2,3,4,5].map(val => (
                                                    <button 
                                                        key={val} type="button" 
                                                        onClick={() => handleRating(qKey, val)}
                                                        className={`p-3 rounded-xl border-2 transition-all duration-300 ${currentVal >= val ? 'bg-amber-50 border-amber-300 text-amber-500 scale-110 shadow-sm' : 'bg-white border-slate-200 text-slate-300 hover:border-amber-200 hover:text-amber-300'}`}
                                                    >
                                                        <Star size={24} strokeWidth={2.5} className={currentVal >= val ? 'fill-amber-400' : ''} />
                                                    </button>
                                                ))}
                                                </div>
                                                <div className="w-full sm:w-auto sm:ml-4 text-[13px] font-bold text-slate-500 py-1.5 px-3 bg-white rounded-lg border border-slate-100">
                                                    {currentVal === 0 ? 'Pilih rating...' : ['(1) Sangat Tidak Setuju','(2) Tidak Setuju','(3) Cukup Setuju','(4) Setuju','(5) Sangat Setuju'][currentVal-1]}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">3. Umpan Balik Tambahan</h3>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Masukan & Saran Konstruktif (Opsional)</label>
                                    <textarea rows={4} value={form.masukan} onChange={e => setForm({...form, masukan: e.target.value})} 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-poltekpar-primary focus:bg-white transition-all font-medium custom-scrollbar" 
                                        placeholder="Silakan tuliskan jika ada hal lain yang ingin disampaikan mengenai sistem ini..." />
                                </div>
                            </div>
                            
                            <div className="pt-6">
                                <button type="submit" disabled={submitting} className="w-full py-4 text-center bg-poltekpar-primary hover:bg-poltekpar-navy text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 group">
                                    {submitting ? 'Memproses Kiriman...' : (
                                        <>Kirim Penilaian <i className="fa-solid fa-paper-plane group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
}
