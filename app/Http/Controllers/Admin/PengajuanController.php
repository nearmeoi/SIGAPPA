<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\JenisPkm;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\PengajuanLog;
use App\Models\TimKegiatan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PengajuanController extends Controller
{
    public function index(Request $request)
    {
        $sortField = $request->get('sort', 'created_at');
        $sortDir = $request->get('direction', 'desc');

        $listPengajuan = Pengajuan::with(['user', 'jenisPkm', 'timKegiatan.pegawai'])
            ->visibleInPengajuanQueue()
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->where(function ($q) use ($escaped) {
                    $q->where('judul_kegiatan', 'like', "%{$escaped}%")
                        ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$escaped}%"));
                });
            })
            ->when($request->tab, function ($query, $tab) {
                if ($tab === 'pengajuan') {
                    $query->where('status_pengajuan', 'diproses')->whereNull('admin_read_at');
                } elseif ($tab === 'reviu') {
                    $query->where('status_pengajuan', 'diproses')->whereNotNull('admin_read_at');
                } elseif ($tab === 'direvisi') {
                    $query->whereIn('status_pengajuan', ['direvisi', 'revisi_direktur']);
                } else {
                    $query->where('status_pengajuan', $tab);
                }
            })
            ->when($request->tahun, function ($query, $tahun) {
                $query->whereYear('tgl_mulai', $tahun);
            })
            ->when($request->jenis_pkm, function ($query, $jenisPkm) {
                $query->where('id_jenis_pkm', $jenisPkm);
            })
            ->when($sortField === 'status_pengajuan', function ($query) use ($sortDir) {
                $query->orderByRaw("FIELD(status_pengajuan, 'diproses', 'diajukan', 'revisi_direktur', 'direvisi', 'diterima', 'ditolak', 'selesai') " . $sortDir);
            }, function ($query) use ($sortField, $sortDir) {
                $query->orderBy($sortField, $sortDir);
            })
            ->paginate(10)
            ->through(function ($p) {
                $incompleteFields = $this->getIncompleteFields($p);

                return [
                    'id_pengajuan' => $p->id_pengajuan,
                    'kode_unik' => $p->kode_unik,
                    'judul_kegiatan' => $p->judul_kegiatan,
                    'status_pengajuan' => $p->status_pengajuan,
                    'admin_read_at' => $p->admin_read_at,
                    'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
                    'tgl_mulai' => $p->tgl_mulai?->format('Y-m-d'),
                    'tgl_selesai' => $p->tgl_selesai?->format('Y-m-d'),
                    'tipe_pengusul' => $p->tipe_pengusul,
                    'user' => $p->user ? [
                        'id_user' => $p->user->id_user,
                        'name' => $p->user->name,
                        'email' => $p->user->email,
                        'role' => $p->user->role,
                    ] : null,
                    'jenis_pkm' => $p->jenisPkm ? [
                        'id_jenis_pkm' => $p->jenisPkm->id_jenis_pkm,
                        'nama_jenis' => $p->jenisPkm->nama_jenis,
                    ] : null,
                    'nama_pengusul' => $p->nama_pengusul,
                    'email_pengusul' => $p->email_pengusul,
                    'no_telepon' => $p->no_telepon,
                    'instansi_mitra' => $p->instansi_mitra,
                    'kebutuhan' => $p->kebutuhan,
                    'surat_permohonan' => $p->surat_permohonan,
                    'rab' => $p->rab,
                    'rab_items' => $p->rab_items,
                    'sumber_dana' => $p->sumber_dana,
                    'dana_perguruan_tinggi' => $p->dana_perguruan_tinggi,
                    'dana_pemerintah' => $p->dana_pemerintah,
                    'dana_lembaga_dalam' => $p->dana_lembaga_dalam,
                    'dana_lembaga_luar' => $p->dana_lembaga_luar,
                    'provinsi' => $p->provinsi,
                    'kota_kabupaten' => $p->kota_kabupaten,
                    'kecamatan' => $p->kecamatan,
                    'kelurahan_desa' => $p->kelurahan_desa,
                    'alamat_lengkap' => $p->alamat_lengkap,
                    'latitude' => $p->latitude,
                    'longitude' => $p->longitude,
                    'lokasi_tambahan' => $p->lokasi_tambahan,
                    'tim_kegiatan' => $p->timKegiatan->map(fn ($t) => [
                        'id_tim' => $t->id_tim,
                        'nama_mahasiswa' => $t->nama_mahasiswa,
                        'peran_tim' => $t->peran_tim,
                        'pegawai' => $t->pegawai ? [
                            'id_pegawai' => $t->pegawai->id_pegawai,
                            'nama_pegawai' => $t->pegawai->nama_pegawai,
                        ] : null,
                    ])->values(),
                    'kelengkapan' => [
                        'lengkap' => $incompleteFields === [],
                        'missing_fields' => $incompleteFields,
                    ],
                ];
            })
            ->withQueryString();

        return Inertia::render('Admin/Pengajuan/Index', [
            'listPengajuan' => $listPengajuan,
            'filters' => [
                'search' => $request->search ?? '',
                'tab' => $request->tab ?? '',
                'sort' => $sortField,
                'direction' => $sortDir,
                'tahun' => $request->tahun ?? '',
                'jenis_pkm' => $request->jenis_pkm ?? '',
            ],
            'availableYears' => Pengajuan::visibleInPengajuanQueue()
                ->selectRaw('YEAR(tgl_mulai) as year')
                ->whereNotNull('tgl_mulai')
                ->groupBy('year')
                ->orderBy('year', 'desc')
                ->pluck('year'),
            'listJenisPkm' => JenisPkm::orderBy('nama_jenis')->get(['id_jenis_pkm', 'nama_jenis', 'warna_icon']),
        ]);
    }

    public function show(int $id)
    {
        $p = Pengajuan::with([
            'user',
            'jenisPkm',
            'timKegiatan.pegawai',
            'aktivitas',
            'arsip',
            'logs',
        ])->findOrFail($id);

        if ($p->admin_read_at === null) {
            $p->update(['admin_read_at' => now()]);
        }

        $pengajuanMapped = [
            'id_pengajuan' => $p->id_pengajuan,
            'kode_unik' => $p->kode_unik,
            'judul_kegiatan' => $p->judul_kegiatan,
            'nama_pengusul' => $p->nama_pengusul,
            'email_pengusul' => $p->email_pengusul,
            'no_telepon' => $p->no_telepon,
            'instansi_mitra' => $p->instansi_mitra,
            'kebutuhan' => $p->kebutuhan,
            'sumber_dana' => $p->sumber_dana,
            'total_anggaran' => $p->total_anggaran,
            'dana_perguruan_tinggi' => $p->dana_perguruan_tinggi,
            'dana_pemerintah' => $p->dana_pemerintah,
            'dana_lembaga_dalam' => $p->dana_lembaga_dalam,
            'dana_lembaga_luar' => $p->dana_lembaga_luar,
            'tgl_mulai' => $p->tgl_mulai?->format('Y-m-d'),
            'tgl_selesai' => $p->tgl_selesai?->format('Y-m-d'),
            'is_tahun_saja' => $p->is_tahun_saja,
            'provinsi' => $p->provinsi,
            'kota_kabupaten' => $p->kota_kabupaten,
            'kecamatan' => $p->kecamatan,
            'kelurahan_desa' => $p->kelurahan_desa,
            'alamat_lengkap' => $p->alamat_lengkap,
            'latitude' => $p->latitude,
            'longitude' => $p->longitude,
            'status_pengajuan' => $p->status_pengajuan,
            'catatan_admin' => $p->catatan_admin,
            'catatan_direktur' => $p->catatan_direktur,
            'proposal' => $p->proposal,
            'surat_permohonan' => $p->surat_permohonan,
            'rab' => $p->rab,
            'rab_items' => $p->rab_items,
            'lokasi_tambahan' => $p->lokasi_tambahan,
            'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
            'admin_read_at' => $p->admin_read_at,
            'direktur_approved_at' => $p->direktur_approved_at?->format('d M Y, H:i'),
            'user' => $p->user ? [
                'id_user' => $p->user->id_user,
                'name' => $p->user->name,
                'email' => $p->user->email,
                'role' => $p->user->role,
            ] : null,
            'jenis_pkm' => $p->jenisPkm ? [
                'id_jenis_pkm' => $p->jenisPkm->id_jenis_pkm,
                'nama_jenis' => $p->jenisPkm->nama_jenis,
            ] : null,
            'tim_kegiatan' => $p->timKegiatan->map(fn($t) => [
                'id_tim' => $t->id_tim,
                'nama' => $t->pegawai ? $t->pegawai->nama_pegawai : $t->nama_mahasiswa,
                'peran' => $t->peran_tim,
                'nama_mahasiswa' => $t->nama_mahasiswa,
                'peran_tim' => $t->peran_tim,
                'pegawai' => $t->pegawai ? [
                    'id_pegawai' => $t->pegawai->id_pegawai,
                    'nama_pegawai' => $t->pegawai->nama_pegawai,
                ] : null,
            ]),
            'aktivitas' => $p->aktivitas ? [
                'id_aktivitas' => $p->aktivitas->id_aktivitas,
                'status_pelaksanaan' => $p->aktivitas->status_pelaksanaan,
            ] : null,
            'arsip' => $p->arsip->map(fn($ar) => [
                'id_arsip' => $ar->id_arsip,
                'nama_dokumen' => $ar->nama_dokumen,
                'url_dokumen' => $ar->url_dokumen,
                'jenis_arsip' => $ar->jenis_arsip,
            ]),
            'logs' => $p->logs->map(fn($log) => [
                'id' => $log->id,
                'status_lama' => $log->status_lama,
                'status_baru' => $log->status_baru,
                'catatan' => $log->catatan,
                'changed_by_name' => $log->changed_by_name,
                'created_at' => $log->created_at?->format('d M Y, H:i'),
            ])->values(),
        ];

        $listPegawai = Pegawai::with('user:id_user,role')->orderBy('nama_pegawai')
            ->get(['id_pegawai', 'id_user', 'nama_pegawai', 'nip'])
            ->map(function ($p) {
                return [
                    'id_pegawai' => $p->id_pegawai,
                    'nama_pegawai' => $p->nama_pegawai,
                    'nip' => $p->nip,
                    'role' => $p->user ? $p->user->role : null,
                ];
            });

        $listJenisPkm = JenisPkm::orderBy('nama_jenis')->get();

        return Inertia::render('Admin/Pengajuan/Detail', [
            'pengajuan' => $pengajuanMapped,
            'listPegawai' => $listPegawai,
            'listJenisPkm' => $listJenisPkm,
        ]);
    }

    /**
     * Full update of a submission (admin migration/edit purposes)
     */
    public function update(Request $request, int $id)
    {
        if ($request->boolean('is_tahun_saja')) {
            $request->merge(['tgl_selesai' => null]);
        }

        $validated = $request->validate([
            'judul_kegiatan' => 'sometimes|required|string|max:255',
            'nama_pengusul' => 'sometimes|nullable|string|max:255',
            'email_pengusul' => 'sometimes|nullable|email|max:255',
            'id_jenis_pkm' => 'sometimes|nullable|exists:jenis_pkm,id_jenis_pkm',
            'no_telepon' => 'sometimes|nullable|string|max:25',
            'instansi_mitra' => 'sometimes|nullable|string|max:255',
            'kebutuhan' => 'sometimes|nullable|string',
            'sumber_dana' => 'sometimes|nullable|string|max:255',
            'total_anggaran' => 'sometimes|nullable|numeric|min:0',
            'dana_perguruan_tinggi' => 'sometimes|nullable|numeric|min:0',
            'dana_pemerintah' => 'sometimes|nullable|numeric|min:0',
            'dana_lembaga_dalam' => 'sometimes|nullable|numeric|min:0',
            'dana_lembaga_luar' => 'sometimes|nullable|numeric|min:0',
            'tgl_mulai' => 'sometimes|nullable|date',
            'tgl_selesai' => 'sometimes|nullable|date|after_or_equal:tgl_mulai',
            'is_tahun_saja' => 'sometimes|nullable|boolean',
            'provinsi' => 'sometimes|nullable|string|max:100',
            'kota_kabupaten' => 'sometimes|nullable|string|max:100',
            'kecamatan' => 'sometimes|nullable|string|max:100',
            'kelurahan_desa' => 'sometimes|nullable|string|max:100',
            'alamat_lengkap' => 'sometimes|nullable|string',
            'latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',
            'status_pengajuan' => [
                'sometimes',
                'nullable',
                $request->user()?->role === 'superadmin'
                ? 'in:diproses,direvisi,revisi_direktur,diterima,ditolak,selesai'
                : 'in:diproses,direvisi,revisi_direktur',
            ],
            'catatan_admin' => 'sometimes|nullable|string|max:1000',
            'proposal' => 'sometimes|nullable|string|max:2048',
            'surat_permohonan' => 'sometimes|nullable|string|max:2048',
            'file_proposal' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'file_surat_permohonan' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'rab' => 'sometimes|nullable|string|max:2048',
            'lokasi_list' => 'sometimes|nullable|string',
            'rab_items' => 'sometimes|array',
            'rab_items.*.nama_item' => 'nullable|string|max:255',
            'rab_items.*.jumlah' => 'nullable|numeric|min:1',
            'rab_items.*.harga' => 'nullable|numeric|min:0',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);

        unset($validated['lokasi_list']);

        if ($request->has('id_jenis_pkm') && blank($request->input('id_jenis_pkm'))) {
            $validated['id_jenis_pkm'] = null;
        }

        if ($request->has('rab_items')) {
            $validated['rab_items'] = $this->normalizeRabItems($request->input('rab_items', []));
            $validated['total_anggaran'] = collect($validated['rab_items'])->sum('total');
        }

        if ($request->has('lokasi_list')) {
            $lokasiListStr = $request->input('lokasi_list', '[]');
            $lokasiListStr = $lokasiListStr ?: '[]';
            $lokasiList = json_decode($lokasiListStr, true);
            if (is_array($lokasiList) && !empty($lokasiList)) {
                $primaryLokasi = $lokasiList[0];
                $lokasiTambahan = array_slice($lokasiList, 1);
                
                $validated['provinsi'] = $primaryLokasi['provinsi'] ?? null;
                $validated['kota_kabupaten'] = $primaryLokasi['kota_kabupaten'] ?? null;
                $validated['kecamatan'] = $primaryLokasi['kecamatan'] ?? null;
                $validated['kelurahan_desa'] = $primaryLokasi['kelurahan_desa'] ?? null;
                $validated['alamat_lengkap'] = $primaryLokasi['alamat_lengkap'] ?? null;
                $validated['latitude'] = $primaryLokasi['latitude'] ?? null;
                $validated['longitude'] = $primaryLokasi['longitude'] ?? null;
                $validated['lokasi_tambahan'] = $lokasiTambahan;
            }
        }

        if ($request->hasFile('file_surat_permohonan')) {
            $validated['surat_permohonan'] = '/storage/' . $request->file('file_surat_permohonan')->store('pengajuan/dokumen', 'public');
        }
        if ($request->hasFile('file_proposal')) {
            $validated['proposal'] = '/storage/' . $request->file('file_proposal')->store('pengajuan/dokumen', 'public');
        }

        $pengajuan->update($validated);

        return redirect()->back()->with('success', 'Pengajuan berhasil diperbarui.');
    }

    public function updateTanggalPengajuan(Request $request, int $id)
    {
        abort_unless($request->user()?->role === 'superadmin', 403, 'Akses ditolak. Hanya superadmin yang dapat mengubah tanggal pengajuan.');

        $validated = $request->validate([
            'tanggal_pengajuan' => 'required|date',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);
        $currentCreatedAt = $pengajuan->created_at ? Carbon::parse($pengajuan->created_at) : now();
        $requestedDate = Carbon::parse($validated['tanggal_pengajuan']);

        $newCreatedAt = $requestedDate->setTime(
            $currentCreatedAt->hour,
            $currentCreatedAt->minute,
            $currentCreatedAt->second,
            $currentCreatedAt->microsecond,
        );

        DB::table('pengajuan')
            ->where('id_pengajuan', $pengajuan->id_pengajuan)
            ->update(['created_at' => $newCreatedAt]);

        return redirect()->back()->with('success', 'Tanggal pengajuan berhasil diperbarui.');
    }

    /**
     * Soft-delete a submission with cascading soft deletes
     */
    public function destroy(int $id)
    {
        $pengajuan = Pengajuan::with(['aktivitas', 'timKegiatan', 'arsip'])->findOrFail($id);

        // Cascading soft deletes using model delete() to trigger model events
        if ($pengajuan->aktivitas) {
            $pengajuan->aktivitas->delete();
        }
        foreach ($pengajuan->timKegiatan as $tim) {
            $tim->delete();
        }
        foreach ($pengajuan->arsip as $arsip) {
            $arsip->delete();
        }

        $pengajuan->delete();

        return redirect()->back()->with('success', 'Pengajuan berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'nullable|array',
            'ids.*' => 'integer|exists:pengajuan,id_pengajuan',
            'select_all' => 'nullable|boolean',
            'excluded_ids' => 'nullable|array',
            'excluded_ids.*' => 'integer',
            'filters' => 'nullable|array',
        ]);

        $selectAll = $request->input('select_all', false);
        $ids = $request->input('ids', []);
        $excludedIds = $request->input('excluded_ids', []);
        $filters = $request->input('filters', []);

        if ($selectAll) {
            $query = Pengajuan::visibleInPengajuanQueue();

            // Apply filters to match the user's current view
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('judul_kegiatan', 'like', "%{$search}%")
                        ->orWhere('nama_pengusul', 'like', "%{$search}%")
                        ->orWhere('instansi_mitra', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['tab'])) {
                $tab = $filters['tab'];
                if ($tab === 'pengajuan')
                    $query->where('status_pengajuan', 'diproses');
                elseif ($tab === 'reviu')
                    $query->where('status_pengajuan', 'diproses')->whereNotNull('admin_read_at');
                elseif ($tab === 'direvisi')
                    $query->whereIn('status_pengajuan', ['direvisi', 'revisi_direktur']);
                else
                    $query->where('status_pengajuan', $tab);
            }

            if (!empty($filters['tahun'])) {
                $query->whereYear('created_at', $filters['tahun']);
            }

            if (!empty($filters['jenis_pkm'])) {
                $query->where('id_jenis_pkm', $filters['jenis_pkm']);
            }

            if (!empty($excludedIds)) {
                $query->whereNotIn('id_pengajuan', $excludedIds);
            }

            $pengajuans = $query->with(['aktivitas', 'timKegiatan', 'arsip'])->get();
            $count = $pengajuans->count();
        } else {
            $pengajuans = Pengajuan::with(['aktivitas', 'timKegiatan', 'arsip'])->whereIn('id_pengajuan', $ids)->get();
            $count = count($ids);
        }

        foreach ($pengajuans as $pengajuan) {
            if ($pengajuan->aktivitas) {
                $pengajuan->aktivitas->delete();
            }
            foreach ($pengajuan->timKegiatan as $tim) {
                $tim->delete();
            }
            foreach ($pengajuan->arsip as $arsip) {
                $arsip->delete();
            }
            $pengajuan->delete();
        }

        return redirect()->back()->with('success', $count . ' data pengajuan berhasil dihapus massal.');
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'status_pengajuan' => 'required|in:' . implode(',', [
                Pengajuan::STATUS_DIAJUKAN,
                Pengajuan::STATUS_SELESAI,
                Pengajuan::STATUS_DIREVISI,
            ]),
            'catatan_admin' => 'nullable|string|max:1000',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);

        // Admin forwards to Direktur — check completeness first
        if ($request->status_pengajuan === Pengajuan::STATUS_DIAJUKAN) {
            $incompleteFields = $this->getIncompleteFields($pengajuan);
            if ($incompleteFields !== []) {
                return redirect()->back()->withErrors([
                    'status_pengajuan' => 'Pengajuan belum bisa diajukan karena data berikut masih belum lengkap: ' . implode(', ', $incompleteFields) . '.',
                ]);
            }
        }

        // Selesai only allowed when already diterima
        if ($request->status_pengajuan === Pengajuan::STATUS_SELESAI && $pengajuan->status_pengajuan !== Pengajuan::STATUS_DITERIMA) {
            return redirect()->back()->withErrors([
                'status_pengajuan' => 'Status selesai hanya bisa diubah dari status diterima.',
            ]);
        }

        if ($request->status_pengajuan === Pengajuan::STATUS_DIREVISI && $pengajuan->status_pengajuan !== Pengajuan::STATUS_REVISI_DIREKTUR) {
            return redirect()->back()->withErrors([
                'status_pengajuan' => 'Status revisi hanya bisa diteruskan dari keputusan revisi direktur.',
            ]);
        }

        $statusLama = $pengajuan->status_pengajuan;
        $statusBaru = $request->status_pengajuan;

        // Early return if status tidak berubah
        if ($statusLama === $statusBaru) {
            return redirect()->back()->with('info', 'Status tidak berubah.');
        }

        DB::transaction(function () use ($pengajuan, $statusBaru, $statusLama, $request) {
            $pengajuan->status_pengajuan = $statusBaru;
            if ($request->filled('catatan_admin')) {
                $pengajuan->catatan_admin = $request->catatan_admin;
            } elseif ($statusBaru === Pengajuan::STATUS_DIREVISI && $statusLama === Pengajuan::STATUS_REVISI_DIREKTUR) {
                $pengajuan->catatan_admin = $pengajuan->catatan_direktur;
            }
            $pengajuan->save();

            PengajuanLog::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_lama' => $statusLama,
                'status_baru' => $statusBaru,
                'catatan' => $request->catatan_admin,
                'changed_by_user_id' => auth()->id(),
                'changed_by_name' => auth()->user()?->name,
            ]);
        });

        return redirect()->back()->with('success', 'Status pengajuan berhasil diperbarui.');
    }

    /**
     * Superadmin: edit a log entry catatan/status.
     */
    public function updateLog(Request $request, int $id)
    {
        abort_unless($request->user()?->role === 'superadmin', 403, 'Akses ditolak.');

        $request->validate([
            'catatan' => 'nullable|string|max:2000',
            'status_baru' => 'nullable|string|max:50',
        ]);

        $log = \App\Models\PengajuanLog::findOrFail($id);
        $log->update($request->only('catatan', 'status_baru'));

        return redirect()->back()->with('success', 'Log berhasil diperbarui.');
    }

    /**
     * Superadmin: delete a log entry.
     */
    public function destroyLog(Request $request, int $id)
    {
        abort_unless($request->user()?->role === 'superadmin', 403, 'Akses ditolak.');

        \App\Models\PengajuanLog::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Log berhasil dihapus.');
    }

    public function syncTim(Request $request, int $id)
    {
        $validated = $request->validate([
            'ketua_tim' => 'nullable|string|max:255',
            'dosen_terlibat' => 'nullable|array',
            'dosen_terlibat.*' => 'nullable|string|max:255',
            'staff_terlibat' => 'nullable|array',
            'staff_terlibat.*' => 'nullable|string|max:255',
            'mahasiswa_terlibat' => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:255',
        ]);

        $pengajuan = Pengajuan::with('timKegiatan')->findOrFail($id);

        $rows = [];
        $now = now();

        $ketuaName = trim($validated['ketua_tim'] ?? '');
        if ($ketuaName !== '') {
            $rows[] = [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_pegawai' => null,
                'nama_mahasiswa' => $ketuaName,
                'peran_tim' => 'Ketua',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($this->normalizeTeamEntries($validated['dosen_terlibat'] ?? []) as $name) {
            $rows[] = [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_pegawai' => null,
                'nama_mahasiswa' => $name,
                'peran_tim' => 'Dosen',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($this->normalizeTeamEntries($validated['staff_terlibat'] ?? []) as $name) {
            $rows[] = [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_pegawai' => null,
                'nama_mahasiswa' => $name,
                'peran_tim' => 'Staff',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($this->normalizeTeamEntries($validated['mahasiswa_terlibat'] ?? []) as $name) {
            $rows[] = [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_pegawai' => null,
                'nama_mahasiswa' => $name,
                'peran_tim' => 'Mahasiswa',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($pengajuan, $rows) {
            TimKegiatan::where('id_pengajuan', $pengajuan->id_pengajuan)->delete();

            if ($rows !== []) {
                TimKegiatan::insert($rows);
            }
        });

        return redirect()->back()->with('success', 'Tim pelaksana berhasil diperbarui.');
    }

    public function storeTim(Request $request, int $id)
    {
        $request->validate([
            'id_pegawai' => 'nullable|exists:pegawai,id_pegawai',
            'nama_mahasiswa' => 'nullable|string|max:255',
            'peran_tim' => 'required|string|max:100',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);

        TimKegiatan::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'id_pegawai' => $request->id_pegawai,
            'nama_mahasiswa' => $request->nama_mahasiswa,
            'peran_tim' => $request->peran_tim,
        ]);

        return redirect()->back()->with('success', 'Anggota tim berhasil ditambahkan.');
    }

    public function destroyTim(int $pengajuanId, int $timId)
    {
        $tim = TimKegiatan::where('id_pengajuan', $pengajuanId)
            ->where('id_tim', $timId)
            ->firstOrFail();

        $tim->delete();

        return redirect()->back()->with('success', 'Anggota tim berhasil dihapus.');
    }

    public function updateLokasi(Request $request, int $id)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'provinsi' => 'nullable|string|max:100',
            'kota_kabupaten' => 'nullable|string|max:100',
            'kecamatan' => 'nullable|string|max:100',
            'kelurahan_desa' => 'nullable|string|max:100',
            'alamat_lengkap' => 'nullable|string',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);
        $pengajuan->update([
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'provinsi' => $request->provinsi ?: $pengajuan->provinsi,
            'kota_kabupaten' => $request->kota_kabupaten ?: $pengajuan->kota_kabupaten,
            'kecamatan' => $request->kecamatan ?: $pengajuan->kecamatan,
            'kelurahan_desa' => $request->kelurahan_desa ?: $pengajuan->kelurahan_desa,
            'alamat_lengkap' => $request->alamat_lengkap ?: $pengajuan->alamat_lengkap,
        ]);

        return redirect()->back()->with('success', 'Lokasi berhasil diperbarui.');
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

    private function normalizeTeamEntries(array $items): array
    {
        return collect($items)
            ->map(fn($item) => trim((string) $item))
            ->filter()
            ->values()
            ->all();
    }

    private function getIncompleteFields(Pengajuan $pengajuan): array
    {
        $submitterType = strtolower((string) ($pengajuan->tipe_pengusul ?: $pengajuan->user?->role ?: 'masyarakat'));
        $isDosen = $submitterType === 'dosen';

        // Load tim kegiatan if not already loaded
        if (!$pengajuan->relationLoaded('timKegiatan')) {
            $pengajuan->load('timKegiatan');
        }

        $tim = $pengajuan->timKegiatan ?? collect();
        $hasKetua = $tim->contains(fn($m) => str_contains(strtolower((string) $m->peran_tim), 'ketua'));
        $totalAnggota = $tim->filter(fn($m) => !str_contains(strtolower((string) $m->peran_tim), 'ketua'))->count();

        $rabItems = collect($pengajuan->rab_items ?? [])
            ->filter(fn($item) => filled(data_get($item, 'nama_item')) && (float) data_get($item, 'jumlah', 0) > 0)
            ->values();

        $fields = [
            blank($pengajuan->nama_pengusul ?: $pengajuan->user?->name) ? 'nama pengusul' : null,
            blank($pengajuan->email_pengusul ?: $pengajuan->user?->email) ? 'email pengusul' : null,
            blank($pengajuan->id_jenis_pkm) ? 'jenis PKM' : null,
            blank($pengajuan->instansi_mitra) ? 'instansi' : null,
            blank($pengajuan->no_telepon) ? 'kontak / WhatsApp' : null,
            blank($pengajuan->kebutuhan) ? ($isDosen ? 'deskripsi kegiatan' : 'kebutuhan PKM') : null,
            blank($pengajuan->provinsi) ? 'provinsi' : null,
            blank($pengajuan->kota_kabupaten) ? 'kota / kabupaten' : null,
            blank($pengajuan->surat_permohonan) ? 'surat permohonan' : null,
            !$hasKetua ? 'Ketua Tim PKM' : null,
            $totalAnggota === 0 ? 'Tim Terlibat (Dosen/Staff/Mahasiswa)' : null,
            $rabItems->isEmpty() ? 'Rincian RAB' : null,
        ];

        if ($isDosen) {
            $fields[] = blank($pengajuan->judul_kegiatan) ? 'judul kegiatan PKM' : null;

            $hasFunding = (float) $pengajuan->dana_perguruan_tinggi > 0
                || (float) $pengajuan->dana_pemerintah > 0
                || (float) $pengajuan->dana_lembaga_dalam > 0
                || (float) $pengajuan->dana_lembaga_luar > 0
                || filled($pengajuan->sumber_dana);

            $fields[] = ! $hasFunding ? 'sumber dana' : null;
        }

        return array_values(array_filter($fields));
    }

    /**
     * Export to CSV with extended columns:
     * nama_kegiatan | pengusul | jenis_pkm | instansi | tahun | sumber_dana | total_dana | nama_tim | status | lokasi | arsip
     */
    public function export(Request $request)
    {
        $query = Pengajuan::with(['user', 'jenisPkm', 'timKegiatan.pegawai', 'arsip'])
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->where(function ($q) use ($escaped) {
                    $q->where('judul_kegiatan', 'like', "%{$escaped}%")
                        ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$escaped}%"));
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'direvisi') {
                    $query->whereIn('status_pengajuan', ['direvisi', 'revisi_direktur']);
                } else {
                    $query->where('status_pengajuan', $status);
                }
            })
            ->latest();

        $filename = 'pengajuan_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($query) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM

            fputcsv($file, [
                'Nama Kegiatan',
                'Pengusul',
                'Jenis PKM',
                'Instansi/Mitra',
                'Tahun',
                'Sumber Dana',
                'Total Dana (Rp)',
                'Nama Tim',
                'Status',
                'Lokasi',
                'Arsip',
            ]);

            $query->chunk(100, function ($items) use ($file) {
                foreach ($items as $p) {
                    // Build team names string
                    $namaTim = $p->timKegiatan->map(function ($anggota) {
                        $nama = $anggota->pegawai?->nama_pegawai ?? $anggota->nama_mahasiswa ?? '-';
                        $peran = $anggota->peran_tim ?? '';

                        return $peran ? "{$nama} ({$peran})" : $nama;
                    })->implode('; ');

                    // Build arsip/document links
                    $arsipList = $p->arsip->map(function ($doc) {
                        return "{$doc->nama_dokumen}: {$doc->url_dokumen}";
                    })->implode(' | ');

                    // Build location string
                    $lokasi = collect([
                        $p->kelurahan_desa,
                        $p->kecamatan,
                        $p->kota_kabupaten,
                        $p->provinsi,
                    ])->filter()->implode(', ') ?: '-';

                    fputcsv($file, [
                        $p->judul_kegiatan,
                        $p->user?->name ?? '-',
                        $p->jenisPkm?->nama_jenis ?? '-',
                        $p->instansi_mitra ?? '-',
                        $p->tgl_mulai?->year ?? ($p->created_at ? $p->created_at->year : '-'),
                        $p->sumber_dana ?? '-',
                        number_format((float) $p->total_anggaran, 0, ',', '.'),
                        $namaTim ?: '-',
                        ucfirst($p->status_pengajuan),
                        $lokasi,
                        $arsipList ?: '-',
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
