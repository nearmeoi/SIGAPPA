import React, { useRef, useState, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import ActionFeedbackDialog from '@/Components/ui/ActionFeedbackDialog';
import MapLocationPicker from '@/Components/map/MapLocationPicker';
import DocumentationGallery from '@/Components/pkm/DocumentationGallery';
import TestimonialSidebarDisplay from '@/Components/testimonial/TestimonialSidebarDisplay';
import SuccessView from '@/Components/ui/SuccessView';
import type { PkmData } from '@/types';



interface Submission {
    id: number;
    kode_unik?: string;
    judul: string;
    ringkasan: string;
    tanggal: string;
    status: string;
    catatan?: string;
    instansi_mitra?: string;
    no_telepon?: string;
    provinsi?: string;
    kota_kabupaten?: string;
    kecamatan?: string;
    kelurahan_desa?: string;
    alamat_lengkap?: string;
    latitude?: number | string;
    longitude?: number | string;
    lokasi_tambahan?: any;
    proposal?: string;
    surat_permohonan?: string;
    rab?: string;
    sumber_dana?: string;
    total_anggaran?: number;
    tgl_mulai?: string;
    tgl_selesai?: string;
    jenis_pkm?: string;
    nama_pengusul?: string;
    email_pengusul?: string;
    kebutuhan?: string;
    aktivitas?: { status_pelaksanaan: string; catatan_pelaksanaan?: string };
    logs?: { id: number; status_lama: string | null; status_baru: string; catatan: string | null; created_at: string }[];
}

interface MasyarakatSubmissionCardProps {
    submissionStatus?: string;
    latestSubmission?: Submission | null;
    pkmStatusData?: PkmData | null;
    pkmListData?: PkmData[];
    submissionHistory?: Submission[];
    onSubmitted?: (submission: Submission) => void;
    onUpdateSubmissionStatus?: (status: string) => void;
    hideInlineStatusPanel?: boolean;
    hideMainTabNav?: boolean;
    onlyShowStatus?: boolean;
    editSubmission?: Submission | null;
    pagination?: {
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    } | null;
    filters?: {
        search?: string;
    };
}

const createSubmittedLabel = (): string =>
    new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date());

const formatCoordinate = (value: unknown): string | null => {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    return Number.isFinite(parsed) ? parsed.toFixed(6) : null;
};

const getSubmissionStatusStyle = (status: string) => {
    const styles: Record<string, { label: string; icon: string; bg: string; color: string }> = {
        diproses: { label: 'Diproses', icon: 'fa-clock', bg: '#dbeafe', color: '#1E4A8C' },
        ditangguhkan: { label: 'Revisi', icon: 'fa-file-pen', bg: '#fef3c7', color: '#b45309' },
        'Menunggu Keputusan Direktur': { label: 'Menunggu Keputusan Direktur', icon: 'fa-user-tie', bg: '#ede9fe', color: '#5b21b6' },
        ditolak: { label: 'Ditolak', icon: 'fa-circle-xmark', bg: '#fee2e2', color: '#b91c1c' },
        diterima: { label: 'Diterima', icon: 'fa-circle-check', bg: '#dcfce7', color: '#15803d' },
        berlangsung: { label: 'Berlangsung', icon: 'fa-person-walking', bg: '#fef3c7', color: '#b45309' },
        selesai: { label: 'Selesai', icon: 'fa-flag-checkered', bg: '#dcfce7', color: '#15803d' },
        direvisi: { label: 'Direvisi', icon: 'fa-file-pen', bg: '#fff7ed', color: '#ea580c' },
        belum_diajukan: { label: 'Belum Diajukan', icon: 'fa-file-circle-plus', bg: '#f1f5f9', color: '#64748b' },
    };
    return styles[status] || styles.belum_diajukan;
};

interface FormData {
    name: string;
    institution: string;
    email: string;
    whatsapp: string;
    needs: string;
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
    tgl_mulai: string | null;
    tgl_selesai: string | null;
    is_tahun_saja: boolean;
    surat_permohonan: string;
    surat_proposal: string;
    link_tambahan: { name: string; url: string }[];
}

const EVALUATION_QUESTIONS = [
    'Website SIGAPPA mudah diakses dan memiliki navigasi yang jelas.',
    'Informasi yang tersedia lengkap, akurat, dan mudah dipahami.',
    'Fitur peta SIGAPPA membantu memahami sebaran kegiatan PKM.',
    'Proses pengajuan layanan PKM melalui SIGAPPA mudah dilakukan.',
    'Secara keseluruhan, saya puas terhadap layanan SIGAPPA.',
];

