<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DeveloperAppreciation extends Model
{
    use HasFactory;

    protected $table = 'developer_appreciations';
    protected $primaryKey = 'id_developer';
    protected $fillable = ['nama', 'peran', 'asal_instansi', 'foto', 'urutan'];
}
