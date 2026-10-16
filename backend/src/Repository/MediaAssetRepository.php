<?php

namespace App\Repository;

use App\Entity\MediaAsset;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MediaAsset>
 */
class MediaAssetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaAsset::class);
    }

    /**
     * Médias de la médiathèque publique, filtrés et paginés.
     *
     * Tri : les médias datés d'abord (événement le plus récent en tête), puis
     * les médias sans date d'événement, du plus récemment ajouté au plus ancien.
     * MySQL place les NULL en fin de tri décroissant, ce qui donne exactement ce
     * classement sans expression conditionnelle.
     *
     * @param string[]    $categorySlugs Slugs de catégories, combinés en OU (vide = toutes)
     * @param string|null $search        Recherche sur nom / légende / texte alternatif
     * @param int|null    $year          Année de l'événement
     * @param int|null    $month         Mois de l'événement (1-12)
     *
     * @return array{items: MediaAsset[], total: int, page: int, pages: int, perPage: int}
     */
    public function findForGallery(
        array $categorySlugs = [],
        ?string $search = null,
        ?int $year = null,
        ?int $month = null,
        int $page = 1,
        int $perPage = 24,
    ): array {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        $qb = $this->createQueryBuilder('m')
            ->leftJoin('m.category', 'c')
            // La médiathèque publique est une galerie de photos : les PDF
            // (newsletters) sont exclus côté serveur, sans quoi la pagination
            // annoncerait des totaux que la galerie n'afficherait pas.
            ->andWhere('m.mime LIKE :image')
            ->setParameter('image', 'image/%');

        if ($categorySlugs !== []) {
            $qb->andWhere('c.slug IN (:cats)')->setParameter('cats', $categorySlugs);
        }
        if ($search) {
            // LOWER() des deux côtés : LIKE est sensible à la casse sous PostgreSQL.
            $qb->andWhere('LOWER(m.name) LIKE :q OR LOWER(m.caption) LIKE :q OR LOWER(m.alt) LIKE :q')
                ->setParameter('q', '%' . mb_strtolower($search) . '%');
        }
        if ($year) {
            // Comparaison par intervalle : exploitable par un index, contrairement
            // à une extraction de l'année (YEAR() n'est de toute façon pas du DQL).
            $qb->andWhere('m.eventDate >= :yearStart AND m.eventDate <= :yearEnd')
                ->setParameter('yearStart', new \DateTimeImmutable(sprintf('%04d-01-01', $year)))
                ->setParameter('yearEnd', new \DateTimeImmutable(sprintf('%04d-12-31', $year)));
        }
        if ($month) {
            // MONTH() n'est pas du DQL : extraction texte portable (TO_TEXT).
            $qb->andWhere('SUBSTRING(TO_TEXT(m.eventDate), 6, 2) = :month')
                ->setParameter('month', sprintf('%02d', $month));
        }

        $count = (int) (clone $qb)->select('COUNT(m.id)')->getQuery()->getSingleScalarResult();

        $items = $qb
            ->addSelect('c')
            // Dates vides en dernier (comportement MySQL ; PostgreSQL les place en tête en DESC).
            ->addSelect('CASE WHEN m.eventDate IS NULL THEN 1 ELSE 0 END AS HIDDEN nullsLast')
            ->orderBy('nullsLast', 'ASC')
            ->addOrderBy('m.eventDate', 'DESC')
            ->addOrderBy('m.createdAt', 'DESC')
            ->addOrderBy('m.id', 'DESC')
            ->setFirstResult(($page - 1) * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return [
            'items' => $items,
            'total' => $count,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => (int) ceil($count / $perPage),
        ];
    }

    /**
     * Années distinctes pour lesquelles au moins un média porte une date
     * d'événement — alimente le sélecteur « Année » du site, qui ne propose
     * ainsi que des années donnant réellement des résultats.
     *
     * @return int[] Années, de la plus récente à la plus ancienne
     */
    public function findEventYears(): array
    {
        $rows = $this->createQueryBuilder('m')
            ->select('DISTINCT SUBSTRING(TO_TEXT(m.eventDate), 1, 4) AS y')
            ->where('m.eventDate IS NOT NULL')
            ->andWhere('m.mime LIKE :image')
            ->setParameter('image', 'image/%')
            ->orderBy('y', 'DESC')
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn (array $r) => (int) $r['y'], $rows);
    }
}
