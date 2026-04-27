<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\SQLiteConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (php_sapi_name() !== 'cli' && strpos(base_path(), '/var/www/html/sigappa') !== false) {
            $this->app->usePublicPath('/var/www/html');
        }
    }

    public function boot(): void
    {
        // Inject YEAR() function for local SQLite compatibility
        if (DB::connection() instanceof SQLiteConnection) {
            /** @var mixed $pdo */
            $pdo = DB::connection()->getPdo();

            $pdo->sqliteCreateFunction('YEAR', function ($string) {
                return substr($string, 0, 4);
            }, 1);

            $pdo->sqliteCreateFunction('FIELD', function () {
                $args = func_get_args();
                if (count($args) < 2) {
                    return 0;
                }

                $value = array_shift($args);
                $index = array_search($value, $args);

                return $index === false ? 0 : $index + 1;
            }, -1);
        }

        RateLimiter::for('auth', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
            ];
        });
    }
}
