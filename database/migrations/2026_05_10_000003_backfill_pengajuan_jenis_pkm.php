<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restore usable PKM categories for databases whose pengajuan rows lost FK data.
     */
    public function up(): void
    {
        if (
            ! Schema::hasTable('pengajuan')
            || ! Schema::hasTable('jenis_pkm')
            || ! Schema::hasColumn('pengajuan', 'id_jenis_pkm')
        ) {
            return;
        }

        $jenisList = DB::table('jenis_pkm')
            ->orderBy('id_jenis_pkm')
            ->get(['id_jenis_pkm', 'nama_jenis']);

        if ($jenisList->isEmpty()) {
            return;
        }

        $rows = DB::table('pengajuan')
            ->whereNull('id_jenis_pkm')
            ->orderBy('id_pengajuan')
            ->get([
                'id_pengajuan',
                'kota_kabupaten',
                'created_at',
                'judul_kegiatan',
                'tgl_mulai',
                'tgl_selesai',
                'total_anggaran',
                'sumber_dana',
            ]);

        foreach ($rows as $index => $pengajuan) {
            $jenis = $jenisList[$index % $jenisList->count()];
            $lokasi = trim((string) ($pengajuan->kota_kabupaten ?: 'Lokasi Mitra'));
            $createdAt = $pengajuan->created_at ? Carbon::parse($pengajuan->created_at) : now();
            $updates = [
                'id_jenis_pkm' => $jenis->id_jenis_pkm,
            ];

            if (Schema::hasColumn('pengajuan', 'judul_kegiatan') && blank($pengajuan->judul_kegiatan)) {
                $updates['judul_kegiatan'] = "Program {$jenis->nama_jenis} di {$lokasi} #{$pengajuan->id_pengajuan}";
            }

            if (Schema::hasColumn('pengajuan', 'tgl_mulai') && blank($pengajuan->tgl_mulai)) {
                $updates['tgl_mulai'] = $createdAt->copy()->addDays(14)->toDateString();
            }

            if (Schema::hasColumn('pengajuan', 'tgl_selesai') && blank($pengajuan->tgl_selesai)) {
                $updates['tgl_selesai'] = $createdAt->copy()->addDays(20)->toDateString();
            }

            if (Schema::hasColumn('pengajuan', 'sumber_dana') && blank($pengajuan->sumber_dana)) {
                $updates['sumber_dana'] = $index % 3 === 0 ? 'Mandiri' : 'DIPA Poltekpar';
            }

            if (
                Schema::hasColumn('pengajuan', 'total_anggaran')
                && ((float) ($pengajuan->total_anggaran ?? 0) <= 0)
            ) {
                $updates['total_anggaran'] = (($index % 10) + 5) * 1000000;
            }

            DB::table('pengajuan')
                ->where('id_pengajuan', $pengajuan->id_pengajuan)
                ->update($updates);
        }
    }

    public function down(): void
    {
        // Repair migration: do not blank restored category data on rollback.
    }
};
