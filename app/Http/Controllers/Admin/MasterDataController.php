<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenisPkm;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterDataController extends Controller
{
    // === JENIS PKM ===
    public function indexJenis(Request $request)
    {
        $sortField = $request->get('sort', 'nama_jenis');
        $sortDir = $request->get('direction', 'asc');

        $listJenisPkm = JenisPkm::orderBy($sortField, $sortDir)->paginate(10)->withQueryString();

        return Inertia::render('Admin/MasterData/JenisPkm', [
            'listJenisPkm' => $listJenisPkm,
            'filters' => [
                'sort' => $sortField,
                'direction' => $sortDir,
            ],
        ]);
    }

    public function storeJenis(Request $request)
    {
        $validated = $request->validate([
            'nama_jenis' => 'required|string|max:255',
            'warna_icon' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/', Rule::unique('jenis_pkm', 'warna_icon')],
            'deskripsi' => 'nullable|string',
        ], [
            'warna_icon.regex' => 'Warna harus berupa kode hex 6 digit, misalnya #2563EB.',
            'warna_icon.unique' => 'Warna hex ini sudah dipakai jenis PKM lain. Pilih warna yang berbeda.',
        ]);

        $validated['warna_icon'] = strtoupper($validated['warna_icon']);

        JenisPkm::create($validated);

        return redirect()->back()->with('success', 'Jenis PKM berhasil ditambahkan.');
    }

    public function updateJenis(Request $request, int $id)
    {
        $validated = $request->validate([
            'nama_jenis' => 'required|string|max:255',
            'warna_icon' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/', Rule::unique('jenis_pkm', 'warna_icon')->ignore($id, 'id_jenis_pkm')],
            'deskripsi' => 'nullable|string',
        ], [
            'warna_icon.regex' => 'Warna harus berupa kode hex 6 digit, misalnya #2563EB.',
            'warna_icon.unique' => 'Warna hex ini sudah dipakai jenis PKM lain. Pilih warna yang berbeda.',
        ]);

        $jenis = JenisPkm::findOrFail($id);
        $validated['warna_icon'] = strtoupper($validated['warna_icon']);
        $jenis->update($validated);

        return redirect()->back()->with('success', 'Jenis PKM berhasil diperbarui.');
    }

    public function destroyJenis(int $id)
    {
        $jenis = JenisPkm::findOrFail($id);
        $pengajuanCount = $jenis->pengajuan()->count();

        if ($pengajuanCount > 0) {
            return redirect()->back()->with('error', "Tidak dapat menghapus jenis PKM '{$jenis->nama_jenis}' karena masih digunakan oleh {$pengajuanCount} pengajuan.");
        }

        $jenis->delete();

        return redirect()->back()->with('success', 'Jenis PKM berhasil dihapus.');
    }

    public function bulkDestroyJenis(Request $request)
    {
        $request->validate([
            'ids' => 'nullable|array',
            'ids.*' => 'integer|exists:jenis_pkm,id_jenis_pkm',
            'all' => 'nullable|boolean',
            'search' => 'nullable|string',
        ]);

        if ($request->all) {
            $query = JenisPkm::query();
            // Optional: add search logic if needed for JenisPkm
            
            $items = $query->get();
            $blocked = [];
            foreach ($items as $jenis) {
                if ($jenis->pengajuan()->count() > 0) {
                    $blocked[] = $jenis->nama_jenis;
                }
            }

            if (!empty($blocked)) {
                return redirect()->back()->with('error', 'Beberapa jenis PKM masih digunakan oleh pengajuan: '.implode(', ', $blocked));
            }

            $count = $items->count();
            $query->delete();
            return redirect()->back()->with('success', "{$count} semua jenis PKM berhasil dihapus.");
        }

        if (!$request->ids || count($request->ids) === 0) {
            return redirect()->back()->with('error', 'Tidak ada data yang dipilih.');
        }

        $blocked = [];
        foreach ($request->ids as $id) {
            $jenis = JenisPkm::find($id);
            if ($jenis && $jenis->pengajuan()->count() > 0) {
                $blocked[] = $jenis->nama_jenis;
            }
        }

        if (! empty($blocked)) {
            return redirect()->back()->with('error', 'Beberapa jenis PKM masih digunakan oleh pengajuan: '.implode(', ', $blocked));
        }

        JenisPkm::whereIn('id_jenis_pkm', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids).' jenis PKM berhasil dihapus massal.');
    }
}
