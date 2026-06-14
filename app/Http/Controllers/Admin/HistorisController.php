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
            
            $rows = [];
            $isFirstRow = true;

            $jenisPkmMapping = JenisPkm::all();

            foreach ($worksheet->getRowIterator() as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);

                $rowData = [];
                foreach ($cellIterator as $cell) {
                    $rowData[] = $cell->getValue();
                }

                if ($isFirstRow) {
                    $isFirstRow = false;
                    continue;
                }
                
                if (empty(trim($rowData[0] ?? '')) && empty(trim($rowData[1] ?? ''))) {
                    continue;
                }

                $strJenis = trim($rowData[2] ?? '');
                $matchedJenis = $jenisPkmMapping->first(function($item) use ($strJenis) {
                    return stripos($item->nama_jenis, $strJenis) !== false;
                });

                // Split helpers
                $splitNames = function($str) {
                    return collect(preg_split('/[,|;]/', $str))->map(fn($item) => trim($item))->filter()->values()->toArray();
                };

                $dosenList = $splitNames($rowData[6] ?? '');
                $staffList = $splitNames($rowData[7] ?? '');
                $mhsList = $splitNames($rowData[8] ?? '');

                $tahunRaw = trim($rowData[0] ?? '');
                $tahun = is_numeric($tahunRaw) ? (int) $tahunRaw : 0;

                $rows[] = [
                    'id' => uniqid(),
                    // Flattened struct similar to what manual uses
                    'judul_kegiatan' => trim($rowData[1] ?? ''),
                    'id_jenis_pkm' => $matchedJenis ? $matchedJenis->id_jenis_pkm : ($jenisPkmMapping->first()->id_jenis_pkm ?? ''),
                    
                    'tgl_mulai' => $tahun > 1900 ? $tahun . '-01-01' : '',
                    'tgl_selesai' => $tahun > 1900 ? $tahun . '-12-31' : '',
                    'is_tahun_saja' => $tahun > 1900,

                    'ketua_tim' => trim($rowData[5] ?? ''),
                    'dosen_terlibat' => empty($dosenList) ? [''] : $dosenList,
                    'staff_terlibat' => empty($staffList) ? [''] : $staffList,
                    'mahasiswa_terlibat' => empty($mhsList) ? [''] : $mhsList,

                    'provinsi' => trim($rowData[12] ?? ''),
                    'kota_kabupaten' => trim($rowData[11] ?? ''),
                    'kecamatan' => trim($rowData[10] ?? ''),
                    'kelurahan_desa' => trim($rowData[9] ?? ''),
                    'alamat_lengkap' => trim($rowData[9] ?? '') . ', ' . trim($rowData[10] ?? '') . ', ' . trim($rowData[11] ?? '') . ', ' . trim($rowData[12] ?? ''),
                    'latitude' => null,
                    'longitude' => null,

                    // Rab & Funding
                    'total_anggaran' => (function($val) {
                        $clean = str_ireplace(['Rp', ' '], '', trim($val));
                        $clean = preg_replace('/[,.]00$/', '', $clean);
                        if (strpos($clean, '.') !== false && strpos($clean, ',') !== false) {
                            $clean = str_replace('.', '', $clean);
                            $clean = str_replace(',', '.', $clean);
                        } elseif (strpos($clean, '.') !== false) {
                            if (substr_count($clean, '.') > 1 || preg_match('/\.\d{3}/', $clean)) {
                                $clean = str_replace('.', '', $clean);
                            }
                        } elseif (strpos($clean, ',') !== false) {
                            if (substr_count($clean, ',') > 1 || preg_match('/,\d{3}/', $clean)) {
                                $clean = str_replace(',', '', $clean);
                            } else {
                                $clean = str_replace(',', '.', $clean);
                            }
                        }
                        return (float) $clean;
                    })($rowData[14] ?? ''),
                    'dana_perguruan_tinggi' => 0,
                    'dana_pemerintah' => 0,
                    'dana_lembaga_dalam' => 0,
                    'dana_lembaga_luar' => 0,
                    'testimoni_link' => trim($rowData[15] ?? ''),
                    'testimoni_nama' => !empty(trim($rowData[15] ?? '')) ? 'Testimoni Eksternal' : '',

                    // Arsip
                    'link_laporan_akhir' => trim($rowData[17] ?? ''),
                    'link_dokumentasi' => trim($rowData[18] ?? ''),
                    'link_tambahan' => !empty(trim($rowData[13] ?? '')) ? [
                        ['nama' => 'Link RAB (Opsional)', 'url' => trim($rowData[13] ?? '')]
                    ] : [],
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

    // -------------------------------------------------------------------------
    // Private: Core Injection Logic
    // -------------------------------------------------------------------------

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

        // 1. Create Pengajuan (Status: Selesai)
        $pengajuan = Pengajuan::create([
            'id_user' => $pengajuanUserId,
            'kode_unik' => strtoupper(Str::random(10)),
            'nama_pengusul' => $namaPengusul,
            'tipe_pengusul' => 'dosen',
            
            'is_tahun_saja' => !empty($validated['is_tahun_saja']) ? 1 : 0,

            'status_pengajuan' => 'selesai',
            'catatan_admin' => 'Data Historis (Migrasi Otomatis)',
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
