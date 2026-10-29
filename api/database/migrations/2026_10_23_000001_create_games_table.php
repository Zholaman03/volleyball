<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            // mixed | girls | boys | 4_2 (4 ұл 2 қыз) | 2_4 (2 ұл 4 қыз)
            $table->string('format')->default('mixed');
            $table->date('play_date');
            $table->time('start_time');
            $table->unsignedSmallInteger('duration_minutes')->default(120);
            $table->string('venue_name');
            $table->string('venue_address');
            $table->unsignedInteger('price')->default(0); // теңге, адам басына
            $table->unsignedSmallInteger('teams_count');
            $table->unsignedSmallInteger('capacity'); // барлық орын саны (мысалы 18 немесе 12)
            $table->string('organizer_name');
            $table->timestamps();

            $table->index('play_date');
        });

        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            // male | female (аралас форматтарда қажет)
            $table->string('gender', 10)->nullable();
            $table->timestamps();

            $table->unique(['game_id', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('games');
    }
};
