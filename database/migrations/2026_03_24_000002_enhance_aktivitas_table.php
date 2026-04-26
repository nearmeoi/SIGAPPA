<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            // Kolom untuk tracking realisasi/progress
            $table->text('catatan_pelaksanaan')->nullable()->after('status_pelaksanaan');
            $table->date('tgl_realisasi_mulai')->nullable()->after('url_thumbnail');
            $table->date('tgl_realisasi_selesai')->nullable()->after('tgl_realisasi_mulai');

            // Timestamps manual jika belum ada
            if (! Schema::hasColumn('aktivitas', 'updated_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            $table->dropColumn(['catatan_pelaksanaan', 'tgl_realisasi_mulai', 'tgl_realisasi_selesai']);
        });
    }
};
