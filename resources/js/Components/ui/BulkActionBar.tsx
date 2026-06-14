import React from 'react';
import { Trash2, X, Check } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onDelete?: () => void;
    onRestore?: () => void;
    onClear: () => void;
    entityLabel?: string;
}

export default function BulkActionBar({ selectedCount, onDelete, onRestore, onClear, entityLabel = 'item' }: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-zinc-50 border border-zinc-200 shadow-sm rounded-xl text-[13px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-white" />
            </div>
            <span className="font-bold text-zinc-800">{selectedCount} {entityLabel} dipilih</span>
            <span className="text-red-300">|</span>

            {onDelete && (
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white border border-red-700 rounded-md text-[12px] font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                    <Trash2 size={13} /> Hapus Terpilih
                </button>
            )}

            {onRestore && (
                <button
                    onClick={onRestore}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white border border-emerald-700 rounded-md text-[12px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Check size={13} /> Pulihkan Terpilih
                </button>
            )}

            <button
                onClick={onClear}
                className="ml-auto px-2 py-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors"
                title="Batalkan pilihan"
            >
                <X size={16} />
            </button>
        </div>
    );
}

interface CheckboxCellProps {
    checked: boolean;
    onChange: () => void;
}

export function CheckboxCell({ checked, onChange }: CheckboxCellProps) {
    return (
        <td className="py-3 px-3 text-center w-10 border-r border-zinc-100" onClick={e => e.stopPropagation()}>
            <button
                onClick={onChange}
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 mx-auto"
                style={{
                    borderColor: checked ? '#18181b' : '#d4d4d8',
                    backgroundColor: checked ? '#18181b' : 'transparent',
                }}
            >
                {checked && <Check size={12} className="text-white" />}
            </button>
        </td>
    );
}

interface CheckboxHeaderProps {
    allChecked: boolean;
    onToggleAll: () => void;
}

export function CheckboxHeader({ allChecked, onToggleAll }: CheckboxHeaderProps) {
    return (
        <th className="py-3 px-3 w-10 text-center border-r border-zinc-100">
            <button
                onClick={onToggleAll}
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 mx-auto"
                style={{
                    borderColor: allChecked ? '#18181b' : '#d4d4d8',
                    backgroundColor: allChecked ? '#18181b' : 'transparent',
                }}
                title="Pilih semua"
            >
                {allChecked && <Check size={12} className="text-white" />}
            </button>
        </th>
    );
}
