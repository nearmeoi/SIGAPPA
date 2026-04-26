<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arsip', function (Blueprint $table) {
            // Arsip kini terhubung langsung ke pengajuan (dan opsional ke aktivitas)
            $table->foreignId('id_pengajuan')
                ->nullable()
                ->after('id_arsip')
                ->constrained('pengajuan', 'id_pengajuan')
                ->onDelete('cascade');

            // Buat id_aktivitas jadi opsional
            $table->foreignId('id_aktivitas')
                ->nullable()
                ->change();

            // Tambah kolom baru
            $table->string('nama_dokumen')->nullable()->after('id_aktivitas');
            $table->text('keterangan')->nullable()->after('jenis_arsip');
            $table->string('url_dokumen')->nullable()->after('keterangan');
        });
    }

    public function down(): void
    {
        Schema::table('arsip', function (Blueprint $table) {
            $table->dropForeign(['id_pengajuan']);
            $table->dropColumn(['id_pengajuan', 'nama_dokumen', 'keterangan', 'url_dokumen']);
        });
    }
};
