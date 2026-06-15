<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHistorisRequest;
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

/**
 * Controller untuk Import Data Historis PKM.
 *
 * Mendukung 2 mode:
 * 1. Form Manual — input satu-satu via form UI
 * 2. Import Excel — upload file .xlsx, preview, lalu batch insert
 *
 * Setiap data historis menghasilkan chain record:
 * Pengajuan (selesai) → Aktivitas (selesai) → Tim → Testimoni → Arsip
 *
 * @see StoreHistorisRequest untuk aturan validasi
 */
class HistorisController extends Controller
{
    private static $cachedPegawai = null;

    private function cleanNameForMatching($name)
    {
        if (empty($name)) {
            return '';
        }

        // Convert to lowercase
        $name = strtolower($name);

        // Remove academic degrees/titles and common prefixes/suffixes
        $patterns = [
            '/\b(dr|prof|ir|drs|dra)\b/i', // prefixes
            '/\b(s\.?pd|m\.?pd|s\.?e|m\.?se|m\.?par|s\.?st\.?par|s\.?st|m\.?m|s\.?kom|m\.?kom|ph\.?d|b\.?sc|m\.?sc|s\.?t|m\.?t|h\.?c)\b/i', // suffixes
        ];

        $name = preg_replace($patterns, '', $name);

        // Remove all non-alphanumeric/non-space characters
        $name = preg_replace('/[^a-z0-9\s]/', '', $name);

        // Strip double/multiple spaces
        $name = preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }

    private function getPegawaiList()
    {
        if (self::$cachedPegawai === null) {
            self::$cachedPegawai = Pegawai::all();
        }
        return self::$cachedPegawai;
    }

    private function findPegawaiByName($name)
    {
        if (empty($name)) {
            return null;
        }

        $cleanTarget = $this->cleanNameForMatching($name);
        if (empty($cleanTarget)) {
            return null;
        }

        // Try exact match on clean name first
        foreach ($this->getPegawaiList() as $pegawai) {
            $cleanPegawaiName = $this->cleanNameForMatching($pegawai->nama_pegawai);
            if ($cleanPegawaiName === $cleanTarget) {
                return $pegawai;
            }
        }

        // Try word-boundary fuzzy match
        foreach ($this->getPegawaiList() as $pegawai) {
            $cleanPegawaiName = $this->cleanNameForMatching($pegawai->nama_pegawai);
            if (!empty($cleanPegawaiName)) {
                if (preg_match('/\b' . preg_quote($cleanTarget, '/') . '\b/i', $cleanPegawaiName) || 
                    preg_match('/\b' . preg_quote($cleanPegawaiName, '/') . '\b/i', $cleanTarget)) {
                    return $pegawai;
                }
            }
        }

        return null;
    }

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
                    'dana_pemerintah' => $toMoney($cellValue($row, 'Sumber Dana Pemerintah (Rp)')),                    'dana_lembaga_dalam' => 0,
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

    /**
     * Simpan satu data historis via form manual.
     * Validasi otomatis oleh StoreHistorisRequest sebelum masuk method ini.
     */
    public function storeManual(StoreHistorisRequest $request)
    {
        DB::transaction(function () use ($request) {
            $this->processInjection($request->validated(), $request->user());
        });
        return redirect()->route('admin.historis.index')->with('success', 'Data historis berhasil ditambahkan.');
    }

