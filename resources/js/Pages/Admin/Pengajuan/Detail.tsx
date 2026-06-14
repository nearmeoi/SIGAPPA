import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import MapLocationPicker from '@/Components/map/MapLocationPicker';
import { formatRupiah, formatDateID } from '@/utils/formatters';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, File, Folder, MapPin, Plus, RotateCcw, Save, Send, SquarePen, Trash2, User, Users, Wallet, XCircle, AlertTriangle } from 'lucide-react';

interface Pegawai { id_pegawai: number; nama_pegawai: string; nip?: string; role?: string | null; }
interface Aktivitas {
    id_aktivitas: number;
    status_pelaksanaan: string;
    catatan_pelaksanaan?: string;
    judul_pkm?: string;
    tgl_mulai?: string;
    tgl_selesai?: string;
    total_anggaran?: number;
    sumber_dana?: string;
    // Jenis PKM bisa lebih dari satu (many-to-many)
    jenis_pkm?: { id_jenis_pkm: number; nama_jenis: string; warna_icon?: string }[];
    // Tim pelaksana dikelompokkan per peran
    tim_kegiatan?: { id_tim: number; nama: string; peran_tim: string; id_pegawai?: number }[];
    // Lokasi aktivitas
    provinsi?: string;
    kota_kabupaten?: string;
    kecamatan?: string;
    kelurahan_desa?: string;
    alamat_lengkap?: string;
    latitude?: number;
    longitude?: number;
}
interface Arsip { id_arsip: number; nama_dokumen: string; jenis_arsip: string; url_dokumen?: string; }
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
    status_pengajuan: string;
    catatan_admin?: string;
    created_at?: string;
    proposal?: string;
    surat_permohonan?: string;
    user?: { name: string; email: string; role?: string };
    provinsi?: string;
    kota_kabupaten?: string;
    kecamatan?: string;
    kelurahan_desa?: string;
    alamat_lengkap?: string;
    latitude?: number;
    longitude?: number;
    lokasi_tambahan?: string;
    aktivitas?: Aktivitas[];
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
}

