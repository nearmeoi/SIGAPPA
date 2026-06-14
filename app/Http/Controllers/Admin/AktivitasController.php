<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\UndanganMail;
use App\Models\Aktivitas;
use App\Models\JenisPkm;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\TimKegiatan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AktivitasController extends Controller
{
    public function index(Request $request)
    {
        $sortField = $request->get('sort', 'created_at');
        $sortDir = $request->get('direction', 'desc');

        $listAktivitas = Aktivitas::with([
            'pengajuan.user',
            'jenisPkm',
        ])
            ->when($request->status, function ($query, $status) {
                if ($status === 'belum_mulai') {
                    $query->whereIn('status_pelaksanaan', ['belum_mulai', 'persiapan']);

                    return;
                }

                $query->where('status_pelaksanaan', $status);
            })
            ->when($request->tahun, function ($query, $tahun) {
                $query->whereYear('tgl_mulai', $tahun);
            })
            ->when($request->jenis_pkm, function ($query, $jenisPkm) {
                $query->whereHas('jenisPkm', fn($q) => $q->where('jenis_pkm.id_jenis_pkm', $jenisPkm));
            })
            ->when($sortField === 'status_pelaksanaan', function ($query) use ($sortDir) {
                $query->orderByRaw("FIELD(status_pelaksanaan, 'belum_mulai', 'persiapan', 'berjalan', 'selesai') ".$sortDir);
            }, function ($query) use ($sortField, $sortDir) {
                $query->orderBy($sortField, $sortDir);
            })
            ->paginate(15)
            ->through(fn($a) => [
                'id_aktivitas' => $a->id_aktivitas,
                'status_pelaksanaan' => $a->status_pelaksanaan,
                'catatan_pelaksanaan' => $a->catatan_pelaksanaan,
                'url_thumbnail' => $a->url_thumbnail,
                'created_at' => $a->created_at?->format('Y-m-d H:i:s'),
                'pengajuan' => $a->pengajuan ? [
                    'id_pengajuan' => $a->pengajuan->id_pengajuan,
                    'judul_kegiatan' => $a->judul_pkm ?? ('Pengajuan PKM #' . $a->pengajuan->id_pengajuan),
                    'tgl_mulai' => $a->tgl_mulai?->format('Y-m-d'),
                    'tgl_selesai' => $a->tgl_selesai?->format('Y-m-d'),
                    'user' => $a->pengajuan->user ? [
                        'id_user' => $a->pengajuan->user->id_user,
                        'name' => $a->pengajuan->user->name,
                        'email' => $a->pengajuan->user->email,
                    ] : null,
                    'jenis_pkm' => $a->jenisPkm->first() ? [
                        'nama_jenis' => $a->jenisPkm->first()->nama_jenis,
                        'warna_icon' => $a->jenisPkm->first()->warna_icon,
                    ] : null,
                ] : null,
            ])
            ->withQueryString();

        return Inertia::render('Admin/Aktivitas/Index', [
            'listAktivitas' => $listAktivitas,
            'filters' => [
                'sort' => $sortField,
                'direction' => $sortDir,
                'status' => $request->status,
                'tahun' => $request->tahun ?? '',
                'jenis_pkm' => $request->jenis_pkm ?? '',
            ],
            'availableYears' => Aktivitas::selectRaw('YEAR(tgl_mulai) as year')
                                ->whereNotNull('tgl_mulai')
                                ->groupBy('year')
                                ->orderBy('year', 'desc')
                                ->pluck('year'),
            'listJenisPkm' => JenisPkm::orderBy('nama_jenis')->get(['id_jenis_pkm', 'nama_jenis', 'warna_icon']),
        ]);
    }

    public function show(int $id)
    {
        $a = Aktivitas::with([
            'pengajuan.user',
            'jenisPkm',
            'timKegiatan.pegawai',
            'arsip',
            'testimoni',
        ])->findOrFail($id);

        $aktivitasMapped = [
            'id_aktivitas' => $a->id_aktivitas,
            'status_pelaksanaan' => $a->status_pelaksanaan,
            'catatan_pelaksanaan' => $a->catatan_pelaksanaan,
            'url_thumbnail' => $a->url_thumbnail,
            'created_at' => $a->created_at?->format('Y-m-d H:i:s'),
            'pengajuan' => $a->pengajuan ? [
                'id_pengajuan' => $a->pengajuan->id_pengajuan,
                'judul_kegiatan' => $a->judul_pkm ?? ('Pengajuan PKM #' . $a->pengajuan->id_pengajuan),
                'instansi_mitra' => $a->pengajuan->instansi_mitra,
                'no_telepon' => $a->pengajuan->no_telepon,
                'provinsi' => $a->pengajuan->provinsi,
                'kota_kabupaten' => $a->pengajuan->kota_kabupaten,
                'kecamatan' => $a->pengajuan->kecamatan,
                'kelurahan_desa' => $a->pengajuan->kelurahan_desa,
                'alamat_lengkap' => $a->pengajuan->alamat_lengkap,
                'latitude' => $a->pengajuan->latitude,
                'longitude' => $a->pengajuan->longitude,
                'tgl_mulai' => $a->tgl_mulai?->format('Y-m-d'),
                'tgl_selesai' => $a->tgl_selesai?->format('Y-m-d'),
                'sumber_dana' => $a->sumberDana?->nama_sumber_dana ?? '',
                'total_anggaran' => $a->total_anggaran,
                'user' => $a->pengajuan->user ? [
                    'id_user' => $a->pengajuan->user->id_user,
                    'name' => $a->pengajuan->user->name,
                    'email' => $a->pengajuan->user->email,
                ] : null,
                'jenis_pkm' => $a->jenisPkm->first() ? [
                    'nama_jenis' => $a->jenisPkm->first()->nama_jenis,
                ] : null,
                'tim_kegiatan' => $a->timKegiatan->map(fn($t) => [
                    'nama' => $t->pegawai ? $t->pegawai->nama_pegawai : $t->nama_mahasiswa,
                    'peran' => $t->peran_tim,
                ]),
            ] : null,
            'arsip' => $a->arsip->map(fn($ar) => [
                'id_arsip' => $ar->id_arsip,
                'nama_dokumen' => $ar->nama_dokumen,
                'url_dokumen' => $ar->url_dokumen,
                'jenis_arsip' => $ar->jenis_arsip,
            ]),
            'testimoni' => $a->testimoni->map(fn($t) => [
                'nama_pemberi' => $t->nama_pemberi,
                'rating' => $t->rating,
                'pesan_ulasan' => $t->pesan_ulasan,
            ]),
        ];

        return Inertia::render('Admin/Aktivitas/Detail', [
            'aktivitas' => $aktivitasMapped,
            'listPegawai' => Pegawai::orderBy('nama_pegawai')->get(['id_pegawai', 'nama_pegawai', 'nip']),
            'listJenisPkm' => JenisPkm::orderBy('nama_jenis')->get(['id_jenis_pkm', 'nama_jenis']),
        ]);
    }

    /**
     * Membuat Aktivitas baru untuk sebuah Pengajuan yang sudah diterima.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_pengajuan'       => 'required|exists:pengajuan,id_pengajuan',
            'judul_pkm'          => 'required|string|max:255',
            // Jenis PKM opsional saat buat — bisa diset nanti lewat update/detail aktivitas
            'id_jenis_pkm'       => 'nullable|array',
            'id_jenis_pkm.*'     => 'exists:jenis_pkm,id_jenis_pkm',
            'tgl_mulai'          => 'nullable|date',
            'tgl_selesai'        => 'nullable|date|after_or_equal:tgl_mulai',
            'is_tahun_saja'      => 'nullable|boolean',
            // Lokasi
            'provinsi'           => 'nullable|string|max:100',
            'kota_kabupaten'     => 'nullable|string|max:100',
            'kecamatan'          => 'nullable|string|max:100',
            'kelurahan_desa'     => 'nullable|string|max:100',
            'alamat_lengkap'     => 'nullable|string',
            'latitude'           => 'nullable|numeric|between:-90,90',
            'longitude'          => 'nullable|numeric|between:-180,180',
            // RAB
            'total_anggaran'     => 'nullable|numeric|min:0',
            'id_sumber_dana'     => 'nullable|exists:jenis_sumber_dana,id_sumber_dana',
            // Tim
            'ketua_tim'          => 'nullable|string|max:255',
            'dosen_terlibat'     => 'nullable|array',
            'dosen_terlibat.*'   => 'nullable|string|max:255',
            'staff_terlibat'     => 'nullable|array',
            'staff_terlibat.*'   => 'nullable|string|max:255',
            'mahasiswa_terlibat' => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:255',
        ]);

        $pengajuan = Pengajuan::findOrFail($validated['id_pengajuan']);

        // Validasi: pengajuan harus berstatus diterima atau selesai
        if (! in_array($pengajuan->status_pengajuan, ['diterima', 'selesai'])) {
            return back()->withErrors(['id_pengajuan' => 'Aktivitas hanya bisa dibuat untuk pengajuan yang sudah diterima.']);
        }

        DB::transaction(function () use ($validated, $pengajuan) {
            // 1. Buat Aktivitas
            $aktivitas = Aktivitas::create([
                'id_pengajuan'     => $pengajuan->id_pengajuan,
                'judul_pkm'        => $validated['judul_pkm'],
                'tgl_mulai'        => $validated['tgl_mulai'] ?? null,
                'tgl_selesai'      => $validated['tgl_selesai'] ?? null,
                'provinsi'         => $validated['provinsi'] ?? null,
                'kota_kabupaten'   => $validated['kota_kabupaten'] ?? null,
                'kecamatan'        => $validated['kecamatan'] ?? null,
                'kelurahan_desa'   => $validated['kelurahan_desa'] ?? null,
                'alamat_lengkap'   => $validated['alamat_lengkap'] ?? null,
                'latitude'         => $validated['latitude'] ?? null,
                'longitude'        => $validated['longitude'] ?? null,
                'total_anggaran'   => $validated['total_anggaran'] ?? 0,
                'id_sumber_dana'   => $validated['id_sumber_dana'] ?? null,
                'status_pelaksanaan' => 'belum_mulai',
            ]);

            // 2. Attach Jenis PKM melalui pivot (jika disertakan)
            if (! empty($validated['id_jenis_pkm'])) {
                $aktivitas->jenisPkm()->sync($validated['id_jenis_pkm']);
            }

            // 3. Simpan Tim Kegiatan
            $pegawaiMap = Pegawai::pluck('id_pegawai', 'nama_pegawai');
            $rows = [];
            $now = now();

            if (! empty($validated['ketua_tim'])) {
                $name = trim($validated['ketua_tim']);
                $idPegawai = $pegawaiMap->get($name);
                $rows[] = [
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'id_pegawai'   => $idPegawai,
                    'nama_mahasiswa' => $idPegawai ? null : $name,
                    'peran_tim'    => 'ketua',
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }

            $rolesMap = [
                'dosen_terlibat'     => 'anggota_dosen',
                'staff_terlibat'     => 'anggota_staff',
                'mahasiswa_terlibat' => 'anggota_mahasiswa',
            ];

            foreach ($rolesMap as $inputKey => $peranTim) {
                foreach (($validated[$inputKey] ?? []) as $name) {
                    $name = trim($name);
                    if (! $name) continue;
                    $idPegawai = ($peranTim === 'anggota_mahasiswa') ? null : $pegawaiMap->get($name);
                    $rows[] = [
                        'id_aktivitas' => $aktivitas->id_aktivitas,
                        'id_pegawai'   => $idPegawai,
                        'nama_mahasiswa' => $idPegawai ? null : $name,
                        'peran_tim'    => $peranTim,
                        'created_at'   => $now,
                        'updated_at'   => $now,
                    ];
                }
            }

            if (! empty($rows)) {
                TimKegiatan::insert($rows);
            }
        });

        return redirect()
            ->to("/admin/pengajuan/{$pengajuan->id_pengajuan}")
            ->with('success', 'Aktivitas berhasil dibuat.');
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'status_pelaksanaan'  => 'required|in:belum_mulai,persiapan,berjalan,selesai',
            'catatan_pelaksanaan' => 'nullable|string|max:1000',
            'judul_pkm'           => 'nullable|string|max:255',
            'tgl_mulai'           => 'nullable|date',
            'tgl_selesai'         => 'nullable|date|after_or_equal:tgl_mulai',
            'total_anggaran'      => 'nullable|numeric|min:0',
            'id_sumber_dana'      => 'nullable|exists:jenis_sumber_dana,id_sumber_dana',
            'thumbnail'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            // Lokasi — tersimpan di aktivitas, bukan pengajuan
            'provinsi'            => 'nullable|string|max:100',
            'kota_kabupaten'      => 'nullable|string|max:100',
            'kecamatan'           => 'nullable|string|max:100',
            'kelurahan_desa'      => 'nullable|string|max:100',
            'alamat_lengkap'      => 'nullable|string',
            'latitude'            => 'nullable|numeric|between:-90,90',
            'longitude'           => 'nullable|numeric|between:-180,180',
        ]);

        $aktivitas = Aktivitas::with('pengajuan.aktivitas')->findOrFail($id);

        $fillable = [
            'status_pelaksanaan', 'catatan_pelaksanaan', 'judul_pkm',
            'tgl_mulai', 'tgl_selesai', 'total_anggaran', 'id_sumber_dana',
            'provinsi', 'kota_kabupaten', 'kecamatan', 'kelurahan_desa',
            'alamat_lengkap', 'latitude', 'longitude',
        ];

        $aktivitas->fill($request->only($fillable));

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('aktivitas/thumbnails', 'public');
            $aktivitas->url_thumbnail = '/storage/' . $path;
        }

        $aktivitas->save();

        // Update jenis_pkm jika dikirim
        if ($request->has('id_jenis_pkm')) {
            $ids = is_array($request->id_jenis_pkm) ? $request->id_jenis_pkm : [$request->id_jenis_pkm];
            $aktivitas->jenisPkm()->sync($ids);
        }

        // --- Logika Status Pengajuan (berdasarkan SEMUA aktivitas) ---
        $pengajuan = $aktivitas->pengajuan;
        if ($pengajuan) {
            $allAktivitas = $pengajuan->aktivitas()->get();
            $semuaSelesai = $allAktivitas->isNotEmpty() && $allAktivitas->every(fn($a) => $a->status_pelaksanaan === 'selesai');

            if ($semuaSelesai) {
                $pengajuan->update(['status_pengajuan' => 'selesai']);
            } elseif (in_array($pengajuan->status_pengajuan, ['selesai'])) {
                // Jika ada aktivitas yang di-reopen, kembalikan ke diterima
                $pengajuan->update(['status_pengajuan' => 'diterima']);
            }
        }

        return redirect()->back()->with('success', 'Aktivitas berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $aktivitas = Aktivitas::with(['timKegiatan', 'arsip', 'testimoni'])->findOrFail($id);

        DB::transaction(function () use ($aktivitas) {
            $aktivitas->timKegiatan()->delete();
            $aktivitas->arsip()->delete();
            $aktivitas->testimoni()->delete();
            $aktivitas->jenisPkm()->detach();
            $aktivitas->delete();
        });

        return redirect()->back()->with('success', 'Aktivitas berhasil dihapus.');
    }

    // ─── Tim Kegiatan ────────────────────────────────────────────────────────────

    /**
     * Sinkronisasi penuh anggota tim untuk sebuah Aktivitas.
     */
    public function syncTim(Request $request, int $id)
    {
        $request->validate([
            'ketua_tim'            => 'nullable|string|max:255',
            'dosen_terlibat'       => 'nullable|array',
            'dosen_terlibat.*'     => 'nullable|string|max:255',
            'staff_terlibat'       => 'nullable|array',
            'staff_terlibat.*'     => 'nullable|string|max:255',
            'mahasiswa_terlibat'   => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:255',
        ]);

        $aktivitas = Aktivitas::findOrFail($id);
        $pegawaiMap = Pegawai::pluck('id_pegawai', 'nama_pegawai');

        DB::transaction(function () use ($aktivitas, $request, $pegawaiMap) {
            // Hapus tim lama (hard delete agar tidak menumpuk)
            TimKegiatan::where('id_aktivitas', $aktivitas->id_aktivitas)->forceDelete();

            $rows = [];
            $now  = now();

            // Ketua
            $ketuaName = trim($request->input('ketua_tim', ''));
            if ($ketuaName !== '') {
                $idPegawai = $pegawaiMap->get($ketuaName);
                $rows[] = [
                    'id_aktivitas'   => $aktivitas->id_aktivitas,
                    'id_pegawai'     => $idPegawai,
                    'nama_mahasiswa' => $idPegawai ? null : $ketuaName,
                    'peran_tim'      => 'ketua',
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];
            }

            $rolesMap = [
                'dosen_terlibat'     => 'anggota_dosen',
                'staff_terlibat'     => 'anggota_staff',
                'mahasiswa_terlibat' => 'anggota_mahasiswa',
            ];

            foreach ($rolesMap as $inputKey => $peranTim) {
                $names = collect($request->input($inputKey, []))
                    ->map(fn($n) => trim((string) $n))
                    ->filter()
                    ->values();

                foreach ($names as $name) {
                    $idPegawai = ($peranTim === 'anggota_mahasiswa') ? null : $pegawaiMap->get($name);
                    $rows[] = [
                        'id_aktivitas'   => $aktivitas->id_aktivitas,
                        'id_pegawai'     => $idPegawai,
                        'nama_mahasiswa' => $idPegawai ? null : $name,
                        'peran_tim'      => $peranTim,
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ];
                }
            }

            if (! empty($rows)) {
                TimKegiatan::insert($rows);
            }
        });

        return redirect()->back()->with('success', 'Tim pelaksana berhasil diperbarui.');
    }

    /**
     * Tambah satu anggota tim ke Aktivitas.
     */
    public function storeTim(Request $request, int $id)
    {
        $request->validate([
            'id_pegawai'     => 'nullable|exists:pegawai,id_pegawai',
            'nama_mahasiswa' => 'nullable|string|max:255',
            'peran_tim'      => 'required|string|max:100',
        ]);

        $aktivitas = Aktivitas::findOrFail($id);

        TimKegiatan::create([
            'id_aktivitas'   => $aktivitas->id_aktivitas,
            'id_pegawai'     => $request->id_pegawai,
            'nama_mahasiswa' => $request->nama_mahasiswa,
            'peran_tim'      => $request->peran_tim,
        ]);

        return redirect()->back()->with('success', 'Anggota tim berhasil ditambahkan.');
    }

    /**
     * Hapus satu anggota tim dari Aktivitas.
     */
    public function destroyTim(int $aktivitasId, int $timId)
    {
        $tim = TimKegiatan::where('id_aktivitas', $aktivitasId)
            ->where('id_tim', $timId)
            ->firstOrFail();

        $tim->delete();

        return redirect()->back()->with('success', 'Anggota tim berhasil dihapus.');
    }

    /**
     * Send invitation emails to selected aktivitas (belum_mulai only).
     * Rate limited to 100 emails per day.
     */
    public function sendUndangan(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:aktivitas,id_aktivitas',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
        ]);

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            return back()->with('error', 'Pengiriman email belum aktif. Konfigurasi mailer masih menggunakan mode log/array. Ubah MAIL_MAILER ke SMTP atau mailer produksi yang valid.');
        }

        // Daily rate limiting via cache
        $cacheKey = 'undangan_email_count_'.now()->toDateString();
        $sentToday = (int) Cache::get($cacheKey, 0);
        $dailyLimit = 300;

        $aktivitasList = Aktivitas::with(['pengajuan.user', 'jenisPkm'])
            ->whereIn('id_aktivitas', $request->ids)
            ->whereIn('status_pelaksanaan', ['belum_mulai', 'persiapan'])
            ->get();

        if ($aktivitasList->isEmpty()) {
            return back()->with('error', 'Tidak ada aktivitas berstatus "Belum Mulai" yang dipilih.');
        }

        $successCount = 0;
        $failedEmails = [];
        $skippedNoEmail = 0;

        foreach ($aktivitasList as $aktivitas) {
            // Check daily limit
            if (($sentToday + $successCount) >= $dailyLimit) {
                $failedEmails[] = 'Batas harian (300 email/hari) telah tercapai.';
                break;
            }

            $pengajuan = $aktivitas->pengajuan;
            if (! $pengajuan) {
                continue;
            }

            $recipientEmail = $pengajuan->email_pengusul ?? $pengajuan->user?->email;
            $recipientName = $pengajuan->nama_pengusul ?? $pengajuan->user?->name ?? 'Bapak/Ibu';
            $judulKegiatan = $aktivitas->judul_pkm ?? ('Pengajuan PKM #' . $pengajuan->id_pengajuan);
            $tglMulai = $aktivitas->tgl_mulai ? Carbon::parse($aktivitas->tgl_mulai)->locale('id')->isoFormat('D MMMM YYYY') : 'Akan ditentukan';
            $tglSelesai = $aktivitas->tgl_selesai ? Carbon::parse($aktivitas->tgl_selesai)->locale('id')->isoFormat('D MMMM YYYY') : 'Akan ditentukan';
            $lokasiParts = array_filter([$pengajuan->kota_kabupaten, $pengajuan->provinsi]);
            $lokasi = ! empty($lokasiParts) ? implode(', ', $lokasiParts) : 'Akan ditentukan';
            $jenisPkm = $aktivitas->jenisPkm->first()?->nama_jenis ?? 'PKM';

            if (! $recipientEmail || ! filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
                $skippedNoEmail++;

                continue;
            }

            try {
                Mail::to($recipientEmail)->send(
                    new UndanganMail($recipientName, $judulKegiatan, $request->subject, $request->body, $recipientEmail, $tglMulai, $tglSelesai, $lokasi, $jenisPkm)
                );
                $successCount++;
            } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface $e) {
                $host = config('mail.mailers.smtp.host', '127.0.0.1');
                $port = config('mail.mailers.smtp.port', '2525');
                return back()->with('error', "Gagal terhubung ke server email ({$host}:{$port}). Pastikan SMTP server aktif atau konfigurasi MAIL_HOST/MAIL_PORT di .env sudah benar.");
            } catch (\Throwable $e) {
                $failedEmails[] = "{$recipientEmail}: ".Str::limit($e->getMessage(), 80);
            }
        }

        // Update daily counter
        Cache::put($cacheKey, $sentToday + $successCount, now()->endOfDay());

        // Build response message
        $message = "Berhasil mengirim {$successCount} undangan.";
        if ($skippedNoEmail > 0) {
            $message .= " ({$skippedNoEmail} dilewati karena tidak ada email.)";
        }
        if (! empty($failedEmails)) {
            $message .= ' Gagal: '.implode('; ', array_slice($failedEmails, 0, 3));
        }

        $remaining = $dailyLimit - ($sentToday + $successCount);
        $message .= " (Sisa kuota hari ini: {$remaining} email)";

        return back()->with($successCount > 0 ? 'success' : 'error', $message);
    }

    /**
     * Export aktivitas data to XLSX with styled columns.
     */
    public function export(Request $request)
    {
        $query = Aktivitas::with(['pengajuan.user', 'jenisPkm', 'timKegiatan.pegawai', 'arsip'])
            ->when($request->search, function ($query, $search) {
                $escaped = addcslashes($search, '\\%_');
                $query->where('judul_pkm', 'like', "%{$escaped}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status_pelaksanaan', $status);
            })
            ->when($request->tahun, function ($query, $tahun) {
                $query->whereYear('tgl_mulai', $tahun);
            })
            ->when($request->jenis_pkm, function ($query, $jenisPkm) {
                $query->whereHas('jenisPkm', fn($q) => $q->where('jenis_pkm.id_jenis_pkm', $jenisPkm));
            })
            ->latest();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Aktivitas PKM');

        $headers = [
            'No',
            'Judul Kegiatan',
            'Pengusul / Ketua Tim',
            'Email Pengusul',
            'No. Telepon',
            'Jenis PKM',
            'Tahun Pelaksanaan',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Provinsi',
            'Kota / Kabupaten',
            'Kecamatan',
            'Kelurahan / Desa',
            'Status Pelaksanaan',
            'Total Anggaran (Rp)',
            'Dosen Terlibat',
            'Staf Terlibat',
            'Mahasiswa Terlibat',
            'Jumlah Arsip',
        ];

        // Write header row with styling
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '046BD2']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'D1D5DB']]],
        ];

        foreach ($headers as $colIndex => $header) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
            $sheet->setCellValue("{$col}1", $header);
        }

        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers));
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // Write data rows
        $rowNum = 2;
        $no = 1;
        $query->chunk(100, function ($items) use ($sheet, &$rowNum, &$no) {
            foreach ($items as $a) {
                $p = $a->pengajuan;

                $dosen = [];
                $staf = [];
                $mahasiswa = [];

                if ($a->timKegiatan) {
                    foreach ($a->timKegiatan as $anggota) {
                        $nama = $anggota->pegawai?->nama_pegawai ?? $anggota->nama_mahasiswa ?? '-';
                        match ($anggota->peran_tim) {
                            'anggota_dosen' => $dosen[] = $nama,
                            'anggota_staff' => $staf[] = $nama,
                            'anggota_mahasiswa' => $mahasiswa[] = $nama,
                            default => null,
                        };
                    }
                }

                $totalAnggaran = (float) ($a->total_anggaran ?? 0);

                $row = [
                    $no++,
                    $a->judul_pkm ?? ('Pengajuan PKM #' . ($p?->id_pengajuan ?? '')),
                    $p?->nama_pengusul ?? $p?->user?->name ?? '-',
                    $p?->email_pengusul ?? $p?->user?->email ?? '-',
                    $p?->no_telepon ?? '-',
                    $a->jenisPkm->first()?->nama_jenis ?? '-',
                    $a->tgl_mulai ? $a->tgl_mulai->format('Y') : ($p?->created_at ? $p->created_at->format('Y') : '-'),
                    $a->tgl_mulai ? $a->tgl_mulai->format('d/m/Y') : '-',
                    $a->tgl_selesai ? $a->tgl_selesai->format('d/m/Y') : '-',
                    $p?->provinsi ?? '-',
                    $p?->kota_kabupaten ?? '-',
                    $p?->kecamatan ?? '-',
                    $p?->kelurahan_desa ?? '-',
                    ucfirst(str_replace('_', ' ', $a->status_pelaksanaan)),
                    $totalAnggaran,
                    implode('; ', $dosen) ?: '-',
                    implode('; ', $staf) ?: '-',
                    implode('; ', $mahasiswa) ?: '-',
                    $a->arsip?->count() ?? 0,
                ];

                foreach ($row as $colIndex => $value) {
                    $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                    $sheet->setCellValue("{$col}{$rowNum}", $value);
                }

                // Zebra striping
                if ($rowNum % 2 === 0) {
                    $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($row));
                    $sheet->getStyle("A{$rowNum}:{$lastCol}{$rowNum}")->getFill()
                        ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F1F5F9');
                }

                $rowNum++;
            }
        });

        // Format total anggaran column as number with thousands separator
        $anggaranCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(15);
        $sheet->getStyle("{$anggaranCol}2:{$anggaranCol}" . max($rowNum - 1, 2))
            ->getNumberFormat()
            ->setFormatCode('#,##0');

        // Data area border
        if ($rowNum > 2) {
            $sheet->getStyle("A2:{$lastCol}" . ($rowNum - 1))->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']]],
                'alignment' => ['vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
            ]);
        }

        // Auto-size columns
        foreach (range(1, count($headers)) as $colIndex) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Freeze header row
        $sheet->freezePane('A2');

        $filename = 'Aktivitas_PKM_' . now()->format('Y-m-d_His') . '.xlsx';

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }



    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'nullable|array',
            'ids.*' => 'integer|exists:aktivitas,id_aktivitas',
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
            $query = Aktivitas::query();

            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function($q) use ($search) {
                    $q->where('judul_aktivitas', 'like', "%{$search}%")
                      ->orWhere('deskripsi_aktivitas', 'like', "%{$search}%")
                      ->orWhere('lokasi_kegiatan', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['tahun'])) {
                $query->whereYear('tgl_mulai', $filters['tahun']);
            }

            if (!empty($excludedIds)) {
                $query->whereNotIn('id_aktivitas', $excludedIds);
            }

            $items = $query->get();
            $count = $items->count();
            $query->delete(); // Soft delete all matched
        } else {
            $count = count($ids);
            Aktivitas::whereIn('id_aktivitas', $ids)->delete();
        }

        return redirect()->back()->with('success', $count . ' data aktivitas berhasil dihapus massal.');
    }
}
