<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Arsip;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArsipController extends Controller
{
    public function index(Request $request)
    {
        $sortField = $request->get('sort', 'created_at');
        $sortDir = $request->get('direction', 'desc');

        $listGroupedArsip = \App\Models\Aktivitas::whereHas('arsip')
            ->with(['pengajuan.user', 'pengajuan.jenisPkm', 'arsip'])
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->whereHas('pengajuan', function ($q) use ($escaped) {
                    $q->where('judul_kegiatan', 'like', "%{$escaped}%");
                });
            })
            ->when($sortField === 'judul_kegiatan', function ($query) use ($sortDir) {
                // Must join visually to sort natively unless we use complicated macros. We can order by subquery instead.
                $query->orderBy(\App\Models\Pengajuan::select('judul_kegiatan')
                    ->whereColumn('pengajuan.id_pengajuan', 'aktivitas.id_pengajuan')->limit(1), $sortDir);
            }, function ($query) use ($sortField, $sortDir) {
                $query->orderBy("aktivitas.{$sortField}", $sortDir);
            })
            ->select('aktivitas.*')
            ->paginate(15)
            ->withQueryString();

        $currentYear = date('Y');
        $listAvailableAktivitas = \App\Models\Aktivitas::where('status_pelaksanaan', 'selesai')
            ->whereYear('created_at', $currentYear)
            ->with('pengajuan')
            ->get()
            ->map(fn($a) => [
                'id_aktivitas' => $a->id_aktivitas,
                'id_pengajuan' => $a->id_pengajuan,
                'judul_kegiatan' => $a->pengajuan->judul_kegiatan ?? 'Unknown',
            ]);

        return Inertia::render('Admin/Arsip/Index', [
            'listGroupedArsip' => $listGroupedArsip,
            'listAvailableAktivitas' => $listAvailableAktivitas,
            'filters' => [
                'search' => $request->search ?? '',
                'sort' => $sortField,
                'direction' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_pengajuan' => 'required|exists:pengajuan,id_pengajuan',
            'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
            'nama_dokumen' => 'required|string|max:255',
            'jenis_arsip' => 'required|in:laporan_akhir,dokumentasi,dokumen_lain',
            'url_dokumen' => 'required|url|max:2048',
            'keterangan' => 'nullable|string|max:500',
        ]);

        Arsip::create($request->only([
            'id_pengajuan',
            'id_aktivitas',
            'nama_dokumen',
            'jenis_arsip',
            'url_dokumen',
            'keterangan',
        ]));

        return redirect()->back()->with('success', 'Arsip berhasil ditambahkan.');
    }

    public function update(Request $request, int $id)
    {
        $arsip = Arsip::findOrFail($id);

        $request->validate([
            'nama_dokumen' => 'required|string|max:255',
            'jenis_arsip' => 'required|in:laporan_akhir,dokumentasi,dokumen_lain',
            'url_dokumen' => 'required|url|max:2048',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $arsip->update($request->only(['nama_dokumen', 'jenis_arsip', 'url_dokumen', 'keterangan']));

        return redirect()->back()->with('success', 'Arsip berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $arsip = Arsip::findOrFail($id);
        $arsip->delete();

        return redirect()->back()->with('success', 'Arsip berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:arsip,id_arsip',
        ]);

        Arsip::whereIn('id_arsip', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' arsip berhasil dihapus massal.');
    }
}
