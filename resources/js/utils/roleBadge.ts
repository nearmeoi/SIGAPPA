export interface RoleBadge {
    label: string;
    className: string;
}

export const getRoleBadge = (role?: string | null): RoleBadge => {
    switch (String(role || 'masyarakat').toLowerCase()) {
        case 'dosen':
            return {
                label: 'Akun Dosen',
                className: 'bg-blue-100 text-blue-700',
            };
        case 'masyarakat':
            return {
                label: 'Akun Masyarakat',
                className: 'bg-emerald-100 text-emerald-700',
            };
        case 'admin':
            return {
                label: 'Akun Admin',
                className: 'bg-amber-100 text-amber-700',
            };
        case 'superadmin':
            return {
                label: 'Akun Superadmin',
                className: 'bg-amber-100 text-amber-700',
            };
        case 'direktur':
            return {
                label: 'Akun Direktur',
                className: 'bg-rose-100 text-rose-700',
            };
        case 'secret':
        case 'secret_account':
            return {
                label: 'Akun Secret',
                className: 'bg-slate-200 text-slate-800',
            };
        default:
            return {
                label: 'Akun Pengguna',
                className: 'bg-zinc-200 text-zinc-800',
            };
    }
};
