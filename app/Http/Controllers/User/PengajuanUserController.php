<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\JenisPkm;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\TimKegiatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PengajuanUserController extends Controller
{
    /**
     * Display the submission page for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user ? ($user->role ?? 'masyarakat') : 'masyarakat';
        $search = $request->input('search');

        // Ambil pengajuan milik user dari database dengan pagination dan search
        $submissionsPaginator = null;
        $userSubmissions = [];
        if ($user) {
            $query = Pengajuan::query();

            // Dosen should see:
            // 1. Their own submissions (id_user matches their user id)
            // 2. Submissions where they are part of the team (in tim_kegiatan table)
            if ($user->role === 'dosen') {
                $pegawai = Pegawai::where('id_user', $user->id_user)->first();
                if ($pegawai) {
                    $query->where(function ($q) use ($user, $pegawai) {
                        $q->where('pengajuan.id_user', $user->id_user)
                          ->orWhereHas('aktivitas.timKegiatan', function ($timQuery) use ($pegawai) {
                              $timQuery->where('tim_kegiatan.id_pegawai', $pegawai->id_pegawai);
                          });
                    });
                } else {
                    $query->where('pengajuan.id_user', $user->id_user);
                }
            } else {
                $query->where('pengajuan.id_user', $user->id_user);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('aktivitas', function ($actQuery) use ($search) {
                        $actQuery->where('judul_pkm', 'like', "%{$search}%");
                    })
                    ->orWhere('kebutuhan', 'like', "%{$search}%")
                    ->orWhere('instansi_mitra', 'like', "%{$search}%");
                });
            }

            $submissionsPaginator = $query->with(['user', 'aktivitas.jenisPkm', 'aktivitas.timKegiatan.pegawai', 'logs'])
                ->latest()
                ->paginate(5);

            $userSubmissions = $submissionsPaginator ? collect($submissionsPaginator->items())->map(fn($p) => [
                    'id' => $p->id_pengajuan,
                    'kode_unik' => $p->kode_unik,
                    'judul' => $p->judul_kegiatan,
                    'ringkasan' => $p->kebutuhan ?: ($p->instansi_mitra ?: '-'),
                    'tanggal' => optional($p->created_at)->format('d M Y') ?? '-',
                    'status' => in_array($p->status_pengajuan, ['diproses', 'direvisi', 'revisi_direktur', 'ditolak'])
                        ? $p->status_pengajuan
                        : ($p->aktivitas
                            ? ($p->aktivitas->status_pelaksanaan === 'selesai' ? 'selesai'
                                : ($p->aktivitas->status_pelaksanaan === 'berjalan' ? 'berlangsung' : 'diterima'))
                            : $p->status_pengajuan),
                    'catatan' => $p->catatan_admin ?: $p->catatan_direktur,
                    'instansi_mitra' => $p->instansi_mitra,
                    'no_telepon' => $p->no_telepon,
                    'provinsi' => $p->provinsi,
                    'kota_kabupaten' => $p->kota_kabupaten,
                    'kecamatan' => $p->kecamatan,
                    'kelurahan_desa' => $p->kelurahan_desa,
                    'alamat_lengkap' => $p->alamat_lengkap,
                    'latitude' => $p->latitude,
                    'longitude' => $p->longitude,
                    'lokasi_tambahan' => $p->lokasi_tambahan,
                    'tgl_mulai' => $p->tgl_mulai ? $p->tgl_mulai->format('Y-m-d') : null,
                    'tgl_selesai' => $p->tgl_selesai ? $p->tgl_selesai->format('Y-m-d') : null,
                    'is_tahun_saja' => $p->is_tahun_saja,
                    'proposal' => $p->proposal,
                    'surat_permohonan' => $p->surat_permohonan,
                    'rab' => $p->rab,
                    'rab_items' => $p->rab_items ?? [],
                    'sumber_dana' => $p->sumber_dana,
                    'total_anggaran' => $p->total_anggaran,
                    'dana_perguruan_tinggi' => $p->dana_perguruan_tinggi,
                    'dana_pemerintah' => $p->dana_pemerintah,
                    'dana_lembaga_dalam' => $p->dana_lembaga_dalam,
                    'dana_lembaga_luar' => $p->dana_lembaga_luar,
                    'tipe_pengusul' => $this->resolveSubmitterType($p),
                    'jenis_pkm' => $p->jenisPkm ? $p->jenisPkm->nama_jenis : null,
                    'nama_pengusul' => $this->resolveSubmitterName($p),
                    'email_pengusul' => $this->resolveSubmitterEmail($p),
                    'kebutuhan' => $p->kebutuhan,
                    'tim_kegiatan' => $p->timKegiatan->map(fn($t) => [
                        'nama' => $t->pegawai ? $t->pegawai->nama_pegawai : $t->nama_mahasiswa,
                        'peran' => $t->peran_tim,
                    ]),
                ])
                ->values()
                ->toArray()
            : [];
        }

        $jenisPkmOptions = JenisPkm::select('id_jenis_pkm', 'nama_jenis')
            ->get()
            ->map(fn($j) => ['value' => $j->id_jenis_pkm, 'label' => $j->nama_jenis]);

        return Inertia::render('Auth/Pengajuan', [
            'role' => $role,
            'initialView' => $request->routeIs('pengajuan.status') ? 'status' : 'form',
            'userSubmissions' => $userSubmissions,
            'pagination' => $submissionsPaginator ? [
                'links' => $submissionsPaginator->linkCollection()->toArray(),
                'current_page' => $submissionsPaginator->currentPage(),
                'last_page' => $submissionsPaginator->lastPage(),
                'total' => $submissionsPaginator->total(),
            ] : null,
            'jenisPkmOptions' => $jenisPkmOptions,
            'editSubmissionKode' => $request->string('edit')->toString() ?: null,
            'filters' => [
                'search' => $search,
            ]
        ]);
    }

    /**
     * Store a newly created submission.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Jika request memiliki atribut 'needs' (dari form MasyarakatSubmissionCard)
        // atau role user memang masyarakat, arahkan ke storeMasyarakat
        if ($user->role === 'masyarakat' || $request->has('needs')) {
            return $this->storeMasyarakat($request);
        }

        // Logic for Dosen
        $request->validate([
            'nama_dosen' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'instansi_mitra' => 'nullable|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'lokasi_list' => 'nullable|string',
            'is_tahun_saja' => 'nullable|boolean',
            'surat_proposal' => 'required|file|mimes:pdf,doc,docx|max:10240',
            'surat_permohonan' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $defaultJenisPkm = JenisPkm::first();

        $suratPermohonanUrl = null;
        $suratProposalUrl = null;

        if ($request->hasFile('surat_permohonan')) {
            $suratPermohonanUrl = '/storage/' . $request->file('surat_permohonan')->store('pengajuan/dokumen', 'public');
        }
        if ($request->hasFile('surat_proposal')) {
            $suratProposalUrl = '/storage/' . $request->file('surat_proposal')->store('pengajuan/dokumen', 'public');
        }

        $rabItems = $this->normalizeRabItems($request->input('rab_items', []));

        $lokasiListStr = $request->input('lokasi_list', '[]');
        // Optional fallback check if string is null
        $lokasiListStr = $lokasiListStr ? $lokasiListStr : '[]';
        $lokasiList = json_decode($lokasiListStr, true);
        if (!is_array($lokasiList) || empty($lokasiList)) {
            $lokasiList = [
                [
                    'provinsi' => $request->provinsi ?? '',
                    'kota_kabupaten' => $request->kota_kabupaten ?? '',
                    'kecamatan' => $request->kecamatan ?? '',
                    'kelurahan_desa' => $request->kelurahan_desa ?? '',
                    'alamat_lengkap' => $request->alamat_lengkap ?? '',
                    'latitude' => $request->latitude ?? null,
                    'longitude' => $request->longitude ?? null,
                ]
            ];
        }
        $primaryLokasi = $lokasiList[0];
        $lokasiTambahan = array_slice($lokasiList, 1);

        $pengajuan = Pengajuan::create([
            'id_user' => $user->id_user,
            'tipe_pengusul' => 'dosen',
            'provinsi' => $primaryLokasi['provinsi'] ?? '',
            'kota_kabupaten' => $primaryLokasi['kota_kabupaten'] ?? '',
            'kecamatan' => $primaryLokasi['kecamatan'] ?? '',
            'kelurahan_desa' => $primaryLokasi['kelurahan_desa'] ?? '',
            'alamat_lengkap' => $primaryLokasi['alamat_lengkap'] ?? '',
            'latitude' => $primaryLokasi['latitude'] ?? null,
            'longitude' => $primaryLokasi['longitude'] ?? null,
            'lokasi_tambahan' => $lokasiTambahan,
            'nama_pengusul' => $request->nama_dosen,
            'email_pengusul' => $request->email ?: $user->email,
            'kebutuhan' => $request->kebutuhan ?? '',
            'instansi_mitra' => $request->instansi_mitra ?? '',
            'no_telepon' => $request->no_telepon ?? '',
            'is_tahun_saja' => $request->boolean('is_tahun_saja'),
            'proposal' => $suratProposalUrl ?? '',
            'surat_permohonan' => $suratPermohonanUrl ?? '',
            'status_pengajuan' => 'diproses',
        ]);



        try { broadcast(new \App\Events\NotificationUpdated('new', 'Pengajuan baru masuk')); } catch (\Throwable) {}

        return redirect()->back()
            ->with('success', 'Pengajuan PKM berhasil dikirim! Silakan tunggu konfirmasi dari admin.');
    }

    public function update(Request $request, $kode)
    {
        $user = Auth::user();

        $pengajuan = Pengajuan::where('kode_unik', $kode)->where('id_user', $user->id_user)->firstOrFail();

        if ($pengajuan->status_pengajuan !== 'direvisi') {
            return redirect()->back()->with('error', 'Hanya pengajuan dengan status direvisi yang dapat diubah.');
        }

        // Dispatch to masyarakat-specific update
        if ($user->role === 'masyarakat') {
            return $this->updateMasyarakat($request, $pengajuan);
        }

        $request->validate([
            'nama_dosen' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'instansi_mitra' => 'nullable|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'lokasi_list' => 'nullable|string',
            'is_tahun_saja' => 'nullable|boolean',
            'surat_proposal' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'surat_permohonan' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $suratPermohonanUrl = $pengajuan->surat_permohonan;
        $suratProposalUrl = $pengajuan->proposal;

        if ($request->hasFile('surat_permohonan')) {
            $suratPermohonanUrl = '/storage/' . $request->file('surat_permohonan')->store('pengajuan/dokumen', 'public');
        }
        if ($request->hasFile('surat_proposal')) {
            $suratProposalUrl = '/storage/' . $request->file('surat_proposal')->store('pengajuan/dokumen', 'public');
        }

        $rabItems = $this->normalizeRabItems($request->input('rab_items', []));

        $lokasiListStr = $request->input('lokasi_list', '[]');
        // Optional fallback check if string is null
        $lokasiListStr = $lokasiListStr ? $lokasiListStr : '[]';
        $lokasiList = json_decode($lokasiListStr, true);
        if (!is_array($lokasiList) || empty($lokasiList)) {
            $lokasiList = [
                [
                    'provinsi' => $request->provinsi ?? $pengajuan->provinsi,
                    'kota_kabupaten' => $request->kota_kabupaten ?? $pengajuan->kota_kabupaten,
                    'kecamatan' => $request->kecamatan ?? $pengajuan->kecamatan,
                    'kelurahan_desa' => $request->kelurahan_desa ?? $pengajuan->kelurahan_desa,
                    'alamat_lengkap' => $request->alamat_lengkap ?? $pengajuan->alamat_lengkap,
                    'latitude' => $request->latitude ?? $pengajuan->latitude,
                    'longitude' => $request->longitude ?? $pengajuan->longitude,
                ]
            ];
        }
        $primaryLokasi = $lokasiList[0];
        $lokasiTambahan = array_slice($lokasiList, 1);

        $pengajuan->update([
            'provinsi' => $primaryLokasi['provinsi'] ?? '',
            'kota_kabupaten' => $primaryLokasi['kota_kabupaten'] ?? '',
            'kecamatan' => $primaryLokasi['kecamatan'] ?? '',
            'kelurahan_desa' => $primaryLokasi['kelurahan_desa'] ?? '',
            'alamat_lengkap' => $primaryLokasi['alamat_lengkap'] ?? '',
            'latitude' => $primaryLokasi['latitude'] ?? null,
            'longitude' => $primaryLokasi['longitude'] ?? null,
            'lokasi_tambahan' => $lokasiTambahan,
            'nama_pengusul' => $request->nama_dosen,
            'email_pengusul' => $request->email ?: $user->email,
            'kebutuhan' => $request->kebutuhan ?? '',
            'instansi_mitra' => $request->instansi_mitra ?? '',
            'no_telepon' => $request->no_telepon ?? '',
            'is_tahun_saja' => $request->has('is_tahun_saja') ? $request->boolean('is_tahun_saja') : $pengajuan->is_tahun_saja,
            'proposal' => $suratProposalUrl ?? '',
            'surat_permohonan' => $suratPermohonanUrl ?? '',
            'status_pengajuan' => 'diproses',
            'admin_read_at' => null,
        ]);

        // Realtime notification
        broadcast(new \App\Events\NotificationUpdated('updated', "Pengajuan {$pengajuan->judul_kegiatan} telah diperbarui"));



        return redirect()->back()
            ->with('success', 'Pengajuan PKM berhasil diperbarui!');
    }

    /**
     * Resubmit a revision without editing — just reset status to diproses.
     */
    public function resubmit($kode)
    {
        $user = Auth::user();

        $pengajuan = Pengajuan::where('kode_unik', $kode)
            ->where('id_user', $user->id_user)
            ->firstOrFail();

        if ($pengajuan->status_pengajuan !== 'direvisi') {
            return redirect()->back()->with('error', 'Hanya pengajuan dengan status direvisi yang dapat dikirim ulang.');
        }

        $pengajuan->update([
            'status_pengajuan' => 'diproses',
            'admin_read_at' => null,
        ]);

        // Realtime notification
        broadcast(new \App\Events\NotificationUpdated('updated', "Pengajuan {$pengajuan->judul_kegiatan} telah dikirim ulang"));

        return redirect()->back()
            ->with('success', 'Pengajuan berhasil dikirim ulang untuk ditinjau admin.');
    }

    /**
     * Update a masyarakat submission (revision resubmit with edits).
     */
    private function updateMasyarakat(Request $request, Pengajuan $pengajuan)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'institution' => 'required|string|max:255',
            'needs' => 'required|string',
            'email' => 'required|email|max:255',
            'whatsapp' => 'required|string|max:20',
            'lokasi_list' => 'nullable|string',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date',
            'is_tahun_saja' => 'nullable|boolean',
            'surat_permohonan' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'surat_proposal' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $suratPermohonanUrl = $pengajuan->surat_permohonan;
        $suratProposalUrl = $pengajuan->proposal;

        if ($request->hasFile('surat_permohonan')) {
            $suratPermohonanUrl = '/storage/' . $request->file('surat_permohonan')->store('pengajuan/dokumen', 'public');
        }
        if ($request->hasFile('surat_proposal')) {
            $suratProposalUrl = '/storage/' . $request->file('surat_proposal')->store('pengajuan/dokumen', 'public');
        }

        $lokasiListStr = $request->input('lokasi_list', '[]');
        // Optional fallback check if string is null
        $lokasiListStr = $lokasiListStr ? $lokasiListStr : '[]';
        $lokasiList = json_decode($lokasiListStr, true);
        if (!is_array($lokasiList) || empty($lokasiList)) {
            $lokasiList = [
                [
                    'provinsi' => $request->provinsi ?? $pengajuan->provinsi,
                    'kota_kabupaten' => $request->kota_kabupaten ?? $pengajuan->kota_kabupaten,
                    'kecamatan' => $request->kecamatan ?? $pengajuan->kecamatan,
                    'kelurahan_desa' => $request->kelurahan_desa ?? $pengajuan->kelurahan_desa,
                    'alamat_lengkap' => $request->alamat_lengkap ?? $pengajuan->alamat_lengkap,
                    'latitude' => $request->latitude ?? $pengajuan->latitude,
                    'longitude' => $request->longitude ?? $pengajuan->longitude,
                ]
            ];
        }
        $primaryLokasi = $lokasiList[0];
        $lokasiTambahan = array_slice($lokasiList, 1);

        $pengajuan->update([
            'nama_pengusul' => $request->name,
            'email_pengusul' => $request->email,
            'instansi_mitra' => $request->institution,
            'no_telepon' => $request->whatsapp,
            'is_tahun_saja' => $request->has('is_tahun_saja') ? $request->boolean('is_tahun_saja') : $pengajuan->is_tahun_saja,
            'surat_permohonan' => $suratPermohonanUrl,
            'proposal' => $suratProposalUrl,
            'status_pengajuan' => 'diproses',
            'admin_read_at' => null,
        ]);

        // Realtime notification
        broadcast(new \App\Events\NotificationUpdated('updated', "Pengajuan dari {$request->institution} telah diperbarui"));

        return redirect()->back()
            ->with('success', 'Pengajuan PKM berhasil diperbarui!');
    }

    /**
     * Store a submission from Masyarakat.
     */
    private function storeMasyarakat(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'institution' => 'required|string|max:255',
            'needs' => 'required|string',
            'email' => 'required|email|max:255',
            'whatsapp' => 'required|string|max:20',
            'lokasi_list' => 'nullable|string',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date',
            'is_tahun_saja' => 'nullable|boolean',
            'surat_permohonan' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'surat_proposal' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $suratPermohonanUrl = null;
        $suratProposalUrl = null;

        if ($request->hasFile('surat_permohonan')) {
            $suratPermohonanUrl = $request->file('surat_permohonan')->store('pengajuan/dokumen', 'public');
            $suratPermohonanUrl = '/storage/' . $suratPermohonanUrl;
        }
        if ($request->hasFile('surat_proposal')) {
            $suratProposalUrl = $request->file('surat_proposal')->store('pengajuan/dokumen', 'public');
            $suratProposalUrl = '/storage/' . $suratProposalUrl;
        }

        $lokasiListStr = $request->input('lokasi_list', '[]');
        // Optional fallback check if string is null
        $lokasiListStr = $lokasiListStr ? $lokasiListStr : '[]';
        $lokasiList = json_decode($lokasiListStr, true);
        if (!is_array($lokasiList) || empty($lokasiList)) {
            $lokasiList = [
                [
                    'provinsi' => $request->provinsi ?? '',
                    'kota_kabupaten' => $request->kota_kabupaten ?? '',
                    'kecamatan' => $request->kecamatan ?? '',
                    'kelurahan_desa' => $request->kelurahan_desa ?? '',
                    'alamat_lengkap' => $request->alamat_lengkap ?? '',
                    'latitude' => $request->latitude ?? null,
                    'longitude' => $request->longitude ?? null,
                ]
            ];
        }
        $primaryLokasi = $lokasiList[0];
        $lokasiTambahan = array_slice($lokasiList, 1);

        Pengajuan::create([
            'id_user' => Auth::id(),
            'id_jenis_pkm' => null,
            'tipe_pengusul' => 'masyarakat',
            'provinsi' => $primaryLokasi['provinsi'] ?? '',
            'kota_kabupaten' => $primaryLokasi['kota_kabupaten'] ?? '',
            'kecamatan' => $primaryLokasi['kecamatan'] ?? '',
            'kelurahan_desa' => $primaryLokasi['kelurahan_desa'] ?? '',
            'alamat_lengkap' => $primaryLokasi['alamat_lengkap'] ?? '',
            'latitude' => $primaryLokasi['latitude'] ?? null,
            'longitude' => $primaryLokasi['longitude'] ?? null,
            'lokasi_tambahan' => $lokasiTambahan,
            'is_tahun_saja' => $request->boolean('is_tahun_saja'),
            'nama_pengusul' => $request->name,
            'email_pengusul' => $request->email,
            'kebutuhan' => $request->needs,
            'instansi_mitra' => $request->institution,
            'no_telepon' => $request->whatsapp,
            'surat_permohonan' => $suratPermohonanUrl,
            'proposal' => $suratProposalUrl,
            'status_pengajuan' => 'diproses',
        ]);

        try { broadcast(new \App\Events\NotificationUpdated('new', 'Pengajuan baru masuk')); } catch (\Throwable) {}

        return redirect()->back()
            ->with('success', 'Pengajuan PKM berhasil dikirim! Silakan tunggu konfirmasi dari admin.');
    }

    /**
     * Helper to add team members.
     */
    private function addTeamMembers(array &$teamMembers, $members, string $role)
    {
        if (is_array($members)) {
            foreach ($members as $name) {
                if (!empty(trim($name))) {
                    $teamMembers[] = [
                        'id_pegawai' => null,
                        'nama_mahasiswa' => $name,
                        'peran_tim' => $role,
                    ];
                }
            }
        }
    }

    private function normalizeRabItems(array $items): array
    {
        return collect($items)
            ->map(function ($item) {
                $namaItem = trim((string) data_get($item, 'nama_item', ''));
                $jumlah = (float) data_get($item, 'jumlah', 0);
                $harga = (float) data_get($item, 'harga', 0);

                if ($namaItem === '' || $jumlah <= 0) {
                    return null;
                }

                return [
                    'nama_item' => $namaItem,
                    'jumlah' => $jumlah,
                    'harga' => $harga,
                    'total' => round($jumlah * $harga, 2),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function resolveSubmitterType(Pengajuan $pengajuan): string
    {
        $storedType = Str::lower((string) $pengajuan->tipe_pengusul);
        if (in_array($storedType, ['dosen', 'masyarakat'], true)) {
            return $storedType;
        }

        return Str::lower((string) $pengajuan->user?->role) === 'dosen' ? 'dosen' : 'masyarakat';
    }

    private function resolveSubmitterName(Pengajuan $pengajuan): string
    {
        if (!empty($pengajuan->nama_pengusul)) {
            return $pengajuan->nama_pengusul;
        }

        if ($this->resolveSubmitterType($pengajuan) === 'dosen') {
            return $pengajuan->user?->name ?? '';
        }

        return $pengajuan->user?->name ?? '';
    }

    private function resolveSubmitterEmail(Pengajuan $pengajuan): string
    {
        if (!empty($pengajuan->email_pengusul)) {
            return $pengajuan->email_pengusul;
        }

        return $pengajuan->user?->email ?? '';
    }
}
