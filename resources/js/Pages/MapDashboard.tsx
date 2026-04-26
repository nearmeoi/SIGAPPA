import React, { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from '@inertiajs/react';
import Layout from '@/Layouts/DefaultLayout';
import ActionFeedbackDialog from '@/Components/ActionFeedbackDialog';
import { FeedbackDialogProps } from '@/types';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const getStatusBadge = (status: string): string => status === 'berlangsung' ? 'status-open' : 'status-closed';
const getStatusIcon = (status: string): string => status === 'berlangsung' ? 'fa-spinner fa-spin' : 'fa-check-double';
const getStatusText = (status: string): string => status === 'berlangsung' ? 'Berlangsung' : 'Selesai';

interface PkmData {
    id: number;
    nama: string;
    tahun: number;
    status: 'berlangsung' | 'selesai';
    deskripsi: string;
    thumbnail?: string;
    laporan?: string;
    dokumentasi?: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    lat: string;
    lng: string;
}

const createCustomIcon = (status: string) => {
    const markerColor = status === 'berlangsung' ? '#DCAF67' : '#15325F'; // Gold for Ongoing, Blue for Finished

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="marker-container relative" style="width: 48px; height: 48px;">
                <div class="marker-pulse absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${markerColor}"></div>
                <div class="marker-pin absolute inset-1 flex items-center justify-center rounded-2xl shadow-xl transform rotate-45 border-2 border-white" style="background-color: ${markerColor}; width: 36px; height: 36px;">
                    <i class="fa-solid fa-location-dot text-white text-lg transform -rotate-45"></i>
                </div>
                <div class="marker-dot absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md"></div>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50],
    });
};

interface MapEventsProps {
    isPickingLocation: boolean;
    onLocationPicked: (latlng: L.LatLng) => void;
    setSidebarPkm: React.Dispatch<React.SetStateAction<PkmData | null>>;
}

function MapEvents({ isPickingLocation, onLocationPicked, setSidebarPkm }: MapEventsProps): null {
    useMapEvents({
        click(event) {
            if (isPickingLocation) {
                onLocationPicked(event.latlng);
            } else {
                setSidebarPkm(null);
            }
        },
    });

    return null;
}

interface FormData {
    id: number | null;
    nama: string;
    tahun: number;
    status: 'berlangsung' | 'selesai';
    deskripsi: string;
    thumbnail: string;
    laporan: string;
    dokumentasi: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    lat: string;
    lng: string;
}

