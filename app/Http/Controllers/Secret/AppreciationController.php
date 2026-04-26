<?php

namespace App\Http\Controllers\Secret;

use App\Http\Controllers\Controller;
use App\Models\DeveloperAppreciation;
use App\Models\DeveloperDocumentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AppreciationController extends Controller
{
    public function index()
    {
        $developers = DeveloperAppreciation::orderBy('urutan')->get();
        $docs = DeveloperDocumentation::orderBy('urutan')->get();

        return Inertia::render('Secret/Appreciation/Index', [
            'developers' => $developers,
            'docs' => $docs,
        ]);
    }

    public function storeDev(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'peran' => 'nullable|string|max:255',
            'asal_instansi' => 'nullable|string|max:255',
            'foto' => 'nullable|image|max:2048',
            'urutan' => 'required|integer',
        ]);

        $data = $request->only(['nama', 'peran', 'asal_instansi', 'urutan']);

        if ($request->hasFile('foto')) {
            $data['foto'] = '/storage/' . $request->file('foto')->store('developer/foto', 'public');
        }

        DeveloperAppreciation::create($data);
        return redirect()->back()->with('success', 'Data developer berhasil ditambahkan.');
    }

    public function updateDev(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'peran' => 'nullable|string|max:255',
            'asal_instansi' => 'nullable|string|max:255',
            'foto' => 'nullable|image|max:2048',
            'urutan' => 'required|integer',
        ]);

        $dev = DeveloperAppreciation::findOrFail($id);
        $data = $request->only(['nama', 'peran', 'asal_instansi', 'urutan']);

        if ($request->hasFile('foto')) {
            // Delete old file
            if ($dev->foto && str_starts_with($dev->foto, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $dev->foto));
            }
            $data['foto'] = '/storage/' . $request->file('foto')->store('developer/foto', 'public');
        }

        $dev->update($data);
        return redirect()->back()->with('success', 'Data developer berhasil diupdate.');
    }

    public function destroyDev($id)
    {
        $dev = DeveloperAppreciation::findOrFail($id);
        if ($dev->foto && str_starts_with($dev->foto, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $dev->foto));
        }
        $dev->delete();
        return redirect()->back()->with('success', 'Data dihapus.');
    }

    public function storeDoc(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'foto' => 'required|image|max:5120',
            'urutan' => 'required|integer',
        ]);

        $data = $request->only(['judul', 'deskripsi', 'urutan']);
        $data['foto'] = '/storage/' . $request->file('foto')->store('developer/dokumentasi', 'public');

        DeveloperDocumentation::create($data);
        return redirect()->back()->with('success', 'Dokumentasi ditambahkan.');
    }

    public function updateDoc(Request $request, $id)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'foto' => 'nullable|image|max:5120',
            'urutan' => 'required|integer',
        ]);

        $doc = DeveloperDocumentation::findOrFail($id);
        $data = $request->only(['judul', 'deskripsi', 'urutan']);

        if ($request->hasFile('foto')) {
            if ($doc->foto && str_starts_with($doc->foto, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $doc->foto));
            }
            $data['foto'] = '/storage/' . $request->file('foto')->store('developer/dokumentasi', 'public');
        }

        $doc->update($data);
        return redirect()->back()->with('success', 'Dokumentasi diupdate.');
    }

    public function destroyDoc($id)
    {
        $doc = DeveloperDocumentation::findOrFail($id);
        if ($doc->foto && str_starts_with($doc->foto, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $doc->foto));
        }
        $doc->delete();
        return redirect()->back()->with('success', 'Dokumentasi dihapus.');
    }
}
