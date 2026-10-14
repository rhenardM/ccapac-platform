<?php

namespace App\Enum;

/** Canal d'origine d'une inscription à une séance gratuite. */
enum RegistrationSource: string
{
    case ONLINE = 'online';
    case WALKIN = 'walkin';

    public function label(): string
    {
        return match ($this) {
            self::ONLINE => 'En ligne',
            self::WALKIN => 'Guichet (sur place)',
        };
    }

    /** @return array<string,string> label => value (pour EasyAdmin/validation) */
    public static function choices(): array
    {
        return [
            self::ONLINE->label() => self::ONLINE->value,
            self::WALKIN->label() => self::WALKIN->value,
        ];
    }
}
