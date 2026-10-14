<?php

namespace App\Repository;

use App\Entity\HomeHeroSlide;
use App\Enum\ContentStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HomeHeroSlide>
 */
class HomeHeroSlideRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HomeHeroSlide::class);
    }

    /** @return HomeHeroSlide[] */
    public function findPublishedOrdered(): array
    {
        return $this->createQueryBuilder('h')
            ->where('h.status = :pub')
            ->setParameter('pub', ContentStatus::PUBLISHED)
            ->orderBy('h.position', 'ASC')
            ->addOrderBy('h.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
