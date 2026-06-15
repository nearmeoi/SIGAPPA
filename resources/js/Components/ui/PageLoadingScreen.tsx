import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

/**
 * Floating "Memuat" spinner badge — shown on every Inertia navigation.
 * Appears instantly on start, disappears immediately on finish (no artificial delay).
 */
export default function PageLoadingScreen() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let hideTimer: ReturnType<typeof setTimeout>;

        const show = () => {
            clearTimeout(hideTimer);
            setVisible(true);
        };

        const hide = () => {
            clearTimeout(hideTimer);
            // Tiny delay so it doesn't flash on very fast navigations
            hideTimer = setTimeout(() => setVisible(false), 80);
        };

        const removeStart = router.on('start', show);
        const removeFinish = router.on('finish', hide);

        return () => {
            clearTimeout(hideTimer);
            removeStart();
            removeFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className="pointer-events-none fixed right-5 top-5 z-[9999]"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            aria-hidden="true"
            role="status"
        >
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-poltekpar-primary" />
                <span className="text-xs font-semibold text-slate-600">Memuat</span>
            </div>
        </div>
    );
}
