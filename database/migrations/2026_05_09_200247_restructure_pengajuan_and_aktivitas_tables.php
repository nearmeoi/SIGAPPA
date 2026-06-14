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
        // 1. Buat tabel jenis_sumber_dana
        Schema::create('jenis_sumber_dana', function (Blueprint $table) {
            $table->id('id_sumber_dana');
            $table->string('nama_sumber_dana', 100);
            $table->timestamps();
            $table->softDeletes();
        });

        // Insert default data for jenis_sumber_dana
        DB::table('jenis_sumber_dana')->insert([
            ['nama_sumber_dana' => 'Pemerintah', 'created_at' => now(), 'updated_at' => now()],
            ['nama_sumber_dana' => 'Perguruan Tinggi', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 2. Buat tabel aktivitas_jenis_pkm
        Schema::create('aktivitas_jenis_pkm', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_aktivitas');
            $table->unsignedBigInteger('id_jenis_pkm');
            $table->timestamps();

            $table->foreign('id_aktivitas')->references('id_aktivitas')->on('aktivitas')->onDelete('cascade');
            $table->foreign('id_jenis_pkm')->references('id_jenis_pkm')->on('jenis_pkm')->onDelete('cascade');
        });

        // 3. Modifikasi tabel aktivitas
        Schema::table('aktivitas', function (Blueprint $table) {
            $table->string('judul_pkm')->nullable()->after('status_pelaksanaan');
            $table->date('tgl_mulai')->nullable()->after('judul_pkm');
            $table->date('tgl_selesai')->nullable()->after('tgl_mulai');
            $table->text('rab')->nullable()->after('tgl_selesai');
            $table->json('rab_items')->nullable()->after('rab');
            $table->decimal('total_anggaran', 15, 2)->nullable()->after('rab_items');
            $table->unsignedBigInteger('id_sumber_dana')->nullable()->after('total_anggaran');
            $table->string('provinsi', 100)->nullable()->after('id_sumber_dana');
            $table->string('kota_kabupaten', 100)->nullable()->after('provinsi');
            $table->string('kecamatan', 100)->nullable()->after('kota_kabupaten');
            $table->string('kelurahan_desa', 100)->nullable()->after('kecamatan');
            $table->text('alamat_lengkap')->nullable()->after('kelurahan_desa');
            $table->decimal('latitude', 10, 7)->nullable()->after('alamat_lengkap');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->json('lokasi_tambahan')->nullable()->after('longitude');

            $table->foreign('id_sumber_dana')->references('id_sumber_dana')->on('jenis_sumber_dana')->onDelete('set null');
        });

        // 4. Modifikasi tabel tim_kegiatan
        Schema::table('tim_kegiatan', function (Blueprint $table) {
            // Kita drop foreign key lama
            $table->dropForeign(['id_pengajuan']);
            // Tambahkan kolom baru
            $table->unsignedBigInteger('id_aktivitas')->nullable()->after('id_pengajuan');
            $table->foreign('id_aktivitas')->references('id_aktivitas')->on('aktivitas')->onDelete('cascade');
        });

        // --- DATA MIGRATION START ---
        // Map jenis_sumber_dana dynamically
        $sumberDanaNames = DB::table('pengajuan')->whereNotNull('sumber_dana')->distinct()->pluck('sumber_dana');
        $sumberDanaMap = [];
        // The migration already inserted ID 1 and 2
        $sumberDanaMap['Pemerintah'] = 1;
        $sumberDanaMap['Perguruan Tinggi'] = 2;
        
        foreach ($sumberDanaNames as $name) {
            if (!isset($sumberDanaMap[$name])) {
                $id = DB::table('jenis_sumber_dana')->insertGetId([
                    'nama_sumber_dana' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $sumberDanaMap[$name] = $id;
            }
        }

        $pengajuans = DB::table('pengajuan')->get();
        foreach ($pengajuans as $p) {
            $aktivitas = DB::table('aktivitas')->where('id_pengajuan', $p->id_pengajuan)->first();
            if ($aktivitas) {
                if ($p->id_jenis_pkm) {
                    DB::table('aktivitas_jenis_pkm')->insert([
                        'id_aktivitas' => $aktivitas->id_aktivitas,
                        'id_jenis_pkm' => $p->id_jenis_pkm,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $id_sumber_dana = $p->sumber_dana ? ($sumberDanaMap[$p->sumber_dana] ?? null) : null;
                
                DB::table('aktivitas')->where('id_aktivitas', $aktivitas->id_aktivitas)->update([
                    'judul_pkm' => $p->judul_kegiatan,
                    'tgl_mulai' => $p->tgl_mulai,
                    'tgl_selesai' => $p->tgl_selesai,
                    'rab' => $p->rab,
                    'rab_items' => $p->rab_items,
                    'total_anggaran' => $p->total_anggaran,
                    'id_sumber_dana' => $id_sumber_dana,
                ]);
            }
        }

        $tims = DB::table('tim_kegiatan')->get();
        foreach ($tims as $tim) {
            $aktivitas = DB::table('aktivitas')->where('id_pengajuan', $tim->id_pengajuan)->first();
            if ($aktivitas) {
                DB::table('tim_kegiatan')->where('id_tim', $tim->id_tim)->update([
                    'id_aktivitas' => $aktivitas->id_aktivitas
                ]);
            }
        }
        // --- DATA MIGRATION END ---

        Schema::table('tim_kegiatan', function (Blueprint $table) {
            // Drop kolom lama
            $table->dropColumn('id_pengajuan');
        });

        // 5. Modifikasi tabel pengajuan (Hapus kolom yang tidak lagi diperlukan)
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropForeign(['id_jenis_pkm']);
            $table->dropColumn([
                'id_jenis_pkm',
                'judul_kegiatan',
                'rab',
                'rab_items',
                'sumber_dana',
                'total_anggaran',
                'dana_perguruan_tinggi',
                'dana_pemerintah',
                'dana_lembaga_dalam',
                'dana_lembaga_luar',
                'tgl_mulai',
                'tgl_selesai',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 5. Restore pengajuan
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->unsignedBigInteger('id_jenis_pkm')->nullable();
            $table->string('judul_kegiatan')->nullable();
            $table->text('rab')->nullable();
            $table->json('rab_items')->nullable();
            $table->string('sumber_dana')->nullable();
            $table->decimal('total_anggaran', 15, 2)->nullable();
            $table->decimal('dana_perguruan_tinggi', 15, 2)->nullable();
            $table->decimal('dana_pemerintah', 15, 2)->nullable();
            $table->decimal('dana_lembaga_dalam', 15, 2)->nullable();
            $table->decimal('dana_lembaga_luar', 15, 2)->nullable();
            $table->date('tgl_mulai')->nullable();
            $table->date('tgl_selesai')->nullable();

            $table->foreign('id_jenis_pkm')->references('id_jenis_pkm')->on('jenis_pkm')->onDelete('set null');
        });

        // 4. Restore tim_kegiatan
        Schema::table('tim_kegiatan', function (Blueprint $table) {
            $table->dropForeign(['id_aktivitas']);
            $table->unsignedBigInteger('id_pengajuan')->nullable()->after('id_aktivitas');
            $table->foreign('id_pengajuan')->references('id_pengajuan')->on('pengajuan')->onDelete('cascade');
            $table->dropColumn('id_aktivitas');
        });

        // 3. Restore aktivitas
        Schema::table('aktivitas', function (Blueprint $table) {
            $table->dropForeign(['id_sumber_dana']);
            $table->dropColumn([
                'judul_pkm', 'tgl_mulai', 'tgl_selesai', 'rab', 'rab_items', 'total_anggaran', 'id_sumber_dana',
                'provinsi', 'kota_kabupaten', 'kecamatan', 'kelurahan_desa', 'alamat_lengkap', 'latitude', 'longitude', 'lokasi_tambahan'
            ]);
        });

        // 2. Drop pivot
        Schema::dropIfExists('aktivitas_jenis_pkm');

        // 1. Drop jenis_sumber_dana
        Schema::dropIfExists('jenis_sumber_dana');
    }
};
