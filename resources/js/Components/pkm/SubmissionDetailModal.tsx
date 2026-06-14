import React from 'react';
import { Submission } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface SubmissionDetailModalProps {
    selectedDetail: Submission | null;
    onClose: () => void;
    onEdit: () => void;
    getFullUrl: (path: string | null | undefined) => string;
    getSubmissionStatusStyle: (status: string) => { label: string; icon: string; bg: string; color: string };
}

export default function SubmissionDetailModal({
    selectedDetail,
    onClose,
    onEdit,
    getFullUrl,
    getSubmissionStatusStyle
}: SubmissionDetailModalProps) {
    if (!selectedDetail) return null;
    const style = getSubmissionStatusStyle(selectedDetail.status);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[90vh] relative z-10 border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: Modern & Sleek */}
                <div className="relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl"></div>

                    <div className="relative px-6 py-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                                <i className="fa-solid fa-file-invoice text-xl text-white"></i>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
                                        #{selectedDetail.kode_unik || selectedDetail.id}
                                    </span>
                                    <span
                                        className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                                        style={{ backgroundColor: style.bg, color: style.color, borderColor: `${style.color}30` }}
                                    >
                                        {style.label}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white leading-tight truncate max-w-[200px] sm:max-w-[300px]">{selectedDetail.judul}</h3>
                                <p className="text-white/60 text-[10px] font-medium">Diajukan {selectedDetail.tanggal}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 shrink-0"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Content Area: Single Column Vertical Flow */}
                <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 text-[13px]">
                    <div className="space-y-7">

                        {/* Section: Submitter Info */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-poltekpar-primary border border-blue-100">
                                    <i className="fa-solid fa-user-tie text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Informasi Pengusul</h4>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ketua Pengusul</label>
                                        <p className="text-sm font-bold text-slate-900">{selectedDetail.nama_pengusul || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kategori PKM</label>
                                        <p className="text-sm font-bold text-slate-900">{selectedDetail.jenis_pkm || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                        <p className="text-sm font-bold text-slate-900 truncate">{selectedDetail.email_pengusul || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-brands fa-whatsapp text-green-500"></i>
                                            <p className="text-sm font-bold text-slate-900">{selectedDetail.no_telepon || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Tim Pelaksana */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                                    <i className="fa-solid fa-users text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tim Pelaksana</h4>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                {selectedDetail.tim_kegiatan && selectedDetail.tim_kegiatan.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedDetail.tim_kegiatan.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0 font-bold text-xs uppercase">
                                                    {t.nama.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-slate-900 truncate">{t.nama}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-poltekpar-primary/10 text-poltekpar-primary">
                                                            {t.peran}
                                                        </span>
                                                        {t.institusi && <span className="text-[9px] text-slate-400 truncate max-w-[80px]">{t.institusi}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-4">Belum ada tim yang didaftarkan</p>
                                )}
                            </div>
                        </section>

                        {/* Section: RAB */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                    <i className="fa-solid fa-receipt text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Rencana Anggaran Biaya</h4>
                            </div>
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Keterangan Item</th>
                                            <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(() => {
                                            const rab = (selectedDetail as any).rab_items || [];
                                            if (Array.isArray(rab) && rab.length > 0) {
                                                return rab.map((item, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <p className="font-bold text-slate-700">{item.nama_item}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{item.jumlah} Unit x {formatRupiah(item.harga)}</p>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-black text-slate-900">
                                                            {formatRupiah(item.total)}
                                                        </td>
                                                    </tr>
                                                ));
                                            }
                                            return <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-300 italic">Data RAB tidak tersedia</td></tr>;
                                        })()}
                                    </tbody>
                                    <tfoot className="bg-slate-50/50">
                                        <tr className="border-t-2 border-slate-100">
                                            <td className="px-5 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Total Anggaran</td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="px-3 py-1.5 bg-poltekpar-primary text-white text-sm font-black rounded-xl shadow-lg shadow-poltekpar-primary/20">
                                                    {formatRupiah(selectedDetail.total_anggaran)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>

                        {/* Section: Sumber Dana */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
                                    <i className="fa-solid fa-hand-holding-dollar text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Sumber Dana</h4>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal PT</span>
                                    <span className="text-[11px] font-black text-slate-900">{formatRupiah(selectedDetail.dana_perguruan_tinggi)}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemerintah</span>
                                    <span className="text-[11px] font-black text-slate-900">{formatRupiah(selectedDetail.dana_pemerintah)}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lembaga DN</span>
                                    <span className="text-[11px] font-black text-slate-900">{formatRupiah(selectedDetail.dana_lembaga_dalam)}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/60 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lembaga LN</span>
                                    <span className="text-[11px] font-black text-slate-900">{formatRupiah(selectedDetail.dana_lembaga_luar)}</span>
                                </div>
                            </div>
                        </section>

                        {/* Section: Locations */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <i className="fa-solid fa-map-pin text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lokasi Kegiatan</h4>
                            </div>
                            <div className="space-y-4">
                                {/* Primary Location (Lokasi 1) */}
                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI 1</div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                            {[selectedDetail.kelurahan_desa, selectedDetail.kecamatan, selectedDetail.kota_kabupaten, selectedDetail.provinsi].filter(Boolean).join(', ') || '-'}
                                        </p>
                                        <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                            <i className="fa-solid fa-location-dot text-emerald-400 text-[10px] mt-1 group-hover:animate-bounce"></i>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{selectedDetail.alamat_lengkap || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Locations (Lokasi 2, 3, etc.) */}
                                {(() => {
                                    try {
                                        const tambahan = (selectedDetail as any).lokasi_tambahan;
                                        if (!tambahan) return null;
                                        const parsed = typeof tambahan === 'string' ? JSON.parse(tambahan) : tambahan;
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                            return parsed.map((loc, i) => (
                                                <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:border-emerald-200 group">
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-slate-400 text-[8px] text-white font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm">LOKASI {i + 2}</div>
                                                    <div className="space-y-2">
                                                        <p className="text-[11px] font-bold text-slate-900 leading-snug pr-12">
                                                            {[loc.kelurahan_desa, loc.kecamatan, loc.kota_kabupaten, loc.provinsi].filter(Boolean).join(', ') || '-'}
                                                        </p>
                                                        <div className="pt-2 border-t border-slate-50 flex items-start gap-2">
                                                            <i className="fa-solid fa-location-dot text-slate-300 text-[10px] mt-1 group-hover:text-emerald-400 transition-colors"></i>
                                                            <p className="text-[10px] text-slate-400 leading-relaxed truncate">{loc.alamat_lengkap || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        }
                                    } catch (e) { }
                                    return null;
                                })()}
                            </div>
                        </section>

                        {/* Section: Documents */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                    <i className="fa-solid fa-folder-open text-sm"></i>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Berkas Lampiran</h4>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedDetail.surat_permohonan && (
                                    <a href={getFullUrl(selectedDetail.surat_permohonan)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-poltekpar-primary group transition-all border border-slate-100 hover:border-poltekpar-primary shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-poltekpar-primary group-hover:scale-110 transition-transform shadow-sm">
                                                <i className="fa-solid fa-file-pdf text-lg"></i>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">Surat</p>
                                                <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Wajib</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                    </a>
                                )}
                                {selectedDetail.proposal && (
                                    <a href={getFullUrl(selectedDetail.proposal)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-sky-600 group transition-all border border-slate-100 hover:border-sky-600 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform shadow-sm">
                                                <i className="fa-solid fa-file-contract text-lg"></i>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">Proposal</p>
                                                <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Utama</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-white mr-1"></i>
                                    </a>
                                )}
                                {(() => {
                                    try {
                                        const rab = (selectedDetail as any).rab;
                                        const parsed = rab ? (typeof rab === 'string' ? JSON.parse(rab) : rab) : [];
                                        if (Array.isArray(parsed)) {
                                            return parsed.map((link, i) => (
                                                <a key={i} href={getFullUrl(link.url)} target="_blank" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-600 group transition-all border border-slate-100 hover:border-indigo-600 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                                            <i className="fa-solid fa-link text-lg"></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black text-slate-700 group-hover:text-white uppercase tracking-tight truncate max-w-[80px]">{link.name || link.label || `Tautan ${i + 1}`}</p>
                                                            <p className="text-[9px] text-slate-400 group-hover:text-white/60 font-bold">Eksternal</p>
                                                        </div>
                                                    </div>
                                                    <i className="fa-solid fa-external-link text-slate-300 group-hover:text-white mr-1 text-[10px]"></i>
                                                </a>
                                            ));
                                        }
                                    } catch (e) { }
                                    return null;
                                })()}
                            </div>
                        </section>

                        {/* Section: Catatan Admin (If any) */}
                        {selectedDetail.catatan && (
                            <section className="animate-in slide-in-from-bottom-2">
                                <div className="bg-amber-50 border-2 border-amber-100/50 p-5 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute right-[-10px] top-[-10px] text-amber-200/20 text-6xl group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-quote-right"></i>
                                    </div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-700 shrink-0">
                                            <i className="fa-solid fa-comment-dots text-sm"></i>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mb-1">Catatan Admin</h5>
                                            <p className="text-sm text-amber-900 font-bold italic leading-relaxed">{selectedDetail.catatan}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Footer: Action Bar */}
                <div className="px-8 py-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {selectedDetail.status === 'direvisi' && (
                            <button
                                onClick={onEdit}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-poltekpar-primary text-white text-xs font-black rounded-xl hover:bg-poltekpar-navy transition-all shadow-lg shadow-poltekpar-primary/20 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-pen-to-square"></i> EDIT PENGAJUAN
                            </button>
                        )}
                        {['diterima', 'berlangsung', 'selesai'].includes(selectedDetail.status) && (
                            <a target="_blank" rel="noopener noreferrer" href={`/kumpul-arsip/${selectedDetail.kode_unik || selectedDetail.id}`} className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                <i className="fa-solid fa-folder-open"></i> KUMPUL ARSIP
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all"
                        >
                            TUTUP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
