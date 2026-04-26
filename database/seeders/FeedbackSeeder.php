<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EvaluasiSistem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kosongkan tabel feedback terlebih dahulu jika ingin fresh
        // DB::table('evaluasi_sistem')->truncate();

        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->info('Tidak ada user terdaftar. Silakan jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $feedbacks = [
            [
                'q1' => 5, 'q2' => 4, 'q3' => 5, 'q4' => 4, 'q5' => 5,
                'masukan' => 'Sistem informasi ini sangat membantu dalam memantau kegiatan PKM di berbagai wilayah. Tampilan petanya sangat informatif dan mudah digunakan.'
            ],
            [
                'q1' => 4, 'q2' => 5, 'q3' => 4, 'q4' => 5, 'q5' => 4,
                'masukan' => 'Proses pengajuan menjadi jauh lebih transparan dan cepat. Terima kasih Poltekpar Makassar atas inovasi digitalnya!'
            ],
            [
                'q1' => 5, 'q2' => 5, 'q3' => 5, 'q4' => 5, 'q5' => 5,
                'masukan' => 'Navigasi website sangat intuitif. Sebagai masyarakat umum, saya merasa sangat dimudahkan untuk mengakses informasi pengabdian masyarakat.'
            ],
            [
                'q1' => 4, 'q2' => 4, 'q3' => 5, 'q4' => 4, 'q5' => 4,
                'masukan' => 'Data statistik dan grafik yang disajikan sangat lengkap. Sangat berguna untuk keperluan riset dan pengembangan wilayah.'
            ],
            [
                'q1' => 5, 'q2' => 4, 'q3' => 4, 'q4' => 5, 'q5' => 5,
                'masukan' => 'Fitur WebGIS-nya keren sekali! Kita bisa melihat langsung sebaran dampak PKM di peta secara real-time.'
            ],
        ];

        foreach ($users as $index => $user) {
            // Ambil salah satu feedback secara acak atau berurutan
            $feedbackData = $feedbacks[$index % count($feedbacks)];

            EvaluasiSistem::create([
                'nama' => $user->name,
                'asal_instansi' => $user->role === 'admin' ? 'Poltekpar Makassar' : 'Masyarakat / Stakeholder',
                'no_telp' => '0812' . rand(1000000, 9999999),
                'q1' => $feedbackData['q1'],
                'q2' => $feedbackData['q2'],
                'q3' => $feedbackData['q3'],
                'q4' => $feedbackData['q4'],
                'q5' => $feedbackData['q5'],
                'masukan' => $feedbackData['masukan'],
            ]);

            // Batasi agar tidak terlalu banyak, misal maksimal 10
            if ($index >= 9) break;
        }

        $this->command->info('Berhasil menanamkan data Feedback dari user terdaftar.');
    }
}
