<?php

use App\Models\SiteSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        SiteSetting::set('visitor_count_offset', 1200);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
