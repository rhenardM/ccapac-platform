<?php

namespace App\Entity;

use App\Enum\TicketStatus;
use App\Repository\TicketRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Billet numérique généré automatiquement pour une inscription à une séance
 * de cinémathèque gratuite (Ciné-Dimanche) : numéro séquentiel, QR Code et
 * PDF téléchargeable. Le jeton de validation brut n'est JAMAIS persisté :
 * seul son empreinte SHA-256 l'est (cf. ApiToken), le brut ne vivant que
 * dans le QR Code / l'e-mail / l'URL de confirmation envoyés une seule fois.
 */
#[ORM\Entity(repositoryClass: TicketRepository::class)]
#[ORM\Table(name: 'tickets')]
#[ORM\Index(name: 'idx_ticket_screening', columns: ['screening_id'])]
#[ORM\Index(name: 'idx_ticket_status', columns: ['status'])]
#[ORM\Index(name: 'idx_ticket_year_seq', columns: ['sequence_year', 'sequence_number'])]
#[ORM\HasLifecycleCallbacks]
class Ticket
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: ScreeningRegistration::class, inversedBy: 'ticket')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?ScreeningRegistration $registration = null;

    /**
     * Dénormalisé depuis registration.screening : évite une jointure à deux
     * sauts pour toute liste/recherche de billets par séance ou par film.
     */
    #[ORM\ManyToOne(targetEntity: Screening::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Screening $screening = null;

    /** Numéro lisible et séquentiel, ex. « CCD-2026-000145 ». */
    #[ORM\Column(length: 30, unique: true)]
    private string $ticketNumber = '';

    /** Extraits du numéro, pour calculer "prochain numéro de l'année" sans parser la chaîne. */
    #[ORM\Column]
    private int $sequenceYear = 0;

    #[ORM\Column]
    private int $sequenceNumber = 0;

    /** SHA-256 du jeton brut embarqué dans le QR Code — jamais le jeton brut lui-même. */
    #[ORM\Column(length: 64, unique: true)]
    private string $validationTokenHash = '';

    /** Nom du fichier SVG du QR Code, dans var/tickets/qr/. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $qrCodePath = null;

    /** Nom du fichier PDF généré, dans var/tickets/. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $pdfPath = null;

    #[ORM\Column(length: 20, enumType: TicketStatus::class)]
    private TicketStatus $status = TicketStatus::ACTIVE;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $generatedAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->generatedAt = new \DateTimeImmutable();
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

    public function getRegistration(): ?ScreeningRegistration
    {
        return $this->registration;
    }

    public function setRegistration(?ScreeningRegistration $registration): self
    {
        $this->registration = $registration;

        return $this;
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

    public function getTicketNumber(): string
    {
        return $this->ticketNumber;
    }

    public function setTicketNumber(string $ticketNumber): self
    {
        $this->ticketNumber = $ticketNumber;

        return $this;
    }

    public function getSequenceYear(): int
    {
        return $this->sequenceYear;
    }

    public function setSequenceYear(int $sequenceYear): self
    {
        $this->sequenceYear = $sequenceYear;

        return $this;
    }

    public function getSequenceNumber(): int
    {
        return $this->sequenceNumber;
    }

    public function setSequenceNumber(int $sequenceNumber): self
    {
        $this->sequenceNumber = $sequenceNumber;

        return $this;
    }

    public function getValidationTokenHash(): string
    {
        return $this->validationTokenHash;
    }

    public function setValidationTokenHash(string $validationTokenHash): self
    {
        $this->validationTokenHash = $validationTokenHash;

        return $this;
    }

    public function getQrCodePath(): ?string
    {
        return $this->qrCodePath;
    }

    public function setQrCodePath(?string $qrCodePath): self
    {
        $this->qrCodePath = $qrCodePath;

        return $this;
    }

    public function getPdfPath(): ?string
    {
        return $this->pdfPath;
    }

    public function setPdfPath(?string $pdfPath): self
    {
        $this->pdfPath = $pdfPath;

        return $this;
    }

    public function getStatus(): TicketStatus
    {
        return $this->status;
    }

    public function setStatus(TicketStatus $status): self
    {
        $this->status = $status;

        return $this;
    }

    /** Transition à sens unique ACTIVE -> USED. Retourne false si déjà utilisé/annulé (no-op). */
    public function markAsUsed(): bool
    {
        if ($this->status !== TicketStatus::ACTIVE) {
            return false;
        }
        $this->status = TicketStatus::USED;
        $this->usedAt = new \DateTimeImmutable();

        return true;
    }

    public function getGeneratedAt(): \DateTimeImmutable
    {
        return $this->generatedAt;
    }

    public function getUsedAt(): ?\DateTimeImmutable
    {
        return $this->usedAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public static function hashToken(string $rawToken): string
    {
        return hash('sha256', $rawToken);
    }

    public function __toString(): string
    {
        return $this->ticketNumber ?: sprintf('Billet #%d', $this->id ?? 0);
    }
}
