<?php

namespace App\Enum;

/** Portée d'un programme : produit par le Grand Tambour ou par un partenaire. */
enum ProgramScope: string
{
    case INTERNE = 'interne';
    case EXTERNE = 'externe';

    public function label(): string
    {
        return match ($this) {
            self::INTERNE => 'Interne (Grand Tambour)',
            self::EXTERNE => 'Externe (partenaire)',
        };
    }

    /** @return array<string,string> label => value (pour EasyAdmin/validation) */
    public static function choices(): array
    {
        return [
            self::INTERNE->label() => self::INTERNE->value,
            self::EXTERNE->label() => self::EXTERNE->value,
        ];
    }
}
