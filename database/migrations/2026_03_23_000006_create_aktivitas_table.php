<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_pengajuan');
            $table->string('status_pelaksanaan')->default('belum_mulai');
            $table->string('url_thumbnail')->nullable();
            $table->timestamps();

            $table->unique('id_pengajuan');
            $table->foreign('id_pengajuan')->references('id_pengajuan')->on('pengajuan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aktivitas');
    }
};
