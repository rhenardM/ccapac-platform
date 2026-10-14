<?php

namespace App\Repository;

use App\Entity\Ticket;
use App\Enum\TicketStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ticket>
 */
class TicketRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ticket::class);
    }

    public function findOneByReference(string $ticketNumber): ?Ticket
    {
        return $this->findOneBy(['ticketNumber' => $ticketNumber]);
    }

    /** Dernier numéro de séquence attribué pour une année donnée (0 si aucun). */
    public function findMaxSequenceForYear(int $year): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('MAX(t.sequenceNumber)')
            ->andWhere('t.sequenceYear = :year')
            ->setParameter('year', $year)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return array{active:int,used:int,cancelled:int} */
    public function countByStatus(): array
    {
        $rows = $this->createQueryBuilder('t')
            ->select('t.status AS status, COUNT(t.id) AS cnt')
            ->groupBy('t.status')
            ->getQuery()
            ->getArrayResult();

        $counts = ['active' => 0, 'used' => 0, 'cancelled' => 0];
        foreach ($rows as $row) {
            $counts[$this->statusValue($row['status'])] = (int) $row['cnt'];
        }

        return $counts;
    }

    /**
     * Nombre de billets émis par jour sur les `$days` derniers jours
     * (jours sans émission inclus, à 0), du plus ancien au plus récent.
     *
     * @return array<string,int> date ('Y-m-d') => nombre de billets
     */
    public function dailyCounts(int $days): array
    {
        $since = new \DateTimeImmutable(sprintf('-%d days', $days - 1));

        $rows = $this->createQueryBuilder('t')
            ->select('SUBSTRING(t.generatedAt, 1, 10) AS day, COUNT(t.id) AS cnt')
            ->where('t.generatedAt >= :since')
            ->setParameter('since', $since->setTime(0, 0))
            ->groupBy('day')
            ->getQuery()
            ->getArrayResult();

        $byDay = array_column($rows, 'cnt', 'day');

        $result = [];
        for ($i = $days - 1; $i >= 0; --$i) {
            $day = (new \DateTimeImmutable(sprintf('-%d days', $i)))->format('Y-m-d');
            $result[$day] = (int) ($byDay[$day] ?? 0);
        }

        return $result;
    }

    /**
     * Classement des films par nombre de billets émis, avec répartition par statut.
     *
     * @return list<array{title:string,issued:int,used:int,cancelled:int,active:int}>
     */
    public function rankingByFilm(int $limit = 10): array
    {
        $rows = $this->createQueryBuilder('t')
            ->select('f.id AS filmId, f.title AS filmTitle, t.status AS status, COUNT(t.id) AS cnt')
            ->join('t.screening', 's')
            ->join('s.film', 'f')
            ->groupBy('f.id', 'f.title', 't.status')
            ->getQuery()
            ->getArrayResult();

        $byFilm = [];
        foreach ($rows as $row) {
            $filmId = $row['filmId'];
            $byFilm[$filmId] ??= ['title' => $row['filmTitle'], 'issued' => 0, 'used' => 0, 'cancelled' => 0, 'active' => 0];
            $status = $this->statusValue($row['status']);
            $byFilm[$filmId][$status] = (int) $row['cnt'];
            $byFilm[$filmId]['issued'] += (int) $row['cnt'];
        }

        usort($byFilm, static fn (array $a, array $b) => $b['issued'] <=> $a['issued']);

        return array_slice(array_values($byFilm), 0, $limit);
    }

    /**
     * Classement des séances par nombre de billets émis, avec répartition par
     * statut et capacité (pour calculer un taux de remplissage côté template).
     *
     * @return list<array{filmTitle:string,scheduledDate:\DateTimeImmutable,startTime:\DateTimeImmutable,capacityTotal:?int,issued:int,used:int,cancelled:int,active:int}>
     */
    public function rankingByScreening(int $limit = 10): array
    {
        $rows = $this->createQueryBuilder('t')
            ->select(
                's.id AS screeningId',
                'f.title AS filmTitle',
                's.scheduledDate AS scheduledDate',
                's.startTime AS startTime',
                's.capacityTotal AS capacityTotal',
                't.status AS status',
                'COUNT(t.id) AS cnt'
            )
            ->join('t.screening', 's')
            ->join('s.film', 'f')
            ->groupBy('s.id', 'f.title', 's.scheduledDate', 's.startTime', 's.capacityTotal', 't.status')
            ->getQuery()
            ->getArrayResult();

        $byScreening = [];
        foreach ($rows as $row) {
            $id = $row['screeningId'];
            $byScreening[$id] ??= [
                'filmTitle' => $row['filmTitle'],
                'scheduledDate' => $row['scheduledDate'],
                'startTime' => $row['startTime'],
                'capacityTotal' => $row['capacityTotal'],
                'issued' => 0, 'used' => 0, 'cancelled' => 0, 'active' => 0,
            ];
            $status = $this->statusValue($row['status']);
            $byScreening[$id][$status] = (int) $row['cnt'];
            $byScreening[$id]['issued'] += (int) $row['cnt'];
        }

        usort($byScreening, static fn (array $a, array $b) => $b['issued'] <=> $a['issued']);

        return array_slice(array_values($byScreening), 0, $limit);
    }

    private function statusValue(TicketStatus|string $status): string
    {
        return $status instanceof TicketStatus ? $status->value : $status;
    }
}
