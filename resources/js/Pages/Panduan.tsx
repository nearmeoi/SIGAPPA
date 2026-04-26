import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/Layouts/DefaultLayout';

interface PanduanProps {
    pdfUrl: string;
}

export default function Panduan({ pdfUrl }: PanduanProps) {
    return (
        <Layout>
            <Head title={`Panduan | ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}`} />

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
                <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-white to-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-md">
                                <i className="fa-solid fa-book-open text-sm sm:text-lg"></i>
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Panduan Penggunaan {import.meta.env.VITE_APP_NAME || 'SIGAPPA'}</h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Dokumen panduan lengkap PKM</p>
                            </div>
                        </div>
                        <a
                            href={pdfUrl}
                            download
                            className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-poltekpar-primary bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                        >
                            <i className="fa-solid fa-download text-xs"></i>
                            Unduh PDF
                        </a>
                    </div>

                    {/* PDF Embed */}
                    <div className="w-full" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
                        <iframe
                            src={pdfUrl}
                            title={`Panduan ${import.meta.env.VITE_APP_NAME || 'SIGAPPA'}`}
                            className="w-full h-full border-0"
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
