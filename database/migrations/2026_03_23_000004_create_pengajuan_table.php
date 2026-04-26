<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan', function (Blueprint $table) {
            $table->id('id_pengajuan');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->foreignId('id_jenis_pkm')->constrained('jenis_pkm', 'id_jenis_pkm')->onDelete('cascade');

            // Address fields (user types free-text, admin pins on map)
            $table->string('provinsi')->nullable();
            $table->string('kota_kabupaten')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kelurahan_desa')->nullable();
            $table->text('alamat_lengkap')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('judul_kegiatan');
            $table->text('kebutuhan')->nullable();
            $table->string('instansi_mitra')->nullable();
            $table->string('proposal')->nullable();
            $table->string('surat_permohonan')->nullable();
            $table->string('rab')->nullable();
            $table->string('sumber_dana')->nullable();
            $table->decimal('total_anggaran', 15, 2)->default(0);
            $table->date('tgl_mulai')->nullable();
            $table->date('tgl_selesai')->nullable();
            $table->string('status_pengajuan')->default('draft')->index();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan');
    }
};
