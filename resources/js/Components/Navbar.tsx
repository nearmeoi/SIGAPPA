import React, { useState, useCallback, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ProfileDropdown from '@/Components/ProfileDropdown';
import type { User, Auth, PageProps } from '@/types/index';

interface NavLink {
    label: string;
    href: string;
    icon: string;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
};

const getNavLinks = (user: User | null): NavLink[] => {
    const navLinks: NavLink[] = [
        { label: 'Beranda', href: '/beranda', icon: 'fa-house' },
    ];

    if (!user) {
        navLinks.push({ label: 'Panduan', href: '/panduan', icon: 'fa-book-open' });
        navLinks.push({ label: 'Feedback', href: '/evaluasi', icon: 'fa-star' });
        return navLinks;
    }

    if (user?.role === 'admin') {
        navLinks.push({ label: 'Panel Admin', href: '/admin/dashboard', icon: 'fa-gauge-high' });
    }

    navLinks.push(
        { label: 'Cek Status', href: '/cek-status', icon: 'fa-magnifying-glass' },
        { label: 'Pengajuan', href: '/pengajuan', icon: 'fa-file-circle-plus' },
        { label: 'Feedback', href: '/evaluasi', icon: 'fa-star' },
        { label: 'Panduan', href: '/panduan', icon: 'fa-book-open' }
    );

    return navLinks;
};

export default function Navbar() {
    const { props, url } = usePage<PageProps>();
    const { auth } = props;
    const user = auth?.user ?? null;
    const poltekparLogoSrc = '/logo-poltekpar.png';
    const navLinks = useMemo(() => getNavLinks(user), [user]);

    const isActive = useCallback((href: string) => {
        if (href === '/beranda') return url === '/beranda';
        if (href.startsWith('#')) return false;
        return url === href || url.startsWith(href + '/');
    }, [url]);

    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleMobile = useCallback(() => {
        setMobileOpen((prev) => !prev);
    }, []);

    const closeMobile = useCallback(() => {
        setMobileOpen(false);
    }, []);

    const appName = (import.meta.env.VITE_APP_NAME && !import.meta.env.VITE_APP_NAME.includes('${')) 
        ? import.meta.env.VITE_APP_NAME 
        : 'SIGAPPA';

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <Link
                        href="/beranda"
                        className="flex items-center gap-3 group"
                    >
                        <span className="w-10 h-10 flex items-center justify-center">
                            <img
                                src={poltekparLogoSrc}
                                alt=""
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                        </span>
                        <div className="hidden sm:block">
                            <span className="block text-xs font-bold text-poltekpar-navy uppercase tracking-wide leading-tight">
                                Sistem Informasi Geospasial dan Akses Pelayanan
                                <br />
                                Pariwisata ({appName})
                            </span>
                            <span className="block text-xs font-medium text-slate-500 mt-0.5">
                                Politeknik Pariwisata Makassar
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
                        <ul className="flex items-center gap-1">
                            {navLinks.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? 'text-poltekpar-primary bg-blue-50 font-semibold'
                                                : 'text-slate-700 hover:text-poltekpar-primary hover:bg-slate-50'
                                        }`}
                                        onClick={closeMobile}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Utility */}
                    <div className="hidden lg:flex items-center gap-4">
                        <a
                            href="https://p3m.poltekparmakassar.ac.id/"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-poltekpar-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                            <span>Portal P3M</span>
                        </a>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        <ProfileDropdown auth={auth} />

                        {/* Hamburger */}
                        <button
                            type="button"
                            className={`md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-colors ${
                                mobileOpen ? 'text-poltekpar-primary' : 'text-slate-600'
                            }`}
                            onClick={toggleMobile}
                            aria-label="Toggle navigation"
                            aria-expanded={mobileOpen}
                        >
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                                    mobileOpen ? 'rotate-45 translate-y-2' : ''
                                }`}
                            ></span>
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                                    mobileOpen ? 'opacity-0' : ''
                                }`}
                            ></span>
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                                    mobileOpen ? '-rotate-45 -translate-y-2' : ''
                                }`}
                            ></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            <div
                className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <img src={poltekparLogoSrc} alt="" className="w-8 h-8 object-contain" />
                            <span className="text-sm font-bold text-poltekpar-navy">{appName}</span>
                        </div>
                        <button
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                            onClick={closeMobile}
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    {/* Drawer Links */}
                    <ul className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                        {navLinks.map((item) => (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                                        isActive(item.href)
                                            ? 'text-poltekpar-primary bg-blue-50 font-semibold'
                                            : 'text-slate-700 hover:text-poltekpar-primary hover:bg-slate-50'
                                    }`}
                                    onClick={closeMobile}
                                >
                                    <i className={`fa-solid ${item.icon} w-5 text-center ${isActive(item.href) ? 'text-poltekpar-primary' : 'text-poltekpar-primary/60'}`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Drawer Footer - Auth */}
                    <div className="px-4 py-4 border-t border-slate-100">
                        {user ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white font-bold text-sm">
                                        <span className="">{getInitials(user.name)}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-poltekpar-navy">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-poltekpar-primary hover:bg-poltekpar-navy rounded-lg transition-colors"
                                onClick={closeMobile}
                            >
                                <i className="fa-solid fa-right-to-bracket"></i>
                                <span>Masuk / Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
                    onClick={closeMobile}
                ></div>
            )}
        </header>
    );
}
