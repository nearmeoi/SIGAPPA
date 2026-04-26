import React, { useState, useEffect, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import Toast from '../Components/Toast';
import CommandPalette from '../Components/CommandPalette';
import ProfileDropdown from '../Components/ProfileDropdown';
import NotificationBell from '../Components/NotificationBell';
import {
    Layout,
    Users,
    Folder,
    LogOut,
    Search,
    Activity,
    MessageSquare,
    Grid,
    Database,
    ChevronDown,
    ChevronRight,
    FileText,
    User,
    Command,
    Phone,
    StarHalf,
    Menu,
    X
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

interface NavItem {
    label: string;
    href?: string;
    icon: React.ElementType;
    children?: { label: string; href: string; icon: React.ElementType }[];
    superadminOnly?: boolean;
    secretOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: Layout },
    { label: 'Pengajuan', href: '/admin/pengajuan', icon: FileText },
    { label: 'Aktivitas', href: '/admin/aktivitas', icon: Activity },
    {
        label: 'Database',
        icon: Database,
        children: [
            { label: 'Pegawai', href: '/admin/pegawai', icon: Users },
            { label: 'Users', href: '/admin/users', icon: User },
            { label: 'Jenis PKM', href: '/admin/master/jenis-pkm', icon: Grid },
        ],
    },
    { label: 'Arsip', href: '/admin/arsip', icon: Folder },
    { label: 'Testimoni', href: '/admin/testimoni', icon: MessageSquare },
    { label: 'Feedback', href: '/admin/evaluasi-sistem', icon: StarHalf },
    { label: 'Atur Template', href: '/admin/templates', icon: FileText },
    { label: 'Kontak', href: '/admin/kontak', icon: Phone },
    { label: 'Data Historis', href: '/admin/historis', icon: Database, superadminOnly: true },
    { label: 'Kelola Halaman Developer', href: '/secret/appreciation', icon: User, secretOnly: true },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
    const { url, props } = usePage();
    const flash = (props as any).flash || {};

    // Toast state
    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }>({
        show: false, type: 'success', title: '', message: '',
    });

    // Read flash messages and show toast
    useEffect(() => {
        if (flash.success) {
            setToast({ show: true, type: 'success', title: 'Berhasil', message: flash.success });
        } else if (flash.error) {
            setToast({ show: true, type: 'error', title: 'Gagal', message: flash.error });
        }
    }, [flash.success, flash.error]);

    const closeToast = useCallback(() => setToast(prev => ({ ...prev, show: false })), []);

    // Listen for new notification events
    useEffect(() => {
        const handleNewNotif = (e: Event) => {
            const detail = (e as CustomEvent).detail as { id_pengajuan: number; judul_kegiatan: string; status_pengajuan: string };
            setToast({
                show: true,
                type: 'info',
                title: 'Pengajuan Baru',
                message: detail.judul_kegiatan || 'Tanpa Judul',
            });

            // Make toast clickable to navigate
            const toastEl = document.getElementById('notification-toast');
            if (toastEl) {
                toastEl.style.cursor = 'pointer';
                toastEl.onclick = () => {
                    setToast(prev => ({ ...prev, show: false }));
                    router.visit(`/admin/pengajuan/${detail.id_pengajuan}`);
                };
            }
        };

        window.addEventListener('new-notification', handleNewNotif);
        return () => window.removeEventListener('new-notification', handleNewNotif);
    }, []);

    // Command Palette state
    const [paletteOpen, setPaletteOpen] = useState(false);

    // Mobile sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const isActive = (href?: string) => {
        if (!href || href === '#') return false;
        if (href === '/admin') return url === '/admin' || url === '/admin/dashboard';
        return url === href || url.startsWith(`${href}/`);
    };

    const isChildrenActive = (childrenItems?: { href: string }[]) => {
        if (!childrenItems) return false;
        return childrenItems.some(child => isActive(child.href));
    };

    const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        navItems.forEach(item => {
            if (item.children) init[item.label] = isChildrenActive(item.children);
        });
        return init;
    });

    const toggleDropdown = (label: string) => {
        setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div
            className="flex min-h-screen bg-[#f3f6f9] selection:bg-poltekpar-primary/20 selection:text-poltekpar-navy overflow-x-hidden"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* ─── Mobile Backdrop ─── */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside
                className={`w-68 flex flex-col flex-shrink-0 fixed top-0 left-0 h-screen z-50 lg:z-40 bg-poltekpar-navy border-r border-white/5 shadow-2xl transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
                style={{ overflowY: 'auto', overflowX: 'hidden' }}
            >
                {/* Brand */}
                <div className="px-6 py-8 flex items-center gap-3 border-b border-white/5 flex-shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-poltekpar-primary via-poltekpar-gold to-poltekpar-primary"></div>
                    <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 flex-shrink-0">
                        <img src="/logo-poltekpar.png" alt="Poltekpar Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[18px] font-extrabold text-white tracking-tight leading-none">{import.meta.env.VITE_APP_NAME || 'SIGAPPA'}</span>
                        <span className="text-[9px] font-bold text-poltekpar-gold/80 uppercase tracking-widest mt-1">Geospasial & Pariwisata</span>
                    </div>
                </div>

                {/* Nav Label */}
                <div className="px-6 pt-8 pb-3 flex-shrink-0">
                    <span className="text-[10px] font-extrabold text-white/30 uppercase tracking-[0.2em]">Menu Utama</span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 py-1 space-y-1">
                    {navItems.filter(i => {
                        const role = (props as any).auth?.user?.role;
                        if (i.superadminOnly && !['superadmin', 'secret_account'].includes(role)) return false;
                        if (i.secretOnly && role !== 'secret_account') return false;
                        return true;
                    }).map((item) => {
                        const hasChildren = !!item.children;
                        const childActive = isChildrenActive(item.children);
                        const active = item.href ? isActive(item.href) : childActive;
                        const isOpen = openDropdowns[item.label];
                        const Icon = item.icon;

                        if (hasChildren) {
                            return (
                                <div key={item.label} className="mt-2">
                                    <button
                                        onClick={() => toggleDropdown(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-200 ${active
                                                ? 'text-white bg-white/10'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} className={active ? 'text-poltekpar-gold' : 'text-white/40'} />
                                            <span>{item.label}</span>
                                        </div>
                                        {isOpen ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
                                    </button>

                                    {isOpen && (
                                        <div className="mt-1 ml-6 pl-4 space-y-1 border-l border-white/10">
                                            {item.children?.map(child => {
                                                const childIsActive = isActive(child.href);
                                                return (
                                                    <Link
                                                        key={child.label}
                                                        href={child.href}
                                                        onClick={() => setSidebarOpen(false)}
                                                        className={`block px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${childIsActive
                                                                ? 'text-poltekpar-gold bg-white/5'
                                                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href || '#'}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 relative group ${active
                                        ? 'bg-poltekpar-primary text-white shadow-lg shadow-poltekpar-primary/20 translate-x-1'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={18} className={active ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors'} />
                                {item.label}
                                {active && (
                                    <div className="absolute right-3 w-1.5 h-1.5 bg-poltekpar-gold rounded-full shadow-[0_0_8px_rgba(234,196,73,0.8)]"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: Logout */}
                <div className="p-6 border-t border-white/5">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center justify-center w-full py-3 px-4 rounded-xl text-[14px] font-extrabold text-white bg-red-500/80 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95 gap-3"
                    >
                        <LogOut size={18} />
                        <span>Keluar Sistem</span>
                    </Link>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main
                className="flex-1 flex flex-col min-h-screen lg:ml-[272px] min-w-0"
            >
                {/* Header */}
                <header className="h-[60px] lg:h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 flex-shrink-0">
                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex-1 max-w-xl ml-2 lg:ml-0">
                        <div className="relative group cursor-pointer" onClick={() => setPaletteOpen(true)}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-poltekpar-primary transition-colors pointer-events-none">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                readOnly
                                placeholder="Cari pengajuan, pengguna, aktivitas..."
                                className="w-full bg-slate-100/50 hover:bg-slate-100 pl-12 pr-12 py-2.5 lg:py-3 rounded-2xl border border-transparent hover:border-slate-200 text-[13px] lg:text-[14px] font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-poltekpar-primary/5 focus:border-poltekpar-primary/20 transition-all cursor-pointer"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <kbd className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
                                    <Command size={12} />
                                    <span>K</span>
                                </kbd>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-6 ml-2 lg:ml-4">
                        <div className="hidden lg:block h-10 w-px bg-slate-200"></div>
                        <NotificationBell />
                        <ProfileDropdown auth={(props as any).auth} />
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8 xl:p-10 flex-1 min-w-0 max-w-[1600px] mx-auto w-full">
                    {title && (
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{title}</h1>
                                <div className="mt-2 flex items-center gap-2 text-slate-400 text-[13px] font-bold uppercase tracking-widest">
                                    <span>Admin</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{title}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Future Actions Place Holder */}
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </main>

            {/* Global Toast Notifications */}
            <div id="notification-toast">
            <Toast
                show={toast.show}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={closeToast}
                duration={toast.type === 'info' ? 5000 : 3000}
            />
            </div>

            {/* Command Palette */}
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
};

export default AdminLayout;
