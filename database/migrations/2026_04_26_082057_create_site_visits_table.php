<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('site_visits')) {
            Schema::create('site_visits', function (Blueprint $table) {
                $table->id();
                $table->string('ip_address', 45);
                $table->string('user_agent')->nullable();
                $table->string('page_path')->nullable();
                $table->timestamp('visited_at')->useCurrent();

                $table->index('visited_at');
                $table->index('ip_address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_visits');
    }
};
