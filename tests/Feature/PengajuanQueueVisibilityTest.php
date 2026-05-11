<?php

namespace Tests\Feature;

use App\Models\Aktivitas;
use App\Models\JenisPkm;
use App\Models\Pengajuan;
use App\Models\TimKegiatan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengajuanQueueVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_complete_pengajuan_moves_out_of_pengajuan_queue(): void
    {
        $pengajuan = $this->createPengajuan([
            'status_pengajuan' => Pengajuan::STATUS_DITERIMA,
            'direktur_approved_at' => now(),
        ]);
        Aktivitas::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'status_pelaksanaan' => 'belum_mulai',
        ]);
        $this->addCompleteTeam($pengajuan);

        $this->assertFalse(
            Pengajuan::visibleInPengajuanQueue()->whereKey($pengajuan->id_pengajuan)->exists()
        );
    }

    public function test_approved_incomplete_pengajuan_stays_in_pengajuan_queue(): void
    {
        $pengajuan = $this->createPengajuan([
            'status_pengajuan' => Pengajuan::STATUS_DITERIMA,
            'direktur_approved_at' => now(),
            'surat_permohonan' => null,
        ]);
        Aktivitas::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'status_pelaksanaan' => 'berjalan',
        ]);
        $this->addCompleteTeam($pengajuan);

        $this->assertTrue(
            Pengajuan::visibleInPengajuanQueue()->whereKey($pengajuan->id_pengajuan)->exists()
        );
    }

    private function createPengajuan(array $overrides = []): Pengajuan
    {
        $user = User::factory()->create([
            'role' => 'dosen',
            'name' => 'Dosen Pengusul',
            'email' => 'dosen@example.com',
        ]);
        $jenis = JenisPkm::create(['nama_jenis' => 'PKM Test']);

        return Pengajuan::create(array_merge([
            'id_user' => $user->id_user,
            'id_jenis_pkm' => $jenis->id_jenis_pkm,
            'tipe_pengusul' => 'dosen',
            'judul_kegiatan' => 'PKM Lengkap',
            'nama_pengusul' => 'Dosen Pengusul',
            'email_pengusul' => 'dosen@example.com',
            'instansi_mitra' => 'Mitra Test',
            'no_telepon' => '08123456789',
            'kebutuhan' => 'Kebutuhan lengkap',
            'provinsi' => 'Sulawesi Selatan',
            'kota_kabupaten' => 'Makassar',
            'surat_permohonan' => 'surat.pdf',
            'rab_items' => [
                ['nama_item' => 'Transport', 'jumlah' => 1, 'harga' => 100000],
            ],
            'dana_perguruan_tinggi' => 100000,
            'status_pengajuan' => Pengajuan::STATUS_DIPROSES,
        ], $overrides));
    }

    private function addCompleteTeam(Pengajuan $pengajuan): void
    {
        TimKegiatan::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'nama_mahasiswa' => 'Ketua Test',
            'peran_tim' => 'ketua',
        ]);

        TimKegiatan::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'nama_mahasiswa' => 'Anggota Test',
            'peran_tim' => 'anggota_dosen',
        ]);
    }
}