    /**
     * Import massal data historis dari hasil parsing Excel.
     *
     * Flow:
     * 1. Validasi setiap baris dengan aturan yang sama seperti form manual
     * 2. Jika semua baris valid, simpan semua dalam satu transaksi
     * 3. Jika ada 1 baris gagal validasi → tolak semua (fail-fast)
     * 4. Jika ada 1 baris gagal insert → rollback semua (atomik)
     */
    public function storeExcel(Request $request)
    {
        $request->validate([
            'rows' => 'required|array',
        ]);

        $successCount = 0;
        $rows = $request->input('rows');
        $rules = StoreHistorisRequest::validationRules();

        // Tahap 1: Validasi semua baris SEBELUM insert apapun ke DB
        foreach ($rows as $index => $row) {
            $validator = \Illuminate\Support\Facades\Validator::make($row, $rules);

            if ($validator->fails()) {
                $rowNum = $index + 1;
                $errors = implode(', ', $validator->errors()->all());
                return back()->withErrors([
                    'rows' => "Baris ke-{$rowNum} gagal validasi: {$errors}"
                ]);
            }
        }

        // Tahap 2: Semua valid — simpan dalam satu transaksi besar
        // Jika baris ke-50 dari 100 gagal, SEMUA 49 sebelumnya di-rollback.
        DB::transaction(function () use ($rows, $request, &$successCount) {
            foreach ($rows as $row) {
                // Default values untuk field opsional yang mungkin tidak ada di data Excel
                $rowClean = array_merge([
                    'is_tahun_saja' => false,
                    'tgl_mulai' => null,
                    'tgl_selesai' => null,
                    'provinsi' => null,
                    'kota_kabupaten' => null,
                    'kecamatan' => null,
                    'kelurahan_desa' => null,
                    'alamat_lengkap' => null,
                    'latitude' => null,
                    'longitude' => null,
                    'total_anggaran' => 0,
                    'dosen_terlibat' => [],
                    'staff_terlibat' => [],
                    'mahasiswa_terlibat' => [],
                    'link_tambahan' => [],
                ], $row);

                $this->processInjection($rowClean, $request->user());
                $successCount++;
            }
        });

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
        // NOTE: No DB::transaction here — callers (storeManual, storeExcel) handle transactions.
        $tglMulai = $validated['tgl_mulai'] ?? null;
        $safeDate = empty($tglMulai) ? now() : $tglMulai . ' 00:00:00';
        try {
            \Carbon\Carbon::parse($safeDate);
            $createdDate = $safeDate;
        } catch (\Exception $e) {
            $createdDate = now();
        }

        // Find Ketua Tim to link Pengajuan to their account if possible
        $ketuaTim = $validated['ketua_tim'] ?? null;
        $pegawaiKetua = null;
        if (!empty($ketuaTim)) {
            $pegawaiKetua = $this->findPegawaiByName($ketuaTim);
        }

        $pengajuanUserId = $adminUser->id_user;
        $namaPengusul = 'Superadmin (Import Historis)';

        if ($pegawaiKetua) {
            $namaPengusul = $pegawaiKetua->nama_pegawai;
            if ($pegawaiKetua->id_user) {
                $pengajuanUserId = $pegawaiKetua->id_user;
            }
        } elseif (!empty($ketuaTim)) {
            $namaPengusul = $ketuaTim;
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
                // BUG FIX: was hardcoded 'Superadmin (Import Historis)' — now uses resolved ketua tim name
                'id_user'        => $pengajuanUserId,
                'kode_unik'      => strtoupper(Str::random(10)),
                'judul_kegiatan' => $validated['judul_kegiatan'],
                'id_jenis_pkm'   => $validated['id_jenis_pkm'],
                'nama_pengusul'  => $namaPengusul,
                'tipe_pengusul'  => $validated['tipe_pengusul'] ?? 'dosen',
                'kebutuhan'      => $validated['kebutuhan'] ?? null,
                
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
                'status_pengajuan' => 'selesai',
                'created_at' => $createdDate,
                'updated_at' => $createdDate,
            ]);

