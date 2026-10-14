<?php

namespace App\Repository;

use App\Entity\Article;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Article>
 */
class ArticleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Article::class);
    }

    /**
     * Articles publiés, du plus récent au plus ancien.
     *
     * @return Article[]
     */
    public function findPublished(?string $categorySlug = null, bool $featuredOnly = false): array
    {
        $qb = $this->createQueryBuilder('a')
            ->leftJoin('a.category', 'c')
            ->addSelect('c')
            ->where('a.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('a.publishedAt', 'DESC')
            ->addOrderBy('a.createdAt', 'DESC');

        if ($categorySlug !== null) {
            $qb->andWhere('c.slug = :cat')->setParameter('cat', $categorySlug);
        }
        if ($featuredOnly) {
            $qb->andWhere('a.featured = true');
        }

        return $qb->getQuery()->getResult();
    }

    public function findOnePublishedBySlug(string $slug): ?Article
    {
        return $this->findOneBy(['slug' => $slug, 'status' => ContentStatus::PUBLISHED]);
    }

    /**
     * Articles publiés les plus consultés (classement admin).
     *
     * @return Article[]
     */
    public function findMostViewed(int $limit): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('a.viewCount', 'DESC')
            ->addOrderBy('a.publishedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findOneBySlug(string $slug): ?Article
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
