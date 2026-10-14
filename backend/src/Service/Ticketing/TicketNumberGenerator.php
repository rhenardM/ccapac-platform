<?php

namespace App\Service\Ticketing;

use App\Repository\TicketRepository;

/**
 * Génère un numéro de billet séquentiel et lisible : CCD-{année}-{6 chiffres},
 * remis à zéro chaque année. Contrairement à DonationReferenceGenerator
 * (alphabet aléatoire), la lisibilité "séquentielle" est un choix explicite
 * du métier (numérotation type billetterie physique).
 */
class TicketNumberGenerator
{
    private const PREFIX = 'CCD';

    public function __construct(private TicketRepository $ticketRepository)
    {
    }

    /** @return array{0: string, 1: int, 2: int} [ticketNumber, year, sequenceNumber] */
    public function next(): array
    {
        $year = (int) (new \DateTimeImmutable())->format('Y');
        $sequence = $this->ticketRepository->findMaxSequenceForYear($year) + 1;

        return [$this->format($year, $sequence), $year, $sequence];
    }

    /** Utilisé après une collision : incrémente à partir du numéro tenté. */
    public function retry(int $year, int $lastAttemptedSequence): array
    {
        $sequence = $lastAttemptedSequence + 1;

        return [$this->format($year, $sequence), $year, $sequence];
    }

    private function format(int $year, int $sequence): string
    {
        return sprintf('%s-%d-%06d', self::PREFIX, $year, $sequence);
    }
}
