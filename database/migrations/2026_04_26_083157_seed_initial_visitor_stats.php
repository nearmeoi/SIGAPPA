<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Suntik data untuk 30 hari (sekitar 1000 data)
        for ($i = 0; $i < 900; $i++) {
            DB::table('site_visits')->insert([
                'ip_address' => '10.0.0.' . rand(1, 254),
                'visited_at' => now()->subDays(rand(8, 30)),
                'page_path' => '/',
            ]);
        }

        // 2. Suntik data untuk 7 hari terakhir (sekitar 100 data)
        for ($i = 0; $i < 60; $i++) {
            DB::table('site_visits')->insert([
                'ip_address' => '192.168.1.' . rand(1, 254),
                'visited_at' => now()->subDays(rand(1, 7)),
                'page_path' => '/',
            ]);
        }

        // 3. Suntik data untuk hari ini (42 views, 21 visitors)
        for ($i = 1; $i <= 42; $i++) {
            DB::table('site_visits')->insert([
                // Gunakan IP yang sama setiap 2 data agar visitor = 21 (42/2)
                'ip_address' => '172.16.0.' . ceil($i / 2),
                'visited_at' => now(),
                'page_path' => '/',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
