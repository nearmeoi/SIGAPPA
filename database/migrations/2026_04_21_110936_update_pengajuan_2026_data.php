<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $mappings = [
            365 => 29, // Bulukumba -> Muhammad Taufi Rachman
            366 => 31, // Gowa -> Nurdianti
            367 => 36, // Barru -> Rahmatiah
            368 => 46, // Tana Toraja -> A Fardani Irawati W
            369 => 33, // Luwu -> Endang Widuri
            370 => 30, // Enrekang -> Suwarningsih
            371 => 42, // Pangkep -> Suriany Sura'
            372 => 44, // Toraja Utara -> Andi Pratiwi Kusuma Ahmadi
            373 => 28, // Bone -> A Patmawati
            374 => 27, // Bantaeng -> Andi Ardy
            375 => 41, // Sidrap -> Muhammad Sofwan Adha
            376 => 40, // Luwu Utara -> Muhammad Rayu
            377 => 37, // Maros -> Nurhaedah
        ];

        foreach ($mappings as $pengajuanId => $userId) {
            $user = DB::table('users')->where('id_user', $userId)->first();
            if ($user) {
                DB::table('pengajuan')->where('id_pengajuan', $pengajuanId)->update([
                    'id_user' => $userId,
                    'nama_pengusul' => $user->name,
                    'email_pengusul' => $user->email,
                    'catatan_admin' => 'Data Historis (Migrasi Otomatis)',
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to Superadmin if needed
        $ids = [365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377];
        DB::table('pengajuan')->whereIn('id_pengajuan', $ids)->update([
            'id_user' => 16,
            'nama_pengusul' => 'Superadmin (Import Historis)',
            'email_pengusul' => null,
        ]);
    }
};
