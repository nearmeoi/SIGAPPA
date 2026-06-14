import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Search, FileText, Users, User, Activity, MessageSquare, Folder, X } from 'lucide-react';

interface SearchResult {
    id: number | string;
    title: string;
    subtitle: string;
    url: string;
}

interface SearchResponse {
    pengajuan: SearchResult[];
    users: SearchResult[];
    pegawai: SearchResult[];
    aktivitas: SearchResult[];
    testimoni: SearchResult[];
    arsip: SearchResult[];
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
    pengajuan: { label: 'Pengajuan', icon: FileText },
    users: { label: 'Pengguna', icon: User },
    pegawai: { label: 'Pegawai', icon: Users },
    aktivitas: { label: 'Aktivitas', icon: Activity },
    testimoni: { label: 'Testimoni', icon: MessageSquare },
    arsip: { label: 'Arsip', icon: Folder },
};

interface FlatResult extends SearchResult {
    category: string;
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Flatten results for keyboard navigation
    const flatResults: FlatResult[] = [];
    if (results) {
        for (const [category, items] of Object.entries(results) as [string, SearchResult[]][]) {
            if (items.length > 0) {
                items.forEach((item: SearchResult) => flatResults.push({ ...item, category }));
            }
        }
    }

    // Reset on open/close + fetch recent items
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            // Fetch recent items immediately
            fetchRecent();
        }
    }, [open]);

    const fetchRecent = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/api/search?q=');
            const data = await res.json();
            setResults(data);
        } catch { setResults(null); }
        setLoading(false);
    }, []);

    // Debounced search
    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        setSelectedIndex(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) { fetchRecent(); return; }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/admin/api/search?q=${encodeURIComponent(value)}`);
                const data = await res.json();
                setResults(data);
            } catch { setResults(null); }
            setLoading(false);
        }, 250);
    }, [fetchRecent]);

    // Navigate to result
    const goToResult = useCallback((result: FlatResult) => {
        onClose();
        router.visit(result.url);
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); return; }
            if (e.key === 'Enter' && flatResults.length > 0) { e.preventDefault(); goToResult(flatResults[selectedIndex]); return; }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, flatResults, selectedIndex, onClose, goToResult]);

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

            {/* Modal */}
            <div style={{
                position: 'relative', width: '100%', maxWidth: '580px', margin: '0 16px',
                backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 65px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
                overflow: 'hidden', animation: 'cpSlideDown 0.15s ease',
            }}>
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <Search size={18} style={{ color: '#94a3b8', flexShrink: 0, marginRight: '12px' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Cari pengajuan, pengguna, aktivitas..."
                        style={{
                            flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontWeight: 500,
                            color: '#0f172a', backgroundColor: 'transparent', fontFamily: 'inherit',
                        }}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <X size={14} style={{ color: '#64748b' }} />
                        </button>
                    )}
                    <kbd style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>ESC</kbd>
                </div>

                {/* Results */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px 0' }}>
                    {loading && (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                            Mencari...
                        </div>
                    )}

                    {!loading && query.length >= 2 && flatResults.length === 0 && (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                            Tidak ada hasil untuk "{query}"
                        </div>
                    )}

                    {!loading && results && flatResults.length > 0 && (
                        <div>
                            {Object.entries(results).map(([category, items]) => {
                                if (items.length === 0) return null;
                                const config = categoryConfig[category];
                                if (!config) return null;
                                const Icon = config.icon;
                                const categoryStartIndex = flatResults.findIndex(r => r.category === category);

                                return (
                                    <div key={category} style={{ marginBottom: '4px' }}>
                                        <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Icon size={13} style={{ color: '#94a3b8' }} />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {config.label}{!query ? ' Terakhir' : ''}
                                            </span>
                                        </div>
                                        {(items as SearchResult[]).map((item: SearchResult, i: number) => {
                                            const globalIndex = categoryStartIndex + i;
                                            const isSelected = globalIndex === selectedIndex;
                                            return (
                                                <button
                                                    key={`${category}-${item.id}`}
                                                    onClick={() => goToResult(flatResults[globalIndex])}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    style={{
                                                        width: '100%', textAlign: 'left' as const, padding: '10px 16px 10px 24px',
                                                        display: 'flex', flexDirection: 'column' as const, gap: '2px',
                                                        backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                                                        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                                        cursor: 'pointer', transition: 'all 0.1s',
                                                        borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                                                    }}
                                                >
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#0f172a' : '#334155' }}>
                                                        {item.title}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                        {item.subtitle}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '8px 16px', borderTop: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    fontSize: '11px', color: '#94a3b8', backgroundColor: '#fafafa',
                }}>
                    <span><kbd style={kbdStyle}>↑↓</kbd> Navigasi</span>
                    <span><kbd style={kbdStyle}>↵</kbd> Pilih</span>
                    <span><kbd style={kbdStyle}>esc</kbd> Tutup</span>
                </div>
            </div>

            <style>{`
                @keyframes cpSlideDown { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
}

const kbdStyle: React.CSSProperties = {
    padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 600, color: '#64748b',
};
