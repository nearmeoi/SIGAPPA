<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Pengajuan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ── 1 query untuk semua statistik pengajuan (sebelumnya 4 query terpisah) ──
        $statusCounts = Pengajuan::selectRaw("
            COUNT(*)                                    as total,
            SUM(status_pengajuan = 'diproses')          as diproses,
            SUM(status_pengajuan = 'diproses' AND admin_read_at IS NULL) as diproses_baru,
            SUM(status_pengajuan = 'diproses' AND admin_read_at IS NOT NULL) as diproses_reviu,
            SUM(status_pengajuan = 'diajukan')          as diajukan,
            SUM(status_pengajuan = 'diterima')          as diterima,
            SUM(status_pengajuan = 'ditolak')           as ditolak,
            SUM(status_pengajuan = 'direvisi')          as direvisi,
            SUM(status_pengajuan = 'selesai')           as selesai
        ")->first();

        $aktivitasCounts = Aktivitas::selectRaw("
            SUM(CASE WHEN status_pelaksanaan = 'berjalan' THEN 1 ELSE 0 END) as berjalan,
            SUM(CASE WHEN status_pelaksanaan = 'selesai' THEN 1 ELSE 0 END) as selesai
        ")->first();

        // Card diterima & belum mulai: hanya data tahun 2025 ke atas
        $pengajuanDiterima2025 = Pengajuan::where('status_pengajuan', 'diterima')
            ->where('created_at', '>=', '2025-01-01')
            ->count();

        $aktivitasBelumMulai2025 = Aktivitas::whereIn('status_pelaksanaan', ['belum_mulai', 'persiapan'])
            ->where('tgl_mulai', '>=', '2025-01-01')
            ->count();

        $isDirektur = auth()->user()?->role === 'direktur';

        $recentPengajuan = Pengajuan::with(['user', 'aktivitas.jenisPkm'])
            ->where('status_pengajuan', $isDirektur ? 'diajukan' : 'diproses')
            ->latest('updated_at')
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id_pengajuan' => $p->id_pengajuan,
                'judul_kegiatan' => $p->aktivitas->first()?->judul_pkm ?? ('Pengajuan PKM #' . $p->id_pengajuan),
                'created_at' => $p->updated_at?->format('d M Y') ?? '-',
                'status_pengajuan' => $p->status_pengajuan,
                'nama_pengusul' => $p->nama_pengusul ?? $p->user?->name,
                'user' => $p->user ? [
                    'id_user' => $p->user->id_user,
                    'name' => $p->user->name,
                    'email' => $p->user->email,
                    'role' => $p->user->role,
                ] : null,
                'jenis_pkm' => $p->aktivitas->first()?->jenisPkm->first() ? [
                    'nama_jenis' => $p->aktivitas->first()->jenisPkm->first()->nama_jenis,
                ] : null,
            ]);

        $pkmMapData = Pengajuan::with(['aktivitas.jenisPkm', 'aktivitas.testimoni', 'aktivitas.arsip', 'aktivitas.timKegiatan.pegawai'])
            ->whereNotNull('latitude')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id_pengajuan,
                'nama' => $p->aktivitas->first()?->judul_pkm ?? ('Pengajuan PKM #' . $p->id_pengajuan),
                'jenis_nama' => $p->aktivitas->first()?->jenisPkm->first()?->nama_jenis ?? 'Jenis Lainnya',
                'jenis_pkm' => $p->aktivitas->first()?->jenisPkm->first()?->nama_jenis ?? '',
                'warna_icon' => $p->aktivitas->first()?->jenisPkm->first()?->warna_icon ?? '#64748b',
                'deskripsi_jenis' => $p->aktivitas->first()?->jenisPkm->first()?->deskripsi ?? '',
                'tahun' => $p->aktivitas->first()?->tgl_realisasi_mulai?->year ?? $p->created_at?->year ?? date('Y'),
                'status' => $p->aktivitas->first()
                    ? ($p->aktivitas->first()->status_pelaksanaan === 'selesai' ? 'selesai'
                        : ($p->aktivitas->first()->status_pelaksanaan === 'berjalan' ? 'berlangsung' : 'belum_mulai'))
                    : ($p->status_pengajuan === 'diproses' ? 'ada_pengajuan' : ($p->status_pengajuan === 'diterima' ? 'belum_mulai' : 'belum_mulai')),
                'is_review' => $p->status_pengajuan === 'diproses' && $p->admin_read_at !== null,
                'status_pengajuan' => $p->status_pengajuan,
                'deskripsi' => $p->kebutuhan ?? '',
                'thumbnail' => $p->aktivitas->first()?->url_thumbnail,
                'provinsi' => $p->provinsi ?? '',
                'kabupaten' => $p->kota_kabupaten ?? '',
                'kecamatan' => $p->kecamatan ?? '',
                'desa' => $p->kelurahan_desa ?? '',
                'lat' => (float) ($p->latitude ?? 0),
                'lng' => (float) ($p->longitude ?? 0),
                'lokasi_tambahan' => is_string($p->lokasi_tambahan) ? json_decode($p->lokasi_tambahan, true) : (is_array($p->lokasi_tambahan) ? $p->lokasi_tambahan : []),
                'total_anggaran' => (float) ($p->aktivitas->sum('total_anggaran') ?? 0),
                'tim_kegiatan' => $p->aktivitas->flatMap(fn($a) => $a->timKegiatan)
                    ->map(fn($tim) => [
                        'nama' => $tim->pegawai ? $tim->pegawai->nama_pegawai : $tim->nama_mahasiswa,
                        'peran' => $tim->peran_tim,
                    ])
                    ->unique('nama')
                    ->values()
                    ->toArray(),
                'testimoni' => $p->aktivitas->flatMap(fn($a) => $a->testimoni)
                    ->map(fn($testimoni) => [
                        'nama_pemberi' => $testimoni->nama_pemberi,
                        'rating' => (int) $testimoni->rating,
                        'pesan_ulasan' => $testimoni->pesan_ulasan,
                    ])
                    ->values()
                    ->toArray(),
                'arsip_laporan' => $p->aktivitas->first()?->arsip?->where('jenis_arsip', 'laporan_akhir')->first()?->url_dokumen ?? null,
                'dokumentasi' => $p->aktivitas->first()?->arsip?->where('jenis_arsip', 'foto_kegiatan')->first()?->url_dokumen ?? null,
                'tambahan' => ($p->aktivitas->first()?->arsip?->where('jenis_arsip', 'dokumen_lain') ?? collect())
                    ->map(fn($a) => [
                        'nama' => $a->nama_dokumen ?? 'Dokumen Lainnya',
                        'url' => $a->url_dokumen,
                    ])
                    ->values()
                    ->toArray(),
            ])
            ->values()
            ->toArray();

        // ── Pie Chart: Sebaran Berdasarkan Jenis PKM ──
        $pieChartData = \Illuminate\Support\Facades\DB::table('pengajuan')
            ->join('aktivitas', 'pengajuan.id_pengajuan', '=', 'aktivitas.id_pengajuan')
            ->join('aktivitas_jenis_pkm', 'aktivitas.id_aktivitas', '=', 'aktivitas_jenis_pkm.id_aktivitas')
            ->join('jenis_pkm', 'aktivitas_jenis_pkm.id_jenis_pkm', '=', 'jenis_pkm.id_jenis_pkm')
            ->whereNull('pengajuan.deleted_at')
            ->selectRaw('jenis_pkm.id_jenis_pkm, jenis_pkm.nama_jenis, jenis_pkm.warna_icon, COUNT(DISTINCT pengajuan.id_pengajuan) as total')
            ->groupBy('jenis_pkm.id_jenis_pkm', 'jenis_pkm.nama_jenis', 'jenis_pkm.warna_icon')
            ->get()
            ->map(fn($item) => [
                'label' => $item->nama_jenis,
                'color' => $item->warna_icon,
                'count' => $item->total,
            ])
            ->values()
            ->toArray();

        // ── Bar Chart: Tren Pertahun per Jenis PKM ──
        $yearlyRaw = \Illuminate\Support\Facades\DB::table('pengajuan')
                ->join('aktivitas', 'pengajuan.id_pengajuan', '=', 'aktivitas.id_pengajuan')
                ->join('aktivitas_jenis_pkm', 'aktivitas.id_aktivitas', '=', 'aktivitas_jenis_pkm.id_aktivitas')
                ->join('jenis_pkm', 'aktivitas_jenis_pkm.id_jenis_pkm', '=', 'jenis_pkm.id_jenis_pkm')
                ->whereNull('pengajuan.deleted_at')
                ->selectRaw('YEAR(pengajuan.created_at) as year, jenis_pkm.id_jenis_pkm, jenis_pkm.nama_jenis, jenis_pkm.warna_icon, COUNT(DISTINCT pengajuan.id_pengajuan) as total')
                ->groupBy('year', 'jenis_pkm.id_jenis_pkm', 'jenis_pkm.nama_jenis', 'jenis_pkm.warna_icon')
                ->get();

            $allYears = $yearlyRaw->pluck('year')->unique()->sort()->values()->toArray();
            if (empty($allYears)) {
                $allYears = [(int) date('Y')];
            }

            // Hash-map lookup O(1) menggantikan nested firstWhere() yang O(n²)
            $lookup = $yearlyRaw->keyBy(fn($r) => "{$r->year}_{$r->id_jenis_pkm}");

            $uniqueJenis = $yearlyRaw
                ->map(fn($item) => [
                    'id_jenis_pkm' => $item->id_jenis_pkm,
                    'nama_jenis' => $item->nama_jenis,
                    'warna_icon' => $item->warna_icon,
                ])
                ->unique('id_jenis_pkm')
                ->values();

            $barChartDatasets = $uniqueJenis->map(function ($jenis) use ($allYears, $lookup) {
                return [
                    'name' => $jenis['nama_jenis'],
                    'label' => $jenis['nama_jenis'],
                    'data' => array_map(
                        fn($y) => (int) ($lookup->get("{$y}_{$jenis['id_jenis_pkm']}")?->total ?? 0),
                        $allYears
                    ),
                    'backgroundColor' => $jenis['warna_icon'],
                    'borderRadius' => 6,
                    'barPercentage' => 0.55,
                    'categoryPercentage' => 0.7,
                ];
            })->values()->toArray();

        $barChartData = [
            'labels' => $allYears,
            'datasets' => $barChartDatasets,
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalPengajuan' => (int) ($statusCounts->total ?? 0),
                'pengajuanDiproses' => (int) ($statusCounts->diproses ?? 0),
                'pengajuanBaru' => (int) ($statusCounts->diproses_baru ?? 0),
                'pengajuanReviu' => (int) ($statusCounts->diproses_reviu ?? 0),
                'pengajuanDiajukan' => (int) ($statusCounts->diajukan ?? 0),
                'pengajuanDiterima' => $pengajuanDiterima2025,
                'pengajuanDitolak' => (int) ($statusCounts->ditolak ?? 0),
                'pengajuanDirevisi' => (int) ($statusCounts->direvisi ?? 0),
                'aktivitasBelumMulai' => $aktivitasBelumMulai2025,
                'aktivitasBerjalan' => (int) ($aktivitasCounts->berjalan ?? 0),
                'aktivitasSelesai' => (int) ($aktivitasCounts->selesai ?? 0),
            ],
            'recentPengajuan' => $recentPengajuan,
            'pkmMapData' => $pkmMapData,
            'pieChartData' => $pieChartData,
            'barChartData' => $barChartData,
        ]);
    }
}
