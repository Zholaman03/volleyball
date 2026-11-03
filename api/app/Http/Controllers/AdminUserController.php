<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

/** Админ: ұйымдастырушыларды бекіту / бекітуді алып тастау */
class AdminUserController extends Controller
{
    /** GET /api/admin/users — күтіп тұрғандар бірінші */
    public function index(): JsonResponse
    {
        $users = User::where('is_admin', false)
            ->withCount('games')
            ->orderByRaw('approved_at IS NOT NULL') // бекітілмегендер жоғарыда
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $users->map(fn (User $u) => $this->payload($u))]);
    }

    /** POST /api/admin/users/{user}/approve */
    public function approve(User $user): JsonResponse
    {
        if (! $user->isApproved()) {
            $user->forceFill(['approved_at' => now()])->save();
        }

        return response()->json(['data' => $this->payload($user)]);
    }

    /** POST /api/admin/users/{user}/revoke — ойындары қалады, бірақ жаңа ойын қоса алмайды */
    public function revoke(User $user): JsonResponse
    {
        if ($user->is_admin) {
            return response()->json(['message' => 'Админнің бекітуін алып тастауға болмайды.'], 422);
        }

        $user->forceFill(['approved_at' => null])->save();

        return response()->json(['data' => $this->payload($user)]);
    }

    private function payload(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'approved'    => $user->isApproved(),
            'games_count' => $user->games_count ?? $user->games()->count(),
            'created_at'  => $user->created_at?->toIso8601String(),
        ];
    }
}
