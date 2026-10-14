<?php

namespace App\Entity;

use App\Repository\SpaceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un espace du Grand Tambour (Grand Théâtre, Cafétéria culturelle,
 * Résidence d'artistes...). Module indépendant du CMS.
 */
#[ORM\Entity(repositoryClass: SpaceRepository::class)]
#[ORM\Table(name: 'spaces')]
#[ORM\Index(name: 'idx_space_active', columns: ['is_active'])]
#[ORM\HasLifecycleCallbacks]
class Space
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
    private string $name = '';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $shortDescription = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $fullDescription = null;

    #[ORM\ManyToOne(targetEntity: SpaceCategory::class, inversedBy: 'spaces')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?SpaceCategory $category = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $coverImage = null;

    /** Capacité d'accueil affichée en avant (ex. "500 personnes"). */
    #[ORM\Column(nullable: true)]
    private ?int $capacity = null;

    #[ORM\Column(nullable: true)]
    private ?int $surfaceM2 = null;

    #[ORM\Column(nullable: true)]
    private ?int $seatedCapacity = null;

    #[ORM\Column(nullable: true)]
    private ?int $standingCapacity = null;

    #[ORM\Column]
    private bool $hasPmrAccess = false;

    #[ORM\Column]
    private bool $hasAirConditioning = false;

    #[ORM\Column]
    private bool $hasSoundSystem = false;

    #[ORM\Column]
    private bool $hasProfessionalLighting = false;

    #[ORM\Column]
    private bool $hasWifi = false;

    #[ORM\Column]
    private bool $hasParking = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $usageConditions = null;

    #[ORM\Column]
    private bool $isBookable = false;

    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $bookingUrl = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $quoteRequestUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $contactName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Email]
    private ?string $contactEmail = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $contactPhone = null;

    #[ORM\Column]
    private bool $isActive = true;

    /** Ordre d'affichage manuel (slider + grille) ; à défaut, tri par position puis nom. */
    #[ORM\Column(nullable: true)]
    private ?int $position = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,SpaceGalleryImage> */
    #[ORM\OneToMany(mappedBy: 'space', targetEntity: SpaceGalleryImage::class, orphanRemoval: true)]
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getShortDescription(): ?string
    {
        return $this->shortDescription;
    }

    public function setShortDescription(?string $shortDescription): self
    {
        $this->shortDescription = $shortDescription;

        return $this;
    }

    public function getFullDescription(): ?string
    {
        return $this->fullDescription;
    }

    public function setFullDescription(?string $fullDescription): self
    {
        $this->fullDescription = $fullDescription;

        return $this;
    }

    public function getCategory(): ?SpaceCategory
    {
        return $this->category;
    }

    public function setCategory(?SpaceCategory $category): self
    {
        $this->category = $category;

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

    public function getCapacity(): ?int
    {
        return $this->capacity;
    }

    public function setCapacity(?int $capacity): self
    {
        $this->capacity = $capacity;

        return $this;
    }

    public function getSurfaceM2(): ?int
    {
        return $this->surfaceM2;
    }

    public function setSurfaceM2(?int $surfaceM2): self
    {
        $this->surfaceM2 = $surfaceM2;

        return $this;
    }

    public function getSeatedCapacity(): ?int
    {
        return $this->seatedCapacity;
    }

    public function setSeatedCapacity(?int $seatedCapacity): self
    {
        $this->seatedCapacity = $seatedCapacity;

        return $this;
    }

    public function getStandingCapacity(): ?int
    {
        return $this->standingCapacity;
    }

    public function setStandingCapacity(?int $standingCapacity): self
    {
        $this->standingCapacity = $standingCapacity;

        return $this;
    }

    public function hasPmrAccess(): bool
    {
        return $this->hasPmrAccess;
    }

    public function setHasPmrAccess(bool $hasPmrAccess): self
    {
        $this->hasPmrAccess = $hasPmrAccess;

        return $this;
    }

    public function hasAirConditioning(): bool
    {
        return $this->hasAirConditioning;
    }

    public function setHasAirConditioning(bool $hasAirConditioning): self
    {
        $this->hasAirConditioning = $hasAirConditioning;

        return $this;
    }

    public function hasSoundSystem(): bool
    {
        return $this->hasSoundSystem;
    }

    public function setHasSoundSystem(bool $hasSoundSystem): self
    {
        $this->hasSoundSystem = $hasSoundSystem;

        return $this;
    }

    public function hasProfessionalLighting(): bool
    {
        return $this->hasProfessionalLighting;
    }

    public function setHasProfessionalLighting(bool $hasProfessionalLighting): self
    {
        $this->hasProfessionalLighting = $hasProfessionalLighting;

        return $this;
    }

    public function hasWifi(): bool
    {
        return $this->hasWifi;
    }

    public function setHasWifi(bool $hasWifi): self
    {
        $this->hasWifi = $hasWifi;

        return $this;
    }

    public function hasParking(): bool
    {
        return $this->hasParking;
    }

    public function setHasParking(bool $hasParking): self
    {
        $this->hasParking = $hasParking;

        return $this;
    }

    public function getUsageConditions(): ?string
    {
        return $this->usageConditions;
    }

    public function setUsageConditions(?string $usageConditions): self
    {
        $this->usageConditions = $usageConditions;

        return $this;
    }

    public function isBookable(): bool
    {
        return $this->isBookable;
    }

    public function setIsBookable(bool $isBookable): self
    {
        $this->isBookable = $isBookable;

        return $this;
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

    public function getQuoteRequestUrl(): ?string
    {
        return $this->quoteRequestUrl;
    }

    public function setQuoteRequestUrl(?string $quoteRequestUrl): self
    {
        $this->quoteRequestUrl = $quoteRequestUrl;

        return $this;
    }

    public function getContactName(): ?string
    {
        return $this->contactName;
    }

    public function setContactName(?string $contactName): self
    {
        $this->contactName = $contactName;

        return $this;
    }

    public function getContactEmail(): ?string
    {
        return $this->contactEmail;
    }

    public function setContactEmail(?string $contactEmail): self
    {
        $this->contactEmail = $contactEmail;

        return $this;
    }

    public function getContactPhone(): ?string
    {
        return $this->contactPhone;
    }

    public function setContactPhone(?string $contactPhone): self
    {
        $this->contactPhone = $contactPhone;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;

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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /** @return Collection<int,SpaceGalleryImage> */
    public function getGalleryImages(): Collection
    {
        return $this->galleryImages;
    }

    public function __toString(): string
    {
        return $this->name ?: $this->slug;
    }
}
