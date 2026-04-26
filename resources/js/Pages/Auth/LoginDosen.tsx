import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/Layouts/DefaultLayout';
import LoginDosenMobile from '@/Components/LoginDosenMobile';
import PkmMapDashboardCard from '@/Components/PkmMapDashboardCard';
import { resolveUserPkmData, resolveUserSubmissionData, resolveUserSubmissionHistory } from '@/data/sigapData';
import { PkmData } from '@/types';
import '../../../css/landing.css';
import '../../../css/lecturer-form.css';

interface PengajuanData {
    id: number;
    judul: string;
    ringkasan: string;
    tanggal: string;
    status: string;
}

interface LoginDosenProps {
    pkmData?: PkmData[] | null;
    userPkmData?: PkmData[] | null;
    userSubmissionData?: PengajuanData[] | null;
    userSubmissionHistory?: PengajuanData[] | null;
}

interface SubmissionData extends PengajuanData {
    status: string;
}

const createPengajuanDateLabel = (): string => (
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
);

export default function LoginDosen({
    pkmData: serverPkmData = null,
    userPkmData = null,
    userSubmissionData = null,
    userSubmissionHistory = null,
}: LoginDosenProps): JSX.Element {
    const [isMobileViewport, setIsMobileViewport] = useState(() => (
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
    ));
    const [pkmData] = useState<PkmData[]>(() => resolveUserPkmData(userPkmData ?? serverPkmData));
    const [pengajuanData, setPengajuanData] = useState<SubmissionData[]>(() => resolveUserSubmissionData(userSubmissionData, { role: 'dosen' }));
    const [submissionHistoryData] = useState<PengajuanData[]>(() => resolveUserSubmissionHistory(userSubmissionHistory, 'dosen'));

    const latestPengajuan = pengajuanData[0] ?? null;
    const hasSubmissionHistory = pengajuanData.length > 0;
    const pengajuanHref = '/pengajuan?role=dosen&view=form';
    const cekStatusHref = hasSubmissionHistory ? '/pengajuan?role=dosen&view=status' : pengajuanHref;
    const currentSubmissionStatus = latestPengajuan?.status ?? 'belum_diajukan';
    const currentPkmStatusData = ['berlangsung', 'selesai'].includes(currentSubmissionStatus)
        ? pkmData.find((item) => item.status === currentSubmissionStatus) ?? null
        : null;

    const handleUpdateLatestPengajuanStatus = (nextStatus: string) => {
        if (nextStatus === 'belum_diajukan') {
            setPengajuanData([]);
            return;
        }

        setPengajuanData((previous) => {
            if (previous.length === 0) {
                return [{
                    id: Date.now(),
                    judul: 'Pengajuan PKM',
                    ringkasan: 'Status diperbarui dari aksi pada akun dosen.',
                    tanggal: createPengajuanDateLabel(),
                    status: nextStatus,
                }];
            }

            return previous.map((item, index) => (
                index === 0 ? { ...item, status: nextStatus, tanggal: createPengajuanDateLabel() } : item
            ));
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const updateViewport = (event: MediaQueryListEvent) => setIsMobileViewport(event.matches);
        setIsMobileViewport(mediaQuery.matches);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateViewport);
            return () => mediaQuery.removeEventListener('change', updateViewport);
        }

        mediaQuery.addListener(updateViewport);
        return () => mediaQuery.removeListener(updateViewport);
    }, []);

    if (isMobileViewport) {
        return (
            <Layout mainClassName="site-main-content site-main-content--landing-balanced" mainStyle={{ flex: '0 0 auto' }}>
                <Head title="Login Dosen - P3M Poltekpar Makassar" />
                <LoginDosenMobile
                    pkmData={pkmData}
                    submissionStatus={currentSubmissionStatus}
                    pkmStatusData={currentPkmStatusData}
                    submissionHistory={submissionHistoryData}
                    onUpdateSubmissionStatus={handleUpdateLatestPengajuanStatus}
                    onSubmitted={(submission: SubmissionData) => setPengajuanData((previous) => [submission, ...previous])}
                />
            </Layout>
        );
    }

    return (
        <Layout mainClassName="site-main-content site-main-content--landing-balanced" mainStyle={{ flex: '0 0 auto' }}>
            <Head title="Login Dosen - P3M Poltekpar Makassar" />
            <div className="landing-page login-dosen-page">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
                    <PkmMapDashboardCard pkmData={pkmData} watchKey="login-dosen-map" />
                </div>

                <section className="cta-banner login-dosen-cta" id="cta-pengajuan-dosen">
                    <div className="cta-banner__content">
                        <div className="cta-banner__icon-wrap"><i className="fa-solid fa-paper-plane"></i></div>
                        <h2 className="cta-banner__title">{hasSubmissionHistory ? 'Kelola pengajuan PKM Anda' : 'Mau melakukan pengajuan PKM?'}</h2>
                        <p className="cta-banner__subtitle">
                            {hasSubmissionHistory
                                ? 'Buka halaman pengajuan untuk membuat pengajuan baru atau cek status untuk melihat pengajuan yang sudah pernah dikirim.'
                                : 'Karena belum ada pengajuan yang tersimpan, tombol pengajuan dan cek status sama-sama akan membuka halaman pengajuan.'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                            <a href={pengajuanHref} className="cta-banner__btn cta-banner__btn--auth"><i className="fa-solid fa-file-circle-plus"></i><span>Buka Halaman Pengajuan</span></a>
                            <a href={cekStatusHref} className="cta-banner__btn" style={{ background: hasSubmissionHistory ? '#0f172a' : '#e2e8f0', color: hasSubmissionHistory ? '#ffffff' : '#334155' }}>
                                <i className="fa-solid fa-magnifying-glass"></i><span>Cek Status</span>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
