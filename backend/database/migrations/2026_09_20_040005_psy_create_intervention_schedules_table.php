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
        Schema::create('psy_intervention_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('activity_id')->constrained('psy_activities')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('aca_subjects')->nullOnDelete();
            $table->date('scheduled_date');
            $table->string('status', 20)->default('pending');
            $table->text('progress_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psy_intervention_schedules');
    }
};
