import React, { useEffect, useState } from 'react';

const SPLASH_SESSION_KEY = 'poltekpar-mobile-splash-seen';
const POLTEKPAR_LOGO_URL = 'https://p3m.poltekparmakassar.ac.id/storage/2025/10/cropped-Screenshot_2024-01-15_101923-removebg-preview.png';

type SplashPhase = 'hidden' | 'visible' | 'closing';

export default function MobileSplashScreen() {
    const [phase, setPhase] = useState<SplashPhase>('hidden');

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const hasSeenSplash = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
        if (hasSeenSplash) {
            return undefined;
        }

        window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
        setPhase('visible');

        const fadeTimer = window.setTimeout(() => {
            setPhase('closing');
        }, 1850);

        const removeTimer = window.setTimeout(() => {
            setPhase('hidden');
        }, 2280);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(removeTimer);
        };
    }, []);

    if (phase === 'hidden') {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
                phase === 'closing' ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-poltekpar-primary via-poltekpar-navy to-slate-900"></div>

            {/* Orb Effects */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-poltekpar-primary/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            {/* Main Card */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                {/* Logo Shell */}
                <div className="relative mb-8">
                    {/* Animated Rings */}
                    <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></span>
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping delay-300"></span>

                    {/* Logo Viewport */}
                    <div className="relative w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                        <img
                            src={POLTEKPAR_LOGO_URL}
                            alt="Logo Poltekpar Makassar"
                            className="w-20 h-20 object-contain"
                        />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center mb-8">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                        Sistem Informasi Geospasial
                    </p>
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">SIGAPPA</h1>
                    <p className="text-poltekpar-gold text-xs font-bold uppercase tracking-widest">Politeknik Pariwisata Makassar</p>
                </div>

                {/* Loader */}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></span>
                </div>
            </div>
        </div>
    );
}
