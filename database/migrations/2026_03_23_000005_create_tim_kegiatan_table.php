<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tim_kegiatan', function (Blueprint $table) {
            $table->id('id_tim');
            $table->foreignId('id_pengajuan')->constrained('pengajuan', 'id_pengajuan')->onDelete('cascade');
            $table->foreignId('id_pegawai')->nullable()->constrained('pegawai', 'id_pegawai')->onDelete('cascade');
            $table->string('nama_mahasiswa')->nullable();
            $table->string('peran_tim')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tim_kegiatan');
    }
};
