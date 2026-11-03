<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'user:make-admin {email : Бар ұйымдастырушының email-і}';

    protected $description = 'Қолданушыны админ етеді (және бекітілген деп белгілейді)';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('Бұл email-мен қолданушы табылмады. Алдымен сайтта тіркеліңіз.');

            return self::FAILURE;
        }

        $user->forceFill(['is_admin' => true, 'approved_at' => $user->approved_at ?? now()])->save();
        $this->info("{$user->email} енді админ.");

        return self::SUCCESS;
    }
}
