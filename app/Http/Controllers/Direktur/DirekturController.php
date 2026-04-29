<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Pengajuan;
use App\Models\PengajuanLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DirekturController extends Controller
{
    public function index()
    {
        return redirect()->route('admin.dashboard');
    }

    public function show(int $id)
    {
        return redirect()->route('admin.pengajuan.show', $id);
    }

    /**
     * Direktur menerima pengajuan (wajib catatan).
     */
    public function approve(Request $request, int $id)
    {
        $request->validate([
            'catatan' => 'required|string|min:5|max:2000',
        ], [
            'catatan.required' => 'Catatan wajib diisi sebelum menerima pengajuan.',
            'catatan.min' => 'Catatan minimal 5 karakter.',
        ]);

        $pengajuan = Pengajuan::where('status_pengajuan', Pengajuan::STATUS_DIAJUKAN)->findOrFail($id);

        DB::transaction(function () use ($pengajuan, $request) {
            $pengajuan->status_pengajuan = Pengajuan::STATUS_DITERIMA;
            $pengajuan->catatan_direktur = $request->catatan;
            $pengajuan->direktur_approved_at = now();
            $pengajuan->admin_read_at = null; // Reset agar Admin dapat notif
            $pengajuan->save();

            // Buat aktivitas otomatis ketika diterima
            Aktivitas::firstOrCreate(
                ['id_pengajuan' => $pengajuan->id_pengajuan],
                ['status_pelaksanaan' => 'belum_mulai'],
            );

            PengajuanLog::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_lama' => Pengajuan::STATUS_DIAJUKAN,
                'status_baru' => Pengajuan::STATUS_DITERIMA,
                'catatan' => $request->catatan,
                'changed_by_user_id' => auth()->id(),
                'changed_by_name' => auth()->user()?->name,
            ]);
        });

        try { broadcast(new \App\Events\NotificationUpdated('updated', 'Pengajuan disetujui Direktur')); } catch (\Throwable) {}

        return redirect()->route('admin.dashboard')->with('success', 'Pengajuan berhasil diterima.');
    }

    /**
     * Direktur menolak pengajuan (wajib catatan alasan).
     */
    public function decline(Request $request, int $id)
    {
        $request->validate([
            'catatan' => 'required|string|min:5|max:2000',
        ], [
            'catatan.required' => 'Catatan alasan penolakan wajib diisi.',
            'catatan.min' => 'Catatan minimal 5 karakter.',
        ]);

        $pengajuan = Pengajuan::where('status_pengajuan', Pengajuan::STATUS_DIAJUKAN)->findOrFail($id);

        DB::transaction(function () use ($pengajuan, $request) {
            $pengajuan->status_pengajuan = Pengajuan::STATUS_DITOLAK;
            $pengajuan->catatan_direktur = $request->catatan;
            $pengajuan->admin_read_at = null; // Reset agar Admin dapat notif
            $pengajuan->save();

            PengajuanLog::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_lama' => Pengajuan::STATUS_DIAJUKAN,
                'status_baru' => Pengajuan::STATUS_DITOLAK,
                'catatan' => $request->catatan,
                'changed_by_user_id' => auth()->id(),
                'changed_by_name' => auth()->user()?->name,
            ]);
        });

        try { broadcast(new \App\Events\NotificationUpdated('updated', 'Pengajuan ditolak Direktur')); } catch (\Throwable) {}

        return redirect()->route('admin.dashboard')->with('success', 'Pengajuan ditolak.');
    }

    /**
     * Direktur meminta revisi (wajib catatan).
     */
    public function revise(Request $request, int $id)
    {
        $request->validate([
            'catatan' => 'required|string|min:5|max:2000',
        ], [
            'catatan.required' => 'Catatan alasan revisi wajib diisi.',
            'catatan.min' => 'Catatan minimal 5 karakter.',
        ]);

        $pengajuan = Pengajuan::where('status_pengajuan', Pengajuan::STATUS_DIAJUKAN)->findOrFail($id);

        DB::transaction(function () use ($pengajuan, $request) {
            $pengajuan->status_pengajuan = Pengajuan::STATUS_REVISI_DIREKTUR;
            $pengajuan->catatan_direktur = $request->catatan;
            $pengajuan->admin_read_at = null; // Reset agar Admin dapat notif
            $pengajuan->save();

            PengajuanLog::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_lama' => Pengajuan::STATUS_DIAJUKAN,
                'status_baru' => Pengajuan::STATUS_REVISI_DIREKTUR,
                'catatan' => $request->catatan,
                'changed_by_user_id' => auth()->id(),
                'changed_by_name' => auth()->user()?->name,
            ]);
        });

        try { broadcast(new \App\Events\NotificationUpdated('updated', 'Direktur meminta revisi pengajuan')); } catch (\Throwable) {}

        return redirect()->route('admin.dashboard')->with('success', 'Pengajuan dikembalikan untuk direvisi.');
    }
}
