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
        'id_jenis_pkm',
        'judul_kegiatan',
        'rab',
        'rab_items',
        'total_anggaran',
        'sumber_dana',
        'dana_perguruan_tinggi',
        'dana_pemerintah',
        'dana_lembaga_dalam',
        'dana_lembaga_luar',
        'tgl_mulai',
        'tgl_selesai',
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
            'rab_items' => 'array',
            'tgl_mulai' => 'date',
            'tgl_selesai' => 'date',
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

    public function jenisPkm()
    {
        return $this->belongsTo(JenisPkm::class, 'id_jenis_pkm', 'id_jenis_pkm');
    }

    public function timKegiatan()
    {
        return $this->hasMany(TimKegiatan::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function aktivitas()
    {
        return $this->hasOne(Aktivitas::class, 'id_pengajuan', 'id_pengajuan');
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

    public function scopeVisibleInPengajuanQueue($query)
    {
        return $query->where(function ($query) {
            $query
                ->whereNotIn('status_pengajuan', [self::STATUS_DITERIMA, self::STATUS_SELESAI])
                ->orWhereNull('direktur_approved_at')
                ->orDoesntHave('aktivitas')
                ->orWhere(fn ($q) => $q->incompleteForAdmin());
        });
    }

    public function scopeIncompleteForAdmin($query)
    {
        $blank = function ($query, string $column) {
            $query->whereNull($column)->orWhere($column, '');
        };

        return $query->where(function ($q) use ($blank) {
            $q->where(fn ($field) => $blank($field, 'id_jenis_pkm'))
                ->orWhere(fn ($field) => $blank($field, 'instansi_mitra'))
                ->orWhere(fn ($field) => $blank($field, 'no_telepon'))
                ->orWhere(fn ($field) => $blank($field, 'kebutuhan'))
                ->orWhere(fn ($field) => $blank($field, 'provinsi'))
                ->orWhere(fn ($field) => $blank($field, 'kota_kabupaten'))
                ->orWhere(fn ($field) => $blank($field, 'surat_permohonan'))
                ->orWhere(function ($field) {
                    $field->where(fn ($inner) => $inner->whereNull('nama_pengusul')->orWhere('nama_pengusul', ''))
                        ->whereDoesntHave('user', fn ($user) => $user->whereNotNull('name')->where('name', '!=', ''));
                })
                ->orWhere(function ($field) {
                    $field->where(fn ($inner) => $inner->whereNull('email_pengusul')->orWhere('email_pengusul', ''))
                        ->whereDoesntHave('user', fn ($user) => $user->whereNotNull('email')->where('email', '!=', ''));
                })
                ->orWhereDoesntHave('timKegiatan', fn ($tim) => $tim->where('peran_tim', 'like', '%ketua%'))
                ->orWhereDoesntHave('timKegiatan', fn ($tim) => $tim->where('peran_tim', 'not like', '%ketua%'))
                ->orWhere(function ($field) {
                    $field->whereNull('rab_items')
                        ->orWhere('rab_items', '')
                        ->orWhere('rab_items', '[]');
                })
                ->orWhere(function ($field) use ($blank) {
                    $field->where(function ($type) {
                        $type->where('tipe_pengusul', 'dosen')
                            ->orWhereHas('user', fn ($user) => $user->where('role', 'dosen'));
                    })->where(function ($dosen) use ($blank) {
                        $dosen->where(fn ($inner) => $blank($inner, 'judul_kegiatan'))
                            ->orWhere(function ($funding) {
                                $funding->where(function ($value) {
                                    $value->whereNull('dana_perguruan_tinggi')->orWhere('dana_perguruan_tinggi', '<=', 0);
                                })->where(function ($value) {
                                    $value->whereNull('dana_pemerintah')->orWhere('dana_pemerintah', '<=', 0);
                                })->where(function ($value) {
                                    $value->whereNull('dana_lembaga_dalam')->orWhere('dana_lembaga_dalam', '<=', 0);
                                })->where(function ($value) {
                                    $value->whereNull('dana_lembaga_luar')->orWhere('dana_lembaga_luar', '<=', 0);
                                })->where(function ($value) {
                                    $value->whereNull('sumber_dana')->orWhere('sumber_dana', '');
                                });
                            });
                    });
                });
        });
    }
}
