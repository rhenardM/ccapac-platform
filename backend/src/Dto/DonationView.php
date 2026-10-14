<?php

namespace App\Dto;

use App\Entity\Donation;

/**
 * Représentation JSON publique d'un don (renvoyée au frontend Next.js).
 */
final class DonationView
{
    public static function fromEntity(Donation $donation): array
    {
        $operator = $donation->getOperator();

        return [
            'reference' => $donation->getReference(),
            'status' => $donation->getStatus(),
            'amount' => $donation->getAmount(),
            'currency' => $donation->getCurrency(),
            'tier' => $donation->getTier()->value,
            'tierLabel' => $donation->getTier()->label(),
            'operator' => $operator->value,
            'operatorLabel' => $operator->label(),
            'makutaTransactionId' => $donation->getMakutaTransactionId(),
            // URL de redirection (paiement carte Visa CNP) si présente.
            'redirectUrl' => $donation->getRedirectUrl(),
            // Indique au front s'il doit demander un code OTP (Rakkacash).
            'requiresOtp' => $operator->requiresOtp(),
            'message' => $donation->getMessage(),
            'createdAt' => $donation->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'confirmedAt' => $donation->getConfirmedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
