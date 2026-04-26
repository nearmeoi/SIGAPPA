import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import PageLoadingScreen from './Components/PageLoadingScreen';

const rawAppName = import.meta.env.VITE_APP_NAME || 'SIGAPPA';
const appName = rawAppName.includes('${') ? 'SIGAPPA' : rawAppName;

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
    progress: false,
});
