<?php

namespace App\Entity;

use App\Enum\RegistrationSource;
use App\Repository\ScreeningRegistrationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Inscription anonyme à une séance de cinémathèque gratuite
 * (formulaire "S'inscrire" sur la page publique du film).
 */
#[ORM\Entity(repositoryClass: ScreeningRegistrationRepository::class)]
#[ORM\Table(name: 'screening_registrations')]
#[ORM\Index(name: 'idx_screening_registration_created_at', columns: ['created_at'])]
class ScreeningRegistration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Screening::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Screening $screening = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $firstName = '';

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $lastName = '';

    /**
     * Facultatif pour une inscription au guichet (source WALKIN) : le billet
     * imprimé sur place fait déjà office de justificatif. Reste obligatoire
     * pour une inscription en ligne (vérifié explicitement dans
     * ScreeningApiController::register(), pas ici).
     */
    #[ORM\Column(length: 180, nullable: true)]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(length: 40, nullable: true)]
    private ?string $phone = null;

    /** Nombre de places souhaitées. */
    #[ORM\Column(nullable: true)]
    private ?int $numberOfSeats = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $message = null;

    /** Libre : "M", "F", "Autre" — facultatif, jamais requis. */
    #[ORM\Column(length: 20, nullable: true)]
    private ?string $gender = null;

    /** Libre : "0-12", "13-17", "18-25", "26-40", "41-60", "60+" — facultatif. */
    #[ORM\Column(length: 20, nullable: true)]
    private ?string $ageRange = null;

    #[ORM\Column]
    private bool $isRead = false;

    #[ORM\Column(length: 20, enumType: RegistrationSource::class)]
    private RegistrationSource $source = RegistrationSource::ONLINE;

    #[ORM\Column]
    private bool $ticketGenerated = false;

    #[ORM\OneToOne(targetEntity: Ticket::class, mappedBy: 'registration', cascade: ['persist', 'remove'])]
    private ?Ticket $ticket = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
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

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): self
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): self
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getFullName(): string
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): self
    {
        $this->email = $email;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): self
    {
        $this->phone = $phone;

        return $this;
    }

    public function getNumberOfSeats(): ?int
    {
        return $this->numberOfSeats;
    }

    public function setNumberOfSeats(?int $numberOfSeats): self
    {
        $this->numberOfSeats = $numberOfSeats;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): self
    {
        $this->message = $message;

        return $this;
    }

    public function getGender(): ?string
    {
        return $this->gender;
    }

    public function setGender(?string $gender): self
    {
        $this->gender = $gender;

        return $this;
    }

    public function getAgeRange(): ?string
    {
        return $this->ageRange;
    }

    public function setAgeRange(?string $ageRange): self
    {
        $this->ageRange = $ageRange;

        return $this;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): self
    {
        $this->isRead = $isRead;

        return $this;
    }

    public function getSource(): RegistrationSource
    {
        return $this->source;
    }

    public function setSource(RegistrationSource $source): self
    {
        $this->source = $source;

        return $this;
    }

    public function isTicketGenerated(): bool
    {
        return $this->ticketGenerated;
    }

    public function setTicketGenerated(bool $ticketGenerated): self
    {
        $this->ticketGenerated = $ticketGenerated;

        return $this;
    }

    public function getTicket(): ?Ticket
    {
        return $this->ticket;
    }

    public function setTicket(?Ticket $ticket): self
    {
        $this->ticket = $ticket;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function __toString(): string
    {
        return $this->getFullName() . ' — ' . ($this->screening?->__toString() ?: 'séance');
    }
}
