export interface StatusStyle {
    label: string;
    icon: string;
    bg: string;
    color: string;
}

export const STATUS_STYLES: Record<string, StatusStyle> = {
    diproses: { label: 'Diproses', icon: 'fa-clock', bg: '#dbeafe', color: '#1E4A8C' },
    ditangguhkan: { label: 'Ditangguhkan', icon: 'fa-file-pen', bg: '#fef3c7', color: '#b45309' },
    ditolak: { label: 'Ditolak', icon: 'fa-circle-xmark', bg: '#fee2e2', color: '#b91c1c' },
    diterima: { label: 'Diterima', icon: 'fa-circle-check', bg: '#dcfce7', color: '#15803d' },
    berlangsung: { label: 'Berlangsung', icon: 'fa-person-walking', bg: '#fef3c7', color: '#b45309' },
    selesai: { label: 'Selesai', icon: 'fa-flag-checkered', bg: '#dcfce7', color: '#15803d' },
    direvisi: { label: 'Direvisi', icon: 'fa-file-pen', bg: '#fff7ed', color: '#ea580c' },
    belum_diajukan: { label: 'Belum Diajukan', icon: 'fa-file-circle-plus', bg: '#f1f5f9', color: '#64748b' },
};

export function getStatusStyle(status: string): StatusStyle {
    return STATUS_STYLES[status] ?? STATUS_STYLES.belum_diajukan;
}

export function getStatusBadge(status: string): string {
    return status === 'berlangsung' ? 'status-open' : 'status-closed';
}

export function getStatusIcon(status: string): string {
    return status === 'berlangsung' ? 'fa-spinner fa-spin' : 'fa-check-double';
}

export function getStatusText(status: string): string {
    return status === 'berlangsung' ? 'Berlangsung' : 'Selesai';
}

export function getPkmStatusLabel(status: string): string {
    return status === 'berlangsung' ? 'Berlangsung' : 'Selesai';
}

export function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
}

export function createSubmittedLabel(): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date());
}
