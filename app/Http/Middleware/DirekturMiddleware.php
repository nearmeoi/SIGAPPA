<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DirekturMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->guest(route('login'));
        }

        if ($request->user()->role !== 'direktur') {
            abort(403, 'Akses ditolak. Halaman ini hanya untuk Direktur.');
        }

        return $next($request);
    }
}
