import React from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import MapLocationPicker from './MapLocationPicker';

const createLocation = () => ({
    id_ui: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    provinsi: '',
    kota_kabupaten: '',
    kecamatan: '',
    kelurahan_desa: '',
    alamat_lengkap: '',
    latitude: null as number | null,
    longitude: null as number | null,
});

const getLocationList = (data: any) => {
    if (Array.isArray(data.lokasi_list) && data.lokasi_list.length) {
        return data.lokasi_list;
    }

    return [{
        id_ui: 'lokasi-awal',
        provinsi: data.provinsi || '',
        kota_kabupaten: data.kota_kabupaten || '',
        kecamatan: data.kecamatan || '',
        kelurahan_desa: data.kelurahan_desa || '',
        alamat_lengkap: data.alamat_lengkap || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
    }];
};

const syncPrimaryLocation = (payload: any, locations: any[]) => {
    const primary = locations[0] || createLocation();

    return {
        ...payload,
        lokasi_list: locations,
        provinsi: primary.provinsi || '',
        kota_kabupaten: primary.kota_kabupaten || '',
        kecamatan: primary.kecamatan || '',
        kelurahan_desa: primary.kelurahan_desa || '',
        alamat_lengkap: primary.alamat_lengkap || '',
        latitude: primary.latitude ?? null,
        longitude: primary.longitude ?? null,
    };
};

