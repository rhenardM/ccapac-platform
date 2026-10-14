<?php

namespace App\Enum;

/**
 * Statut d'une projection. Jamais persisté : calculé à la volée par
 * Screening::getStatus() à partir de la date/heure (et de l'annulation
 * manuelle), pour ne jamais avoir de statut périmé.
 */
enum ScreeningStatus: string
{
    case UPCOMING = 'upcoming';
    case ONGOING = 'ongoing';
    case FINISHED = 'finished';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::UPCOMING => 'À venir',
            self::ONGOING => 'En cours',
            self::FINISHED => 'Terminée',
            self::CANCELLED => 'Annulée',
        };
    }
}
