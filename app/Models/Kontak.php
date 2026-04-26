<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kontak extends Model
{
    protected $table = 'kontak';
    protected $primaryKey = 'id_kontak';

    protected $fillable = [
        'platform', 'nilai_kontak', 'label', 'ikon'
    ];
}
