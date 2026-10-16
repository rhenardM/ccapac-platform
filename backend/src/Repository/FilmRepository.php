<?php

namespace App\Repository;

use App\Entity\Film;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Film>
 */
class FilmRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Film::class);
    }

    /**
     * Films publiés (et non archivés), du plus récent au plus ancien.
     *
     * @return Film[]
     */
    public function findPublished(?string $categorySlug = null, ?string $search = null): array
    {
        $qb = $this->createQueryBuilder('f')
            ->where('f.status = :pub')
            ->andWhere('f.archived = false')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('f.createdAt', 'DESC');

        if ($categorySlug !== null) {
            $qb->join('f.categories', 'c')
                ->andWhere('c.slug = :cat')
                ->setParameter('cat', $categorySlug);
        }
        if ($search !== null && $search !== '') {
            // LOWER() des deux côtés : LIKE est sensible à la casse sous PostgreSQL.
            $qb->andWhere('LOWER(f.title) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findOnePublishedBySlug(string $slug): ?Film
    {
        return $this->findOneBy(['slug' => $slug, 'status' => ContentStatus::PUBLISHED, 'archived' => false]);
    }

    public function findOneBySlug(string $slug): ?Film
    {
        return $this->findOneBy(['slug' => $slug]);
    }

    /**
     * Films publiés les plus consultés (classement admin).
     *
     * @return Film[]
     */
    public function findMostViewed(int $limit): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.status = :pub')
            ->andWhere('f.archived = false')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('f.viewCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
