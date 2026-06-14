import React from 'react';

interface LinkItem {
    name: string;
    url: string;
}

interface DocumentSectionProps {
    kodePengajuan?: string | null;
    suratPermohonan: File | null;
    suratProposal: File | null;
    existingSuratPermohonan?: string;
    existingSuratProposal?: string;
    linkTambahan: LinkItem[];
    onChangeFile: (field: 'surat_permohonan' | 'surat_proposal', file: File | null) => void;
    onAddLink: () => void;
    onRemoveLink: (idx: number) => void;
    onChangeLink: (idx: number, field: 'name' | 'url', val: string) => void;
}

export default function DocumentSection({
    kodePengajuan,
    suratPermohonan,
    suratProposal,
    existingSuratPermohonan,
    existingSuratProposal,
    linkTambahan,
    onChangeFile,
    onAddLink,
    onRemoveLink,
    onChangeLink
}: DocumentSectionProps) {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">
                <i className="fa-solid fa-link text-poltekpar-primary"></i> Dokumen & Tautan
            </h4>
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">Surat Permohonan <span className="text-red-500">*</span></label>
                        <a href="/template/surat_permohonan" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5">
                            <i className="fa-solid fa-download"></i> Download Template Surat Permohonan
                        </a>
                    </div>
                    {existingSuratPermohonan && (
                        <a href={existingSuratPermohonan} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50/50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                            <i className="fa-solid fa-file-pdf"></i> File Saat Ini (Biarkan kosong jika tidak diubah)
                        </a>
                    )}
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={e => onChangeFile('surat_permohonan', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary"
                        required={!kodePengajuan}
                    />
                    {suratPermohonan && suratPermohonan instanceof File && suratPermohonan.type === 'application/pdf' && (
                        <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden h-64 bg-slate-50 relative shadow-inner">
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded-md opacity-50 z-10">Preview</span>
                            <object data={URL.createObjectURL(suratPermohonan)} type="application/pdf" className="w-full h-full relative z-20">
                                <div className="flex items-center justify-center h-full text-xs text-slate-400">Browser tidak mendukung preview PDF secara instan.</div>
                            </object>
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">Proposal {kodePengajuan ? '(Biarkan kosong jika tetap)' : '(Wajib)'} {!kodePengajuan && <span className="text-red-500">*</span>}</label>
                        <a href="/template/proposal" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-poltekpar-primary hover:underline flex items-center gap-1.5">
                            <i className="fa-solid fa-download"></i> Download Template Proposal
                        </a>
                    </div>
                    {existingSuratProposal && (
                        <a href={existingSuratProposal} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50/50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                            <i className="fa-solid fa-file-pdf"></i> File Saat Ini (Biarkan kosong jika tidak diubah)
                        </a>
                    )}
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={e => onChangeFile('surat_proposal', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-poltekpar-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-poltekpar-primary/10 file:text-poltekpar-primary"
                        required={!kodePengajuan}
                    />
                    {suratProposal && suratProposal instanceof File && suratProposal.type === 'application/pdf' && (
                        <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden h-64 bg-slate-50 relative shadow-inner">
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded-md opacity-50 z-10">Preview</span>
                            <object data={URL.createObjectURL(suratProposal)} type="application/pdf" className="w-full h-full relative z-20">
                                <div className="flex items-center justify-center h-full text-xs text-slate-400">Browser tidak mendukung preview PDF.</div>
                            </object>
                        </div>
                    )}
                </div>
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Link Tambahan (Drive, Bukti lain...)</label>
                        <button type="button" onClick={onAddLink} className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70">
                            <i className="fa-solid fa-plus"></i> Tambah
                        </button>
                    </div>
                    {linkTambahan.map((link, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-start">
                            <div className="flex-1 flex flex-col md:flex-row gap-2">
                                <input
                                    type="text"
                                    value={link.name}
                                    onChange={e => onChangeLink(idx, 'name', e.target.value)}
                                    className="w-full md:w-1/3 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                    placeholder="Nama Tautan"
                                />
                                <input
                                    type="url"
                                    value={link.url}
                                    onChange={e => onChangeLink(idx, 'url', e.target.value)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                    placeholder="https://..."
                                />
                            </div>
                            {linkTambahan.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveLink(idx)}
                                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
