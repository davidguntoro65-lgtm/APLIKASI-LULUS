<?php
/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 * Admin Dashboard System
 */

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Setting;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Get All Students with Search
     */
    public function students(Request $request)
    {
        $query = Student::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('name', 'asc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }

    /**
     * Update Individual Student Status
     */
    public function updateStudent(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'status_graduation' => 'required|boolean',
            'class' => 'required|string',
            'major' => 'required|string',
        ]);

        $student = Student::findOrFail($id);
        $student->update($request->only(['name', 'status_graduation', 'class', 'major']));

        return response()->json([
            'success' => true, 
            'message' => 'Data siswa berhasil diperbarui',
            'student' => $student
        ]);
    }

    /**
     * Import Excel with Feedback
     */
    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls'
        ]);

        try {
            $import = new \App\Imports\StudentImport;
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
            
            return response()->json([
                'success' => true,
                'message' => 'Import selesai!',
                'stats' => [
                    'total' => Student::count(),
                    'last_import_time' => now()->toDateTimeString()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Dashboard Stats
     */
    public function index()
    {
        $stats = [
            'total' => Student::count(),
            'lulus' => Student::where('status_graduation', true)->count(),
            'tidakLulus' => Student::where('status_graduation', false)->count(),
            'checked' => Student::whereNotNull('viewed_at')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get All Settings
     */
    public function getSettings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        
        return response()->json([
            'success' => true,
            'data' => [
                'announcement_date' => $settings['announcement_date'] ?? '2026-05-15',
                'announcement_time' => $settings['announcement_time'] ?? '16:00',
                'maintenance_mode' => ($settings['maintenance_mode'] ?? '0') == '1',
                'school_name' => $settings['school_name'] ?? 'SMKN 1 Wonogiri',
                'school_npsn' => $settings['school_npsn'] ?? '20311234',
                'school_address' => $settings['school_address'] ?? 'Jl. Jend. Sudirman No. 123, Wonogiri',
                'principal_name' => $settings['principal_name'] ?? 'Drs. Supriyanto, M.Pd.',
                'school_logo' => $settings['school_logo'] ?? null,
            ]
        ]);
    }

    /**
     * Update Portal Settings
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'announcement_date' => 'nullable|date',
            'announcement_time' => 'nullable',
            'school_name' => 'nullable|string',
            'school_npsn' => 'nullable|string',
            'school_address' => 'nullable|string',
            'principal_name' => 'nullable|string',
            'maintenance_mode' => 'nullable|boolean',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        $data = $request->except('logo');

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if ($request->hasFile('logo')) {
            // Delete old logo
            $oldLogo = Setting::where('key', 'school_logo')->first();
            if ($oldLogo && $oldLogo->value) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldLogo->value);
            }

            $path = $request->file('logo')->store('branding', 'public');
            Setting::updateOrCreate(['key' => 'school_logo'], ['value' => $path]);
        }

        return response()->json(['success' => true, 'message' => 'Pengaturan berhasil diperbarui']);
    }

    /**
     * Reset Student View Status
     */
    public function resetTracking($id = null)
    {
        if ($id) {
            Student::where('id', $id)->update(['viewed_at' => null]);
        } else {
            Student::query()->update(['viewed_at' => null]);
        }

        return response()->json(['success' => true, 'message' => 'Tracking data reset']);
    }
}
