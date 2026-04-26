import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LandingCharts from './LandingCharts';
import MapLegend from './MapLegend';
import DocumentationGallery from './DocumentationGallery';
import TestimonialSidebarDisplay from './TestimonialSidebarDisplay';
import DosenSubmissionCard from './DosenSubmissionCard';
import MobileSplashScreen from './MobileSplashScreen';
import { createPkmMarkerIcon, extractDynamicPkmTypes } from '@/data/pkmMapVisuals';
import type { PkmData } from '@/types';

(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface MenuItemChild { label: string; href: string; target?: string; }
interface MenuItem { label: string; href?: string; children?: MenuItemChild[]; }

const mobileMenuItems: MenuItem[] = [
    { label: 'Beranda', href: 'https://p3m.poltekparmakassar.ac.id/' },
    { label: 'Profil', children: [{ label: 'Tentang Kami', href: 'https://p3m.poltekparmakassar.ac.id/profil/tentang-kami/' }, { label: 'Visi dan Misi', href: 'https://p3m.poltekparmakassar.ac.id/profil/visi-dan-misi/' }, { label: 'Struktur Organisasi Tahun 2026', href: 'https://p3m.poltekparmakassar.ac.id/profil/struktur-organisasi/' }, { label: 'Hubungi Kami', href: 'https://p3m.poltekparmakassar.ac.id/hubungi-kami/' }] },
    { label: 'Kegiatan', children: [{ label: 'Penelitian', href: 'https://p3m.poltekparmakassar.ac.id/kegiatan/penelitian/' }, { label: 'Conference Internasional', href: 'https://p3m.poltekparmakassar.ac.id/conference-internasional/' }, { label: 'Seminar Nasional', href: 'https://p3m.poltekparmakassar.ac.id/seminar-nasional/' }] },
    { label: 'Informasi', children: [{ label: 'Berita', href: 'https://p3m.poltekparmakassar.ac.id/informasi/berita/' }, { label: 'Info Seminar', href: 'https://p3m.poltekparmakassar.ac.id/informasi/pengumuman/' }, { label: 'Pengumuman', href: 'https://p3m.poltekparmakassar.ac.id/pengumuman/' }] },
    { label: 'Dokumen', href: 'https://p3m.poltekparmakassar.ac.id/dokumen/' },
    { label: 'Publikasi', children: [{ label: 'Penelitian', href: 'https://p3m.poltekparmakassar.ac.id/penelitian/' }, { label: 'Pengabdian', href: 'https://p3m.poltekparmakassar.ac.id/pengabdian/' }, { label: 'Padaidi', href: 'https://journal.poltekparmakassar.ac.id/index.php/padaidi', target: '_blank' }, { label: 'Pusaka', href: 'https://journal.poltekparmakassar.ac.id/index.php/pusaka', target: '_blank' }, { label: 'Hak Cipta', href: 'https://p3m.poltekparmakassar.ac.id/publikasi/sentra-haki/hak-cipta/' }, { label: 'Buku', href: 'https://p3m.poltekparmakassar.ac.id/buku/' }] },
];

interface Submission { id: number; judul: string; ringkasan: string; tanggal: string; status: string; catatan?: string; }

interface MenuAccount { label: string; description: string; icon: string; }
interface StatusSummaryCopy { pkmFallbackDescription: string; diprosesDescription: string; ditangguhkanDescription: string; ditolakDescription: string; diterimaDescription: string; defaultDescription: string; }

const defaultMenuAccount: MenuAccount = { label: 'Akun Dosen', description: 'Akses khusus dosen untuk pengajuan dan monitoring PKM.', icon: 'fa-user-tie' };
const defaultStatusSummaryCopy: StatusSummaryCopy = { pkmFallbackDescription: 'Status kegiatan PKM aktif pada akun dosen.', diprosesDescription: 'Pengajuan PKM Anda sedang ditinjau oleh tim P3M.', ditangguhkanDescription: 'Dokumen perlu diperbarui sebelum diproses kembali.', ditolakDescription: 'Anda bisa menyiapkan pengajuan baru dari tab akses.', diterimaDescription: 'Pengajuan PKM Anda telah lolos dan siap masuk tahap berikutnya.', defaultDescription: 'Form pengajuan PKM siap diisi dari tab akses.' };

interface StatusInfo { eyebrow: string; label: string; icon: string; tone: string; description: string; }

const getStatusSummary = (submissionStatus: string, pkmStatusData: PkmData | null = null, copy: StatusSummaryCopy = defaultStatusSummaryCopy): StatusInfo => {
    if (submissionStatus === 'berlangsung' || submissionStatus === 'selesai') {
        return { eyebrow: 'Status PKM', label: submissionStatus === 'berlangsung' ? 'PKM Berlangsung' : 'PKM Selesai', icon: submissionStatus === 'berlangsung' ? 'fa-person-walking' : 'fa-flag-checkered', tone: submissionStatus === 'berlangsung' ? 'warning' : 'success', description: pkmStatusData ? `${pkmStatusData.nama} • ${pkmStatusData.desa}, ${pkmStatusData.kecamatan}` : copy.pkmFallbackDescription };
    }
    switch (submissionStatus) {
        case 'diproses': return { eyebrow: 'Status Pengajuan', label: 'Sedang Diproses', icon: 'fa-clock', tone: 'info', description: copy.diprosesDescription };
        case 'ditangguhkan': return { eyebrow: 'Status Pengajuan', label: 'Perlu Revisi', icon: 'fa-file-pen', tone: 'warning', description: copy.ditangguhkanDescription };
        case 'ditolak': return { eyebrow: 'Status Pengajuan', label: 'Belum Diterima', icon: 'fa-circle-xmark', tone: 'danger', description: copy.ditolakDescription };
        case 'diterima': return { eyebrow: 'Status Pengajuan', label: 'Diterima', icon: 'fa-circle-check', tone: 'success', description: copy.diterimaDescription };
        default: return { eyebrow: 'Status Pengajuan', label: 'Belum Diajukan', icon: 'fa-file-circle-plus', tone: 'neutral', description: copy.defaultDescription };
    }
};

const getStatusBadge = (status: string): string => status === 'berlangsung' ? 'status-open' : 'status-closed';
const getStatusIcon = (status: string): string => status === 'berlangsung' ? 'fa-spinner fa-spin' : 'fa-check-double';
const getStatusText = (status: string): string => status === 'berlangsung' ? 'Berlangsung' : 'Selesai';

interface MobileMapEventsProps { onMapClick?: () => void; }
function MobileMapEvents({ onMapClick }: MobileMapEventsProps) { useMapEvents({ click: () => onMapClick?.() }); return null; }

interface MobileMapInvalidatorProps { watchKey: string | number; }
function MobileMapInvalidator({ watchKey }: MobileMapInvalidatorProps) {
    const map = useMap();
    useEffect(() => { const invalidate = () => map.invalidateSize({ animate: false, pan: false }); const frameId = requestAnimationFrame(invalidate); const timeoutId = setTimeout(invalidate, 180); return () => { cancelAnimationFrame(frameId); clearTimeout(timeoutId); }; }, [map, watchKey]);
    return null;
}

interface MobileMapSearchProps { pkmData: PkmData[]; isHidden: boolean; onSelect: (pkm: PkmData) => void; }
function MobileMapSearch({ pkmData, isHidden, onSelect }: MobileMapSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const filtered = pkmData.filter((pkm) => pkm.nama.toLowerCase().includes(query.toLowerCase()) || pkm.deskripsi.toLowerCase().includes(query.toLowerCase()));
    return (
        <div className={`absolute top-4 left-4 right-20 z-[40] ${isHidden ? 'hidden' : ''}`}>
            <div className="relative">
                <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3">
                    <i className="fa-solid fa-search text-slate-400"></i>
                    <input type="text" placeholder="Cari titik PKM..." value={query} onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} className="flex-1 outline-none text-sm" />
                    {query && <button type="button" onClick={() => { setQuery(''); setIsOpen(false); }} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>}
                </div>
                {isOpen && query && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map((pkm) => (<button key={pkm.id} type="button" onClick={() => { onSelect(pkm); setQuery(pkm.nama); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"><strong className="text-sm text-slate-900 block">{pkm.nama}</strong><span className="text-xs text-slate-500">{pkm.desa}, {pkm.kecamatan}</span></button>)) : <div className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ada hasil untuk "{query}"</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

interface MobileStatusSummaryProps { statusInfo: StatusInfo; compact?: boolean; }
function MobileStatusSummary({ statusInfo, compact = false }: MobileStatusSummaryProps) {
    const toneColors: Record<string, { bg: string; border: string; iconBg: string; iconColor: string }> = {
        info: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
        danger: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-700' },
        neutral: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-100', iconColor: 'text-slate-700' },
    };
    const colors = toneColors[statusInfo.tone] || toneColors.neutral;
    return (
        <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 ${compact ? 'p-3' : ''}`}>
            <div className="flex items-center gap-4">
                <div className={`${colors.iconBg} ${colors.iconColor} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <i className={`fa-solid ${statusInfo.icon} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{statusInfo.eyebrow}</span>
                    <strong className={`block text-slate-900 ${compact ? 'text-sm' : 'text-base'} font-bold mt-0.5`}>{statusInfo.label}</strong>
                    <p className={`text-slate-600 ${compact ? 'text-xs' : 'text-sm'} mt-0.5`}>{statusInfo.description}</p>
                </div>
            </div>
        </div>
    );
}

interface MobileMenuDrawerProps { isOpen: boolean; onClose: () => void; statusInfo: StatusInfo; menuAccount?: MenuAccount; drawerDescription?: string; }
function MobileMenuDrawer({ isOpen, onClose, statusInfo, menuAccount = defaultMenuAccount, drawerDescription = 'Semua menu utama dan submenu tersedia rapi di sini untuk akun dosen.' }: MobileMenuDrawerProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    useEffect(() => { if (!isOpen) setExpandedIndex(null); }, [isOpen]);
    return (
        <>
            <button type="button" className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></button>
            <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full overflow-y-auto">
                    <div className="px-5 py-5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigasi Mobile</span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">Menu P3M Poltekpar</h3>
                        <p className="text-sm text-slate-600 mt-1">{drawerDescription}</p>
                    </div>
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                    
                    {/* Account Badge */}
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
                            <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                <i className={`fa-solid ${menuAccount.icon} text-lg`}></i>
                            </span>
                            <div>
                                <span className="text-sm font-bold text-slate-900 block">{menuAccount.label}</span>
                                <small className="text-xs text-slate-500">{menuAccount.description}</small>
                            </div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="px-4 py-4 border-b border-slate-100">
                        <MobileStatusSummary statusInfo={statusInfo} compact />
                    </div>

                    {/* Menu Items */}
                    <div className="px-4 py-4 space-y-1">
                        {mobileMenuItems.map((item, index) => {
                            const hasChildren = Boolean(item.children?.length);
                            const isExpanded = expandedIndex === index;
                            return (
                                <div key={item.label} className={`border border-slate-200 rounded-xl overflow-hidden ${isExpanded ? 'ring-2 ring-blue-100' : ''}`}>
                                    {hasChildren ? (
                                        <>
                                            <button type="button" onClick={() => setExpandedIndex(prev => prev === index ? null : index)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
                                                <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                                                <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-400 text-xs`}></i>
                                            </button>
                                            {isExpanded && (
                                                <div className="bg-slate-50 border-t border-slate-100">
                                                    {item.children!.map((child) => (
                                                        <a key={child.label} href={child.href} target={child.target} rel={child.target === '_blank' ? 'noreferrer' : undefined} onClick={onClose} className="block px-4 py-2.5 text-sm text-slate-600 hover:text-poltekpar-primary hover:bg-white">{child.label}</a>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <a href={item.href} onClick={onClose} className="block px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50">{item.label}</a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}

interface MobileMapPanelProps { pkmData: PkmData[]; selectedPkm: PkmData | null; onSelectPkm: (pkm: PkmData) => void; onClosePkm: () => void; totals: { totalPkm: number; totalSelesai: number; totalBerlangsung: number }; typesMeta: any[]; }
function MobileMapPanel({ pkmData, selectedPkm, onSelectPkm, onClosePkm, totals, typesMeta }: MobileMapPanelProps) {
    return (
        <section className="relative h-full">
            <div className="absolute inset-0">
                <MobileMapSearch pkmData={pkmData} isHidden={!!selectedPkm} onSelect={onSelectPkm} />
                <MapContainer center={[-2.5, 118]} zoom={5} minZoom={4} maxBounds={[[-15, 90], [10, 145]]} className="w-full h-full" zoomControl={false}>
                    <ZoomControl position="topleft" />
                    <MobileMapInvalidator watchKey={selectedPkm?.id ?? 'none'} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    {pkmData.map((pkm) => {
                        const typeMeta = typesMeta.find(t => t.key === ((typeof pkm.jenis_pkm === 'string' ? pkm.jenis_pkm : (pkm.jenis_pkm as any)?.nama_jenis) || 'Lainnya').trim() || 'Lainnya');
                        const markerColor = typeMeta ? typeMeta.color : '#15325F';
                        return <Marker key={pkm.id} position={[parseFloat(String(pkm.lat)), parseFloat(String(pkm.lng))]} icon={createPkmMarkerIcon(pkm.status, markerColor, (pkm as any).is_review)} eventHandlers={{ click: () => onSelectPkm(pkm) }} />;
                    })}
                    <MobileMapEvents onMapClick={onClosePkm} />
                </MapContainer>
            </div>
            <div className={`absolute bottom-4 left-4 right-4 z-[40] transition-opacity ${selectedPkm ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
                    <MapLegend compact typesMeta={typesMeta} />
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="text-center"><span className="text-xs text-slate-500 block">Total PKM</span><strong className="text-lg font-bold text-slate-900">{totals.totalPkm}</strong></div>
                        <div className="text-center"><span className="text-xs text-slate-500 block">Selesai</span><strong className="text-lg font-bold text-emerald-600">{totals.totalSelesai}</strong></div>
                        <div className="text-center"><span className="text-xs text-slate-500 block">Berlangsung</span><strong className="text-lg font-bold text-amber-600">{totals.totalBerlangsung}</strong></div>
                    </div>
                </div>
            </div>
            <button type="button" className={`absolute inset-0 bg-slate-900/60 z-[45] transition-opacity ${selectedPkm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClosePkm}></button>
            <aside className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[50] transform transition-transform duration-300 ease-out ${selectedPkm ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedPkm && (
                    <div className="flex flex-col h-full overflow-y-auto">
                        <button type="button" onClick={onClosePkm} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg z-10"><i className="fa-solid fa-xmark"></i></button>
                        <div className="relative h-56 bg-slate-100">
                            {selectedPkm.thumbnail ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${selectedPkm.thumbnail})` }}></div> : <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-image text-5xl"></i></div>}
                        </div>
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <h2 className="text-xl font-bold text-slate-900">{selectedPkm.nama}</h2>
                                <span className="text-sm font-semibold text-slate-500">{selectedPkm.tahun}</span>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${selectedPkm.status === 'berlangsung' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                <i className={`fa-solid ${getStatusIcon(selectedPkm.status)}`}></i>{getStatusText(selectedPkm.status)}
                            </div>
                            <p className="text-sm text-slate-600 mb-4">{selectedPkm.deskripsi}</p>
                            <DocumentationGallery status={selectedPkm.status} driveLink={selectedPkm.dokumentasi} />
                            <TestimonialSidebarDisplay status={selectedPkm.status} />
                            <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100"><i className="fa-solid fa-map-pin mr-2 text-slate-400"></i>{selectedPkm.desa}, Kec. {selectedPkm.kecamatan}, {selectedPkm.kabupaten}, {selectedPkm.provinsi}</p>
                        </div>
                    </div>
                )}
            </aside>
        </section>
    );
}

interface MobileDashboardPanelProps { pkmData: PkmData[]; }
function MobileDashboardPanel({ pkmData }: MobileDashboardPanelProps) { return <section className="h-full overflow-y-auto"><LandingCharts compactMobile pkmData={pkmData} /></section>; }

interface MobileAccessPanelProps { statusInfo: StatusInfo; renderAccessCard: () => React.ReactNode; }
function MobileAccessPanel({ statusInfo, renderAccessCard }: MobileAccessPanelProps) {
    return (
        <section className="h-full overflow-y-auto p-6">
            <div className="mb-4"><MobileStatusSummary statusInfo={statusInfo} /></div>
            {renderAccessCard()}
        </section>
    );
}

interface LoginDosenMobileProps {
    pkmData?: PkmData[];
    submissionStatus?: string;
    pkmStatusData?: PkmData | null;
    submissionHistory?: Submission[];
    onUpdateSubmissionStatus?: (status: string) => void;
    onSubmitted?: (submission: Submission) => void;
    menuAccount?: MenuAccount;
    drawerDescription?: string;
    statusSummaryCopy?: StatusSummaryCopy;
    navigationLabel?: string;
    logoutPath?: string;
    renderAccessCard?: () => React.ReactNode;
}

export default function LoginDosenMobile({
    pkmData = [],
    submissionStatus = 'belum_diajukan',
    pkmStatusData = null,
    submissionHistory = [],
    onUpdateSubmissionStatus,
    onSubmitted,
    menuAccount = defaultMenuAccount,
    drawerDescription = 'Semua menu utama dan submenu tersedia rapi di sini untuk akun dosen.',
    statusSummaryCopy = defaultStatusSummaryCopy,
    navigationLabel = 'Navigasi mobile login dosen',
    logoutPath = '/logout',
    renderAccessCard,
}: LoginDosenMobileProps) {
    const [activeTab, setActiveTab] = useState('peta');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedPkm, setSelectedPkm] = useState<PkmData | null>(null);
    const [parkedPkm, setParkedPkm] = useState<PkmData | null>(null);

    const statusInfo = useMemo(() => getStatusSummary(submissionStatus, pkmStatusData, statusSummaryCopy), [submissionStatus, pkmStatusData, statusSummaryCopy]);

    const accessCardRenderer = renderAccessCard ?? (() => (
        <DosenSubmissionCard submissionStatus={submissionStatus} pkmStatusData={pkmStatusData} pkmListData={pkmData} submissionHistory={submissionHistory} onUpdateSubmissionStatus={onUpdateSubmissionStatus} onSubmitted={onSubmitted} />
    ));

    const typesMeta = useMemo(() => extractDynamicPkmTypes(pkmData), [pkmData]);

    const totals = useMemo(() => ({ totalPkm: pkmData.length, totalSelesai: pkmData.filter((item) => item.status === 'selesai').length, totalBerlangsung: pkmData.filter((item) => item.status === 'berlangsung').length }), [pkmData]);

    const closeMenuPanel = () => { setIsMenuOpen(false); if (parkedPkm) { setSelectedPkm(parkedPkm); setParkedPkm(null); } };
    const closePkmPanel = () => { setSelectedPkm(null); setParkedPkm(null); };

    const handleOpenMenu = () => {
        if (isMenuOpen) { closeMenuPanel(); return; }
        if (selectedPkm) { setParkedPkm(selectedPkm); setSelectedPkm(null); }
        setIsMenuOpen(true);
    };

    const handleSelectPkm = (pkm: PkmData) => { if (isMenuOpen) { setIsMenuOpen(false); setParkedPkm(null); } setSelectedPkm(pkm); };

    const handleTabChange = (tabId: string) => {
        if (tabId === 'logout') { window.location.href = logoutPath; return; }
        if (tabId === 'menu') { handleOpenMenu(); return; }
        setIsMenuOpen(false); setSelectedPkm(null); setParkedPkm(null); setActiveTab(tabId);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            <MobileSplashScreen />
            <MobileMenuDrawer isOpen={isMenuOpen} onClose={closeMenuPanel} statusInfo={statusInfo} menuAccount={menuAccount} drawerDescription={drawerDescription} />

            <div className="flex-1 overflow-hidden">
                {activeTab === 'peta' && <MobileMapPanel pkmData={pkmData} selectedPkm={selectedPkm} onSelectPkm={handleSelectPkm} onClosePkm={closePkmPanel} totals={totals} typesMeta={typesMeta} />}
                {activeTab === 'dashboard' && <MobileDashboardPanel pkmData={pkmData} />}
                {activeTab === 'akses' && <MobileAccessPanel statusInfo={statusInfo} renderAccessCard={accessCardRenderer} />}
            </div>

            {/* Tab Bar */}
            <nav className="bg-white border-t border-slate-200 shadow-lg" aria-label={navigationLabel}>
                <div className="flex items-center">
                    {[
                        { id: 'menu', label: 'Menu', icon: 'fa-solid fa-bars' },
                        { id: 'peta', label: 'Peta', icon: 'fa-solid fa-map-location-dot' },
                        { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
                        { id: 'akses', label: 'Akses', icon: 'fa-solid fa-file-signature' },
                        { id: 'logout', label: 'Logout', icon: 'fa-solid fa-right-from-bracket' },
                    ].map((tab) => {
                        const isActive = tab.id === 'menu' ? isMenuOpen : activeTab === tab.id;
                        return (
                            <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)} className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all ${isActive ? 'text-poltekpar-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                                <div className={`relative w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}>
                                    <i className={`${tab.icon} text-lg`}></i>
                                    {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-poltekpar-primary"></span>}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
