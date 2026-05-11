<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthLoginRoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_dosen_account_cannot_login_from_general_login(): void
    {
        $user = User::factory()->create([
            'email' => 'dosen@example.com',
            'password' => Hash::make('password123'),
            'role' => 'dosen',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
            'login_source' => 'general',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors([
            'email' => 'Akun ini terdaftar sebagai dosen. Silakan gunakan menu "Masuk / Daftar sebagai Dosen" untuk verifikasi NIP dan akses akun dosen.',
        ]);
        $this->assertGuest();
    }

    public function test_dosen_account_can_login_from_dosen_portal(): void
    {
        $user = User::factory()->create([
            'email' => 'dosen@example.com',
            'password' => Hash::make('password123'),
            'role' => 'dosen',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
            'login_source' => 'dosen',
        ]);

        $response->assertRedirect('/beranda');
        $this->assertAuthenticatedAs($user);
    }

    public function test_non_dosen_account_can_login_from_general_login(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
            'login_source' => 'general',
        ]);

        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($user);
    }
}
