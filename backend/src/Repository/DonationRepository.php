<?php

namespace App\Repository;

use App\Entity\Donation;
use App\Enum\PaymentOperator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Donation>
 */
class DonationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Donation::class);
    }

    /**
     * Retrouve un don par notre référence OU par l'id de transaction Makuta
     * (le champ txnId du callback peut correspondre à l'un ou l'autre).
     */
    public function findByReference(string $reference): ?Donation
    {
        return $this->createQueryBuilder('d')
            ->where('d.reference = :ref OR d.makutaTransactionId = :ref')
            ->setParameter('ref', $reference)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Statistiques de la collecte : total encaissé (statut paid) et nombre de dons.
     *
     * @return array{collected: float, count: int}
     */
    public function campaignStats(): array
    {
        $row = $this->createQueryBuilder('d')
            ->select('COALESCE(SUM(d.amount), 0) AS collected', 'COUNT(d.id) AS cnt')
            ->where('d.status = :paid')
            ->setParameter('paid', Donation::STATUS_PAID)
            ->getQuery()
            ->getSingleResult();

        return [
            'collected' => (float) $row['collected'],
            'count' => (int) $row['cnt'],
        ];
    }

    /**
     * Répartition des dons par statut : ['paid' => ['count'=>n,'amount'=>x], ...].
     *
     * @return array<string,array{count:int,amount:float}>
     */
    public function statusBreakdown(): array
    {
        $rows = $this->createQueryBuilder('d')
            ->select('d.status AS status', 'COUNT(d.id) AS cnt', 'COALESCE(SUM(d.amount),0) AS amount')
            ->groupBy('d.status')
            ->getQuery()
            ->getArrayResult();

        $out = [];
        foreach ($rows as $r) {
            $out[$r['status']] = ['count' => (int) $r['cnt'], 'amount' => (float) $r['amount']];
        }

        return $out;
    }

    /**
     * Montant encaissé (paid) par opérateur, décroissant.
     *
     * @return array<int,array{operator:string,count:int,amount:float}>
     */
    public function paidByOperator(): array
    {
        $rows = $this->createQueryBuilder('d')
            ->select('d.operator AS operator', 'COUNT(d.id) AS cnt', 'COALESCE(SUM(d.amount),0) AS amount')
            ->where('d.status = :paid')
            ->setParameter('paid', Donation::STATUS_PAID)
            ->groupBy('d.operator')
            ->orderBy('amount', 'DESC')
            ->getQuery()
            ->getArrayResult();

        return array_map(static function (array $r) {
            $op = $r['operator']; // colonne enumType => instance PaymentOperator
            return [
                'operator' => $op instanceof PaymentOperator ? $op->value : (string) $op,
                'operatorLabel' => $op instanceof PaymentOperator ? $op->label() : (string) $op,
                'count' => (int) $r['cnt'],
                'amount' => (float) $r['amount'],
            ];
        }, $rows);
    }

    /**
     * Liste paginée + filtrée pour l'API admin.
     *
     * @return array{items: Donation[], total: int, page: int, pages: int, perPage: int}
     */
    public function paginateForAdmin(?string $status, ?string $operator, int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        $qb = $this->createQueryBuilder('d');
        if ($status) {
            $qb->andWhere('d.status = :status')->setParameter('status', $status);
        }
        if ($operator) {
            $qb->andWhere('d.operator = :operator')->setParameter('operator', $operator);
        }

        $countQb = clone $qb;
        $total = (int) $countQb->select('COUNT(d.id)')->getQuery()->getSingleScalarResult();

        $items = $qb->orderBy('d.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * @return Donation[]
     */
    public function findRecent(int $limit = 10): array
    {
        return $this->createQueryBuilder('d')
            ->orderBy('d.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Dons en attente plus vieux que $minutes minutes (réconciliation/expiration).
     *
     * @return Donation[]
     */
    public function findStalePending(int $minutes): array
    {
        $threshold = (new \DateTimeImmutable())->modify("-{$minutes} minutes");

        return $this->createQueryBuilder('d')
            ->where('d.status = :pending')
            ->andWhere('d.createdAt < :threshold')
            ->setParameter('pending', Donation::STATUS_PENDING)
            ->setParameter('threshold', $threshold)
            ->getQuery()
            ->getResult();
    }
}
