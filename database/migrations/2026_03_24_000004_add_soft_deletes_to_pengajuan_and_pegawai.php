<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom deleted_at (soft delete) ke tabel pengajuan dan pegawai
     * agar data tidak terhapus permanen saat di-delete.
     */
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->softDeletes()->after('catatan_admin');
        });

        Schema::table('pegawai', function (Blueprint $table) {
            $table->softDeletes()->after('status_pegawai');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
