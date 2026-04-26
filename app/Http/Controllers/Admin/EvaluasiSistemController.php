<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiSistem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EvaluasiSistemController extends Controller
{
    public function index()
    {
        $evaluasi = EvaluasiSistem::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/EvaluasiSistem/Index', [
            'evaluasi' => $evaluasi
        ]);
    }

    public function updateDate(Request $request, int $id)
    {
        if ($request->user()?->role !== 'superadmin') {
            abort(403);
        }

        $request->validate(['created_at' => 'required|date']);

        $evaluasi = EvaluasiSistem::findOrFail($id);
        $evaluasi->timestamps = false;
        $evaluasi->created_at = Carbon::parse($request->created_at);
        $evaluasi->save();

        return redirect()->back()->with('success', 'Tanggal feedback berhasil diubah.');
    }

    public function destroy($id)
    {
        $evaluasi = EvaluasiSistem::findOrFail($id);
        $evaluasi->delete();

        return redirect()->back()->with('success', 'Data evaluasi sistem berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:evaluasi_sistem,id_evaluasi',
        ]);

        EvaluasiSistem::whereIn('id_evaluasi', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' evaluasi berhasil dihapus massal.');
    }
}
