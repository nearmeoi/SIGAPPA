<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            if (! Schema::hasColumn('pengajuan', 'rab_items')) {
                $table->json('rab_items')->nullable()->after('rab');
            }

            if (! Schema::hasColumn('pengajuan', 'dana_perguruan_tinggi')) {
                $table->decimal('dana_perguruan_tinggi', 15, 2)->nullable()->after('total_anggaran');
            }

            if (! Schema::hasColumn('pengajuan', 'dana_pemerintah')) {
                $table->decimal('dana_pemerintah', 15, 2)->nullable()->after('dana_perguruan_tinggi');
            }

            if (! Schema::hasColumn('pengajuan', 'dana_lembaga_dalam')) {
                $table->decimal('dana_lembaga_dalam', 15, 2)->nullable()->after('dana_pemerintah');
            }

            if (! Schema::hasColumn('pengajuan', 'dana_lembaga_luar')) {
                $table->decimal('dana_lembaga_luar', 15, 2)->nullable()->after('dana_lembaga_dalam');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('pengajuan', 'rab_items') ? 'rab_items' : null,
                Schema::hasColumn('pengajuan', 'dana_perguruan_tinggi') ? 'dana_perguruan_tinggi' : null,
                Schema::hasColumn('pengajuan', 'dana_pemerintah') ? 'dana_pemerintah' : null,
                Schema::hasColumn('pengajuan', 'dana_lembaga_dalam') ? 'dana_lembaga_dalam' : null,
                Schema::hasColumn('pengajuan', 'dana_lembaga_luar') ? 'dana_lembaga_luar' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
