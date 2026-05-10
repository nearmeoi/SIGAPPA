<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Some older/imported databases stored team rows through aktivitas.
     * The current app relates tim_kegiatan directly to pengajuan.
     */
    public function up(): void
    {
        if (! Schema::hasTable('tim_kegiatan')) {
            return;
        }

        if (! Schema::hasColumn('tim_kegiatan', 'id_pengajuan')) {
            Schema::table('tim_kegiatan', function (Blueprint $table) {
                $table->unsignedBigInteger('id_pengajuan')->nullable()->index();
            });
        }

        if (
            Schema::hasColumn('tim_kegiatan', 'id_aktivitas')
            && Schema::hasTable('aktivitas')
            && Schema::hasColumn('aktivitas', 'id_pengajuan')
        ) {
            DB::statement('
                update tim_kegiatan tk
                join aktivitas a on a.id_aktivitas = tk.id_aktivitas
                set tk.id_pengajuan = a.id_pengajuan
                where tk.id_pengajuan is null
            ');
        }
    }

    public function down(): void
    {
        // Repair migration: keep restored relationship data intact.
    }
};
