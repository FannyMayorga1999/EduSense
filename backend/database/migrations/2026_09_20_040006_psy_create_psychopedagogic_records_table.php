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
        Schema::create('psy_psychopedagogic_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('interventions_summary')->nullable();
            $table->foreignId('registered_by')->nullable()->constrained('sys_users')->nullOnDelete();
            $table->date('recorded_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psy_psychopedagogic_records');
    }
};
