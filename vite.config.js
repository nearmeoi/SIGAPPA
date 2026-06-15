import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    esbuild: {
        loader: 'tsx',
    },
    build: {
        outDir: '../build',
        emptyOutDir: true,
        // PERF FIX: Split large vendor libraries into separate chunks.
        // Without this, Leaflet + Chart.js + xlsx + Pusher are all bundled into one
        // massive JS file, making every page load slower than necessary.
        // With chunks, browsers cache each library separately and only re-download
        // what actually changed.
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React — smallest, most shared, cache forever
                    'vendor-react': ['react', 'react-dom'],

                    // Inertia.js router — shared across all pages
                    'vendor-inertia': ['@inertiajs/react'],

                    // Icons — large package, rarely changes
                    'vendor-icons': ['lucide-react'],

                    // Map library — very large (~500KB), only needed on map pages
                    'vendor-map': ['leaflet', 'react-leaflet'],

                    // Charts — large, only needed on dashboard
                    'vendor-charts': ['chart.js', 'react-chartjs-2'],

                    // WebSocket — loaded lazily after page load already
                    'vendor-ws': ['pusher-js', 'laravel-echo'],

                    // Excel export — heavy, only needed on export actions
                    'vendor-xlsx': ['xlsx'],
                },
            },
        },
    },
});
