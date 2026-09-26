<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Base controller with an standardized API envelope used by every module.
 */
abstract class Controller
{
    /**
     * Paginates a query honoring the `page` (index) and `per_page` (limit)
     * query parameters. A non-positive limit returns every row while keeping
     * the Laravel paginator shape.
     */
    protected function paginateQuery(Request $request, Builder $query, int $default = 15, int $max = 500): LengthAwarePaginator
    {
        $limit = $request->integer('per_page', $default);

        if ($limit <= 0) {
            $items = $query->get();
            $total = $items->count();

            return new LengthAwarePaginator($items, $total, max($total, 1), 1, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);
        }

        return $query->paginate(min($limit, $max));
    }

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
