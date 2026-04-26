import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
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
} from 'lucide-react';
import PkmMapDashboardCard from '../../Components/PkmMapDashboardCard';
import { PkmData } from '../../types';
import '../../../css/landing.css';

interface DashboardProps {
    stats: {
        totalPengajuan: number;
        pengajuanDiproses: number;
        pengajuanBaru: number;
        pengajuanReviu: number;
        pengajuanDiterima: number;
        pengajuanDitolak: number;
        pengajuanDirevisi: number;
        aktivitasBelumMulai: number;
        aktivitasBerjalan: number;
        aktivitasSelesai: number;
    };
    recentPengajuan: any[];
    pkmMapData: any[];
    pieChartData: any[];
    barChartData: any;
}

export default function Dashboard({
    stats = {
        totalPengajuan: 0,
        pengajuanDiproses: 0,
        pengajuanBaru: 0,
        pengajuanReviu: 0,
        pengajuanDiterima: 0,
        pengajuanDitolak: 0,
        pengajuanDirevisi: 0,
        aktivitasBelumMulai: 0,
        aktivitasBerjalan: 0,
        aktivitasSelesai: 0,
    },
    pkmMapData = [],
}: DashboardProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <AdminLayout title="Overview">
                <div className="flex min-h-[240px] items-center justify-center">
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-poltekpar-primary" />
                        <span className="text-sm font-semibold text-slate-600">Memuat dashboard</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const pengajuanCards = [
        { label: 'Pengajuan', value: stats.pengajuanBaru, icon: FileText, color: 'text-poltekpar-primary', bg: 'bg-poltekpar-primary/10', iconBg: 'bg-poltekpar-primary', trend: 'Membutuhkan tindakan', filter: 'pengajuan' },
        { label: 'Reviu', value: stats.pengajuanReviu, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-500', trend: 'Sedang direviu', filter: 'reviu' },
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
        const url = type === 'pengajuan' ? '/admin/pengajuan' : '/admin/aktivitas';
        router.get(url, params, { preserveState: true });
    };

    const pkmData = pkmMapData.map((pkm: any) => ({
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
    }));

    return (
        <AdminLayout title="System Overview">
            {/* Pengajuan Stats */}
            <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Pengajuan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
        </AdminLayout>
    );
}
