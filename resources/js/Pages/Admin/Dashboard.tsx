import React from 'react';
import { router, usePage, Deferred } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    RotateCcw,
    TrendingUp,
    Play,
    Zap,
    Trophy,
    AlertCircle,
    ArrowRight,
    UserCheck,
} from 'lucide-react';
import PkmMapDashboardCard from '@/Components/map/PkmMapDashboardCard';
import { PkmData } from '../../types';
import '../../../css/landing.css';
import { Skeleton } from '@/Components/ui/Skeleton';
import { SkeletonChart } from '@/Components/ui/SkeletonChart';

interface DashboardProps {
    stats: {
        totalPengajuan: number;
        pengajuanDiproses: number;
        pengajuanBaru: number;
        pengajuanReviu: number;
        pengajuanDiajukan: number;
        pengajuanDiterima: number;
        pengajuanDitolak: number;
        pengajuanDirevisi: number;
        aktivitasBelumMulai: number;
        aktivitasBerjalan: number;
        aktivitasSelesai: number;
    };
    recentPengajuan?: any[];
    pkmMapData?: any[];
    pieChartData?: any[];
    barChartData?: any;
}

export default function Dashboard({
    stats = {
        totalPengajuan: 0,
        pengajuanDiproses: 0,
        pengajuanBaru: 0,
        pengajuanReviu: 0,
        pengajuanDiajukan: 0,
        pengajuanDiterima: 0,
        pengajuanDitolak: 0,
        pengajuanDirevisi: 0,
        aktivitasBelumMulai: 0,
        aktivitasBerjalan: 0,
        aktivitasSelesai: 0,
    },
    recentPengajuan = [],
    pkmMapData = [],
}: DashboardProps) {
    const { auth }: any = usePage().props;
    const isDirektur = auth.user.role === 'direktur';

    const pengajuanCards = [
        { label: 'Pengajuan', value: stats.pengajuanBaru, icon: FileText, color: 'text-poltekpar-primary', bg: 'bg-poltekpar-primary/10', iconBg: 'bg-poltekpar-primary', trend: 'Membutuhkan tindakan', filter: 'pengajuan' },
        { label: 'Reviu', value: stats.pengajuanReviu, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-500', trend: 'Sedang direviu', filter: 'reviu' },
        { label: 'Menunggu Pimpinan', value: stats.pengajuanDiajukan, icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-500', trend: 'Menunggu verifikasi', filter: 'diajukan' },
        { label: 'Diterima', value: stats.pengajuanDiterima, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', trend: 'Sudah disetujui', filter: 'diterima' },
        { label: 'Ditolak', value: stats.pengajuanDitolak, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', iconBg: 'bg-rose-500', trend: 'Tidak memenuhi syarat', filter: 'ditolak' },
        { label: 'Revisi', value: stats.pengajuanDirevisi, icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-500', trend: 'Menunggu perbaikan', filter: 'direvisi' },
    ];

    const aktivitasCards = [
        { label: 'Belum Mulai', value: stats.aktivitasBelumMulai, icon: Play, color: 'text-zinc-600', bg: 'bg-zinc-100', iconBg: 'bg-zinc-500', trend: 'Menunggu waktu pelaksanaan', filter: 'belum_mulai' },
        { label: 'Berjalan', value: stats.aktivitasBerjalan, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-500', trend: 'Sedang dalam pengerjaan', filter: 'berjalan' },
        { label: 'Selesai', value: stats.aktivitasSelesai, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-500', trend: 'Proyek telah dirampungkan', filter: 'selesai' },
    ];

    const handleCardClick = (type: 'pengajuan' | 'aktivitas', filterParam?: string) => {
        const params: Record<string, string | undefined> = {};
        if (filterParam) {
            if (type === 'pengajuan') {
                params.tab = filterParam;
            } else {
                params.status = filterParam;
            }
        }

        // Direktur uses the same pengajuan list but filtered
        const url = type === 'pengajuan' ? '/admin/pengajuan' : '/admin/aktivitas';
        router.get(url, params, { preserveState: true });
    };

    const pkmData = pkmMapData ? pkmMapData.map((pkm: any) => ({
        id: pkm.id,
        nama: pkm.nama,
        tahun: pkm.tahun,
        status: pkm.status,
        is_review: Boolean(pkm.is_review),
        deskripsi: pkm.deskripsi || '',
        thumbnail: pkm.thumbnail || null,
        jenis_pkm: pkm.jenis_pkm || pkm.jenis_nama || '',
        warna_icon: pkm.warna_icon || '',
        provinsi: pkm.provinsi || '',
        kabupaten: pkm.kabupaten || '',
        kecamatan: pkm.kecamatan || '',
        desa: pkm.desa || '',
        lat: pkm.lat,
        lng: pkm.lng,
        total_anggaran: Number(pkm.total_anggaran || 0),
        tim_kegiatan: pkm.tim_kegiatan || [],
        testimoni: pkm.testimoni || [],
        arsip_laporan: pkm.arsip_laporan || null,
        dokumentasi: pkm.dokumentasi || null,
        tambahan: pkm.tambahan || [],
        lokasi_tambahan: pkm.lokasi_tambahan || [],
    })) : [];

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Direktur Notification Banner */}
            {isDirektur && stats.pengajuanDiajukan > 0 && (
                <div className="mb-8 relative overflow-hidden group">
                    {/* Gradient background using Poltekpar colors */}
                    <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-navy to-poltekpar-primary opacity-95 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    {/* Accent circle using Poltekpar gold */}
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-poltekpar-gold/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 px-6 pt-8 pb-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shrink-0">
                                <AlertCircle className="text-white" size={24} />
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
                                    {stats.pengajuanDiajukan} Pengajuan Menunggu Verifikasi
                                </h2>
                                <p className="text-white/80 text-sm font-medium">
                                    Daftar pengajuan berikut memerlukan segera persetujuan atau revisi Anda.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 px-6 pb-8 sm:px-10 pt-2">
                        <Deferred data="recentPengajuan" fallback={
                            <div className="flex flex-col gap-3">
                                <Skeleton className="h-[72px] w-full rounded-xl" />
                                <Skeleton className="h-[72px] w-full rounded-xl" />
                                <Skeleton className="h-[72px] w-full rounded-xl" />
                            </div>
                        }>
                            <div className="flex flex-col gap-3">
                                {recentPengajuan?.slice(0, 3).map((item: any) => (
                                    <button
                                        key={item.id_pengajuan}
                                        onClick={() => router.visit(`/admin/pengajuan/${item.id_pengajuan}`)}
                                        className="w-full bg-white hover:bg-slate-50 rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/10 flex items-center justify-between group/card"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="text-slate-900 font-black text-sm sm:text-[15px] group-hover/card:text-poltekpar-primary transition-colors truncate">
                                                {item.judul_kegiatan}
                                            </div>
                                            <div className="text-slate-500 text-[11px] sm:text-[12px] mt-1 flex items-center gap-2 font-medium">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.jenis_pkm?.nama_jenis || 'PKM'}</span>
                                                <span>{item.nama_pengusul}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{item.created_at}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 bg-poltekpar-primary opacity-90 text-white text-[11px] font-black px-4 py-2 rounded-lg flex items-center gap-2 group-hover/card:opacity-100 group-hover/card:shadow-lg shadow-poltekpar-primary/20 transition-all">
                                            Tinjau <ArrowRight size={14} className="hidden sm:block" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {stats.pengajuanDiajukan > 3 && (
                                <button
                                    onClick={() => handleCardClick('pengajuan', 'diajukan')}
                                    className="mt-4 w-full py-3 bg-white text-poltekpar-primary hover:bg-slate-50 rounded-xl text-[12px] font-black tracking-widest uppercase transition-all flex flex-col sm:flex-row items-center justify-center gap-2 shadow-md shadow-black/5"
                                >
                                    <span>Lihat {stats.pengajuanDiajukan - 3} Pengajuan Lainnya</span>
                                    <ArrowRight size={14} />
                                </button>
                            )}
                            {stats.pengajuanDiajukan <= 3 && recentPengajuan?.length === 0 && (
                                <div className="py-4 text-white/50 text-center text-sm font-medium">
                                    Data belum ada.
                                </div>
                            )}
                        </Deferred>
                    </div>
                </div>
            )}

            {/* Pengajuan Stats */}
            <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Pengajuan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {pengajuanCards.map((card, index) => (
                        <button
                            key={index}
                            onClick={() => handleCardClick('pengajuan', card.filter)}
                            className="group bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-poltekpar-primary/5 transition-all duration-300 flex flex-col relative overflow-hidden cursor-pointer active:scale-[0.98] text-left w-full"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
                            <div className="flex items-center justify-between relative z-10 mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-lg shadow-inherit`}>
                                    <card.icon size={20} />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{card.value}</h3>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[12px] font-extrabold text-slate-500 mb-0.5 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-[10px] font-bold ${card.color} opacity-80 flex items-center gap-1`}>
                                    <TrendingUp size={10} />
                                    {card.trend}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Aktivitas Stats */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Aktivitas PKM</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {aktivitasCards.map((card, index) => (
                        <button
                            key={index}
                            onClick={() => handleCardClick('aktivitas', card.filter)}
                            className="group bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-poltekpar-primary/5 transition-all duration-300 flex flex-col relative overflow-hidden cursor-pointer active:scale-[0.98] text-left w-full"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
                            <div className="flex items-center justify-between relative z-10 mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-lg shadow-inherit`}>
                                    <card.icon size={20} />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{card.value}</h3>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[12px] font-extrabold text-slate-500 mb-0.5 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-[10px] font-bold ${card.color} opacity-80 flex items-center gap-1`}>
                                    <TrendingUp size={10} />
                                    {card.trend}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Map + Chart */}
            <PkmMapDashboardCard pkmData={pkmData} watchKey="admin-map" isAdmin={true} />
        </div>
    );
}

(Dashboard as any).layout = (page: React.ReactNode) => <AdminLayout title="System Overview">{page}</AdminLayout>;
