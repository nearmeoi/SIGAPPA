import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Users, Camera, Sparkles, ExternalLink, Github, Linkedin, Mail } from 'lucide-react';
import DefaultLayout from '@/Layouts/DefaultLayout';
import '@/../css/developer-appreciation.css';

interface Dev {
    id_developer: number;
    nama: string;
    peran: string | null;
    asal_instansi: string | null;
    foto: string | null;
    urutan: number;
}

interface Doc {
    id_dokumentasi: number;
    judul: string;
    deskripsi: string | null;
    foto: string;
    urutan: number;
}

export default function DeveloperAppreciation({ developers, docs }: { developers: Dev[], docs: Doc[] }) {
    const APP_NAME = import.meta.env.VITE_APP_NAME || 'SIGAPPA';

    return (
        <DefaultLayout>
            <Head title={`Developer Crew & Credits - ${APP_NAME}`} />
            
            <div className="bg-slate-50 min-h-screen text-slate-800 pb-24 dev-crew-hero">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group font-medium text-sm"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Beranda
                        </Link>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <Sparkles size={12} className="text-indigo-500" />
                            Developer Appreciation
                        </div>
                    </div>

                    {/* Hero Header */}
                    <div className="text-center max-w-4xl mx-auto mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
                            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Visionaries</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                            Dedikasi dan kolaborasi tanpa batas untuk mewujudkan platform {APP_NAME} yang inovatif dan terpercaya.
                        </p>
                    </div>

                    {/* Developer Section */}
                    <div className="mb-32">
                        <div className="flex flex-col items-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="w-16 h-1 w-16 bg-indigo-600 rounded-full"></div>
                            <div className="flex items-center gap-3">
                                <Users className="text-indigo-600" size={28} strokeWidth={2.5} />
                                <h2 className="text-3xl font-extrabold text-slate-900">Tim Pengembang</h2>
                            </div>
                            <p className="text-slate-500 font-medium">Para ahli di balik layar yang membangun setiap fitur.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                            {developers.map((dev, index) => (
                                <div 
                                    key={dev.id_developer} 
                                    className={`bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center dev-card shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-[${index * 100}ms]`}
                                >
                                    <div className="relative mb-8">
                                        <div className="w-40 h-40 rounded-[2rem] dev-photo-ring shadow-xl shadow-indigo-200/50 transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                            <div className="w-full h-full bg-slate-50 rounded-[1.8rem] overflow-hidden">
                                                {dev.foto ? (
                                                    <img src={dev.foto} alt={dev.nama} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-indigo-200">
                                                        <Users size={64} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-50 animate-float">
                                            <Sparkles size={20} className="text-amber-400 fill-amber-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{dev.nama}</h3>
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold tracking-tight">
                                            {dev.peran}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 mt-auto pt-6 border-t border-slate-50 w-full">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dev.asal_instansi || 'Internal Team'}</span>
                                    </div>
                                </div>
                            ))}
                            {developers.length === 0 && (
                                <div className="col-span-full py-24 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-medium">Tim pengembang sedang dipersiapkan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Documentation Section */}
                    <div className="relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-slate-200 to-transparent -translate-y-full mb-12"></div>
                        
                        <div className="flex flex-col items-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center gap-3">
                                <Camera className="text-indigo-600" size={28} strokeWidth={2.5} />
                                <h2 className="text-3xl font-extrabold text-slate-900">Jejak Langkah Proyek</h2>
                            </div>
                            <p className="text-slate-500 font-medium">Kumpulan momen selama proses pengembangan berlangsung.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {docs.map((doc, index) => (
                                <div 
                                    key={doc.id_dokumentasi} 
                                    className={`group bg-white rounded-[2rem] overflow-hidden doc-card border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-1000 delay-[${index * 150}ms]`}
                                >
                                    <div className="doc-image-container aspect-[4/3]">
                                        <img src={doc.foto} alt={doc.judul} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg">
                                                <ExternalLink size={18} className="text-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{doc.judul}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{doc.deskripsi}</p>
                                    </div>
                                </div>
                            ))}
                            {docs.length === 0 && (
                                <div className="col-span-full py-24 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                                    <Camera size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-medium">Dokumentasi akan segera hadir.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Quote */}
                    <div className="mt-40 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="inline-block p-1 rounded-full bg-slate-100 mb-8">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <Sparkles size={24} />
                            </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-slate-800 italic max-w-3xl mx-auto leading-tight">
                            "Technological innovation is the engine of progress, but passion is the fuel that keeps it running."
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-4 text-slate-400">
                            <div className="h-px w-8 bg-slate-200"></div>
                            <span className="text-sm font-bold uppercase tracking-[0.3em]">SIGAPPA Core Team</span>
                            <div className="h-px w-8 bg-slate-200"></div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </DefaultLayout>
    );
}
