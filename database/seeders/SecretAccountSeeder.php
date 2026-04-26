<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class SecretAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = 'dev@poltekpar.ac.id';
        $user = User::where('email', $email)->first();

        if (!$user) {
            User::create([
                'name' => 'SiGappa Developer',
                'email' => $email,
                'password' => Hash::make('password123'),
                'role' => 'secret_account'
            ]);
        }
    }
}
