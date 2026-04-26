<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Arsip extends Model
{
    use SoftDeletes;

    protected $table = 'arsip';

    protected $primaryKey = 'id_arsip';

    protected $fillable = [
        'id_pengajuan',
        'id_aktivitas',
        'nama_dokumen',
        'jenis_arsip',
        'url_dokumen',
        'keterangan',
    ];

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function aktivitas()
    {
        return $this->belongsTo(Aktivitas::class, 'id_aktivitas', 'id_aktivitas');
    }
}
