import React from 'react';
import { router } from '@inertiajs/react';
import DirekturLayout from '../../Layouts/DirekturLayout';
import { CheckCircle, Clock, FileText, ThumbsDown, ThumbsUp } from 'lucide-react';

interface PengajuanItem {
    id_pengajuan: number;
    judul_kegiatan: string;
    nama_pengusul: string;
    jenis_pkm: string;
    warna_jenis: string;
    created_at: string;
    direktur_approved_at: string | null;
}

interface Stats {
    total: number;
    approved: number;
    waiting: number;
}

interface Props {
    pengajuanList: PengajuanItem[];
    stats: Stats;
}

export default function DirekturDashboard({ pengajuanList, stats }: Props) {
    const handleApprove = (id: number) => {
        router.post(`/direktur/pengajuan/${id}/approve`, {}, { preserveScroll: true });
    };

    const handleDecline = (id: number) => {
        router.post(`/direktur/pengajuan/${id}/decline`, {}, { preserveScroll: true });
    };

    const waiting = pengajuanList.filter(p => !p.direktur_approved_at);
    const approved = pengajuanList.filter(p => p.direktur_approved_at);

    return (
        <DirekturLayout title="Dashboard Persetujuan Direktur">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard
                    icon={<FileText size={20} className="text-blue-500" />}
                    label="Total Masuk"
                    value={stats.total}
                    bg="bg-blue-50"
                />
                <StatCard
                    icon={<Clock size={20} className="text-amber-500" />}
                    label="Menunggu Persetujuan"
                    value={stats.waiting}
                    bg="bg-amber-50"
                />
                <StatCard
                    icon={<CheckCircle size={20} className="text-emerald-500" />}
                    label="Sudah Disetujui"
                    value={stats.approved}
                    bg="bg-emerald-50"
                />
            </div>

            {/* Waiting for approval */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-zinc-700 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" />
                    Menunggu Persetujuan
                    {waiting.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                            {waiting.length}
                        </span>
                    )}
                </h2>

                {waiting.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-100 px-6 py-10 text-center">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                        <p className="text-sm text-zinc-500">Semua pengajuan sudah disetujui atau belum ada yang masuk.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {waiting.map(p => (
                            <PengajuanCard
                                key={p.id_pengajuan}
                                item={p}
                                onApprove={() => handleApprove(p.id_pengajuan)}
                                onDecline={null}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Already approved */}
            {approved.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-zinc-700 mb-4 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-500" />
                        Sudah Disetujui (menunggu tindakan admin)
                    </h2>
                    <div className="space-y-3">
                        {approved.map(p => (
                            <PengajuanCard
                                key={p.id_pengajuan}
                                item={p}
                                onApprove={null}
                                onDecline={() => handleDecline(p.id_pengajuan)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </DirekturLayout>
    );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
    return (
        <div className="bg-white rounded-xl border border-zinc-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-zinc-800">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function PengajuanCard({
    item,
    onApprove,
    onDecline,
}: {
    item: PengajuanItem;
    onApprove: (() => void) | null;
    onDecline: (() => void) | null;
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-100 px-5 py-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.warna_jenis }}
                />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{item.judul_kegiatan}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {item.nama_pengusul} &middot; <span style={{ color: item.warna_jenis }}>{item.jenis_pkm}</span> &middot; {item.created_at}
                    </p>
                    {item.direktur_approved_at && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1">
                            ✓ Disetujui {item.direktur_approved_at}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {onApprove && (
                    <button
                        onClick={onApprove}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                        <ThumbsUp size={13} />
                        Setuju
                    </button>
                )}
                {onDecline && (
                    <button
                        onClick={onDecline}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <ThumbsDown size={13} />
                        Tarik Persetujuan
                    </button>
                )}
            </div>
        </div>
    );
}
