<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Some imported MySQL dumps can lose primary-key and auto-increment
     * metadata. Repair only the identity columns Laravel expects to generate.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->autoIncrementKeys() as [$table, $column]) {
            $this->ensureAutoIncrementPrimary($table, $column);
        }
    }

    public function down(): void
    {
        // Intentionally left blank. Removing repaired primary keys is unsafe.
    }

    private function autoIncrementKeys(): array
    {
        return [
            ['aktivitas', 'id_aktivitas'],
            ['arsip', 'id_arsip'],
            ['developer_appreciations', 'id_developer'],
            ['developer_documentations', 'id_dokumentasi'],
            ['evaluasi_sistem', 'id_evaluasi'],
            ['failed_jobs', 'id'],
            ['jenis_pkm', 'id_jenis_pkm'],
            ['jobs', 'id'],
            ['kontak', 'id_kontak'],
            ['pegawai', 'id_pegawai'],
            ['pengajuan', 'id_pengajuan'],
            ['pengajuan_logs', 'id'],
            ['site_visits', 'id'],
            ['template_dokumens', 'id'],
            ['testimoni', 'id_testimoni'],
            ['tim_kegiatan', 'id_tim'],
        ];
    }

    private function ensureAutoIncrementPrimary(string $table, string $column): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $metadata = DB::selectOne(
            'select column_key, extra from information_schema.columns where table_schema = database() and table_name = ? and column_name = ?',
            [$table, $column],
        );

        if (! $metadata) {
            return;
        }

        $hasPrimaryKey = strtoupper((string) $metadata->column_key) === 'PRI';
        $hasAutoIncrement = str_contains(strtolower((string) $metadata->extra), 'auto_increment');

        if ($hasPrimaryKey && $hasAutoIncrement) {
            return;
        }

        $qualifiedTable = str_replace('`', '``', $table);
        $qualifiedColumn = str_replace('`', '``', $column);

        if (! $hasPrimaryKey) {
            DB::statement("alter table `{$qualifiedTable}` modify `{$qualifiedColumn}` bigint unsigned not null auto_increment, add primary key (`{$qualifiedColumn}`)");

            return;
        }

        DB::statement("alter table `{$qualifiedTable}` modify `{$qualifiedColumn}` bigint unsigned not null auto_increment");
    }
};
