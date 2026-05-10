<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair imported/older databases that are missing columns used by the app.
     */
    public function up(): void
    {
        if (! Schema::hasTable('pengajuan')) {
            return;
        }

        Schema::table('pengajuan', function (Blueprint $table) {
            if (! Schema::hasColumn('pengajuan', 'id_jenis_pkm')) {
                $table->foreignId('id_jenis_pkm')->nullable()->index();
            }

            if (! Schema::hasColumn('pengajuan', 'judul_kegiatan')) {
                $table->string('judul_kegiatan')->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'rab')) {
                $table->string('rab')->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'rab_items')) {
                $table->json('rab_items')->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'sumber_dana')) {
                $table->string('sumber_dana')->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'total_anggaran')) {
                $table->decimal('total_anggaran', 15, 2)->default(0);
            }

            if (! Schema::hasColumn('pengajuan', 'dana_perguruan_tinggi')) {
                $table->decimal('dana_perguruan_tinggi', 15, 2)->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'dana_pemerintah')) {
                $table->decimal('dana_pemerintah', 15, 2)->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'dana_lembaga_dalam')) {
                $table->decimal('dana_lembaga_dalam', 15, 2)->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'dana_lembaga_luar')) {
                $table->decimal('dana_lembaga_luar', 15, 2)->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'tgl_mulai')) {
                $table->date('tgl_mulai')->nullable();
            }

            if (! Schema::hasColumn('pengajuan', 'tgl_selesai')) {
                $table->date('tgl_selesai')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Repair migration: do not remove core application columns on rollback.
    }
};
