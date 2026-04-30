<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI & Joben Enterprise
 */

use App\Http\Controllers\AdminController;
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
