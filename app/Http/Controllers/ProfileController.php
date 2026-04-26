<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Show the profile edit form.
     */
    public function edit()
    {
        $user = Auth::user();
        $pegawai = null;

        // Jika dosen, ambil data pegawai untuk ditampilkan (read-only)
        if ($user->role === 'dosen') {
            $pegawai = $user->pegawai;
        }

        return Inertia::render('Profile/EditProfile', [
            'userData' => [
                'id_user' => $user->id_user,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'pegawaiData' => $pegawai ? [
                'nip' => $pegawai->nip,
                'jabatan' => $pegawai->jabatan,
                'posisi' => $pegawai->posisi,
            ] : null,
        ]);
    }

    /**
     * Update the user's profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,' . $user->id_user . ',id_user'],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Jika dosen, sinkronkan nama ke tabel pegawai
        if ($user->role === 'dosen' && $user->pegawai) {
            $user->pegawai->update(['nama_pegawai' => $request->name]);
        }

        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
    }
}
