import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

interface MenuItemChild {
    label: string;
    href: string;
    target?: string;
}

interface MenuItem {
    label: string;
    href?: string;
    children?: MenuItemChild[];
}

const menuItems: MenuItem[] = [
    {
        label: 'Beranda',
        href: 'https://p3m.poltekparmakassar.ac.id/',
    },
    {
        label: 'Profil',
        children: [
            { label: 'Tentang Kami', href: 'https://p3m.poltekparmakassar.ac.id/profil/tentang-kami/' },
            { label: 'Visi dan Misi', href: 'https://p3m.poltekparmakassar.ac.id/profil/visi-dan-misi/' },
            { label: 'Struktur Organisasi Tahun 2026', href: 'https://p3m.poltekparmakassar.ac.id/profil/struktur-organisasi/' },
            { label: 'Hubungi Kami', href: 'https://p3m.poltekparmakassar.ac.id/hubungi-kami/' },
        ],
    },
    {
        label: 'Kegiatan',
        children: [
            { label: 'Penelitian', href: 'https://p3m.poltekparmakassar.ac.id/kegiatan/penelitian/' },
            { label: 'Conference Internasional', href: 'https://p3m.poltekparmakassar.ac.id/conference-internasional/' },
            { label: 'Seminar Nasional', href: 'https://p3m.poltekparmakassar.ac.id/seminar-nasional/' },
        ],
    },
    {
        label: 'Informasi',
        children: [
            { label: 'Berita', href: 'https://p3m.poltekparmakassar.ac.id/informasi/berita/' },
            { label: 'Info Seminar', href: 'https://p3m.poltekparmakassar.ac.id/informasi/pengumuman/' },
            { label: 'Pengumuman', href: 'https://p3m.poltekparmakassar.ac.id/pengumuman/' },
        ],
    },
    {
        label: 'Dokumen',
        href: 'https://p3m.poltekparmakassar.ac.id/dokumen/',
    },
    {
        label: 'Publikasi',
        children: [
            { label: 'Penelitian', href: 'https://p3m.poltekparmakassar.ac.id/penelitian/' },
            { label: 'Pengabdian', href: 'https://p3m.poltekparmakassar.ac.id/pengabdian/' },
            { label: 'Padaidi', href: 'https://journal.poltekparmakassar.ac.id/index.php/padaidi', target: '_blank' },
            { label: 'Pusaka', href: 'https://journal.poltekparmakassar.ac.id/index.php/pusaka', target: '_blank' },
            { label: 'Hak Cipta', href: 'https://p3m.poltekparmakassar.ac.id/publikasi/sentra-haki/hak-cipta/' },
            { label: 'Buku', href: 'https://p3m.poltekparmakassar.ac.id/buku/' },
        ],
    },
];

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState<number | null>(null);
    const { url = '' } = usePage();
    const showLogoutButton = url.startsWith('/login/dosen') || url.startsWith('/login/masyarakat');

    const toggleMobileMenu = () => {
        setMobileMenuOpen((prev) => {
            const next = !prev;
            if (!next) {
                setSubmenuOpen(null);
            }
            return next;
        });
    };

    const toggleSubmenu = (index: number) => {
        if (window.innerWidth > 768) {
            return;
        }
        setSubmenuOpen((prev) => (prev === index ? null : index));
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setSubmenuOpen(null);
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Brand */}
                    <a href="https://p3m.poltekparmakassar.ac.id/" className="flex items-center gap-3 group">
                        <img
                            src="https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png"
                            alt="P3M Poltekpar"
                            className="w-12 h-12 object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="hidden lg:block">
                            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                PUSAT PENELITIAN DAN
                            </span>
                            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                PENGABDIAN MASYARAKAT
                            </span>
                            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                                POLITEKNIK PARIWISATA MAKASSAR
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                                Centre for Marine Tourism
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {menuItems.map((item) => {
                            const hasChildren = Boolean(item.children?.length);

                            return (
                                <div key={item.label} className="relative group">
                                    {hasChildren ? (
                                        <>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-poltekpar-primary transition-colors"
                                            >
                                                <span>{item.label}</span>
                                                <i className="fa-solid fa-chevron-down text-xs"></i>
                                            </button>
                                            <ul className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                                                {item.children?.map((child) => (
                                                    <li key={child.label}>
                                                        <a
                                                            href={child.href}
                                                            className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-poltekpar-primary transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                            target={child.target}
                                                            rel={child.target === '_blank' ? 'noreferrer' : undefined}
                                                        >
                                                            {child.label}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <a
                                            href={item.href}
                                            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-poltekpar-primary transition-colors"
                                        >
                                            {item.label}
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        {showLogoutButton ? (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-poltekpar-primary hover:bg-poltekpar-navy rounded-full transition-colors shadow-md"
                            >
                                Logout
                            </Link>
                        ) : (
                            <a
                                href="/login"
                                className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-poltekpar-primary hover:bg-poltekpar-navy rounded-full transition-colors shadow-md"
                            >
                                Login
                            </a>
                        )}

                        <button
                            type="button"
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                            aria-label="Quick menu"
                        >
                            <i className="fa-solid fa-align-justify"></i>
                        </button>

                        <button
                            type="button"
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="English"
                        >
                            <img
                                src="https://flagcdn.com/w40/gb.png"
                                alt="English"
                                className="w-6 h-4.5 rounded object-cover"
                            />
                        </button>

                        <button
                            type="button"
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                            aria-label="Collapse"
                        >
                            <i className="fa-solid fa-angle-up"></i>
                        </button>

                        {/* Hamburger Menu */}
                        <button
                            type="button"
                            className={`lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-colors ${mobileMenuOpen ? 'text-poltekpar-primary' : 'text-slate-600'
                                }`}
                            onClick={toggleMobileMenu}
                            aria-label="Toggle menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                                    }`}
                            ></span>
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''
                                    }`}
                            ></span>
                            <span
                                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                                    }`}
                            ></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-screen' : 'max-h-0'
                    }`}
            >
                <nav className="px-4 py-4 space-y-1">
                    {menuItems.map((item, index) => {
                        const hasChildren = Boolean(item.children?.length);
                        const isSubmenuOpen = submenuOpen === index;

                        return (
                            <div key={item.label}>
                                {hasChildren ? (
                                    <>
                                        <button
                                            type="button"
                                            className={`flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isSubmenuOpen
                                                    ? 'bg-slate-100 text-poltekpar-primary'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            onClick={() => toggleSubmenu(index)}
                                        >
                                            <span>{item.label}</span>
                                            <i
                                                className={`fa-solid fa-chevron-${isSubmenuOpen ? 'up' : 'down'} text-xs transition-transform`}
                                            ></i>
                                        </button>
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ${isSubmenuOpen ? 'max-h-96 mt-1' : 'max-h-0'
                                                }`}
                                        >
                                            <ul className="ml-4 space-y-1">
                                                {item.children?.map((child) => (
                                                    <li key={child.label}>
                                                        <a
                                                            href={child.href}
                                                            className="block px-3 py-2 text-sm text-slate-600 hover:text-poltekpar-primary hover:bg-slate-50 rounded-lg transition-colors"
                                                            target={child.target}
                                                            rel={child.target === '_blank' ? 'noreferrer' : undefined}
                                                            onClick={closeMobileMenu}
                                                        >
                                                            {child.label}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <a
                                        href={item.href}
                                        className="block px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-poltekpar-primary rounded-lg transition-colors"
                                        onClick={closeMobileMenu}
                                    >
                                        {item.label}
                                    </a>
                                )}
                            </div>
                        );
                    })}

                    {/* Mobile Auth Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        {showLogoutButton ? (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                                <i className="fa-solid fa-right-from-bracket mr-2"></i>
                                Logout
                            </Link>
                        ) : (
                            <a
                                href="/login"
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-poltekpar-primary hover:bg-poltekpar-navy rounded-lg transition-colors"
                                onClick={closeMobileMenu}
                            >
                                <i className="fa-solid fa-right-to-bracket mr-2"></i>
                                Login
                            </a>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
