import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Fixes Leaflet's default marker icon paths when bundled with Vite/Webpack.
 * Call once at app startup or in any component that renders a Leaflet map.
 */
export function fixLeafletDefaultIcon(): void {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    });
}
