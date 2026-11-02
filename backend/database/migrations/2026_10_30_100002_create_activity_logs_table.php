<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Одит лог: кой потребител какво е направил и кога.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();            // напр. tool.created, tool.approved, auth.login
            $table->nullableMorphs('subject');            // обектът, върху който е действието (напр. Tool #5)
            $table->string('description');                // четим текст за админ панела
            $table->json('properties')->nullable();       // допълнителни данни (напр. причина за отказ)
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
