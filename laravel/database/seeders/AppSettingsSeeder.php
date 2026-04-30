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
            'school_name'        => 'SMKN 1 Wonogiri',
            'school_npsn'        => '20311234',
            'school_address'     => 'Jl. Jend. Sudirman No. 123, Wonogiri',
            'principal_name'     => 'Drs. Supriyanto, M.Pd.',
            'academic_year'      => '2025/2026',
            'announcement_date'  => '2026-05-15',
            'announcement_time'  => '16:00',
            'maintenance_mode'   => '0',
            'school_logo'        => null,
            'principal_photo'    => null,
            'motivation_message' => 'Selamat kepada seluruh siswa-siswi SMKN 1 Wonogiri. Teruslah berkarya, berinovasi, dan menjadi generasi unggul yang membanggakan.',
            'signature_path'     => 'signatures/headmaster.png',
            'attribution'        => 'Created by: TIM IT SKANSAGIRI | Powered by: Joben Enterprise',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
