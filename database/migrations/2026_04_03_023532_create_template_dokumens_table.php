<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('template_dokumens', function (Blueprint $table) {
            $table->id();
            $table->string('jenis')->unique()->comment('Contoh: surat_pengajuan, proposal');
            $table->string('nama_file');
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_dokumens');
    }
};
