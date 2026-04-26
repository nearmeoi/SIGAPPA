import React, { useState, useRef, useCallback } from 'react';
import { router, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import Toast from '../../../Components/Toast';
import {
    Activity, ArrowLeft, Image, CheckCircle, Save,
    MapPin, FileText, Trash2, Search, X, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons natively with safety check
if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    });
}

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
    useMapEvents({ click(e) { onClick(e.latlng); } });
    return null;
}

function FlyToPosition({ lat, lng }: { lat: number | null; lng: number | null }) {
    const map = useMap();
    React.useEffect(() => {
        if (lat !== null && lng !== null) {
            map.flyTo([lat, lng], 15, { duration: 1.2 });
        }
    }, [lat, lng]);
    return null;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
}

interface Arsip {
    id_arsip: number;
    nama_dokumen: string;
    jenis_arsip: string;
    url_dokumen?: string;
    keterangan?: string;
}

interface Aktivitas {
    id_aktivitas: number;
    status_pelaksanaan: string;
    catatan_pelaksanaan?: string;
    url_thumbnail?: string;
    arsip?: Arsip[];
    testimoni?: any[];
    pengajuan: {
        id_pengajuan: number;
        kode_unik?: string;
        judul_kegiatan: string;
        status_pengajuan: string;
        created_at: string;
        provinsi?: string;
        kota_kabupaten?: string;
        kecamatan?: string;
        kelurahan_desa?: string;
        alamat_lengkap?: string;
        latitude?: number;
        longitude?: number;
        jenis_pkm?: { nama_jenis: string };
        user?: { name: string };
    };
}

interface Props {
    aktivitas: Aktivitas;
}

