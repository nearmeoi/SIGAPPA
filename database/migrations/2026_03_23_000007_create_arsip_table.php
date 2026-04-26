<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arsip', function (Blueprint $table) {
            $table->id('id_arsip');
            $table->foreignId('id_aktivitas')->constrained('aktivitas', 'id_aktivitas')->onDelete('cascade');
            $table->string('jenis_arsip')->nullable();
            $table->string('url_arsip')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arsip');
    }
};
