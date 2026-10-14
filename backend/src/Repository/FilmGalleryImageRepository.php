<?php

namespace App\Repository;

use App\Entity\FilmGalleryImage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FilmGalleryImage>
 */
class FilmGalleryImageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FilmGalleryImage::class);
    }
}
