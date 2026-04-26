<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimoni extends Model
{
    protected $table = 'testimoni';

    protected $primaryKey = 'id_testimoni';

    protected $fillable = [
        'id_aktivitas',
        'nama_pemberi',
        'rating',
        'pesan_ulasan',
        'masukan',
    ];

    public function aktivitas()
    {
        return $this->belongsTo(Aktivitas::class, 'id_aktivitas', 'id_aktivitas');
    }
}
