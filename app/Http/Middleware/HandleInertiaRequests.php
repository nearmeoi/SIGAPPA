<?php

namespace App\Http\Middleware;

use App\Models\Kontak;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        try {
            $user = $request->user();
        } catch (\Throwable $exception) {
            $user = null;
            Log::warning('Failed to resolve shared auth user: ' . $exception->getMessage());
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id_user,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'id' => fn() => ($request->session()->has('success') || $request->session()->has('error'))
                    ? uniqid('flash_', true)
                    : null,
            ],
            'visitorStats' => Inertia::lazy(fn() => SiteSetting::getVisitorStats()),
            'listKontak' => Inertia::lazy(function () {
                try {
                    return Kontak::orderBy('created_at', 'asc')
                        ->get()
                        ->map(fn($k) => [
                            'id_kontak' => $k->id_kontak,
                            'ikon' => $k->ikon,
                            'label' => $k->label,
                            'nilai_kontak' => $k->nilai_kontak,
                        ]);
                } catch (\Throwable $exception) {
                    Log::warning('Failed to resolve shared contact list: ' . $exception->getMessage());

                    return [];
                }
            }),
        ];
    }
}
