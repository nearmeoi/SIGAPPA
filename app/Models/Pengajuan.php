<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Pengajuan extends Model
{
    use SoftDeletes;

    protected $table = 'pengajuan';

    protected $primaryKey = 'id_pengajuan';

    public $timestamps = true;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->kode_unik)) {
                $model->kode_unik = Str::random(12);
            }
        });
    }

    protected $fillable = [
        'id_user',
        'kode_unik',
        'tipe_pengusul',
        'provinsi',
        'kota_kabupaten',
        'kecamatan',
        'kelurahan_desa',
        'alamat_lengkap',
        'latitude',
        'longitude',
        'lokasi_tambahan',
        'nama_pengusul',
        'email_pengusul',
        'kebutuhan',
        'instansi_mitra',
        'no_telepon',
        'proposal',
        'surat_permohonan',
        'is_tahun_saja',
        'status_pengajuan',
        'catatan_admin',
        'catatan_direktur',
        'admin_read_at',
        'direktur_approved_at',
    ];

    const STATUS_DIPROSES = 'diproses';

    const STATUS_DIAJUKAN = 'diajukan';

    const STATUS_REVISI_DIREKTUR = 'revisi_direktur';

    const STATUS_DIREVISI = 'direvisi';

    const STATUS_DITERIMA = 'diterima';

    const STATUS_DITOLAK = 'ditolak';

    const STATUS_SELESAI = 'selesai';

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'lokasi_tambahan' => 'array',
            'is_tahun_saja' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'admin_read_at' => 'datetime',
            'direktur_approved_at' => 'datetime',
        ];
    }

    public function logs()
    {
        return $this->hasMany(PengajuanLog::class, 'id_pengajuan', 'id_pengajuan')
            ->latest();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function aktivitas()
    {
        return $this->hasMany(Aktivitas::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function arsip()
    {
        return $this->hasMany(Arsip::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function testimoni()
    {
        return $this->hasManyThrough(
            Testimoni::class,
            Aktivitas::class,
            'id_pengajuan',
            'id_aktivitas',
            'id_pengajuan',
            'id_aktivitas'
        );
    }

    public function getFullAddressAttribute(): string
    {
        return collect([
            $this->alamat_lengkap,
            $this->kelurahan_desa,
            $this->kecamatan,
            $this->kota_kabupaten,
            $this->provinsi,
        ])->filter()->implode(', ');
    }

    public function scopeNotifikasi($query)
    {
        return $query->whereIn('status_pengajuan', [self::STATUS_DIPROSES, self::STATUS_DIREVISI, self::STATUS_REVISI_DIREKTUR]);
    }

    public function scopeBelumDibaca($query)
    {
        return $query->notifikasi()->whereNull('admin_read_at');
    }
}
