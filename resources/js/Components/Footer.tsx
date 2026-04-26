import React from 'react';
import { usePage } from '@inertiajs/react';

export default function Footer() {
    const { listKontak, visitorStats } = usePage<any>().props;
    const kontaks = listKontak || [];
    
    // Fallback data jika stats belum terisi
    const stats = visitorStats || {
        today_views: 0,
        today_visitors: 0,
        last_7_days_views: 0,
        last_30_days_views: 0,
        total_visitors: 0
    };

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <footer className="bg-slate-900 text-white" itemScope itemType="https://schema.org/WPFooter">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-100">Kontak Kami</h3>
                            <ul className="space-y-3">
                                {kontaks.length > 0 ? (
                                    kontaks.map((k: any) => (
                                        <li key={k.id_kontak} className="flex items-start gap-3">
                                            {k.ikon ? <i className={`${k.ikon} text-poltekpar-gold mt-1 w-4 text-center`}></i> : <i className="fa-solid fa-address-book text-poltekpar-gold mt-1 w-4 text-center"></i>}
                                            <div className="flex flex-col">
                                                {k.label && <span className="text-[11px] font-bold text-poltekpar-gold/80 uppercase tracking-widest leading-none mb-1">{k.label}</span>}
                                                <span className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{k.nilai_kontak}</span>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li className="flex items-start gap-3">
                                            <i className="fa-solid fa-map-marker-alt text-poltekpar-gold mt-1"></i>
                                            <span className="text-slate-300 text-sm leading-relaxed">
                                                Jl. Gunung Rinjani, Kota Mandiri Tanjung Bunga, Makassar 90224
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <i className="fa-solid fa-phone-alt text-poltekpar-gold"></i>
                                            <span className="text-slate-300 text-sm">(0411) 838456</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <i className="fa-solid fa-envelope text-poltekpar-gold"></i>
                                            <a href="mailto:p3m@poltekparmakassar.ac.id" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                                p3m@poltekparmakassar.ac.id
                                            </a>
                                        </li>
                                    </>
                                )}
                            </ul>

                            <h3 className="text-lg font-bold mt-6 mb-4 text-slate-100">Follow</h3>
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://www.instagram.com/poltekparmakassar/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-poltekpar-primary transition-colors"
                                    aria-label="Instagram"
                                >
                                    <i className="fa-brands fa-instagram"></i>
                                </a>
                                <a
                                    href="https://www.facebook.com/poltekparmakassar"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-poltekpar-primary transition-colors"
                                    aria-label="Facebook"
                                >
                                    <i className="fa-brands fa-facebook-f"></i>
                                </a>
                                <a
                                    href="https://x.com/poltekpar_mks"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-poltekpar-primary transition-colors"
                                    aria-label="X"
                                >
                                    <i className="fa-brands fa-x-twitter"></i>
                                </a>
                                <a
                                    href="https://www.youtube.com/@poltekparmakassar"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-poltekpar-primary transition-colors"
                                    aria-label="Youtube"
                                >
                                    <i className="fa-brands fa-youtube"></i>
                                </a>
                            </div>
                        </div>

                        {/* Profil Kami */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-100">Profil Kami</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/profil/tentang-kami/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Tentang Kami
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/profil/visi-dan-misi/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Visi dan Misi
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/profil/struktur-organisasi/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Struktur Organisasi Tahun 2026
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/hubungi-kami/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Hubungi Kami
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Kegiatan */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-100">Kegiatan</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/penelitian/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Penelitian
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/pengabdian/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Pengabdian
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/pelatihan/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Pelatihan
                                    </a>
                                </li>
                                <li>
                                    <a href="https://p3m.poltekparmakassar.ac.id/galeri/" className="text-slate-300 text-sm hover:text-poltekpar-primary transition-colors">
                                        Galeri
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Statistik Pengunjung */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-100">Statistik Pengunjung</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Today&apos;s Views:</span>
                                    <strong className="text-white">{stats.today_views.toLocaleString('id-ID')}</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Today&apos;s Visitors:</span>
                                    <strong className="text-white">{stats.today_visitors.toLocaleString('id-ID')}</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Last 7 Days Views:</span>
                                    <strong className="text-white">{stats.last_7_days_views.toLocaleString('id-ID')}</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Last 30 Days Views:</span>
                                    <strong className="text-white">{stats.last_30_days_views.toLocaleString('id-ID')}</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Total Visitors:</span>
                                    <strong className="text-white">{stats.total_visitors.toLocaleString('id-ID')}</strong>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-6 text-center">
                        <div className="mb-6 text-left border-b border-slate-800/50 pb-6 hidden md:block">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Layanan Pengabdian Masyarakat Poltekpar Makassar</h4>
                            <p className="text-slate-400 text-[11px] leading-relaxed max-w-4xl">
                                SIGAPPA menyediakan akses terpadu untuk kegiatan pengabdian masyarakat (PKM), pemetaan geospasial pariwisata, 
                                dan bimbingan teknis di wilayah Sulawesi Selatan dan Indonesia Timur. Dikelola resmi oleh Politeknik Pariwisata Makassar 
                                untuk mendukung ekosistem pariwisata berkelanjutan dan pemberdayaan masyarakat desa wisata.
                            </p>
                        </div>
                        <p className="text-slate-400 text-sm">Copyright 2026 &copy; P3M Poltekpar Makassar</p>
                    </div>
                </div>
            </footer>

            <button
                type="button"
                className="fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-poltekpar-gold text-white shadow-lg hover:bg-poltekpar-navy transition-all hover:shadow-xl z-40"
                aria-label="Back to top"
                onClick={handleScrollToTop}
            >
                <i className="fa-solid fa-angle-up text-lg"></i>
            </button>
        </>
    );
}
