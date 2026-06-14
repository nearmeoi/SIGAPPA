import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { RabItem } from '@/types';

interface RabTableProps {
    items: RabItem[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onChange: (idx: number, field: keyof RabItem, val: string | number) => void;
    totalRAB: number;
}

export default function RabTable({ items, onAdd, onRemove, onChange, totalRAB }: RabTableProps) {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Rencana Anggaran Biaya (RAB)</h4>
            {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                        <label className="text-[12px] font-bold text-slate-500 mb-1 block">Nama Item</label>
                        <input
                            type="text"
                            value={item.nama_item}
                            onChange={e => onChange(idx, 'nama_item', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                            placeholder="Item..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[12px] font-bold text-slate-500 mb-1 block">Jumlah</label>
                        <input
                            type="number"
                            value={item.jumlah}
                            onChange={e => onChange(idx, 'jumlah', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                            min={1}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[12px] font-bold text-slate-500 mb-1 block">Harga</label>
                        <input
                            type="number"
                            value={item.harga || ''}
                            onChange={e => onChange(idx, 'harga', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                            min={0}
                            placeholder="0"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[12px] font-bold text-slate-500 mb-1 block">Total</label>
                        <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 border border-slate-100">
                            {formatRupiah(item.total)}
                        </div>
                    </div>
                    <div className="col-span-1">
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => onRemove(idx)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>
                </div>
            ))}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70"
                >
                    <i className="fa-solid fa-plus"></i> Tambah Item
                </button>
                <div className="text-sm font-bold text-poltekpar-primary">
                    Total RAB: {formatRupiah(totalRAB)}
                </div>
            </div>
        </div>
    );
}