        // 2. Create Aktivitas (Status: Selesai)
        $aktivitas = Aktivitas::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'judul_pkm' => $validated['judul_kegiatan'] ?? '',
            'tgl_mulai' => $validated['tgl_mulai'] ?? null,
            'tgl_selesai' => $validated['tgl_selesai'] ?? null,
            'provinsi' => $validated['provinsi'] ?? null,
            'kota_kabupaten' => $validated['kota_kabupaten'] ?? null,
            'kecamatan' => $validated['kecamatan'] ?? null,
            'kelurahan_desa' => $validated['kelurahan_desa'] ?? null,
            'alamat_lengkap' => $validated['alamat_lengkap'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'total_anggaran' => $validated['total_anggaran'] ?? 0,
            'status_pelaksanaan' => 'selesai',
            'catatan_pelaksanaan' => 'Selesai (Impor Historis)',
            'created_at' => $createdDate,
            'updated_at' => $createdDate,
        ]);

        // Assign Jenis PKM via pivot
        DB::table('aktivitas_jenis_pkm')->insert([
            'id_aktivitas' => $aktivitas->id_aktivitas,
            'id_jenis_pkm' => $validated['id_jenis_pkm'] ?? null,
            'created_at' => $createdDate,
            'updated_at' => $createdDate,
        ]);

        // 3. Create Tim Kegiatan
        $timRecords = [];
        
        // Ketua
        $ketuaTim = $validated['ketua_tim'] ?? null;
        if (!empty($ketuaTim)) {
            $pegawai = $this->findPegawaiByName($ketuaTim);
            $timRecords[] = [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'id_pegawai' => $pegawai ? $pegawai->id_pegawai : null,
                'nama_mahasiswa' => !$pegawai ? $ketuaTim : null,
                'peran_tim' => 'ketua',
                'created_at' => $createdDate,
                'updated_at' => $createdDate,
            ];
        }

        $dosenTerlibat = $validated['dosen_terlibat'] ?? [];
        if (!empty($dosenTerlibat)) {
            foreach ($dosenTerlibat as $dosen) {
                if (!$dosen) continue;
                $peg = $this->findPegawaiByName($dosen);
                $timRecords[] = [
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'id_pegawai' => $peg ? $peg->id_pegawai : null,
                    'nama_mahasiswa' => !$peg ? $dosen : null,
                    'peran_tim' => 'anggota_dosen',
                    'created_at' => $createdDate,
                    'updated_at' => $createdDate,
                ];
            }
        }

        $staffTerlibat = $validated['staff_terlibat'] ?? [];
        if (!empty($staffTerlibat)) {
            foreach ($staffTerlibat as $staff) {
                if (!$staff) continue;
                $peg = $this->findPegawaiByName($staff);
                $timRecords[] = [
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'id_pegawai' => $peg ? $peg->id_pegawai : null,
                    'nama_mahasiswa' => !$peg ? $staff : null,
                    'peran_tim' => 'anggota_staff',
                    'created_at' => $createdDate,
                    'updated_at' => $createdDate,
                ];
            }
        }

        $mahasiswaTerlibat = $validated['mahasiswa_terlibat'] ?? [];
        if (!empty($mahasiswaTerlibat)) {
            foreach ($mahasiswaTerlibat as $mhs) {
                if (!$mhs) continue;
                $timRecords[] = [
                    'id_aktivitas' => $aktivitas->id_aktivitas,
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

        // 4. Testimoni (if any) — use DB::table to preserve historical timestamps
        $testimoniLink = $validated['testimoni_link'] ?? null;
        if (!empty($testimoniLink)) {
            DB::table('testimoni')->insert([
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'nama_pemberi' => ($validated['testimoni_nama'] ?? null) ?: 'Tester/Eksternal',
                'rating' => 5,
                'pesan_ulasan' => $testimoniLink,
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

        $linkLaporanAkhir = $validated['link_laporan_akhir'] ?? null;
        if (!empty($linkLaporanAkhir)) {
            $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => 'Laporan Akhir', 'jenis_arsip' => 'laporan_akhir', 'url_dokumen' => $linkLaporanAkhir]);
        }
        $linkDokumentasi = $validated['link_dokumentasi'] ?? null;
        if (!empty($linkDokumentasi)) {
            $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => 'Dokumentasi PKM', 'jenis_arsip' => 'foto_kegiatan', 'url_dokumen' => $linkDokumentasi]);
        }

        $linkTambahan = $validated['link_tambahan'] ?? [];
        if (!empty($linkTambahan)) {
            foreach ($linkTambahan as $tambahan) {
                if (empty($tambahan['url'])) continue;
                $n = empty($tambahan['nama']) ? 'Dokumen Lain' : $tambahan['nama'];
                $arsipData[] = array_merge($baseArsip, ['nama_dokumen' => $n, 'jenis_arsip' => 'dokumen_lain', 'url_dokumen' => $tambahan['url']]);
            }
        }

        if (!empty($arsipData)) {
            Arsip::insert($arsipData);
        }
    }
}
