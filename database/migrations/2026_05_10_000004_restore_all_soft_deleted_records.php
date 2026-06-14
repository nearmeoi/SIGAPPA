<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restore all currently soft-deleted application records.
     */
    public function up(): void
    {
        foreach ([
            'aktivitas',
            'arsip',
            'pegawai',
            'pengajuan',
            'tim_kegiatan',
            'users',
        ] as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                DB::table($table)
                    ->whereNotNull('deleted_at')
                    ->update(['deleted_at' => null]);
            }
        }
    }

    public function down(): void
    {
        // Intentionally empty. Restored data should not be re-deleted.
    }
};