const Detail: React.FC<Props> = ({ aktivitas }) => {
    const pengajuan = aktivitas.pengajuan;
    const [statusAktivitas, setStatusAktivitas] = useState<string>(aktivitas.status_pelaksanaan === 'persiapan' ? 'belum_mulai' : (aktivitas.status_pelaksanaan || 'belum_mulai'));
    const [thumbnailAktivitas, setThumbnailAktivitas] = useState<File | null>(null);

    // Map picker state
    const [lat, setLat] = useState<number | null>(pengajuan.latitude ?? null);
    const [lng, setLng] = useState<number | null>(pengajuan.longitude ?? null);

    // Address fields state
    const [provinsi, setProvinsi] = useState(pengajuan.provinsi || '');
    const [kotaKabupaten, setKotaKabupaten] = useState(pengajuan.kota_kabupaten || '');
    const [kecamatan, setKecamatan] = useState(pengajuan.kecamatan || '');
    const [kelurahanDesa, setKelurahanDesa] = useState(pengajuan.kelurahan_desa || '');
    const [alamatLengkap, setAlamatLengkap] = useState(pengajuan.alamat_lengkap || '');

    // Nominatim search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMapClick = (latlng: L.LatLng) => {
        const newLat = Math.round(latlng.lat * 10000000) / 10000000;
        const newLng = Math.round(latlng.lng * 10000000) / 10000000;
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
    };

    const reverseGeocode = async (latVal: number, lngVal: number) => {
        try {
            const res = await fetch(`/api/reverse-geocode?lat=${latVal}&lon=${lngVal}`);
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;
                setProvinsi(addr.state || addr.province || '');
                setKotaKabupaten(addr.city || addr.county || addr.regency || addr.state_district || '');
                setKecamatan(addr.city_district || addr.suburb || addr.county || '');
                setKelurahanDesa(addr.village || addr.town || addr.hamlet || addr.quarter || '');
                setAlamatLengkap(data.display_name || '');
            }
        } catch (e) {
            console.error('Reverse geocode error:', e);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (query.length < 2) { setSearchResults([]); setShowResults(false); return; }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSearchResults(data);
                setShowResults(true);
            } catch (e) {
                console.error('Search error:', e);
                setSearchResults([]);
                setShowResults(true);
            }
            setSearching(false);
        }, 400);
    };

    const selectSearchResult = (result: NominatimResult) => {
        setLat(Math.round(parseFloat(result.lat) * 10000000) / 10000000);
        setLng(Math.round(parseFloat(result.lon) * 10000000) / 10000000);
        setShowResults(false);
        setSearchQuery(result.display_name.split(',').slice(0, 3).join(','));
    };

    const handleSimpan = () => {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('status_pelaksanaan', statusAktivitas);
        if (thumbnailAktivitas) {
            formData.append('thumbnail', thumbnailAktivitas);
        }
        // Include location data in the same save action
        if (lat !== null && lng !== null) {
            formData.append('latitude', String(lat));
            formData.append('longitude', String(lng));
            formData.append('provinsi', provinsi);
            formData.append('kota_kabupaten', kotaKabupaten);
            formData.append('kecamatan', kecamatan);
            formData.append('kelurahan_desa', kelurahanDesa);
            formData.append('alamat_lengkap', alamatLengkap);
            formData.append('save_location', '1');
        }
        router.post(`/admin/aktivitas/${aktivitas.id_aktivitas}`, formData);
    };

    const handleDelete = () => setConfirmOpen(true);
    const confirmDelete = () => {
        router.delete(`/admin/aktivitas/${aktivitas.id_aktivitas}`, {
            onFinish: () => setConfirmOpen(false),
        });
    };
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });
    const closeToast = useCallback(() => setToast(prev => ({ ...prev, show: false })), []);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setToast({ show: true, title: 'Tautan Disalin!', message: `Tautan ${label} berhasil disalin ke clipboard.` });
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Full address string
    const fullAddress = [pengajuan.alamat_lengkap, pengajuan.kelurahan_desa, pengajuan.kecamatan, pengajuan.kota_kabupaten, pengajuan.provinsi].filter(Boolean).join(', ');

    return (
        <AdminLayout title="">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/aktivitas" className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold text-zinc-900 leading-tight truncate">Detail Aktivitas</h1>
                    <p className="text-[13px] text-zinc-500 mt-1">
                        Pengajuan dari <span className="font-medium text-zinc-700">{pengajuan.user?.name || '—'}</span>
                        {pengajuan.created_at && ` pada tanggal ${formatDate(pengajuan.created_at)}`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tautan Publik Pengumpulan Data */}
                    {['diterima', 'berlangsung', 'selesai'].includes(pengajuan.status_pengajuan) && (
                        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                            <div className="mt-1 flex-shrink-0 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            </div>
                            <div className="w-full">
                                <div className="text-[14px] font-bold text-blue-900 mb-1">Tautan Publik Pengumpulan Data</div>
                                <p className="text-[12px] text-blue-700 mb-4">Bagikan tautan berikut kepada pengusul kegiatan agar mereka dapat mengunggah arsip laporan & testimoni kegiatan secara mandiri.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <FileText size={14} className="text-amber-500" /> Form Pengumpulan Arsip
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input readOnly value={`${window.location.origin}/kumpul-arsip/${pengajuan.kode_unik || pengajuan.id_pengajuan}`} className="text-xs w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none text-slate-600 font-medium" />
                                            <button type="button" onClick={() => copyToClipboard(`${window.location.origin}/kumpul-arsip/${pengajuan.kode_unik || pengajuan.id_pengajuan}`, 'Pengumpulan Arsip')} className="h-8 w-8 flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md" title="Salin Tautan">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Form Pengisian Testimoni
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input readOnly value={`${window.location.origin}/testimoni/${pengajuan.kode_unik || pengajuan.id_pengajuan}`} className="text-xs w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none text-slate-600 font-medium" />
                                            <button type="button" onClick={() => copyToClipboard(`${window.location.origin}/testimoni/${pengajuan.kode_unik || pengajuan.id_pengajuan}`, 'Testimoni')} className="h-8 w-8 flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md" title="Salin Tautan">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pengaturan Aktivitas */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                            <Activity size={16} className="text-zinc-500" />
                            <h2 className="text-[14px] font-semibold text-zinc-900">Pengaturan Aktivitas</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-2">Thumbnail</label>
                                <label htmlFor="thumb-upload" className="flex items-center gap-3 px-4 py-4 border border-dashed border-zinc-300 bg-zinc-50 rounded-xl cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-all shadow-sm">
                                    {thumbnailAktivitas ? (
                                        <><CheckCircle size={20} className="text-emerald-500 flex-shrink-0" /><span className="text-[13px] font-medium text-zinc-800 truncate">{thumbnailAktivitas.name}</span></>
                                    ) : (
                                        <><Image size={20} className="text-zinc-400 flex-shrink-0" /><div className="flex flex-col"><span className="text-[13px] font-medium text-zinc-700">Pilih thumbnail...</span><span className="text-[11px] text-zinc-500 mt-0.5">Maks 2MB. JPG, PNG.</span></div><span className="ml-auto text-indigo-600 text-[12px] font-semibold bg-indigo-50 px-3 py-1 rounded-md">Browse</span></>
                                    )}
                                    <input id="thumb-upload" type="file" className="sr-only" accept="image/*" onChange={e => setThumbnailAktivitas(e.target.files?.[0] || null)} />
                                </label>
                                {aktivitas.url_thumbnail && !thumbnailAktivitas && (
                                    <div className="mt-3"><p className="text-[11px] text-zinc-500 mb-1.5">Thumbnail Saat Ini:</p><img src={aktivitas.url_thumbnail} alt="Current" className="h-32 object-cover rounded-lg border border-zinc-200 shadow-sm" /></div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-2">Status Pelaksanaan</label>
                                <select value={statusAktivitas} onChange={e => setStatusAktivitas(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all cursor-pointer shadow-sm">
                                    <option value="belum_mulai"> Belum Mulai</option>
                                    <option value="berjalan">🔵 Berjalan</option>
                                    <option value="selesai">🟢 Selesai</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Map Picker with Nominatim Search */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-visible">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2 rounded-t-xl">
                            <MapPin size={16} className="text-zinc-500" />
                            <h2 className="text-[14px] font-semibold text-zinc-900">Koordinat Lokasi</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Address from user */}
                            {fullAddress && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Alamat dari Pengaju</div>
                                    <p className="text-[13px] text-blue-900 font-medium">{fullAddress}</p>
                                </div>
                            )}

                            {/* Nominatim Search */}
                            <div className="relative">
                                <label className="block text-[12px] font-medium text-zinc-600 mb-2">Cari Lokasi (OpenStreetMap)</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Ketik nama jalan, gedung, atau tempat..."
                                        className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-10 py-2.5 text-[13px] text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 shadow-sm"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                {searching && <p className="text-[11px] text-zinc-400 mt-1">Mencari...</p>}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
                                        {searchResults.map((r, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectSearchResult(r)}
                                                type="button"
                                                className="w-full text-left px-4 py-2.5 text-[12px] text-zinc-700 hover:bg-blue-50 hover:text-blue-900 border-b border-zinc-100 last:border-0 transition-colors flex items-center gap-2"
                                            >
                                                <MapPin size={12} className="text-zinc-400 flex-shrink-0" />
                                                <span className="truncate">{r.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                                    <div className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl p-4 text-center">
                                        <p className="text-[12px] text-zinc-500">Tidak ada hasil untuk "{searchQuery}"</p>
                                        <p className="text-[11px] text-zinc-400 mt-1">Coba kata kunci lain, misalnya: "Paccerakkang Makassar"</p>
                                    </div>
                                )}
                            </div>

                            {/* Map */}
                            <div className="rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                                <MapContainer
                                    center={[lat ?? -5.14, lng ?? 119.48]}
                                    zoom={13}
                                    style={{ height: '280px', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution=''
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {lat !== null && lng !== null && <Marker position={[lat, lng]} />}
                                    <MapClickHandler onClick={handleMapClick} />
                                    <FlyToPosition lat={lat} lng={lng} />
                                </MapContainer>
                            </div>
                            <p className="text-[11px] text-zinc-400">Klik pada peta atau gunakan kolom pencarian di atas untuk mengatur koordinat.</p>

                            {/* Lat/Lng Inputs */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[11px] font-medium text-zinc-500">Latitude</label>
                                    <input type="number" step="any" value={lat ?? ''} onChange={e => setLat(parseFloat(e.target.value) || null)}
                                        className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[11px] font-medium text-zinc-500">Longitude</label>
                                    <input type="number" step="any" value={lng ?? ''} onChange={e => setLng(parseFloat(e.target.value) || null)}
                                        className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
                                </div>
                            </div>

                            {/* Address Fields */}
                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                                <label className="text-[11px] font-semibold text-zinc-600">Alamat (otomatis dari peta, bisa diedit)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Provinsi</label>
                                        <input type="text" value={provinsi} onChange={e => setProvinsi(e.target.value)}
                                            className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Provinsi" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Kota / Kabupaten</label>
                                        <input type="text" value={kotaKabupaten} onChange={e => setKotaKabupaten(e.target.value)}
                                            className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Kota/Kabupaten" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Kecamatan</label>
                                        <input type="text" value={kecamatan} onChange={e => setKecamatan(e.target.value)}
                                            className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Kecamatan" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400">Kelurahan / Desa</label>
                                        <input type="text" value={kelurahanDesa} onChange={e => setKelurahanDesa(e.target.value)}
                                            className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Kelurahan/Desa" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-400">Alamat Lengkap</label>
                                    <textarea value={alamatLengkap} onChange={e => setAlamatLengkap(e.target.value)} rows={2}
                                        className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-zinc-200 resize-none" placeholder="Alamat lengkap..." />
                                </div>
                            </div>

                            <button onClick={handleSimpan}
                                className="w-full flex justify-center items-center gap-2 py-3 rounded-lg text-[14px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-md transition-colors">
                                <Save size={16} /> Simpan Semua Perubahan
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* Pengajuan Info */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <h2 className="text-[14px] font-semibold text-zinc-900">Detail Pengajuan</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div><div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Judul Kegiatan</div><div className="text-[13px] font-medium text-zinc-900 leading-snug">{pengajuan.judul_kegiatan}</div></div>
                            <div className="pt-3 border-t border-zinc-100">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status Pengajuan</div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase ${pengajuan.status_pengajuan === 'diterima' ? 'bg-emerald-50 text-emerald-700' : pengajuan.status_pengajuan === 'ditolak' ? 'bg-red-50 text-red-700' : pengajuan.status_pengajuan === 'selesai' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {pengajuan.status_pengajuan}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-zinc-100">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Lokasi</div>
                                <div className="text-[13px] font-medium text-zinc-900">{fullAddress || '—'}</div>
                            </div>
                            <div className="pt-3 border-t border-zinc-100">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Kategori</div>
                                <div className="text-[13px] font-medium text-zinc-900 flex items-center gap-1.5">
                                    <FileText size={14} className="text-zinc-400" />
                                    {pengajuan.jenis_pkm?.nama_jenis || '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dokumentasi & Arsip */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                            <FileText size={16} className="text-zinc-500" />
                            <h2 className="text-[14px] font-semibold text-zinc-900">Dokumentasi & Arsip</h2>
                            <span className="text-[11px] text-zinc-400 bg-zinc-200/50 px-2 py-0.5 rounded-full font-semibold">{aktivitas.arsip?.length || 0}</span>
                        </div>
                        {!aktivitas.arsip || aktivitas.arsip.length === 0 ? (
                            <div className="p-5 text-center text-zinc-400 text-[13px]">Belum ada dokumentasi yang diupload.</div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {aktivitas.arsip.map(arsip => (
                                    <div key={arsip.id_arsip} className="px-5 py-3 flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                                            <FileText size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-zinc-900 truncate">{arsip.nama_dokumen}</div>
                                            <div className="text-[11px] text-zinc-400">{arsip.jenis_arsip} {arsip.keterangan ? `• ${arsip.keterangan}` : ''}</div>
                                        </div>
                                        {arsip.url_dokumen && (
                                            <a href={arsip.url_dokumen} target="_blank" rel="noopener noreferrer"
                                                className="text-[12px] text-blue-600 font-medium hover:underline">Buka</a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Testimoni Link / Ulasan */}
                    {aktivitas.testimoni && aktivitas.testimoni.length > 0 && (
                        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                                <h2 className="text-[14px] font-semibold text-blue-900">Ulasan & Testimoni</h2>
                                <span className="bg-blue-200/50 text-blue-700 text-[11px] px-2 py-0.5 rounded-full font-bold">{aktivitas.testimoni.length} Rekam</span>
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {aktivitas.testimoni.map((t: any) => (
                                    <div key={t.id_testimoni} className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="text-[13px] font-bold text-zinc-900">{t.external_name || t.nama_pemberi || 'Testimoni & Feedback Publik'}</div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {[1,2,3,4,5].map(s => (
                                                        <svg key={s} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={s <= t.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={s <= t.rating ? "text-amber-400" : "text-zinc-300"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    ))}
                                                </div>
                                            </div>
                                            {t.external_link && (
                                                <a href={t.external_link} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm">
                                                    Lihat Testimoni
                                                </a>
                                            )}
                                        </div>
                                        {t.ulasan && <p className="text-[13px] text-zinc-600 italic mt-2 bg-zinc-50 p-3 rounded-lg border border-zinc-100">"{t.ulasan}"</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                            <h2 className="text-[14px] font-semibold text-red-700">Danger Zone</h2>
                        </div>
                        <div className="p-5">
                            <p className="text-[12px] text-zinc-500 mb-3">Menghapus aktivitas akan menyembunyikan data. Data tetap tersimpan dan dapat dipulihkan.</p>
                            <button onClick={handleDelete}
                                className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
                                <Trash2 size={14} /> Hapus Aktivitas
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .leaflet-control-attribution { display: none !important; }
                .leaflet-control-zoom { border: none !important; box-shadow: 0 1px 4px rgba(0,0,0,0.15) !important; }
                .leaflet-control-zoom a { border-radius: 6px !important; }
            `}</style>

            <Toast
                show={toast.show}
                type="success"
                title={toast.title}
                message={toast.message}
                onClose={closeToast}
            />

            <ConfirmDialog
                open={confirmOpen}
                title="Hapus Aktivitas"
                message="Aktivitas ini akan dihapus (soft delete). Data dapat dipulihkan oleh developer."
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
                variant="danger"
            />
        </AdminLayout>
    );
};

export default Detail;
