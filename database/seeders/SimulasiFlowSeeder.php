<?php

namespace Database\Seeders;

use App\Models\Aktivitas;
use App\Models\Arsip;
use App\Models\JenisPkm;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\TimKegiatan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SimulasiFlowSeeder extends Seeder
{
    public function run()
    {
        // 1. Ambil atau Buat User Dosen/Pemohon
        $user = User::firstOrCreate(
            ['email' => 'dosen@poltekpar.ac.id'],
            [
                'name' => 'Dr. Andi Pemohon',
                'password' => Hash::make('password'),
                'role' => 'dosen',
            ]
        );

        // 2. Ambil Master Data
        $jenisPkm = JenisPkm::firstOrCreate(['nama_jenis' => 'Pemberdayaan Masyarakat']);

        $usersPemohon = [$user];
        for ($i = 2; $i <= 5; $i++) {
            $usersPemohon[] = User::firstOrCreate(
                ['email' => "dosen$i@poltekpar.ac.id"],
                ['name' => "Dosen Pemohon $i", 'password' => Hash::make('password'), 'role' => 'dosen']
            );
        }

        // 2. Ambil Master Data
        $jenisList = [
            'Pemberdayaan Masyarakat',
            'Pelatihan & Workshop',
            'Pengembangan Desa Wisata',
            'Pendampingan UMKM',
            'Sertifikasi & Standarisasi',
            'Riset Terapan Masyarakat',
        ];

        $jenisPkms = [];
        foreach ($jenisList as $j) {
            $jenisPkms[] = JenisPkm::firstOrCreate(['nama_jenis' => $j]);
        }

        $userPegawai1 = User::firstOrCreate(
            ['email' => 'bsantoso@poltekpar.ac.id'],
            ['name' => 'Budi Santoso, S.ST., M.Par', 'password' => Hash::make('password'), 'role' => 'admin']
        );
        $pegawai1 = Pegawai::firstOrCreate(['nip' => '198001012005011001'], ['id_user' => $userPegawai1->id_user, 'nama_pegawai' => 'Budi Santoso, S.ST., M.Par']);

        $userPegawai2 = User::firstOrCreate(
            ['email' => 'saminah@poltekpar.ac.id'],
            ['name' => 'Dr. Siti Aminah', 'password' => Hash::make('password'), 'role' => 'admin']
        );
        $pegawai2 = Pegawai::firstOrCreate(['nip' => '198502022010012002'], ['id_user' => $userPegawai2->id_user, 'nama_pegawai' => 'Dr. Siti Aminah']);

        $pegawais = [$pegawai1, $pegawai2];

        // 3. Buat Data Simulasi (Siklus Pengajuan 5 Tahun Terakhir)
        // Koordinat area timur/tengah sesuai sebaran di map ref
        $statusEnum = ['diproses', 'direvisi', 'ditolak', 'diterima'];

        $lokasiList = [
            ['prov' => 'Sulawesi Selatan', 'kota' => 'Makassar', 'kec' => 'Tamalanrea', 'kel' => 'Bira', 'lat' => -5.1350, 'lng' => 119.4950],
            ['prov' => 'Sulawesi Selatan', 'kota' => 'Maros', 'kec' => 'Bantimurung', 'kel' => 'Kalabbirang', 'lat' => -5.0116, 'lng' => 119.6644],
            ['prov' => 'Papua Barat', 'kota' => 'Sorong', 'kec' => 'Sorong Timur', 'kel' => 'Klablim', 'lat' => -0.8814, 'lng' => 131.2936],
            ['prov' => 'Sulawesi Utara', 'kota' => 'Manado', 'kec' => 'Bunaken', 'kel' => 'Bunaken', 'lat' => 1.6262, 'lng' => 124.7584],
            ['prov' => 'Sulawesi Selatan', 'kota' => 'Tana Toraja', 'kec' => 'Makale', 'kel' => 'Bombongan', 'lat' => -3.1030, 'lng' => 119.8660],
            ['prov' => 'Sulawesi Selatan', 'kota' => 'Toraja Utara', 'kec' => 'Kesu', 'kel' => 'Ke\'te Kesu', 'lat' => -2.9984, 'lng' => 119.8943],
            ['prov' => 'Maluku', 'kota' => 'Ambon', 'kec' => 'Sirimau', 'kel' => 'Batu Merah', 'lat' => -3.6943, 'lng' => 128.1818],
            ['prov' => 'Sulawesi Tenggara', 'kota' => 'Wakatobi', 'kec' => 'Wangi-Wangi', 'kel' => 'Wanci', 'lat' => -5.3216, 'lng' => 123.5350],
            ['prov' => 'Gorontalo', 'kota' => 'Gorontalo', 'kec' => 'Kota Selatan', 'kel' => 'Biawao', 'lat' => 0.5404, 'lng' => 123.0645],
            ['prov' => 'Gorontalo', 'kota' => 'Pohuwato', 'kec' => 'Marisa', 'kel' => 'Marisa Utara', 'lat' => 0.4566, 'lng' => 121.9427],
            ['prov' => 'Sulawesi Tengah', 'kota' => 'Palu', 'kec' => 'Mantikore', 'kel' => 'Tanamodindi', 'lat' => -0.8986, 'lng' => 119.8821],
            ['prov' => 'Sulawesi Tengah', 'kota' => 'Poso', 'kec' => 'Poso Kota', 'kel' => 'Kayamanya', 'lat' => -1.3963, 'lng' => 120.7516],
            ['prov' => 'Nusa Tenggara Barat', 'kota' => 'Lombok Tengah', 'kec' => 'Pujut', 'kel' => 'Kuta', 'lat' => -8.8920, 'lng' => 116.2796],
            ['prov' => 'Nusa Tenggara Timur', 'kota' => 'Manggarai Barat', 'kec' => 'Komodo', 'kel' => 'Labuan Bajo', 'lat' => -8.4847, 'lng' => 119.8809],
        ];

        for ($i = 1; $i <= 35; $i++) {
            $tahun = rand(2021, 2026);
            $bulan = rand(1, 12);
            $hari = rand(1, 28);

            $created_at = Carbon::create($tahun, $bulan, $hari, rand(8, 16), rand(0, 59), 0);

            $u = $usersPemohon[array_rand($usersPemohon)];
            $j = $jenisPkms[array_rand($jenisPkms)];

            $is_selesai = false;
            // Randomize status based on year (older more likely to be diterima and selesai)
            if ($tahun < 2024) {
                $status = (rand(1, 10) > 2) ? 'diterima' : 'ditolak';
                $is_selesai = ($status === 'diterima');
            } elseif ($tahun == 2024 || $tahun == 2025) {
                $status = (rand(1, 10) > 3) ? 'diterima' : (rand(1, 2) == 1 ? 'diproses' : 'ditolak');
                $is_selesai = ($status === 'diterima' && rand(1, 10) > 3);
            } else {
                $status = $statusEnum[array_rand($statusEnum)];
            }

            $lokasi = $lokasiList[array_rand($lokasiList)];

            // slight randomization on coordinates to scatter pins nicely
            $lat = $lokasi['lat'] + (rand(-150, 150) / 1000);
            $lng = $lokasi['lng'] + (rand(-150, 150) / 1000);

            $pengajuan = Pengajuan::create([
                'id_user' => $u->id_user,
                'id_jenis_pkm' => $j->id_jenis_pkm,
                'provinsi' => $lokasi['prov'],
                'kota_kabupaten' => $lokasi['kota'],
                'kecamatan' => $lokasi['kec'],
                'kelurahan_desa' => $lokasi['kel'],
                'alamat_lengkap' => "Desa {$lokasi['kel']}, Kec. {$lokasi['kec']}, Kab. {$lokasi['kota']}",
                'latitude' => $lat,
                'longitude' => $lng,
                'judul_kegiatan' => 'Program '.$j->nama_jenis.' di '.$lokasi['kota']." #$i",
                'instansi_mitra' => 'Mitra Lokal '.$lokasi['kel'],
                'sumber_dana' => rand(1, 3) == 1 ? 'Mandiri' : 'DIPA Poltekpar',
                'total_anggaran' => rand(5, 50) * 1000000,
                'kebutuhan' => 'Kebutuhan standar program pemberdayaan dan pengembangan.',
                'status_pengajuan' => $status,
                'tgl_mulai' => (clone $created_at)->addDays(14)->format('Y-m-d'),
                'tgl_selesai' => (clone $created_at)->addDays(20)->format('Y-m-d'),
                'created_at' => $created_at,
                'updated_at' => (clone $created_at)->addDays(rand(1, 10)),
                'proposal' => ($status != 'direvisi') ? "https://p3m.poltekparmakassar.ac.id/sample/proposal-$i.pdf" : null,
                'rab' => "https://p3m.poltekparmakassar.ac.id/sample/rab-$i.pdf",
                'catatan_admin' => in_array($status, ['direvisi', 'ditolak']) ? 'Ada revisi administrasi atau penolakan karena bukan skema PKM yang tepat.' : null,
            ]);

            if ($status === 'diterima') {
                $p = $pegawais[array_rand($pegawais)];
                TimKegiatan::create(['id_pengajuan' => $pengajuan->id_pengajuan, 'id_pegawai' => $p->id_pegawai, 'peran_tim' => 'Ketua', 'created_at' => $created_at, 'updated_at' => $created_at]);
                TimKegiatan::create(['id_pengajuan' => $pengajuan->id_pengajuan, 'nama_mahasiswa' => "Mahasiswa PKM $i", 'peran_tim' => 'Anggota (Mhs)', 'created_at' => $created_at, 'updated_at' => $created_at]);

                Aktivitas::create([
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'status_pelaksanaan' => $is_selesai ? 'selesai' : 'berjalan',
                    'catatan_pelaksanaan' => 'Pelaksanaan aktivitas berjalan dengan baik dan sesuai linimasa pengerjaan harian.',
                    'created_at' => (clone $created_at)->addDays(15),
                    'updated_at' => (clone $created_at)->addDays(15),
                ]);

                if ($is_selesai) {
                    Arsip::create([
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'nama_dokumen' => 'Laporan Akhir (LPJ)',
                        'jenis_arsip' => 'Laporan',
                        'url_dokumen' => '#lpj',
                        'created_at' => (clone $created_at)->addDays(21),
                        'updated_at' => (clone $created_at)->addDays(21),
                    ]);
                    Arsip::create([
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'nama_dokumen' => 'Sertifikat & Dokumentasi Foto',
                        'jenis_arsip' => 'Sertifikat',
                        'url_dokumen' => '#foto',
                        'created_at' => (clone $created_at)->addDays(22),
                        'updated_at' => (clone $created_at)->addDays(22),
                    ]);
                }
            }
        }
    }
}
