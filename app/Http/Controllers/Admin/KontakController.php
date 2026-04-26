<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kontak;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KontakController extends Controller
{
    public function index()
    {
        $kontaks = Kontak::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Kontak/Index', [
            'kontaks' => $kontaks,
            'visitorData' => [
                'visitor_count' => (int) SiteSetting::get('visitor_count', 0),
                'visitor_count_offset' => (int) SiteSetting::get('visitor_count_offset', 0),
            ],
        ]);
    }

    public function updateVisitorOffset(Request $request)
    {
        $request->validate(['offset' => 'required|integer|min:0']);
        SiteSetting::set('visitor_count_offset', $request->offset);
        return redirect()->back()->with('success', 'Offset pengunjung berhasil diperbarui.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'platform' => 'required|string|max:255',
            'nilai_kontak' => 'required|string|max:1000',
            'label' => 'nullable|string|max:255',
            'ikon' => 'nullable|string|max:255',
        ]);

        Kontak::create($request->all());

        return redirect()->back()->with('success', 'Data kontak berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'platform' => 'required|string|max:255',
            'nilai_kontak' => 'required|string|max:1000',
            'label' => 'nullable|string|max:255',
            'ikon' => 'nullable|string|max:255',
        ]);

        $kontak = Kontak::findOrFail($id);
        $kontak->update($request->all());

        return redirect()->back()->with('success', 'Data kontak berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $kontak = Kontak::findOrFail($id);
        $kontak->delete();

        return redirect()->back()->with('success', 'Data kontak berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:kontak,id_kontak',
        ]);

        Kontak::whereIn('id_kontak', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' kontak berhasil dihapus massal.');
    }
}
