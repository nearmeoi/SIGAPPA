import React from 'react';
import LoginDosenMobile from './LoginDosenMobile';
import MasyarakatSubmissionCard from './MasyarakatSubmissionCard';
import type { PkmData } from '@/types';

interface Submission {
    id: number;
    judul: string;
    ringkasan: string;
    tanggal: string;
    status: string;
}

interface LoginMasyarakatMobileProps {
    pkmData?: PkmData[];
    submissionStatus?: string;
    latestSubmission?: Submission | null;
    pkmStatusData?: PkmData | null;
    submissionHistory?: Submission[];
    onUpdateSubmissionStatus?: (status: string) => void;
    onSubmitted?: (submission: Submission) => void;
}

const masyarakatMenuAccount = {
    label: 'Akun Masyarakat',
    description: 'Akses masyarakat untuk pengajuan, pemantauan status, dan arsip kegiatan PKM.',
    icon: 'fa-users',
};

const masyarakatStatusSummaryCopy = {
    pkmFallbackDescription: 'Status kegiatan PKM aktif pada akun masyarakat.',
    diprosesDescription: 'Pengajuan PKM Anda sedang ditinjau oleh tim P3M.',
    ditangguhkanDescription: 'Surat atau informasi pengajuan perlu diperbarui sebelum diproses kembali.',
    ditolakDescription: 'Anda bisa menyiapkan pengajuan masyarakat yang baru dari tab akses.',
    diterimaDescription: 'Pengajuan masyarakat Anda telah diterima dan siap masuk tahap berikutnya.',
    defaultDescription: 'Form pengajuan masyarakat siap diisi dari tab akses.',
};

export default function LoginMasyarakatMobile({
    pkmData = [],
    submissionStatus = 'belum_diajukan',
    latestSubmission = null,
    pkmStatusData = null,
    submissionHistory = [],
    onUpdateSubmissionStatus,
    onSubmitted,
}: LoginMasyarakatMobileProps) {
    return (
        <LoginDosenMobile
            pkmData={pkmData}
            submissionStatus={submissionStatus}
            pkmStatusData={pkmStatusData}
            submissionHistory={submissionHistory}
            onSubmitted={onSubmitted}
            menuAccount={masyarakatMenuAccount}
            drawerDescription="Semua menu utama dan submenu tersedia rapi di sini untuk akun masyarakat."
            statusSummaryCopy={masyarakatStatusSummaryCopy}
            navigationLabel="Navigasi mobile login masyarakat"
            renderAccessCard={() => (
                <MasyarakatSubmissionCard
                    submissionStatus={submissionStatus}
                    latestSubmission={latestSubmission}
                    pkmStatusData={pkmStatusData}
                    pkmListData={pkmData}
                    submissionHistory={submissionHistory}
                    onUpdateSubmissionStatus={onUpdateSubmissionStatus}
                    onSubmitted={onSubmitted}
                    hideInlineStatusPanel
                />
            )}
        />
    );
}
