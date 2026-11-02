<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // active — ойында, waitlist — күту тізімінде, cancelled — бас тартты (төлемі бар болса, қайтару үшін сақталады)
            $table->string('status', 12)->default('active')->after('paid')->index();
            // Ойыншының жеке бас тарту сілтемесі: /cancel/<token>. Аккаунтсыз бас тартуға арналған
            $table->string('cancel_token', 40)->nullable()->unique()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('cancel_token');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropUnique(['cancel_token']);
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'cancel_token', 'cancelled_at']);
        });
    }
};
