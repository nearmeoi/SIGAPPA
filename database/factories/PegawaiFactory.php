<?php

namespace Database\Factories;

use App\Models\Pegawai;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pegawai>
 */
class PegawaiFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $jabatans = ['Dosen', 'Staf Administrasi', 'Kepala Laboratorium', 'Teknisi', 'Koordinator P3M'];
        $posisis = ['Fungsional Umum', 'Struktural', 'Lektor', 'Asisten Ahli', 'Tenaga Kependidikan'];

        // Format NIP biasanya: TahunLahir BulanLahir TanggalLahir TahunAngkat BulanAngkat JenisKelamin Urutan (18 digit)
        // Kita menggunakan numerify untuk memalsukannya.
        return [
            'id_user' => null,
            'nip' => $this->faker->unique()->numerify('19########200#####'),
            'nama_pegawai' => $this->faker->name . ($this->faker->boolean(60) ? ', S.Par., M.Par.' : ''),
            'jabatan' => $this->faker->randomElement($jabatans),
            'posisi' => $this->faker->randomElement($posisis),
        ];
    }
}
