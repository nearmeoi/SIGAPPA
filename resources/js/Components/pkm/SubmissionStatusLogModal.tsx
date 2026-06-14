import React from 'react';
import { Submission } from '@/types';

interface SubmissionStatusLogModalProps {
    selectedStatusLog: Submission | null;
    onClose: () => void;
    getSubmissionStatusStyle: (status: string) => { label: string; icon: string; bg: string; color: string };
}

export default function SubmissionStatusLogModal({
    selectedStatusLog,
    onClose,
    getSubmissionStatusStyle
}: SubmissionStatusLogModalProps) {
    if (!selectedStatusLog) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 text-left">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh] relative z-10 border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-poltekpar-primary to-poltekpar-navy opacity-95"></div>
                    <div className="px-8 py-6 text-white relative">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                                <i className="fa-solid fa-clock-rotate-left text-xl text-white"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Lacak Status</h3>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 line-clamp-1">{selectedStatusLog.judul}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                    {selectedStatusLog.logs && selectedStatusLog.logs.length > 0 ? (
                        <div className="space-y-0 pl-1">
                            {selectedStatusLog.logs.map((log, i) => {
                                const stBaru = getSubmissionStatusStyle(log.status_baru);
                                const stLama = log.status_lama ? getSubmissionStatusStyle(log.status_lama) : null;
                                const isLast = i === (selectedStatusLog.logs?.length || 0) - 1;

                                return (
                                    <div key={log.id} className="flex gap-6 pb-8 relative last:pb-0 group">
                                        {!isLast && (
                                            <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-slate-200 to-transparent group-hover:from-poltekpar-primary/30 transition-colors" />
                                        )}
                                        <div className="relative">
                                            <div
                                                className="w-5 h-5 rounded-full shrink-0 mt-1 border-4 border-white z-10 shadow-sm relative group-hover:scale-125 transition-transform"
                                                style={{ backgroundColor: stBaru.color }}
                                            />
                                            {i === 0 && (
                                                <div className="absolute inset-[-4px] rounded-full bg-poltekpar-primary/10 animate-ping opacity-20" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 -mt-0.5">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                {stLama && (
                                                    <span
                                                        className="text-[9px] font-black px-2 py-0.5 rounded-md border border-slate-100 bg-white text-slate-400 uppercase tracking-wider"
                                                    >
                                                        {stLama.label}
                                                    </span>
                                                )}
                                                {stLama && <i className="fa-solid fa-arrow-right text-slate-300 text-[8px]"></i>}
                                                <span
                                                    className="text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border uppercase tracking-wider"
                                                    style={{ backgroundColor: stBaru.bg, color: stBaru.color, borderColor: `${stBaru.color}20` }}
                                                >
                                                    {stBaru.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <i className="fa-regular fa-calendar-check text-[10px]"></i>
                                                <p className="text-[11px] font-bold">{log.created_at}</p>
                                            </div>
                                            {log.catatan && (
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3 relative overflow-hidden group/note hover:border-poltekpar-primary/20 transition-colors">
                                                    <div className="absolute right-[-10px] top-[-10px] text-slate-50 text-4xl group-hover/note:text-poltekpar-primary/5 transition-colors">
                                                        <i className="fa-solid fa-quote-right"></i>
                                                    </div>
                                                    <i className="fa-solid fa-comment-dots text-slate-200 mt-1 text-xs shrink-0 relative z-10"></i>
                                                    <p className="text-[12px] text-slate-600 font-medium leading-relaxed relative z-10">{log.catatan}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-200 mb-4 border-4 border-white shadow-inner">
                                <i className="fa-solid fa-timeline text-4xl"></i>
                            </div>
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Belum Ada Riwayat</h4>
                            <p className="text-xs text-slate-400 mt-1">Status pengajuan Anda saat ini sedang dalam antrean.</p>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 bg-white border-t border-slate-100 shrink-0 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 border border-slate-200/50 uppercase tracking-widest"
                    >
                        Selesai & Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
