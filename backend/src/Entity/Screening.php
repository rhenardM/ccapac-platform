<?php

namespace App\Entity;

use App\Enum\ScreeningStatus;
use App\Repository\ScreeningRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Une séance précise d'un film (date, heure, lieu). Un même film peut avoir
 * plusieurs projections (plusieurs dimanches, ou une reprise).
 */
#[ORM\Entity(repositoryClass: ScreeningRepository::class)]
#[ORM\Table(name: 'screenings')]
#[ORM\Index(name: 'idx_screening_date', columns: ['scheduled_date'])]
#[ORM\HasLifecycleCallbacks]
class Screening
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Film::class, inversedBy: 'screenings')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Film $film = null;

    #[ORM\Column(type: 'date_immutable')]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $scheduledDate = null;

    #[ORM\Column(type: 'time_immutable')]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $startTime = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeImmutable $endTime = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $venue = '';

    /** Description propre à cette séance (distincte du synopsis du film). */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private bool $isVisible = true;

    /** Seule bascule manuelle de statut : prime toujours sur le calcul automatique. */
    #[ORM\Column]
    private bool $isCancelled = false;

    #[ORM\Column]
    private bool $featured = false;

    /** Ordre d'affichage manuel ; à défaut, tri par date. */
    #[ORM\Column(nullable: true)]
    private ?int $position = null;

    #[ORM\Column(nullable: true)]
    private ?int $capacityTotal = null;

    #[ORM\Column(nullable: true)]
    private ?int $capacityTaken = null;

    /**
     * Gratuit/payant. Pilote le bouton d'action public : gratuit => formulaire
     * d'inscription ; payant => bouton "Réserver ma place" (tarif = $price,
     * lien de billetterie réglé globalement dans CinemathequeSettings).
     */
    #[ORM\Column]
    private bool $isFree = true;

    /** Prix en FC (Franc Congolais). Renseigné si la séance est payante. */
    #[ORM\Column(nullable: true)]
    private ?int $price = null;

    #[ORM\Column]
    private int $viewCount = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getScheduledDate(): ?\DateTimeImmutable
    {
        return $this->scheduledDate;
    }

    public function setScheduledDate(?\DateTimeImmutable $scheduledDate): self
    {
        $this->scheduledDate = $scheduledDate;

        return $this;
    }

    public function getStartTime(): ?\DateTimeImmutable
    {
        return $this->startTime;
    }

    public function setStartTime(?\DateTimeImmutable $startTime): self
    {
        $this->startTime = $startTime;

        return $this;
    }

    public function getEndTime(): ?\DateTimeImmutable
    {
        return $this->endTime;
    }

    public function setEndTime(?\DateTimeImmutable $endTime): self
    {
        $this->endTime = $endTime;

        return $this;
    }

    public function getVenue(): string
    {
        return $this->venue;
    }

    public function setVenue(string $venue): self
    {
        $this->venue = $venue;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function isVisible(): bool
    {
        return $this->isVisible;
    }

    public function setIsVisible(bool $isVisible): self
    {
        $this->isVisible = $isVisible;

        return $this;
    }

    public function isCancelled(): bool
    {
        return $this->isCancelled;
    }

    public function setIsCancelled(bool $isCancelled): self
    {
        $this->isCancelled = $isCancelled;

        return $this;
    }

    public function isFeatured(): bool
    {
        return $this->featured;
    }

    public function setFeatured(bool $featured): self
    {
        $this->featured = $featured;

        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(?int $position): self
    {
        $this->position = $position;

        return $this;
    }

    public function getCapacityTotal(): ?int
    {
        return $this->capacityTotal;
    }

    public function setCapacityTotal(?int $capacityTotal): self
    {
        $this->capacityTotal = $capacityTotal;

        return $this;
    }

    public function getCapacityTaken(): ?int
    {
        return $this->capacityTaken;
    }

    public function setCapacityTaken(?int $capacityTaken): self
    {
        $this->capacityTaken = $capacityTaken;

        return $this;
    }

    public function isFree(): bool
    {
        return $this->isFree;
    }

    public function setIsFree(bool $isFree): self
    {
        $this->isFree = $isFree;

        return $this;
    }

    public function getPrice(): ?int
    {
        return $this->price;
    }

    public function setPrice(?int $price): self
    {
        $this->price = $price;

        return $this;
    }

    public function getViewCount(): int
    {
        return $this->viewCount;
    }

    public function incrementViewCount(): self
    {
        ++$this->viewCount;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * Statut calculé à la volée (jamais persisté) : à venir / en cours /
     * terminée selon la date et l'heure, sauf annulation manuelle qui prime
     * toujours. Aucune tâche planifiée requise, jamais de statut périmé.
     */
    public function getStatus(): ScreeningStatus
    {
        if ($this->isCancelled) {
            return ScreeningStatus::CANCELLED;
        }

        $start = $this->startDateTime();
        if (!$start) {
            return ScreeningStatus::UPCOMING;
        }

        $now = new \DateTimeImmutable();
        $end = $this->endDateTime() ?? $start->modify('+3 hours');

        return match (true) {
            $now < $start => ScreeningStatus::UPCOMING,
            $now > $end => ScreeningStatus::FINISHED,
            default => ScreeningStatus::ONGOING,
        };
    }

    /** Libellé du statut calculé, pour l'affichage admin (EasyAdmin ne gère pas les enums non mappés). */
    public function getStatusLabel(): string
    {
        return $this->getStatus()->label();
    }

    private function startDateTime(): ?\DateTimeImmutable
    {
        if (!$this->scheduledDate || !$this->startTime) {
            return null;
        }

        return $this->combineDateAndTime($this->scheduledDate, $this->startTime);
    }

    private function endDateTime(): ?\DateTimeImmutable
    {
        if (!$this->endTime || !$this->scheduledDate) {
            return null;
        }

        $end = $this->combineDateAndTime($this->scheduledDate, $this->endTime);

        $start = $this->startDateTime();
        // Séance finissant après minuit (ex. 23:30 → 01:00).
        if ($start && $end < $start) {
            $end = $end->modify('+1 day');
        }

        return $end;
    }

    private function combineDateAndTime(\DateTimeImmutable $date, \DateTimeImmutable $time): \DateTimeImmutable
    {
        return $date->setTime((int) $time->format('H'), (int) $time->format('i'));
    }

    public function __toString(): string
    {
        return sprintf(
            '%s — %s %s',
            $this->film?->getTitle() ?? 'Film',
            $this->scheduledDate?->format('d/m/Y') ?? '',
            $this->startTime?->format('H:i') ?? ''
        );
    }
}
