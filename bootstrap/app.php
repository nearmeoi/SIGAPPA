<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\DirekturMiddleware;
use App\Http\Middleware\SecretMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'direktur' => DirekturMiddleware::class,
            'secret' => SecretMiddleware::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'check-nip',
            'evaluasi-sistem',
            'testimoni/public', // Might as well allow testimoni too
            'kumpul-arsip/*', // And public archives
        ]);

        $middleware->redirectUsersTo(function ($request): string {
            $role = $request->user()?->role;

            if ($role === 'direktur') {
                return '/direktur/dashboard';
            }

            if (in_array($role, ['admin', 'superadmin', 'secret_account', 'secret'], true)) {
                return '/admin/dashboard';
            }

            return '/beranda';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (NotFoundHttpException $e) {
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Not Found'], 404);
            }

            return Inertia::render('ComingSoon')->toResponse(request())->setStatusCode(404);
        });
    })->create();
