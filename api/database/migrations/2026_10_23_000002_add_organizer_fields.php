<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Ойынды қай ұйымдастырушы құрды
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('registrations', function (Blueprint $table) {
            // Ұйымдастырушы қолмен белгілейтін төлем статусы
            $table->boolean('paid')->default(false)->after('gender');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('paid');
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
