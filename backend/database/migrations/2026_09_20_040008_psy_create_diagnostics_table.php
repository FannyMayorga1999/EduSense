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
        Schema::create('psy_diagnostics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('std_students')->cascadeOnDelete();
            $table->foreignId('nee_category_id')->nullable()->constrained('psy_nee_categories')->nullOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('severity', 20)->default('moderate');
            $table->foreignId('detected_by')->nullable()->constrained('sys_users')->nullOnDelete();
            $table->date('detected_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psy_diagnostics');
    }
};
