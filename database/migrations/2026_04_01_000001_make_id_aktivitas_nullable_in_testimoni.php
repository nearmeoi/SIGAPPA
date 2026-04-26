<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Testimoni publik tidak selalu terkait dengan aktivitas tertentu.
     * Sebelumnya id_aktivitas NOT NULL dan hardcoded ke Aktivitas::first()
     * yang bisa menyebabkan FK violation jika database kosong.
     */
    public function up(): void
    {
        Schema::table('testimoni', function (Blueprint $table) {
            // Drop FK constraint dulu, baru ubah kolom jadi nullable
            $table->dropForeign(['id_aktivitas']);
            $table->foreignId('id_aktivitas')
                ->nullable()
                ->change()
                ->constrained('aktivitas', 'id_aktivitas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('testimoni', function (Blueprint $table) {
            $table->dropForeign(['id_aktivitas']);
            $table->foreignId('id_aktivitas')
                ->nullable(false)
                ->change()
                ->constrained('aktivitas', 'id_aktivitas')
                ->onDelete('cascade');
        });
    }
};
