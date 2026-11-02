<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Одобрение на инструментите: всеки нов инструмент чака преглед от администратор (owner).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table->string('status')->default('pending')->index()->after('difficulty'); // pending / approved / rejected
            $table->foreignId('reviewed_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->string('rejection_reason', 500)->nullable()->after('reviewed_at');
        });

        // Инструментите отпреди тази миграция са вече видими за всички, затова ги маркираме като одобрени.
        DB::table('tools')->update(['status' => 'approved', 'reviewed_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['status', 'reviewed_at', 'rejection_reason']);
        });
    }
};
