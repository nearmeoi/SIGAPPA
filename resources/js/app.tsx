import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import PageLoadingScreen from '@/Components/ui/PageLoadingScreen';

const rawAppName = import.meta.env.VITE_APP_NAME || 'SIGAPPA';
const appName = rawAppName.includes('${') ? 'SIGAPPA' : rawAppName;

// PERF FIX: Echo (Pusher/WebSocket) was imported synchronously at the top,
// blocking React hydration. Lazy-load it after the page is interactive
// so it doesn't delay the first render or any subsequent navigation.
if (typeof window !== 'undefined') {
    const initEcho = () => import('./echo');
    if (document.readyState === 'complete') {
        initEcho();
    } else {
        window.addEventListener('load', initEcho, { once: true });
    }
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <PageLoadingScreen />
                <App {...props} />
            </>
        );
    },
    // progress: false — handled by our custom PageLoadingScreen top bar
    progress: false,
});
