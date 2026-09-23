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
        Schema::create('psy_evaluation_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('psy_questions')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->nullable()->constrained('sys_users')->nullOnDelete();
            $table->unsignedTinyInteger('option_value');
            $table->text('observation')->nullable();
            $table->date('application_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psy_evaluation_responses');
    }
};
