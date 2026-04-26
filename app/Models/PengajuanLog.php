<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanLog extends Model
{
    protected $table = 'pengajuan_logs';

    protected $fillable = [
        'id_pengajuan',
        'status_lama',
        'status_baru',
        'catatan',
        'changed_by_user_id',
        'changed_by_name',
    ];

    public $timestamps = true;

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }
}
