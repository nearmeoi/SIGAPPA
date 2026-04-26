<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SecretSuperadminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Administrator',
                'email' => 'superadmin@admin.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'superadmin',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Secret Developer Account',
                'email' => 'secret@admin.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'secret_account',
                'email_verified_at' => now(),
            ],
        ];
        
        foreach ($users as $user) {
            \App\Models\User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
