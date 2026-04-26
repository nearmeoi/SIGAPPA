<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DeveloperDocumentation extends Model
{
    use HasFactory;

    protected $table = 'developer_documentations';
    protected $primaryKey = 'id_dokumentasi';
    protected $fillable = ['judul', 'deskripsi', 'foto', 'urutan'];
}
