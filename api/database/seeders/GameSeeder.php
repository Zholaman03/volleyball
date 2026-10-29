<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        // Демо ұйымдастырушылар (құпия сөз: password)
        $organizers = [
            'erlan'   => User::firstOrCreate(['email' => 'erlan@example.com'], ['name' => 'Ерлан', 'password' => 'password']),
            'aigerim' => User::firstOrCreate(['email' => 'aigerim@example.com'], ['name' => 'Айгерім', 'password' => 'password']),
        ];

        $today = today()->toDateString();

        $games = [
            [
                'organizer' => 'erlan',
                'format' => 'mixed', 'start_time' => '22:00:00', 'duration_minutes' => 120,
                'venue_name' => 'Arena Sport', 'venue_address' => 'Абай к-сі 12',
                'price' => 1800, 'teams_count' => 3, 'capacity' => 18,
                'male' => 9, 'female' => 9,
            ],
            [
                'organizer' => 'aigerim',
                'format' => '4_2', 'start_time' => '20:00:00', 'duration_minutes' => 120,
                'venue_name' => 'Нұр спортзалы', 'venue_address' => 'Satpayev к-сі 45',
                'price' => 1800, 'teams_count' => 2, 'capacity' => 12,
                'male' => 5, 'female' => 2,
            ],
            [
                'organizer' => 'aigerim',
                'format' => 'girls', 'start_time' => '19:00:00', 'duration_minutes' => 90,
                'venue_name' => 'Олимп', 'venue_address' => 'Тәуелсіздік д-лы 7',
                'price' => 1500, 'teams_count' => 3, 'capacity' => 18,
                'male' => 0, 'female' => 11,
            ],
            [
                'organizer' => 'erlan',
                'format' => 'boys', 'start_time' => '21:00:00', 'duration_minutes' => 120,
                'venue_name' => 'Arena Sport', 'venue_address' => 'Абай к-сі 12',
                'price' => 2000, 'teams_count' => 2, 'capacity' => 12,
                'male' => 12, 'female' => 0,
            ],
        ];

        foreach ($games as $row) {
            $organizer = $organizers[$row['organizer']];
            $male = $row['male'];
            $female = $row['female'];
            unset($row['organizer'], $row['male'], $row['female']);

            $game = Game::create($row + [
                'play_date'      => $today,
                'user_id'        => $organizer->id,
                'organizer_name' => $organizer->name,
            ]);

            for ($i = 1; $i <= $male; $i++) {
                $game->registrations()->create([
                    'name'   => "Ойыншы ұл {$i}",
                    'phone'  => sprintf('+7701%03d%04d', $game->id, $i),
                    'gender' => 'male',
                    'paid'   => $i % 2 === 0,
                ]);
            }
            for ($i = 1; $i <= $female; $i++) {
                $game->registrations()->create([
                    'name'   => "Ойыншы қыз {$i}",
                    'phone'  => sprintf('+7702%03d%04d', $game->id, $i),
                    'gender' => 'female',
                    'paid'   => $i % 2 === 0,
                ]);
            }
        }
    }
}
