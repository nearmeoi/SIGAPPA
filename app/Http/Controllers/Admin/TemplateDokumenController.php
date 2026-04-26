<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemplateDokumen;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class TemplateDokumenController extends Controller
{
    public function index()
    {
        $templates = TemplateDokumen::all()->keyBy('jenis');
        return Inertia::render('Admin/TemplateDokumen/Index', [
            'templates' => $templates
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis' => 'required|string|in:surat_permohonan,proposal,panduan',
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240', // max 10MB
        ]);

        $jenis = $request->jenis;
        $file = $request->file('file');

        // Buat nama file unik untuk mencegah conflict cache dsb.
        $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());

        // Simpan file
        $path = $file->storeAs('templates', $filename, 'public');

        // Cari record lama untuk dihapus filenya
        $templateLama = TemplateDokumen::where('jenis', $jenis)->first();
        if ($templateLama && Storage::disk('public')->exists($templateLama->file_path)) {
            Storage::disk('public')->delete($templateLama->file_path);
        }

        TemplateDokumen::updateOrCreate(
            ['jenis' => $jenis],
            [
                'nama_file' => $file->getClientOriginalName(),
                'file_path' => $path,
            ]
        );

        return redirect()->back()->with('success', 'Template dokumen berhasil diperbarui!');
    }

    public function destroy($jenis)
    {
        $template = TemplateDokumen::where('jenis', $jenis)->first();
        if ($template) {
            if (Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }
            $template->delete();
        }

        return redirect()->back()->with('success', 'Template dokumen berhasil dihapus!');
    }

    public function downloadTemplate($jenis)
    {
        $template = TemplateDokumen::where('jenis', $jenis)->first();
        if (!$template || !Storage::disk('public')->exists($template->file_path)) {
            abort(404, 'Template dokumen tidak ditemukan.');
        }

        return response()->download(storage_path('app/public/' . $template->file_path), $template->nama_file);
    }
}
