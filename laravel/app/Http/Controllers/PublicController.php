<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 *
 * Public-facing endpoints (school identity, countdown, branding).
 *
 * Multi-domain note:
 *   This controller never hard-codes a hostname. Every asset URL is built via
 *   {@see \App\Models\Setting::publicUrl()} which delegates to
 *   `Storage::disk('public')->url(...)` — that helper resolves to whatever
 *   `APP_URL` (in `.env`) points to, so deploying from Replit to a cPanel
 *   shared host or a custom domain only requires updating `.env` (and running
 *   the one-click setup at `/api/deploy/setup` to (re)create the storage
 *   symlink). No code changes required.
 */

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Get School Information for Frontend
     */
    public function schoolInfo()
    {
        $settings = Setting::all()->pluck('value', 'key');
        $date = $settings['announcement_date'] ?? '2026-05-15';
        $time = $settings['announcement_time'] ?? '16:00';
        $fullDatetime = "$date $time";

        return response()->json([
            'success' => true,
            'data' => [
                'school_name'           => $settings['school_name']    ?? 'SMKN 1 Wonogiri',
                'school_npsn'           => $settings['school_npsn']    ?? '20311234',
                'school_address'        => $settings['school_address'] ?? 'Jl. Jend. Sudirman No. 123, Wonogiri',
                'school_logo'           => Setting::publicUrl($settings['school_logo']     ?? null),
                'principal_name'        => $settings['principal_name'] ?? 'Drs. Supriyanto, M.Pd.',
                'principal_photo'       => Setting::publicUrl($settings['principal_photo'] ?? null),
                'motivation_message'    => $settings['motivation_message']
                    ?? 'Selamat kepada seluruh siswa-siswi SMKN 1 Wonogiri. Teruslah berkarya, berinovasi, dan menjadi generasi unggul yang membanggakan.',
                'announcement_datetime' => \Carbon\Carbon::parse($fullDatetime)->toIso8601String(),
                'announcement_active'   => \Carbon\Carbon::parse($fullDatetime)->isPast(),
                'maintenance_mode'      => ($settings['maintenance_mode'] ?? '0') == '1',
            ]
        ]);
    }

    private function isAnnouncementActive($settings)
    {
        $date = $settings['announcement_date'] ?? '2026-05-15';
        $time = $settings['announcement_time'] ?? '16:00';

        $releaseDate = \Carbon\Carbon::parse("$date $time");
        return now()->greaterThanOrEqualTo($releaseDate);
    }
}
