<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 * SMKN 1 Wonogiri - Student Data Importer
 */

namespace App\Imports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StudentImport implements ToModel, WithHeadingRow, WithValidation
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        try {
            // Handle date conversion from Excel (Text or Serial Number)
            $birthDateStr = (string) $row['birth_date'];
            
            if (is_numeric($birthDateStr)) {
                $birthDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($birthDateStr);
            } else {
                // Try common Indonesian formats or standard ISO
                $birthDate = Carbon::parse($birthDateStr);
            }

            // Update if NISN exists, or create new
            return Student::updateOrCreate(
                ['nisn' => $row['nisn']],
                [
                    'name' => $row['name'],
                    'birth_date' => $birthDate->format('Y-m-d'),
                    'status_graduation' => (bool) $row['status'],
                    'class' => $row['class'] ?? 'N/A', // Keeping schema compatibility
                    'major' => $row['major'] ?? 'N/A',
                    'nik' => $row['nik'] ?? '0',       // Keeping schema compatibility
                ]
            );
        } catch (\Exception $e) {
            Log::error('Import error for NISN ' . $row['nisn'] . ': ' . $e->getMessage());
            return null;
        }
    }

    public function rules(): array
    {
        return [
            'nisn' => 'required',
            'name' => 'required',
            'birth_date' => 'required',
            'status' => 'required',
        ];
    }
}
