<?php

namespace App\Modules\Administration\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Key/value platform settings (e.g. grade scale).
 */
class SettingController extends Controller
{
    /**
     * Lists the settings as a map.
     */
    public function index(): JsonResponse
    {
        return $this->success(Setting::all()->map(fn (Setting $setting) => [
            'key' => $setting->key,
            'value' => $setting->value,
        ]));
    }

    /**
     * Updates one setting.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['required', 'string'],
        ]);

        Setting::query()->updateOrCreate(['key' => $key], ['value' => $validated['value']]);

        return $this->success(message: 'Setting updated.');
    }
}
