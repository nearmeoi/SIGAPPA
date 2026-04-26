import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

type LoadPhase = 'hidden' | 'entering' | 'visible' | 'leaving';

export default function PageLoadingScreen() {
    const [phase, setPhase] = useState<LoadPhase>('hidden');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (document.readyState !== 'complete') {
            setPhase('entering');
            setTimeout(() => setPhase('visible'), 40);

            const onLoad = () => {
                setPhase('leaving');
                setTimeout(() => setPhase('hidden'), 160);
            };
            window.addEventListener('load', onLoad, { once: true });
            return () => window.removeEventListener('load', onLoad);
        }
    }, []);

    useEffect(() => {
        let visibleTimer: ReturnType<typeof setTimeout>;
        let hideTimer: ReturnType<typeof setTimeout>;

        const onStart = () => {
            clearTimeout(visibleTimer);
            clearTimeout(hideTimer);
            setPhase('entering');
            visibleTimer = setTimeout(() => setPhase('visible'), 40);
        };

        const onFinish = () => {
            clearTimeout(visibleTimer);
            setPhase('leaving');
            hideTimer = setTimeout(() => setPhase('hidden'), 160);
        };

        const removeStart = router.on('start', onStart);
        const removeFinish = router.on('finish', onFinish);

        return () => {
            clearTimeout(visibleTimer);
            clearTimeout(hideTimer);
            removeStart();
            removeFinish();
        };
    }, []);

    if (phase === 'hidden') return null;

    const isVisible = phase === 'visible' || phase === 'entering';

    return (
        <div
            className="pointer-events-none fixed right-5 top-5 z-[9999]"
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.18s ease, transform 0.18s ease',
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
