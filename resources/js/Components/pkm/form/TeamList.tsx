import React from 'react';

interface TeamListProps {
    timDosen: string[];
    timStaff: string[];
    timMahasiswa: string[];
    onAdd: (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa') => void;
    onRemove: (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa', idx: number) => void;
    onChange: (type: 'tim_dosen' | 'tim_staff' | 'tim_mahasiswa', idx: number, val: string) => void;
}

export default function TeamList({ timDosen, timStaff, timMahasiswa, onAdd, onRemove, onChange }: TeamListProps) {
    const teams = [
        { type: 'tim_dosen' as const, label: 'Dosen Terlibat', data: timDosen, listId: 'dosen-suggestions', placeholder: 'Nama dosen...' },
        { type: 'tim_staff' as const, label: 'Staf Terlibat', data: timStaff, listId: 'staff-suggestions', placeholder: 'Nama staf...' },
        { type: 'tim_mahasiswa' as const, label: 'Mahasiswa Terlibat', data: timMahasiswa, listId: undefined, placeholder: 'Nama mahasiswa...' }
    ];

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 w-fit rounded-md border border-slate-200/60 mb-2">
                Tim Pelaksana
            </h4>
            {teams.map(({ type, label, data, listId, placeholder }) => (
                <div key={type}>
                    <label className="text-[13px] font-bold text-slate-600 mb-1 block">
                        {label}
                    </label>
                    {data.map((member, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                list={listId}
                                value={member}
                                onChange={e => onChange(type, idx, e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-poltekpar-primary/20 focus:border-poltekpar-primary"
                                placeholder={placeholder}
                            />
                            {data.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(type, idx)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onAdd(type)}
                        className="text-[11px] font-bold text-poltekpar-primary flex items-center gap-1 hover:opacity-70"
                    >
                        <i className="fa-solid fa-plus"></i> Tambah
                    </button>
                </div>
            ))}
        </div>
    );
}
