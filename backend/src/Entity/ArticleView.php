<?php

namespace App\Entity;

use App\Repository\ArticleViewRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Une consultation comptabilisée d'un article (une par visiteur et par fenêtre
 * de dédoublonnage, voir ArticleViewApiController). Sert à la fois à dérouler
 * l'évolution des consultations dans le temps et à empêcher qu'un simple
 * rechargement de page ne gonfle artificiellement le compteur.
 */
#[ORM\Entity(repositoryClass: ArticleViewRepository::class)]
#[ORM\Table(name: 'article_views')]
#[ORM\Index(name: 'idx_article_view_article_viewed_at', columns: ['article_id', 'viewed_at'])]
#[ORM\Index(name: 'idx_article_view_dedup', columns: ['article_id', 'ip_hash', 'viewed_at'])]
class ArticleView
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Article::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Article $article = null;

    /** Empreinte de l'IP du visiteur (jamais l'IP en clair), pour la dédoublonnage. */
    #[ORM\Column(length: 64)]
    private string $ipHash = '';

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $viewedAt;

    public function __construct()
    {
        $this->viewedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function setArticle(?Article $article): self
    {
        $this->article = $article;

        return $this;
    }

    public function getIpHash(): string
    {
        return $this->ipHash;
    }

    public function setIpHash(string $ipHash): self
    {
        $this->ipHash = $ipHash;

        return $this;
    }

    public function getViewedAt(): \DateTimeImmutable
    {
        return $this->viewedAt;
    }
}
