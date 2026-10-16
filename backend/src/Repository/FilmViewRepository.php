<?php

namespace App\Repository;

use App\Entity\Film;
use App\Entity\FilmView;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FilmView>
 */
class FilmViewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FilmView::class);
    }

    public function hasRecentView(Film $film, string $ipHash, \DateTimeImmutable $since): bool
    {
        $count = $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.film = :film')
            ->andWhere('v.ipHash = :ipHash')
            ->andWhere('v.viewedAt >= :since')
            ->setParameter('film', $film)
            ->setParameter('ipHash', $ipHash)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();

        return ((int) $count) > 0;
    }

    /**
     * Nombre de vues par jour, tous films confondus, sur les `$days` derniers jours.
     *
     * @return array<string,int> date ('Y-m-d') => nombre de vues
     */
    public function dailyCounts(int $days): array
    {
        $since = new \DateTimeImmutable(sprintf('-%d days', $days - 1));

        $rows = $this->createQueryBuilder('v')
            ->select("SUBSTRING(TO_TEXT(v.viewedAt), 1, 10) AS day, COUNT(v.id) AS cnt")
            ->where('v.viewedAt >= :since')
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

    public function countSince(\DateTimeImmutable $since): int
    {
        return (int) $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.viewedAt >= :since')
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
