<?php

namespace App\Repository;

use App\Entity\Event;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Event>
 */
class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    /**
     * Événements publiés, triés par date de début (plus récents/proches d'abord).
     *
     * @return array{items: Event[], total: int, page: int, pages: int, perPage: int}
     */
    public function findPublished(int $page = 1, int $perPage = 12): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(50, $perPage));

        $qb = $this->createQueryBuilder('e')
            ->where('e.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED);

        $count = (clone $qb)->select('COUNT(e.id)')->getQuery()->getSingleScalarResult();

        $items = $qb
            // Dates vides en dernier (comportement MySQL ; PostgreSQL les place en tête en DESC).
            ->addSelect('CASE WHEN e.startsAt IS NULL THEN 1 ELSE 0 END AS HIDDEN nullsLast')
            ->orderBy('nullsLast', 'ASC')
            ->addOrderBy('e.startsAt', 'DESC')
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

    public function findOnePublishedBySlug(string $slug): ?Event
    {
        return $this->findOneBy(['slug' => $slug, 'status' => ContentStatus::PUBLISHED]);
    }
}
