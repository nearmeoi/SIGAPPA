import React from 'react';
import MapLocationPicker from '@/Components/map/MapLocationPicker';

export interface LocationItem {
    id_ui: number;
    provinsi: string;
    kota_kabupaten: string;
    kecamatan: string;
    kelurahan_desa: string;
    alamat_lengkap: string;
    latitude: number | null;
    longitude: number | null;
}

interface LocationListProps {
    lokasiList: LocationItem[];
    collapsedLocations: Record<number, boolean>;
    toggleLocationCollapse: (idUi: number) => void;
    onUpdateLocation: (idx: number, newLocation: LocationItem) => void;
    onAddLocation: () => void;
    onRemoveLocation: (idx: number) => void;
    formatCoordinate: (val: unknown) => string | null;
}

export default function LocationList({
    lokasiList,
    collapsedLocations,
    toggleLocationCollapse,
    onUpdateLocation,
    onAddLocation,
    onRemoveLocation,
    formatCoordinate
}: LocationListProps) {
    return (
        <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">
                Lokasi Kegiatan PKM
            </h4>

            <div className="space-y-6">
                {lokasiList.map((lokasi, idx) => (
                    <div key={lokasi.id_ui} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
                        <div
                            className="flex justify-between items-center mb-4 cursor-pointer"
                            onClick={() => toggleLocationCollapse(lokasi.id_ui)}
                        >
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {lokasiList.length > 1 ? `Lokasi Kegiatan ${idx + 1}` : 'Lokasi Kegiatan'} {lokasi.kota_kabupaten ? ` - ${lokasi.kota_kabupaten}` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                {idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onRemoveLocation(idx); }}
                                        className="w-8 h-8 flex justify-center items-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="w-8 h-8 flex justify-center items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow-sm"
                                >
                                    <i className={`fa-solid fa-chevron-${collapsedLocations[lokasi.id_ui] ? 'down' : 'up'}`}></i>
                                </button>
                            </div>
                        </div>

                        {!collapsedLocations[lokasi.id_ui] && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Provinsi</label>
                                        <input
                                            type="text"
                                            value={lokasi.provinsi}
                                            onChange={e => onUpdateLocation(idx, { ...lokasi, provinsi: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                            placeholder="Provinsi"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kota/Kabupaten</label>
                                        <input
                                            type="text"
                                            value={lokasi.kota_kabupaten}
                                            onChange={e => onUpdateLocation(idx, { ...lokasi, kota_kabupaten: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                            placeholder="Kota/Kabupaten"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kecamatan</label>
                                        <input
                                            type="text"
                                            value={lokasi.kecamatan}
                                            onChange={e => onUpdateLocation(idx, { ...lokasi, kecamatan: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                            placeholder="Kecamatan"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 mb-1 block">Kelurahan/Desa</label>
                                        <input
                                            type="text"
                                            value={lokasi.kelurahan_desa}
                                            onChange={e => onUpdateLocation(idx, { ...lokasi, kelurahan_desa: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                            placeholder="Kelurahan/Desa"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="text-[13px] font-bold text-slate-600 mb-1 block">Alamat Lengkap</label>
                                    <textarea
                                        value={lokasi.alamat_lengkap}
                                        onChange={e => onUpdateLocation(idx, { ...lokasi, alamat_lengkap: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary min-h-[60px]"
                                        placeholder="Alamat lengkap lokasi kegiatan..."
                                    />
                                </div>
                                <div className="space-y-1.5 mt-4">
                                    <label className="text-[13px] font-bold text-slate-600 mb-1 block">Tandai Lokasi di Peta (Koordinat)</label>
                                    <p className="text-[10px] text-slate-500 mb-2">Geser peta atau klik untuk menandai lokasi spesifik agar mempermudah tim survei.</p>
                                    <MapLocationPicker
                                        latitude={lokasi.latitude}
                                        longitude={lokasi.longitude}
                                        onChange={(lat, lng, address) => {
                                            const newLoc = { ...lokasi, latitude: lat, longitude: lng };
                                            if (address) {
                                                if (address.state || address.province) newLoc.provinsi = address.state || address.province;
                                                if (address.city || address.town || address.county) newLoc.kota_kabupaten = address.city || address.town || address.county;
                                                if (address.suburb || address.village) newLoc.kecamatan = address.suburb || address.village;
                                                if (address.neighbourhood || address.residential || address.hamlet) newLoc.kelurahan_desa = address.neighbourhood || address.residential || address.hamlet;
                                            }
                                            onUpdateLocation(idx, newLoc);
                                        }}
                                    />
                                    {formatCoordinate(lokasi.latitude) && formatCoordinate(lokasi.longitude) ? (
                                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                            Lat: {formatCoordinate(lokasi.latitude)}, Lng: {formatCoordinate(lokasi.longitude)}
                                        </p>
                                    ) : lokasi.kelurahan_desa ? (
                                        <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse flex items-center gap-1">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                            Nama desa terisi namun titik peta belum ditandai. Mohon tandai di peta!
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={onAddLocation}
                    className="w-full py-3 bg-poltekpar-primary/10 hover:bg-poltekpar-primary hover:text-white text-poltekpar-primary rounded-xl text-sm font-bold border border-poltekpar-primary/20 hover:border-poltekpar-primary transition-all flex justify-center items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Tambah Lokasi Lainnya
                </button>
            </div>
        </div>
    );
}
