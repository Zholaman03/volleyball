<?php

namespace Tests\Unit;

use App\Support\DisplayName;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class DisplayNameTest extends TestCase
{
    #[DataProvider('names')]
    public function test_short(string $input, string $expected): void
    {
        $this->assertSame($expected, DisplayName::short($input));
    }

    public static function names(): array
    {
        return [
            'аты ғана'            => ['Айдос', 'Айдос'],
            'аты және тегі'       => ['Айдос Нұрлан', 'Айдос Н.'],
            'үш сөз'              => ['Айдос Нұрлан Ерболұлы', 'Айдос Н.'],
            'артық бос орындар'   => ['  Айдос   нұрлан ', 'Айдос Н.'],
            'кіші әріппен'        => ['асем қайрат', 'асем Қ.'],
            'латын'               => ['John Smith', 'John S.'],
            'бос'                 => ['   ', ''],
            'ұзын ат кесіледі'    => [str_repeat('а', 40).' Б', str_repeat('а', 30).' Б.'],
        ];
    }
}
