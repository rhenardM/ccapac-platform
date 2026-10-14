<?php

namespace App\Repository;

use App\Entity\Actualite;
use App\Enum\ActualiteType;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Actualite>
 */
class ActualiteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Actualite::class);
    }

    /**
     * Actualités publiées (optionnellement filtrées par type), paginées.
     *
     * @return array{items: Actualite[], total: int, page: int, pages: int, perPage: int}
     */
    public function findPublished(?ActualiteType $type, int $page = 1, int $perPage = 12): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(50, $perPage));

        $qb = $this->createQueryBuilder('a')
            ->where('a.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED);
        if ($type) {
            $qb->andWhere('a.type = :type')->setParameter('type', $type);
        }

        $count = (clone $qb)->select('COUNT(a.id)')->getQuery()->getSingleScalarResult();

        $items = $qb->orderBy('a.publishedAt', 'DESC')
            ->setFirstResult(($page - 1) * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return [
            'items' => $items,
            'total' => (int) $count,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => (int) ceil($count / $perPage),
        ];
    }

    public function findOnePublishedBySlug(string $slug): ?Actualite
    {
        return $this->findOneBy(['slug' => $slug, 'status' => ContentStatus::PUBLISHED]);
    }
}
