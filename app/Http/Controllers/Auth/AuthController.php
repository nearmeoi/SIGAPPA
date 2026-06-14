<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Redirect URL berdasarkan role user.
     */
    private function dashboardUrl(): string
    {
        $role = Auth::user()?->role;
        if ($role === 'direktur') {
            return '/direktur/dashboard';
        }
        if (in_array($role, ['admin', 'superadmin', 'secret_account'])) {
            return '/admin/dashboard';
        }
        if ($role === 'dosen') {
            return '/cek-status';
        }
        return '/beranda';
    }

    public function showLogin()
    {
        if (Auth::check()) {
            return redirect($this->dashboardUrl());
        }

        return Inertia::render('Auth/Login');
    }

    public function showLoginDosen(Request $request)
    {
        if (Auth::check()) {
            return redirect($this->dashboardUrl());
        }

        return Inertia::render('Auth/DosenPortal', [
            'initialNip' => $request->query('nip'),
            'autoCheck' => $request->boolean('autocheck'),
        ]);
    }

    public function checkNip(Request $request)
    {
        $request->validate([
            'nip' => ['required', 'numeric'],
        ], [
            'nip.numeric' => 'NIP harus berupa angka.',
        ]);

        $pegawai = Pegawai::whereRaw("REGEXP_REPLACE(nip, '[^0-9]', '') = ?", [$request->nip])->first();

        if (!$pegawai) {
            return response()->json([
                'status' => 'error',
                'message' => 'NIP tidak ditemukan dalam data pegawai. Tidak dapat mendaftar sebagai Dosen.',
            ]);
        }

        if ($pegawai->id_user) {
            $user = User::where('id_user', $pegawai->id_user)->first();

            if ($user) {
                return response()->json([
                    'status' => 'registered',
                    'email' => $user->email,
                    'name' => $user->name,
                    'message' => 'NIP sudah terdaftar. Silakan masukkan kata sandi.',
                ]);
            }
        }

        return response()->json([
            'status' => 'claimable',
            'name' => $pegawai->nama_pegawai,
            'message' => 'NIP ditemukan. Silakan lengkapi data registrasi Anda.',
        ]);
    }

    public function showLoginMasyarakat(Request $request)
    {
        if (Auth::check()) {
            return redirect($this->dashboardUrl());
        }

        $user = $request->user();
        $pkmData = Pengajuan::with(['aktivitas.testimoni', 'aktivitas.timKegiatan.pegawai', 'aktivitas.jenisPkm'])
            ->whereNotNull('latitude')
            ->get()
            ->map(fn($pengajuan) => [
                'id' => $pengajuan->id_pengajuan,
                'nama' => $pengajuan->aktivitas->first()?->judul_pkm ?? 'Pengajuan PKM',
                'tahun' => $pengajuan->created_at?->year ?? date('Y'),
                'jenis_pkm' => $pengajuan->aktivitas->first()?->jenisPkm->first()?->nama_jenis ?? '',
                'status' => ($pengajuan->status_pengajuan === 'selesai' || $pengajuan->aktivitas->first()?->status_pelaksanaan === 'selesai')
                    ? 'selesai'
                    : (in_array($pengajuan->status_pengajuan, ['berlangsung', 'diterima']) ? 'berlangsung' : ($pengajuan->status_pengajuan === 'belum_diajukan' ? 'belum_mulai' : 'ada_pengajuan')),
                'deskripsi' => $pengajuan->kebutuhan ?? '',
                'thumbnail' => $pengajuan->aktivitas->first()?->url_thumbnail ?? '',
                'provinsi' => $pengajuan->provinsi ?? '',
                'kabupaten' => $pengajuan->kota_kabupaten ?? '',
                'kecamatan' => $pengajuan->kecamatan ?? '',
                'desa' => $pengajuan->kelurahan_desa ?? '',
                'lat' => (float) ($pengajuan->latitude ?? 0),
                'lng' => (float) ($pengajuan->longitude ?? 0),
                'total_anggaran' => $pengajuan->total_anggaran ?? 0,
                'tim_kegiatan' => $pengajuan->aktivitas->flatMap(fn($a) => $a->timKegiatan)->map(fn($tim) => [
                    'nama' => $tim->pegawai ? $tim->pegawai->nama_pegawai : $tim->nama_mahasiswa,
                    'peran' => $tim->peran_tim,
                ])->unique('nama')->values()->toArray(),
                'testimoni' => $pengajuan->aktivitas->flatMap(fn($a) => $a->testimoni)->map(fn($testimoni) => [
                    'nama_pemberi' => $testimoni->nama_pemberi,
                    'rating' => (int) $testimoni->rating,
                    'pesan_ulasan' => $testimoni->pesan_ulasan,
                ])->unique('nama_pemberi')->values()->toArray(),
            ]);

        return Inertia::render('Auth/LoginMasyarakat', [
            'auth' => [
                'user' => $user
                    ? [
                        'id' => $user->id_user,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ?? 'masyarakat',
                        'avatar' => $user->avatar ?? null,
                    ]
                    : [
                        'id' => 'preview-masyarakat',
                        'name' => 'Akun Masyarakat SIGAP',
                        'email' => 'masyarakat@poltekparmakassar.ac.id',
                        'role' => 'masyarakat',
                        'avatar' => null,
                    ],
            ],
            'pkmData' => $pkmData,
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
        $loginSource = $request->input('login_source', 'general');

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            $default = '/';
            if ($user->role === 'direktur') {
                $default = '/direktur/dashboard';
            } elseif (in_array($user->role, ['admin', 'superadmin', 'secret_account'])) {
                $default = '/admin/dashboard';
            } elseif ($user->role === 'dosen') {
                $default = '/cek-status';
            } elseif ($user->role === 'masyarakat') {
                $default = '/beranda';
            }

            return redirect()->intended($default);
        }

        return back()->withErrors([
            'email' => 'Email atau kata sandi yang Anda masukkan salah.',
        ])->onlyInput('email');
    }

    public function showRegister(Request $request)
    {
        if (Auth::check()) {
            return redirect($this->dashboardUrl());
        }

        $preferredRole = $request->query('role') === 'dosen' ? 'dosen' : 'masyarakat';

        return Inertia::render('Auth/Register', [
            'preferredRole' => $preferredRole,
        ]);
    }

    public function register(Request $request)
    {
        $preferredRole = $request->query('role') === 'dosen' ? 'dosen' : 'masyarakat';
        $portalDosenFlow = $request->query('source') === 'portal-dosen';

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'nip' => [$preferredRole === 'dosen' ? 'required' : 'nullable', 'numeric'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'nip.required' => 'NIP wajib diisi untuk registrasi dosen.',
            'nip.numeric' => 'NIP harus berupa angka.',
        ]);

        $role = 'masyarakat';
        $pegawai = null;

        if ($request->filled('nip')) {
            $pegawai = Pegawai::whereRaw("REGEXP_REPLACE(nip, '[^0-9]', '') = ?", [$request->nip])->first();

            if (!$pegawai) {
                return back()->withErrors([
                    'nip' => 'NIP tidak ditemukan dalam data pegawai. Tidak dapat mendaftar sebagai Dosen.',
                ])->withInput();
            }

            if ($pegawai->id_user) {
                return back()->withErrors([
                    'nip' => 'NIP ini sudah terhubung ke akun dosen. Silakan login menggunakan email dan kata sandi Anda.',
                ])->withInput();
            }

            $role = 'dosen';
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
        ]);

        if ($role === 'dosen') {
            $pegawai->update([
                'id_user' => $user->id_user,
                'nama_pegawai' => $request->name,
            ]);
        }

        Auth::login($user);

        if ($portalDosenFlow && $role === 'dosen') {
            return redirect('/cek-status')->with('success', 'Registrasi berhasil dan Anda telah masuk otomatis.');
        }

        $redirectTo = '/';
        if ($user->role === 'direktur') {
            $redirectTo = '/direktur/dashboard';
        } elseif (in_array($user->role, ['admin', 'superadmin', 'secret_account'])) {
            $redirectTo = '/admin/dashboard';
        } elseif ($user->role === 'dosen') {
            $redirectTo = '/cek-status';
        } elseif ($user->role === 'masyarakat') {
            $redirectTo = '/beranda';
        }

        return redirect($redirectTo);
    }

    public function verifyEmail()
    {
        return Inertia::render('Auth/VerifyEmail');
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/beranda');
    }
}
