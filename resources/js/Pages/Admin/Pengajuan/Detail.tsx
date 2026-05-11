import React, { useMemo, useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import MapLocationPicker from '../../../Components/MapLocationPicker';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, File, Folder, MapPin, Plus, RotateCcw, Save, Send, SquarePen, Trash2, User, Users, Wallet, XCircle } from 'lucide-react';

interface Pegawai { id_pegawai: number; nama_pegawai: string; nip?: string; role?: string | null; }
interface TimKegiatan { id_tim: number; nama?: string; peran?: string; nama_mahasiswa?: string; peran_tim?: string; pegawai?: { nama_pegawai: string }; }
interface Aktivitas { id_aktivitas: number; status_pelaksanaan: string; catatan_pelaksanaan?: string; }
interface Arsip { id_arsip: number; nama_dokumen: string; jenis_arsip: string; url_dokumen?: string; }
interface RabItem { nama_item?: string; jumlah?: number; harga?: number; total?: number; }
interface Pengajuan {
    id_pengajuan: number;
    kode_unik?: string;
    judul_kegiatan: string;
    nama_pengusul?: string;
    email_pengusul?: string;
    tipe_pengusul?: string;
    kebutuhan?: string;
    instansi_mitra?: string;
    no_telepon?: string;
    sumber_dana?: string;
    total_anggaran: number;
    dana_perguruan_tinggi?: number;
    dana_pemerintah?: number;
    dana_lembaga_dalam?: number;
    dana_lembaga_luar?: number;
    tgl_mulai?: string;
    tgl_selesai?: string;
    status_pengajuan: string;
    catatan_admin?: string;
    created_at?: string;
    proposal?: string;
    surat_permohonan?: string;
    rab?: string;
    rab_items?: RabItem[];
    user?: { name: string; email: string; role?: string };
    jenis_pkm?: { id_jenis_pkm: number; nama_jenis: string };
    provinsi?: string;
    kota_kabupaten?: string;
    kecamatan?: string;
    kelurahan_desa?: string;
    alamat_lengkap?: string;
    latitude?: number;
    longitude?: number;
    lokasi_tambahan?: any;
    is_tahun_saja?: boolean;
    tim_kegiatan?: TimKegiatan[];
    aktivitas?: Aktivitas;
    arsip?: Arsip[];
    direktur_approved_at?: string;
    catatan_direktur?: string;
    logs?: {
        id: number;
        status_lama?: string;
        status_baru: string;
        catatan?: string;
        changed_by_name?: string;
        created_at?: string;
    }[];
}
interface Props {
    pengajuan: Pengajuan;
    listPegawai: Pegawai[];
    listJenisPkm: { id_jenis_pkm: number; nama_jenis: string }[];
}

interface DraftState {
    tanggal_pengajuan: string;
    nama_pengusul: string;
    email_pengusul: string;
    instansi_mitra: string;
    no_telepon: string;
    judul_kegiatan: string;
    kebutuhan: string;
    tgl_mulai: string | null;
    tgl_selesai: string | null;
    tahun_pelaksanaan: string;
    is_tahun_saja: boolean;
    id_jenis_pkm: number | string;
    lokasi_list: {
        id_ui: number;
        provinsi: string;
        kota_kabupaten: string;
        kecamatan: string;
        kelurahan_desa: string;
        alamat_lengkap: string;
        latitude: number | null;
        longitude: number | null;
    }[];
    total_anggaran: string;
    sumber_dana: string;
    dana_perguruan_tinggi: string;
    dana_pemerintah: string;
    dana_lembaga_dalam: string;
    dana_lembaga_luar: string;
    surat_permohonan: string;
    proposal: string;
    rab: string;
    ketua_tim: string;
    dosen_terlibat: string[];
    staff_terlibat: string[];
    mahasiswa_terlibat: string[];
    rab_items: RabItem[];
    link_tambahan: { name: string; url: string }[];
    file_surat_permohonan: File | null;
    file_proposal: File | null;
}

interface DialogState {
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    cancelLabel: string;
}

