<?php

namespace App\Entity;

use App\Repository\CinemathequeSettingsRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Réglages globaux du module Cinémathèque. Table à une seule ligne (id=1,
 * imposé par CinemathequeSettingsRepository::getOrCreate) : pas de CRUD,
 * un unique formulaire d'édition côté admin.
 */
#[ORM\Entity(repositoryClass: CinemathequeSettingsRepository::class)]
#[ORM\Table(name: 'cinematheque_settings')]
class CinemathequeSettings
{
    #[ORM\Id]
    #[ORM\Column]
    private int $id = 1;

    /**
     * URL de redirection du bouton « Réserver ma place », en attendant la
     * vraie plateforme de billetterie.
     */
    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $bookingUrl = null;

    public function getId(): int
    {
        return $this->id;
    }

    public function getBookingUrl(): ?string
    {
        return $this->bookingUrl;
    }

    public function setBookingUrl(?string $bookingUrl): self
    {
        $this->bookingUrl = $bookingUrl;

        return $this;
    }
}
