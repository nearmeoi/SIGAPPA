<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\PengajuanLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DirekturController extends Controller
{
    public function index()
    {
        $pending = Pengajuan::with(['user', 'jenisPkm'])
            ->where('status_pengajuan', Pengajuan::STATUS_DIPROSES)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($p) => [
                'id_pengajuan'          => $p->id_pengajuan,
                'judul_kegiatan'        => $p->judul_kegiatan,
                'nama_pengusul'         => $p->nama_pengusul ?? $p->user?->name,
                'jenis_pkm'             => $p->jenisPkm?->nama_jenis ?? '-',
                'warna_jenis'           => $p->jenisPkm?->warna_icon ?? '#64748b',
                'created_at'            => $p->created_at?->format('d M Y'),
                'direktur_approved_at'  => $p->direktur_approved_at?->format('d M Y, H:i'),
            ]);

        $stats = [
            'total'    => $pending->count(),
            'approved' => $pending->whereNotNull('direktur_approved_at')->count(),
            'waiting'  => $pending->whereNull('direktur_approved_at')->count(),
        ];

        return Inertia::render('Direktur/Dashboard', [
            'pengajuanList' => $pending->values(),
            'stats'         => $stats,
        ]);
    }

    public function approve(int $id)
    {
        $pengajuan = Pengajuan::where('status_pengajuan', Pengajuan::STATUS_DIPROSES)->findOrFail($id);

        if ($pengajuan->direktur_approved_at) {
            return redirect()->back()->with('info', 'Pengajuan sudah disetujui sebelumnya.');
        }

        DB::transaction(function () use ($pengajuan) {
            $pengajuan->direktur_approved_at = now();
            $pengajuan->save();

            PengajuanLog::create([
                'id_pengajuan'       => $pengajuan->id_pengajuan,
                'status_lama'        => null,
                'status_baru'        => 'disetujui_direktur',
                'catatan'            => 'Disetujui oleh Direktur',
                'changed_by_user_id' => auth()->id(),
                'changed_by_name'    => auth()->user()?->name,
            ]);
        });

        return redirect()->back()->with('success', 'Pengajuan berhasil disetujui.');
    }

    public function decline(int $id)
    {
        $pengajuan = Pengajuan::where('status_pengajuan', Pengajuan::STATUS_DIPROSES)->findOrFail($id);

        if (! $pengajuan->direktur_approved_at) {
            return redirect()->back()->with('info', 'Pengajuan belum disetujui.');
        }

        DB::transaction(function () use ($pengajuan) {
            $pengajuan->direktur_approved_at = null;
            $pengajuan->save();

            PengajuanLog::create([
                'id_pengajuan'       => $pengajuan->id_pengajuan,
                'status_lama'        => null,
                'status_baru'        => 'ditolak_direktur',
                'catatan'            => 'Persetujuan ditarik oleh Direktur',
                'changed_by_user_id' => auth()->id(),
                'changed_by_name'    => auth()->user()?->name,
            ]);
        });

        return redirect()->back()->with('success', 'Persetujuan pengajuan dibatalkan.');
    }
}
