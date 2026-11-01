<?php

namespace Tests\Unit;

use App\Support\PhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PhoneNumberTest extends TestCase
{
    #[DataProvider('valid')]
    public function test_valid_numbers_are_normalized_to_e164(string $input, string $expected): void
    {
        $this->assertSame($expected, PhoneNumber::normalize($input));
        $this->assertTrue(PhoneNumber::isValid($input));
    }

    #[DataProvider('invalid')]
    public function test_invalid_numbers_are_rejected(string $input): void
    {
        $this->assertNull(PhoneNumber::normalize($input));
        $this->assertFalse(PhoneNumber::isValid($input));
    }

    public static function valid(): array
    {
        return [
            'kz international'  => ['+7 701 123 45 67', '+77011234567'],
            'kz with 8'         => ['8 701 123 45 67', '+77011234567'],
            'kz 11 digits'      => ['87011234567', '+77011234567'],
            'kz 7 prefix'       => ['77011234567', '+77011234567'],
            'kz 10 digits'      => ['701 123 45 67', '+77011234567'],
            'kz with brackets'  => ['8 (701) 123-45-67', '+77011234567'],
            'kz 00 prefix'      => ['0077011234567', '+77011234567'],
            'kz 77x'            => ['+7 771 123 45 67', '+77711234567'],
            'kz 747'            => ['+7 747 123 45 67', '+77471234567'],
            'ru mobile'         => ['+7 912 345 67 89', '+79123456789'],
            'kg international'  => ['+996 555 123 456', '+996555123456'],
            'us international'  => ['+1 202 555 0123', '+12025550123'],
        ];
    }

    public static function invalid(): array
    {
        return [
            'almaty landline'   => ['+7 727 123 45 67'],
            'atyrau landline'   => ['+7 7122 12 34 56'],
            'kz 8xx'            => ['+7 801 123 45 67'],
            'kz 71x'            => ['+7 710 123 45 67'],
            'too short'         => ['+7 701 123 45'],
            'too long'          => ['+7 701 123 45 678'],
            'letters'           => ['+7 701 ABC 45 67'],
            'double plus'       => ['++77011234567'],
            'plus in middle'    => ['7+7011234567'],
            'country code 0'    => ['+0 701 123 45 67'],
            'too short intl'    => ['+12345'],
            'too long intl'     => ['+1234567890123456'],
            'empty'             => [''],
            'spaces only'       => ['   '],
            'plus only'         => ['+'],
            'text'              => ['abc'],
            '9 digits'          => ['701123456'],
        ];
    }
}
