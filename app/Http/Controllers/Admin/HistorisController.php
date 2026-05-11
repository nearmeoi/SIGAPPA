<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Pegawai;
use App\Models\JenisPkm;
use App\Models\Pengajuan;
use App\Models\Aktivitas;
use App\Models\TimKegiatan;
use App\Models\Arsip;
use App\Models\Testimoni;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class HistorisController extends Controller
{
    public function index()
    {
        $listPegawai = Pegawai::with('user:id_user,role')
            ->orderBy('nama_pegawai')
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

        return Inertia::render('Admin/Historis/Index', [
            'listPegawai' => $listPegawai,
            'listJenisPkm' => $listJenisPkm,
        ]);
    }

    public function previewExcel(Request $request)
    {
        $request->validate([
            'file_xlsx' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        try {
            $file = $request->file('file_xlsx');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            
            $jenisPkmMapping = JenisPkm::all();
            $highestRow = $worksheet->getHighestDataRow();
            $highestColumn = $worksheet->getHighestDataColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

            $headers = [];
            for ($column = 1; $column <= $highestColumnIndex; $column++) {
                $header = trim((string) $worksheet->getCell([$column, 1])->getFormattedValue());
                if ($header !== '') {
                    $headers[$header] = $column;
                }
            }

            $requiredHeaders = [
                'Tahun',
                'Tanggal Mulai Pelaksanaan',
                'Tanggal Akhir Pelaksanaan',
                'Judul PKM',
                'Jenis PKM / Skema Masy',
                'Pengusul',
                'Ketua TIM (Nama)',
                'Jumlah Lokasi',
                'Lokasi 1 Desa/Kelurahan',
                'Lokasi 1 Latitude',
                'Lokasi 1 Longitude',
            ];

            $missingHeaders = collect($requiredHeaders)
                ->filter(fn ($header) => !array_key_exists($header, $headers))
                ->values();

            if ($missingHeaders->isNotEmpty()) {
                return response()->json([
                    'error' => 'Format Excel tidak sesuai template historis terbaru. Kolom yang belum ada: ' . $missingHeaders->implode(', '),
                ], 422);
            }

            $rows = [];

            $cellValue = function (int $row, string $header) use ($worksheet, $headers) {
                if (!isset($headers[$header])) {
                    return null;
                }

                $cell = $worksheet->getCell([$headers[$header], $row]);
                $value = $cell->getValue();

                if ($value instanceof \DateTimeInterface) {
                    return $value->format('Y-m-d');
                }

                return $value;
            };

            $cellString = function (int $row, string $header) use ($cellValue) {
                $value = $cellValue($row, $header);
                return trim((string) ($value ?? ''));
            };

            $splitNames = function ($str) {
                $text = trim((string) $str);
                $separator = str_contains($text, ';') ? '/;/' : '/[,|]/';

                return collect(preg_split($separator, $text))
                    ->map(fn ($item) => trim($item))
                    ->filter()
                    ->values()
                    ->toArray();
            };

            $toNullableFloat = function ($value) {
                if ($value === null || $value === '') {
                    return null;
                }

                $normalized = str_replace(',', '.', trim((string) $value));
                return is_numeric($normalized) ? (float) $normalized : null;
            };

            $toMoney = function ($value) {
                if ($value === null || $value === '') {
                    return 0;
                }

                if (is_numeric($value)) {
                    return (float) $value;
                }

                $normalized = preg_replace('/[^0-9,-]/', '', (string) $value);
                $normalized = str_replace(',', '.', $normalized ?? '');

                return is_numeric($normalized) ? (float) $normalized : 0;
            };

            $toDateString = function ($value) {
                if ($value === null || $value === '') {
                    return '';
                }

                if ($value instanceof \DateTimeInterface) {
                    return $value->format('Y-m-d');
                }

                if (is_numeric($value)) {
                    try {
                        return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
                    } catch (\Throwable $e) {
                        return '';
                    }
                }

                $text = trim((string) $value);
                $timestamp = strtotime($text);

                return $timestamp ? date('Y-m-d', $timestamp) : '';
            };

            for ($row = 2; $row <= $highestRow; $row++) {
                $rowHasAnyValue = collect(array_keys($headers))
                    ->contains(fn ($header) => $cellString($row, $header) !== '');

                if (!$rowHasAnyValue) {
                    continue;
                }

                $strJenis = $cellString($row, 'Jenis PKM / Skema Masy');
                $matchedJenis = $jenisPkmMapping->first(function ($item) use ($strJenis) {
                    return $strJenis !== '' && stripos($item->nama_jenis, $strJenis) !== false;
                });

                $tahunRaw = $cellString($row, 'Tahun');
                $tahun = is_numeric($tahunRaw) ? (int) $tahunRaw : 0;
                $tglMulai = $toDateString($cellValue($row, 'Tanggal Mulai Pelaksanaan'));
                $tglSelesai = $toDateString($cellValue($row, 'Tanggal Akhir Pelaksanaan'));
                $isTahunSaja = !$tglMulai && !$tglSelesai && $tahun > 1900;

                if ($isTahunSaja) {
                    $tglMulai = $tahun . '-01-01';
                    $tglSelesai = $tahun . '-12-31';
                }

                $tipePengusul = strtolower($cellString($row, 'Pengusul') ?: 'dosen');
                $tipePengusul = in_array($tipePengusul, ['dosen', 'mahasiswa', 'masyarakat'], true) ? $tipePengusul : 'dosen';

                $jumlahLokasiRaw = $cellValue($row, 'Jumlah Lokasi');
                $jumlahLokasi = is_numeric($jumlahLokasiRaw) ? max(1, (int) $jumlahLokasiRaw) : 10;
                $jumlahLokasi = min($jumlahLokasi, 10);
                $lokasiList = [];

                for ($locationNumber = 1; $locationNumber <= $jumlahLokasi; $locationNumber++) {
                    $kelurahanDesa = $cellString($row, "Lokasi {$locationNumber} Desa/Kelurahan");
                    $kecamatan = $cellString($row, "Lokasi {$locationNumber} Kecamatan");
                    $kotaKabupaten = $cellString($row, "Lokasi {$locationNumber} Kabupaten/Kota");
                    $provinsi = $cellString($row, "Lokasi {$locationNumber} Provinsi");
                    $alamatLengkap = $cellString($row, "Lokasi {$locationNumber} Alamat Lengkap");
                    $latitude = $toNullableFloat($cellValue($row, "Lokasi {$locationNumber} Latitude"));
                    $longitude = $toNullableFloat($cellValue($row, "Lokasi {$locationNumber} Longitude"));

                    $hasLocationData = collect([$kelurahanDesa, $kecamatan, $kotaKabupaten, $provinsi, $alamatLengkap, $latitude, $longitude])
                        ->filter(fn ($value) => filled($value))
                        ->isNotEmpty();

                    if (!$hasLocationData) {
                        continue;
                    }

                    $lokasiList[] = [
                        'id_ui' => uniqid("lokasi_{$locationNumber}_"),
                        'provinsi' => $provinsi,
                        'kota_kabupaten' => $kotaKabupaten,
                        'kecamatan' => $kecamatan,
                        'kelurahan_desa' => $kelurahanDesa,
                        'alamat_lengkap' => $alamatLengkap ?: collect([$kelurahanDesa, $kecamatan, $kotaKabupaten, $provinsi])->filter()->implode(', '),
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                    ];
                }

                $lokasiUtama = $lokasiList[0] ?? [
                    'provinsi' => '',
                    'kota_kabupaten' => '',
                    'kecamatan' => '',
                    'kelurahan_desa' => '',
                    'alamat_lengkap' => '',
                    'latitude' => null,
                    'longitude' => null,
                ];
                $judulKegiatan = $cellString($row, 'Judul PKM');

                $linkTambahan = collect([
                    ['nama' => 'Link RAB / Arsip Lain', 'url' => $cellString($row, 'Link Arsip Lain / RAB (Eksternal)')],
                    ['nama' => 'Dokumen Pendukung', 'url' => $cellString($row, 'Link Bebas X')],
                ])->filter(fn ($link) => !empty($link['url']))->values()->all();

                $rows[] = [
                    'id' => uniqid(),
                    'judul_kegiatan' => $judulKegiatan ?: 'PKM Tidak Berjudul',
                    'id_jenis_pkm' => $matchedJenis ? $matchedJenis->id_jenis_pkm : ($jenisPkmMapping->first()->id_jenis_pkm ?? ''),
                    'kebutuhan' => $cellString($row, 'Kebutuhan Daerah'),
                    'tipe_pengusul' => $tipePengusul,

                    'tgl_mulai' => $tglMulai,
                    'tgl_selesai' => $tglSelesai,
                    'is_tahun_saja' => $isTahunSaja ? 1 : 0,

                    'ketua_tim' => $cellString($row, 'Ketua TIM (Nama)'),
                    'dosen_terlibat' => $splitNames($cellString($row, 'Dosen Terlibat (Koma-pisahkan)')) ?: [''],
                    'staff_terlibat' => $splitNames($cellString($row, 'Staff Terlibat (Koma)')) ?: [''],
                    'mahasiswa_terlibat' => $splitNames($cellString($row, 'Mahasiswa Terlibat (Koma)')) ?: [''],

                    'provinsi' => $lokasiUtama['provinsi'],
                    'kota_kabupaten' => $lokasiUtama['kota_kabupaten'],
                    'kecamatan' => $lokasiUtama['kecamatan'],
                    'kelurahan_desa' => $lokasiUtama['kelurahan_desa'],
                    'alamat_lengkap' => $lokasiUtama['alamat_lengkap'],
                    'latitude' => $lokasiUtama['latitude'],
                    'longitude' => $lokasiUtama['longitude'],
                    'lokasi_list' => $lokasiList,

                    'total_anggaran' => $toMoney($cellValue($row, 'Total Anggaran (Rp)')),
                    'dana_perguruan_tinggi' => $toMoney($cellValue($row, 'Sumber Dana Perguruan Tinggi (Rp)')),
                    'dana_pemerintah' => $toMoney($cellValue($row, 'Sumber Dana Pemerintah (Rp)')),
                    'dana_lembaga_dalam' => 0,
                    'dana_lembaga_luar' => 0,
                    'testimoni_link' => $cellString($row, 'Link Testimoni Eksternal / Bukti Feedback'),
                    'testimoni_nama' => $cellString($row, 'Link Testimoni Eksternal / Bukti Feedback') ? 'Testimoni Eksternal' : '',

                    'link_laporan_akhir' => $cellString($row, 'Link Laporan Akhir PKM Dokumen'),
                    'link_dokumentasi' => $cellString($row, 'Link Foto Dokumentasi'),
                    'link_tambahan' => $linkTambahan,
                ];
            }

            return response()->json(['data' => $rows]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file Excel. ' . $e->getMessage()], 422);
        }
    }

    public function storeManual(Request $request)
    {
        $validated = $this->validateInput($request);
        $this->processInjection($validated, $request->user());
        return redirect()->route('admin.historis.index')->with('success', 'Data historis berhasil ditambahkan.');
    }

    public function storeExcel(Request $request)
    {
        $request->validate([
            'rows' => 'required|array',
        ]);

        $successCount = 0;
        foreach ($request->input('rows') as $row) {
            // Re-validate just in case to avoid array bugs
            try {
                $this->processInjection($row, $request->user());
                $successCount++;
            } catch (\Exception $e) {
                // Log or ignore invalid rows? Best to let transaction rollback below actually handled inside process
                throw $e; 
            }
        }

        return redirect()->route('admin.historis.index')->with('success', "Import selesai! Berhasil menyimpan {$successCount} data PKM.");
    }

    private function validateInput(Request $request) {
        return $request->validate([
            'judul_kegiatan' => 'required|string|max:255',
            'id_jenis_pkm' => 'required|exists:jenis_pkm,id_jenis_pkm',
            'kebutuhan' => 'nullable|string',
            'tipe_pengusul' => 'nullable|string|in:dosen,mahasiswa,masyarakat',
            'tgl_mulai' => 'nullable|date',
            'tgl_selesai' => 'nullable|date|after_or_equal:tgl_mulai',
            'is_tahun_saja' => 'nullable|boolean',
            'provinsi' => 'nullable|string|max:100',
            'kota_kabupaten' => 'nullable|string|max:100',
            'kecamatan' => 'nullable|string|max:100',
            'kelurahan_desa' => 'nullable|string|max:100',
            'alamat_lengkap' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'lokasi_list' => 'nullable|array',
            'lokasi_list.*.provinsi' => 'nullable|string|max:100',
            'lokasi_list.*.kota_kabupaten' => 'nullable|string|max:100',
            'lokasi_list.*.kecamatan' => 'nullable|string|max:100',
            'lokasi_list.*.kelurahan_desa' => 'nullable|string|max:100',
            'lokasi_list.*.alamat_lengkap' => 'nullable|string',
            'lokasi_list.*.latitude' => 'nullable|numeric|between:-90,90',
            'lokasi_list.*.longitude' => 'nullable|numeric|between:-180,180',
            
            'total_anggaran' => 'nullable|numeric|min:0',
            'sumber_dana_tambahan' => 'nullable|string|max:255',
            'dana_perguruan_tinggi' => 'nullable|numeric|min:0',
            'dana_pemerintah' => 'nullable|numeric|min:0',
            'dana_lembaga_dalam' => 'nullable|numeric|min:0',
            'dana_lembaga_luar' => 'nullable|numeric|min:0',

            'ketua_tim' => 'required|string|max:100',
            'dosen_terlibat' => 'nullable|array',
            'dosen_terlibat.*' => 'nullable|string|max:100',
            'staff_terlibat' => 'nullable|array',
            'staff_terlibat.*' => 'nullable|string|max:100',
            'mahasiswa_terlibat' => 'nullable|array',
            'mahasiswa_terlibat.*' => 'nullable|string|max:100',

            'testimoni_link' => 'nullable|string',
            'testimoni_nama' => 'nullable|string',

            'link_laporan_akhir' => 'nullable|string',
            'link_dokumentasi' => 'nullable|string',
            'link_tambahan' => 'nullable|array',
            'link_tambahan.*.nama' => 'nullable|string|max:100',
            'link_tambahan.*.url' => 'nullable|string',
        ]);
    }

    private function processInjection($validated, $adminUser) {
        // Run as transaction
        DB::transaction(function () use ($validated, $adminUser) {
            $safeDate = empty($validated['tgl_mulai']) ? now() : $validated['tgl_mulai'] . ' 00:00:00';
            try {
                \Carbon\Carbon::parse($safeDate);
                $createdDate = $safeDate;
            } catch (\Exception $e) {
                $createdDate = now();
            }

            $lokasiList = collect($validated['lokasi_list'] ?? [])
                ->map(function ($lokasi) {
                    return [
                        'provinsi' => $lokasi['provinsi'] ?? null,
                        'kota_kabupaten' => $lokasi['kota_kabupaten'] ?? null,
                        'kecamatan' => $lokasi['kecamatan'] ?? null,
                        'kelurahan_desa' => $lokasi['kelurahan_desa'] ?? null,
                        'alamat_lengkap' => $lokasi['alamat_lengkap'] ?? null,
                        'latitude' => $lokasi['latitude'] ?? null,
                        'longitude' => $lokasi['longitude'] ?? null,
                    ];
                })
                ->filter(function ($lokasi) {
                    return collect($lokasi)->filter(fn ($value) => filled($value))->isNotEmpty();
                })
                ->values()
                ->all();

            if (empty($lokasiList)) {
                $lokasiList[] = [
                    'provinsi' => $validated['provinsi'] ?? null,
                    'kota_kabupaten' => $validated['kota_kabupaten'] ?? null,
                    'kecamatan' => $validated['kecamatan'] ?? null,
                    'kelurahan_desa' => $validated['kelurahan_desa'] ?? null,
                    'alamat_lengkap' => $validated['alamat_lengkap'] ?? null,
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                ];
            }

            $lokasiUtama = $lokasiList[0] ?? [];
            $lokasiTambahan = array_values(array_slice($lokasiList, 1));

            // 1. Create Pengajuan (Status: Selesai)
            $pengajuan = Pengajuan::create([
                'id_user' => $adminUser->id_user,
                'kode_unik' => strtoupper(Str::random(10)),
                'judul_kegiatan' => $validated['judul_kegiatan'],
                'id_jenis_pkm' => $validated['id_jenis_pkm'],
                'nama_pengusul' => 'Superadmin (Import Historis)',
                'tipe_pengusul' => $validated['tipe_pengusul'] ?? 'dosen',
                'kebutuhan' => $validated['kebutuhan'] ?? null,
                
                'tgl_mulai' => $validated['tgl_mulai'] ?? null,
                'tgl_selesai' => $validated['tgl_selesai'] ?? null,
                'is_tahun_saja' => $validated['is_tahun_saja'] ?? 0,

                'provinsi' => $lokasiUtama['provinsi'] ?? null,
                'kota_kabupaten' => $lokasiUtama['kota_kabupaten'] ?? null,
                'kecamatan' => $lokasiUtama['kecamatan'] ?? null,
                'kelurahan_desa' => $lokasiUtama['kelurahan_desa'] ?? null,
                'alamat_lengkap' => $lokasiUtama['alamat_lengkap'] ?? null,
                'latitude' => $lokasiUtama['latitude'] ?? null,
                'longitude' => $lokasiUtama['longitude'] ?? null,
                'lokasi_tambahan' => $lokasiTambahan,

                'total_anggaran' => $validated['total_anggaran'] ?? 0,
                'dana_perguruan_tinggi' => $validated['dana_perguruan_tinggi'] ?? 0,
                'dana_pemerintah' => $validated['dana_pemerintah'] ?? 0,
                'dana_lembaga_dalam' => $validated['dana_lembaga_dalam'] ?? 0,
                'dana_lembaga_luar' => $validated['dana_lembaga_luar'] ?? 0,

                'status_pengajuan' => 'selesai',
                'catatan_admin' => 'Data Historis (Migrasi Otomatis)',
                'created_at' => $createdDate,
                'updated_at' => $createdDate,
            ]);

            // 2. Create Tim Kegiatan
            $timRecords = [];
            
            // Ketua
            if (!empty($validated['ketua_tim'])) {
                $pegawai = Pegawai::where('nama_pegawai', $validated['ketua_tim'])->first();
                $timRecords[] = [
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_pegawai' => $pegawai ? $pegawai->id_pegawai : null,
                    'nama_mahasiswa' => !$pegawai ? $validated['ketua_tim'] : null,
                    'peran_tim' => 'ketua',
                    'created_at' => $createdDate,
                    'updated_at' => $createdDate,
                ];
            }

            if (!empty($validated['dosen_terlibat'])) {
                foreach ($validated['dosen_terlibat'] as $dosen) {
                    if (!$dosen) continue;
                    $peg = Pegawai::where('nama_pegawai', $dosen)->first();
                    $timRecords[] = [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_pegawai' => $peg ? $peg->id_pegawai : null,
                        'nama_mahasiswa' => !$peg ? $dosen : null,
                        'peran_tim' => 'anggota_dosen',
                        'created_at' => $createdDate,
                        'updated_at' => $createdDate,
                    ];
                }
            }

            if (!empty($validated['staff_terlibat'])) {
                foreach ($validated['staff_terlibat'] as $staff) {
                    if (!$staff) continue;
                    $peg = Pegawai::where('nama_pegawai', $staff)->first();
                    $timRecords[] = [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_pegawai' => $peg ? $peg->id_pegawai : null,
                        'nama_mahasiswa' => !$peg ? $staff : null,
                        'peran_tim' => 'anggota_staff',
                        'created_at' => $createdDate,
                        'updated_at' => $createdDate,
                    ];
                }
            }

            if (!empty($validated['mahasiswa_terlibat'])) {
                foreach ($validated['mahasiswa_terlibat'] as $mhs) {
                    if (!$mhs) continue;
                    $timRecords[] = [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_pegawai' => null,
                        'nama_mahasiswa' => $mhs,
                        'peran_tim' => 'anggota_mahasiswa',
                        'created_at' => $createdDate,
                        'updated_at' => $createdDate,
                    ];
                }
            }

            if (count($timRecords) > 0) {
                TimKegiatan::insert($timRecords);
            }

            // 3. Create Aktivitas (Status: Selesai)
            $aktivitas = Aktivitas::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'status_pelaksanaan' => 'selesai',
                'catatan_pelaksanaan' => 'Selesai (Impor Historis)',
                'created_at' => $createdDate,
                'updated_at' => $createdDate,
            ]);

            // 4. Testimoni (if any)
            if (!empty($validated['testimoni_link'])) {
                Testimoni::create([
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'nama_pemberi' => $validated['testimoni_nama'] ?: 'Tester/Eksternal',
                    'rating' => 5,
                    'pesan_ulasan' => $validated['testimoni_link'],
                    'masukan' => null,
                    'created_at' => $createdDate,
                    'updated_at' => $createdDate,
                ]);
            }

            // 5. Arsip
            $arsipData = [];
            $baseArsip = [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'keterangan' => 'Arsip Impor Historis',
                'created_at' => $createdDate,
                'updated_at' => $createdDate,
            ];

            if (!empty($validated['link_laporan_akhir'])) {
                $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => 'Laporan Akhir', 'jenis_arsip' => 'laporan_akhir', 'url_dokumen' => $validated['link_laporan_akhir']]);
            }
            if (!empty($validated['link_dokumentasi'])) {
                $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => 'Dokumentasi PKM', 'jenis_arsip' => 'foto_kegiatan', 'url_dokumen' => $validated['link_dokumentasi']]);
            }

            if (!empty($validated['link_tambahan'])) {
                foreach ($validated['link_tambahan'] as $tambahan) {
                    if (empty($tambahan['url'])) continue;
                    $n = empty($tambahan['nama']) ? 'Dokumen Lain' : $tambahan['nama'];
                    $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => $n, 'jenis_arsip' => 'dokumen_lain', 'url_dokumen' => $tambahan['url']]);
                }
            }

            if (!empty($arsipData)) {
                Arsip::insert($arsipData);
            }
        });
    }
}
