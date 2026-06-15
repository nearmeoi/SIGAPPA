<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Performance Indexes Migration
 *
 * These indexes target the most expensive queries in the app:
 * 1. visibleInPengajuanQueue() scope — filters by status_pengajuan heavily
 * 2. Dashboard & Pengajuan index — sorted/filtered by created_at, tgl_mulai
 * 3. Aktivitas index — filtered by status_pelaksanaan, tgl_mulai
 * 4. Notification queries — ordered by updated_at
 *
 * Uses IF NOT EXISTS checks so it's safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Helper: skip if index already exists
        $hasIndex = fn(string $table, string $index) => collect(DB::select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]
        ))->isNotEmpty();

        Schema::table('pengajuan', function (Blueprint $table) use ($hasIndex) {
            // Core filter column — used in almost every query
            if (! $hasIndex('pengajuan', 'idx_pengajuan_status')) {
                $table->index('status_pengajuan', 'idx_pengajuan_status');
            }
            // Dashboard date filters
            if (! $hasIndex('pengajuan', 'idx_pengajuan_tgl_mulai')) {
                $table->index('tgl_mulai', 'idx_pengajuan_tgl_mulai');
            }
            // List page default sort
            if (! $hasIndex('pengajuan', 'idx_pengajuan_created_at')) {
                $table->index('created_at', 'idx_pengajuan_created_at');
            }
            // Notification & read status filters
            if (! $hasIndex('pengajuan', 'idx_pengajuan_updated_at')) {
                $table->index('updated_at', 'idx_pengajuan_updated_at');
            }
            // admin_read_at used in tab=reviu & tab=pengajuan filters
            if (! $hasIndex('pengajuan', 'idx_pengajuan_admin_read')) {
                $table->index('admin_read_at', 'idx_pengajuan_admin_read');
            }
            // Map query: whereNotNull('latitude')
            if (! $hasIndex('pengajuan', 'idx_pengajuan_latitude')) {
                $table->index('latitude', 'idx_pengajuan_latitude');
            }
            // Compound: status + created_at (most common filter+sort combo)
            if (! $hasIndex('pengajuan', 'idx_pengajuan_status_created')) {
                $table->index(['status_pengajuan', 'created_at'], 'idx_pengajuan_status_created');
            }
            // Foreign key lookups
            if (! $hasIndex('pengajuan', 'idx_pengajuan_id_user')) {
                $table->index('id_user', 'idx_pengajuan_id_user');
            }
            if (! $hasIndex('pengajuan', 'idx_pengajuan_id_jenis_pkm')) {
                $table->index('id_jenis_pkm', 'idx_pengajuan_id_jenis_pkm');
            }
        });

        Schema::table('aktivitas', function (Blueprint $table) use ($hasIndex) {
            // Status filter — used on every Aktivitas index page load
            if (! $hasIndex('aktivitas', 'idx_aktivitas_status')) {
                $table->index('status_pelaksanaan', 'idx_aktivitas_status');
            }
            // Date filter
            if (! $hasIndex('aktivitas', 'idx_aktivitas_tgl_mulai')) {
                $table->index('tgl_mulai', 'idx_aktivitas_tgl_mulai');
            }
            // Default sort
            if (! $hasIndex('aktivitas', 'idx_aktivitas_created_at')) {
                $table->index('created_at', 'idx_aktivitas_created_at');
            }
            // Foreign key
            if (! $hasIndex('aktivitas', 'idx_aktivitas_id_pengajuan')) {
                $table->index('id_pengajuan', 'idx_aktivitas_id_pengajuan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_pengajuan_status');
            $table->dropIndexIfExists('idx_pengajuan_tgl_mulai');
            $table->dropIndexIfExists('idx_pengajuan_created_at');
            $table->dropIndexIfExists('idx_pengajuan_updated_at');
            $table->dropIndexIfExists('idx_pengajuan_admin_read');
            $table->dropIndexIfExists('idx_pengajuan_latitude');
            $table->dropIndexIfExists('idx_pengajuan_status_created');
            $table->dropIndexIfExists('idx_pengajuan_id_user');
            $table->dropIndexIfExists('idx_pengajuan_id_jenis_pkm');
        });

        Schema::table('aktivitas', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_aktivitas_status');
            $table->dropIndexIfExists('idx_aktivitas_tgl_mulai');
            $table->dropIndexIfExists('idx_aktivitas_created_at');
            $table->dropIndexIfExists('idx_aktivitas_id_pengajuan');
        });
    }
};
