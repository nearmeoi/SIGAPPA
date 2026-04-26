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
                    'is_tahun_saja' => $tahun > 1900 ? 1 : 0,

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
                    'total_anggaran' => (float) str_replace(['Rp', '.', ',', ' '], '', trim($rowData[14] ?? '')),
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

            // 1. Create Pengajuan (Status: Selesai)
            $pengajuan = Pengajuan::create([
                'id_user' => $adminUser->id_user,
                'kode_unik' => strtoupper(Str::random(10)),
                'judul_kegiatan' => $validated['judul_kegiatan'],
                'id_jenis_pkm' => $validated['id_jenis_pkm'],
                'nama_pengusul' => 'Superadmin (Import Historis)',
                'tipe_pengusul' => 'dosen',
                
                'tgl_mulai' => $validated['tgl_mulai'] ?? null,
                'tgl_selesai' => $validated['tgl_selesai'] ?? null,
                'is_tahun_saja' => $validated['is_tahun_saja'] ?? 0,

                'provinsi' => $validated['provinsi'] ?? null,
                'kota_kabupaten' => $validated['kota_kabupaten'] ?? null,
                'kecamatan' => $validated['kecamatan'] ?? null,
                'kelurahan_desa' => $validated['kelurahan_desa'] ?? null,
                'alamat_lengkap' => $validated['alamat_lengkap'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,

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
