<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Accept-Language: ru болса, жауап хабарламалары орысша (бастапқы тіл — қазақша) */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        if (str_starts_with(strtolower((string) $request->header('Accept-Language')), 'ru')) {
            app()->setLocale('ru');
        }

        return $next($request);
    }
}
