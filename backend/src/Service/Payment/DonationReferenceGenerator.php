<?php

namespace App\Service\Payment;

use App\Repository\DonationRepository;

/**
 * Génère une référence de don unique au format GT-DON-{année}-{XXXXX}.
 * Sert de thirdPartyReference côté Makuta et d'identifiant public.
 */
class DonationReferenceGenerator
{
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I,O,0,1 (lisibilité)

    public function __construct(private DonationRepository $donationRepository) {}

    public function generate(): string
    {
        $year = (new \DateTimeImmutable())->format('Y');

        // Quelques tentatives pour éviter une collision (extrêmement improbable).
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $reference = sprintf('GT-DON-%s-%s', $year, $this->randomChunk(6));
            if (!$this->donationRepository->findOneBy(['reference' => $reference])) {
                return $reference;
            }
        }

        // Repli : suffixe horodaté unique.
        return sprintf('GT-DON-%s-%s', $year, strtoupper(base_convert((string) time(), 10, 36)));
    }

    private function randomChunk(int $length): string
    {
        $max = strlen(self::ALPHABET) - 1;
        $out = '';
        for ($i = 0; $i < $length; $i++) {
            $out .= self::ALPHABET[random_int(0, $max)];
        }

        return $out;
    }
}
