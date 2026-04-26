<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah updated_at ke tabel pengajuan
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });

        // 2. Selaraskan nilai status default ke 'diproses'
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->string('status_pengajuan')->default('diproses')->change();
        });

        // 3. Tambah kolom catatan_admin untuk alasan revisi/penolakan
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->text('catatan_admin')->nullable()->after('status_pengajuan');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn(['updated_at', 'catatan_admin']);
        });
    }
};
