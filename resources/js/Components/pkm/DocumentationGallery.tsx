import React, { useState, ReactNode, MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface DocumentationGalleryProps {
    status: string;
    driveLink?: string;
}

export default function DocumentationGallery({ status, driveLink = '' }: DocumentationGalleryProps) {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Only render the gallery if the project is marked as "selesai"
    if (status !== 'selesai') {
        return null;
    }

    // Professional YouTube generic embed (Nature)
    const videoEmbedUrl = 'https://www.youtube.com/embed/S70B9v1g_1s?rel=0';

    // Use provided driveLink or a placeholder
    const documentationDriveLink = driveLink || 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ';

    const openVideoModal = () => setIsVideoModalOpen(true);
    const closeVideoModal = () => setIsVideoModalOpen(false);

    const handleModalOverlayClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeVideoModal();
        }
    };

    const videoModalMarkup: ReactNode = isVideoModalOpen ? (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleModalOverlayClick}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Video Kegiatan</h3>
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                        onClick={closeVideoModal}
                        title="Tutup"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Video Body */}
                <div className="aspect-video bg-slate-900">
                    <iframe
                        className="w-full h-full"
                        src={videoEmbedUrl + '&autoplay=1'}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="mt-6">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-folder-open text-xl" style={{ color: '#15325F' }}></i>
                <span className="text-base font-bold text-slate-900">Dokumentasi Lampiran</span>
            </div>

            {/* Foto Section - Drive Link */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-slate-900">Foto Kegiatan</h4>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                        Silahkan klik link di bawah ini untuk mengakses dokumentasi foto:
                    </p>
                    <a
                        href={documentationDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-blue-700 text-sm font-semibold hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <i className="fa-brands fa-google-drive text-lg" style={{ color: '#4285f4' }}></i>
                        Buka Google Drive
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs opacity-60"></i>
                    </a>
                </div>
            </div>

            {/* Video Section */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900">Video Kegiatan</h4>
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-poltekpar-primary hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={openVideoModal}
                    >
                        Layar Penuh
                        <i className="fa-solid fa-expand"></i>
                    </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="aspect-video">
                        <iframe
                            src={videoEmbedUrl}
                            title="Video Dokumentasi Kegiatan"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>

            {/* Video Modal Portal */}
            {isVideoModalOpen && typeof document !== 'undefined' && createPortal(videoModalMarkup, document.body)}
        </div>
    );
}
