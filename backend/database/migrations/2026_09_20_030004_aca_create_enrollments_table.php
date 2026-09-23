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
        Schema::create('aca_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('aca_courses')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('aca_academic_terms')->cascadeOnDelete();
            $table->string('status', 20)->default('active');
            $table->date('enrolled_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'term_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aca_enrollments');
    }
};
