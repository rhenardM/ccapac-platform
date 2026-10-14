<?php

namespace App\Entity;

use App\Repository\ScreeningViewRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Une consultation comptabilisée d'une projection (voir FilmView pour le
 * pendant côté film).
 */
#[ORM\Entity(repositoryClass: ScreeningViewRepository::class)]
#[ORM\Table(name: 'screening_views')]
#[ORM\Index(name: 'idx_screening_view_screening_viewed_at', columns: ['screening_id', 'viewed_at'])]
#[ORM\Index(name: 'idx_screening_view_dedup', columns: ['screening_id', 'ip_hash', 'viewed_at'])]
class ScreeningView
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Screening::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Screening $screening = null;

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

    public function getScreening(): ?Screening
    {
        return $this->screening;
    }

    public function setScreening(?Screening $screening): self
    {
        $this->screening = $screening;

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
