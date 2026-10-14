<?php

namespace App\Repository;

use App\Entity\MediaCategory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MediaCategory>
 */
class MediaCategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaCategory::class);
    }

    /** @return MediaCategory[] Toutes les catégories, triées par position. */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('c')
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Catégories effectivement utilisées par au moins un média, avec le nombre
     * de médias associés. Permet au site de n'afficher que des filtres utiles.
     *
     * @return array<int,array{category:MediaCategory,total:int}>
     */
    public function findUsedWithCounts(): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c AS category', 'COUNT(m.id) AS total')
            // Même périmètre que MediaAssetRepository::findForGallery() : seules
            // les images comptent, pour que le total affiché à côté d'un filtre
            // corresponde exactement au nombre de résultats obtenus en cliquant.
            ->innerJoin('c.medias', 'm', 'WITH', 'm.mime LIKE :image')
            ->setParameter('image', 'image/%')
            ->groupBy('c.id')
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(
            static fn (array $r) => ['category' => $r['category'], 'total' => (int) $r['total']],
            $rows
        );
    }

    public function findOneBySlug(string $slug): ?MediaCategory
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
