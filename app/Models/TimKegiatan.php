<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimKegiatan extends Model
{
    use SoftDeletes;

    protected $table = 'tim_kegiatan';

    protected $primaryKey = 'id_tim';

    protected $fillable = [
        'id_aktivitas',
        'id_pegawai',
        'nama_mahasiswa',
        'peran_tim',
    ];

    public function aktivitas()
    {
        return $this->belongsTo(Aktivitas::class, 'id_aktivitas', 'id_aktivitas');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai', 'id_pegawai');
    }
}
