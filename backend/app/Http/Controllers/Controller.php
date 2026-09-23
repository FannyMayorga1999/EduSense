<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

/**
 * Base controller with an standardized API envelope used by every module.
 */
abstract class Controller
{
    /**
     * Builds a successful JSON response.
     */
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Builds an error JSON response.
     */
    protected function error(string $message = 'Error', int $status = 400, mixed $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
