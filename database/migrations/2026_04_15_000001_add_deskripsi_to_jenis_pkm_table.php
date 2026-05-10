<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('jenis_pkm', 'deskripsi')) {
            return;
        }

        Schema::table('jenis_pkm', function (Blueprint $table) {
            $table->text('deskripsi')->nullable()->after('warna_icon');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('jenis_pkm', 'deskripsi')) {
            return;
        }

        Schema::table('jenis_pkm', function (Blueprint $table) {
            $table->dropColumn('deskripsi');
        });
    }
};
