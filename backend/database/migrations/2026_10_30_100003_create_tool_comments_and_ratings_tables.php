<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Коментари и рейтинг (1–5 звезди) за инструментите.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('tool_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // от 1 до 5
            $table->timestamps();

            // Всеки потребител оценява един инструмент само веднъж (може да промени оценката си)
            $table->unique(['tool_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_ratings');
        Schema::dropIfExists('tool_comments');
    }
};