export default function FormHistoris({ data, setData, listPegawai, listJenisPkm }: any) {
    const lokasiList = getLocationList(data);
    const handleChange = (field: string, val: any) => setData((p: any) => ({ ...p, [field]: val }));

    const updateLocation = (index: number, patch: any) => {
        setData((p: any) => {
            const locations = getLocationList(p).map((lokasi: any, i: number) => (
                i === index ? { ...lokasi, ...patch } : lokasi
            ));

            return syncPrimaryLocation(p, locations);
        });
    };

    const addLocation = () => {
        setData((p: any) => syncPrimaryLocation(p, [...getLocationList(p), createLocation()]));
    };

    const removeLocation = (index: number) => {
        setData((p: any) => {
            const locations = getLocationList(p).filter((_: any, i: number) => i !== index);
            return syncPrimaryLocation(p, locations.length ? locations : [createLocation()]);
        });
    };

    const handleArrayChange = (field: string, index: number, val: string) => {
        setData((p: any) => {
            const arr = [...p[field]];
            arr[index] = val;
            return { ...p, [field]: arr };
        });
    };

    const addArrayItem = (field: string) => {
        setData((p: any) => ({ ...p, [field]: [...p[field], ''] }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setData((p: any) => {
            const arr = p[field].filter((_: any, i: number) => i !== index);
            return { ...p, [field]: arr.length ? arr : [''] };
        });
    };

    const addLinkTambahan = () => {
        setData((p: any) => ({ ...p, link_tambahan: [...p.link_tambahan, { nama: '', url: '' }] }));
    };

    const updateLinkTambahan = (index: number, key: 'nama' | 'url', value: string) => {
        setData((p: any) => {
            const arr = [...p.link_tambahan];
            arr[index][key] = value;
            return { ...p, link_tambahan: arr };
        });
    };

    const removeLinkTambahan = (index: number) => {
        setData((p: any) => {
            const arr = p.link_tambahan.filter((_: any, i: number) => i !== index);
            return { ...p, link_tambahan: arr };
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">Informasi Umum</h2>

                <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Judul Kegiatan PKM <span className="text-red-500">*</span></label>
                    <input required value={data.judul_kegiatan} onChange={e => handleChange('judul_kegiatan', e.target.value)} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" placeholder="Masukkan judul..." />
                </div>

                <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Jenis PKM <span className="text-red-500">*</span></label>
                    <select required value={data.id_jenis_pkm} onChange={e => handleChange('id_jenis_pkm', e.target.value)} className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary bg-white">
                        {listJenisPkm.map((j: any) => <option key={j.id_jenis_pkm} value={j.id_jenis_pkm}>{j.nama_jenis}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
                    <div className="col-span-full">
                        <label className="flex items-center gap-2 text-[13px] font-medium text-zinc-700 bg-amber-50 border border-amber-100 p-3 rounded-lg w-fit cursor-pointer hover:bg-amber-100/70 transition-colors">
                            <input type="checkbox" checked={data.is_tahun_saja} onChange={e => handleChange('is_tahun_saja', e.target.checked)} className="rounded w-4 h-4 text-poltekpar-primary focus:ring-poltekpar-primary" />
                            Centang jika Anda hanya mengetahui tahun pelaksanaannya saja.
                        </label>
                    </div>

                    {data.is_tahun_saja ? (
                        <div className="col-span-full">
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Tahun Pelaksanaan <span className="text-red-500">*</span></label>
                            <input value={typeof data.tgl_mulai === 'string' && data.tgl_mulai.includes('-') ? data.tgl_mulai.split('-')[0] : (data.tgl_mulai || '')} onChange={e => {
                                const y = e.target.value.replace(/\D/g, '');
                                if (y.length <= 4) {
                                    handleChange('tgl_mulai', y ? `${y}-01-01` : '');
                                    handleChange('tgl_selesai', y ? `${y}-12-31` : '');
                                }
                            }} type="text" pattern="\d*" maxLength={4} className="w-full md:w-1/2 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Misal: 2023" />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Tanggal Mulai</label>
                                <input type="date" value={data.tgl_mulai} onChange={e => handleChange('tgl_mulai', e.target.value)} className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Tanggal Selesai</label>
                                <input type="date" value={data.tgl_selesai} onChange={e => handleChange('tgl_selesai', e.target.value)} className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">Pendanaan / RAB (Opsional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Total Anggaran (Rp)</label>
                        <input value={data.total_anggaran} onChange={e => handleChange('total_anggaran', e.target.value)} type="number" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Rincian Internal PT (Rp)</label>
                        <input value={data.dana_perguruan_tinggi} onChange={e => handleChange('dana_perguruan_tinggi', e.target.value)} type="number" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Rincian Pemerintah / Kementerian (Rp)</label>
                        <input value={data.dana_pemerintah} onChange={e => handleChange('dana_pemerintah', e.target.value)} type="number" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Lembaga Dalam (Rp)</label>
                        <input value={data.dana_lembaga_dalam} onChange={e => handleChange('dana_lembaga_dalam', e.target.value)} type="number" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Lembaga Luar (Rp)</label>
                        <input value={data.dana_lembaga_luar} onChange={e => handleChange('dana_lembaga_luar', e.target.value)} type="number" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">Tim Pelaksana</h2>

                <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Ketua Tim (Dosen) <span className="text-red-500">*</span></label>
                    <input required value={data.ketua_tim} onChange={e => handleChange('ketua_tim', e.target.value)} type="text" list="pegawai-list" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Nama ketua tim..." />
                </div>

                <div className="space-y-4 pt-2">
                    {/* Dosen */}
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Dosen Terlibat</label>
                        {data.dosen_terlibat.map((val: string, i: number) => (
                            <div key={`dosen-${i}`} className="flex gap-2 mb-2">
                                <input value={val} onChange={e => handleArrayChange('dosen_terlibat', i, e.target.value)} type="text" list="pegawai-list" className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Nama dosen..." />
                                <button type="button" onClick={() => removeArrayItem('dosen_terlibat', i)} className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addArrayItem('dosen_terlibat')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14} /> Tambah Dosen</button>
                    </div>
                    {/* Staf */}
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Staff Terlibat</label>
                        {data.staff_terlibat.map((val: string, i: number) => (
                            <div key={`staf-${i}`} className="flex gap-2 mb-2">
                                <input value={val} onChange={e => handleArrayChange('staff_terlibat', i, e.target.value)} type="text" list="pegawai-list" className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Nama staf/tendik..." />
                                <button type="button" onClick={() => removeArrayItem('staff_terlibat', i)} className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addArrayItem('staff_terlibat')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14} /> Tambah Staf</button>
                    </div>
                    {/* Mahasiswa */}
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Mahasiswa Terlibat</label>
                        {data.mahasiswa_terlibat.map((val: string, i: number) => (
                            <div key={`mhs-${i}`} className="flex gap-2 mb-2">
                                <input value={val} onChange={e => handleArrayChange('mahasiswa_terlibat', i, e.target.value)} type="text" className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Nama mahasiswa..." />
                                <button type="button" onClick={() => removeArrayItem('mahasiswa_terlibat', i)} className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addArrayItem('mahasiswa_terlibat')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14} /> Tambah Mahasiswa</button>
                    </div>
                </div>

                <datalist id="pegawai-list">
                    {listPegawai.map((p: any) => <option key={p.id_pegawai} value={p.nama_pegawai} />)}
                </datalist>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 flex items-center gap-2"><MapPin size={16}/> Lokasi Kegiatan</h2>
                
                {lokasiList.map((lokasi: any, index: number) => (
                    <div key={lokasi.id_ui ?? index} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                                <span className="inline-flex items-center rounded-md bg-poltekpar-primary/10 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-poltekpar-primary">Lokasi {index + 1}</span>
                                {lokasi.kota_kabupaten && <span className="text-xs font-semibold text-zinc-500">{lokasi.kota_kabupaten}</span>}
                            </div>
                            {lokasiList.length > 1 && (
                                <button type="button" onClick={() => removeLocation(index)} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                                    <Trash2 size={14}/> Hapus
                                </button>
                            )}
                        </div>

                        <div className="rounded-xl overflow-hidden border border-zinc-200 h-80 relative bg-white">
                            <MapLocationPicker
                                latitude={lokasi.latitude}
                                longitude={lokasi.longitude}
                                onChange={(lat, lng, addr) => {
                                    updateLocation(index, {
                                        latitude: lat,
                                        longitude: lng,
                                        ...(addr && {
                                            provinsi: addr.provinsi || lokasi.provinsi,
                                            kota_kabupaten: addr.kotaKabupaten || lokasi.kota_kabupaten,
                                            kecamatan: addr.kecamatan || lokasi.kecamatan,
                                            kelurahan_desa: addr.kelurahanDesa || lokasi.kelurahan_desa,
                                            alamat_lengkap: addr.address || lokasi.alamat_lengkap
                                        })
                                    });
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Provinsi</label>
                                <input value={lokasi.provinsi || ''} onChange={e => updateLocation(index, { provinsi: e.target.value })} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Kota/Kabupaten</label>
                                <input value={lokasi.kota_kabupaten || ''} onChange={e => updateLocation(index, { kota_kabupaten: e.target.value })} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Kecamatan</label>
                                <input value={lokasi.kecamatan || ''} onChange={e => updateLocation(index, { kecamatan: e.target.value })} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Kelurahan/Desa</label>
                                <input value={lokasi.kelurahan_desa || ''} onChange={e => updateLocation(index, { kelurahan_desa: e.target.value })} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Alamat Lengkap (Otomatis)</label>
                                <textarea value={lokasi.alamat_lengkap || ''} onChange={e => updateLocation(index, { alamat_lengkap: e.target.value })} rows={2} className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary focus:ring-1 focus:ring-poltekpar-primary" />
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addLocation} className="inline-flex items-center gap-2 rounded-md border border-poltekpar-primary/20 bg-poltekpar-primary/5 px-4 py-2 text-xs font-bold text-poltekpar-primary hover:bg-poltekpar-primary/10">
                    <Plus size={14}/> Tambah Lokasi
                </button>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <h2 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">Arsip Eksternal</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Link Laporan Akhir</label>
                        <input value={data.link_laporan_akhir} onChange={e => handleChange('link_laporan_akhir', e.target.value)} type="url" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="https://" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Link Dokumentasi Publik</label>
                        <input value={data.link_dokumentasi} onChange={e => handleChange('link_dokumentasi', e.target.value)} type="url" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="https://" />
                    </div>
                </div>

                <div className="pt-2">
                    <label className="block text-[13px] font-bold text-zinc-800 mb-2 border-b border-zinc-100 pb-1">Link Tambahan</label>
                    {data.link_tambahan.map((link: any, i: number) => (
                        <div key={`link-${i}`} className="flex gap-2 mb-2 items-start">
                            <input value={link.nama} onChange={e => updateLinkTambahan(i, 'nama', e.target.value)} type="text" className="w-1/3 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Nama Dok (Misal: Surat Tugas)" />
                            <input value={link.url} onChange={e => updateLinkTambahan(i, 'url', e.target.value)} type="url" className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="URL Dokumen..." />
                            <button type="button" onClick={() => removeLinkTambahan(i)} className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={addLinkTambahan} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1"><Plus size={14} /> Tambah Link Referensi Dinamis</button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0"></div>
                <h2 className="text-sm font-bold text-blue-800 border-b border-blue-100 pb-2 relative z-10">Testimoni Historis (Opsional)</h2>

                <div className="relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-lg border border-zinc-100">
                        <div className="col-span-full">
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Nama Sumber Testimoni (Opsional, Misal: Yayasan ABC)</label>
                            <input value={data.testimoni_nama} onChange={e => handleChange('testimoni_nama', e.target.value)} type="text" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="Misal: Bapak Kepala Desa ABC" />
                        </div>
                        <div className="col-span-full">
                            <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">Tautan/Link Edukasi/Testimoni (Wajib untuk menambahkan testimoni)</label>
                            <input value={data.testimoni_link} onChange={e => handleChange('testimoni_link', e.target.value)} type="url" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-poltekpar-primary" placeholder="https://youtube.com/..." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

FormHistoris.getInitialData = (listJenisPkm: any[]) => ({
    judul_kegiatan: '',
    id_jenis_pkm: listJenisPkm.length ? listJenisPkm[0].id_jenis_pkm : '',
    tgl_mulai: '',
    tgl_selesai: '',
    is_tahun_saja: false,
    provinsi: '',
    kota_kabupaten: '',
    kecamatan: '',
    kelurahan_desa: '',
    alamat_lengkap: '',
    latitude: null as number | null,
    longitude: null as number | null,
    lokasi_list: [createLocation()],
    total_anggaran: '',
    sumber_dana_tambahan: '',
    dana_perguruan_tinggi: '',
    dana_pemerintah: '',
    dana_lembaga_dalam: '',
    dana_lembaga_luar: '',
    ketua_tim: '',
    dosen_terlibat: [''],
    staff_terlibat: [''],
    mahasiswa_terlibat: [''],
    testimoni_nama: '',
    testimoni_link: '',
    link_laporan_akhir: '',
    link_dokumentasi: '',
    link_tambahan: [],
});
