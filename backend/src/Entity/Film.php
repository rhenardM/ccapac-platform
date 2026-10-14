<?php

namespace App\Entity;

use App\Enum\ContentStatus;
use App\Repository\FilmRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Film projeté à la Cinémathèque (module indépendant du CMS). Un film peut
 * être projeté plusieurs fois (voir Screening) et appartenir à plusieurs
 * genres (voir FilmCategory).
 */
#[ORM\Entity(repositoryClass: FilmRepository::class)]
#[ORM\Table(name: 'films')]
#[ORM\Index(name: 'idx_film_status', columns: ['status'])]
#[ORM\HasLifecycleCallbacks]
class Film
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

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $synopsis = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $director = null;

    /** Libre : peut contenir plusieurs pays séparés par « / » (ex. "Sénégal / France"). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $country = null;

    #[ORM\Column(nullable: true)]
    private ?int $year = null;

    /** Durée en minutes. */
    #[ORM\Column(nullable: true)]
    private ?int $duration = null;

    /** Libre : sert aussi à noter le sous-titrage (ex. "Italien (sous-titré)"). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $language = null;

    /** Libre : "Tous publics", "12+", "16+"... */
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $ageRating = null;

    /** URL YouTube ou Vimeo. */
    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url]
    private ?string $trailerUrl = null;

    /** @var string[] */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $cast = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $poster = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $backdrop = null;

    #[ORM\Column(length: 20, enumType: ContentStatus::class)]
    private ContentStatus $status = ContentStatus::DRAFT;

    /** Distinct du statut éditorial : masque un film du site sans en perdre l'historique. */
    #[ORM\Column]
    private bool $archived = false;

    #[ORM\Column]
    private int $viewCount = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,FilmCategory> */
    #[ORM\ManyToMany(targetEntity: FilmCategory::class, inversedBy: 'films')]
    #[ORM\JoinTable(name: 'film_film_category')]
    private Collection $categories;

    /** @var Collection<int,FilmGalleryImage> */
    #[ORM\OneToMany(mappedBy: 'film', targetEntity: FilmGalleryImage::class, orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $galleryImages;

    /** @var Collection<int,Screening> */
    #[ORM\OneToMany(mappedBy: 'film', targetEntity: Screening::class)]
    private Collection $screenings;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->categories = new ArrayCollection();
        $this->galleryImages = new ArrayCollection();
        $this->screenings = new ArrayCollection();
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

    public function getSynopsis(): ?string
    {
        return $this->synopsis;
    }

    public function setSynopsis(?string $synopsis): self
    {
        $this->synopsis = $synopsis;

        return $this;
    }

    public function getDirector(): ?string
    {
        return $this->director;
    }

    public function setDirector(?string $director): self
    {
        $this->director = $director;

        return $this;
    }

    public function getCountry(): ?string
    {
        return $this->country;
    }

    public function setCountry(?string $country): self
    {
        $this->country = $country;

        return $this;
    }

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(?int $year): self
    {
        $this->year = $year;

        return $this;
    }

    public function getDuration(): ?int
    {
        return $this->duration;
    }

    public function setDuration(?int $duration): self
    {
        $this->duration = $duration;

        return $this;
    }

    public function getLanguage(): ?string
    {
        return $this->language;
    }

    public function setLanguage(?string $language): self
    {
        $this->language = $language;

        return $this;
    }

    public function getAgeRating(): ?string
    {
        return $this->ageRating;
    }

    public function setAgeRating(?string $ageRating): self
    {
        $this->ageRating = $ageRating;

        return $this;
    }

    public function getTrailerUrl(): ?string
    {
        return $this->trailerUrl;
    }

    public function setTrailerUrl(?string $trailerUrl): self
    {
        $this->trailerUrl = $trailerUrl;

        return $this;
    }

    /** @return string[] */
    public function getCast(): array
    {
        return $this->cast ?? [];
    }

    /** @param string[]|null $cast */
    public function setCast(?array $cast): self
    {
        $this->cast = $cast;

        return $this;
    }

    public function getPoster(): ?string
    {
        return $this->poster;
    }

    public function setPoster(?string $poster): self
    {
        $this->poster = $poster;

        return $this;
    }

    public function getBackdrop(): ?string
    {
        return $this->backdrop;
    }

    public function setBackdrop(?string $backdrop): self
    {
        $this->backdrop = $backdrop;

        return $this;
    }

    public function getStatus(): ContentStatus
    {
        return $this->status;
    }

    public function setStatus(ContentStatus $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function isArchived(): bool
    {
        return $this->archived;
    }

    public function setArchived(bool $archived): self
    {
        $this->archived = $archived;

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

    /** @return Collection<int,FilmCategory> */
    public function getCategories(): Collection
    {
        return $this->categories;
    }

    public function addCategory(FilmCategory $category): self
    {
        if (!$this->categories->contains($category)) {
            $this->categories->add($category);
        }

        return $this;
    }

    public function removeCategory(FilmCategory $category): self
    {
        $this->categories->removeElement($category);

        return $this;
    }

    /** @return Collection<int,FilmGalleryImage> */
    public function getGalleryImages(): Collection
    {
        return $this->galleryImages;
    }

    /** @return Collection<int,Screening> */
    public function getScreenings(): Collection
    {
        return $this->screenings;
    }

    public function __toString(): string
    {
        return $this->title ?: $this->slug;
    }
}
