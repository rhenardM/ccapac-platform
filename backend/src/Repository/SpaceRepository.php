<?php

namespace App\Repository;

use App\Entity\Space;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Space>
 */
class SpaceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Space::class);
    }

    /**
     * Espaces actifs, triés pour le slider/la grille (position manuelle puis nom).
     *
     * @return Space[]
     */
    public function findActive(): array
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.category', 'c')
            ->addSelect('c')
            ->where('s.isActive = true')
            ->orderBy('s.position', 'ASC')
            ->addOrderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneActiveBySlug(string $slug): ?Space
    {
        return $this->findOneBy(['slug' => $slug, 'isActive' => true]);
    }

    public function findOneBySlug(string $slug): ?Space
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
