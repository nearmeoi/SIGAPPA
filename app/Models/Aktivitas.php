<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Aktivitas extends Model
{
    use SoftDeletes;

    protected $table = 'aktivitas';

    protected $primaryKey = 'id_aktivitas';

    protected $fillable = [
        'id_pengajuan',
        'status_pelaksanaan',
        'judul_pkm',
        'tgl_mulai',
        'tgl_selesai',
        'rab',
        'rab_items',
        'total_anggaran',
        'id_sumber_dana',
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
        'kelurahan_desa',
        'alamat_lengkap',
        'latitude',
        'longitude',
        'lokasi_tambahan',
        'catatan_pelaksanaan',
        'tgl_realisasi_mulai',
        'tgl_realisasi_selesai',
        'url_thumbnail',
    ];

    protected $casts = [
        'tgl_mulai' => 'date',
        'tgl_selesai' => 'date',
        'tgl_realisasi_mulai' => 'date',
        'tgl_realisasi_selesai' => 'date',
        'rab_items' => 'array',
        'lokasi_tambahan' => 'array',
        'total_anggaran' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function arsip()
    {
        return $this->hasMany(Arsip::class, 'id_aktivitas', 'id_aktivitas');
    }

    public function testimoni()
    {
        return $this->hasMany(Testimoni::class, 'id_aktivitas', 'id_aktivitas');
    }

    public function jenisPkm()
    {
        return $this->belongsToMany(JenisPkm::class, 'aktivitas_jenis_pkm', 'id_aktivitas', 'id_jenis_pkm');
    }

    public function timKegiatan()
    {
        return $this->hasMany(TimKegiatan::class, 'id_aktivitas', 'id_aktivitas');
    }

    public function sumberDana()
    {
        return $this->belongsTo(JenisSumberDana::class, 'id_sumber_dana', 'id_sumber_dana');
    }
}
