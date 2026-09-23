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
        Schema::create('sys_permission_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_id')->constrained('sys_permissions')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('sys_roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['permission_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sys_permission_role');
    }
};
