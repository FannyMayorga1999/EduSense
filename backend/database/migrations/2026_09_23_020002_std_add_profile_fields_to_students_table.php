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
        Schema::table('std_students', function (Blueprint $table) {
            $table->string('document_type', 20)->nullable()->default('cedula');
            $table->string('gender', 20)->nullable();
            $table->string('representative_name', 160)->nullable();
            $table->string('representative_relation', 100)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email', 150)->nullable();
            $table->string('home_address', 255)->nullable();
            $table->string('laterality', 20)->nullable();
            $table->text('medical_conditions')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('std_students', function (Blueprint $table) {
            $table->dropColumn([
                'document_type',
                'gender',
                'representative_name',
                'representative_relation',
                'contact_phone',
                'contact_email',
                'home_address',
                'laterality',
                'medical_conditions',
            ]);
        });
    }
};
