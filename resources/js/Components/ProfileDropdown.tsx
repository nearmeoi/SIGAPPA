import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { User, PageProps } from '@/types/index';

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
};

interface RoleBadge {
    label: string;
    className: string;
}

const getRoleBadge = (user: User | null): RoleBadge | null => {
    if (!user) return null;

    const role = String(user.role || user.type || 'masyarakat').toLowerCase();
    const isAdmin = role === 'admin';
    const isDosen = role.includes('dosen');

    if (isAdmin) {
        return {
            label: 'Administrator',
            className: 'bg-indigo-100 text-indigo-700 font-bold',
        };
    }

    return {
        label: isDosen ? 'Akun Dosen' : 'Akun Masyarakat',
        className: isDosen ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700',
    };
};

function useClickOutside(
    targetRef: React.RefObject<HTMLElement | null>,
    enabled: boolean,
    onClose: () => void
) {
    useEffect(() => {
        if (!enabled) return undefined;

        const handlePointerDown = (event: MouseEvent) => {
            if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [enabled, onClose, targetRef]);
}

interface ProfileDropdownProps {
    auth?: {
        user: User | null;
    };
}

export default function ProfileDropdown({ auth: propsAuth }: ProfileDropdownProps) {
    const { props } = usePage<PageProps>();
    const auth = propsAuth || props.auth;
    const user = auth?.user ?? null;
    const [isOpen, setIsOpen] = useState(false);
    const shellRef = useRef<HTMLDivElement>(null);

    const badge = useMemo(() => getRoleBadge(user), [user]);
    const avatarSrc = user?.avatar || user?.avatar_url || user?.profile_photo_url || null;
    const logoutHref = '/logout'; // Direct path for logout

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggleDropdown = useCallback(() => {
        setIsOpen((previous) => !previous);
    }, []);

    useClickOutside(shellRef, isOpen, closeDropdown);

    // Get the normalized role
    const userRole = useMemo(() => {
        if (!user) return null;
        return String(user.role || user.type || '').toLowerCase();
    }, [user]);

    if (!user) {
        return (
            <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-poltekpar-primary text-white font-medium rounded-lg hover:bg-poltekpar-navy transition-colors duration-200"
            >
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>Login</span>
            </Link>
        );
    }

    return (
        <div className="relative" ref={shellRef}>
            {/* Trigger Button */}
            <button
                type="button"
                className={`flex items-center gap-3 p-2 pr-4 bg-white rounded-full transition-all duration-200 hover:shadow-soft focus:outline-none ${
                    isOpen ? 'shadow-soft' : ''
                }`}
                onClick={toggleDropdown}
                aria-label="Buka menu profil"
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy text-white font-bold`}>
                    {avatarSrc ? (
                        <img 
                            src={avatarSrc} 
                            alt={user.name || 'Profil pengguna'} 
                            className="w-full h-full rounded-full object-cover" 
                        />
                    ) : (
                        <span>{getInitials(user.name)}</span>
                    )}
                </span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200" 
                    role="menu" 
                    aria-label="Menu profil pengguna"
                >
                    {/* Header */}
                    <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 text-base line-clamp-1">{user.name || 'Pengguna'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {badge && (
                            <span className={`inline-block mt-2 px-3 py-1 text-[10px] font-bold uppercase rounded-full ${badge.className}`}>
                                {badge.label}
                            </span>
                        )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        {['admin', 'superadmin', 'secret_account'].includes(userRole || '') ? (
                            <Link 
                                href="/admin/dashboard" 
                                className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-slate-50 hover:text-poltekpar-primary transition-colors duration-150" 
                                role="menuitem" 
                                onClick={closeDropdown}
                            >
                                <i className="fa-solid fa-gauge-high text-lg text-poltekpar-primary"></i>
                                <span className="font-semibold">Panel Admin</span>
                            </Link>
                        ) : (
                            <Link 
                                href="/cek-status"
                                className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-slate-50 hover:text-poltekpar-primary transition-colors duration-150" 
                                role="menuitem" 
                                onClick={closeDropdown}
                            >
                                <i className="fa-solid fa-rectangle-list text-lg text-poltekpar-primary"></i>
                                <span className="font-medium">Status Pengajuan</span>
                            </Link>
                        )}
                        
                        <Link 
                            href="/profile/edit" 
                            className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-slate-50 hover:text-poltekpar-primary transition-colors duration-150" 
                            role="menuitem" 
                            onClick={closeDropdown}
                        >
                            <i className="fa-solid fa-user-pen text-lg"></i>
                            <span className="font-medium">Edit Profil</span>
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                        <Link
                            href={logoutHref}
                            method="post"
                            as="button"
                            className="flex items-center gap-3 w-full px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors duration-150"
                            role="menuitem"
                        >
                            <i className="fa-solid fa-right-from-bracket"></i>
                            <span>Log Out</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
