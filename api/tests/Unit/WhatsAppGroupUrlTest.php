<?php

namespace Tests\Unit;

use App\Rules\WhatsAppGroupUrl;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class WhatsAppGroupUrlTest extends TestCase
{
    public static function cases(): array
    {
        return [
            'дұрыс'              => ['https://chat.whatsapp.com/KjH8s7dFg2LmN9pQrStUvW', true],
            'параметрмен'        => ['https://chat.whatsapp.com/KjH8s7dFg2LmN9pQrStUvW?mode=ems_copy_t', true],
            'http'               => ['http://chat.whatsapp.com/KjH8s7dFg2LmN9pQrStUvW', false],
            'басқа сайт'         => ['https://evil.example/chat.whatsapp.com/KjH8s7dFg2LmN9pQrStUvW', false],
            'жалған субдомен'    => ['https://chat.whatsapp.com.evil.example/KjH8s7dFg2LmN9pQrStUvW', false],
            'wa.me'              => ['https://wa.me/77011234567', false],
            'код жоқ'            => ['https://chat.whatsapp.com/', false],
            'тым қысқа код'      => ['https://chat.whatsapp.com/abc', false],
            'бос орынмен'        => ['https://chat.whatsapp.com/KjH8s7dFg2LmN9pQrStUvW x', false],
        ];
    }

    #[DataProvider('cases')]
    public function test_validates_group_url(string $url, bool $valid): void
    {
        $this->assertSame($valid, WhatsAppGroupUrl::isValid($url));
    }
}
