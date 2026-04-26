<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('pengajuan', 'is_tahun_saja')) {
            Schema::table('pengajuan', function (Blueprint $table) {
                $table->boolean('is_tahun_saja')->default(false)->after('tgl_selesai');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pengajuan', 'is_tahun_saja')) {
            Schema::table('pengajuan', function (Blueprint $table) {
                $table->dropColumn('is_tahun_saja');
            });
        }
    }
};
