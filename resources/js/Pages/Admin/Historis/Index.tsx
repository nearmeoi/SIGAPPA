import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import AdminLayout from '../../../Layouts/AdminLayout';
import FormHistoris from '../../../Components/FormHistoris';
import Toast from '../../../Components/Toast';
import { Upload, Download, FileSpreadsheet, Eye, Save, Loader2, ArrowLeft, History, Edit, CheckSquare, Square, X, MapPin, MapPinOff } from 'lucide-react';

export default function HistorisIndex({ listPegawai, listJenisPkm }: any) {
    const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
    const [toastInfo, setToastInfo] = useState<{show: boolean, type: 'success'|'error', msg: string}>({show: false, type: 'success', msg: ''});

    // Sub-components states
    const [manualData, setManualData] = useState<any>(() => FormHistoris.getInitialData(listJenisPkm));
    
    // Excel States
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Excel Edit Modal
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

    const submitManual = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/historis/manual', manualData, {
            onSuccess: () => {
                setManualData(FormHistoris.getInitialData(listJenisPkm));
            }
        });
    };

    // ----- Excel Logic -----
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handlePreview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file_xlsx', file);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await axios.post('/admin/historis/preview', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': csrfToken || ''
                }
            });
            const rows = response.data.data;
            setPreviewData(rows);
            setSelectedRows(rows.map((r: any) => r.id));
            setPreviewMode(true);
            setToastInfo({show: true, type: 'success', msg: `Berhasil mengektrak ${rows.length} data historis.`});
        } catch (error: any) {
            setToastInfo({show: true, type: 'error', msg: error.response?.data?.error || 'Gagal membaca file.'});
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImportSelected = () => {
        if (selectedRows.length === 0) {
            setToastInfo({show: true, type: 'error', msg: 'Pilih minimal satu baris untuk diunggah.'});
            return;
        }

        setIsProcessing(true);
        const rowsToSubmit = previewData.filter(r => selectedRows.includes(r.id));
        
        router.post('/admin/historis/excel', { rows: rowsToSubmit }, {
            onSuccess: () => {
                setPreviewMode(false);
                setFile(null);
                setPreviewData([]);
                setToastInfo({show: true, type: 'success', msg: `Import ${selectedRows.length} data historis telah selesai!`});
            },
            onError: (err) => {
                setToastInfo({show: true, type: 'error', msg: 'Terjadi kesalahan sistem di salah satu data. Mohon validasi format kembali.'});
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelectedRows(selectedRows.length === previewData.length ? [] : previewData.map(r => r.id));
    };

    const downloadTemplate = () => {
        const data = [{
            "Tahun": "2023", 
            "Judul PKM": "Pemberdayaan Desa Wisata X", 
            "Jenis PKM / Skema Masy": "Pengabdian Internal", 
            "Kebutuhan Daerah (Kosongkan)": "", 
            "Pengusul": "Dosen",
            "Ketua TIM (Nama)": "Budi Santoso", 
            "Dosen Terlibat (Koma-pisahkan)": "Andi,Siti", 
            "Staff Terlibat (Koma)": "Joko", 
            "Mahasiswa Terlibat (Koma)": "Rani,Tono",
            "Desa": "Mekarwangi", 
            "Kecamatan": "Lembang", 
            "Kabupaten/Kota": "Bandung", 
            "Provinsi": "Jawa Barat",
            "Link Arsip Lain / RAB (Eksternal)": "", 
            "Total Anggaran (Rp)": "5000000", 
            "Link Testimoni Eksternal / Bukti Feedback": "https://youtube.com/...", 
            "Link Bebas X": "", 
            "Link Laporan Akhir PKM Dokumen": "https://drive...", 
            "Link Foto Dokumentasi": "https://..."
        }];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Template_Data_Historis.xlsx");
    };

    // Modal Edit logic
    const openEditModal = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingRowIndex(idx);
    };

    const curEditingData = editingRowIndex !== null ? previewData[editingRowIndex] : null;

    const hasCoordinates = (row: any) => {
        const latitude = row?.latitude;
        const longitude = row?.longitude;

        return latitude !== null && latitude !== undefined && latitude !== '' && longitude !== null && longitude !== undefined && longitude !== '';
    };

    const rowsWithCoordinates = previewData.filter(hasCoordinates).length;
    const rowsWithoutCoordinates = previewData.length - rowsWithCoordinates;

    return (
        <AdminLayout title="Kelola Data Historis">
            <Toast show={toastInfo.show} type={toastInfo.type} title={toastInfo.type === 'success' ? 'Berhasil' : 'Gagal'} message={toastInfo.msg} onClose={() => setToastInfo({...toastInfo, show: false})} />

            {!previewMode && (
                <>
                    <div className="flex bg-white/70 backdrop-blur-sm p-1 rounded-2xl border border-zinc-200/60 shadow-sm w-fit mb-6">
                        <button onClick={() => setActiveTab('manual')} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'manual' ? 'bg-poltekpar-navy text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}>Form Manual Individu</button>
                        <button onClick={() => setActiveTab('excel')} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'excel' ? 'bg-poltekpar-navy text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}>Import Massal (Excel)</button>
                    </div>

                    {activeTab === 'manual' && (
                        <form onSubmit={submitManual} className="max-w-4xl space-y-6 pb-20">
                            <FormHistoris data={manualData} setData={setManualData} listPegawai={listPegawai} listJenisPkm={listJenisPkm} />
                            <div className="flex justify-end gap-3 sticky bottom-6 z-20">
                                <button type="submit" className="px-8 py-3 rounded-xl bg-poltekpar-navy hover:bg-poltekpar-primary text-white font-black text-[14px] shadow-lg shadow-poltekpar-navy/20 flex items-center gap-2"><Save size={18}/> Kirim Data Ke Database</button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'excel' && (
                        <div className="max-w-4xl space-y-6">
                            <div className="bg-gradient-to-br from-indigo-900 to-poltekpar-navy text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-[20px] font-black tracking-tight mb-2 flex items-center gap-2"><History /> Hub Import Historis</h2>
                                    <p className="text-indigo-100 text-[13px] max-w-xl">
                                        Teknik cepat mengonversi ratusan rekam jejak Pengabdian & Penelitian dari program Excel di masa lalu menjadi terintegrasi dengan peta persebaran wilayah hari ini.
                                    </p>
                                </div>
                                <button onClick={downloadTemplate} className="bg-white/10 hover:bg-white text-white hover:text-poltekpar-navy border border-white/20 font-bold text-[13px] px-5 py-3 rounded-xl transition-all whitespace-nowrap">
                                    Unduh Template Dasar
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-200">
                                <form onSubmit={handlePreview} className="flex flex-col items-center">
                                    <div 
                                        className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer relative
                                        ${dragActive ? 'border-poltekpar-primary bg-indigo-50/50' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'}`}
                                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    >
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${file ? 'bg-indigo-100 text-indigo-600' : 'bg-white shadow-sm border border-zinc-200 text-zinc-400'}`}>
                                            {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
                                        </div>
                                        {file ? (
                                            <div className="text-center"><p className="font-bold text-zinc-900">{file.name}</p><p className="text-sm text-green-600 mt-1">Siap Dieksekusi</p></div>
                                        ) : (
                                            <div className="text-center"><p className="font-bold text-zinc-700">Tarik File Excel ke Area Ini</p><p className="text-[12px] text-zinc-500 mt-2">Atau klik untuk membuka file explorer</p></div>
                                        )}
                                    </div>
                                    <div className="mt-8 flex justify-center w-full max-w-2xl">
                                        <button type="submit" disabled={!file || isProcessing} className="w-full bg-poltekpar-navy hover:bg-poltekpar-primary text-white border-2 border-poltekpar-navy hover:border-poltekpar-primary hover:shadow-xl hover:shadow-poltekpar-primary/20 transition-all rounded-xl py-4 flex justify-center items-center gap-3 font-bold disabled:opacity-50 text-[15px]">
                                            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Eye size={20} />} Review Hasil Parsing Data
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {previewMode && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[75vh]">
                    <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setPreviewMode(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-800 shadow-sm">
                                <ArrowLeft size={16} />
                            </button>
                            <div>
                                <h3 className="font-black text-zinc-900 leading-tight">Review Hasil Import Excel</h3>
                                <p className="text-[12px] text-zinc-500">{selectedRows.length} terpilih dari {previewData.length} baris terbaca</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                        <MapPin size={12} />
                                        {rowsWithCoordinates} sudah punya koordinat
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                                        <MapPinOff size={12} />
                                        {rowsWithoutCoordinates} belum punya koordinat
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleImportSelected} disabled={selectedRows.length===0 || isProcessing} className="bg-poltekpar-primary text-white px-5 py-2.5 flex items-center gap-2 rounded-xl font-bold text-sm shadow-md hover:bg-poltekpar-navy disabled:opacity-50 transition-all">
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Unggah ke Database
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-zinc-50/50 p-4">
                        <table className="w-full text-left bg-white border border-zinc-200 rounded-lg overflow-hidden">
                            <thead className="bg-poltekpar-navy text-white sticky top-0 shadow-sm z-10 text-[11px] font-black uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 text-center w-12 cursor-pointer" onClick={toggleAll}>
                                        {selectedRows.length === previewData.length ? <CheckSquare size={16}/> : <Square size={16}/>}
                                    </th>
                                    <th className="py-3 px-4">Judul PKM Historis</th>
                                    <th className="py-3 px-4">Info Utama</th>
                                    <th className="py-3 px-4">Pendanaan</th>
                                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-zinc-100">
                                {previewData.map((row, idx) => {
                                    const rowHasCoordinates = hasCoordinates(row);

                                    return (
                                    <tr key={row.id} className={`hover:bg-zinc-50 cursor-pointer ${selectedRows.includes(row.id) ? 'bg-indigo-50/20' : ''} ${rowHasCoordinates ? 'border-l-4 border-emerald-400' : 'border-l-4 border-amber-300'}`} onClick={() => toggleRow(row.id)}>
                                        <td className="py-3 px-4 text-center">
                                            {selectedRows.includes(row.id) ? <CheckSquare size={16} className="text-poltekpar-primary mx-auto" /> : <Square size={16} className="text-zinc-300 mx-auto" />}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-zinc-900 line-clamp-1">{row.judul_kegiatan || <span className="italic text-red-500">Kosong</span>}</div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${rowHasCoordinates ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                                                    {rowHasCoordinates ? <MapPin size={12} /> : <MapPinOff size={12} />}
                                                    {rowHasCoordinates ? 'Koordinat tersedia' : 'Koordinat belum diisi'}
                                                </span>
                                                {rowHasCoordinates && (
                                                    <span className="text-[10px] font-mono text-slate-500">
                                                        {Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">Lok: {row.alamat_lengkap || '-'}</div>
                                            <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">Ketua: {row.ketua_tim || '-'}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-600">{row.is_tahun_saja ? (row.tgl_mulai ? (new Date(row.tgl_mulai).getFullYear()) : 'Tanpa Tahun') : (row.tgl_mulai || 'Kosong')}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-[12px] text-emerald-600 font-bold">{row.total_anggaran > 0 ? `Rp ${row.total_anggaran.toLocaleString('id-ID')}` : '-'}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button onClick={(e) => openEditModal(idx, e)} className="mx-auto flex items-center justify-center w-8 h-8 rounded bg-white border border-zinc-200 text-zinc-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm">
                                                <Edit size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Detail & Edit Row */}
            {editingRowIndex !== null && curEditingData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
                    <div className="bg-[#f3f6f9] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="bg-white px-6 py-4 border-b border-zinc-200 flex justify-between items-center z-10 shadow-sm">
                            <div>
                                <h3 className="font-black text-lg text-zinc-900">Periksa & Edit Detail</h3>
                                <p className="text-[12px] text-zinc-500 font-medium">Melakukan modifikasi pra-import pada baris ke-{editingRowIndex + 1}</p>
                            </div>
                            <button onClick={() => setEditingRowIndex(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <FormHistoris 
                                data={curEditingData} 
                                setData={(partialOrFunc: any) => {
                                    setPreviewData(prev => {
                                        const copy = [...prev];
                                        if (typeof partialOrFunc === 'function') {
                                            copy[editingRowIndex] = partialOrFunc(copy[editingRowIndex]);
                                        } else {
                                            copy[editingRowIndex] = { ...copy[editingRowIndex], ...partialOrFunc };
                                        }
                                        return copy;
                                    });
                                }} 
                                listPegawai={listPegawai} 
                                listJenisPkm={listJenisPkm} 
                            />
                        </div>
                        <div className="bg-white border-t border-zinc-200 p-4 flex justify-end">
                            <button onClick={() => setEditingRowIndex(null)} className="px-6 py-2.5 bg-poltekpar-navy text-white text-sm font-bold rounded-xl hover:bg-poltekpar-primary shadow-md">
                                Tutup & Simpan Modifikasi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
