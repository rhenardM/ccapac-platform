<?php

namespace App\Enum;

/** Statut d'un billet numérique de cinémathèque. Persisté (contrairement à ScreeningStatus). */
enum TicketStatus: string
{
    case ACTIVE = 'active';
    case USED = 'used';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Actif',
            self::USED => 'Utilisé',
            self::CANCELLED => 'Annulé',
        };
    }

    /** @return array<string,string> label => value (pour EasyAdmin/validation) */
    public static function choices(): array
    {
        return [
            self::ACTIVE->label() => self::ACTIVE->value,
            self::USED->label() => self::USED->value,
            self::CANCELLED->label() => self::CANCELLED->value,
        ];
    }
}
