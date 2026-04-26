<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * TimKegiatan sebelumnya di-delete permanent saat pengajuan di-soft-delete.
     * Dengan kolom deleted_at, data tim bisa di-restore bersama pengajuan.
     */
    public function up(): void
    {
        Schema::table('tim_kegiatan', function (Blueprint $table) {
            $table->softDeletes(); // menambahkan kolom deleted_at nullable
        });
    }

    public function down(): void
    {
        Schema::table('tim_kegiatan', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
