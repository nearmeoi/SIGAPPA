import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LandingCharts from '@/Components/LandingCharts';
import MapLegend from '@/Components/MapLegend';
import { createPkmMarkerIcon, extractDynamicPkmTypes, getPkmStatusMeta, PkmTypeMeta } from '@/data/pkmMapVisuals';
import type { PkmData } from '@/types';
import '../../css/landing.css';

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeSearchText = (value: unknown) => normalizeText(value).toLowerCase();

const normalizeTypeKey = (value: unknown) => normalizeText(value) || 'Lainnya';

const parseCoordinate = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    return Number.isFinite(parsed) ? parsed : null;
};

if (typeof window !== 'undefined' && L?.Icon?.Default) {
    (L.Icon.Default.prototype as any)._getIconUrl = undefined;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

function MapSizeInvalidator({ watchKey }: { watchKey: string }): null {
    const map = useMap();
    useEffect(() => {
        const timeoutId = window.setTimeout(() => map.invalidateSize(), 200);
        return () => window.clearTimeout(timeoutId);
    }, [map, watchKey]);
    return null;
}

function FlyToMarker({ lat, lng }: { lat: number | null; lng: number | null }) {
    const map = useMap();
    useEffect(() => {
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], 15, { duration: 1.5, easeLinearity: 0.25 });
        }
    }, [lat, lng, map]);
    return null;
}

