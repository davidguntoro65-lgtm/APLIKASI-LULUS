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
        Schema::create('students', function (Blueprint $男) {
            $男->id();
            $男->string('nisn')->unique();
            $男->string('nik')->unique();
            $男->string('name');
            $男->date('birth_date');
            $男->string('class');
            $男->string('major');
            $男->boolean('status_graduation')->default(false);
            $男->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
