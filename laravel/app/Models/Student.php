<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'nisn',
        'nik',
        'name',
        'birth_date',
        'class',
        'major',
        'status_graduation',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'status_graduation' => 'boolean',
    ];

    /**
     * Get the grades associated with the student.
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
