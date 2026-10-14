<?php

namespace App\Repository;

use App\Entity\ProgramCategory;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ProgramCategory>
 */
class ProgramCategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProgramCategory::class);
    }

    /** @return ProgramCategory[] Catégories publiées, triées par position. */
    public function findPublishedOrdered(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('c.title', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneBySlug(string $slug): ?ProgramCategory
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
