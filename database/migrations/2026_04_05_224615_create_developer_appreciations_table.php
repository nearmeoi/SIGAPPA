<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('developer_appreciations', function (Blueprint $table) {
            $table->id('id_developer');
            $table->string('nama');
            $table->string('peran')->nullable();
            $table->string('asal_instansi')->nullable();
            $table->text('foto')->nullable();
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('developer_appreciations');
    }
};
