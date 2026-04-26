<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pegawai extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pegawai';

    protected $primaryKey = 'id_pegawai';

    protected $fillable = [
        'id_user',
        'nip',
        'nama_pegawai',
        'jabatan',
        'posisi',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function timKegiatan()
    {
        return $this->hasMany(TimKegiatan::class, 'id_pegawai');
    }
}
