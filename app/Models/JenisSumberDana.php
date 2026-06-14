<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisSumberDana extends Model
{
    use SoftDeletes;

    protected $table = 'jenis_sumber_dana';

    protected $primaryKey = 'id_sumber_dana';

    protected $fillable = [
        'nama_sumber_dana',
    ];

    public function aktivitas()
    {
        return $this->hasMany(Aktivitas::class, 'id_sumber_dana', 'id_sumber_dana');
    }
}
