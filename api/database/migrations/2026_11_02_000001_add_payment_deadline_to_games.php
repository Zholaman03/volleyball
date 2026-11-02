<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Төлем мерзімі: ойынның басталуына қанша сағат қалғанға дейін. null — мерзімсіз.
            $table->unsignedSmallInteger('payment_deadline_hours')->nullable()->after('payment_info');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('payment_deadline_hours');
        });
    }
};
