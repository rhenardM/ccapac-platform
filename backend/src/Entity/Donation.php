<?php

namespace App\Entity;

use App\Enum\ContributionTier;
use App\Enum\PaymentOperator;
use App\Repository\DonationRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Un don et son cycle de vie de paiement via Makuta.
 *
 * Statuts : pending → paid | failed | expired.
 * `reference` (= thirdPartyReference Makuta) est notre identifiant public unique.
 */
#[ORM\Entity(repositoryClass: DonationRepository::class)]
#[ORM\Table(name: 'donations')]
#[ORM\Index(name: 'idx_donation_makuta_txn', columns: ['makuta_transaction_id'])]
#[ORM\Index(name: 'idx_donation_status', columns: ['status'])]
class Donation
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_FAILED = 'failed';
    public const STATUS_EXPIRED = 'expired';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Donor::class, inversedBy: 'donations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Donor $donor;

    /** Notre référence unique (thirdPartyReference Makuta), ex: GT-DON-2026-XXXXX. */
    #[ORM\Column(length: 100, unique: true)]
    private string $reference;

    /** Identifiant de transaction renvoyé par Makuta. */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $makutaTransactionId = null;

    #[ORM\Column(length: 50, enumType: ContributionTier::class)]
    private ContributionTier $tier;

    #[ORM\Column(length: 50, enumType: PaymentOperator::class)]
    private PaymentOperator $operator;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)]
    private string $amount;

    #[ORM\Column(length: 10)]
    private string $currency = 'USD';

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_PENDING;

    /** URL de redirection Makuta (paiement carte Visa CNP). */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $redirectUrl = null;

    /** Dernier payload de callback/réponse Makuta (audit). */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $callbackPayload = null;

    /** Dernier message lisible renvoyé par Makuta. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $message = null;

    /** Pour qui : self | relative | organization (suivi). */
    #[ORM\Column(length: 20)]
    private string $donorType = 'self';

    /** Bénéficiaire (proche/organisation) au nom duquel le don est offert. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $beneficiaryName = null;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $beneficiaryEmail = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $beneficiaryMessage = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $confirmedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDonor(): Donor
    {
        return $this->donor;
    }

    public function setDonor(Donor $donor): self
    {
        $this->donor = $donor;

        return $this;
    }

    public function getReference(): string
    {
        return $this->reference;
    }

    /** Libellés lisibles (utilisés par l'admin / affichage). */
    public function getTierLabel(): string
    {
        return $this->tier->label();
    }

    public function getOperatorLabel(): string
    {
        return $this->operator->label();
    }

    public function getCallbackPayloadJson(): ?string
    {
        return $this->callbackPayload
            ? json_encode($this->callbackPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : null;
    }

    public function setReference(string $reference): self
    {
        $this->reference = $reference;

        return $this;
    }

    public function getMakutaTransactionId(): ?string
    {
        return $this->makutaTransactionId;
    }

    public function setMakutaTransactionId(?string $id): self
    {
        $this->makutaTransactionId = $id;

        return $this;
    }

    public function getTier(): ContributionTier
    {
        return $this->tier;
    }

    public function setTier(ContributionTier $tier): self
    {
        $this->tier = $tier;

        return $this;
    }

    public function getOperator(): PaymentOperator
    {
        return $this->operator;
    }

    public function setOperator(PaymentOperator $operator): self
    {
        $this->operator = $operator;

        return $this;
    }

    public function getAmount(): string
    {
        return $this->amount;
    }

    public function setAmount(string $amount): self
    {
        $this->amount = $amount;

        return $this;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): self
    {
        $this->currency = $currency;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function getRedirectUrl(): ?string
    {
        return $this->redirectUrl;
    }

    public function setRedirectUrl(?string $redirectUrl): self
    {
        $this->redirectUrl = $redirectUrl;

        return $this;
    }

    public function getCallbackPayload(): ?array
    {
        return $this->callbackPayload;
    }

    public function setCallbackPayload(?array $callbackPayload): self
    {
        $this->callbackPayload = $callbackPayload;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): self
    {
        $this->message = $message !== null ? mb_substr($message, 0, 255) : null;

        return $this;
    }

    public function getDonorType(): string
    {
        return $this->donorType;
    }

    public function setDonorType(string $donorType): self
    {
        $this->donorType = $donorType;

        return $this;
    }

    /** Libellé lisible du type de donateur (affichage admin). */
    public function getDonorTypeLabel(): string
    {
        return match ($this->donorType) {
            'relative' => 'Pour un proche',
            'organization' => 'Pour une organisation',
            default => 'Pour soi-même',
        };
    }

    public function getBeneficiaryName(): ?string
    {
        return $this->beneficiaryName;
    }

    public function setBeneficiaryName(?string $beneficiaryName): self
    {
        $this->beneficiaryName = $beneficiaryName;

        return $this;
    }

    public function getBeneficiaryEmail(): ?string
    {
        return $this->beneficiaryEmail;
    }

    public function setBeneficiaryEmail(?string $beneficiaryEmail): self
    {
        $this->beneficiaryEmail = $beneficiaryEmail;

        return $this;
    }

    public function getBeneficiaryMessage(): ?string
    {
        return $this->beneficiaryMessage;
    }

    public function setBeneficiaryMessage(?string $beneficiaryMessage): self
    {
        $this->beneficiaryMessage = $beneficiaryMessage;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getConfirmedAt(): ?\DateTimeImmutable
    {
        return $this->confirmedAt;
    }

    public function setConfirmedAt(?\DateTimeImmutable $confirmedAt): self
    {
        $this->confirmedAt = $confirmedAt;

        return $this;
    }
}
