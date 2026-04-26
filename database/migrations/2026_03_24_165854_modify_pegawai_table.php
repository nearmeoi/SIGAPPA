<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropForeign(['id_user']);
            $table->unsignedBigInteger('id_user')->nullable()->change();
            $table->foreign('id_user')->references('id_user')->on('users')->nullOnDelete();

            $table->dropColumn('status_pegawai');
            $table->string('jabatan')->nullable();
            $table->string('posisi')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropForeign(['id_user']);
            $table->unsignedBigInteger('id_user')->nullable(false)->change();
            $table->foreign('id_user')->references('id_user')->on('users')->cascadeOnDelete();

            $table->string('status_pegawai')->default('aktif');
            $table->dropColumn(['jabatan', 'posisi']);
        });
    }
};
