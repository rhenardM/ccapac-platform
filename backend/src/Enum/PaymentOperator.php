<?php

namespace App\Enum;

/**
 * Opérateurs Makuta activés pour la collecte.
 *
 * Phase actuelle : Mobile Money + Visa Card-Not-Present (web).
 * Mastercard n'est pas supporté par Makuta ; les virements bancaires
 * (DRC_FIRSTBANK / DRC_ECOBANKPAY / DRC_FINCA) restent à clarifier.
 */
enum PaymentOperator: string
{
    case DRC_MPESA = 'DRC_MPESA';
    case DRC_AIRTEL_MONEY = 'DRC_AIRTEL_MONEY';
    case DRC_ORANGE_MONEY = 'DRC_ORANGE_MONEY';
    case DRC_AFRIMONEY = 'DRC_AFRIMONEY';
    case DRC_RAKKACASH = 'DRC_RAKKACASH';
    case DRC_VISA_CNP = 'DRC_VISA_CNP';

    /** @return string[] valeurs valides (pour la validation Choice). */
    public static function values(): array
    {
        return array_map(static fn (self $o) => $o->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::DRC_MPESA => 'M-Pesa',
            self::DRC_AIRTEL_MONEY => 'Airtel Money',
            self::DRC_ORANGE_MONEY => 'Orange Money',
            self::DRC_AFRIMONEY => 'Afrimoney',
            self::DRC_RAKKACASH => 'Rakkacash',
            self::DRC_VISA_CNP => 'Carte Visa',
        };
    }

    public function isMobileMoney(): bool
    {
        return $this !== self::DRC_VISA_CNP;
    }

    public function isCard(): bool
    {
        return $this === self::DRC_VISA_CNP;
    }

    /**
     * L'opérateur exige un numéro Mobile Money (accountNumber = téléphone) ?
     */
    public function requiresPayNumber(): bool
    {
        return $this->isMobileMoney();
    }

    /**
     * L'opérateur requiert une confirmation OTP (SMS) ?
     */
    public function requiresOtp(): bool
    {
        return $this === self::DRC_RAKKACASH;
    }

    /**
     * L'opérateur requiert l'email du donateur dans la requête Makuta ?
     */
    public function requiresEmail(): bool
    {
        return $this === self::DRC_VISA_CNP;
    }
}
