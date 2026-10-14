<?php

namespace App\Entity;

use App\Repository\NewsletterSubscriberRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Abonné à la newsletter (collecte d'e-mails depuis le site).
 */
#[ORM\Entity(repositoryClass: NewsletterSubscriberRepository::class)]
#[ORM\Table(name: 'newsletter_subscribers')]
#[ORM\UniqueConstraint(name: 'uniq_subscriber_email', columns: ['email'])]
class NewsletterSubscriber
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private string $email = '';

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $name = null;

    #[ORM\Column]
    private bool $isActive = true;

    /** Origine de l'inscription (ex. site, admin, import). */
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $source = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $unsubscribedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = strtolower(trim($email));

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        $this->unsubscribedAt = $isActive ? null : ($this->unsubscribedAt ?? new \DateTimeImmutable());

        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): self
    {
        $this->source = $source;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUnsubscribedAt(): ?\DateTimeImmutable
    {
        return $this->unsubscribedAt;
    }

    public function __toString(): string
    {
        return $this->email;
    }
}
