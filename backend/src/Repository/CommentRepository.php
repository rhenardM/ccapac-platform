<?php

namespace App\Repository;

use App\Entity\Article;
use App\Entity\Comment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Comment>
 */
class CommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    /**
     * Commentaires de premier niveau visibles d'un article, du plus ancien au plus
     * récent, avec leurs réponses visibles préchargées.
     *
     * @return Comment[]
     */
    public function findVisibleForArticle(Article $article): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.article = :article')
            ->andWhere('c.parent IS NULL')
            ->andWhere('c.isHidden = false')
            ->setParameter('article', $article)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Réponses visibles à un commentaire donné, du plus ancien au plus récent.
     *
     * @return Comment[]
     */
    public function findVisibleReplies(Comment $parent): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.parent = :parent')
            ->andWhere('c.isHidden = false')
            ->setParameter('parent', $parent)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
