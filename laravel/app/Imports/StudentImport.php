<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 * SMKN 1 Wonogiri - Student Data Importer
 *
 * Required Excel columns (heading row):
 *   nisn | name | birth_place | birth_date | class | major | status
 *
 *   - birth_date may be a real Excel date cell, a numeric serial,
 *     ISO (YYYY-MM-DD), Indonesian (DD-MM-YYYY, DD/MM/YYYY) or text
 *     (e.g. "26 Mei 2008").
 *   - status: 1 / 0  (or "lulus" / "tidak lulus").
 */

namespace App\Imports;

use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class StudentImport implements ToModel, WithHeadingRow, WithValidation
{
    /** Indonesian month token → numeric month. */
    private const ID_MONTH_LOOKUP = [
        'januari' => 1, 'jan' => 1,
        'februari' => 2, 'feb' => 2, 'pebruari' => 2,
        'maret' => 3, 'mar' => 3,
        'april' => 4, 'apr' => 4,
        'mei' => 5,
        'juni' => 6, 'jun' => 6,
        'juli' => 7, 'jul' => 7,
        'agustus' => 8, 'agt' => 8, 'agu' => 8,
        'september' => 9, 'sep' => 9, 'sept' => 9,
        'oktober' => 10, 'okt' => 10, 'oct' => 10,
        'november' => 11, 'nov' => 11,
        'desember' => 12, 'des' => 12, 'dec' => 12,
    ];

    public function model(array $row)
    {
        try {
            $birthDate = $this->parseBirthDate($row['birth_date'] ?? null);
            if ($birthDate === null) {
                throw new \RuntimeException('Format tanggal lahir tidak dikenali.');
            }

            return Student::updateOrCreate(
                ['nisn' => (string) $row['nisn']],
                [
                    'name'              => trim((string) $row['name']),
                    'birth_place'       => trim((string) ($row['birth_place'] ?? '')),
                    'birth_date'        => $birthDate->format('Y-m-d'),
                    'class'             => trim((string) ($row['class'] ?? 'N/A')),
                    'major'             => trim((string) ($row['major'] ?? 'N/A')),
                    'status_graduation' => $this->parseStatus($row['status'] ?? null),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Import error for NISN ' . ($row['nisn'] ?? '?') . ': ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Robust date parser — Excel serial, ISO, Indonesian d-m-Y, d/m/Y or "26 Mei 2008".
     */
    private function parseBirthDate($raw): ?Carbon
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (is_numeric($raw)) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $raw));
        }

        $value = trim((string) $raw);

        // Indonesian month names → swap to a numeric month so Carbon understands.
        $normalised = preg_replace_callback(
            '/\b([A-Za-z]+)\b/u',
            function ($m) {
                $token = mb_strtolower($m[1]);
                return self::ID_MONTH_LOOKUP[$token] ?? $m[1];
            },
            $value
        );

        $formats = [
            'Y-m-d', 'Y/m/d',
            'd-m-Y', 'd/m/Y', 'd.m.Y',
            'j-n-Y', 'j/n/Y',
            'd-m-y', 'd/m/y',
            'j n Y', 'd m Y',
        ];

        foreach ($formats as $fmt) {
            try {
                $parsed = Carbon::createFromFormat($fmt, $normalised);
                if ($parsed !== false) {
                    return $parsed->startOfDay();
                }
            } catch (\Throwable $_) {
                // try next format
            }
        }

        try {
            return Carbon::parse($normalised)->startOfDay();
        } catch (\Throwable $_) {
            return null;
        }
    }

    private function parseStatus($raw): bool
    {
        if (is_bool($raw))   return $raw;
        if (is_numeric($raw)) return (int) $raw === 1;

        $token = mb_strtolower(trim((string) $raw));
        return in_array($token, ['1', 'true', 'lulus', 'l', 'yes', 'ya'], true);
    }

    public function rules(): array
    {
        return [
            'nisn'        => 'required',
            'name'        => 'required',
            'birth_place' => 'required',
            'birth_date'  => 'required',
            'class'       => 'required',
            'major'       => 'required',
            'status'      => 'required',
        ];
    }
}
