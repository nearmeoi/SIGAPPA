<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Karena SQLite tidak mendukung alter enum secara native dengan mudah menggunakan drop/add enum,
        // cara paling aman adalah membuat kolom baru, copy data, hapus kolom lama, lalu rename kolom baru.
        // Tapi jika menggunakan doctrine/dbal di Laravel > 10, bisa pakai raw query untuk SQLite.
        // Di sini kita gunakan cara sederhana: tambah kolom role_baru (string), isi data, drop role lama,
        // ganti nama role_baru jadi role.

        Schema::table('users', function (Blueprint $table) {
            $table->string('role_new')->default('masyarakat');
        });

        // Update data: yang tadinya 'user' jadikan 'masyarakat', admin tetap admin
        DB::table('users')->where('role', 'user')->update(['role_new' => 'masyarakat']);
        DB::table('users')->where('role', 'admin')->update(['role_new' => 'admin']);

        // Jika ada user yang terhubung ke tabel pegawai, dia adalah dosen
        $pegawaiUserIds = DB::table('pegawai')->pluck('id_user')->toArray();
        if (! empty($pegawaiUserIds)) {
            DB::table('users')->whereIn('id_user', $pegawaiUserIds)->update(['role_new' => 'dosen']);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('role_new', 'role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback ke admin dan user
        Schema::table('users', function (Blueprint $table) {
            $table->string('role_old')->default('user');
        });

        DB::table('users')->where('role', 'masyarakat')->update(['role_old' => 'user']);
        DB::table('users')->where('role', 'dosen')->update(['role_old' => 'user']);
        DB::table('users')->where('role', 'admin')->update(['role_old' => 'admin']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('role_old', 'role');
        });
    }
};
