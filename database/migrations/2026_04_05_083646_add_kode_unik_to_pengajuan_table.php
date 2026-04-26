<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->string('kode_unik', 32)->nullable()->unique()->after('id_pengajuan');
        });

        // Set up unique codes for existing rows
        $pengajuans = DB::table('pengajuan')->get();
        foreach ($pengajuans as $pengajuan) {
            DB::table('pengajuan')
                ->where('id_pengajuan', $pengajuan->id_pengajuan)
                ->update(['kode_unik' => Str::random(12)]);
        }

        Schema::table('pengajuan', function (Blueprint $table) {
            $table->string('kode_unik', 32)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn('kode_unik');
        });
    }
};
