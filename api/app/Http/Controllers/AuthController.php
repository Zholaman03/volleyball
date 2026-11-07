<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\WhatsAppGroupUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ], [
            'name.required'     => __('Атыңызды жазыңыз.'),
            'email.required'    => __('Email жазыңыз.'),
            'email.email'       => __('Email дұрыс емес.'),
            'email.unique'      => __('Бұл email тіркелген.'),
            'password.required' => __('Құпия сөзді жазыңыз.'),
            'password.min'      => __('Құпия сөз кемінде 8 таңбадан тұруы керек.'),
        ]);

        $user = User::create($data); // password 'hashed' cast арқылы хэштеледі

        return $this->tokenResponse($user, 201);
    }

    /** POST /api/auth/login */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required'    => __('Email жазыңыз.'),
            'email.email'       => __('Email дұрыс емес.'),
            'password.required' => __('Құпия сөзді жазыңыз.'),
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('Email немесе құпия сөз қате.')],
            ]);
        }

        return $this->tokenResponse($user);
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userData($request->user()));
    }

    /** PUT /api/auth/profile — WhatsApp группа сілтемесі (бос жіберсе, өшіріледі) */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->merge([
            'whatsapp_group_url' => trim((string) $request->input('whatsapp_group_url', '')) ?: null,
        ]);

        $data = $request->validate([
            'whatsapp_group_url' => ['nullable', 'string', 'max:255', new WhatsAppGroupUrl],
        ]);

        $user = $request->user();
        $user->update(['whatsapp_group_url' => $data['whatsapp_group_url']]);

        return response()->json($this->userData($user));
    }

    /** POST /api/auth/logout */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user'  => $this->userData($user),
        ], $status);
    }

    private function userData(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'is_admin' => (bool) $user->is_admin,
            'approved' => $user->isApproved(),
            'whatsapp_group_url' => $user->whatsapp_group_url,
        ];
    }
}
