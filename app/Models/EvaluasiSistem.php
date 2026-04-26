<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluasiSistem extends Model
{
    protected $table = 'evaluasi_sistem';
    protected $primaryKey = 'id_evaluasi';

    protected $fillable = [
        'nama', 'asal_instansi', 'no_telp',
        'q1', 'q2', 'q3', 'q4', 'q5',
        'masukan'
    ];
}
