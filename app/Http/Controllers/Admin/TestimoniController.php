<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Testimoni;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestimoniController extends Controller
{
    public function index(Request $request)
    {
        $listGroupedTestimoni = Aktivitas::whereHas('testimoni')
            ->with(['pengajuan', 'testimoni'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('pengajuan', fn($q) => $q->where('judul_kegiatan', 'like', "%{$search}%"));
            })
            ->paginate(12)
            ->withQueryString();

        $listAktivitas = Aktivitas::whereNotNull('id_pengajuan')
            ->where(function ($query) {
                $query->where('status_pelaksanaan', 'selesai')
                      ->orWhereHas('pengajuan', function ($q) {
                          $q->where('status_pengajuan', 'selesai');
                      });
            })
            ->with('pengajuan')
            ->get()
            ->map(fn ($a) => [
                'id_aktivitas' => $a->id_aktivitas,
                'judul_kegiatan' => $a->pengajuan?->judul_kegiatan ?? 'Tanpa Judul',
            ]);

        return Inertia::render('Admin/Testimoni/Index', [
            'listGroupedTestimoni' => $listGroupedTestimoni,
            'listAktivitas' => $listAktivitas,
            'filters' => [
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_aktivitas' => 'nullable|exists:aktivitas,id_aktivitas',
            'nama_pemberi' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'pesan_ulasan' => 'nullable|string|max:2000',
            'masukan' => 'nullable|string|max:2000',
        ]);

        Testimoni::create($request->only('id_aktivitas', 'nama_pemberi', 'rating', 'pesan_ulasan', 'masukan'));

        return redirect()->back()->with('success', 'Testimoni berhasil ditambahkan.');
    }

    public function update(Request $request, int $id)
    {
        $testimoni = Testimoni::findOrFail($id);

        $request->validate([
            'id_aktivitas' => 'nullable|exists:aktivitas,id_aktivitas',
            'nama_pemberi' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'pesan_ulasan' => 'nullable|string|max:2000',
            'masukan' => 'nullable|string|max:2000',
            'created_at' => 'nullable|date',
        ]);

        $testimoni->fill($request->only('id_aktivitas', 'nama_pemberi', 'rating', 'pesan_ulasan', 'masukan'));

        if ($request->user()?->role === 'superadmin' && $request->filled('created_at')) {
            $testimoni->timestamps = false;
            $testimoni->created_at = Carbon::parse($request->created_at);
        }

        $testimoni->save();

        return redirect()->back()->with('success', 'Testimoni berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $testimoni = Testimoni::findOrFail($id);
        $testimoni->delete();

        return redirect()->back()->with('success', 'Testimoni berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:testimoni,id_testimoni',
        ]);

        Testimoni::whereIn('id_testimoni', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' testimoni berhasil dihapus massal.');
    }
}
