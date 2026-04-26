import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { User, Mail, Activity, ArrowLeft } from 'lucide-react';

interface Props {
    user: {
        id_user: number;
        name: string;
        email: string;
        role: string;
    };
}

export default function Profile({ user }: Props) {
    const initial = user.name?.charAt(0)?.toUpperCase() || 'A';

    return (
        <AdminLayout title="Pengaturan Akun">
            <div className="max-w-lg">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                        <ArrowLeft size={16} />
                    </Link>
                    <h2 className="text-[18px] font-bold text-zinc-900">Informasi Akun</h2>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    {/* Avatar Header */}
                    <div className="p-6 flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/50">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold shadow-sm">
                            {initial}
                        </div>
                        <div>
                            <h3 className="text-[16px] font-bold text-zinc-900">{user.name}</h3>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                user.role === 'admin' ? 'bg-amber-50 text-amber-700' :
                                user.role === 'dosen' ? 'bg-blue-50 text-blue-700' :
                                'bg-emerald-50 text-emerald-700'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* Info Fields */}
                    <div className="p-6 space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-zinc-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Nama Lengkap</div>
                                <div className="text-[14px] font-medium text-zinc-900">{user.name}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <Mail size={16} className="text-zinc-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</div>
                                <div className="text-[14px] font-medium text-zinc-900">{user.email}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <Activity size={16} className="text-zinc-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Role</div>
                                <div className="text-[14px] font-medium text-zinc-900 capitalize">{user.role}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                <Activity size={16} className="text-zinc-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">User ID</div>
                                <div className="text-[14px] font-medium text-zinc-900 font-mono">#{user.id_user}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
