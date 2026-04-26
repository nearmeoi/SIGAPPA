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
        'catatan_pelaksanaan',
        'tgl_realisasi_mulai',
        'tgl_realisasi_selesai',
        'url_thumbnail',
    ];

    protected $casts = [
        'tgl_realisasi_mulai' => 'date',
        'tgl_realisasi_selesai' => 'date',
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
}
