<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Ұйымдастырушы функциялары тек админ бекіткен аккаунтқа ашық */
class EnsureApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isApproved()) {
            return response()->json([
                'message' => __('Аккаунтыңыз әлі бекітілмеген. Админ бекіткен соң ойын қоса аласыз.'),
                'code'    => 'pending_approval',
            ], 403);
        }

        return $next($request);
    }
}