function MapSummaryOverlay({
    total,
    selesai,
    berlangsung,
    belumMulai,
    forceHide,
    typesMeta,
    selectedTypes,
    onToggleType,
    selectedStatuses,
    onToggleStatus,
    isMobile = false,
}: {
    total: number;
    selesai: number;
    berlangsung: number;
    belumMulai: number;
    forceHide?: boolean;
    typesMeta: PkmTypeMeta[];
    selectedTypes: string[];
    onToggleType: (typeKey: string) => void;
    selectedStatuses: string[];
    onToggleStatus: (statusKey: string) => void;
    isMobile?: boolean;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const wrapClass = forceHide ? 'opacity-0 -translate-x-[120%] pointer-events-none' : 'opacity-100 translate-x-0';
    const panelClass = isCollapsed ? 'opacity-0 scale-50 -translate-x-[80%] pointer-events-none' : 'opacity-100 scale-100 translate-x-0 relative';

    return (
        <div className={`absolute bottom-3 left-3 right-3 md:right-auto md:bottom-8 md:left-8 z-[1000] flex flex-col md:flex-row items-end md:items-end gap-2 md:gap-3 pointer-events-none transition-all duration-500 ease-in-out ${wrapClass}`}>
            <button 
                onClick={() => setIsCollapsed((value) => !value)} 
                className="w-9 h-9 md:w-11 md:h-11 mb-1 bg-white/95 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl border border-white/40 flex items-center justify-center text-slate-500 hover:text-poltekpar-primary hover:scale-105 active:scale-95 transition-all outline-none z-10 pointer-events-auto shadow-blue-900/10" 
                title={isCollapsed ? 'Tampilkan Informasi Map' : 'Sembunyikan Informasi Map'}
            >
                <i className={`fa-solid ${isCollapsed ? 'fa-chart-pie' : 'fa-chevron-down md:fa-chevron-left'} transition-transform duration-300 text-sm md:text-lg`}></i>
            </button>
            <div className={`flex flex-col items-stretch md:flex-row md:items-end gap-2 md:gap-3 transition-all duration-500 origin-bottom md:origin-left flex-1 ${panelClass}`}>
                {!isMobile && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-[20px] md:rounded-[24px] p-1.5 md:p-2 shadow-2xl border border-white/40 whitespace-nowrap pointer-events-auto" style={{ overflow: 'visible' }}>
                        <MapLegend className="bg-transparent border-none shadow-none" compact typesMeta={typesMeta} selectedTypes={selectedTypes} onToggleType={onToggleType} selectedStatuses={selectedStatuses} onToggleStatus={onToggleStatus} />
                    </div>
                )}
                
                <div className="bg-white/90 backdrop-blur-xl rounded-[18px] md:rounded-[28px] p-2 md:p-4 shadow-2xl border border-white/40 mb-1 pointer-events-auto">
                    <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-8">
                        <div className="text-center md:text-left px-1 md:px-0">
                            <div className="text-sm md:text-lg font-black text-slate-900 leading-none">{total}</div>
                            <div className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total PKM</div>
                        </div>
                        <div className="hidden md:block w-px h-8 bg-slate-200/50"></div>
                        
                        <div className="text-center md:text-left px-1 md:px-0">
                            <div className="text-sm md:text-lg font-black text-emerald-600 leading-none">{selesai}</div>
                            <div className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Selesai</div>
                        </div>
                        <div className="hidden md:block w-px h-8 bg-slate-200/50"></div>
                        
                        <div className="text-center md:text-left px-1 md:px-0">
                            <div className="text-sm md:text-lg font-black text-amber-500 leading-none">{berlangsung}</div>
                            <div className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Berjalan</div>
                        </div>
                        <div className="hidden md:block w-px h-8 bg-slate-200/50"></div>
                        
                        <div className="text-center md:text-left px-1 md:px-0">
                            <div className="text-sm md:text-lg font-black text-slate-400 leading-none">{belumMulai}</div>
                            <div className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Rencana</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PkmMapDashboardCard({ pkmData, watchKey = 'pkm-map', isAdmin = false, showTitle = true }: { pkmData: PkmData[]; watchKey?: string; isAdmin?: boolean; showTitle?: boolean }) {
    const [isListSidebarOpen, setIsListSidebarOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedPkm, setSelectedPkm] = useState<PkmData | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('Semua Tahun');
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const [isLegendPanelOpen, setIsLegendPanelOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const syncViewport = () => setIsMobile(window.innerWidth < 768);
        syncViewport();
        window.addEventListener('resize', syncViewport);
        return () => window.removeEventListener('resize', syncViewport);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setIsLegendPanelOpen(false);
        }
    }, [isMobile]);

    const filteredPkmData = useMemo(() => {
        const keyword = searchKeyword.toLowerCase();
        return pkmData.filter((pkm) => {
            const matchesSearch = keyword.length === 0 || [pkm.nama, pkm.desa, pkm.kabupaten, pkm.provinsi].some((value) => normalizeSearchText(value).includes(keyword));
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(normalizeTypeKey(pkm?.jenis_pkm));
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(getPkmStatusMeta(pkm.status).key);
            const matchesYear = selectedYear === 'Semua Tahun' || String(pkm.tahun) === selectedYear;
            return matchesSearch && matchesType && matchesStatus && matchesYear;
        });
    }, [pkmData, searchKeyword, selectedStatuses, selectedTypes, selectedYear]);

    const mappablePkmData = useMemo(() => (
        filteredPkmData
            .map((pkm) => ({
                pkm,
                lat: parseCoordinate(pkm.lat),
                lng: parseCoordinate(pkm.lng),
            }))
            .filter((item) => item.lat !== null && item.lng !== null)
    ), [filteredPkmData]);

    const typesMeta = useMemo(() => extractDynamicPkmTypes(pkmData), [pkmData]);

    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear().toString();
        const years = new Set(pkmData.map(pkm => String(pkm.tahun)));
        const sortedYears = Array.from(years).sort((a, b) => Number(b) - Number(a));
        
        const yearOptions = [
            { value: 'Semua Tahun', label: 'Semua Tahun' },
        ];
        
        if (sortedYears.includes(currentYear)) {
            yearOptions.push({ value: currentYear, label: 'Tahun ini' });
        }
        
        sortedYears.filter(y => y !== currentYear).forEach(y => {
            yearOptions.push({ value: y, label: y });
        });
        
        return yearOptions;
    }, [pkmData]);

    const totalPkm = filteredPkmData.length;
    const totalSelesai = filteredPkmData.filter((item) => item.status === 'selesai').length;
    const totalBerlangsung = filteredPkmData.filter((item) => item.status === 'berlangsung').length;
    const totalBelumMulai = filteredPkmData.filter((item) => item.status === 'belum_mulai').length;
    const selectedLat = selectedPkm ? parseCoordinate(selectedPkm.lat) : null;
    const selectedLng = selectedPkm ? parseCoordinate(selectedPkm.lng) : null;
    const hasSelectedCoordinates = selectedLat !== null && selectedLng !== null;

    return (
        <div className="space-y-4 sm:space-y-5">
            {showTitle && (
                <div className="px-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Dashboard Sebaran <span className="text-poltekpar-primary">PKM</span></h2>
                </div>
            )}
            <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] shadow-2xl shadow-sigappa-navy/5 border border-slate-100 overflow-hidden mb-6 sm:mb-8 p-3 sm:p-4 md:p-6">
            <div className="relative w-full h-[380px] sm:h-[500px] md:h-[650px] lg:h-[75vh] min-h-[380px] rounded-2xl sm:rounded-[24px] lg:rounded-[32px] border border-slate-100 overflow-hidden z-10 shadow-inner">
                <MapContainer center={[-2.5, 118]} zoom={5} className="w-full h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    {mappablePkmData.map(({ pkm, lat, lng }) => {
                        const typeMeta = typesMeta.find(t => t.key === normalizeTypeKey(pkm?.jenis_pkm));
                        const markerColor = typeMeta ? typeMeta.color : '#15325F';
                        return <Marker key={pkm.id} position={[lat, lng]} icon={createPkmMarkerIcon(pkm.status, markerColor, (pkm as any).is_review)} eventHandlers={{ click: () => setSelectedPkm(pkm) }} />;
                    })}
                    <MapSizeInvalidator watchKey={watchKey} />
                    <FlyToMarker lat={selectedLat} lng={selectedLng} />
                </MapContainer>
                <div className="absolute top-3 left-3 right-3 md:top-6 md:left-6 md:right-6 z-[1000] flex items-start justify-between gap-2">
                    <div className="relative">
                        <button 
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl px-3 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black text-slate-700 hover:text-poltekpar-primary hover:scale-[1.02] active:scale-95 transition-all min-h-[40px] md:min-h-[44px] max-w-[132px] sm:max-w-none truncate"
                        >
                            <i className="fa-solid fa-calendar-days text-poltekpar-primary/70"></i>
                            <span className="truncate">{availableYears.find(y => y.value === selectedYear)?.label || 'Semua Tahun'}</span>
                            <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        
                        <div className={`absolute top-full left-0 mt-3 w-44 sm:w-48 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-2xl overflow-hidden transition-all origin-top duration-300 ${isYearDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            <div className="p-2 flex flex-col gap-1">
                                {availableYears.map(year => (
                                    <button
                                        key={year.value}
                                        onClick={() => {
                                            setSelectedYear(year.value);
                                            setIsYearDropdownOpen(false);
                                        }}
                                        className={`px-4 py-3 text-left text-[13px] font-bold rounded-xl transition-all ${selectedYear === year.value ? 'bg-poltekpar-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-poltekpar-primary'}`}
                                    >
                                        {year.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 transition-all duration-500 ease-in-out ${isListSidebarOpen || !!selectedPkm ? 'opacity-0 -translate-y-4 pointer-events-none scale-90' : 'opacity-100 translate-x-0 scale-100'}`}>
                        {isMobile && (
                            <button
                                onClick={() => setIsLegendPanelOpen((value) => !value)}
                                className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl px-3 py-2.5 flex items-center gap-2 text-[10px] font-black text-slate-700 hover:text-poltekpar-primary transition-all min-h-[40px] w-auto"
                            >
                                <i className="fa-solid fa-sliders"></i>
                                Filter
                            </button>
                        )}
                        <button onClick={() => { setIsListSidebarOpen(true); setSelectedPkm(null); setIsLegendPanelOpen(false); }} className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl px-3 sm:px-6 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black text-slate-700 hover:text-poltekpar-primary hover:scale-[1.02] active:scale-95 transition-all min-h-[40px] md:min-h-[44px]">
                            <i className="fa-solid fa-list-ul"></i><span className="hidden sm:inline">DAFTAR KEGIATAN PKM</span><span className="sm:hidden">Daftar</span>
                        </button>
                    </div>
                </div>
                {isMobile && (
                    <div className={`absolute top-[58px] left-3 z-[1005] transition-all duration-300 ${isLegendPanelOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                        <div className="w-[180px] rounded-[18px] border border-white/70 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl">
                            <MapLegend className="bg-transparent border-none shadow-none" compact typesMeta={typesMeta} selectedTypes={selectedTypes} onToggleType={(key) => setSelectedTypes((value) => value.includes(key) ? value.filter((item) => item !== key) : [...value, key])} selectedStatuses={selectedStatuses} onToggleStatus={(key) => setSelectedStatuses((value) => value.includes(key) ? value.filter((item) => item !== key) : [...value, key])} />
                        </div>
                    </div>
                )}
                <MapSummaryOverlay total={totalPkm} selesai={totalSelesai} berlangsung={totalBerlangsung} belumMulai={totalBelumMulai} forceHide={isListSidebarOpen || !!selectedPkm || isYearDropdownOpen || isLegendPanelOpen} typesMeta={typesMeta} selectedTypes={selectedTypes} onToggleType={(key) => setSelectedTypes((value) => value.includes(key) ? value.filter((item) => item !== key) : [...value, key])} selectedStatuses={selectedStatuses} onToggleStatus={(key) => setSelectedStatuses((value) => value.includes(key) ? value.filter((item) => item !== key) : [...value, key])} isMobile={isMobile} />
                <div className={`absolute top-3 bottom-3 left-3 right-3 sm:top-4 sm:bottom-4 sm:left-auto sm:right-4 md:top-8 md:bottom-8 md:right-8 w-auto sm:w-[360px] md:w-[400px] max-w-none sm:max-w-[calc(100%-32px)] md:max-w-[calc(100%-64px)] bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-2xl md:rounded-[40px] shadow-2xl z-[1150] overflow-hidden flex flex-col transition-transform duration-700 border border-white/60 ${(!isListSidebarOpen && !selectedPkm) ? 'translate-x-[120%]' : 'translate-x-0'}`}>
                    {selectedPkm ? (
                        <>
                            <div className="p-4 sm:p-6 md:p-8 pb-4 bg-white/95 backdrop-blur-xl z-20 border-b border-slate-100 flex-shrink-0 animate-in fade-in duration-300">
                                <div className="flex items-center gap-4">
                                    {isListSidebarOpen && (
                                        <button onClick={() => setSelectedPkm(null)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-arrow-left"></i></button>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">{selectedPkm.nama}</h3>
                                        {(() => {
                                            const statusMeta = getPkmStatusMeta(selectedPkm.status);
                                            const statusClassesMap: Record<string, string> = {
                                                'berlangsung': 'bg-amber-100 text-amber-700',
                                                'selesai': 'bg-emerald-100 text-emerald-700',
                                                'ada_pengajuan': 'bg-sky-100 text-sky-700',
                                                'direvisi': 'bg-orange-100 text-orange-700',
                                            };
                                            const statusClasses = statusClassesMap[selectedPkm.status] || 'bg-slate-100 text-slate-700';
                                            return <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusClasses}`}><i className={`fa-solid ${statusMeta.markerIcon}`}></i> {statusMeta.label}</span>;
                                        })()}
                                    </div>
                                    <button onClick={() => { setIsListSidebarOpen(false); setSelectedPkm(null); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"><i className="fa-solid fa-xmark"></i></button>
                                </div>
                            </div>
                            <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 custom-scrollbar overscroll-contain">
                                <div className="aspect-video rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-xl border border-slate-100 bg-slate-50 group shrink-0">
                                    {selectedPkm.thumbnail ? <img src={selectedPkm.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><i className="fa-solid fa-mountain-sun text-5xl"></i></div>}
                                </div>
                                <div className="space-y-6">

                                    <div className="flex flex-col gap-3 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-sigappa-primary/10 text-sigappa-primary flex items-center justify-center"><i className="fa-solid fa-location-dot"></i></div>{[selectedPkm.desa, selectedPkm.kecamatan, selectedPkm.kabupaten, selectedPkm.provinsi].filter(Boolean).join(', ') || '-'}</div>
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-sigappa-primary/10 text-sigappa-primary flex items-center justify-center"><i className="fa-solid fa-calendar"></i></div>Tahun {selectedPkm.tahun}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {hasSelectedCoordinates && (
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLat},${selectedLng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                                                <i className="fa-solid fa-map-location-dot"></i> Rute
                                            </a>
                                        )}
                                        {isAdmin && (
                                            <a href={`/admin/pengajuan/${selectedPkm.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100">
                                                <i className="fa-solid fa-arrow-up-right-from-square"></i> Lihat Pengajuan
                                            </a>
                                        )}
                                        {selectedPkm.arsip_laporan && (
                                            <a href={selectedPkm.arsip_laporan} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100">
                                                <i className="fa-solid fa-file-pdf"></i> Arsip Laporan
                                            </a>
                                        )}
                                        {selectedPkm.dokumentasi && (
                                            <a href={selectedPkm.dokumentasi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-100">
                                                <i className="fa-solid fa-images"></i> Dokumentasi
                                            </a>
                                        )}
                                        {selectedPkm.tambahan && selectedPkm.tambahan.length > 0 && selectedPkm.tambahan.map((tItem: any, idx: number) => (
                                            <a key={idx} href={tItem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200">
                                                <i className="fa-solid fa-link"></i> {tItem.nama || 'Lainnya'}
                                            </a>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tim Pelaksana</span>
                                        {selectedPkm.tim_kegiatan && selectedPkm.tim_kegiatan.length > 0 ? (
                                            <div className="space-y-2">{selectedPkm.tim_kegiatan.map((tim, index) => <div key={index} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100"><div className="w-8 h-8 rounded-lg bg-poltekpar-primary/10 text-poltekpar-primary flex items-center justify-center text-[10px] font-black">{tim.nama?.charAt(0)?.toUpperCase() || '?'}</div><div><span className="text-xs font-bold text-slate-700 block leading-tight">{tim.nama}</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tim.peran}</span></div></div>)}</div>
                                        ) : <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center"><span className="text-xs font-bold text-slate-400">Belum ada data tim pelaksana</span></div>}
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Anggaran</span>
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-poltekpar-primary/10 text-poltekpar-primary flex items-center justify-center"><i className="fa-solid fa-money-bill-wave"></i></div><span className="text-lg font-black text-poltekpar-primary">Rp {Number(selectedPkm.total_anggaran || 0).toLocaleString('id-ID')}</span></div>
                                    </div>
                                    {selectedPkm.testimoni && selectedPkm.testimoni.length > 0 && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Testimoni</span>
                                            <div className="space-y-3">{selectedPkm.testimoni.map((testimoni, index) => {
                                                const isLink = /^https?:\/\//i.test(testimoni.pesan_ulasan ?? '');
                                                if (isLink) {
                                                    return (
                                                        <a key={index} href={testimoni.pesan_ulasan} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-poltekpar-primary/5 hover:border-poltekpar-primary/30 transition-colors group">
                                                            <div className="w-7 h-7 rounded-lg bg-poltekpar-primary/10 text-poltekpar-primary flex items-center justify-center flex-shrink-0 group-hover:bg-poltekpar-primary group-hover:text-white transition-colors"><i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i></div>
                                                            <span className="text-xs font-bold text-poltekpar-primary truncate">{testimoni.nama_pemberi || 'Lihat Testimoni'}</span>
                                                        </a>
                                                    );
                                                }
                                                return (
                                                    <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-slate-700">{testimoni.nama_pemberi}</span><div className="flex gap-0.5">{[...Array(5)].map((_, starIndex) => <i key={starIndex} className={`fa-solid fa-star text-[10px] ${starIndex < testimoni.rating ? 'text-poltekpar-gold' : 'text-slate-200'}`}></i>)}</div></div><p className="text-[11px] text-slate-500 leading-relaxed">{testimoni.pesan_ulasan}</p></div>
                                                );
                                            })}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4 sm:p-8 pb-4 bg-white/95 backdrop-blur-xl z-20 border-b border-slate-100 flex-shrink-0 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar PKM</h3>
                                    <button onClick={() => setIsListSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                                </div>
                                <div className="relative">
                                    <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input type="text" placeholder="Cari desa, kegiatan, lokasi..." value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} className="w-full bg-slate-50 border border-slate-100 placeholder:text-slate-400 text-slate-700 text-sm font-bold rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-poltekpar-primary focus:bg-white transition-all shadow-inner" />
                                </div>
                            </div>
                            <div className="p-4 sm:p-8 pt-4 overflow-y-auto flex-1 space-y-3 sm:space-y-4 custom-scrollbar overscroll-contain">
                                {filteredPkmData.map((pkm) => {
                                    const typeMeta = typesMeta.find(t => t.key === normalizeTypeKey(pkm?.jenis_pkm));
                                    const typeColor = typeMeta ? typeMeta.color : '#15325F';
                                    return (
                                        <button key={pkm.id} onClick={() => setSelectedPkm(pkm)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 text-left hover:bg-poltekpar-primary hover:text-white hover:border-poltekpar-primary transition-all group shadow-sm cursor-pointer">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3 w-[92%]"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm group-hover:ring-2 group-hover:ring-white/50" style={{ backgroundColor: typeColor }}></div><div className="font-black text-[13px] sm:text-sm text-slate-800 group-hover:text-white transition-colors truncate">{normalizeText(pkm.nama) || 'Tanpa Judul'}</div></div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 group-hover:text-white/80">
                                                <span className="flex items-center gap-1.5"><i className="fa-solid fa-location-dot"></i> {normalizeText(pkm.desa) || '-'}</span>
                                                <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar"></i> {pkm.tahun}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {filteredPkmData.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <i className="fa-solid fa-folder-open text-3xl mb-3"></i>
                                        <p className="text-xs font-bold">Tidak ada PKM ditemukan</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="border-t border-slate-100"><LandingCharts pkmData={pkmData} /></div>
            </div>
        </div>
    );
}
