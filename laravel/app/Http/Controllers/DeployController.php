<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 *
 * "Klik-Sekali" Deploy / Setup endpoint.
 *
 * Why this exists:
 *   On shared cPanel hosting, the operator does NOT have easy access to a
 *   real terminal to run `php artisan storage:link` and `php artisan migrate`.
 *   This controller exposes those two operations behind a single token-guarded
 *   HTTP endpoint so a fresh deployment can be initialised by simply visiting:
 *
 *       https://<your-domain>/api/deploy/setup?token=<DEPLOY_TOKEN>
 *
 *   The token is read from `DEPLOY_TOKEN` in `.env`. If the variable is not
 *   set, the endpoint refuses to run — meaning a forgotten production deploy
 *   cannot be triggered by a random visitor.
 *
 * What it does, in order:
 *   1. `php artisan migrate --force`   — apply any pending DB migrations
 *   2. `php artisan storage:link`      — create the public/storage symlink so
 *                                         uploaded logos / principal photos
 *                                         are served at /storage/...
 *   3. `php artisan config:clear`      — drop any stale cached config from a
 *                                         previous host (so the new APP_URL
 *                                         takes effect immediately)
 *   4. `php artisan route:clear`       — same idea, for routes
 */

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class DeployController extends Controller
{
    public function setup(Request $request)
    {
        $expected = env('DEPLOY_TOKEN');

        if (empty($expected)) {
            return response()->json([
                'success' => false,
                'message' => 'DEPLOY_TOKEN belum di-set di file .env. ' .
                             'Tambahkan baris: DEPLOY_TOKEN=rahasia-anda lalu coba lagi.',
            ], 503);
        }

        $given = $request->query('token') ?? $request->input('token');

        if (!is_string($given) || !hash_equals($expected, $given)) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid.',
            ], 401);
        }

        $report = [];

        $steps = [
            'migrate'      => ['migrate',     ['--force' => true]],
            'storage:link' => ['storage:link', []],
            'config:clear' => ['config:clear', []],
            'route:clear'  => ['route:clear',  []],
        ];

        foreach ($steps as $label => [$cmd, $args]) {
            try {
                $code   = Artisan::call($cmd, $args);
                $output = trim(Artisan::output());
                $report[$label] = [
                    'ok'     => $code === 0,
                    'output' => $output ?: 'OK',
                ];
            } catch (\Throwable $e) {
                $report[$label] = [
                    'ok'     => false,
                    'output' => $e->getMessage(),
                ];
            }
        }

        $allOk = collect($report)->every(fn ($r) => $r['ok'] === true);

        return response()->json([
            'success' => $allOk,
            'message' => $allOk
                ? 'Setup selesai. Aplikasi siap digunakan di domain ini.'
                : 'Setup selesai dengan beberapa peringatan — periksa detail di bawah.',
            'app_url' => config('app.url'),
            'steps'   => $report,
        ], $allOk ? 200 : 207);
    }

    /**
     * Lightweight health-check — handy for confirming a fresh deploy is alive
     * before running the heavier setup endpoint above.
     */
    public function health()
    {
        return response()->json([
            'success'     => true,
            'app_url'     => config('app.url'),
            'environment' => app()->environment(),
            'php'         => PHP_VERSION,
            'laravel'     => app()->version(),
            'time'        => now()->toIso8601String(),
        ]);
    }
}
