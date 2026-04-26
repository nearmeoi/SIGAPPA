import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { router } from '@inertiajs/react';

const STORAGE_KEY = 'sigap_notifications';

interface NotificationItem {
    id_pengajuan: number;
    judul_kegiatan: string;
    status_pengajuan: string;
    catatan_admin: string | null;
    created_at: string;
    admin_read_at: string | null;
}

interface NotificationCounts {
    pengajuan_baru: number;
    perlu_direvisi: number;
    pengajuan_diterima: number;
    kegiatan_berjalan: number;
}

interface NotificationData {
    counts: NotificationCounts;
    items: NotificationItem[];
}

interface StoredData {
    counts: NotificationCounts;
    items: NotificationItem[];
    lastFetch: number;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay < 7) return `${diffDay} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const statusBadge = (status: string): { label: string; className: string } => {
    if (status === 'diproses') {
        return { label: 'Pengajuan Baru', className: 'bg-blue-100 text-blue-700' };
    }
    if (status === 'direvisi') {
        return { label: 'Perlu Revisi', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: status, className: 'bg-slate-100 text-slate-600' };
};

function getCsrfToken(): string {
    return (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1]
        ? decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1])
        : (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

function loadFromStorage(): StoredData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredData;
    } catch {
        return null;
    }
}

function saveToStorage(data: NotificationData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            counts: data.counts,
            items: data.items,
            lastFetch: Date.now(),
        }));
    } catch {
        // ignore
    }
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<NotificationData | null>(null);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const shellRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);
    const prevUnreadCount = useRef(0);
    const prevIds = useRef<Set<number>>(new Set());

    const unreadCount = items.filter(i => !i.admin_read_at).length;

    const detectNewNotifications = useCallback((newItems: NotificationItem[]) => {
        const newUnread = newItems.filter(i => !i.admin_read_at);
        const currentUnreadCount = newUnread.length;

        if (prevUnreadCount.current === 0) {
            prevUnreadCount.current = currentUnreadCount;
            prevIds.current = new Set(newUnread.map(i => i.id_pengajuan));
            return;
        }

        if (currentUnreadCount > prevUnreadCount.current) {
            const trulyNew = newUnread.filter(i => !prevIds.current.has(i.id_pengajuan));
            trulyNew.forEach(item => {
                window.dispatchEvent(new CustomEvent('new-notification', { detail: item }));
            });

            setHasNewNotif(true);
            setTimeout(() => setHasNewNotif(false), 3000);
        }

        prevUnreadCount.current = currentUnreadCount;
        prevIds.current = new Set(newUnread.map(i => i.id_pengajuan));
    }, []);

    const fetchNotifications = useCallback(() => {
        if (isFetching.current) return;
        isFetching.current = true;
        fetch('/admin/api/notifications', {
            headers: { 'Accept': 'application/json' },
        })
            .then(res => {
                if (!res.ok) return undefined;
                return res.json();
            })
            .then((result: NotificationData | undefined) => {
                if (!result?.items) return;
                setData(result);
                setItems(result.items);
                saveToStorage(result);
                detectNewNotifications(result.items);
            })
            .catch(() => {})
            .finally(() => {
                isFetching.current = false;
            });
    }, [detectNewNotifications]);

    useEffect(() => {
        const stored = loadFromStorage();
        if (stored?.items) {
            setItems(stored.items);
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleItemClick = (item: NotificationItem) => {
        setItems(prev => prev.map(n =>
            n.id_pengajuan === item.id_pengajuan
                ? { ...n, admin_read_at: new Date().toISOString() }
                : n
        ));

        fetch('/admin/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({ ids: [item.id_pengajuan] }),
        }).catch(() => {});

        setIsOpen(false);
        router.visit(`/admin/pengajuan/${item.id_pengajuan}`);
    };

    const handleMarkAllRead = () => {
        setItems(prev => prev.map(n => ({ ...n, admin_read_at: n.admin_read_at ?? new Date().toISOString() })));

        fetch('/admin/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        }).catch(() => {});
    };

    return (
        <div className="relative" ref={shellRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 ${
                    hasNewNotif ? 'animate-shake' : ''
                }`}
                aria-label="Notifikasi"
            >
                <Bell size={20} className={unreadCount > 0 ? 'text-poltekpar-primary' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-gradient-to-r from-poltekpar-primary/5 to-transparent border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Notifikasi</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {unreadCount > 0
                                    ? `${unreadCount} belum dibaca`
                                    : 'Semua sudah dibaca'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-poltekpar-primary bg-poltekpar-primary/10 rounded-lg hover:bg-poltekpar-primary/20 transition-colors"
                            >
                                <CheckCheck size={14} />
                                Tandai Semua Dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-[24rem] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-400 font-medium">Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            items.map(item => {
                                const badge = statusBadge(item.status_pengajuan);
                                const isUnread = !item.admin_read_at;

                                return (
                                    <button
                                        key={item.id_pengajuan}
                                        onClick={() => handleItemClick(item)}
                                        className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors duration-150 ${
                                            isUnread ? 'bg-blue-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {isUnread && (
                                                <span className="mt-2 w-2 h-2 bg-poltekpar-primary rounded-full flex-shrink-0"></span>
                                            )}
                                            <div className={`flex-1 min-w-0 ${!isUnread ? 'ml-5' : ''}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {item.judul_kegiatan || 'Tanpa Judul'}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                {item.catatan_admin && (
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {item.catatan_admin}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[11px] text-slate-400">{timeAgo(item.created_at)}</span>
                                                    <ExternalLink size={10} className="text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
