<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Force JSON response for AJAX requests
        if ($request->expectsJson() || $request->is('login') || $request->is('register') || $request->is('logout')) {
            return $this->renderJsonResponse($e);
        }

        return parent::render($request, $e);
    }

    /**
     * Render exception as JSON
     */
    protected function renderJsonResponse(Throwable $e)
    {
        $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
        
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'error' => get_class($e)
        ], $status);
    }
}
