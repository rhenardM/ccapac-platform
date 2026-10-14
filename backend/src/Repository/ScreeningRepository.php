<?php

namespace App\Repository;

use App\Entity\Film;
use App\Entity\Screening;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Screening>
 */
class ScreeningRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Screening::class);
    }

    /** @return Screening[] Projections d'un film, de la plus proche à la plus ancienne. */
    public function findForFilm(Film $film): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.film = :film')
            ->andWhere('s.isVisible = true')
            ->setParameter('film', $film)
            ->orderBy('s.scheduledDate', 'ASC')
            ->addOrderBy('s.startTime', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /** @return Screening[] Prochaines séances visibles, toutes confondues. */
    public function findUpcoming(int $limit, bool $featuredOnly = false): array
    {
        $qb = $this->visibleQueryBuilder()
            ->andWhere('s.isCancelled = false')
            ->andWhere('s.scheduledDate >= :today')
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->orderBy('s.scheduledDate', 'ASC')
            ->addOrderBy('s.startTime', 'ASC')
            ->setMaxResults($limit);

        if ($featuredOnly) {
            $qb->andWhere('s.featured = true');
        }

        return $qb->getQuery()->getResult();
    }

    /** @return Screening[] Séances passées, les plus récentes d'abord. */
    public function findPast(int $limit): array
    {
        return $this->visibleQueryBuilder()
            ->andWhere('s.scheduledDate < :today')
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->orderBy('s.scheduledDate', 'DESC')
            ->addOrderBy('s.startTime', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /** @return Screening[] Projections publiées les plus consultées. */
    public function findMostViewed(int $limit): array
    {
        return $this->visibleQueryBuilder()
            ->orderBy('s.viewCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    private function visibleQueryBuilder(): \Doctrine\ORM\QueryBuilder
    {
        return $this->createQueryBuilder('s')
            ->join('s.film', 'f')
            ->addSelect('f')
            ->where('s.isVisible = true')
            ->andWhere('f.status = :pub')
            ->andWhere('f.archived = false')
            ->setParameter('pub', ContentStatus::PUBLISHED);
    }
}