export default function MasyarakatSubmissionCard({
    submissionStatus = 'belum_diajukan',
    latestSubmission = null,
    pkmStatusData = null,
    pkmListData = [],
    submissionHistory = [],
    onSubmitted,
    onUpdateSubmissionStatus,
    hideInlineStatusPanel = false,
    hideMainTabNav = false,
    onlyShowStatus = false,
    editSubmission = null,
    pagination = null,
    filters = {},
}: MasyarakatSubmissionCardProps) {
    const [mainTab, setMainTab] = useState('pengajuan');
    const [selectedDetail, setSelectedDetail] = useState<Submission | null>(null);
    const [selectedStatusLog, setSelectedStatusLog] = useState<Submission | null>(null);
    const [isMockSubmitting, setIsMockSubmitting] = useState(false);

    const [feedbackDialog, setFeedbackDialog] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ show: false, type: 'success', title: '', message: '' });
    const [sortOption, setSortOption] = useState<'default' | 'status' | 'waktu_terbaru' | 'waktu_terlama'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [collapsedLocations, setCollapsedLocations] = useState<Record<number, boolean>>({});

    const [searchValue, setSearchValue] = useState(filters.search || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchValue !== (filters.search || '')) {
                router.get(
                    window.location.pathname,
                    { search: searchValue },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchValue]);

    const toggleLocationCollapse = (idUi: number) => {
        setCollapsedLocations(prev => ({ ...prev, [idUi]: !prev[idUi] }));
    };

    // Feedback Flow States
    const [showFeedbackFlow, setShowFeedbackFlow] = useState(false);
    const [flowStep, setFlowStep] = useState<'rating' | 'comment' | 'success'>('rating');
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [ratings, setRatings] = useState<number[]>(new Array(EVALUATION_QUESTIONS.length).fill(0));
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

    const sortedHistory = useMemo(() => {
        let history = [...submissionHistory];
        switch (sortOption) {
            case 'default':
                history.sort((a, b) => {
                    const isAPri = a.status === 'direvisi' || a.status === 'diproses';
                    const isBPri = b.status === 'direvisi' || b.status === 'diproses';
                    if (isAPri && !isBPri) return -1;
                    if (!isAPri && isBPri) return 1;
                    const diff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
            case 'status':
                history.sort((a, b) => a.status.localeCompare(b.status));
                break;
            case 'waktu_terbaru':
                history.sort((a, b) => {
                    const diff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
            case 'waktu_terlama':
                history.sort((a, b) => {
                    const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
                    return isNaN(diff) ? 0 : diff;
                });
                break;
        }
        return history;
    }, [submissionHistory, sortOption]);

    const { data, setData, errors, reset } = useForm<FormData>({
        name: '',
        institution: '',
        email: '',
        whatsapp: '',
        needs: '',
        lokasi_list: [{
            id_ui: Date.now(),
            provinsi: '',
            kota_kabupaten: '',
            kecamatan: '',
            kelurahan_desa: '',
            alamat_lengkap: '',
            latitude: null,
            longitude: null,
        }],
        tgl_mulai: null,
        tgl_selesai: null,
        is_tahun_saja: false,
        surat_permohonan: '',
        surat_proposal: '',
        link_tambahan: [{ name: '', url: '' }],
    });

    const [filePermohonan, setFilePermohonan] = useState<File | null>(null);
    const [fileProposal, setFileProposal] = useState<File | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const isEditing = !!editingId;

    useEffect(() => {
        if (!editSubmission) return;

        let parsedLinks = [{ name: '', url: '' }];
        try {
            if (editSubmission.rab) {
                const arr = JSON.parse(editSubmission.rab);
                if (Array.isArray(arr) && arr.length > 0) {
                    parsedLinks = arr.map((item: any) => ({ name: item.name || '', url: item.url || '' }));
                }
            }
        } catch { }

        setData({
            name: editSubmission.nama_pengusul || '',
            institution: editSubmission.instansi_mitra || '',
            email: editSubmission.email_pengusul || '',
            whatsapp: editSubmission.no_telepon || '',
            needs: editSubmission.kebutuhan || editSubmission.ringkasan || '',
            lokasi_list: (() => {
                const arr = [{
                    id_ui: Date.now(),
                    provinsi: editSubmission.provinsi || '',
                    kota_kabupaten: editSubmission.kota_kabupaten || '',
                    kecamatan: editSubmission.kecamatan || '',
                    kelurahan_desa: editSubmission.kelurahan_desa || '',
                    alamat_lengkap: editSubmission.alamat_lengkap || '',
                    latitude: editSubmission.latitude ? Number(editSubmission.latitude) : null,
                    longitude: editSubmission.longitude ? Number(editSubmission.longitude) : null,
                }];
                try {
                    const tambahanStr = (editSubmission as any).lokasi_tambahan;
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
            tgl_mulai: editSubmission.tgl_mulai || null,
            tgl_selesai: editSubmission.tgl_selesai || null,
            is_tahun_saja: false,
            surat_permohonan: editSubmission.surat_permohonan || '',
            surat_proposal: editSubmission.proposal || '',
            link_tambahan: parsedLinks,
        });
        setEditingId(editSubmission.kode_unik ?? String(editSubmission.id));
    }, [editSubmission]);

    const handleAddLink = () => setData('link_tambahan', [...data.link_tambahan, { name: '', url: '' }]);
    const handleRemoveLink = (index: number) => setData('link_tambahan', data.link_tambahan.filter((_, i) => i !== index));
    const handleLinkChange = (index: number, field: 'name' | 'url', value: string) => {
        const updated = [...data.link_tambahan];
        updated[index] = { ...updated[index], [field]: value };
        setData('link_tambahan', updated);
    };

    const submitFormData = (opts?: { onSuccess?: () => void; onError?: () => void }) => {
        const formData = new FormData();
        if (isEditing) formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('institution', data.institution);
        formData.append('email', data.email);
        formData.append('whatsapp', data.whatsapp);
        formData.append('needs', data.needs);
        formData.append('lokasi_list', JSON.stringify(data.lokasi_list));
        if (data.tgl_mulai) formData.append('tgl_mulai', data.tgl_mulai);
        if (data.tgl_selesai) formData.append('tgl_selesai', data.tgl_selesai);
        formData.append('is_tahun_saja', data.is_tahun_saja ? '1' : '0');
        if (filePermohonan) formData.append('surat_permohonan', filePermohonan);
        if (fileProposal) formData.append('surat_proposal', fileProposal);
        formData.append('link_tambahan', JSON.stringify(data.link_tambahan.filter(v => v.url.trim() !== '')));

        const url = isEditing ? `/pengajuan/${editingId}` : '/pengajuan';
        router.post(url, formData as any, {
            preserveScroll: true,
            onSuccess: opts?.onSuccess,
            onError: opts?.onError,
        });
    };

    const handleInitialSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.name.trim() || !data.institution.trim() || !data.needs.trim() || !data.email.trim() || !data.whatsapp.trim() || (!filePermohonan && !isEditing)) {
            setFeedbackDialog({ show: true, type: 'error', title: 'Form Belum Lengkap', message: 'Mohon lengkapi identitas (termasuk email dan no. whatsapp), kebutuhan, dan dokumen wajib.' });
            return;
        }

        if (isEditing) {
            setIsMockSubmitting(true);
            submitFormData({
                onSuccess: () => {
                    setIsMockSubmitting(false);
                    reset();
                    setFilePermohonan(null);
                    setFileProposal(null);
                },
                onError: () => {
                    setIsMockSubmitting(false);
                    setFeedbackDialog({ show: true, type: 'error', title: 'Gagal', message: 'Gagal memperbarui pengajuan. Silakan coba lagi.' });
                },
            });
            return;
        }

        setShowFeedbackFlow(true);
        setFlowStep('rating');
        setActiveQuestionIndex(0);
        setRatings(new Array(EVALUATION_QUESTIONS.length).fill(0));
    };

    const handleRatingClick = (star: number) => {
        const newRatings = [...ratings];
        newRatings[activeQuestionIndex] = star;
        setRatings(newRatings);

        setTimeout(() => {
            if (activeQuestionIndex < EVALUATION_QUESTIONS.length - 1) {
                setActiveQuestionIndex(prev => prev + 1);
                setHoverRating(0);
            } else {
                setFlowStep('comment');
            }
        }, 300);
    };

    const submitAllData = async () => {
        if (ratings.some(r => r === 0)) return;

        setIsSubmittingFinal(true);

        try {
            // Get CSRF from meta tag properly
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            await axios.post('/evaluasi-sistem', {
                _token: csrfToken, // Body token often more reliable
                nama: data.name,
                no_telp: data.whatsapp,
                asal_instansi: data.institution,
                q1: ratings[0], q2: ratings[1], q3: ratings[2], q4: ratings[3], q5: ratings[4],
                masukan: feedbackComment
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            submitFormData({
                onSuccess: () => {
                    setFlowStep('success');
                    setIsSubmittingFinal(false);
                    reset();
                    setFilePermohonan(null);
                    setFileProposal(null);
                },
                onError: () => {
                    setIsSubmittingFinal(false);
                    alert('Gagal mengirim pengajuan. Namun evaluasi Anda telah tersimpan.');
                },
            });
        } catch (error: any) {
            setIsSubmittingFinal(false);
            const errMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert('Terjadi kesalahan koneksi. Detail: ' + errMsg);
        }
    };

    const getRatingLabel = (r: number) => {
        if (r === 1) return 'Kecewa ☹️';
        if (r === 2) return 'Kurang Puas 🙁';
        if (r === 3) return 'Biasa Saja 😐';
        if (r === 4) return 'Puas! 🙂';
        if (r === 5) return 'Sangat Puas! 😍';
        return 'Pilih Bintang';
    };

    const getFullUrl = (path: string | null | undefined) => {
        if (!path) return '';
        if (path.startsWith('blob:') || path.startsWith('http')) return path;
        const origin = window.location.origin;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${origin}${cleanPath}`;
    };

    const renderDetailModal = () => {
        if (!selectedDetail) return null;
        const style = getSubmissionStatusStyle(selectedDetail.status);

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
                <div className="absolute inset-0" onClick={() => setSelectedDetail(null)}></div>
                <div
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[90vh] relative z-10 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Modern & Sleek */}
                    <div className="relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative px-6 py-6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                                    <i className="fa-solid fa-file-lines text-xl text-white"></i>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span 
                                            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                                            style={{ backgroundColor: style.bg, color: style.color, borderColor: `${style.color}30` }}
                                        >
                                            {style.label}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white leading-tight truncate max-w-[200px] sm:max-w-[300px]">{selectedDetail.judul}</h3>
                                    <p className="text-white/60 text-[10px] font-medium">Diajukan {selectedDetail.tanggal}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDetail(null)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 shrink-0"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Content Area: Single Column Vertical Flow */}
                    <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 text-[13px]">
                        <div className="space-y-7">
                            
                            {/* Section: Submitter Info */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-poltekpar-primary border border-blue-100">
                                        <i className="fa-solid fa-user-tie text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Informasi Pengusul</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedDetail.nama_pengusul || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Instansi</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedDetail.instansi_mitra || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                            <p className="text-sm font-bold text-slate-900 truncate">{selectedDetail.email_pengusul || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                                            <div className="flex items-center gap-2">
                                                <i className="fa-brands fa-whatsapp text-green-500"></i>
                                                <p className="text-sm font-bold text-slate-900">{selectedDetail.no_telepon || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Needs */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                        <i className="fa-solid fa-lightbulb text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Kebutuhan PKM</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    {selectedDetail.kebutuhan || selectedDetail.ringkasan ? (
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap italic">
                                            "{selectedDetail.kebutuhan || selectedDetail.ringkasan}"
                                        </p>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4 text-slate-300">
                                            <i className="fa-solid fa-comment-slash text-2xl mb-2"></i>
                                            <p className="text-xs font-bold uppercase">Deskripsi Kosong</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Section: Locations */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                        <i className="fa-solid fa-map-pin text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lokasi Kegiatan</h4>
                                </div>
                                <div className="space-y-4">
                                    {/* Primary Location (Lokasi 1) */}
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI 1</div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                                    {[selectedDetail.kelurahan_desa, selectedDetail.kecamatan, selectedDetail.kota_kabupaten, selectedDetail.provinsi].filter(Boolean).join(', ') || '-'}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                                <i className="fa-solid fa-location-dot text-emerald-400 text-[10px] mt-1 group-hover:animate-bounce"></i>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{selectedDetail.alamat_lengkap || 'Alamat lengkap tidak tersedia'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Locations (Lokasi 2, 3, etc.) */}
                                    {(() => {
                                        try {
                                            const tambahan = (selectedDetail as any).lokasi_tambahan;
                                            if (!tambahan) return null;
                                            const parsed = typeof tambahan === 'string' ? JSON.parse(tambahan) : tambahan;
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed.map((loc, i) => (
                                                    <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                                        <div className="absolute top-0 right-0 px-3 py-1 bg-slate-400 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI {i + 2}</div>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                                                    {[loc.kelurahan_desa, loc.kecamatan, loc.kota_kabupaten, loc.provinsi].filter(Boolean).join(', ') || '-'}
                                                                </p>
                                                            </div>
                                                            <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                                                <i className="fa-solid fa-location-dot text-slate-300 text-[10px] mt-1 group-hover:text-emerald-400 transition-colors"></i>
                                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{loc.alamat_lengkap || 'Alamat lengkap tidak tersedia'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            }
                                        } catch (e) { }
                                        return null;
                                    })()}
                                </div>
                            </section>

                            {/* Section: Documents */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                        <i className="fa-solid fa-folder-open text-sm"></i>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Berkas Lampiran</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedDetail.surat_permohonan ? (
                                        <a 
                                            href={getFullUrl(selectedDetail.surat_permohonan)} 
                                            target="_blank" 
                                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-poltekpar-primary group transition-all border border-slate-100 hover:border-poltekpar-primary shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-poltekpar-primary group-hover:scale-110 transition-transform shadow-sm">
                                                    <i className="fa-solid fa-file-pdf text-lg"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight">Surat Permohonan</p>
                                                    <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Wajib</p>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                        </a>
                                    ) : (
                                        <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm">
                                                <i className="fa-solid fa-file-circle-xmark text-lg"></i>
                                            </div>
                                            <p className="text-[10px] font-bold text-red-600 uppercase">Berkas Kosong</p>
                                        </div>
                                    )}

                                    {selectedDetail.proposal && (
                                        <a 
                                            href={getFullUrl(selectedDetail.proposal)} 
                                            target="_blank" 
                                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-sky-600 group transition-all border border-slate-100 hover:border-sky-600 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform shadow-sm">
                                                    <i className="fa-solid fa-file-contract text-lg"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight">Proposal</p>
                                                    <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Pendukung</p>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                        </a>
                                    )}

                                    {/* Links (RAB / Links) */}
                                    {(() => {
                                        try {
                                            const arr = JSON.parse(selectedDetail.rab || '[]');
                                            if (Array.isArray(arr) && arr.length > 0) {
                                                return arr.map((item, i) => (
                                                    <a 
                                                        key={i}
                                                        href={item.url} 
                                                        target="_blank" 
                                                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-600 group transition-all border border-slate-100 hover:border-indigo-600 shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                                                <i className="fa-solid fa-link text-lg"></i>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[100px]">{item.name || `Tautan ${i + 1}`}</p>
                                                                <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold truncate">Eksternal</p>
                                                            </div>
                                                        </div>
                                                        <i className="fa-solid fa-external-link text-slate-300 group-hover:text-white mr-1 text-[10px]"></i>
                                                    </a>
                                                ));
                                            }
                                        } catch (e) { }
                                        return null;
                                    })()}
                                </div>
                            </section>

                            {/* Section: Catatan Admin (If any) */}
                            {selectedDetail.catatan && (
                                <section className="animate-in slide-in-from-bottom-2">
                                    <div className="bg-amber-50 border-2 border-amber-100/50 p-5 rounded-3xl relative overflow-hidden group">
                                        <div className="absolute right-[-10px] top-[-10px] text-amber-200/20 text-6xl group-hover:scale-110 transition-transform">
                                            <i className="fa-solid fa-quote-right"></i>
                                        </div>
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-700 shrink-0">
                                                <i className="fa-solid fa-comment-dots text-sm"></i>
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mb-1">Catatan Admin</h5>
                                                <p className="text-sm text-amber-900 font-bold italic leading-relaxed">{selectedDetail.catatan}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Footer: Action Bar */}
                    <div className="px-8 py-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-end gap-4 shrink-0">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {selectedDetail.status === 'direvisi' && (
                                <button
                                    onClick={() => {
                                        setSelectedDetail(null);
                                        router.visit(`/pengajuan?edit=${selectedDetail.kode_unik ?? selectedDetail.id}`);
                                    }}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-poltekpar-primary text-white text-xs font-black rounded-xl hover:bg-poltekpar-navy transition-all shadow-lg shadow-poltekpar-primary/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i> EDIT PENGAJUAN
                                </button>
                            )}
                            {selectedDetail.status === 'selesai' && selectedDetail.kode_unik && (
                                <a
                                    href={`/testimoni/${selectedDetail.kode_unik}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <i className="fa-solid fa-star"></i> ISI TESTIMONI
                                </a>
                            )}
                            <button 
                                onClick={() => setSelectedDetail(null)} 
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                            >
                                TUTUP
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStatusLogModal = () => {
        if (!selectedStatusLog) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
                <div className="absolute inset-0" onClick={() => setSelectedStatusLog(null)}></div>
                <div
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh] relative z-10 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                        <div className="px-8 py-6 text-white relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <i className="fa-solid fa-clock-rotate-left text-xl text-white"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">Lacak Status</h3>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 line-clamp-1">{selectedStatusLog.judul}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStatusLog(null)}
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                        {selectedStatusLog.logs && selectedStatusLog.logs.length > 0 ? (
                            <div className="space-y-0 pl-1">
                                {selectedStatusLog.logs.map((log, i) => {
                                    const stBaru = getSubmissionStatusStyle(log.status_baru);
                                    const stLama = log.status_lama ? getSubmissionStatusStyle(log.status_lama) : null;
                                    const isLast = i === (selectedStatusLog.logs?.length || 0) - 1;

                                    return (
                                        <div key={log.id} className="flex gap-6 pb-8 relative last:pb-0 group">
                                            {!isLast && (
                                                <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-slate-200 to-transparent group-hover:from-poltekpar-primary/30 transition-colors" />
                                            )}
                                            <div className="relative">
                                                <div
                                                    className="w-5 h-5 rounded-full shrink-0 mt-1 border-4 border-white z-10 shadow-sm relative group-hover:scale-125 transition-transform"
                                                    style={{ backgroundColor: stBaru.color }}
                                                />
                                                {i === 0 && (
                                                    <div className="absolute inset-[-4px] rounded-full bg-poltekpar-primary/10 animate-ping opacity-20" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 -mt-0.5">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    {stLama && (
                                                        <span
                                                            className="text-[9px] font-black px-2 py-0.5 rounded-md border border-slate-100 bg-white text-slate-400 uppercase tracking-wider"
                                                        >
                                                            {stLama.label}
                                                        </span>
                                                    )}
                                                    {stLama && <i className="fa-solid fa-arrow-right text-slate-300 text-[8px]"></i>}
                                                    <span
                                                        className="text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border uppercase tracking-wider"
                                                        style={{ backgroundColor: stBaru.bg, color: stBaru.color, borderColor: `${stBaru.color}20` }}
                                                    >
                                                        {stBaru.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                    <i className="fa-regular fa-calendar-check text-[10px]"></i>
                                                    <p className="text-[11px] font-bold">{log.created_at}</p>
                                                </div>
                                                {log.catatan && (
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3 relative overflow-hidden group/note hover:border-poltekpar-primary/20 transition-colors">
                                                        <div className="absolute right-[-10px] top-[-10px] text-slate-50 text-4xl group-hover/note:text-poltekpar-primary/5 transition-colors">
                                                            <i className="fa-solid fa-quote-right"></i>
                                                        </div>
                                                        <i className="fa-solid fa-comment-dots text-slate-200 mt-1 text-xs shrink-0 relative z-10"></i>
                                                        <p className="text-[12px] text-slate-600 font-medium leading-relaxed relative z-10">{log.catatan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-200 mb-4 border-4 border-white shadow-inner">
                                    <i className="fa-solid fa-timeline text-4xl"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Belum Ada Riwayat</h4>
                                <p className="text-xs text-slate-400 mt-1">Status pengajuan Anda saat ini sedang dalam antrean.</p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-5 bg-white border-t border-slate-100 shrink-0 flex justify-center">
                        <button
                            onClick={() => setSelectedStatusLog(null)}
                            className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 border border-slate-200/50 uppercase tracking-widest"
                        >
                            Selesai & Tutup
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (onlyShowStatus) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-left">
                <div className="p-6">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari judul pengajuan..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary transition-all bg-slate-50/50"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                    className="flex bg-white hover:bg-slate-50 transition-colors border border-slate-200 rounded-xl items-center shadow-sm overflow-hidden group w-full sm:w-[220px]"
                                >
                                    <div className="pl-3.5 pr-1.5 py-2 text-slate-400 group-hover:text-poltekpar-primary transition-colors flex items-center justify-center">
                                        <i className="fa-solid fa-filter text-xs"></i>
                                    </div>
                                    <div className="flex-1 text-left py-2 pl-1.5 text-[11px] font-bold text-slate-700 truncate">
                                        {sortOption === 'default' ? 'Prioritas (Revisi & Diproses)' :
                                            sortOption === 'status' ? 'Berdasarkan Status' :
                                                sortOption === 'waktu_terbaru' ? 'Waktu (Terbaru)' : 'Waktu (Terlama)'}
                                    </div>
                                    <div className={`pr-3.5 text-slate-400 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}>
                                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                                    </div>
                                </button>

                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)}></div>
                                        <div className="absolute top-11 right-0 w-full sm:w-[220px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button onClick={() => { setSortOption('default'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors ${sortOption === 'default' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-star text-amber-400 mr-2 opacity-70"></i>Prioritas (Revisi & Diproses)</button>
                                            <button onClick={() => { setSortOption('status'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'status' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-list-check text-indigo-400 mr-2 opacity-70"></i>Berdasarkan Status</button>
                                            <button onClick={() => { setSortOption('waktu_terbaru'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'waktu_terbaru' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-regular fa-clock text-sky-400 mr-2 opacity-70"></i>Waktu (Terbaru)</button>
                                            <button onClick={() => { setSortOption('waktu_terlama'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors border-t border-slate-50 ${sortOption === 'waktu_terlama' ? 'bg-poltekpar-primary/10 text-poltekpar-primary' : 'text-slate-600 hover:bg-slate-50'}`}><i className="fa-solid fa-clock-rotate-left text-slate-400 mr-2 opacity-70"></i>Waktu (Terlama)</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Nama Pengajuan</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Tanggal</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map(item => {
                                        const style = getSubmissionStatusStyle(item.status);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5 text-left">
                                                    <strong className="text-[14px] font-bold text-slate-900 block group-hover:text-poltekpar-primary transition-colors text-left">{item.judul}</strong>
                                                    <span className="text-[11px] text-slate-400 font-medium line-clamp-1 text-left">{item.ringkasan}</span>
                                                </td>
                                                <td className="px-6 py-5 text-[13px] text-slate-600 font-medium whitespace-nowrap text-left">{item.tanggal}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                                            <i className={`fa-solid ${style.icon} text-[9px]`}></i>{style.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button type="button" className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5" onClick={() => setSelectedDetail(item)}>
                                                            <i className="fa-solid fa-circle-info text-[9px]"></i> DETAIL
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="px-4 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                                                            onClick={() => setSelectedStatusLog(item)}
                                                        >
                                                            <i className="fa-solid fa-clock-rotate-left text-[9px]"></i> LACAK STATUS
                                                        </button>
                                                        {item.status === 'direvisi' && (
                                                            <button
                                                                type="button"
                                                                className="px-4 py-1.5 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                                                                onClick={() => router.visit(`/pengajuan?edit=${item.kode_unik ?? item.id}`)}
                                                            >
                                                                <i className="fa-solid fa-pen-to-square text-[9px]"></i> EDIT
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-bold italic">
                                            <div className="flex flex-col items-center gap-3">
                                                <i className="fa-solid fa-folder-open text-4xl text-slate-200"></i>
                                                {searchValue ? `Tidak ditemukan hasil untuk "${searchValue}"` : 'Belum ada riwayat pengajuan.'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="sm:hidden space-y-4">
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map(item => {
                                const style = getSubmissionStatusStyle(item.status);
                                return (
                                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight">{item.judul}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                                                    <i className="fa-solid fa-calendar text-[9px]"></i> {item.tanggal}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shrink-0 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                                <i className={`fa-solid ${style.icon} text-[8px]`}></i>{style.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl active:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                                onClick={() => setSelectedDetail(item)}
                                            >
                                                <i className="fa-solid fa-circle-info text-[10px]"></i> DETAIL
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-2 bg-sky-50 text-sky-600 text-xs font-bold rounded-xl active:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                                                onClick={() => setSelectedStatusLog(item)}
                                            >
                                                <i className="fa-solid fa-clock-rotate-left text-[10px]"></i> LACAK
                                            </button>
                                            {item.status === 'direvisi' && (
                                                <button
                                                    type="button"
                                                    className="flex-1 py-2 bg-poltekpar-primary text-white text-xs font-bold rounded-xl active:bg-poltekpar-navy transition-colors flex items-center justify-center gap-2"
                                                    onClick={() => router.visit(`/pengajuan?edit=${item.kode_unik ?? item.id}`)}
                                                >
                                                    <i className="fa-solid fa-pen-to-square text-[10px]"></i> EDIT
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-slate-400 text-xs font-bold italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <i className="fa-solid fa-folder-open text-3xl text-slate-200 mb-2 block"></i>
                                {searchValue ? `Tidak ditemukan hasil untuk "${searchValue}"` : 'Belum ada riwayat pengajuan.'}
                            </div>
                        )}
                    </div>

                    {/* Pagination Links */}
                    {pagination && pagination.links.length > 3 && (
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {pagination.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                                        link.active 
                                            ? 'bg-poltekpar-primary text-white border-poltekpar-primary shadow-md' 
                                            : !link.url 
                                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-poltekpar-primary hover:text-poltekpar-primary'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
                {renderDetailModal()}
                {renderStatusLogModal()}
            </div>
        );
    }

    const renderSubmissionTab = () => (
        <form onSubmit={handleInitialSubmit} className="p-4 space-y-8 text-left">
            {/* Notifikasi Catatan Revisi */}
            {editSubmission && editSubmission.status === 'direvisi' && editSubmission.catatan && (
                <div className="bg-amber-50 border-2 border-amber-200/50 rounded-2xl p-5 flex gap-4 items-start shadow-sm animate-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black text-amber-800 uppercase tracking-wider mb-1">Catatan Revisi dari Admin</h4>
                        <p className="text-sm text-amber-700 leading-relaxed font-bold italic">"{editSubmission.catatan}"</p>
                        <p className="text-[10px] text-amber-600/70 mt-2 font-bold uppercase tracking-widest">Silakan perbaiki data di bawah sesuai dengan catatan tersebut.</p>
                    </div>
                </div>
            )}

            <section className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2"><i className="fa-solid fa-id-card text-poltekpar-primary"></i>Identitas Pengusul</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap / Perwakilan <span className="text-red-500">*</span></label><input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Masukkan nama" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Nama Instansi / Organisasi <span className="text-red-500">*</span></label><input type="text" value={data.institution} onChange={e => setData('institution', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Nama instansi" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Email <span className="text-red-500">*</span></label><input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="email@contoh.com" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp <span className="text-red-500">*</span></label><input type="tel" value={data.whatsapp} onChange={e => setData('whatsapp', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="0812..." required /></div>
                </div>
            </section>

            <section className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2"><i className="fa-solid fa-handshake-angle text-poltekpar-primary"></i>Kebutuhan PKM</h3>
                <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Deskripsi Kebutuhan / Permintaan <span className="text-red-500">*</span></label><textarea value={data.needs} onChange={e => setData('needs', e.target.value)} rows={5} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary resize-none outline-none min-h-[120px]" placeholder="Jelaskan kebutuhan pengabdian..." required /></div>
            </section>

            <section className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2"><i className="fa-solid fa-map-location-dot text-poltekpar-primary"></i>Lokasi PKM</h3>
                </div>
                <div className="space-y-6">
                    {data.lokasi_list.map((lokasi, idx) => (
                        <div key={lokasi.id_ui} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleLocationCollapse(lokasi.id_ui)}>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {data.lokasi_list.length > 1 ? `Lokasi ${idx + 1}` : 'Lokasi'} {lokasi.kota_kabupaten ? ` - ${lokasi.kota_kabupaten}` : ''}
                                </span>
                                <div className="flex items-center gap-2">
                                    {idx > 0 && (
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setData('lokasi_list', data.lokasi_list.filter((_, i) => i !== idx)); }} className="w-8 h-8 flex justify-center items-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    )}
                                    <button type="button" className="w-8 h-8 flex justify-center items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow-sm">
                                        <i className={`fa-solid fa-chevron-${collapsedLocations[lokasi.id_ui] ? 'down' : 'up'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {!collapsedLocations[lokasi.id_ui] && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Provinsi <span className="text-red-500">*</span></label><input type="text" value={lokasi.provinsi} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].provinsi = e.target.value; setData('lokasi_list', newList); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Provinsi" required /></div>
                                        <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kota / Kabupaten <span className="text-red-500">*</span></label><input type="text" value={lokasi.kota_kabupaten} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kota_kabupaten = e.target.value; setData('lokasi_list', newList); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kota/Kabupaten" required /></div>
                                        <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kecamatan</label><input type="text" value={lokasi.kecamatan} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kecamatan = e.target.value; setData('lokasi_list', newList); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kecamatan" /></div>
                                        <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kelurahan / Desa</label><input type="text" value={lokasi.kelurahan_desa} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].kelurahan_desa = e.target.value; setData('lokasi_list', newList); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kelurahan/Desa" /></div>
                                        <div className="md:col-span-2 space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Lengkap</label><textarea value={lokasi.alamat_lengkap} onChange={e => { const newList = [...data.lokasi_list]; newList[idx].alamat_lengkap = e.target.value; setData('lokasi_list', newList); }} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary resize-none outline-none" placeholder="Detail alamat..." /></div>
                                    </div>
                                    <div className="space-y-1.5 mt-4 text-left">
                                        <label className="text-xs font-semibold text-slate-700 block mb-1">Tandai Lokasi di Peta (Koordinat)</label>
                                        <p className="text-[10px] text-slate-500 mb-2">Geser peta atau klik untuk menandai lokasi spesifik agar mempermudah tim survei.</p>
                                        <MapLocationPicker
                                            latitude={lokasi.latitude}
                                            longitude={lokasi.longitude}
                                            onChange={(lat, lng, address) => {
                                                const newList = [...data.lokasi_list];
                                                newList[idx].latitude = lat;
                                                newList[idx].longitude = lng;
                                                if (address) {
                                                    if (address.state || address.province) newList[idx].provinsi = address.state || address.province;
                                                    if (address.city || address.town || address.county) newList[idx].kota_kabupaten = address.city || address.town || address.county;
                                                    if (address.suburb || address.village) newList[idx].kecamatan = address.suburb || address.village;
                                                    if (address.neighbourhood || address.residential || address.hamlet) newList[idx].kelurahan_desa = address.neighbourhood || address.residential || address.hamlet;
                                                }
                                                setData('lokasi_list', newList);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => setData('lokasi_list', [...data.lokasi_list, { id_ui: Date.now(), provinsi: '', kota_kabupaten: '', kecamatan: '', kelurahan_desa: '', alamat_lengkap: '', latitude: null, longitude: null }])} className="w-full py-3 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary rounded-xl text-sm font-bold border border-poltekpar-primary/20 hover:border-poltekpar-primary transition-all flex justify-center items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Tambah Titik Lokasi Lainnya
                    </button>
                </div>
            </section>

            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2"><i className="fa-solid fa-link text-poltekpar-primary"></i>Tautan Dokumen</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Surat Permohonan <span className="text-red-500">*</span></label>
                            <a href="/template/surat_permohonan" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5"><i className="fa-solid fa-download"></i> Download Template</a>
                        </div>
                        <input type="file" accept=".pdf" onChange={e => setFilePermohonan(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary outline-none" required={!isEditing} />
                        {isEditing && data.surat_permohonan && !filePermohonan && (
                            <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <i className="fa-solid fa-file-pdf text-amber-500 text-sm"></i>
                                <span className="text-xs text-amber-700 font-semibold flex-1 truncate">File tersimpan saat ini</span>
                                <a href={getFullUrl(data.surat_permohonan)} target="_blank" rel="noreferrer" className="text-xs font-bold text-poltekpar-primary hover:underline flex items-center gap-1 shrink-0">
                                    <i className="fa-solid fa-eye text-[10px]"></i> Lihat
                                </a>
                            </div>
                        )}
                        {filePermohonan && filePermohonan.type === 'application/pdf' && (
                            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden h-80 bg-slate-50 relative shadow-inner flex flex-col">
                                <div className="bg-slate-800 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold z-10 shrink-0">
                                    <span>Preview Surat Permohonan</span>
                                    <a href={getFullUrl(URL.createObjectURL(filePermohonan))} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-1">
                                        <i className="fa-solid fa-external-link text-[9px]"></i> Buka Tab Baru
                                    </a>
                                </div>
                                <iframe src={URL.createObjectURL(filePermohonan)} className="w-full flex-1 relative z-20 border-0" title="Preview Surat Permohonan" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Proposal (Opsional)</label>
                            <a href="/template/proposal" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5"><i className="fa-solid fa-download"></i> Download Template</a>
                        </div>
                        <input type="file" accept=".pdf" onChange={e => setFileProposal(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary outline-none" />
                        {isEditing && data.surat_proposal && !fileProposal && (
                            <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <i className="fa-solid fa-file-pdf text-amber-500 text-sm"></i>
                                <span className="text-xs text-amber-700 font-semibold flex-1 truncate">File tersimpan saat ini</span>
                                <a href={getFullUrl(data.surat_proposal)} target="_blank" rel="noreferrer" className="text-xs font-bold text-poltekpar-primary hover:underline flex items-center gap-1 shrink-0">
                                    <i className="fa-solid fa-eye text-[10px]"></i> Lihat
                                </a>
                            </div>
                        )}
                        {fileProposal && fileProposal.type === 'application/pdf' && (
                            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden h-80 bg-slate-50 relative shadow-inner flex flex-col">
                                <div className="bg-slate-800 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold z-10 shrink-0">
                                    <span>Preview Proposal</span>
                                    <a href={getFullUrl(URL.createObjectURL(fileProposal))} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 flex items-center gap-1">
                                        <i className="fa-solid fa-external-link text-[9px]"></i> Buka Tab Baru
                                    </a>
                                </div>
                                <iframe src={URL.createObjectURL(fileProposal)} className="w-full flex-1 relative z-20 border-0" title="Preview Proposal" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <button type="submit" disabled={isMockSubmitting} className="w-full py-3.5 bg-poltekpar-primary hover:bg-poltekpar-navy text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                {isMockSubmitting ? <><i className="fa-solid fa-spinner fa-spin"></i>Mengirim...</> : isEditing ? <><i className="fa-solid fa-pen-to-square"></i>Perbarui Pengajuan</> : <><i className="fa-solid fa-paper-plane"></i>Lanjut Ke Evaluasi & Submit</>}
            </button>
        </form>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-md"><i className="fa-solid fa-file-signature text-lg"></i></div>
                <div><h3 className="text-base font-bold text-slate-900 text-left">Akses Pengajuan PKM</h3><p className="text-sm text-slate-500 mt-0.5 text-left">Formulir pengajuan untuk masyarakat</p></div>
            </div>
            {!hideMainTabNav && (
                <div className="flex border-b border-slate-100">
                    <button type="button" onClick={() => setMainTab('pengajuan')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === 'pengajuan' ? 'text-poltekpar-primary border-b-2 border-poltekpar-primary' : 'text-slate-500 hover:text-slate-700'}`}>Pengajuan</button>
                    <button type="button" onClick={() => setMainTab('arsip')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === 'arsip' ? 'text-poltekpar-primary border-b-2 border-poltekpar-primary' : 'text-slate-500 hover:text-slate-700'}`}>Arsip</button>
                </div>
            )}
            {!hideMainTabNav && mainTab === 'arsip' ? null : renderSubmissionTab()}
            <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
            {renderDetailModal()}

            {showFeedbackFlow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 relative">
                        <button
                            type="button"
                            onClick={() => setShowFeedbackFlow(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all z-10"
                            disabled={isSubmittingFinal}
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>

                        {flowStep === 'rating' && (
                            <div className="p-6 sm:p-10 text-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wajib Isi Evaluasi</span>
                                    <span className="text-[10px] font-black text-poltekpar-primary bg-blue-50 px-2 py-1 rounded-lg">Pertanyaan {activeQuestionIndex + 1}/{EVALUATION_QUESTIONS.length}</span>
                                </div>

                                <div className="min-h-[100px] flex items-center justify-center">
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                                        {EVALUATION_QUESTIONS[activeQuestionIndex]}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => handleRatingClick(star)}
                                                className={`transition-all transform hover:scale-125 active:scale-95 ${ratings[activeQuestionIndex] >= star ? 'scale-110' : ''}`}
                                            >
                                                <i className={`fa-solid fa-star text-4xl ${(hoverRating || ratings[activeQuestionIndex]) >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-200'}`}></i>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-sm font-black text-poltekpar-primary h-5 uppercase tracking-wider">
                                        {(hoverRating || ratings[activeQuestionIndex]) > 0 ? getRatingLabel(hoverRating || ratings[activeQuestionIndex]) : ''}
                                    </div>
                                </div>

                                <p className="text-slate-400 text-[10px] font-bold mt-4 uppercase tracking-widest">
                                    Klik bintang untuk lanjut
                                </p>
                            </div>
                        )}

                        {flowStep === 'comment' && (
                            <div className="p-6 sm:p-10 text-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Satu langkah lagi!</h3>
                                    <p className="text-slate-500 mt-2 font-medium">Ada saran atau masukan tambahan untuk sistem SIGAPPA?</p>
                                </div>

                                <div className="space-y-3">
                                    <textarea
                                        placeholder="Tulis masukan Anda di sini (Opsional)"
                                        value={feedbackComment}
                                        onChange={e => setFeedbackComment(e.target.value)}
                                        disabled={isSubmittingFinal}
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary/30 outline-none resize-none min-h-[120px] transition-all disabled:opacity-60"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFlowStep('rating')}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitAllData}
                                        disabled={isSubmittingFinal}
                                        className="flex-[2] py-4 bg-poltekpar-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-poltekpar-primary/30 hover:bg-poltekpar-navy transition-all disabled:opacity-50"
                                    >
                                        {isSubmittingFinal ? 'Memproses Data...' : 'SUBMIT PENGAJUAN'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {flowStep === 'success' && (
                            <div className="p-10">
                                <SuccessView
                                    title="Selesai! Berhasil Terkirim"
                                    description="Terima kasih atas evaluasi dan pengajuan PKM Anda. Tim kami akan segera memproses berkas Anda."
                                    buttonLabel="Lihat Status Pengajuan"
                                    onButtonClick={() => { window.location.href = '/cek-status'; }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
