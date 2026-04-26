<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->string('tipe_pengusul', 30)->nullable()->after('id_jenis_pkm');
            $table->string('nama_pengusul')->nullable()->after('judul_kegiatan');
            $table->string('email_pengusul')->nullable()->after('nama_pengusul');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn(['tipe_pengusul', 'nama_pengusul', 'email_pengusul']);
        });
    }
};
