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
        Schema::create('aca_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('aca_subjects')->nullOnDelete();
            $table->date('attendance_date');
            $table->string('status', 20)->default('present');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'attendance_date', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aca_attendance');
    }
};
