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

        $tab = $request->has('tab') ? $request->get('tab') : (auth()->user()?->role === 'direktur' ? 'diajukan' : '');

        $listPengajuan = Pengajuan::with(['user', 'aktivitas'])
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->where(function ($q) use ($escaped) {
                    $q->where('instansi_mitra', 'like', "%{$escaped}%")
                      ->orWhere('nama_pengusul', 'like', "%{$escaped}%")
                      ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$escaped}%"));
                });
            })
            ->when($tab, function ($query, $tab) {
                if ($tab === 'pengajuan') {
                    $query->where('status_pengajuan', 'diproses')->whereNull('admin_read_at');
                } elseif ($tab === 'reviu') {
                    $query->where('status_pengajuan', 'diproses')->whereNotNull('admin_read_at');
                } else {
                    $query->where('status_pengajuan', $tab);
                }
            })
            ->when($request->tahun, function ($query, $tahun) {
                $query->whereYear('created_at', $tahun);
            })
            ->when($sortField === 'status_pengajuan', function ($query) use ($sortDir) {
                $query->orderByRaw("FIELD(status_pengajuan, 'diproses', 'diterima', 'direvisi', 'ditolak') " . $sortDir);
            }, function ($query) use ($sortField, $sortDir) {
                $query->orderBy($sortField, $sortDir);
            })
            ->paginate(10)
            ->through(fn($p) => [
                'id_pengajuan' => $p->id_pengajuan,
                'kode_unik' => $p->kode_unik,
                // Judul diambil dari aktivitas pertama, fallback ke identitas pengajuan
                'judul_kegiatan' => $p->aktivitas->first()?->judul_pkm
                    ?? ('Pengajuan PKM dari ' . ($p->instansi_mitra ?: $p->nama_pengusul ?: ($p->user ? $p->user->name : 'Tanpa Nama'))),
                'status_pengajuan' => $p->status_pengajuan,
                'admin_read_at' => $p->admin_read_at,
                'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
                'user' => $p->user ? [
                    'id_user' => $p->user->id_user,
                    'name' => $p->user->name,
                    'email' => $p->user->email,
                ] : null,
                'nama_pengusul' => $p->nama_pengusul,
                'instansi_mitra' => $p->instansi_mitra,
                // Ringkasan aktivitas untuk tampilan tabel
                'jumlah_aktivitas' => $p->aktivitas->count(),
                'incomplete_reasons' => $this->getIncompleteFields($p),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Pengajuan/Index', [
            'listPengajuan' => $listPengajuan,
            'filters' => [
                'search' => $request->search ?? '',
                'tab' => $tab,
                'sort' => $sortField,
                'direction' => $sortDir,
                'tahun' => $request->tahun ?? '',
            ],
            'availableYears' => Pengajuan::selectRaw('YEAR(created_at) as year')
                ->whereNotNull('created_at')
                ->groupBy('year')
                ->orderBy('year', 'desc')
                ->pluck('year'),
        ]);
    }

    public function show(int $id)
    {
        $p = Pengajuan::with([
            'user',
            // Eager load semua nested data aktivitas sekaligus
            'aktivitas.jenisPkm',
            'aktivitas.sumberDana',
            'aktivitas.timKegiatan.pegawai',
            'arsip',
            'logs',
        ])->findOrFail($id);

        // Jangan tandai dibaca jika status 'diajukan' dan yang melihat bukan direktur —
        // agar direktur tetap mendapat indikator notif baru.
        $viewerRole = auth()->user()?->role;
        if ($p->admin_read_at === null && ($viewerRole === 'direktur' || $p->status_pengajuan !== \App\Models\Pengajuan::STATUS_DIAJUKAN)) {
            $p->update(['admin_read_at' => now()]);
        }

        $pengajuanMapped = [
            'id_pengajuan'       => $p->id_pengajuan,
            'kode_unik'          => $p->kode_unik,
            'nama_pengusul'      => $p->nama_pengusul,
            'email_pengusul'     => $p->email_pengusul,
            'no_telepon'         => $p->no_telepon,
            'instansi_mitra'     => $p->instansi_mitra,
            'kebutuhan'          => $p->kebutuhan,
            'tipe_pengusul'      => $p->tipe_pengusul,
            // Lokasi pengajuan (sebagai informasi awal/alamat mitra)
            'provinsi'           => $p->provinsi,
            'kota_kabupaten'     => $p->kota_kabupaten,
            'kecamatan'          => $p->kecamatan,
            'kelurahan_desa'     => $p->kelurahan_desa,
            'alamat_lengkap'     => $p->alamat_lengkap,
            'latitude'           => $p->latitude,
            'longitude'          => $p->longitude,
            'lokasi_tambahan'    => $p->lokasi_tambahan,
            'status_pengajuan'   => $p->status_pengajuan,
            'catatan_admin'      => $p->catatan_admin,
            'catatan_direktur'   => $p->catatan_direktur,
            'proposal'           => $p->proposal,
            'surat_permohonan'   => $p->surat_permohonan,
            'admin_read_at'      => $p->admin_read_at,
            'direktur_approved_at' => $p->direktur_approved_at?->format('d M Y, H:i'),
            'created_at'         => $p->created_at?->toIso8601String(),
            'user' => $p->user ? [
                'id_user' => $p->user->id_user,
                'name'    => $p->user->name,
                'email'   => $p->user->email,
                'role'    => $p->user->role,
            ] : null,
            // ─── Aktivitas (nested, lengkap) ─────────────────────────────
            'aktivitas' => $p->aktivitas->map(fn($a) => [
                'id_aktivitas'       => $a->id_aktivitas,
                'judul_pkm'          => $a->judul_pkm,
                'status_pelaksanaan' => $a->status_pelaksanaan,
                'tgl_mulai'          => $a->tgl_mulai?->format('Y-m-d'),
                'tgl_selesai'        => $a->tgl_selesai?->format('Y-m-d'),
                'total_anggaran'     => $a->total_anggaran,
                'sumber_dana'        => $a->sumberDana?->nama_sumber_dana,
                // Jenis PKM bisa lebih dari satu (pivot many-to-many)
                'jenis_pkm'          => $a->jenisPkm->map(fn($j) => [
                    'id_jenis_pkm' => $j->id_jenis_pkm,
                    'nama_jenis'   => $j->nama_jenis,
                    'warna_icon'   => $j->warna_icon ?? null,
                ])->values()->toArray(),
                // Tim pelaksana dikelompokkan per peran
                'tim_kegiatan'       => $a->timKegiatan->map(fn($t) => [
                    'id_tim'         => $t->id_tim,
                    'peran_tim'      => $t->peran_tim,
                    'nama'           => $t->pegawai?->nama_pegawai ?? $t->nama_mahasiswa,
                    'id_pegawai'     => $t->id_pegawai,
                ])->values()->toArray(),
                // Lokasi aktivitas (terpisah dari lokasi pengajuan)
                'provinsi'           => $a->provinsi,
                'kota_kabupaten'     => $a->kota_kabupaten,
                'kecamatan'          => $a->kecamatan,
                'kelurahan_desa'     => $a->kelurahan_desa,
                'alamat_lengkap'     => $a->alamat_lengkap,
                'latitude'           => $a->latitude,
                'longitude'          => $a->longitude,
            ])->values()->toArray(),
            // ─── Arsip & Logs ─────────────────────────────────────────────
            'arsip' => $p->arsip->map(fn($ar) => [
                'id_arsip'      => $ar->id_arsip,
                'nama_dokumen'  => $ar->nama_dokumen,
                'url_dokumen'   => $ar->url_dokumen,
                'jenis_arsip'   => $ar->jenis_arsip,
            ])->toArray(),
            'logs' => $p->logs->map(fn($log) => [
                'id'             => $log->id,
                'status_lama'    => $log->status_lama,
                'status_baru'    => $log->status_baru,
                'catatan'        => $log->catatan,
                'changed_by_name' => $log->changed_by_name,
                'created_at'     => $log->created_at?->format('d M Y, H:i'),
            ])->values()->toArray(),
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
        $validated = $request->validate([
            'nama_pengusul' => 'sometimes|nullable|string|max:255',
            'email_pengusul' => 'sometimes|nullable|email|max:255',
            'no_telepon' => 'sometimes|nullable|string|max:25',
            'instansi_mitra' => 'sometimes|nullable|string|max:255',
            'kebutuhan' => 'sometimes|nullable|string',
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
                ? 'in:diproses,direvisi,diterima,ditolak,selesai,revisi_direktur'
                : 'in:diproses,direvisi,revisi_direktur',
            ],
            'catatan_admin' => 'sometimes|nullable|string|max:1000',
            'proposal' => 'sometimes|nullable|string|max:2048',
            'surat_permohonan' => 'sometimes|nullable|string|max:2048',
            'file_proposal' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
            'file_surat_permohonan' => 'sometimes|nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);

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
        $pengajuan = Pengajuan::with(['aktivitas', 'arsip'])->findOrFail($id);

        // Cascading soft deletes using model delete() to trigger model events
        foreach ($pengajuan->aktivitas as $aktivitas) {
            $aktivitas->delete();
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
            $query = Pengajuan::query();

            // Apply filters to match the user's current view
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('nama_pengusul', 'like', "%{$search}%")
                        ->orWhere('instansi_mitra', 'like', "%{$search}%")
                        ->orWhereHas('aktivitas', fn($aq) => $aq->where('judul_pkm', 'like', "%{$search}%"));
                });
            }

            if (!empty($filters['tab'])) {
                $tab = $filters['tab'];
                if ($tab === 'pengajuan')
                    $query->where('status_pengajuan', 'diproses');
                elseif ($tab === 'reviu')
                    $query->where('status_pengajuan', 'direvisi');
                else
                    $query->where('status_pengajuan', $tab);
            }

            if (!empty($filters['tahun'])) {
                $query->whereYear('created_at', $filters['tahun']);
            }

            if (!empty($excludedIds)) {
                $query->whereNotIn('id_pengajuan', $excludedIds);
            }

            $pengajuans = $query->with(['aktivitas', 'arsip'])->get();
            $count = $pengajuans->count();
        } else {
            $pengajuans = Pengajuan::with(['aktivitas', 'arsip'])->whereIn('id_pengajuan', $ids)->get();
            $count = count($ids);
        }

        foreach ($pengajuans as $pengajuan) {
            foreach ($pengajuan->aktivitas as $aktivitas) {
                $aktivitas->delete();
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
            'status_pengajuan' => 'required|in:' . Pengajuan::STATUS_DIAJUKAN . ',' . Pengajuan::STATUS_SELESAI . ',' . Pengajuan::STATUS_DIREVISI,
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

        $statusLama = $pengajuan->status_pengajuan;
        $statusBaru = $request->status_pengajuan;

        // Early return if status tidak berubah
        if ($statusLama === $statusBaru) {
            return redirect()->back()->with('info', 'Status tidak berubah.');
        }

        DB::transaction(function () use ($pengajuan, $statusBaru, $statusLama, $request) {
            $pengajuan->status_pengajuan = $statusBaru;

            // Jika dikirim ke Direktur, reset status "dibaca" agar Direktur dapat notif baru
            if ($statusBaru === Pengajuan::STATUS_DIAJUKAN) {
                $pengajuan->admin_read_at = null;
            }

            if ($request->filled('catatan_admin')) {
                $pengajuan->catatan_admin = $request->catatan_admin;
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

        try {
            broadcast(new \App\Events\NotificationUpdated('updated', "Status pengajuan {$pengajuan->kode_unik} diperbarui"));
        } catch (\Throwable) {
        }

        if ($statusBaru === Pengajuan::STATUS_DITERIMA) {
            return redirect()->to("/admin/pengajuan/{$pengajuan->id_pengajuan}")
                ->with('success', 'Pengajuan diterima. Silakan buat aktivitas untuk pengajuan ini di halaman berikut.');
        }

        return redirect()->back()->with('success', 'Status pengajuan berhasil diperbarui.');
    }

    /**
     * Superadmin / Secret: edit a log entry catatan/status.
     */
    public function updateLog(Request $request, int $id)
    {
        abort_unless(in_array($request->user()?->role, ['superadmin', 'secret_account']), 403, 'Akses ditolak.');

        $request->validate([
            'catatan' => 'nullable|string|max:2000',
            'status_baru' => 'nullable|string|max:50',
        ]);

        $log = \App\Models\PengajuanLog::findOrFail($id);
        $log->update($request->only('catatan', 'status_baru'));

        return redirect()->back()->with('success', 'Log berhasil diperbarui.');
    }

    /**
     * Superadmin / Secret: delete a log entry.
     */
    public function destroyLog(Request $request, int $id)
    {
        abort_unless(in_array($request->user()?->role, ['superadmin', 'secret_account']), 403, 'Akses ditolak.');

        \App\Models\PengajuanLog::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Log berhasil dihapus.');
    }

    /**
     * Superadmin / Secret: Force change status logically without validating lifecycle.
     */
    public function updateForceStatus(Request $request, int $id)
    {
        abort_unless(in_array($request->user()?->role, ['superadmin', 'secret_account']), 403, 'Akses ditolak.');

        $request->validate([
            'status_pengajuan' => 'required|string|max:50',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);
        $statusLama = $pengajuan->status_pengajuan;
        $statusBaru = $request->status_pengajuan;

        if ($statusLama === $statusBaru) {
            return redirect()->back()->with('warning', 'Pilih status baru yang berbeda.');
        }

        $pengajuan->status_pengajuan = $statusBaru;

        if ($statusBaru === Pengajuan::STATUS_DITERIMA) {
            // we redirect manually or let the user navigate
        }

        $pengajuan->save();

        \App\Models\PengajuanLog::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'status_lama' => $statusLama,
            'status_baru' => $statusBaru,
            'catatan' => 'Perubahan Status Manual (Force Override)',
            'changed_by_user_id' => auth()->id(),
            'changed_by_name' => auth()->user()?->name,
        ]);

        return redirect()->back()->with('success', 'Status berhasil diubah paksa.');
    }

    public function syncTim(Request $request, int $id)
    {
        $request->validate([
            'ketua_tim' => 'nullable|string|max:255',
            'dosen_terlibat' => 'nullable|array',
            'dosen_terlibat.*' => 'nullable|string|max:255',
            'staff_terlibat' => 'nullable|array',
            'staff_terlibat.*' => 'nullable|string|max:255',
            'mahasiswa_terlibat' => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:255',
        ]);

        $pengajuan = Pengajuan::findOrFail($id);

        // Ambil mapping nama pegawai ke id_pegawai untuk otomatisasi linking
        $pegawaiMap = Pegawai::pluck('id_pegawai', 'nama_pegawai');

        DB::transaction(function () use ($pengajuan, $request, $pegawaiMap) {
            // Gunakan forceDelete agar tidak menumpuk soft deletes saat sync berulang
            TimKegiatan::where('id_pengajuan', $pengajuan->id_pengajuan)->forceDelete();

            $rows = [];
            $now = now();

            // 1. Ketua
            $ketuaName = trim($request->input('ketua_tim', ''));
            if ($ketuaName !== '') {
                $idPegawai = $pegawaiMap->get($ketuaName);
                $rows[] = [
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_pegawai' => $idPegawai,
                    'nama_mahasiswa' => $idPegawai ? null : $ketuaName,
                    'peran_tim' => 'Ketua',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // 2. Anggota Terlibat
            $rolesMapping = [
                'dosen_terlibat' => 'Dosen',
                'staff_terlibat' => 'Staff',
                'mahasiswa_terlibat' => 'Mahasiswa',
            ];

            foreach ($rolesMapping as $inputKey => $peran) {
                $names = $this->normalizeTeamEntries($request->input($inputKey, []));
                foreach ($names as $name) {
                    $idPegawai = ($peran === 'Mahasiswa') ? null : $pegawaiMap->get($name);
                    $rows[] = [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_pegawai' => $idPegawai,
                        'nama_mahasiswa' => $idPegawai ? null : $name,
                        'peran_tim' => $peran,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

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

        $fields = [
            blank($pengajuan->nama_pengusul ?: $pengajuan->user?->name) ? 'nama pengusul' : null,
            blank($pengajuan->email_pengusul ?: $pengajuan->user?->email) ? 'email pengusul' : null,
            blank($pengajuan->instansi_mitra) ? 'instansi' : null,
            blank($pengajuan->no_telepon) ? 'kontak / WhatsApp' : null,
            blank($pengajuan->kebutuhan) ? ($isDosen ? 'deskripsi kegiatan' : 'kebutuhan PKM') : null,
            blank($pengajuan->provinsi) ? 'provinsi' : null,
            blank($pengajuan->kota_kabupaten) ? 'kota / kabupaten' : null,
            blank($pengajuan->surat_permohonan) ? 'surat permohonan' : null,
        ];

        return array_values(array_filter($fields));
    }

    /**
     * Export to CSV with extended columns:
     * nama_kegiatan | pengusul | jenis_pkm | instansi | tahun | sumber_dana | total_dana | nama_tim | status | lokasi | arsip
     */
    public function export(Request $request)
    {
        $query = Pengajuan::with(['user', 'arsip'])
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->where(function ($q) use ($escaped) {
                    $q->where('instansi_mitra', 'like', "%{$escaped}%")
                        ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$escaped}%"));
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status_pengajuan', $status);
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
                'Judul Proposal',
                'Pengusul',
                'Instansi/Mitra',
                'Tahun',
                'Status',
                'Lokasi',
                'Arsip',
            ]);

            $query->chunk(100, function ($items) use ($file) {
                foreach ($items as $p) {
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
                        'Pengajuan PKM dari ' . ($p->instansi_mitra ?: $p->nama_pengusul ?: ($p->user ? $p->user->name : 'Tanpa Nama')),
                        $p->user?->name ?? '-',
                        $p->instansi_mitra ?? '-',
                        $p->created_at ? $p->created_at->year : '-',
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