const statusConfig: Record<string, { label: string; text: string; bg: string; dot: string }> = {
    diproses: { label: 'Diproses', text: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-400' },
    diajukan: { label: 'Diajukan ke Direktur', text: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-400' },
    diterima: { label: 'Diterima', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    direvisi: { label: 'Revisi', text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
    revisi_direktur: { label: 'Revisi Direktur', text: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-400' },
    ditolak: { label: 'Ditolak', text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-400' },
    selesai: { label: 'Selesai', text: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-400' },
};

const fmtDate = (v?: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
const fmtMoney = (v?: number | null) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const toDateInputValue = (v?: string) => {
    if (!v) return '';

    const date = new Date(v);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
const getYearValue = (v?: string | null) => {
    if (!v) return '';

    const match = String(v).match(/^(\d{1,4})/);

    return match ? match[1] : '';
};
const toYearOnlyDate = (year: string) => {
    const digits = year.replace(/\D/g, '').slice(0, 4);

    return digits.length === 4 ? `${digits}-01-01` : null;
};
const getType = (p: Pengajuan): 'dosen' | 'masyarakat' => String(p.tipe_pengusul || p.user?.role || '').toLowerCase() === 'dosen' ? 'dosen' : 'masyarakat';
const getRole = (m?: TimKegiatan) => String(m?.peran_tim || m?.peran || '').toLowerCase();
const getKetua = (tim?: TimKegiatan[]) => tim?.find((m) => getRole(m).includes('ketua'));
const getName = (m?: TimKegiatan) => m?.pegawai?.nama_pegawai || m?.nama_mahasiswa || m?.nama || '';
const getSubmitterName = (p: Pengajuan) => p.nama_pengusul || getName(getKetua(p.tim_kegiatan)) || p.user?.name || '-';
const getSubmitterEmail = (p: Pengajuan) => p.email_pengusul || p.user?.email || '-';
const linksOf = (v?: string) => {
    const raw = String(v || '').trim();
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(item => item.url).map(item => ({ name: item.name || 'Tautan Tambahan', url: item.url }));
    } catch { }
    return raw.split(',').map(x => ({ name: 'Tautan Tambahan', url: x.trim() })).filter(x => x.url);
};
const normalizeRabItems = (items?: RabItem[]) => (items || [])
    .map((item) => {
        const jumlah = Number(item.jumlah || 0);
        const harga = Number(item.harga || 0);

        return {
            nama_item: String(item.nama_item || ''),
            jumlah,
            harga,
            total: jumlah * harga,
        };
    })
    .filter((item) => item.nama_item.trim() !== '' || item.jumlah > 0 || item.harga > 0);
const emptyRabItem = (): RabItem => ({ nama_item: '', jumlah: 1, harga: 0, total: 0 });
const roleItems = (tim: TimKegiatan[] | undefined, role: string, ketuaId?: number) => (tim || [])
    .filter((m) => m.id_tim !== ketuaId && getRole(m) === role)
    .map(getName)
    .filter(Boolean);
const parseAdditionalLocations = (value: any): any[] => {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};
const formatLocationAddress = (location: Partial<{
    alamat_lengkap: string;
    kelurahan_desa: string;
    kecamatan: string;
    kota_kabupaten: string;
    provinsi: string;
}>) => [
    location.alamat_lengkap,
    location.kelurahan_desa,
    location.kecamatan,
    location.kota_kabupaten,
    location.provinsi,
].filter(Boolean).join(', ');
const getPengajuanLocationSummary = (pengajuan: Pengajuan) => {
    const locations = [
        {
            alamat_lengkap: pengajuan.alamat_lengkap || '',
            kelurahan_desa: pengajuan.kelurahan_desa || '',
            kecamatan: pengajuan.kecamatan || '',
            kota_kabupaten: pengajuan.kota_kabupaten || '',
            provinsi: pengajuan.provinsi || '',
        },
        ...parseAdditionalLocations(pengajuan.lokasi_tambahan).map((loc) => ({
            alamat_lengkap: loc.alamat_lengkap || '',
            kelurahan_desa: loc.kelurahan_desa || '',
            kecamatan: loc.kecamatan || '',
            kota_kabupaten: loc.kota_kabupaten || '',
            provinsi: loc.provinsi || '',
        })),
    ];

    return locations
        .map((location, index) => {
            const address = formatLocationAddress(location);
            return address ? `Lokasi ${index + 1} - ${address}` : '';
        })
        .filter(Boolean)
        .join('; ');
};
const buildDraft = (pengajuan: Pengajuan, ketuaId?: number): DraftState => ({
    tanggal_pengajuan: toDateInputValue(pengajuan.created_at),
    nama_pengusul: pengajuan.nama_pengusul || getSubmitterName(pengajuan),
    email_pengusul: pengajuan.email_pengusul || getSubmitterEmail(pengajuan),
    instansi_mitra: pengajuan.instansi_mitra || '',
    no_telepon: pengajuan.no_telepon || '',
    judul_kegiatan: pengajuan.judul_kegiatan || '',
    kebutuhan: pengajuan.kebutuhan || '',
    tgl_mulai: pengajuan.tgl_mulai || null,
    tgl_selesai: pengajuan.tgl_selesai || null,
    tahun_pelaksanaan: getYearValue(pengajuan.tgl_mulai),
    is_tahun_saja: !!(pengajuan as any).is_tahun_saja,
    id_jenis_pkm: pengajuan.jenis_pkm?.id_jenis_pkm || '',
    lokasi_list: (() => {
        const arr = [{
            id_ui: Date.now(),
            provinsi: pengajuan.provinsi || '',
            kota_kabupaten: pengajuan.kota_kabupaten || '',
            kecamatan: pengajuan.kecamatan || '',
            kelurahan_desa: pengajuan.kelurahan_desa || '',
            alamat_lengkap: pengajuan.alamat_lengkap || '',
            latitude: pengajuan.latitude ?? null,
            longitude: pengajuan.longitude ?? null,
        }];
        try {
            const tambahanStr = (pengajuan as any).lokasi_tambahan;
            if (tambahanStr) {
                const parsed = typeof tambahanStr === 'string' ? JSON.parse(tambahanStr) : tambahanStr;
                if (Array.isArray(parsed)) {
                    parsed.forEach((loc, i) => {
                        arr.push({
                            id_ui: Date.now() + i + 1,
                            provinsi: loc.provinsi || '',
                            kota_kabupaten: loc.kota_kabupaten || '',
                            kecamatan: loc.kecamatan || '',
                            kelurahan_desa: loc.kelurahan_desa || '',
                            alamat_lengkap: loc.alamat_lengkap || '',
                            latitude: loc.latitude ? Number(loc.latitude) : null,
                            longitude: loc.longitude ? Number(loc.longitude) : null,
                        });
                    });
                }
            }
        } catch { }
        return arr;
    })(),
    total_anggaran: String(pengajuan.total_anggaran || 0),
    sumber_dana: pengajuan.sumber_dana || '',
    dana_perguruan_tinggi: String(pengajuan.dana_perguruan_tinggi || 0),
    dana_pemerintah: String(pengajuan.dana_pemerintah || 0),
    dana_lembaga_dalam: String(pengajuan.dana_lembaga_dalam || 0),
    dana_lembaga_luar: String(pengajuan.dana_lembaga_luar || 0),
    surat_permohonan: pengajuan.surat_permohonan || '',
    proposal: pengajuan.proposal || '',
    rab: pengajuan.rab || '',
    ketua_tim: ketuaId ? (getName(pengajuan.tim_kegiatan?.find(m => m.id_tim === ketuaId)) || getSubmitterName(pengajuan)) : (getType(pengajuan) === 'dosen' ? getSubmitterName(pengajuan) : ''),
    dosen_terlibat: roleItems(pengajuan.tim_kegiatan, 'dosen', ketuaId).length ? roleItems(pengajuan.tim_kegiatan, 'dosen', ketuaId) : [''],
    staff_terlibat: roleItems(pengajuan.tim_kegiatan, 'staff', ketuaId).length ? roleItems(pengajuan.tim_kegiatan, 'staff', ketuaId) : [''],
    mahasiswa_terlibat: roleItems(pengajuan.tim_kegiatan, 'mahasiswa', ketuaId).length ? roleItems(pengajuan.tim_kegiatan, 'mahasiswa', ketuaId) : [''],
    rab_items: normalizeRabItems(pengajuan.rab_items).length ? normalizeRabItems(pengajuan.rab_items) : [emptyRabItem()],
    link_tambahan: linksOf(pengajuan.rab).length ? linksOf(pengajuan.rab) : [{ name: '', url: '' }],
    file_surat_permohonan: null,
    file_proposal: null,
});

const Card = ({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <div className="flex items-center gap-2">
                {action}
                {icon}
            </div>
        </div>
        <div className="p-6">{children}</div>
    </section>
);
const Field = ({ label, value, wide = false }: { label: string; value?: React.ReactNode; wide?: boolean }) => (
    <div className={`${wide ? 'md:col-span-2' : ''} space-y-1.5`}>
        <div className="text-xs font-semibold text-slate-700">{label}</div>
        <div className="min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap">{value || '-'}</div>
    </div>
);
const getFullUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http')) return path;
    const origin = window.location.origin;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${cleanPath}`;
};

const Doc = ({ label, url }: { label: string; url?: string | null }) => (
    <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-700">{label}</div>
        {url ? (
            <div className="space-y-2">
                <a href={getFullUrl(url)} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-100 transition-colors">
                    <span>Buka Dokumen</span><ExternalLink size={14} />
                </a>
            </div>
        ) : (
            <div className="min-h-[44px] rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">Belum ada dokumen.</div>
        )}
    </div>
);
const Team = ({ title, items }: { title: string; items: string[] }) => (
    <div className="space-y-1.5">
        <div className="text-[13px] font-bold text-slate-600">{title}</div>
        {items.length ? <div className="space-y-2">{items.map((x, i) => <div key={`${title}-${i}-${x}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800">{x}</div>)}</div>
            : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">Tidak ada data.</div>}
    </div>
);

const EditableTeam = ({
    title,
    items,
    placeholder,
    onChange,
    onAdd,
    onRemove,
    suggestions = [],
}: {
    title: string;
    items: string[];
    placeholder: string;
    onChange: (index: number, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    suggestions?: string[];
}) => {
    const listId = `list-${title.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="space-y-3">
            <div className="text-[13px] font-bold text-slate-600">{title}</div>
            {suggestions.length > 0 && (
                <datalist id={listId}>
                    {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
            )}
            {(items.length ? items : ['']).map((item, index) => (
                <div key={`${title}-${index}`} className="flex items-center gap-2">
                    <input
                        type="text"
                        list={suggestions.length ? listId : undefined}
                        value={item}
                        onChange={(e) => onChange(index, e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                    />
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
                <Plus size={14} />
                Tambah
            </button>
        </div>
    );
};

const RabTable = ({ items }: { items: RabItem[] }) => (
    items.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Nama Item</th>
                        <th className="px-4 py-3">Jumlah</th>
                        <th className="px-4 py-3">Harga</th>
                        <th className="px-4 py-3">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => (
                        <tr key={`${item.nama_item}-${index}`}>
                            <td className="px-4 py-3 text-slate-800">{item.nama_item || '-'}</td>
                            <td className="px-4 py-3 text-slate-700">{Number(item.jumlah || 0)}</td>
                            <td className="px-4 py-3 text-slate-700">{fmtMoney(item.harga)}</td>
                            <td className="px-4 py-3 font-semibold text-poltekpar-primary">{fmtMoney(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Belum ada rincian item RAB yang tersimpan.</div>
    )
);

const EditableRabTable = ({
    items,
    onChange,
    onAdd,
    onRemove,
}: {
    items: RabItem[];
    onChange: (index: number, field: keyof RabItem, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}) => (
    <div className="space-y-3">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Nama Item</th>
                        <th className="px-4 py-3">Jumlah</th>
                        <th className="px-4 py-3">Harga</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => {
                        const total = Number(item.jumlah || 0) * Number(item.harga || 0);

                        return (
                            <tr key={`rab-${index}`}>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={String(item.nama_item || '')}
                                        onChange={(e) => onChange(index, 'nama_item', e.target.value)}
                                        placeholder="Nama item..."
                                        className="min-h-[40px] w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-poltekpar-primary"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.jumlah === 0 || item.jumlah === undefined || item.jumlah === null ? '' : String(item.jumlah)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            onChange(index, 'jumlah', raw);
                                        }}
                                        placeholder="0"
                                        className="min-h-[40px] w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-poltekpar-primary"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={item.harga === 0 || item.harga === undefined || item.harga === null ? '' : Number(item.harga).toLocaleString('id-ID')}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                onChange(index, 'harga', raw);
                                            }}
                                            placeholder="0"
                                            className="min-h-[40px] w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 outline-none focus:border-poltekpar-primary"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-poltekpar-primary">{fmtMoney(total)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => onRemove(index)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
            <Plus size={14} />
            Tambah Item
        </button>
    </div>
);

const EditField = ({
    label,
    value,
    onChange,
    wide = false,
    type = 'text',
    textarea = false,
}: {
    label: string;
    value?: string | number | null;
    onChange: (value: string) => void;
    wide?: boolean;
    type?: string;
    textarea?: boolean;
}) => {
    if (type === 'currency') {
        const numVal = Number(value || 0);
        const displayVal = numVal === 0 ? '' : numVal.toLocaleString('id-ID');
        return (
            <div className={`${wide ? 'md:col-span-2' : ''} space-y-1.5`}>
                <div className="text-xs font-semibold text-slate-700">{label}</div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rp</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={displayVal}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            onChange(raw);
                        }}
                        placeholder="0"
                        className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`${wide ? 'md:col-span-2' : ''} space-y-1.5`}>
            <div className="text-xs font-semibold text-slate-700">{label}</div>
            {textarea ? (
                <textarea
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-[88px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                />
            ) : (
                <input
                    type={type}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                />
            )}
        </div>
    );
};

export default function Detail({ pengajuan, listPegawai, listJenisPkm }: Props) {
    const { props } = usePage();
    const user = (props as any).auth?.user;
    const isDirektur = user?.role === 'direktur';
    const isViewer = isDirektur;

    const [catatan, setCatatan] = useState(pengajuan.catatan_admin || pengajuan.catatan_direktur || '');
    const [selectedAction, setSelectedAction] = useState('');
    const [catatanError, setCatatanError] = useState('');
    const [catatanDirektur, setCatatanDirektur] = useState('');
    const [decisionAction, setDecisionAction] = useState<'approve' | 'decline' | 'revise' | null>(null);
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

    const ketua = useMemo(() => getKetua(pengajuan.tim_kegiatan), [pengajuan.tim_kegiatan]);
    const [confirmDialog, setConfirmDialog] = useState<DialogState>({ open: false, title: '', message: '', action: () => undefined, variant: 'warning', confirmLabel: 'Ya, Lanjutkan', cancelLabel: 'Batal' });
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftState>(() => buildDraft(pengajuan, ketua?.id_tim));
    const [collapsedLocations, setCollapsedLocations] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (!editingSection) {
            setDraft(buildDraft(pengajuan, ketua?.id_tim));
        }
    }, [pengajuan, ketua?.id_tim, editingSection]);

    const toggleLocationCollapse = (idUi: number) => {
        setCollapsedLocations(prev => ({ ...prev, [idUi]: !prev[idUi] }));
    };
    const st = statusConfig[pengajuan.status_pengajuan] || statusConfig.diproses;
    const isDosen = getType(pengajuan) === 'dosen';
    const canEditTanggalPengajuan = (props as any).auth?.user?.role === 'superadmin';
    const submitterName = getSubmitterName(pengajuan);
    const submitterEmail = getSubmitterEmail(pengajuan);
    const extraLinks = linksOf(pengajuan.rab);
    const roleNames = (role: string) => roleItems(pengajuan.tim_kegiatan, role, ketua?.id_tim);
    const rabItems = useMemo(() => normalizeRabItems(pengajuan.rab_items), [pengajuan.rab_items]);
    const draftRabItems = useMemo(() => normalizeRabItems(draft.rab_items), [draft.rab_items]);
    const draftTotalRab = useMemo(() => draftRabItems.reduce((sum, item) => sum + Number(item.total || 0), 0), [draftRabItems]);
    const hasKetua = (pengajuan.tim_kegiatan || []).some(m => getRole(m).includes('ketua'));
    const missing = [
        !submitterName || submitterName === '-' ? 'Nama Pengusul' : '',
        !submitterEmail || submitterEmail === '-' ? 'Email Pengusul' : '',
        !pengajuan.jenis_pkm?.nama_jenis ? 'Jenis PKM' : '',
        !pengajuan.instansi_mitra ? 'Instansi' : '',
        !pengajuan.no_telepon ? 'No. WhatsApp' : '',
        !pengajuan.kebutuhan ? (isDosen ? 'Deskripsi Kegiatan' : 'Kebutuhan PKM') : '',
        !pengajuan.provinsi ? 'Provinsi' : '',
        !pengajuan.kota_kabupaten ? 'Kota / Kabupaten' : '',
        !pengajuan.surat_permohonan ? 'Surat Permohonan' : '',
        !hasKetua ? 'Ketua Tim PKM' : '',
        (roleNames('dosen').length + roleNames('staff').length + roleNames('mahasiswa').length === 0) ? 'Tim Terlibat (Dosen/Staff/Mahasiswa)' : '',
        rabItems.length === 0 ? 'Rincian RAB' : '',
        isDosen && !pengajuan.judul_kegiatan ? 'Judul Kegiatan PKM' : '',
    ].filter(Boolean);

    const saveDecision = () => {
        if (!selectedAction) return;
        if (selectedAction === 'diterima' && missing.length > 0) {
            setConfirmDialog({
                open: true,
                title: 'Data Belum Lengkap',
                message: `Pengajuan ini belum bisa diterima karena masih ada data yang kosong: ${missing.join(', ')}. Lengkapi dulu data tersebut sebelum menyetujui.`,
                action: () => undefined,
                variant: 'warning',
                confirmLabel: 'Mengerti',
                cancelLabel: 'Tutup',
            });
            return;
        }
        if ((selectedAction === 'direvisi' || selectedAction === 'ditolak') && !catatan.trim()) {
            setCatatanError('Catatan wajib diisi.');
            return;
        }
        setCatatanError('');
        setConfirmDialog({
            open: true,
            title: 'Simpan Keputusan?',
            message: `Status akan diubah menjadi "${selectedAction}".`,
            action: () => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/status`, {
                status_pengajuan: selectedAction,
                catatan_admin: (selectedAction === 'direvisi' || selectedAction === 'diterima' || selectedAction === 'ditolak') ? catatan : null,
            }),
            variant: 'warning',
            confirmLabel: 'Ya, Simpan',
            cancelLabel: 'Batal',
        });
    };

    const setDraftField = (field: keyof typeof draft, value: any) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };

    const setTeamFieldValue = (field: 'ketua_tim' | 'dosen_terlibat' | 'staff_terlibat' | 'mahasiswa_terlibat', index: number, value: string) => {
        if (field === 'ketua_tim') {
            setDraft((prev) => ({ ...prev, ketua_tim: value }));
            return;
        }
        setDraft((prev) => {
            const items = [...prev[field]];
            items[index] = value;

            return { ...prev, [field]: items };
        });
    };

    const addTeamField = (field: 'dosen_terlibat' | 'staff_terlibat' | 'mahasiswa_terlibat') => {
        setDraft((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeTeamField = (field: 'dosen_terlibat' | 'staff_terlibat' | 'mahasiswa_terlibat', index: number) => {
        setDraft((prev) => {
            const items = prev[field].filter((_, currentIndex) => currentIndex !== index);

            return { ...prev, [field]: items.length ? items : [''] };
        });
    };

    const setRabItemField = (index: number, field: keyof RabItem, value: string) => {
        setDraft((prev) => {
            const items = [...prev.rab_items];
            const current = { ...items[index] };

            if (field === 'nama_item') {
                current.nama_item = value;
            } else {
                current[field] = Number(value || 0);
            }

            current.total = Number(current.jumlah || 0) * Number(current.harga || 0);
            items[index] = current;

            return { ...prev, rab_items: items };
        });
    };

    const addRabItem = () => {
        setDraft((prev) => ({ ...prev, rab_items: [...prev.rab_items, emptyRabItem()] }));
    };

    const removeRabItem = (index: number) => {
        setDraft((prev) => {
            const items = prev.rab_items.filter((_, currentIndex) => currentIndex !== index);

            return { ...prev, rab_items: items.length ? items : [emptyRabItem()] };
        });
    };

    const startEdit = (section: string) => {
        setEditingSection(section);
    };
    const cancelEdit = () => {
        setDraft(buildDraft(pengajuan, ketua?.id_tim));
        setEditingSection(null);
    };

    const normalizeSavePayload = (payload: Record<string, any>) => {
        return Object.fromEntries(
            Object.entries(payload).filter(([key, value]) => {
                if (value === undefined) return false;
                if (value === null && key.startsWith('file_')) return false;

                return true;
            })
        );
    };

    const saveSection = (section: string, payload: Record<string, any>, url?: string) => {
        const savePayload = normalizeSavePayload(payload);
        const hasFiles = Object.values(savePayload).some(v => v instanceof window.File);
        setSavingSection(section);

        const options = {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => setEditingSection((current) => (current === section ? null : current)),
            onError: (errors: any) => {
                alert('Gagal menyimpan. Terdapat kesalahan validasi:\n' + Object.values(errors).join('\n'));
            },
            onFinish: () => setSavingSection(null),
        };

        if (hasFiles) {
            savePayload._method = 'put';
            router.post(url || `/admin/pengajuan/${pengajuan.id_pengajuan}`, savePayload, {
                ...options,
                forceFormData: true
            });
        } else {
            router.put(url || `/admin/pengajuan/${pengajuan.id_pengajuan}`, savePayload, options);
        }
    };

    const handleDirekturDecision = () => {
        if (!decisionAction) return;
        if (!catatanDirektur.trim()) {
            setCatatanError('Catatan wajib diisi.');
            return;
        }
        setCatatanError('');
        setIsSubmittingDecision(true);

        const urlMap = {
            approve: `/direktur/pengajuan/${pengajuan.id_pengajuan}/approve`,
            decline: `/direktur/pengajuan/${pengajuan.id_pengajuan}/decline`,
            revise: `/direktur/pengajuan/${pengajuan.id_pengajuan}/revise`,
        };

        router.post(urlMap[decisionAction], { catatan: catatanDirektur }, {
            onFinish: () => setIsSubmittingDecision(false),
        });
    };

    const sectionActions = (section: string, payload: Record<string, any>, url?: string) => {
        if (isViewer) return null;
        const isSaving = savingSection === section;

        return editingSection === section ? (
            <>
                <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={() => saveSection(section, payload, url)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-lg bg-poltekpar-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-poltekpar-navy disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? <i className="fa-solid fa-spinner fa-spin text-[11px]" /> : <Save size={12} />}
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </>
        ) : (
            <button
                type="button"
                onClick={() => startEdit(section)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
                <SquarePen size={12} />
                Edit
            </button>
        );
    };

    return (
        <AdminLayout title="">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin/pengajuan" className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"><ArrowLeft size={16} /></Link>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-bold text-slate-900">{pengajuan.judul_kegiatan || 'Detail Pengajuan'}</h1>
                    <p className="mt-1 text-[13px] text-slate-500">Format tampilan mengikuti form {isDosen ? 'pengajuan dosen' : 'pengajuan masyarakat'} dan hanya menampilkan data yang sudah diisi.</p>
                    <p className="mt-1 text-[13px] text-slate-500">Diajukan oleh <span className="font-medium text-slate-700">{submitterName}</span>{pengajuan.created_at && ` pada ${fmtDate(pengajuan.created_at)}`}<span className="mx-2 text-slate-300">•</span><span className="font-mono">#{pengajuan.id_pengajuan.toString().padStart(2, '0')}</span></p>
                </div>
                <div className={`flex flex-shrink-0 items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wider shadow-sm ${st.bg} ${st.text}`}><span className={`h-2 w-2 rounded-full ${st.dot}`}></span>{st.label}</div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {missing.length > 0 && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500" /><div><div className="text-[13px] font-bold text-amber-800">Data Belum Lengkap</div><p className="mt-0.5 text-[12px] text-amber-700">Field berikut masih kosong: <span className="font-semibold">{missing.join(', ')}</span></p></div></div>}



                    <>
                        <Card
                            title={isDosen ? "Informasi Ketua Pengusul" : "Identitas Pengusul / Perwakilan"}
                            action={sectionActions('submitter', {
                                nama_pengusul: draft.nama_pengusul,
                                email_pengusul: draft.email_pengusul,
                                instansi_mitra: draft.instansi_mitra,
                                no_telepon: draft.no_telepon,
                            })}
                            icon={<User size={16} className="text-slate-400" />}
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {editingSection === 'submitter' ? (
                                    <>
                                        <EditField label="Nama Lengkap" value={draft.nama_pengusul} onChange={(v) => setDraftField('nama_pengusul', v)} />
                                        <EditField label="Instansi / Organisasi" value={draft.instansi_mitra} onChange={(v) => setDraftField('instansi_mitra', v)} />
                                        <EditField label="Email" value={draft.email_pengusul} type="email" onChange={(v) => setDraftField('email_pengusul', v)} />
                                        <EditField label="No. WhatsApp" value={draft.no_telepon} onChange={(v) => setDraftField('no_telepon', v)} />
                                    </>
                                ) : (
                                    <>
                                        <Field label="Nama Lengkap" value={submitterName} />
                                        <Field label="Instansi / Organisasi" value={pengajuan.instansi_mitra || 'Politeknik Pariwisata Makassar'} />
                                        <Field label="Email" value={submitterEmail} />
                                        <Field label="No. WhatsApp" value={pengajuan.no_telepon} />
                                    </>
                                )}
                            </div>
                        </Card>
                        <Card
                            title={isDosen ? "Detail Kegiatan" : "Kebutuhan PKM"}
                            action={sectionActions('detail', {
                                judul_kegiatan: draft.judul_kegiatan,
                                kebutuhan: draft.kebutuhan,
                                id_jenis_pkm: draft.id_jenis_pkm,
                                tgl_mulai: draft.is_tahun_saja ? toYearOnlyDate(draft.tahun_pelaksanaan) : draft.tgl_mulai,
                                tgl_selesai: draft.is_tahun_saja ? null : draft.tgl_selesai,
                                is_tahun_saja: draft.is_tahun_saja ? 1 : 0,
                            })}
                            icon={<File size={16} className="text-slate-400" />}
                        >
                            <div className="space-y-4">
                                {editingSection === 'detail' ? (
                                    <>
                                        <div className="md:col-span-2 space-y-1.5">
                                            <div className="text-xs font-semibold text-slate-700">Jenis PKM</div>
                                            <select
                                                value={draft.id_jenis_pkm}
                                                onChange={(e) => setDraftField('id_jenis_pkm', e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                                            >
                                                <option value="">Belum ditentukan</option>
                                                {listJenisPkm.map((jp) => (
                                                    <option key={jp.id_jenis_pkm} value={jp.id_jenis_pkm}>{jp.nama_jenis}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_tahun_saja"
                                                    checked={draft.is_tahun_saja}
                                                    onChange={(e) => setDraft((prev) => ({
                                                        ...prev,
                                                        is_tahun_saja: e.target.checked,
                                                        tahun_pelaksanaan: e.target.checked ? (prev.tahun_pelaksanaan || getYearValue(prev.tgl_mulai)) : prev.tahun_pelaksanaan,
                                                    }))}
                                                    className="rounded border-slate-300 text-poltekpar-primary focus:ring-poltekpar-primary"
                                                />
                                                <label htmlFor="is_tahun_saja" className="text-xs font-semibold text-slate-700 cursor-pointer">Waktu Kegiatan Hanya Tahun</label>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <div className="text-xs font-semibold text-slate-700">{draft.is_tahun_saja ? 'Tahun Pelaksanaan' : 'Tanggal Mulai'}</div>
                                                    {draft.is_tahun_saja ? (
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={4}
                                                            value={draft.tahun_pelaksanaan}
                                                            onChange={(e) => setDraftField('tahun_pelaksanaan', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                                                            placeholder="YYYY"
                                                        />
                                                    ) : (
                                                        <input type="date" value={draft.tgl_mulai || ''} onChange={e => setDraftField('tgl_mulai', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary" />
                                                    )}
                                                </div>
                                                {!draft.is_tahun_saja && (
                                                    <div className="space-y-1.5">
                                                        <div className="text-xs font-semibold text-slate-700">Tanggal Selesai</div>
                                                        <input type="date" value={draft.tgl_selesai || ''} onChange={e => setDraftField('tgl_selesai', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary" min={draft.tgl_mulai || undefined} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <EditField label="Judul Kegiatan PKM" value={draft.judul_kegiatan} onChange={(v) => setDraftField('judul_kegiatan', v)} wide textarea />
                                        <EditField label="Kebutuhan / Deskripsi Singkat" value={draft.kebutuhan} onChange={(v) => setDraftField('kebutuhan', v)} wide textarea />
                                    </>
                                ) : (
                                    <>
                                        <Field label="Jenis PKM" value={pengajuan.jenis_pkm?.nama_jenis || 'Belum ditentukan'} wide />
                                        <div className="md:col-span-2 space-y-1.5">
                                            <div className="text-xs font-semibold text-slate-700">Waktu Pelaksanaan</div>
                                            <div className="min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                                {(pengajuan as any).is_tahun_saja ? (pengajuan.tgl_mulai ? new Date(pengajuan.tgl_mulai).getFullYear() : '-') : (pengajuan.tgl_mulai ? `${fmtDate(pengajuan.tgl_mulai)} - ${pengajuan.tgl_selesai ? fmtDate(pengajuan.tgl_selesai) : 'Selesai'}` : '-')}
                                            </div>
                                        </div>
                                        <Field label="Judul Kegiatan PKM" value={pengajuan.judul_kegiatan} wide />
                                        <Field label="Kebutuhan / Deskripsi Singkat" value={pengajuan.kebutuhan} wide />
                                    </>
                                )}
                            </div>
                        </Card>
                        <Card
                            title="Lokasi Kegiatan"
                            action={sectionActions('location', {
                                lokasi_list: JSON.stringify(draft.lokasi_list)
                            })}
                            icon={<MapPin size={16} className="text-slate-400" />}
                        >
                            <div className="space-y-4">
                                {editingSection === 'location' ? (
                                    <div className="space-y-6">
                                        {draft.lokasi_list.map((lokasi, idx) => (
                                            <div key={lokasi.id_ui} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative shadow-sm">
                                                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleLocationCollapse(lokasi.id_ui)}>
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        {draft.lokasi_list.length > 1 ? `Lokasi ${idx + 1}` : 'Lokasi'} {lokasi.kota_kabupaten ? ` - ${lokasi.kota_kabupaten}` : ''}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {idx > 0 && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setDraft(prev => ({ ...prev, lokasi_list: prev.lokasi_list.filter((_, i) => i !== idx) })); }} className="w-8 h-8 flex justify-center items-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <button type="button" className="w-8 h-8 flex justify-center items-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
                                                            <i className={`fa-solid fa-chevron-${collapsedLocations[lokasi.id_ui] ? 'down' : 'up'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                {!collapsedLocations[lokasi.id_ui] && (
                                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                                        <div className="rounded-xl overflow-hidden border border-zinc-200 mb-4">
                                                            <MapLocationPicker
                                                                latitude={lokasi.latitude ?? null}
                                                                longitude={lokasi.longitude ?? null}
                                                                onChange={(lat, lng, addr) => {
                                                                    setDraft(prev => {
                                                                        const newList = [...prev.lokasi_list];
                                                                        newList[idx] = {
                                                                            ...newList[idx],
                                                                            latitude: lat,
                                                                            longitude: lng,
                                                                            ...(addr && {
                                                                                provinsi: addr.provinsi || newList[idx].provinsi,
                                                                                kota_kabupaten: addr.kotaKabupaten || newList[idx].kota_kabupaten,
                                                                                kecamatan: addr.kecamatan || newList[idx].kecamatan,
                                                                                kelurahan_desa: addr.kelurahanDesa || newList[idx].kelurahan_desa,
                                                                                alamat_lengkap: addr.address || newList[idx].alamat_lengkap
                                                                            })
                                                                        };
                                                                        return { ...prev, lokasi_list: newList };
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <EditField label="Provinsi" value={lokasi.provinsi} onChange={(v) => { setDraft(prev => { const newList = [...prev.lokasi_list]; newList[idx].provinsi = v; return { ...prev, lokasi_list: newList }; }); }} />
                                                            <EditField label="Kota/Kabupaten" value={lokasi.kota_kabupaten} onChange={(v) => { setDraft(prev => { const newList = [...prev.lokasi_list]; newList[idx].kota_kabupaten = v; return { ...prev, lokasi_list: newList }; }); }} />
                                                            <EditField label="Kecamatan" value={lokasi.kecamatan} onChange={(v) => { setDraft(prev => { const newList = [...prev.lokasi_list]; newList[idx].kecamatan = v; return { ...prev, lokasi_list: newList }; }); }} />
                                                            <EditField label="Kelurahan/Desa" value={lokasi.kelurahan_desa} onChange={(v) => { setDraft(prev => { const newList = [...prev.lokasi_list]; newList[idx].kelurahan_desa = v; return { ...prev, lokasi_list: newList }; }); }} />
                                                            <EditField label="Alamat Lengkap" value={lokasi.alamat_lengkap} onChange={(v) => { setDraft(prev => { const newList = [...prev.lokasi_list]; newList[idx].alamat_lengkap = v; return { ...prev, lokasi_list: newList }; }); }} wide textarea />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setDraft(prev => ({ ...prev, lokasi_list: [...prev.lokasi_list, { id_ui: Date.now(), provinsi: '', kota_kabupaten: '', kecamatan: '', kelurahan_desa: '', alamat_lengkap: '', latitude: null, longitude: null }] }))} className="w-full py-3 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary rounded-xl text-sm font-bold border border-poltekpar-primary/20 hover:border-poltekpar-primary transition-all flex justify-center items-center gap-2 mt-4">
                                            <Plus size={16} /> Tambah Lokasi Lainnya
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                                        <span>{getPengajuanLocationSummary(pengajuan) || 'Lokasi belum ditentukan'}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                        <Card
                            title="Tim Pelaksana"
                            action={sectionActions('team', {
                                ketua_tim: draft.ketua_tim.trim(),
                                dosen_terlibat: draft.dosen_terlibat.map((item) => item.trim()).filter(Boolean),
                                staff_terlibat: draft.staff_terlibat.map((item) => item.trim()).filter(Boolean),
                                mahasiswa_terlibat: draft.mahasiswa_terlibat.map((item) => item.trim()).filter(Boolean),
                            }, `/admin/pengajuan/${pengajuan.id_pengajuan}/tim`)}
                            icon={<Users size={16} className="text-slate-400" />}
                        >
                            {editingSection === 'team' ? (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                        Admin dapat menyesuaikan anggota tim pelaksana dan memastikan siapa Ketua Tim.
                                    </div>
                                    <EditField label="Ketua Tim PKM" value={draft.ketua_tim} onChange={(v) => setDraftField('ketua_tim', v)} />
                                    <EditableTeam
                                        title="Dosen Terlibat"
                                        items={draft.dosen_terlibat}
                                        placeholder="Nama dosen..."
                                        onChange={(index, value) => setTeamFieldValue('dosen_terlibat', index, value)}
                                        onAdd={() => addTeamField('dosen_terlibat')}
                                        onRemove={(index) => removeTeamField('dosen_terlibat', index)}
                                        suggestions={listPegawai?.filter(p => !p.role || p.role === 'dosen').map(p => p.nama_pegawai) || []}
                                    />
                                    <EditableTeam
                                        title="Staf Terlibat"
                                        items={draft.staff_terlibat}
                                        placeholder="Nama staf..."
                                        onChange={(index, value) => setTeamFieldValue('staff_terlibat', index, value)}
                                        onAdd={() => addTeamField('staff_terlibat')}
                                        onRemove={(index) => removeTeamField('staff_terlibat', index)}
                                        suggestions={listPegawai?.map(p => p.nama_pegawai) || []}
                                    />
                                    <EditableTeam
                                        title="Mahasiswa Terlibat"
                                        items={draft.mahasiswa_terlibat}
                                        placeholder="Nama mahasiswa..."
                                        onChange={(index, value) => setTeamFieldValue('mahasiswa_terlibat', index, value)}
                                        onAdd={() => addTeamField('mahasiswa_terlibat')}
                                        onRemove={(index) => removeTeamField('mahasiswa_terlibat', index)}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Team title="Ketua Tim PKM" items={draft.ketua_tim.trim() ? [draft.ketua_tim.trim()] : []} />
                                    <Team title="Dosen Terlibat" items={roleNames('dosen')} />
                                    <Team title="Staf Terlibat" items={roleNames('staff')} />
                                    <Team title="Mahasiswa Terlibat" items={roleNames('mahasiswa')} />
                                </div>
                            )}
                        </Card>
                        <Card
                            title="Rencana Anggaran Biaya (RAB)"
                            action={sectionActions('budget', {
                                rab_items: draftRabItems,
                                total_anggaran: draftTotalRab,
                            })}
                            icon={<Wallet size={16} className="text-slate-400" />}
                        >
                            <div className="space-y-4">
                                {editingSection === 'budget' ? (
                                    <EditableRabTable
                                        items={draft.rab_items}
                                        onChange={setRabItemField}
                                        onAdd={addRabItem}
                                        onRemove={removeRabItem}
                                    />
                                ) : (
                                    <RabTable items={rabItems} />
                                )}
                                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Total RAB</div>
                                    <div className="mt-1 text-2xl font-black text-poltekpar-primary">{fmtMoney(editingSection === 'budget' ? draftTotalRab : pengajuan.total_anggaran)}</div>
                                </div>
                            </div>
                        </Card>
                        <Card
                            title="Sumber Dana"
                            action={sectionActions('funding', {
                                dana_perguruan_tinggi: Number(draft.dana_perguruan_tinggi || 0),
                                dana_pemerintah: Number(draft.dana_pemerintah || 0),
                                dana_lembaga_dalam: Number(draft.dana_lembaga_dalam || 0),
                                dana_lembaga_luar: Number(draft.dana_lembaga_luar || 0),
                            })}
                            icon={<Wallet size={16} className="text-slate-400" />}
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {editingSection === 'funding' ? (
                                    <>
                                        <EditField label="Perguruan Tinggi" value={draft.dana_perguruan_tinggi} type="currency" onChange={(v) => setDraftField('dana_perguruan_tinggi', v)} />
                                        <EditField label="Pemerintah" value={draft.dana_pemerintah} type="currency" onChange={(v) => setDraftField('dana_pemerintah', v)} />
                                        <EditField label="Lembaga Dalam Negeri" value={draft.dana_lembaga_dalam} type="currency" onChange={(v) => setDraftField('dana_lembaga_dalam', v)} />
                                        <EditField label="Lembaga Luar Negeri" value={draft.dana_lembaga_luar} type="currency" onChange={(v) => setDraftField('dana_lembaga_luar', v)} />
                                    </>
                                ) : (
                                    <>
                                        <Field label="Perguruan Tinggi" value={fmtMoney(pengajuan.dana_perguruan_tinggi)} />
                                        <Field label="Pemerintah" value={fmtMoney(pengajuan.dana_pemerintah)} />
                                        <Field label="Lembaga Dalam Negeri" value={fmtMoney(pengajuan.dana_lembaga_dalam)} />
                                        <Field label="Lembaga Luar Negeri" value={fmtMoney(pengajuan.dana_lembaga_luar)} />
                                    </>
                                )}
                            </div>
                        </Card>
                        <Card
                            title="Dokumen & Tautan"
                            action={sectionActions('docs', {
                                surat_permohonan: draft.surat_permohonan, // Only sent to avoid validation clearing if no file
                                proposal: draft.proposal,
                                file_surat_permohonan: draft.file_surat_permohonan,
                                file_proposal: draft.file_proposal,
                                rab: JSON.stringify(draft.link_tambahan.filter(l => l.url.trim() !== '')),
                            })}
                            icon={<Folder size={16} className="text-slate-400" />}
                        >
                            <div className="space-y-4">
                                {editingSection === 'docs' ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Surat Permohonan <span className="text-slate-400 font-normal">(Opsional: unggah file baru untuk menimpa)</span></label>
                                            {draft.surat_permohonan && (
                                                <div className="flex items-center gap-2 mb-2 p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600"><Folder size={14} /></div>
                                                    <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-blue-800">File sudah terdeteksi</p><p className="text-[10px] text-blue-600/70 truncate">{draft.surat_permohonan.split('/').pop()}</p></div>
                                                    <a href={draft.surat_permohonan} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-[10px] font-bold text-blue-700 rounded shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors">Lihat File</a>
                                                </div>
                                            )}
                                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDraftField('file_surat_permohonan', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Proposal <span className="text-slate-400 font-normal">(Opsional: unggah file baru untuk menimpa)</span></label>
                                            {draft.proposal && (
                                                <div className="flex items-center gap-2 mb-2 p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600"><Folder size={14} /></div>
                                                    <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-blue-800">File sudah terdeteksi</p><p className="text-[10px] text-blue-600/70 truncate">{draft.proposal.split('/').pop()}</p></div>
                                                    <a href={draft.proposal} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-[10px] font-bold text-blue-700 rounded shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors">Lihat File</a>
                                                </div>
                                            )}
                                            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDraftField('file_proposal', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary" />
                                        </div>
                                        <div className="space-y-3 pt-2 border-t border-slate-100/50">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-slate-700">Link Tambahan</label>
                                                <button type="button" onClick={() => setDraft(prev => ({ ...prev, link_tambahan: [...prev.link_tambahan, { name: '', url: '' }] }))} className="text-[11px] font-bold text-poltekpar-primary hover:opacity-70 flex items-center gap-1">
                                                    <Plus size={12} /> Tambah
                                                </button>
                                            </div>
                                            {draft.link_tambahan.map((link, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2">
                                                    <input type="text" placeholder="Nama Tautan (Opsional)..." value={link.name} onChange={e => {
                                                        const newLinks = [...draft.link_tambahan];
                                                        newLinks[idx].name = e.target.value;
                                                        setDraft(prev => ({ ...prev, link_tambahan: newLinks }));
                                                    }} className="w-full sm:w-1/3 min-h-[44px] px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-poltekpar-primary" />
                                                    <div className="flex-1 w-full flex items-center gap-2">
                                                        <input type="url" placeholder="https://..." value={link.url} onChange={e => {
                                                            const newLinks = [...draft.link_tambahan];
                                                            newLinks[idx].url = e.target.value;
                                                            setDraft(prev => ({ ...prev, link_tambahan: newLinks }));
                                                        }} className="flex-1 min-h-[44px] px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-poltekpar-primary" />
                                                        {draft.link_tambahan.length > 1 && (
                                                            <button type="button" onClick={() => setDraft(prev => ({ ...prev, link_tambahan: prev.link_tambahan.filter((_, i) => i !== idx) }))} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Doc label="Surat Permohonan" url={pengajuan.surat_permohonan} />
                                        <Doc label="Proposal" url={pengajuan.proposal} />
                                        <div className="space-y-1.5"><div className="text-xs font-semibold text-slate-700">Link Tambahan</div>{extraLinks.length ? <div className="space-y-2">{extraLinks.map((link, i) => <a key={`${link.url}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-indigo-600"><span className="truncate">{link.name}</span><ExternalLink size={14} /></a>)}</div> : <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">Tidak ada link tambahan.</div>}</div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </>
                </div>

                <div className="space-y-6">
                    <Card
                        title="Ringkasan Pengajuan"
                        action={canEditTanggalPengajuan ? sectionActions('submission-date', {
                            tanggal_pengajuan: draft.tanggal_pengajuan,
                        }, `/admin/pengajuan/${pengajuan.id_pengajuan}/tanggal-pengajuan`) : undefined}
                        icon={<File size={16} className="text-slate-400" />}
                    >
                        <div className="space-y-4">
                            <Field label="Sumber Pengajuan" value={isDosen ? 'Auth Dosen' : 'Auth Masyarakat'} />
                            <Field label="Email Pengaju" value={submitterEmail} />
                            {editingSection === 'submission-date' ? (
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-slate-700">Tanggal Pengajuan</div>
                                    <input
                                        type="date"
                                        value={draft.tanggal_pengajuan}
                                        onChange={(e) => setDraftField('tanggal_pengajuan', e.target.value)}
                                        className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-poltekpar-primary"
                                    />
                                    <p className="text-[11px] text-slate-500">Perubahan tanggal pengajuan hanya tersedia untuk superadmin.</p>
                                </div>
                            ) : (
                                <Field label="Tanggal Pengajuan" value={fmtDate(pengajuan.created_at)} />
                            )}
                            {isDosen && <><Field label="Tanggal Mulai" value={fmtDate(pengajuan.tgl_mulai)} /><Field label="Tanggal Selesai" value={fmtDate(pengajuan.tgl_selesai)} /></>}
                        </div>
                    </Card>
                    {pengajuan.catatan_admin && <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm"><div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-amber-700">Catatan Terakhir</div><p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-700">{pengajuan.catatan_admin}</p></div>}
                    {pengajuan.logs && pengajuan.logs.length > 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                                <h2 className="text-[13px] font-semibold text-zinc-900">Riwayat Status</h2>
                            </div>
                            <div className="p-4 space-y-0">
                                {pengajuan.logs.map((log, i) => {
                                    const stBaru = statusConfig[log.status_baru] || statusConfig.diproses;
                                    const stLama = log.status_lama ? (statusConfig[log.status_lama] || statusConfig.diproses) : null;
                                    return (
                                        <div key={log.id} className="flex gap-3 pb-4 relative">
                                            {i < (pengajuan.logs?.length || 0) - 1 && (
                                                <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-zinc-100" />
                                            )}
                                            <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 border-2 border-white ring-2 ${stBaru.dot.replace('bg-', 'ring-')}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {stLama && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${stLama.bg} ${stLama.text}`}>{stLama.label}</span>}
                                                    {stLama && <span className="text-zinc-400 text-[11px]">→</span>}
                                                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${stBaru.bg} ${stBaru.text}`}>{stBaru.label}</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 mt-1">{log.changed_by_name || 'Admin'} · {log.created_at}</p>
                                                {log.catatan && <p className="text-[12px] text-zinc-700 mt-1.5 leading-relaxed">{log.catatan}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                                <h2 className="text-[13px] font-semibold text-zinc-900">Riwayat Status</h2>
                            </div>
                            <div className="px-5 py-4 text-[13px] text-zinc-400">Belum ada riwayat perubahan.</div>
                        </div>
                    )}

                    {/* Direktur Decision Panel */}
                    {isDirektur && pengajuan.status_pengajuan === 'diajukan' && (
                        <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-lg ring-1 ring-violet-500/10">
                            <div className="border-b border-violet-100 bg-violet-50/50 px-6 py-4">
                                <h2 className="text-sm font-bold text-violet-900">Keputusan Direktur</h2>
                                <p className="text-[11px] text-violet-600 mt-0.5">Sertakan catatan untuk keputusan Anda.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    {([
                                        { id: 'approve', label: 'Terima Pengajuan', icon: <CheckCircle size={16} />, color: 'border-emerald-200 bg-emerald-50 text-emerald-700', selected: 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200' },
                                        { id: 'revise', label: 'Kembalikan untuk Revisi', icon: <RotateCcw size={16} />, color: 'border-amber-200 bg-amber-50 text-amber-700', selected: 'border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-200' },
                                        { id: 'decline', label: 'Tolak Pengajuan', icon: <XCircle size={16} />, color: 'border-red-200 bg-red-50 text-red-700', selected: 'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-200' },
                                    ] as const).map(opt => (
                                        <button
                                            type="button"
                                            key={opt.id}
                                            onClick={() => { setDecisionAction(opt.id); setCatatanError(''); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${decisionAction === opt.id ? opt.selected : opt.color}`}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                            {decisionAction === opt.id && <span className="ml-auto text-[10px] bg-current/10 px-2 py-0.5 rounded-full font-black">TERPILIH</span>}
                                        </button>
                                    ))}
                                </div>

                                {decisionAction && (
                                    <div className="space-y-3 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catatan Direktur <span className="text-red-500">*</span></label>
                                            <textarea
                                                value={catatanDirektur}
                                                onChange={e => setCatatanDirektur(e.target.value)}
                                                rows={4}
                                                placeholder="Tulis alasan atau arahan di sini..."
                                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 resize-none"
                                            />
                                            {catatanError && <p className="text-xs text-red-500 font-medium">{catatanError}</p>}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleDirekturDecision}
                                            disabled={isSubmittingDecision}
                                            className={`w-full py-4 rounded-xl text-sm font-black text-white shadow-xl transition-all ${decisionAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                                : decisionAction === 'decline' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                                } ${isSubmittingDecision ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                                        >
                                            {isSubmittingDecision ? 'Memproses...' : (
                                                decisionAction === 'approve' ? '✓ Konfirmasi Terima'
                                                    : decisionAction === 'decline' ? '✕ Konfirmasi Tolak'
                                                        : '↺ Konfirmasi Revisi'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isDirektur && pengajuan.status_pengajuan === 'revisi_direktur' && (
                        <div className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
                            <div className="border-b border-orange-100 bg-orange-50/70 px-6 py-4">
                                <h2 className="text-[14px] font-semibold text-orange-900">Revisi dari Direktur</h2>
                                <p className="text-[12px] text-orange-700 mt-1">Teruskan catatan direktur ke pengusul agar pengajuan dapat diperbaiki.</p>
                            </div>
                            <div className="p-5 space-y-3">
                                {pengajuan.catatan_direktur && (
                                    <div className="rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2 text-[13px] text-orange-900">
                                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-orange-700">Catatan Direktur</div>
                                        <p className="whitespace-pre-wrap leading-relaxed">{pengajuan.catatan_direktur}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-zinc-700">Catatan untuk Pengusul</label>
                                    <textarea
                                        value={catatan}
                                        onChange={e => setCatatan(e.target.value)}
                                        rows={3}
                                        placeholder="Tulis atau sesuaikan catatan revisi untuk pengusul..."
                                        className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/20 resize-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/status`, {
                                        status_pengajuan: 'direvisi',
                                        catatan_admin: catatan || pengajuan.catatan_direktur || null,
                                    })}
                                    className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/15 transition-colors hover:bg-orange-700"
                                >
                                    Kembalikan ke Pengusul
                                </button>
                            </div>
                        </div>
                    )}

                    {!isDirektur && !['selesai', 'diterima', 'ditolak', 'revisi_direktur'].includes(pengajuan.status_pengajuan) && (
                        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                                <h2 className="text-[14px] font-semibold text-zinc-900">Ajukan ke Direktur</h2>
                                <p className="text-[12px] text-zinc-500 mt-1">Setelah data pengajuan lengkap dan benar, ajukan ke Direktur untuk keputusan akhir.</p>
                            </div>
                            <div className="p-5">
                                <div className="mb-3">
                                    <label className="text-xs font-bold text-zinc-700">Catatan untuk Direktur <span className="text-zinc-400 font-normal">(opsional)</span></label>
                                    <textarea
                                        value={catatan}
                                        onChange={e => setCatatan(e.target.value)}
                                        rows={3}
                                        placeholder="Tulis catatan/konteks untuk Direktur jika diperlukan..."
                                        className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-poltekpar-primary focus:ring-2 focus:ring-poltekpar-primary/20 resize-none"
                                    />
                                </div>
                                {missing.length > 0 && (
                                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                                        <div>
                                            <div className="font-bold">Data belum lengkap:</div>
                                            <div>{missing.join(', ')}</div>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setConfirmDialog({
                                        open: true,
                                        title: 'Ajukan ke Direktur?',
                                        message: 'Pengajuan ini akan dikirim ke Direktur untuk diperiksa dan diputuskan. Pastikan semua data sudah benar.',
                                        action: () => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/status`, {
                                            status_pengajuan: 'diajukan',
                                            catatan_admin: catatan || null,
                                        }),
                                        variant: 'warning',
                                        confirmLabel: 'Ya, Ajukan',
                                        cancelLabel: 'Batal',
                                    })}
                                    disabled={missing.length > 0}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all ${missing.length > 0
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                        : 'bg-poltekpar-primary text-white hover:bg-poltekpar-navy shadow-sm'
                                        }`}
                                >
                                    <Send size={16} />
                                    Ajukan ke Direktur
                                </button>
                            </div>
                        </div>
                    )}

                    {pengajuan.status_pengajuan === 'diajukan' && !isDirektur && (
                        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                                <p className="text-sm font-bold text-violet-800">Menunggu Keputusan Direktur</p>
                            </div>
                            <p className="text-xs text-violet-700">Pengajuan ini telah dikirim ke Direktur dan sedang menunggu keputusan (Terima / Tolak / Revisi).</p>
                        </div>
                    )}

                    {/* Admin can mark as selesai after diterima */}
                    {pengajuan.status_pengajuan === 'diterima' && (
                        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                                <h2 className="text-[14px] font-semibold text-zinc-900">Tandai Selesai</h2>
                            </div>
                            <div className="p-5">
                                <button
                                    onClick={() => setConfirmDialog({
                                        open: true,
                                        title: 'Tandai Selesai?',
                                        message: 'PKM ini akan ditandai sebagai selesai.',
                                        action: () => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/status`, { status_pengajuan: 'selesai' }),
                                        variant: 'info',
                                        confirmLabel: 'Ya, Selesai',
                                        cancelLabel: 'Batal',
                                    })}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-bold hover:bg-indigo-700 transition-all"
                                >
                                    <CheckCircle size={16} />
                                    Tandai Selesai
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} confirmLabel={confirmDialog.confirmLabel} cancelLabel={confirmDialog.cancelLabel} onConfirm={() => { confirmDialog.action(); setConfirmDialog((prev) => ({ ...prev, open: false })); }} onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))} variant={confirmDialog.variant} />
        </AdminLayout>
    );
}
