import React, { useState, useEffect, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import Toast from '../Components/Toast';
import { Layout, LogOut, User } from 'lucide-react';

interface DirekturLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const DirekturLayout: React.FC<DirekturLayoutProps> = ({ children, title }) => {
    const { props } = usePage();
    const flash = (props as any).flash || {};
    const user = (props as any).auth?.user;

    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }>({
        show: false, type: 'success', title: '', message: '',
    });

    useEffect(() => {
        if (flash.success) {
            setToast({ show: true, type: 'success', title: 'Berhasil', message: flash.success });
        } else if (flash.error) {
            setToast({ show: true, type: 'error', title: 'Gagal', message: flash.error });
        } else if (flash.info) {
            setToast({ show: true, type: 'info', title: 'Info', message: flash.info });
        }
    }, [flash.success, flash.error, flash.info]);

    const closeToast = useCallback(() => setToast(prev => ({ ...prev, show: false })), []);

    return (
        <div className="flex min-h-screen bg-[#f3f6f9]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {/* Sidebar */}
            <aside className="w-64 flex flex-col flex-shrink-0 fixed top-0 left-0 h-screen bg-poltekpar-navy border-r border-white/5 shadow-2xl z-40">
                {/* Brand */}
                <div className="px-6 py-8 flex items-center gap-3 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-poltekpar-primary via-poltekpar-gold to-poltekpar-primary" />
                    <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 flex-shrink-0">
                        <img src="/logo-poltekpar.png" alt="Poltekpar Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[18px] font-extrabold text-white tracking-tight leading-none">SIGAPPA</span>
                        <span className="text-[9px] font-bold text-poltekpar-gold/80 uppercase tracking-widest mt-1">Portal Direktur</span>
                    </div>
                </div>

                {/* Nav */}
                <div className="px-6 pt-8 pb-3">
                    <span className="text-[10px] font-extrabold text-white/30 uppercase tracking-[0.2em]">Menu</span>
                </div>
                <nav className="flex-1 px-4 py-1 space-y-1">
                    <Link
                        href="/direktur/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <Layout size={16} />
                        Dashboard Persetujuan
                    </Link>
                </nav>

                {/* User info + logout */}
                <div className="px-4 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3 px-3">
                        <div className="w-8 h-8 rounded-full bg-poltekpar-primary/30 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-poltekpar-gold" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Direktur'}</p>
                            <p className="text-[10px] text-white/40 truncate">{user?.email ?? ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.post('/logout')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={16} />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-30 bg-white border-b border-zinc-100 px-8 h-14 flex items-center justify-between shadow-sm">
                    <h1 className="text-sm font-semibold text-zinc-700">{title ?? 'Dashboard Direktur'}</h1>
                    <span className="text-xs text-zinc-400 font-medium">Portal Direktur — Politeknik Pariwisata Makassar</span>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>

            {toast.show && (
                <Toast
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={closeToast}
                />
            )}
        </div>
    );
};

export default DirekturLayout;
