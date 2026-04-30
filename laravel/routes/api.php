<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI & Joben Enterprise
 */

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DeployController;
use App\Http\Controllers\GraduationController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

// Main Endpoint for Graduation Check
Route::post('/check-status', [GraduationController::class, 'checkStatus'])
    ->middleware('throttle:5,1');

// Public School Info
Route::get('/school-info', [PublicController::class, 'schoolInfo']);

// Admin Panel Endpoints
Route::prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'index']);
    Route::get('/settings', [AdminController::class, 'getSettings']);
    Route::get('/students', [AdminController::class, 'students']);
    Route::post('/students/{id}', [AdminController::class, 'updateStudent']);
    Route::post('/settings', [AdminController::class, 'updateSettings']);
    Route::post('/import', [AdminController::class, 'importExcel']);
    Route::post('/reset-tracking/{id?}', [AdminController::class, 'resetTracking']);
});

/*
|--------------------------------------------------------------------------
| One-click Deployment endpoints (cPanel-friendly)
|--------------------------------------------------------------------------
| These let the operator finish a fresh install without opening a terminal:
|   GET  /api/deploy/health                   → liveness + APP_URL check
|   GET  /api/deploy/setup?token=DEPLOY_TOKEN → run migrate + storage:link +
|                                                config/route clear in one go
| The setup endpoint is rate-limited so the token cannot be brute-forced.
*/
Route::get('/deploy/health', [DeployController::class, 'health']);
Route::match(['get', 'post'], '/deploy/setup', [DeployController::class, 'setup'])
    ->middleware('throttle:5,1');
