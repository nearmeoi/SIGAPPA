<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Pindahkan data dari url_arsip ke url_dokumen jika url_dokumen masih kosong
        if (Schema::hasColumn('arsip', 'url_arsip') && Schema::hasColumn('arsip', 'url_dokumen')) {
            DB::table('arsip')
                ->whereNull('url_dokumen')
                ->whereNotNull('url_arsip')
                ->update([
                    'url_dokumen' => DB::raw('url_arsip'),
                ]);
        }

        // 2. Tambahkan SoftDeletes
        Schema::table('arsip', function (Blueprint $table) {
            if (! Schema::hasColumn('arsip', 'deleted_at')) {
                $table->softDeletes();
            }

            // Hapus kolom url_arsip yang duplikat
            if (Schema::hasColumn('arsip', 'url_arsip')) {
                $table->dropColumn('url_arsip');
            }
        });
    }

    public function down(): void
    {
        Schema::table('arsip', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->string('url_arsip')->nullable();
        });
    }
};