interface DraftState {
    tanggal_pengajuan: string;
    nama_pengusul: string;
    email_pengusul: string;
    instansi_mitra: string;
    no_telepon: string;
    kebutuhan: string;
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
    surat_permohonan: string;
    proposal: string;
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
    revisi_direktur: { label: 'Revisi Direktur', text: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-400' },
    diajukan: { label: 'Diajukan ke Direktur', text: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-400' },
    diterima: { label: 'Diterima', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    direvisi: { label: 'Revisi', text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
    ditolak: { label: 'Ditolak', text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-400' },
    selesai: { label: 'Selesai', text: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-400' },
};

const fmtDate = (v?: string) => formatDateID(v, { day: 'numeric', month: 'long', year: 'numeric' });
const fmtMoney = (v?: number | null) => formatRupiah(v);
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
const getSubmitterName = (p: Pengajuan) => p.nama_pengusul || p.user?.name || '-';
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
const emptyLink = () => ({ name: '', url: '' });
const buildDraft = (pengajuan: Pengajuan): DraftState => ({
    tanggal_pengajuan: toDateInputValue(pengajuan.created_at),
    nama_pengusul: pengajuan.nama_pengusul || getSubmitterName(pengajuan),
    email_pengusul: pengajuan.email_pengusul || getSubmitterEmail(pengajuan),
    instansi_mitra: pengajuan.instansi_mitra || '',
    no_telepon: pengajuan.no_telepon || '',
    kebutuhan: pengajuan.kebutuhan || '',
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
    surat_permohonan: pengajuan.surat_permohonan || '',
    proposal: pengajuan.proposal || '',
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

function Detail({ pengajuan, listPegawai }: Props) {
    const { props } = usePage();
    const user = (props as any).auth?.user;
    const isDirektur = user?.role === 'direktur';
    const isViewer = isDirektur;

    const [catatan, setCatatan] = useState(pengajuan.catatan_admin || '');
    const [selectedAction, setSelectedAction] = useState('');
    const [catatanError, setCatatanError] = useState('');
    const [catatanDirektur, setCatatanDirektur] = useState('');
    const [decisionAction, setDecisionAction] = useState<'approve' | 'decline' | 'revise' | null>(null);
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

    const ketua = undefined; // Tim sekarang ada di Aktivitas, bukan Pengajuan
    const [confirmDialog, setConfirmDialog] = useState<DialogState>({ open: false, title: '', message: '', action: () => undefined, variant: 'warning', confirmLabel: 'Ya, Lanjutkan', cancelLabel: 'Batal' });
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftState>(() => buildDraft(pengajuan));

    useEffect(() => {
        setDraft(buildDraft(pengajuan));
    }, [pengajuan]);
    const [collapsedLocations, setCollapsedLocations] = useState<Record<number, boolean>>({});

    const toggleLocationCollapse = (idUi: number) => {
        setCollapsedLocations(prev => ({ ...prev, [idUi]: !prev[idUi] }));
    };
    const st = statusConfig[pengajuan.status_pengajuan] || statusConfig.diproses;
    const isDosen = getType(pengajuan) === 'dosen';
    const canEditTanggalPengajuan = (props as any).auth?.user?.role === 'superadmin';
    const submitterName = getSubmitterName(pengajuan);
    const submitterEmail = getSubmitterEmail(pengajuan);
    const missing = [
        !submitterName || submitterName === '-' ? 'Nama Pengusul' : '',
        !submitterEmail || submitterEmail === '-' ? 'Email Pengusul' : '',
        !pengajuan.instansi_mitra ? 'Instansi' : '',
        !pengajuan.no_telepon ? 'No. WhatsApp' : '',
        !pengajuan.kebutuhan ? (isDosen ? 'Deskripsi Kegiatan' : 'Kebutuhan PKM') : '',
        !pengajuan.provinsi ? 'Provinsi' : '',
        !pengajuan.kota_kabupaten ? 'Kota / Kabupaten' : '',
        !pengajuan.surat_permohonan ? 'Surat Permohonan' : '',
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



    const startEdit = (section: string) => {
        setEditingSection(section);
    };
    const cancelEdit = () => {
        setDraft(buildDraft(pengajuan));
        setEditingSection(null);
    };

    const saveSection = (section: string, payload: Record<string, any>, url?: string) => {
        const hasFiles = Object.values(payload).some(v => v instanceof window.File);

        const options = {
            preserveScroll: true,
            onSuccess: () => setEditingSection((current) => (current === section ? null : current)),
            onError: (errors: any) => {
                alert('Gagal menyimpan. Terdapat kesalahan validasi:\n' + Object.values(errors).join('\n'));
            }
        };

        if (hasFiles) {
            payload._method = 'put';
            router.post(url || `/admin/pengajuan/${pengajuan.id_pengajuan}`, payload, {
                ...options,
                forceFormData: true
            });
        } else {
            router.put(url || `/admin/pengajuan/${pengajuan.id_pengajuan}`, payload, options);
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
            onError: (errors: any) => {
                const errorMessage = errors.catatan || errors.catatanDirektur || Object.values(errors)[0] as string;
                if (errorMessage) {
                    setCatatanError(errorMessage);
                } else {
                    setCatatanError('Terjadi kesalahan saat memproses data.');
                }
            }
        });
    };

    const sectionActions = (section: string, payload: Record<string, any>, url?: string) => {
        if (isViewer) return null;
        return editingSection === section ? (
            <>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={() => saveSection(section, payload, url)}
                    className="inline-flex items-center gap-1 rounded-lg bg-poltekpar-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-poltekpar-navy"
                >
                    <Save size={12} />
                    Simpan
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
        <>
            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin/pengajuan" className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"><ArrowLeft size={16} /></Link>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-bold text-slate-900">{pengajuan.aktivitas?.[0]?.judul_pkm || pengajuan.instansi_mitra || 'Detail Pengajuan'}</h1>
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
                                kebutuhan: draft.kebutuhan,
                            })}
                            icon={<File size={16} className="text-slate-400" />}
                        >
                            <div className="space-y-4">
                                {editingSection === 'detail' ? (
                                    <>
                                        <EditField label="Kebutuhan / Deskripsi Singkat" value={draft.kebutuhan} onChange={(v) => setDraftField('kebutuhan', v)} wide textarea />
                                    </>
                                ) : (
                                    <>
                                        <Field label={isDosen ? 'Deskripsi Kegiatan' : 'Kebutuhan PKM'} value={pengajuan.kebutuhan} wide />
                                        {(pengajuan.aktivitas?.length ?? 0) > 0 && (
                                            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
                                                ℹ️ Detail kegiatan (Judul PKM, Jenis, Waktu, Tim, RAB) dikelola di masing-masing <strong>Aktivitas</strong> di bawah.
                                            </div>
                                        )}
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
                                                            <i className={`fa-solid fa-chevron-${collapsedLocations[lokasi.id_ui] ? 'up' : 'down'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                {collapsedLocations[lokasi.id_ui] && (
                                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                                        <div className="rounded-xl overflow-hidden border border-zinc-200 mb-4">
                                                            <MapLocationPicker
                                                                latitude={lokasi.latitude ?? null}
                                                                longitude={lokasi.longitude ?? null}
                                                                onChange={(lat: number, lng: number, addr?: any) => {
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
                                ) : (() => {
                                    let additionalLocations: any[] = [];
                                    try {
                                        const parsed = typeof (pengajuan as any).lokasi_tambahan === 'string'
                                            ? JSON.parse((pengajuan as any).lokasi_tambahan)
                                            : (pengajuan as any).lokasi_tambahan;
                                        if (Array.isArray(parsed)) additionalLocations = parsed;
                                    } catch { }

                                    return (
                                        <div className="space-y-6">
                                            {/* Titik Utama */}
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative mt-4 shadow-sm">
                                                <div className="absolute -top-3 left-4 bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border border-blue-200 shadow-sm flex items-center gap-1.5">
                                                    <MapPin size={12} />
                                                    {(() => {
                                                        const tambahan = pengajuan.lokasi_tambahan;
                                                        const parsed = tambahan ? (typeof tambahan === 'string' ? JSON.parse(tambahan) : tambahan) : [];
                                                        return Array.isArray(parsed) && parsed.length > 0 ? 'Lokasi 1' : 'Lokasi';
                                                    })()} {pengajuan.kota_kabupaten ? `- ${pengajuan.kota_kabupaten}` : ''}
                                                </div>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-2">
                                                    <Field label="Provinsi" value={pengajuan.provinsi} />
                                                    <Field label="Kota/Kabupaten" value={pengajuan.kota_kabupaten} />
                                                    <Field label="Kecamatan" value={pengajuan.kecamatan} />
                                                    <Field label="Kelurahan/Desa" value={pengajuan.kelurahan_desa} />
                                                    <Field label="Alamat Lengkap" value={pengajuan.alamat_lengkap} wide />
                                                    {(pengajuan.latitude && pengajuan.longitude) && (
                                                        <div className="col-span-full pt-3">
                                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${pengajuan.latitude},${pengajuan.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors w-fit border border-blue-100">
                                                                <MapPin size={16} /> Buka di Google Maps
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Titik Tambahan */}
                                            {additionalLocations.map((loc, idx) => (
                                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative mt-6 shadow-sm">
                                                    <div className="absolute -top-3 left-4 bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border border-slate-300 shadow-sm flex items-center gap-1.5">
                                                        <MapPin size={12} />
                                                        Lokasi {idx + 2} {loc.kota_kabupaten ? `- ${loc.kota_kabupaten}` : ''}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-2">
                                                        <Field label="Provinsi" value={loc.provinsi} />
                                                        <Field label="Kota/Kabupaten" value={loc.kota_kabupaten} />
                                                        <Field label="Kecamatan" value={loc.kecamatan} />
                                                        <Field label="Kelurahan/Desa" value={loc.kelurahan_desa} />
                                                        <Field label="Alamat Lengkap" value={loc.alamat_lengkap} wide />
                                                        {(loc.latitude && loc.longitude) && (
                                                            <div className="col-span-full pt-3">
                                                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude || loc.lat},${loc.longitude || loc.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors w-fit border border-slate-200">
                                                                    <MapPin size={16} /> Buka di Google Maps
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </Card>
                        {(pengajuan.status_pengajuan === 'diterima' || pengajuan.status_pengajuan === 'selesai') ? (
                            <Card
                                title={`Aktivitas PKM ${pengajuan.aktivitas && pengajuan.aktivitas.length > 0 ? `(${pengajuan.aktivitas.length})` : ''}`}
                                icon={<File size={16} className="text-slate-400" />}
                                action={
                                    !isViewer ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post('/admin/aktivitas', {
                                                id_pengajuan: pengajuan.id_pengajuan,
                                                judul_pkm: 'Aktivitas PKM Baru',
                                            }, { preserveScroll: true })}
                                            className="inline-flex items-center gap-1 rounded-lg bg-poltekpar-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-poltekpar-navy"
                                        >
                                            <Plus size={12} />
                                            Tambah Aktivitas
                                        </button>
                                    ) : null
                                }
                            >
                                {pengajuan.aktivitas && pengajuan.aktivitas.length > 0 ? (
                                    <div className="space-y-4">
                                        {pengajuan.aktivitas.map((a, idx) => {
                                            const statusColors: Record<string, string> = {
                                                belum_mulai: 'bg-slate-100 text-slate-600',
                                                persiapan:   'bg-yellow-100 text-yellow-700',
                                                berjalan:    'bg-blue-100 text-blue-700',
                                                selesai:     'bg-emerald-100 text-emerald-700',
                                            };
                                            const statusLabel: Record<string, string> = {
                                                belum_mulai: 'Belum Mulai',
                                                persiapan:   'Persiapan',
                                                berjalan:    'Berjalan',
                                                selesai:     'Selesai',
                                            };
                                            const ketua = a.tim_kegiatan?.find(t => t.peran_tim === 'ketua');
                                            const dosen = a.tim_kegiatan?.filter(t => t.peran_tim === 'anggota_dosen') ?? [];
                                            const staff = a.tim_kegiatan?.filter(t => t.peran_tim === 'anggota_staff') ?? [];
                                            const mhs   = a.tim_kegiatan?.filter(t => t.peran_tim === 'anggota_mahasiswa') ?? [];
                                            const hasLokasi = a.provinsi || a.kota_kabupaten;
                                            return (
                                                <div key={a.id_aktivitas} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="shrink-0 w-6 h-6 rounded-full bg-poltekpar-primary/10 text-poltekpar-primary text-[11px] font-bold flex items-center justify-center">{idx + 1}</span>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-slate-800 truncate">{a.judul_pkm || 'Aktivitas PKM'}</div>
                                                                {a.jenis_pkm && a.jenis_pkm.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {a.jenis_pkm.map((j, ji) => (
                                                                            <span key={ji} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                                {j.nama_jenis}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[a.status_pelaksanaan] ?? 'bg-slate-100 text-slate-500'}`}>
                                                                {statusLabel[a.status_pelaksanaan] ?? a.status_pelaksanaan}
                                                            </span>
                                                            <Link
                                                                href={`/admin/aktivitas/${a.id_aktivitas}`}
                                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                                            >
                                                                Kelola
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    {/* Body — detail nested */}
                                                    <div className="px-4 py-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-[12px]">
                                                        {/* Waktu */}
                                                        {(a.tgl_mulai || a.tgl_selesai) && (
                                                            <div>
                                                                <div className="font-semibold text-slate-500 mb-0.5">Waktu Pelaksanaan</div>
                                                                <div className="text-slate-700">
                                                                    {a.tgl_mulai ? fmtDate(a.tgl_mulai) : '?'}
                                                                    {a.tgl_selesai && ` — ${fmtDate(a.tgl_selesai)}`}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* RAB */}
                                                        {a.total_anggaran != null && (
                                                            <div>
                                                                <div className="font-semibold text-slate-500 mb-0.5">RAB</div>
                                                                <div className="text-slate-700">
                                                                    Rp {Number(a.total_anggaran).toLocaleString('id-ID')}
                                                                    {a.sumber_dana && <span className="ml-1 text-slate-400">({a.sumber_dana})</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Lokasi */}
                                                        {hasLokasi && (
                                                            <div>
                                                                <div className="font-semibold text-slate-500 mb-0.5">Lokasi</div>
                                                                <div className="text-slate-700">{[a.kota_kabupaten, a.provinsi].filter(Boolean).join(', ')}</div>
                                                            </div>
                                                        )}
                                                        {/* Tim */}
                                                        {(a.tim_kegiatan && a.tim_kegiatan.length > 0) && (
                                                            <div className="md:col-span-2">
                                                                <div className="font-semibold text-slate-500 mb-1">Tim Pelaksana</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {ketua && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-[11px] font-semibold">
                                                                            👑 {ketua.nama}
                                                                        </span>
                                                                    )}
                                                                    {dosen.map((d, di) => (
                                                                        <span key={di} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-[11px]">
                                                                            🎓 {d.nama}
                                                                        </span>
                                                                    ))}
                                                                    {staff.map((s, si) => (
                                                                        <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-800 border border-violet-100 text-[11px]">
                                                                            👤 {s.nama}
                                                                        </span>
                                                                    ))}
                                                                    {mhs.map((m, mi) => (
                                                                        <span key={mi} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px]">
                                                                            🎒 {m.nama}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                        Belum ada aktivitas yang dibuat untuk pengajuan ini. <br/>
                                        {!isViewer && (
                                            <button
                                                type="button"
                                                onClick={() => router.post('/admin/aktivitas', {
                                                    id_pengajuan: pengajuan.id_pengajuan,
                                                    judul_pkm: 'Aktivitas PKM Baru',
                                                })}
                                                className="text-poltekpar-primary font-semibold mt-2 inline-block hover:opacity-70"
                                            >
                                                Mulai Buat Aktivitas
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ) : null}
                        <Card
                            title="Dokumen"
                            action={sectionActions('docs', {
                                surat_permohonan: draft.surat_permohonan,
                                proposal: draft.proposal,
                                file_surat_permohonan: draft.file_surat_permohonan,
                                file_proposal: draft.file_proposal,
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
                                    </>
                                ) : (
                                    <>
                                        <Doc label="Surat Permohonan" url={pengajuan.surat_permohonan} />
                                        <Doc label="Proposal" url={pengajuan.proposal} />
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
                                        <div key={log.id} className="flex gap-3 pb-4 relative group">
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
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-[11px] text-zinc-500">{log.changed_by_name || 'Admin'} · {log.created_at}</p>
                                                    {['superadmin', 'secret_account'].includes(user?.role) && (
                                                        <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button title="Edit Catatan" onClick={() => {
                                                                const newVal = prompt('Edit catatan riwayat:', log.catatan || '');
                                                                if (newVal !== null) router.put(`/admin/pengajuan-logs/${log.id}`, { catatan: newVal, status_baru: log.status_baru });
                                                            }} className="p-1 text-zinc-400 hover:text-blue-600 rounded"><SquarePen size={12} /></button>
                                                            <div className="w-px h-3 bg-zinc-200" />
                                                            <button title="Hapus Riwayat" onClick={() => setConfirmDialog({
                                                                open: true, title: 'Hapus Log?', message: 'Riwayat aktivitas ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', cancelLabel: 'Batal', variant: 'danger',
                                                                action: () => router.delete(`/admin/pengajuan-logs/${log.id}`)
                                                            })} className="p-1 text-zinc-400 hover:text-red-600 rounded"><Trash2 size={12} /></button>
                                                        </div>
                                                    )}
                                                </div>
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

                    {!isDirektur && !['selesai', 'diterima', 'ditolak'].includes(pengajuan.status_pengajuan) && (
                        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                                <h2 className="text-[14px] font-semibold text-zinc-900">Ajukan ke Direktur</h2>
                                <p className="text-[12px] text-zinc-500 mt-1">Setelah data pengajuan lengkap dan benar, ajukan ke Direktur untuk keputusan akhir.</p>
                            </div>
                            <div className="p-5">
                                {pengajuan.status_pengajuan === 'revisi_direktur' && (
                                    <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 font-bold mb-2"><AlertCircle size={16} className="text-orange-600" /><span className="text-orange-800 text-sm">Catatan Revisi dari Direktur:</span></div>
                                        <p className="whitespace-pre-wrap pl-6 text-sm text-orange-700">{pengajuan.catatan_direktur || 'Tidak ada catatan spesifik.'}</p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="text-xs font-bold text-zinc-700">Catatan untuk {pengajuan.status_pengajuan === 'revisi_direktur' ? 'Pemohon / Direktur' : 'Direktur'} <span className="text-zinc-400 font-normal">(opsional)</span></label>
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
                                {pengajuan.status_pengajuan === 'revisi_direktur' && (
                                    <button
                                        onClick={() => setConfirmDialog({
                                            open: true,
                                            title: 'Kembalikan ke Pemohon?',
                                            message: 'Pengajuan akan dikembalikan ke form masyarakat/dosen untuk direvisi oleh mereka sesuai dengan catatan. Pastikan Anda telah menulis Catatan untuk Pemohon di atas.',
                                            action: () => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/status`, {
                                                status_pengajuan: 'direvisi',
                                                catatan_admin: catatan || null,
                                            }),
                                            variant: 'warning',
                                            confirmLabel: 'Ya, Kembalikan',
                                            cancelLabel: 'Batal',
                                        })}
                                        className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-xl text-[14px] font-bold transition-all bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-sm"
                                    >
                                        <RotateCcw size={16} />
                                        Kembalikan ke Pemohon untuk Revisi
                                    </button>
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
                                    {pengajuan.status_pengajuan === 'revisi_direktur' ? 'Kirim Kembali ke Direktur' : 'Ajukan ke Direktur'}
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

                    {/* Status Override for Superadmin & Secret */}
                    {['superadmin', 'secret_account'].includes(user?.role) && (
                        <div className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm ring-1 ring-rose-500/10">
                            <div className="border-b border-rose-100 bg-rose-50/50 px-6 py-4 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-rose-600" />
                                <h2 className="text-[14px] font-bold text-rose-900">Override Status Manual</h2>
                            </div>
                            <div className="p-5">
                                <p className="text-xs text-rose-700 mb-4">Fitur ini hanya untuk Superadmin / Secret Account. Dapat mengubah status pengajuan tanpa melalui alur normal.</p>
                                <div className="space-y-3">
                                    <select
                                        className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
                                        value={selectedAction}
                                        onChange={(e) => setSelectedAction(e.target.value)}
                                    >
                                        <option value="" disabled>-- Pilih Status Baru --</option>
                                        {Object.entries(statusConfig).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label} ({k})</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => {
                                            if (!selectedAction) return;
                                            setConfirmDialog({
                                                open: true,
                                                title: 'Override Status Paksa?',
                                                message: `Status akan diubah mutlak menjadi "${selectedAction}". Riwayat aktivitas ini akan dicatat sebagai "Perubahan Manual".`,
                                                action: () => router.put(`/admin/pengajuan/${pengajuan.id_pengajuan}/force-status`, { status_pengajuan: selectedAction }),
                                                variant: 'danger',
                                                confirmLabel: 'Ya, Paksa Ubah',
                                                cancelLabel: 'Batal',
                                            });
                                        }}
                                        disabled={!selectedAction || selectedAction === pengajuan.status_pengajuan}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all ${!selectedAction || selectedAction === pengajuan.status_pengajuan ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'}`}
                                    >
                                        <RotateCcw size={16} />
                                        Eksekusi Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} confirmLabel={confirmDialog.confirmLabel} cancelLabel={confirmDialog.cancelLabel} onConfirm={() => { confirmDialog.action(); setConfirmDialog((prev) => ({ ...prev, open: false })); }} onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))} variant={confirmDialog.variant} />
        </>
    );
}

Detail.layout = (page: React.ReactNode) => <AdminLayout title="">{page}</AdminLayout>;

export default Detail;
