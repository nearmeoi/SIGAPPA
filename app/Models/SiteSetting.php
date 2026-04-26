<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class SiteSetting extends Model
{
    protected $table = 'site_settings';
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['key', 'value'];

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $record = static::find($key);
        return $record ? $record->value : $default;
    }

    /**
     * Set (upsert) a setting value by key.
     */
    public static function set(string $key, $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value]
        );
    }

    /**
     * Log a site visit and increment visitor count if needed.
     */
    public static function logVisit(string $ip, ?string $userAgent = null, ?string $path = null): void
    {
        try {
            // 1. Catat detail kunjungan ke tabel site_visits
            DB::table('site_visits')->insert([
                'ip_address' => $ip,
                'user_agent' => substr($userAgent, 0, 255),
                'page_path' => $path,
                'visited_at' => now(),
            ]);

            // 2. Logika increment visitor_count utama (berdasarkan IP per 60 detik)
            $cacheKey = 'visitor_inc_' . md5($ip);
            if (!\Illuminate\Support\Facades\Cache::has($cacheKey)) {
                static::where('key', 'visitor_count')->increment('value');
                \Illuminate\Support\Facades\Cache::put($cacheKey, true, 60);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to log visit: " . $e->getMessage());
        }
    }

    /**
     * Get comprehensive visitor statistics.
     */
    public static function getVisitorStats(): array
    {
        try {
            $today = now()->startOfDay();
            $last7Days = now()->subDays(7);
            $last30Days = now()->subDays(30);

            return [
                'today_views' => DB::table('site_visits')->where('visited_at', '>=', $today)->count(),
                'today_visitors' => DB::table('site_visits')->where('visited_at', '>=', $today)->distinct('ip_address')->count('ip_address'),
                'last_7_days_views' => DB::table('site_visits')->where('visited_at', '>=', $last7Days)->count(),
                'last_30_days_views' => DB::table('site_visits')->where('visited_at', '>=', $last30Days)->count(),
                'total_visitors' => (int) static::get('visitor_count', 0) + (int) static::get('visitor_count_offset', 0),
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to get visitor stats: " . $e->getMessage());
            return [
                'today_views' => 0,
                'today_visitors' => 0,
                'last_7_days_views' => 0,
                'last_30_days_views' => 0,
                'total_visitors' => 0,
            ];
        }
    }
}
