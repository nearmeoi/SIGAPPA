<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Pengajuan;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for admin/direktur.
     */
    public function index()
    {
        $user = auth()->user();
        $role = strtolower($user->role ?? '');
        $isDirektur = $role === 'direktur';
        $isAdmin = in_array($role, ['admin', 'superadmin', 'secret_account']);

        $counts = Pengajuan::selectRaw("
            SUM(status_pengajuan = 'diproses')  as pengajuan_baru,
            SUM(status_pengajuan = 'direvisi')  as perlu_direvisi,
            SUM(status_pengajuan = 'diterima')  as diterima,
            SUM(status_pengajuan = 'diajukan')  as diajukan,
            SUM(status_pengajuan = 'diajukan' AND admin_read_at IS NULL) as diajukan_baru
        ")->first();

        $kegiatanBerjalan = Aktivitas::where('status_pelaksanaan', 'berjalan')->count();

        $query = Pengajuan::query();
        if ($isDirektur) {
            // Direktur hanya perlu melihat yang menunggu keputusannya
            $query->where('status_pengajuan', 'diajukan');
            $unreadCount = Pengajuan::where('status_pengajuan', 'diajukan')
                ->whereNull('admin_read_at')
                ->count();
        } else {
            // Admin: semua status yang butuh tindakan, termasuk revisi dari direktur
            $adminStatuses = ['diproses', 'direvisi', 'revisi_direktur', 'diterima', 'ditolak', 'selesai'];
            $query->whereIn('status_pengajuan', $adminStatuses);
            $unreadCount = Pengajuan::whereIn('status_pengajuan', $adminStatuses)
                ->whereNull('admin_read_at')
                ->count();
        }

        $items = $query->with('aktivitas')
            ->select('id_pengajuan', 'status_pengajuan', 'catatan_admin', 'catatan_direktur', 'updated_at', 'admin_read_at')
            ->orderBy('updated_at', 'desc')
            ->limit(15)
            ->get()
            ->map(fn($p) => [
                'id_pengajuan' => $p->id_pengajuan,
                'judul_kegiatan' => $p->aktivitas->first()?->judul_pkm ?? ('Pengajuan PKM #' . $p->id_pengajuan),
                'status_pengajuan' => $p->status_pengajuan,
                'catatan_admin' => ($isAdmin && in_array($p->status_pengajuan, ['diterima', 'ditolak', 'direvisi'])) ? $p->catatan_direktur : $p->catatan_admin,
                'created_at' => $p->updated_at->toISOString(),
                'admin_read_at' => $p->admin_read_at ? $p->admin_read_at->toISOString() : null,
            ]);

        return response()->json([
            'counts' => [
                'pengajuan_baru' => (int) ($counts->pengajuan_baru ?? 0),
                'perlu_direvisi' => (int) ($counts->perlu_direvisi ?? 0),
                'pengajuan_diterima' => (int) ($counts->diterima ?? 0),
                'pengajuan_diajukan' => (int) ($counts->diajukan ?? 0),
                'unread_count' => $unreadCount,
                'kegiatan_berjalan' => $kegiatanBerjalan,
            ],
            'items' => $items,
        ]);
    }

    /**
     * Mark specific notifications as read.
     */
    public function markRead(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:pengajuan,id_pengajuan',
        ]);

        Pengajuan::whereIn('id_pengajuan', $validated['ids'])
            ->update(['admin_read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead()
    {
        $user = auth()->user();
        $role = strtolower($user->role ?? '');
        $isDirektur = $role === 'direktur';

        $query = Pengajuan::whereNull('admin_read_at');

        if ($isDirektur) {
            $query->where('status_pengajuan', 'diajukan');
        } else {
            $query->whereIn('status_pengajuan', ['diproses', 'direvisi', 'revisi_direktur', 'diterima', 'ditolak', 'selesai']);
        }

        $query->update(['admin_read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
