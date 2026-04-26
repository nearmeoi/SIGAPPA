<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Arsip;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\Testimoni;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private const LIMIT = 5;

    public function __invoke(Request $request)
    {
        $q = trim($request->input('q', ''));

        $fmtPengajuan = fn ($p) => ['id' => $p->id_pengajuan, 'title' => $p->judul_kegiatan,  'subtitle' => ucfirst($p->status_pengajuan),                             'url' => '/admin/pengajuan/'.$p->id_pengajuan];
        $fmtUser = fn ($u) => ['id' => $u->id_user,      'title' => $u->name,             'subtitle' => $u->email.' ('.$u->role.')',                               'url' => '/admin/users'];
        $fmtPegawai = fn ($p) => ['id' => $p->id_pegawai,   'title' => $p->nama_pegawai,     'subtitle' => 'NIP: '.($p->nip ?? '-'),                                  'url' => '/admin/pegawai'];
        $fmtAktivitas = fn ($a) => ['id' => $a->id_aktivitas, 'title' => $a->pengajuan?->judul_kegiatan ?? 'Aktivitas #'.$a->id_aktivitas, 'subtitle' => ucfirst($a->status_pelaksanaan), 'url' => '/admin/aktivitas/'.$a->id_aktivitas];
        $fmtTestimoni = fn ($t) => ['id' => $t->id_testimoni, 'title' => $t->nama_pemberi,     'subtitle' => 'Rating: '.$t->rating.'/5',                               'url' => '/admin/testimoni'];
        $fmtArsip = fn ($a) => ['id' => $a->id_arsip,     'title' => $a->nama_dokumen,     'subtitle' => $a->jenis_arsip,                                          'url' => '/admin/arsip'];

        // Tanpa query: tampilkan data terbaru sebagai default
        if (strlen($q) < 2) {
            return response()->json([
                'pengajuan' => Pengajuan::latest()->limit(self::LIMIT)->get(['id_pengajuan', 'judul_kegiatan', 'status_pengajuan'])->map($fmtPengajuan),
                'users' => User::latest()->limit(self::LIMIT)->get(['id_user', 'name', 'email', 'role'])->map($fmtUser),
                'pegawai' => Pegawai::latest()->limit(self::LIMIT)->get(['id_pegawai', 'nama_pegawai', 'nip'])->map($fmtPegawai),
                'aktivitas' => Aktivitas::with('pengajuan')->latest()->limit(self::LIMIT)->get(['id_aktivitas', 'id_pengajuan', 'status_pelaksanaan'])->map($fmtAktivitas),
                'testimoni' => Testimoni::latest()->limit(self::LIMIT)->get(['id_testimoni', 'nama_pemberi', 'rating'])->map($fmtTestimoni),
                'arsip' => Arsip::latest()->limit(self::LIMIT)->get(['id_arsip', 'nama_dokumen', 'jenis_arsip'])->map($fmtArsip),
            ]);
        }

        // Sanitasi wildcard LIKE agar karakter % dan _ tidak bisa diinjeksikan
        $like = '%'.addcslashes($q, '\\%_').'%';

        return response()->json([
            'pengajuan' => Pengajuan::where('judul_kegiatan', 'like', $like)->limit(self::LIMIT)->get(['id_pengajuan', 'judul_kegiatan', 'status_pengajuan'])->map($fmtPengajuan),
            'users' => User::where('name', 'like', $like)->orWhere('email', 'like', $like)->limit(self::LIMIT)->get(['id_user', 'name', 'email', 'role'])->map($fmtUser),
            'pegawai' => Pegawai::where('nama_pegawai', 'like', $like)->orWhere('nip', 'like', $like)->limit(self::LIMIT)->get(['id_pegawai', 'nama_pegawai', 'nip'])->map($fmtPegawai),
            'aktivitas' => Aktivitas::with('pengajuan')->where('status_pelaksanaan', 'like', $like)->limit(self::LIMIT)->get(['id_aktivitas', 'id_pengajuan', 'status_pelaksanaan'])->map($fmtAktivitas),
            'testimoni' => Testimoni::where('nama_pemberi', 'like', $like)->orWhere('pesan_ulasan', 'like', $like)->limit(self::LIMIT)->get(['id_testimoni', 'nama_pemberi', 'rating'])->map($fmtTestimoni),
            'arsip' => Arsip::where('nama_dokumen', 'like', $like)->limit(self::LIMIT)->get(['id_arsip', 'nama_dokumen', 'jenis_arsip'])->map($fmtArsip),
        ]);
    }
}
