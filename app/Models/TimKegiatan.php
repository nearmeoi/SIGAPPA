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
        'id_pengajuan',
        'id_pegawai',
        'nama_mahasiswa',
        'peran_tim',
    ];

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai', 'id_pegawai');
    }
}
