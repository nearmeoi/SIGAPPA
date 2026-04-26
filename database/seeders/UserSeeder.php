<?php

namespace Database\Seeders;

use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    private const DUMMY_DOSEN_PASSWORD = 'Dosen#2026';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Akun Admin
        User::updateOrCreate(
            ['email' => 'admin@poltekparmakassar.ac.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'), // default password: password
                'role' => 'admin',
            ]
        );

        // 2. Akun Dosen (Pegawai)
        $dosenUser = User::updateOrCreate(
            ['email' => 'dosen@poltekpar.ac.id'],
            [
                'name' => 'Budi Dosen',
                'password' => Hash::make('password'),
                'role' => 'dosen', // Role diubah menjadi dosen
            ]
        );

        Pegawai::updateOrCreate(
            ['nip' => '198001012005011001'],
            [
                'id_user' => $dosenUser->id_user, // pakai id_user karena primary key nya beda
                'nama_pegawai' => 'Budi Dosen, M.Pd.',
                'jabatan' => 'Dosen',
                'posisi' => 'Dosen Tetap',
            ]
        );

        $dummyDosenAccounts = [
            [
                'name' => 'Dr. Rina Puspitasari, M.Par.',
                'email' => 'rina.puspitasari@poltekparmakassar.ac.id',
                'nip' => '197803122005012001',
                'jabatan' => 'Dosen',
                'posisi' => 'Dosen Tetap',
            ],
            [
                'name' => 'Andi Saputra, S.ST.Par., M.M.',
                'email' => 'andi.saputra@poltekparmakassar.ac.id',
                'nip' => '198104252008011002',
                'jabatan' => 'Dosen',
                'posisi' => 'Koordinator Prodi',
            ],
            [
                'name' => 'Nur Aisyah, M.Tr.Par.',
                'email' => 'nur.aisyah@poltekparmakassar.ac.id',
                'nip' => '198611032011012003',
                'jabatan' => 'Dosen',
                'posisi' => 'Dosen Tetap',
            ],
            [
                'name' => 'Fadli Rahman, S.Pd., M.Pd.',
                'email' => 'fadli.rahman@poltekparmakassar.ac.id',
                'nip' => '199002142015041004',
                'jabatan' => 'Dosen',
                'posisi' => 'Sekretaris Jurusan',
            ],
            [
                'name' => 'Maya Kartika, S.ST.Par., M.Sc.',
                'email' => 'maya.kartika@poltekparmakassar.ac.id',
                'nip' => '199307182018092005',
                'jabatan' => 'Dosen',
                'posisi' => 'Dosen Praktisi',
            ],
        ];

        foreach ($dummyDosenAccounts as $account) {
            $user = User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make(self::DUMMY_DOSEN_PASSWORD),
                    'role' => 'dosen',
                ]
            );

            Pegawai::updateOrCreate(
                ['nip' => $account['nip']],
                [
                    'id_user' => $user->id_user,
                    'nama_pegawai' => $account['name'],
                    'jabatan' => $account['jabatan'],
                    'posisi' => $account['posisi'],
                ]
            );
        }

        // 3. Akun Masyarakat
        User::updateOrCreate(
            ['email' => 'masyarakat@example.com'],
            [
                'name' => 'Warga Masyarakat',
                'password' => Hash::make('password'),
                'role' => 'masyarakat', // Role diubah menjadi masyarakat
            ]
        );
    }
}
