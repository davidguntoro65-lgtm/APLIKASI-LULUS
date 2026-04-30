<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class AppSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            'school_name' => 'SMKN 1 Wonogiri',
            'academic_year' => '2025/2026',
            'announcement_date' => '2026-05-05 10:00:00',
            'signature_path' => 'signatures/headmaster.png',
            'attribution' => 'Created by: TIM IT SKANSAGIRI | Powered by: Joben Enterprise',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
