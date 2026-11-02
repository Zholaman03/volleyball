<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Ұйымдастырушы жазатын төлем мәліметі, мысалы "Kaspi: +7 701 123 45 67 (Ерлан А.)".
            // Ойыншыға тек тіркелгеннен кейін көрсетіледі.
            $table->string('payment_info', 255)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('payment_info');
        });
    }
};
