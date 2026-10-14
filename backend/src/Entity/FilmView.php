<?php

namespace App\Entity;

use App\Repository\FilmViewRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Une consultation comptabilisée d'un film (une par visiteur et par fenêtre
 * de dédoublonnage, voir FilmApiController). Sert à dérouler l'évolution des
 * consultations dans le temps et à éviter qu'un rechargement ne gonfle le
 * compteur.
 */
#[ORM\Entity(repositoryClass: FilmViewRepository::class)]
#[ORM\Table(name: 'film_views')]
#[ORM\Index(name: 'idx_film_view_film_viewed_at', columns: ['film_id', 'viewed_at'])]
#[ORM\Index(name: 'idx_film_view_dedup', columns: ['film_id', 'ip_hash', 'viewed_at'])]
class FilmView
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Film::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Film $film = null;

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

    public function getFilm(): ?Film
    {
        return $this->film;
    }

    public function setFilm(?Film $film): self
    {
        $this->film = $film;

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
