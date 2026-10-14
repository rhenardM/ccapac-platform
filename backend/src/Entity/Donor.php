<?php

namespace App\Entity;

use App\Repository\DonorRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * Donateur : particulier, entreprise ou mécène.
 * Réutilisé d'un don à l'autre via son adresse e-mail.
 */
#[ORM\Entity(repositoryClass: DonorRepository::class)]
#[ORM\Table(name: 'donors')]
class Donor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Nom complet d'une personne ou raison sociale d'une organisation. */
    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(length: 180, unique: true)]
    private string $email;

    #[ORM\Column(length: 32, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    /** @var Collection<int, Donation> */
    #[ORM\OneToMany(targetEntity: Donation::class, mappedBy: 'donor')]
    private Collection $donations;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->donations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /** @return Collection<int, Donation> */
    public function getDonations(): Collection
    {
        return $this->donations;
    }
}
