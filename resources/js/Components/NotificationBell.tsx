import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

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
    pengajuan_diajukan: number;
    unread_count: number;
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
    if (diffMin < 60) return `${diffMin}m lalu`;
    if (diffHour < 24) return `${diffHour}j lalu`;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
}

const statusBadge = (status: string): { label: string; className: string } => {
    const base = "px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide";
    switch(status) {
        case 'diproses':
            return { label: 'PENGAJUAN BARU', className: `${base} bg-blue-100 text-blue-700` };
        case 'direvisi':
            return { label: 'PERLU REVISI', className: `${base} bg-amber-100 text-amber-700` };
        case 'diajukan':
            return { label: 'VERIFIKASI PIMPINAN', className: `${base} bg-poltekpar-primary text-white` };
        case 'diterima':
            return { label: 'DISETUJUI', className: `${base} bg-emerald-100 text-emerald-700` };
        case 'ditolak':
            return { label: 'DITOLAK', className: `${base} bg-rose-100 text-rose-700` };
        default:
            return { label: status.toUpperCase(), className: `${base} bg-slate-100 text-slate-600` };
    }
};

const getSourceInfo = (status: string, isDirektur: boolean): { label: string; color: string } => {
    if (isDirektur) return { label: 'DARI SISTEM ADMIN', color: 'text-blue-600' };
    if (status === 'diproses') return { label: 'INPUT PENGGUNA', color: 'text-poltekpar-primary' };
    return { label: 'KEPUTUSAN DIREKTUR', color: 'text-amber-600' };
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
    } catch { return null; }
}

function saveToStorage(data: NotificationData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            counts: data.counts,
            items: data.items,
            lastFetch: Date.now(),
        }));
    } catch { }
}

export default function NotificationBell() {
    const { auth } = usePage().props as any;
    const userRole = auth?.user?.role ? String(auth.user.role).toLowerCase() : '';
    const isDirektur = userRole === 'direktur';

    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<NotificationData | null>(null);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const shellRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);
    const prevUnreadCount = useRef(0);
    const prevIds = useRef<Set<number>>(new Set());
    const hasInitialized = useRef(false);

    const unreadCount = data?.counts?.unread_count ?? items.filter(i => !i.admin_read_at).length;

    const detectNewNotifications = useCallback((newItems: NotificationItem[]) => {
        const newUnread = newItems.filter(i => !i.admin_read_at);
        const currentUnreadCount = newUnread.length;

        // Initialize on first fetch — jangan trigger notif, hanya set baseline
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            prevIds.current = new Set(newItems.map(i => i.id_pengajuan));
            prevUnreadCount.current = currentUnreadCount;
            return;
        }

        // Detect truly new items (not just count change)
        const trulyNew = newUnread.filter(i => !prevIds.current.has(i.id_pengajuan));
        
        if (trulyNew.length > 0) {
            // Trigger Flash Notification in Layout
            trulyNew.forEach(item => {
                window.dispatchEvent(new CustomEvent('new-notification', { detail: item }));
            });

            setHasNewNotif(true);
            setTimeout(() => setHasNewNotif(false), 5000);
        }

        prevUnreadCount.current = currentUnreadCount;
        prevIds.current = new Set(newItems.map(i => i.id_pengajuan));
    }, []);

    const fetchNotifications = useCallback(() => {
        if (isFetching.current) return;
        isFetching.current = true;
        fetch('/admin/api/notifications', { headers: { 'Accept': 'application/json' } })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((result: NotificationData) => {
                if (!result?.items) return;
                setData(result);
                setItems(result.items);
                saveToStorage(result);
                detectNewNotifications(result.items);
            })
            .catch((err) => {
                console.error('Failed to fetch notifications:', err);
            })
            .finally(() => { isFetching.current = false; });
    }, [detectNewNotifications]);

    useEffect(() => {
        const stored = loadFromStorage();
        if (stored?.items) {
            setItems(stored.items);
            prevIds.current = new Set(stored.items.map(i => i.id_pengajuan));
            hasInitialized.current = true; // baseline dari localStorage sudah ada
        }
        fetchNotifications();

        // Real-time listener using Laravel Echo
        if ((window as any).Echo) {
            const channel = (window as any).Echo.private('notifications');
            
            // Listen with both namespaced and non-namespaced variants as fallback
            channel.listen('.notification.updated', () => {
                setTimeout(fetchNotifications, 500);
            });
            
            // Fallback for some Reverb versions/configs
            channel.listen('NotificationUpdated', () => {
                setTimeout(fetchNotifications, 500);
            });
        }

        const interval = setInterval(fetchNotifications, 60000);
        return () => {
            clearInterval(interval);
            if ((window as any).Echo) (window as any).Echo.leave('notifications');
        };
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (shellRef.current && !shellRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleItemClick = (item: NotificationItem) => {
        setItems(prev => prev.map(n => n.id_pengajuan === item.id_pengajuan ? { ...n, admin_read_at: new Date().toISOString() } : n));
        setData(prev => prev ? { ...prev, counts: { ...prev.counts, unread_count: Math.max(0, prev.counts.unread_count - 1) } } : null);
        
        fetch('/admin/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({ ids: [item.id_pengajuan] }),
        }).catch(() => { });
        
        setIsOpen(false);
        router.visit(`${isDirektur ? '/direktur' : '/admin'}/pengajuan/${item.id_pengajuan}`);
    };

    const handleMarkAllRead = () => {
        setItems(prev => prev.map(n => ({ ...n, admin_read_at: n.admin_read_at ?? new Date().toISOString() })));
        setData(prev => prev ? { ...prev, counts: { ...prev.counts, unread_count: 0 } } : null);
        
        fetch('/admin/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        }).catch(() => { });
    };

    return (
        <div className="relative" ref={shellRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all ${hasNewNotif ? 'animate-shake' : ''}`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'text-poltekpar-primary' : 'text-slate-400'} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
                        <span className="font-black text-slate-900 text-[11px] uppercase tracking-widest">Aktivitas Terkini</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-poltekpar-primary hover:text-poltekpar-navy transition-colors">
                                Tandai sudah dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-[30rem] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-medium tracking-tight">Belum ada aktivitas baru</div>
                        ) : (
                            items.map(item => {
                                const badge = statusBadge(item.status_pengajuan);
                                const source = getSourceInfo(item.status_pengajuan, isDirektur);
                                const isUnread = !item.admin_read_at;

                                return (
                                    <button
                                        key={item.id_pengajuan}
                                        onClick={() => handleItemClick(item)}
                                        className={`w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-all relative ${isUnread ? 'bg-blue-50/30' : 'bg-white'}`}
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[9px] font-black tracking-widest uppercase ${source.color}`}>
                                                    {source.label}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{timeAgo(item.created_at)}</span>
                                            </div>
                                            
                                            <div className="flex gap-2.5">
                                                {isUnread && <div className="mt-1.5 w-1.5 h-1.5 bg-poltekpar-primary rounded-full flex-shrink-0 animate-pulse" />}
                                                <p className={`text-sm leading-snug line-clamp-2 ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                    {item.judul_kegiatan}
                                                </p>
                                            </div>
                                            
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className={badge.className}>
                                                    {badge.label}
                                                </span>
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
