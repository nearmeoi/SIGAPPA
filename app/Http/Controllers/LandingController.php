<?php

namespace App\Http\Controllers;

use App\Models\Aktivitas;
use App\Models\Arsip;
use App\Models\EvaluasiSistem;
use App\Models\JenisPkm;
use App\Models\Kontak;
use App\Models\Pengajuan;
use App\Models\SiteSetting;
use App\Models\Testimoni;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LandingController extends Controller
{
    public function welcome()
    {
        return Inertia::render('Welcome');
    }

    public function index()
    {
        // Log kunjungan baru
        SiteSetting::logVisit(request()->ip(), request()->userAgent(), request()->path());

        // Ambil statistik lengkap
        $visitorStats = SiteSetting::getVisitorStats();

        // Peta PKM publik: hanya yang sudah diterima/selesai dan memiliki koordinat
        $pkmData = Pengajuan::with(['aktivitas.testimoni', 'aktivitas.arsip', 'timKegiatan.pegawai', 'jenisPkm'])
            ->whereNotNull('latitude')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id_pengajuan,
                'nama' => $p->judul_kegiatan,
                'tahun' => $p->aktivitas?->tgl_realisasi_mulai?->year ?? $p->tgl_mulai?->year ?? $p->created_at?->year ?? date('Y'),
                'jenis_pkm' => $p->jenisPkm?->nama_jenis ?? '',
                'warna_icon' => $p->jenisPkm?->warna_icon ?? '',
                'deskripsi_jenis' => $p->jenisPkm?->deskripsi ?? '',
                'status' => $p->aktivitas
                    ? ($p->aktivitas->status_pelaksanaan === 'selesai' ? 'selesai'
                        : ($p->aktivitas->status_pelaksanaan === 'berjalan' ? 'berlangsung' : 'belum_mulai'))
                    : (match ($p->status_pengajuan) {
                        'diproses' => 'ada_pengajuan',
                        'direvisi' => 'direvisi',
                        default => 'belum_mulai',
                    }),
                'is_review' => in_array($p->status_pengajuan, ['diproses', 'direvisi', 'diterima']) && $p->admin_read_at !== null,
                'deskripsi' => $p->kebutuhan ?? '',
                'thumbnail' => $p->aktivitas?->url_thumbnail ?? '',
                'provinsi' => $p->provinsi ?? '',
                'kabupaten' => $p->kota_kabupaten ?? '',
                'kecamatan' => $p->kecamatan ?? '',
                'desa' => $p->kelurahan_desa ?? '',
                'lat' => (float) ($p->latitude ?? 0),
                'lng' => (float) ($p->longitude ?? 0),
                'total_anggaran' => $p->total_anggaran ?? 0,
                'tim_kegiatan' => $p->timKegiatan->map(fn ($t) => [
                    'nama' => $t->pegawai ? $t->pegawai->nama_pegawai : $t->nama_mahasiswa,
                    'peran' => $t->peran_tim,
                ])->toArray(),
                'testimoni' => $p->aktivitas ? $p->aktivitas->testimoni->map(fn ($testimoni) => [
                    'nama_pemberi' => $testimoni->nama_pemberi,
                    'rating' => $testimoni->rating,
                    'pesan_ulasan' => $testimoni->pesan_ulasan,
                ])->toArray() : [],
                'arsip_laporan' => $p->aktivitas?->arsip?->where('jenis_arsip', 'laporan_akhir')->first()?->url_dokumen ?? null,
                'dokumentasi' => $p->aktivitas?->arsip?->where('jenis_arsip', 'foto_kegiatan')->first()?->url_dokumen ?? null,
                'tambahan' => ($p->aktivitas?->arsip?->where('jenis_arsip', 'dokumen_lain') ?? collect())
                    ->map(fn ($a) => [
                        'nama' => $a->nama_dokumen ?? 'Dokumen Lainnya',
                        'url' => $a->url_dokumen,
                    ])
                    ->values()
                    ->toArray(),
            ]);

        // Chart stats: 1 query untuk semua agregat tahun-status
        $allPengajuan = Pengajuan::selectRaw('YEAR(created_at) as year, status_pengajuan, COUNT(*) as total')
            ->whereNotNull('created_at')
            ->groupBy('year', 'status_pengajuan')
            ->get();

        $years = $allPengajuan->pluck('year')->unique()->sort()->values()->toArray();

        // Ringkasan statistik detail: 1 query untuk status pkm (mengikut logika dashboard admin)
        $pkmSummary = Pengajuan::leftJoin('aktivitas', 'pengajuan.id_pengajuan', '=', 'aktivitas.id_pengajuan')
            ->selectRaw("
                COUNT(*) as total,
                SUM(status_pengajuan = 'selesai') as total_selesai,
                SUM(CASE WHEN status_pengajuan = 'diterima' AND (aktivitas.status_pelaksanaan IS NULL OR aktivitas.status_pelaksanaan IN ('belum_mulai', 'persiapan')) THEN 1 ELSE 0 END) as total_belum_mulai,
                SUM(CASE WHEN status_pengajuan = 'diterima' AND aktivitas.status_pelaksanaan = 'berjalan' THEN 1 ELSE 0 END) as total_berlangsung
            ")->first();

        // Data per tahun untuk chart
        $yearlyStats = Pengajuan::leftJoin('aktivitas', 'pengajuan.id_pengajuan', '=', 'aktivitas.id_pengajuan')
            ->selectRaw("
                YEAR(pengajuan.created_at) as year,
                SUM(status_pengajuan = 'selesai') as selesai,
                SUM(CASE WHEN status_pengajuan = 'diterima' AND (aktivitas.status_pelaksanaan IS NULL OR aktivitas.status_pelaksanaan IN ('belum_mulai', 'persiapan')) THEN 1 ELSE 0 END) as belum_mulai,
                SUM(CASE WHEN status_pengajuan = 'diterima' AND aktivitas.status_pelaksanaan = 'berjalan' THEN 1 ELSE 0 END) as berlangsung
            ")
            ->whereNotNull('pengajuan.created_at')
            ->groupBy('year')
            ->get();

        $chartStats = [
            'years' => $years,
            'selesai' => collect($years)->map(fn ($y) => $yearlyStats->where('year', $y)->first()?->selesai ?? 0)->toArray(),
            'berlangsung' => collect($years)->map(fn ($y) => $yearlyStats->where('year', $y)->first()?->berlangsung ?? 0)->toArray(),
            'belum_mulai' => collect($years)->map(fn ($y) => $yearlyStats->where('year', $y)->first()?->belum_mulai ?? 0)->toArray(),
            'total_pengajuan' => (int) ($pkmSummary->total ?? 0),
            'total_diterima' => (int) (($pkmSummary->total_belum_mulai ?? 0) + ($pkmSummary->total_berlangsung ?? 0)),
            'total_selesai' => (int) ($pkmSummary->total_selesai ?? 0),
            'total_belum_mulai' => (int) ($pkmSummary->total_belum_mulai ?? 0),
        ];

        $testimonials = EvaluasiSistem::whereNotNull('masukan')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function($item) {
                // Hitung rata-rata rating dari 5 pertanyaan (q1-q5)
                $avgRating = round(($item->q1 + $item->q2 + $item->q3 + $item->q4 + $item->q5) / 5);

                return [
                    'nama_pemberi' => $item->nama,
                    'rating' => $avgRating,
                    'pesan_ulasan' => $item->masukan,
                    'asal_instansi' => $item->asal_instansi,
                ];
            });

        // Statistik untuk stat cards
        $evalStats = EvaluasiSistem::selectRaw('COUNT(*) as total, AVG((q1+q2+q3+q4+q5)/5) as avg_rating')->first();
        $totalTestimoni = \App\Models\Testimoni::count();
        $testimoniStats = [
            'total_feedback' => (int) ($evalStats->total ?? 0),
            'avg_rating' => round((float) ($evalStats->avg_rating ?? 0), 1),
            'total_testimoni' => $totalTestimoni,
        ];

        return Inertia::render('LandingPage', [
            'pkmData' => $pkmData,
            'testimonials' => $testimonials,
            'testimoniStats' => $testimoniStats,
            'visitorStats' => $visitorStats,
            'listKontak' => Kontak::orderBy('created_at', 'asc')
                ->get()
                ->map(fn($k) => [
                    'id_kontak' => $k->id_kontak,
                    'ikon' => $k->ikon,
                    'label' => $k->label,
                    'nilai_kontak' => $k->nilai_kontak,
                ]),
        ]);
    }

    /**
     * Tampilkan form pengumpulan arsip publik.
     */
    public function showArsipKumpul($kode)
    {
        $pengajuan = Pengajuan::where('kode_unik', $kode)->firstOrFail();

        return Inertia::render('Public/PengumpulanArsip', [
            'kode' => $kode,
            'namaKegiatan' => $pengajuan->judul_kegiatan,
        ]);
    }

    /**
     * Simpan arsip publik.
     */
    public function storeArsipKumpul(Request $request, $kode)
    {
        $pengajuan = Pengajuan::where('kode_unik', $kode)->firstOrFail();
        $aktivitas = Aktivitas::where('id_pengajuan', $pengajuan->id_pengajuan)->first();

        if (! $aktivitas) {
            $aktivitas = Aktivitas::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_pelaksanaan' => 'berjalan',
            ]);
        }

        $request->validate([
            'laporan' => 'required|url|max:2048',
            'dokumentasi' => 'required|url|max:2048',
            'dokumen_lainnya' => 'nullable|array|max:5',
            'dokumen_lainnya.*.nama_dokumen' => 'nullable|string|max:255',
            'dokumen_lainnya.*.url_dokumen' => 'nullable|url|max:2048',
        ]);

        $commonData = [
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'id_aktivitas' => $aktivitas?->id_aktivitas,
            'keterangan' => 'Dikumpulkan via form publik',
        ];

        Arsip::create(array_merge($commonData, [
            'nama_dokumen' => 'Laporan Akhir',
            'jenis_arsip' => 'laporan_akhir',
            'url_dokumen' => $request->laporan,
        ]));

        Arsip::create(array_merge($commonData, [
            'nama_dokumen' => 'Dokumentasi Kegiatan',
            'jenis_arsip' => 'foto_kegiatan',
            'url_dokumen' => $request->dokumentasi,
        ]));

        foreach (($request->dokumen_lainnya ?? []) as $doc) {
            if (! empty($doc['url_dokumen'])) {
                Arsip::create(array_merge($commonData, [
                    'nama_dokumen' => $doc['nama_dokumen'] ?? 'Dokumen Tambahan',
                    'jenis_arsip' => 'dokumen_lain',
                    'url_dokumen' => $doc['url_dokumen'],
                ]));
            }
        }

        return redirect()->back()->with('success', 'Arsip berhasil dikumpulkan.');
    }

    /**
     * Tampilkan form testimoni publik.
     */
    public function showTestimoni($kode)
    {
        $pengajuan = Pengajuan::where('kode_unik', $kode)->firstOrFail();

        return Inertia::render('Public/Testimoni', [
            'kode' => $kode,
            'namaKegiatan' => $pengajuan->judul_kegiatan,
        ]);
    }

    /**
     * Simpan testimoni publik.
     */
    public function storeTestimoni(Request $request, $kode)
    {
        $pengajuan = Pengajuan::where('kode_unik', $kode)->firstOrFail();
        $aktivitas = Aktivitas::where('id_pengajuan', $pengajuan->id_pengajuan)->first();

        if (! $aktivitas) {
            $aktivitas = Aktivitas::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_pelaksanaan' => 'berjalan',
            ]);
        }

        $request->validate([
            'nama_pemberi' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'pesan_ulasan' => 'nullable|string|max:2000',
            'masukan' => 'nullable|string|max:2000',
        ]);

        Testimoni::create([
            'id_aktivitas' => $aktivitas?->id_aktivitas,
            'nama_pemberi' => $request->nama_pemberi,
            'rating' => $request->rating,
            'pesan_ulasan' => $request->pesan_ulasan,
            'masukan' => $request->masukan,
        ]);

        return redirect()->back()->with('success', 'Testimoni berhasil dikirim.');
    }

    /**
     * Store general public testimony (not tied to specific activity).
     */
    public function storePublicTestimoni(Request $request)
    {
        $request->validate([
            'nama_pemberi' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'pesan_ulasan' => 'nullable|string|max:2000',
            'masukan' => 'nullable|string|max:2000',
        ]);

        Testimoni::create([
            'id_aktivitas' => null,
            'nama_pemberi' => $request->nama_pemberi,
            'rating' => $request->rating,
            'pesan_ulasan' => $request->pesan_ulasan,
            'masukan' => $request->masukan,
        ]);

        return redirect()->back()->with('success', 'Testimoni berhasil dikirim.');
    }

    public function storeEvaluasiSistem(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'asal_instansi' => 'nullable|string|max:255',
            'no_telp' => 'required|string|max:50',
            'q1' => 'required|integer|min:1|max:5',
            'q2' => 'required|integer|min:1|max:5',
            'q3' => 'required|integer|min:1|max:5',
            'q4' => 'required|integer|min:1|max:5',
            'q5' => 'required|integer|min:1|max:5',
            'masukan' => 'nullable|string|max:1000',
        ]);

        EvaluasiSistem::create($request->all());

        return redirect()->back()->with('success', 'Terima kasih atas feedback Anda.');
    }
}
