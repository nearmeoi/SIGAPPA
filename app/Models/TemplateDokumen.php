<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateDokumen extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'jenis',
        'nama_file',
        'file_path',
    ];
}
