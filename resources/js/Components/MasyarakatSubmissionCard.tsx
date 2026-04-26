import React, { useRef, useState, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import ActionFeedbackDialog from './ActionFeedbackDialog';
import MapLocationPicker from './MapLocationPicker';
import DocumentationGallery from './DocumentationGallery';
import TestimonialSidebarDisplay from './TestimonialSidebarDisplay';
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
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    kelurahan_desa: string;
    alamat_lengkap: string;
    latitude: number | null;
    longitude: number | null;
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
}: MasyarakatSubmissionCardProps) {
    const [mainTab, setMainTab] = useState('pengajuan');
    const [selectedDetail, setSelectedDetail] = useState<Submission | null>(null);
    const [isMockSubmitting, setIsMockSubmitting] = useState(false);
    
    const [feedbackDialog, setFeedbackDialog] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ show: false, type: 'success', title: '', message: '' });
    const [sortOption, setSortOption] = useState<'default' | 'status' | 'waktu_terbaru' | 'waktu_terlama'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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
        provinsi: '',
        kota_kabupaten: '',
        kecamatan: '',
        kelurahan_desa: '',
        alamat_lengkap: '',
        latitude: null,
        longitude: null,
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
        } catch {}

        setData({
            name: editSubmission.nama_pengusul || '',
            institution: editSubmission.instansi_mitra || '',
            email: editSubmission.email_pengusul || '',
            whatsapp: editSubmission.no_telepon || '',
            needs: editSubmission.kebutuhan || editSubmission.ringkasan || '',
            provinsi: editSubmission.provinsi || '',
            kota_kabupaten: editSubmission.kota_kabupaten || '',
            kecamatan: editSubmission.kecamatan || '',
            kelurahan_desa: editSubmission.kelurahan_desa || '',
            alamat_lengkap: editSubmission.alamat_lengkap || '',
            latitude: editSubmission.latitude ? Number(editSubmission.latitude) : null,
            longitude: editSubmission.longitude ? Number(editSubmission.longitude) : null,
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
        formData.append('provinsi', data.provinsi);
        formData.append('kota_kabupaten', data.kota_kabupaten);
        formData.append('kecamatan', data.kecamatan);
        formData.append('kelurahan_desa', data.kelurahan_desa);
        formData.append('alamat_lengkap', data.alamat_lengkap);
        if (data.latitude) formData.append('latitude', data.latitude.toString());
        if (data.longitude) formData.append('longitude', data.longitude.toString());
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
        if (!data.name.trim() || !data.institution.trim() || !data.needs.trim() || (!filePermohonan && !isEditing)) {
            setFeedbackDialog({ show: true, type: 'error', title: 'Form Belum Lengkap', message: 'Mohon lengkapi identitas, kebutuhan, dan dokumen wajib.' });
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
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await axios.post('/evaluasi-sistem', {
                nama: data.name,
                no_telp: data.whatsapp,
                asal_instansi: data.institution,
                q1: ratings[0], q2: ratings[1], q3: ratings[2], q4: ratings[3], q5: ratings[4],
                masukan: feedbackComment
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || ''
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
        } catch (error) {
            setIsSubmittingFinal(false);
            alert('Terjadi kesalahan koneksi. Silakan coba lagi.');
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
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 text-left">
                <div className="absolute inset-0" onClick={() => setSelectedDetail(null)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-poltekpar-primary text-white flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-file-contract text-lg"></i>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{selectedDetail.judul}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{selectedDetail.tanggal}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col items-center p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Pengajuan</span>
                            <div className="px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm" style={{ backgroundColor: style.bg, color: style.color }}>
                                <i className={`fa-solid ${style.icon}`}></i>
                                {style.label}
                            </div>
                        </div>

                        <div className="flex flex-col gap-10 text-left max-w-xl mx-auto">
                            <section>
                                <h4 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-poltekpar-primary"></div>
                                    Identitas Pengusul
                                </h4>
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Nama Lengkap / Perwakilan</span>
                                        <span className="text-slate-900 font-bold text-[16px] leading-tight">{selectedDetail.nama_pengusul || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Nama Instansi / Organisasi</span>
                                        <span className="text-slate-900 font-semibold text-sm">{selectedDetail.instansi_mitra || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Email</span>
                                            <span className="text-slate-900 font-semibold text-sm">{selectedDetail.email_pengusul || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">WhatsApp</span>
                                            <span className="text-slate-900 font-semibold text-sm">{selectedDetail.no_telepon || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-poltekpar-primary"></div>
                                    Kebutuhan PKM
                                </h4>
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 leading-relaxed font-medium">
                                    {selectedDetail.kebutuhan || selectedDetail.ringkasan ? (
                                        <span className="italic">"{selectedDetail.kebutuhan || selectedDetail.ringkasan}"</span>
                                    ) : (
                                        <span className="text-slate-400 italic">Tidak ada deskripsi kebutuhan</span>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-poltekpar-primary"></div>
                                    Lokasi PKM
                                </h4>
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100/60">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Provinsi</span>
                                            <span className="text-slate-900 font-bold text-sm">{selectedDetail.provinsi || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100/60">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Kota / Kabupaten</span>
                                            <span className="text-slate-900 font-bold text-sm">{selectedDetail.kota_kabupaten || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100/60">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Kecamatan</span>
                                            <span className="text-slate-900 font-bold text-sm">{selectedDetail.kecamatan || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100/60">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Kelurahan / Desa</span>
                                            <span className="text-slate-900 font-bold text-sm">{selectedDetail.kelurahan_desa || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-1.5">Alamat Lengkap</span>
                                        <span className="text-slate-900 font-semibold text-sm leading-relaxed block">{selectedDetail.alamat_lengkap || '-'}</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-poltekpar-primary"></div>
                                    Tautan Dokumen
                                </h4>
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-5">
                                    <div className="flex flex-wrap gap-3">
                                        {selectedDetail.surat_permohonan ? (
                                            <a href={getFullUrl(selectedDetail.surat_permohonan)} target="_blank" className="px-5 py-2.5 bg-white hover:bg-poltekpar-primary hover:text-white text-slate-700 text-[11px] font-extrabold rounded-xl transition-all border border-slate-200 shadow-sm flex items-center gap-2 group">
                                                <i className="fa-solid fa-file-contract text-poltekpar-primary group-hover:text-white"></i>
                                                SURAT PERMOHONAN
                                            </a>
                                        ) : (
                                            <span className="text-[13px] text-slate-400 font-medium flex items-center gap-2 px-1">
                                                <i className="fa-solid fa-triangle-exclamation text-amber-500 text-sm"></i>
                                                Surat Permohonan Kosong
                                            </span>
                                        )}
                                        {selectedDetail.proposal && (
                                            <a href={getFullUrl(selectedDetail.proposal)} target="_blank" className="px-5 py-2.5 bg-white hover:bg-poltekpar-primary hover:text-white text-slate-700 text-[11px] font-extrabold rounded-xl transition-all border border-slate-200 shadow-sm flex items-center gap-2 group">
                                                <i className="fa-solid fa-file-pdf text-poltekpar-primary group-hover:text-white"></i>
                                                PROPOSAL
                                            </a>
                                        )}
                                    </div>
                                    {selectedDetail.rab && (
                                        <div className="space-y-3 pt-4 border-t border-slate-200">
                                            {(() => {
                                                try {
                                                    const arr = JSON.parse(selectedDetail.rab);
                                                    if (Array.isArray(arr) && arr.length > 0) {
                                                        return arr.map((item, i) => (
                                                            <div key={i} className="text-[13px] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider block mb-1">{item.name || `Tautan Tambahan ${i + 1}`}</span>
                                                                <a href={item.url} target="_blank" className="text-poltekpar-primary font-bold hover:underline break-all flex items-center gap-2">
                                                                    <i className="fa-solid fa-link text-[10px]"></i>
                                                                    Buka Tautan
                                                                </a>
                                                            </div>
                                                        ));
                                                    }
                                                } catch(e) {}
                                                return null;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {selectedDetail.catatan && (
                                <section className="pt-2">
                                    <h4 className="text-[12px] font-extrabold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-comment-dots"></i> Catatan Admin
                                    </h4>
                                    <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/60 shadow-sm">
                                        <p className="text-[15px] text-amber-900 font-medium italic leading-relaxed">{selectedDetail.catatan}</p>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                        {selectedDetail.status === 'direvisi' && (
                            <button
                                onClick={() => {
                                    setSelectedDetail(null);
                                    router.visit(`/pengajuan?edit=${selectedDetail.kode_unik ?? selectedDetail.id}`);
                                }}
                                className="px-6 py-2 bg-poltekpar-primary text-white text-sm font-bold rounded-xl hover:bg-poltekpar-primary/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <i className="fa-solid fa-pen-to-square"></i> Edit Pengajuan
                            </button>
                        )}
                        {selectedDetail.status === 'selesai' && selectedDetail.kode_unik && (
                            <a
                                href={`/testimoni/${selectedDetail.kode_unik}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <i className="fa-solid fa-star"></i> Isi Testimoni
                            </a>
                        )}
                        <button onClick={() => setSelectedDetail(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Tutup</button>
                    </div>
                </div>
            </div>
        );
    };

    if (onlyShowStatus) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-left">
                <div className="p-6">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900 border-l-4 border-poltekpar-primary pl-3">Daftar Riwayat Pengajuan</h3>
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
                    <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Nama Pengajuan</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">Tanggal</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
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
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button type="button" className="px-4 py-1.5 bg-slate-100 hover:bg-poltekpar-primary hover:text-white text-slate-600 text-[11px] font-bold rounded-lg transition-all" onClick={() => setSelectedDetail(item)}>DETAIL</button>
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
                                                Belum ada riwayat pengajuan.
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
                                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl active:bg-slate-100 transition-colors"
                                                onClick={() => setSelectedDetail(item)}
                                            >
                                                DETAIL
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
                                Belum ada riwayat pengajuan.
                            </div>
                        )}
                    </div>
                </div>
                <ActionFeedbackDialog show={feedbackDialog.show} type={feedbackDialog.type} title={feedbackDialog.title} message={feedbackDialog.message} onClose={() => setFeedbackDialog({ ...feedbackDialog, show: false })} />
                {renderDetailModal()}
            </div>
        );
    }

    const renderSubmissionTab = () => (
        <form onSubmit={handleInitialSubmit} className="p-6 space-y-8 text-left">
            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-id-card text-poltekpar-primary"></i>Identitas Pengusul</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap / Perwakilan <span className="text-red-500">*</span></label><input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Masukkan nama" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Nama Instansi / Organisasi <span className="text-red-500">*</span></label><input type="text" value={data.institution} onChange={e => setData('institution', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Nama instansi" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Email <span className="text-red-500">*</span></label><input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="email@contoh.com" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp <span className="text-red-500">*</span></label><input type="tel" value={data.whatsapp} onChange={e => setData('whatsapp', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="0812..." required /></div>
                </div>
            </section>

            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-handshake-angle text-poltekpar-primary"></i>Kebutuhan PKM</h3>
                <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Deskripsi Kebutuhan / Permintaan <span className="text-red-500">*</span></label><textarea value={data.needs} onChange={e => setData('needs', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary resize-none outline-none" placeholder="Jelaskan kebutuhan pengabdian..." required /></div>
            </section>

            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-map-location-dot text-poltekpar-primary"></i>Lokasi PKM</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Provinsi <span className="text-red-500">*</span></label><input type="text" value={data.provinsi} onChange={e => setData('provinsi', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Provinsi" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kota / Kabupaten <span className="text-red-500">*</span></label><input type="text" value={data.kota_kabupaten} onChange={e => setData('kota_kabupaten', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kota/Kabupaten" required /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kecamatan</label><input type="text" value={data.kecamatan} onChange={e => setData('kecamatan', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kecamatan" /></div>
                    <div className="space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Kelurahan / Desa</label><input type="text" value={data.kelurahan_desa} onChange={e => setData('kelurahan_desa', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary outline-none" placeholder="Kelurahan/Desa" /></div>
                    <div className="md:col-span-2 space-y-1.5 text-left"><label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Lengkap</label><textarea value={data.alamat_lengkap} onChange={e => setData('alamat_lengkap', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary resize-none outline-none" placeholder="Detail alamat..." /></div>
                </div>
                <div className="space-y-1.5 mt-4 text-left">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tandai Lokasi di Peta (Koordinat)</label>
                    <p className="text-[10px] text-slate-500 mb-2">Geser peta atau klik untuk menandai lokasi spesifik agar mempermudah tim survei.</p>
                    <MapLocationPicker
                        latitude={data.latitude}
                        longitude={data.longitude}
                        onChange={(lat, lng, address) => {
                            const newData: any = { latitude: lat, longitude: lng };
                            if (address) {
                                if (address.state || address.province) newData.provinsi = address.state || address.province;
                                if (address.city || address.town || address.county) newData.kota_kabupaten = address.city || address.town || address.county;
                                if (address.suburb || address.village) newData.kecamatan = address.suburb || address.village;
                                if (address.neighbourhood || address.residential || address.hamlet) newData.kelurahan_desa = address.neighbourhood || address.residential || address.hamlet;
                            }
                            Object.entries(newData).forEach(([key, val]) => setData(key as any, val as any));
                        }}
                    />
                </div>
            </section>

            <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-link text-poltekpar-primary"></i>Tautan Dokumen</h3>
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
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
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
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary/30 outline-none resize-none min-h-[120px] transition-all"
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
                            <div className="p-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <i className="fa-solid fa-check-double text-4xl animate-bounce"></i>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Selesai! Berhasil Terkirim</h3>
                                    <p className="text-slate-500 mt-2 font-medium">Terima kasih atas evaluasi dan pengajuan PKM Anda. Tim kami akan segera memproses berkas Anda.</p>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => { window.location.href = '/cek-status'; }}
                                        className="w-full py-4 bg-poltekpar-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-poltekpar-primary/30 hover:bg-poltekpar-navy transition-all"
                                    >
                                        Lihat Status Pengajuan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
