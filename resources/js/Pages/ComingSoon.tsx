import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '@/Layouts/DefaultLayout';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <Layout>
            <Head title="404 - Halaman Tidak Ditemukan" />

            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-red-500 mb-8">
                        <SearchX size={40} />
                    </div>

                    <h1 className="text-6xl font-extrabold text-zinc-900 tracking-tight mb-3">404</h1>
                    <p className="text-lg text-zinc-600 leading-relaxed mb-10">
                        Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                        <ArrowLeft size={18} />
                        Kembali ke Beranda
                    </Link>

                    <div className="mt-16 pt-10 border-t border-zinc-100 text-zinc-400 text-sm">
                        &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'SIGAPPA'} Politeknik Pariwisata Makassar
                    </div>
                </div>
            </div>
        </Layout>
    );
}
