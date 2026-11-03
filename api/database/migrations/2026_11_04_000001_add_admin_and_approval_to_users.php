<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
            // Админ бекіткен уақыт. null — бекітуді күтіп тұр, ойын қоса алмайды
            $table->timestamp('approved_at')->nullable()->after('is_admin');
        });

        // Бұрыннан бар ұйымдастырушылар құлыпталып қалмауы үшін бекітілген болып саналады
        DB::table('users')->update(['approved_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_admin', 'approved_at']);
        });
    }
};
