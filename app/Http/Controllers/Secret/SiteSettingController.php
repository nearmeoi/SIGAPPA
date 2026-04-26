<?php

namespace App\Http\Controllers\Secret;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Secret/SiteSettings/Index', [
            'settings' => [
                'visitor_count_offset' => (int) SiteSetting::get('visitor_count_offset', 0),
            ]
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'visitor_count_offset' => 'required|integer|min:0',
        ]);

        SiteSetting::set('visitor_count_offset', $request->visitor_count_offset);

        return redirect()->back()->with('success', 'Pengaturan situs berhasil diperbarui.');
    }
}
