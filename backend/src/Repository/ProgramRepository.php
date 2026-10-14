<?php

namespace App\Repository;

use App\Entity\Program;
use App\Enum\ContentStatus;
use App\Enum\ProgramScope;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Program>
 */
class ProgramRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Program::class);
    }

    /**
     * Programmes publiés, filtrables par catégorie et/ou « à la une ».
     *
     * @return Program[]
     */
    public function findPublished(
        ?string $categorySlug = null,
        bool $featuredOnly = false,
        ?ProgramScope $scope = null,
    ): array {
        // LEFT JOIN : les programmes externes n'ont pas de rubrique (category null)
        // et doivent tout de même être renvoyés.
        $qb = $this->createQueryBuilder('p')
            ->leftJoin('p.category', 'c')
            ->addSelect('c')
            ->where('p.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('p.position', 'ASC')
            ->addOrderBy('p.title', 'ASC');

        if ($categorySlug !== null) {
            $qb->andWhere('c.slug = :cat')->setParameter('cat', $categorySlug);
        }
        if ($featuredOnly) {
            $qb->andWhere('p.featured = true');
        }
        if ($scope !== null) {
            $qb->andWhere('p.scope = :scope')->setParameter('scope', $scope);
        }

        return $qb->getQuery()->getResult();
    }

    public function findOnePublishedBySlug(string $slug): ?Program
    {
        return $this->findOneBy(['slug' => $slug, 'status' => ContentStatus::PUBLISHED]);
    }

    public function findOneBySlug(string $slug): ?Program
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
