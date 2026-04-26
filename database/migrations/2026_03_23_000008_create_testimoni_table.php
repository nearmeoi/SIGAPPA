<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimoni', function (Blueprint $table) {
            $table->id('id_testimoni');
            $table->foreignId('id_aktivitas')->constrained('aktivitas', 'id_aktivitas')->onDelete('cascade');
            $table->string('nama_pemberi');
            $table->unsignedSmallInteger('rating')->default(5);
            $table->text('pesan_ulasan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimoni');
    }
};
