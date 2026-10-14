<?php

namespace App\Enum;

/**
 * Paliers d'engagement de la collecte Grand Tambour (en USD).
 * Bornes inclusives ; max = null signifie « sans plafond ».
 */
enum ContributionTier: string
{
    case AMI_CITOYEN = 'ami_citoyen';
    case PARRAIN = 'parrain';
    case MECENE = 'mecene';
    case GRAND_MECENE = 'grand_mecene';
    case PARTENAIRE_FONDATEUR = 'partenaire_fondateur';
    case LIBRE = 'libre';

    /** @return string[] valeurs valides (pour la validation Choice). */
    public static function values(): array
    {
        return array_map(static fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::AMI_CITOYEN => 'Ami & Citoyen',
            self::PARRAIN => 'Parrain de Rayon / Collection',
            self::MECENE => 'Mécène Biblio-Librairie',
            self::GRAND_MECENE => 'Grand Mécène',
            self::PARTENAIRE_FONDATEUR => 'Partenaire Fondateur',
            self::LIBRE => 'Montant libre',
        };
    }

    public function min(): float
    {
        return match ($this) {
            self::AMI_CITOYEN => 1,
            self::PARRAIN => 5000,
            self::MECENE => 25000,
            self::GRAND_MECENE => 50000,
            self::PARTENAIRE_FONDATEUR => 100000,
            self::LIBRE => 1,
        };
    }

    public function max(): ?float
    {
        return match ($this) {
            self::AMI_CITOYEN => 4999,
            self::PARRAIN => 24999,
            self::MECENE => 49999,
            self::GRAND_MECENE => 99999,
            self::PARTENAIRE_FONDATEUR => null,
            self::LIBRE => null,
        };
    }

    /**
     * Le montant choisi respecte-t-il les bornes du palier ?
     */
    public function accepts(float $amount): bool
    {
        if ($amount < $this->min()) {
            return false;
        }

        return $this->max() === null || $amount <= $this->max();
    }
}
