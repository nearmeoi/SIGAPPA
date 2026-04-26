<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisPkm extends Model
{
    protected $table = 'jenis_pkm';

    protected $primaryKey = 'id_jenis_pkm';

    protected $fillable = [
        'nama_jenis',
        'warna_icon',
        'deskripsi',
    ];

    public function pengajuan()
    {
        return $this->hasMany(Pengajuan::class, 'id_jenis_pkm');
    }
}
