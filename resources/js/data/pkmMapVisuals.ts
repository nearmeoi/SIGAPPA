import L from 'leaflet';

export interface PkmTypeMeta {
    key: string;
    label: string;
    color: string;
    deskripsi?: string;
}

export interface PkmStatusMeta {
    key: string;
    label: string;
    markerIcon: string;
}

export const PKM_STATUS_META: Record<string, PkmStatusMeta> = {
    selesai: {
        key: 'selesai',
        label: 'Selesai',
        markerIcon: 'fa-check-double',
    },
    berlangsung: {
        key: 'berlangsung',
        label: 'Berlangsung',
        markerIcon: 'fa-hourglass-half',
    },
    ada_pengajuan: {
        key: 'ada_pengajuan',
        label: 'Tahap Pengajuan',
        markerIcon: 'fa-file-import',
    },
    belum_mulai: {
        key: 'belum_mulai',
        label: 'Belum Mulai',
        markerIcon: 'fa-clock',
    },
    diproses: {
        key: 'diproses',
        label: 'Dalam Proses',
        markerIcon: 'fa-spinner',
    },
    direvisi: {
        key: 'direvisi',
        label: 'Perlu Revisi',
        markerIcon: 'fa-pen-to-square',
    },
};

const FALLBACK_COLOR_PALETTE = [
    '#2563EB',
    '#DC2626',
    '#059669',
    '#D97706',
    '#7C3AED',
    '#0891B2',
    '#EA580C',
    '#65A30D',
    '#DB2777',
    '#4F46E5',
    '#0F766E',
    '#B91C1C',
];

const normalizeTypeLabel = (value: unknown) => {
    if (typeof value === 'string') {
        return value.trim() || 'Lainnya';
    }

    if (value && typeof value === 'object' && 'nama_jenis' in value) {
        return String((value as { nama_jenis?: unknown }).nama_jenis ?? '').trim() || 'Lainnya';
    }

    return String(value ?? '').trim() || 'Lainnya';
};

const normalizeHexColor = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
};

const getTypeColorFromItem = (item: any): string | null => {
    const rawJenis = item?.jenis_pkm;

    return normalizeHexColor(
        item?.warna_icon
        ?? (typeof rawJenis === 'object' && rawJenis !== null ? rawJenis?.warna_icon ?? rawJenis?.warna : null)
    );
};

const pickFallbackDistinctColor = (usedColors: Set<string>, label: string): string => {
    const seededOffset = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_COLOR_PALETTE.length;

    for (let index = 0; index < FALLBACK_COLOR_PALETTE.length; index += 1) {
        const candidate = FALLBACK_COLOR_PALETTE[(seededOffset + index) % FALLBACK_COLOR_PALETTE.length];
        if (!usedColors.has(candidate)) {
            return candidate;
        }
    }

    return FALLBACK_COLOR_PALETTE[seededOffset];
};

/**
 * Mengekstrak jenis PKM secara dinamis dari seluruh pkmData yang ada.
 * Warna setiap jenis mengikuti hex di master data Jenis PKM.
 * Jika data belum punya warna valid, gunakan fallback yang tetap berbeda.
 */
export const extractDynamicPkmTypes = (pkmData: any[]): PkmTypeMeta[] => {
    if (!Array.isArray(pkmData) || pkmData.length === 0) return [];

    const jenisMap = new Map<string, { rawLabel: string; color: string; deskripsi: string }>();
    const usedColors = new Set<string>();

    pkmData.forEach((item) => {
        const rawLabel = normalizeTypeLabel(item?.jenis_pkm);
        const preferredColor = getTypeColorFromItem(item);
        const deskripsi = item?.deskripsi_jenis || '';

        if (!jenisMap.has(rawLabel)) {
            const finalColor = preferredColor && !usedColors.has(preferredColor)
                ? preferredColor
                : pickFallbackDistinctColor(usedColors, rawLabel);

            jenisMap.set(rawLabel, {
                rawLabel,
                color: finalColor,
                deskripsi,
            });
            usedColors.add(finalColor);
        }
    });

    return Array.from(jenisMap.values()).map((jenis) => {
        const labelStr = jenis.rawLabel;
        const displayLabel = labelStr; // Remove PKM prefix logic

        return { key: labelStr, label: displayLabel, color: jenis.color, deskripsi: jenis.deskripsi };
    });
};

export const getPkmStatusMeta = (status: any): PkmStatusMeta => {
    const statusKey = String(status ?? 'berlangsung').toLowerCase();
    return PKM_STATUS_META[statusKey] ?? PKM_STATUS_META.berlangsung;
};

// Menggunakan tipe meta statis bila hanya 1 elemen (fallback), tapi lebih baik kirim color statis override dari caller
export const createPkmMarkerIcon = (status: string, color: string, isReview: boolean = false) => {
    const statusMeta = getPkmStatusMeta(status);
    const isNew = status === 'ada_pengajuan' || status === 'diproses' || status === 'direvisi';
    const shouldJump = isNew && !isReview;

    return L.divIcon({
        className: `custom-leaflet-marker${shouldJump ? ' pkm-marker--new' : ''}`,
        html: `
            <div class="pkm-map-marker-wrap" style="--pkm-marker-color: ${color}">
                <div class="pkm-map-marker${shouldJump ? ' pkm-map-marker--large' : ''}">
                    <span class="pkm-map-marker__inner">
                        <i class="fa-solid ${statusMeta.markerIcon}"></i>
                    </span>
                </div>
            </div>
        `,
        iconSize: shouldJump ? [38, 52] : [30, 40],
        iconAnchor: shouldJump ? [19, 44] : [15, 34],
        popupAnchor: [0, -32],
    });
};

export const PKM_LEGEND_STATUSES = Object.values(PKM_STATUS_META);
