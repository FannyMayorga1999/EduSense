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
        Schema::create('aca_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('aca_subjects')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('aca_academic_terms')->cascadeOnDelete();
            $table->decimal('score', 5, 2);
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('sys_users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'subject_id', 'term_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aca_grades');
    }
};
