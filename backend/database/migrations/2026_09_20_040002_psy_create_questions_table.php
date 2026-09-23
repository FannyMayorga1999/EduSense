<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('psy_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained('psy_surveys')->cascadeOnDelete();
            $table->text('statement');
            $table->unsignedInteger('alert_weight')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psy_questions');
    }
};
