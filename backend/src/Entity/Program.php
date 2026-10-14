<?php

namespace App\Entity;

use App\Enum\ContentStatus;
use App\Enum\ProgramScope;
use App\Repository\ProgramRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Programme culturel rattaché à une rubrique (ProgramCategory).
 * Offre permanente/récurrente (pas un événement daté) : les dates sont
 * optionnelles et une « période » en texte libre suffit le plus souvent.
 */
#[ORM\Entity(repositoryClass: ProgramRepository::class)]
#[ORM\Table(name: 'programs')]
#[ORM\Index(name: 'idx_program_status', columns: ['status'])]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['slug'], message: 'Ce slug est déjà utilisé par un autre programme. Choisissez-en un autre.')]
class Program
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank]
    private string $slug = '';

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $title = '';

    // Optionnelle : les programmes EXTERNES (partenaires) n'appartiennent pas
    // à une rubrique interne. Les internes, eux, en ont une.
    #[ORM\ManyToOne(targetEntity: ProgramCategory::class, inversedBy: 'programs')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?ProgramCategory $category = null;

    /** Partenaire porteur du programme (surtout pour les externes). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $organizer = null;

    /** Lien externe optionnel (site du partenaire). */
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $externalUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $slogan = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $objectif = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $publicVise = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $impact = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $coverImage = null;

    /** Discipline / type (ex. Atelier, Festival, Concert). */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $discipline = null;

    /** Période en texte libre (ex. « En novembre », « Chaque 21 mars »). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $period = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $location = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $startsAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $endsAt = null;

    /**
     * Gratuit/payant. Pilote le bouton d'action public : payant + externalUrl
     * renseigné => lien billetterie ; gratuit => formulaire d'inscription.
     */
    #[ORM\Column]
    private bool $isFree = true;

    /** Espace du Grand Tambour associé (affiché sur la page de l'événement). */
    #[ORM\ManyToOne(targetEntity: Space::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Space $space = null;

    #[ORM\Column]
    private bool $featured = false;

    #[ORM\Column(length: 20, enumType: ProgramScope::class)]
    private ProgramScope $scope = ProgramScope::INTERNE;

    #[ORM\Column]
    private int $position = 0;

    #[ORM\Column(length: 20, enumType: ContentStatus::class)]
    private ContentStatus $status = ContentStatus::DRAFT;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,ProgramGalleryImage> */
    #[ORM\OneToMany(mappedBy: 'program', targetEntity: ProgramGalleryImage::class, orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $galleryImages;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->galleryImages = new ArrayCollection();
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

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getCategory(): ?ProgramCategory
    {
        return $this->category;
    }

    public function setCategory(?ProgramCategory $category): self
    {
        $this->category = $category;

        return $this;
    }

    public function getOrganizer(): ?string
    {
        return $this->organizer;
    }

    public function setOrganizer(?string $organizer): self
    {
        $this->organizer = $organizer;

        return $this;
    }

    public function getExternalUrl(): ?string
    {
        return $this->externalUrl;
    }

    public function setExternalUrl(?string $externalUrl): self
    {
        $this->externalUrl = $externalUrl;

        return $this;
    }

    public function getSlogan(): ?string
    {
        return $this->slogan;
    }

    public function setSlogan(?string $slogan): self
    {
        $this->slogan = $slogan;

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

    public function getObjectif(): ?string
    {
        return $this->objectif;
    }

    public function setObjectif(?string $objectif): self
    {
        $this->objectif = $objectif;

        return $this;
    }

    public function getPublicVise(): ?string
    {
        return $this->publicVise;
    }

    public function setPublicVise(?string $publicVise): self
    {
        $this->publicVise = $publicVise;

        return $this;
    }

    public function getImpact(): ?string
    {
        return $this->impact;
    }

    public function setImpact(?string $impact): self
    {
        $this->impact = $impact;

        return $this;
    }

    public function getCoverImage(): ?string
    {
        return $this->coverImage;
    }

    public function setCoverImage(?string $coverImage): self
    {
        $this->coverImage = $coverImage;

        return $this;
    }

    public function getDiscipline(): ?string
    {
        return $this->discipline;
    }

    public function setDiscipline(?string $discipline): self
    {
        $this->discipline = $discipline;

        return $this;
    }

    public function getPeriod(): ?string
    {
        return $this->period;
    }

    public function setPeriod(?string $period): self
    {
        $this->period = $period;

        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): self
    {
        $this->location = $location;

        return $this;
    }

    public function getStartsAt(): ?\DateTimeImmutable
    {
        return $this->startsAt;
    }

    public function setStartsAt(?\DateTimeImmutable $startsAt): self
    {
        $this->startsAt = $startsAt;

        return $this;
    }

    public function getEndsAt(): ?\DateTimeImmutable
    {
        return $this->endsAt;
    }

    public function setEndsAt(?\DateTimeImmutable $endsAt): self
    {
        $this->endsAt = $endsAt;

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

    public function getSpace(): ?Space
    {
        return $this->space;
    }

    public function setSpace(?Space $space): self
    {
        $this->space = $space;

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

    public function getScope(): ProgramScope
    {
        return $this->scope;
    }

    public function setScope(ProgramScope $scope): self
    {
        $this->scope = $scope;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

        return $this;
    }

    public function getStatus(): ContentStatus
    {
        return $this->status;
    }

    public function setStatus(ContentStatus $status): self
    {
        $this->status = $status;
        if ($status === ContentStatus::PUBLISHED && $this->publishedAt === null) {
            $this->publishedAt = new \DateTimeImmutable();
        }

        return $this;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(?\DateTimeImmutable $publishedAt): self
    {
        $this->publishedAt = $publishedAt;

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

    /** @return Collection<int,ProgramGalleryImage> */
    public function getGalleryImages(): Collection
    {
        return $this->galleryImages;
    }

    public function __toString(): string
    {
        return $this->title ?: $this->slug;
    }
}
