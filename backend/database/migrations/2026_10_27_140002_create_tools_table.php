<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            // Кой потребител е добавил инструмента
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name')->unique();
            $table->string('url', 2048);
            $table->string('documentation_url', 2048)->nullable();
            $table->longText('documentation')->nullable(); // markdown
            $table->text('description');
            $table->text('usage');                         // Как се използва
            $table->text('examples')->nullable();          // Реални примери
            $table->json('example_links')->nullable();     // Линкове към примери
            // Полета за бъдещи разширения
            $table->string('video_url', 2048)->nullable();
            $table->string('difficulty')->nullable();      // beginner / intermediate / advanced
            $table->timestamps();
        });

        Schema::create('tool_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->timestamps();
        });

        // Свързващи (pivot) таблици за връзки "много към много"
        Schema::create('category_tool', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->primary(['category_id', 'tool_id']);
        });

        Schema::create('role_tool', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'tool_id']);
        });

        Schema::create('tag_tool', function (Blueprint $table) {
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_id')->constrained()->cascadeOnDelete();
            $table->primary(['tag_id', 'tool_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tag_tool');
        Schema::dropIfExists('role_tool');
        Schema::dropIfExists('category_tool');
        Schema::dropIfExists('tool_images');
        Schema::dropIfExists('tools');
    }
};
