import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Save, Info } from 'lucide-react';

interface Props {
    settings: {
        visitor_count_offset: number;
    };
}

export default function SiteSettings({ settings }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        visitor_count_offset: settings.visitor_count_offset,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('secret.settings.update'));
    };

    return (
        <AdminLayout title="Pengaturan Situs">
            <Head title="Pengaturan Situs - Secret Area" />

            <div className="max-w-2xl">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Statistik Pengunjung</h2>
                            <p className="text-sm text-slate-500 mt-1">Kelola angka awal untuk statistik pengunjung di beranda.</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="visitor_count_offset" className="text-sm font-bold text-slate-700">
                                Visitor Count Offset (Angka Awal)
                            </label>
                            <div className="relative">
                                <input
                                    id="visitor_count_offset"
                                    type="number"
                                    value={data.visitor_count_offset}
                                    onChange={(e) => setData('visitor_count_offset', parseInt(e.target.value) || 0)}
                                    className={`w-full bg-slate-50 border ${errors.visitor_count_offset ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:ring-4 focus:ring-poltekpar-primary/5 focus:border-poltekpar-primary/20 transition-all outline-none font-medium`}
                                    placeholder="Masukkan angka awal, misal: 1200"
                                />
                            </div>
                            {errors.visitor_count_offset && (
                                <p className="text-xs font-medium text-red-500 mt-1">{errors.visitor_count_offset}</p>
                            )}
                            
                            <div className="mt-4 flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <Info className="text-blue-500 shrink-0" size={18} />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Angka ini akan ditambahkan ke jumlah kunjungan asli. 
                                    <br />
                                    <strong>Total Tampil = Jumlah Asli + Offset</strong>
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 bg-poltekpar-primary hover:bg-poltekpar-navy text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-poltekpar-primary/20 active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