export default function MapDashboard() {
    const [pkmData, setPkmData] = useState<PkmData[]>([
        {
            id: 1,
            nama: 'Pemberdayaan UMKM Kripik Pisang',
            tahun: 2025,
            status: 'selesai',
            deskripsi: 'Program pendampingan pemasaran digital dan perbaikan kemasan untuk industri rumah tangga kripik pisang di wilayah Tamalanrea.',
            thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
            laporan: '',
            dokumentasi: 'https://drive.google.com/',
            provinsi: 'Sulawesi Selatan',
            kabupaten: 'Makassar',
            kecamatan: 'Tamalanrea',
            desa: 'Bira',
            lat: '-5.135',
            lng: '119.495',
        },
        {
            id: 2,
            nama: 'Edukasi Sanitasi Lingkungan',
            tahun: 2026,
            status: 'berlangsung',
            deskripsi: 'Penyuluhan mengenai pentingnya memilah sampah organik dan non-organik serta pembuatan bank sampah mandiri tingkat RW.',
            thumbnail: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
            laporan: '',
            dokumentasi: '',
            provinsi: 'Sulawesi Selatan',
            kabupaten: 'Makassar',
            kecamatan: 'Tamalanrea',
            desa: 'Tamalanrea Indah',
            lat: '-5.13',
            lng: '119.485',
        },
    ]);

    const [sidebarPkm, setSidebarPkm] = useState<PkmData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [isModalHiddenTemporarily, setIsModalHiddenTemporarily] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialogProps>({ show: false, type: 'success', title: '', message: '' });
    const [formData, setFormData] = useState<FormData>({
        id: null,
        nama: '',
        tahun: 2026,
        status: 'berlangsung',
        deskripsi: '',
        thumbnail: '',
        laporan: '',
        dokumentasi: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        lat: '',
        lng: '',
    });
    const dataEntryIssues: string[] = [];
    if (!formData.nama.trim()) dataEntryIssues.push('Nama kegiatan PKM wajib diisi.');
    if (!String(formData.tahun).trim()) dataEntryIssues.push('Tahun kegiatan wajib dipilih.');
    if (!formData.status) dataEntryIssues.push('Status kegiatan wajib dipilih.');
    if (!formData.deskripsi.trim()) dataEntryIssues.push('Deskripsi kegiatan wajib diisi.');
    if (!formData.id && !formData.thumbnail) dataEntryIssues.push('Thumbnail gambar wajib dipilih untuk data PKM baru.');
    if (!formData.provinsi.trim()) dataEntryIssues.push('Provinsi wajib diisi.');
    if (!formData.kabupaten.trim()) dataEntryIssues.push('Kabupaten atau kota wajib diisi.');
    if (!formData.kecamatan.trim()) dataEntryIssues.push('Kecamatan wajib diisi.');
    if (!formData.desa.trim()) dataEntryIssues.push('Desa atau kelurahan wajib diisi.');
    if (!String(formData.lat).trim() || !String(formData.lng).trim()) dataEntryIssues.push('Lokasi pada peta wajib dipilih terlebih dahulu.');
    const hasStartedDataEntry = Boolean(
        formData.nama.trim() ||
        formData.deskripsi.trim() ||
        formData.thumbnail ||
        formData.provinsi.trim() ||
        formData.kabupaten.trim() ||
        formData.kecamatan.trim() ||
        formData.desa.trim() ||
        String(formData.lat).trim() ||
        String(formData.lng).trim()
    );

    const handleMarkerClick = (pkm: PkmData) => {
        setSidebarPkm(pkm);
    };

    const handleEditPKM = (pkm: PkmData) => {
        setFormData({ ...pkm, thumbnail: pkm.thumbnail || '', laporan: pkm.laporan || '', dokumentasi: pkm.dokumentasi || '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsPickingLocation(false);
        setIsModalHiddenTemporarily(false);
        setFormData({
            id: null,
            nama: '',
            tahun: 2026,
            status: 'berlangsung',
            deskripsi: '',
            thumbnail: '',
            laporan: '',
            dokumentasi: '',
            provinsi: '',
            kabupaten: '',
            kecamatan: '',
            desa: '',
            lat: '',
            lng: '',
        });
    };

    const handlePickLocation = () => {
        setIsPickingLocation(true);
        setIsModalHiddenTemporarily(true);
    };

    const onLocationPicked = (latlng: L.LatLng) => {
        setFormData((prev) => ({
            ...prev,
            lat: latlng.lat.toFixed(5),
            lng: latlng.lng.toFixed(5),
        }));
        setIsPickingLocation(false);
        setIsModalHiddenTemporarily(false);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setFormData((prev) => ({ ...prev, thumbnail: loadEvent.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (dataEntryIssues.length > 0) {
            setFeedbackDialog({
                show: true,
                type: 'error',
                title: 'Data Belum Bisa Disimpan',
                message: dataEntryIssues[0],
            });
            return;
        }

        if (formData.id) {
            setPkmData((prev) => prev.map((item) => (item.id === formData.id ? { ...item, ...formData } as PkmData : item)));
            setSidebarPkm(null);
        } else {
            setPkmData((prev) => [...prev, { ...formData, id: Date.now() } as PkmData]);
        }

        handleCloseModal();
        setFeedbackDialog({
            show: true,
            type: 'success',
            title: 'Data Berhasil Disimpan',
            message: 'Data PKM berhasil disimpan ke peta dan siap ditampilkan pada dashboard.',
        });
    };

    return (
        <Layout>
            <div className={`min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col relative overflow-hidden ${isPickingLocation ? 'cursor-crosshair' : ''}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                
                {/* Header Section */}
                <section className="bg-white border-b border-slate-100 px-8 py-6 relative z-10">
                    <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-poltekpar-navy flex items-center justify-center text-white">
                                    <i className="fa-solid fa-map-location-dot"></i>
                                </div>
                                Peta Sebaran P3M
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 no-underline">
                                <Link href="/" className="text-xs font-bold text-slate-400 hover:text-poltekpar-primary transition-colors">Beranda</Link>
                                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
                                <span className="text-xs font-bold text-poltekpar-navy">Peta Sebaran</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                                 <div className="flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full bg-poltekpar-gold shadow-[0_0_8px_rgba(234,196,73,0.5)]"></span>
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Berlangsung</span>
                                 </div>
                                 <div className="w-px h-4 bg-slate-200"></div>
                                 <div className="flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full bg-poltekpar-primary"></span>
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selesai</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </section>

                {/* Map Interface */}
                <section className="flex-grow flex relative overflow-hidden">
                    <div className="flex-grow relative z-0">
                        <MapContainer center={[-5.132, 119.49]} zoom={15} className="w-full h-full" zoomControl={false}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            {pkmData.map((pkm) => (
                                <Marker
                                    key={pkm.id}
                                    position={[parseFloat(pkm.lat), parseFloat(pkm.lng)]}
                                    icon={createCustomIcon(pkm.status)}
                                    eventHandlers={{ click: () => handleMarkerClick(pkm) }}
                                />
                            ))}
                            <MapEvents
                                isPickingLocation={isPickingLocation}
                                onLocationPicked={onLocationPicked}
                                setSidebarPkm={setSidebarPkm}
                            />
                        </MapContainer>

                        {/* Custom Map Controls */}
                        <div className="absolute top-6 left-6 z-[400] flex flex-col gap-2">
                             <button onClick={() => setIsModalOpen(true)} className="w-14 h-14 bg-white text-poltekpar-primary rounded-2xl shadow-2xl flex items-center justify-center text-xl hover:bg-poltekpar-primary hover:text-white transition-all transform hover:scale-105 active:scale-95 group relative border border-slate-100">
                                <i className="fa-solid fa-plus"></i>
                                <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">Tambah Data PKM</span>
                             </button>
                        </div>

                        {/* Location Picking Hud */}
                        {isPickingLocation && (
                            <div className="absolute inset-0 bg-poltekpar-navy/20 backdrop-blur-[2px] z-[500] flex items-center justify-center p-6">
                                <div className="bg-white px-8 py-5 rounded-3xl shadow-2xl border-4 border-poltekpar-primary animate-bounce-subtle flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-poltekpar-primary/10 flex items-center justify-center text-poltekpar-primary">
                                        <i className="fa-solid fa-location-crosshairs text-2xl animate-spin-slow"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-slate-900 leading-none">Mode Pemilihan Lokasi</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Klik pada peta untuk menaruh pin (ESC untuk batal)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Premium Sidebar Info */}
                    <div className={`fixed lg:relative top-0 right-0 h-full w-[420px] bg-white border-l border-slate-100 shadow-2xl z-[1000] p-8 overflow-y-auto transition-transform duration-500 ease-soft-spring ${!sidebarPkm ? 'translate-x-full lg:hidden' : 'translate-x-0'}`}>
                        {sidebarPkm && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${sidebarPkm.status === 'berlangsung' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {sidebarPkm.status}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">Tahun {sidebarPkm.tahun}</span>
                                    </div>
                                    <button onClick={() => setSidebarPkm(null)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-xl shadow-poltekpar-navy/10 group">
                                     <div 
                                        className="w-full h-full bg-slate-100 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                        style={sidebarPkm.thumbnail ? { backgroundImage: `url(${sidebarPkm.thumbnail})` } : {}}
                                     >
                                         {!sidebarPkm.thumbnail && (
                                             <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                 <i className="fa-solid fa-mountain-sun text-5xl"></i>
                                             </div>
                                         )}
                                     </div>
                                     <div className="absolute inset-0 bg-gradient-to-t from-poltekpar-navy/70 via-poltekpar-navy/20 to-transparent"></div>
                                     <div className="absolute bottom-6 left-6 right-6">
                                         <h2 className="text-xl font-bold text-white leading-tight drop-shadow-md">{sidebarPkm.nama}</h2>
                                     </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-poltekpar-primary flex-shrink-0">
                                             <i className="fa-solid fa-location-dot"></i>
                                         </div>
                                         <div>
                                             <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Lokasi Kegiatan</span>
                                             <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                {sidebarPkm.desa}, Kec. {sidebarPkm.kecamatan}, {sidebarPkm.kabupaten}, {sidebarPkm.provinsi}
                                             </p>
                                         </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Deskripsi Program</span>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed text-justify">
                                            {sidebarPkm.deskripsi}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Latitude</span>
                                            <span className="text-xs font-bold text-poltekpar-navy">{sidebarPkm.lat}</span>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Longitude</span>
                                            <span className="text-xs font-bold text-poltekpar-navy">{sidebarPkm.lng}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-3">
                                         <button disabled={!sidebarPkm.dokumentasi} onClick={() => window.open(sidebarPkm.dokumentasi, '_blank')} className="w-full py-4 bg-white border-2 border-poltekpar-primary text-poltekpar-primary font-bold rounded-2xl hover:bg-poltekpar-primary hover:text-white transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-poltekpar-primary">
                                             <i className="fa-solid fa-camera-retro"></i> Lihat Dokumentasi
                                         </button>
                                         <button onClick={() => handleEditPKM(sidebarPkm)} className="w-full py-4 bg-poltekpar-navy text-white font-bold rounded-2xl hover:bg-poltekpar-primary transition-all flex items-center justify-center gap-3 text-sm">
                                             <i className="fa-solid fa-pen-to-square"></i> Edit Data PKM
                                         </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!sidebarPkm && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 transition-transform hover:scale-110 duration-300">
                                    <i className="fa-solid fa-hand-pointer text-4xl"></i>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Pilih Marker</h3>
                                <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed tracking-wide">Pilih salah satu pin lokasi pada peta untuk melihat detail kegiatan secara komprehensif</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Premium Data Editor Modal */}
            {isModalOpen && !isModalHiddenTemporarily && (
                <div className="fixed inset-0 bg-poltekpar-navy/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4 lg:p-10">
                    <div className="bg-white w-full max-w-5xl h-[90vh] lg:h-auto lg:max-h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        
                        <div className="p-8 lg:p-10 border-b border-slate-50 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-poltekpar-primary to-poltekpar-navy flex items-center justify-center text-white shadow-xl shadow-poltekpar-primary/20">
                                    <i className="fa-solid fa-database text-xl"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                                        {formData.id ? 'Perbarui Data PKM' : 'Registrasi Data Baru'}
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 bg-poltekpar-gold rounded-full"></span>
                                        Input Basis Data Geospasial
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 lg:p-10 space-y-12">
                             <form onSubmit={handleSubmit} className="space-y-12">
                                {/* Section: Basic Info */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-1">
                                        <h4 className="text-[11px] font-black text-poltekpar-primary uppercase tracking-[0.2em] mb-4">Informasi Utama</h4>
                                        <div className="space-y-4">
                                            <div className="relative group rounded-[24px] overflow-hidden border-2 border-dashed border-slate-200 aspect-[4/3] flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-poltekpar-primary transition-all cursor-pointer">
                                                {formData.thumbnail ? (
                                                    <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center p-6">
                                                        <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 mb-3 group-hover:text-poltekpar-primary transition-colors"></i>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Gambar Thumbnail</p>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 leading-relaxed text-center px-4 uppercase tracking-tighter">Ukuran rekomendasi 4:3 (Maks 2MB)</p>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Nama Kegiatan P3M <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.nama}
                                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:border-poltekpar-primary focus:ring-4 focus:ring-poltekpar-primary/5 transition-all outline-none"
                                                placeholder="Contoh: Pemberdayaan UMKM Kripik..."
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Tahun <span className="text-red-500">*</span></label>
                                                <select
                                                    value={formData.tahun}
                                                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value, 10) })}
                                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-poltekpar-primary transition-all outline-none"
                                                >
                                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Status Kegiatan <span className="text-red-500">*</span></label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'berlangsung' | 'selesai' })}
                                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-poltekpar-primary transition-all outline-none"
                                                >
                                                    <option value="berlangsung">Berlangsung</option>
                                                    <option value="selesai">Selesai</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-50 w-full"></div>

                                {/* Section: Location Details */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-1">
                                        <h4 className="text-[11px] font-black text-poltekpar-primary uppercase tracking-[0.2em] mb-4">Metadata Geografis</h4>
                                        <div className="space-y-3">
                                            <button type="button" onClick={handlePickLocation} className="w-full py-5 bg-gradient-to-r from-poltekpar-navy to-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 text-xs hover:-translate-y-1 transition-all active:scale-[0.98]">
                                                <i className="fa-solid fa-location-crosshairs text-lg"></i> PILIH DARI PETA
                                            </button>
                                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100/50">
                                                <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-tighter">
                                                    Manual koordinat terkunci. Silahkan gunakan fitur "PILIH DARI PETA" untuk akurasi data.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {['Provinsi', 'Kabupaten', 'Kecamatan', 'Desa'].map(field => (
                                            <div key={field} className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">{field}</label>
                                                <input
                                                    type="text"
                                                    value={(formData as any)[field.toLowerCase()]}
                                                    onChange={(e) => setFormData({ ...formData, [field.toLowerCase()]: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:border-poltekpar-primary transition-all outline-none"
                                                    placeholder={`Masukan nama ${field.toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Latitude</label>
                                            <input type="text" value={formData.lat} readOnly className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-400 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Longitude</label>
                                            <input type="text" value={formData.lng} readOnly className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-400 outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-50 w-full"></div>

                                {/* Section: Content */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={formData.deskripsi}
                                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:border-poltekpar-primary transition-all outline-none min-h-[160px]"
                                            placeholder="Tuliskan latar belakang, tujuan, dan capaian program di area ini..."
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Tautan Dokumentasi</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-poltekpar-primary transition-colors">
                                                    <i className="fa-solid fa-link"></i>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={formData.dokumentasi}
                                                    onChange={(e) => setFormData({ ...formData, dokumentasi: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-poltekpar-primary transition-all outline-none"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Tautan Laporan (Opsional)</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-poltekpar-primary transition-colors">
                                                    <i className="fa-solid fa-file-pdf"></i>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={formData.laporan}
                                                    onChange={(e) => setFormData({ ...formData, laporan: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-poltekpar-primary transition-all outline-none"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </form>
                        </div>

                        <div className="p-8 lg:p-10 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/30">
                            <div className="flex items-center gap-4 text-rose-500 font-bold text-xs uppercase tracking-widest min-h-[32px]">
                                {hasStartedDataEntry && dataEntryIssues.length > 0 && (
                                    <>
                                        <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
                                        <span>{dataEntryIssues[0]}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button type="button" onClick={handleCloseModal} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                                    Batalkan
                                </button>
                                <button type="button" onClick={handleSubmit} disabled={dataEntryIssues.length > 0} className="px-10 py-4 bg-poltekpar-primary hover:bg-poltekpar-navy text-white font-black rounded-2xl shadow-xl shadow-poltekpar-primary/20 disabled:opacity-30 transition-all flex items-center gap-3">
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    {formData.id ? 'UPDATE DATA' : 'SIMPAN DATA PKM'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ActionFeedbackDialog
                show={feedbackDialog.show}
                type={feedbackDialog.type}
                title={feedbackDialog.title}
                message={feedbackDialog.message}
                onClose={() => {
                    setFeedbackDialog({ ...feedbackDialog, show: false });
                    setIsSuccessModalOpen(false);
                }}
            />
        </Layout>
    );
}
