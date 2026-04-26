<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_logs', function (Blueprint $table) {
            $table->index('id_pengajuan');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_logs', function (Blueprint $table) {
            $table->dropIndex(['id_pengajuan']);
        });
    }
};
