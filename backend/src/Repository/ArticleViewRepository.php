<?php

namespace App\Repository;

use App\Entity\Article;
use App\Entity\ArticleView;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ArticleView>
 */
class ArticleViewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ArticleView::class);
    }

    /** Vrai si ce visiteur a déjà une vue comptabilisée pour cet article depuis `$since`. */
    public function hasRecentView(Article $article, string $ipHash, \DateTimeImmutable $since): bool
    {
        $count = $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.article = :article')
            ->andWhere('v.ipHash = :ipHash')
            ->andWhere('v.viewedAt >= :since')
            ->setParameter('article', $article)
            ->setParameter('ipHash', $ipHash)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();

        return ((int) $count) > 0;
    }

    /**
     * Nombre de vues par jour, tous articles confondus, sur les `$days` derniers jours
     * (jours sans vue inclus, à 0), du plus ancien au plus récent.
     *
     * @return array<string,int> date ('Y-m-d') => nombre de vues
     */
    public function dailyCounts(int $days): array
    {
        $since = new \DateTimeImmutable(sprintf('-%d days', $days - 1));

        $rows = $this->createQueryBuilder('v')
            ->select("SUBSTRING(v.viewedAt, 1, 10) AS day, COUNT(v.id) AS cnt")
            ->where('v.viewedAt >= :since')
            ->setParameter('since', $since->setTime(0, 0))
            ->groupBy('day')
            ->getQuery()
            ->getArrayResult();

        $byDay = array_column($rows, 'cnt', 'day');

        $result = [];
        for ($i = $days - 1; $i >= 0; --$i) {
            $day = (new \DateTimeImmutable(sprintf('-%d days', $i)))->format('Y-m-d');
            $result[$day] = (int) ($byDay[$day] ?? 0);
        }

        return $result;
    }

    public function countSince(\DateTimeImmutable $since): int
    {
        return (int) $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.viewedAt >= :since')
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
