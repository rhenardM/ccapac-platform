<?php

namespace App\Entity;

use App\Enum\ContentStatus;
use App\Repository\HomeHeroSlideRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Diapositive du grand bandeau (« Hero ») de la page d'accueil : image de
 * fond, texte, bouton d'action redirigeant vers une page du site. Plusieurs
 * diapositives publiées défilent en carrousel ; sans diapositive publiée, le
 * front affiche un repli statique codé en dur.
 */
#[ORM\Entity(repositoryClass: HomeHeroSlideRepository::class)]
#[ORM\Table(name: 'home_hero_slides')]
#[ORM\Index(name: 'idx_home_hero_slide_status', columns: ['status'])]
#[ORM\HasLifecycleCallbacks]
class HomeHeroSlide
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $title = '';

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $subtitle = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $buttonText = null;

    /** Chemin ou URL de destination du bouton (ex. « /agenda », « /cinematheque »). */
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $buttonLink = null;

    /** Obligatoire : une diapositive sans image ne peut pas s'afficher côté site. */
    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\NotBlank(message: 'Une image de fond est obligatoire.')]
    private ?string $image = null;

    /** Ordre d'affichage manuel dans le carrousel. */
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

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getSubtitle(): ?string
    {
        return $this->subtitle;
    }

    public function setSubtitle(?string $subtitle): self
    {
        $this->subtitle = $subtitle;

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

    public function getButtonText(): ?string
    {
        return $this->buttonText;
    }

    public function setButtonText(?string $buttonText): self
    {
        $this->buttonText = $buttonText;

        return $this;
    }

    public function getButtonLink(): ?string
    {
        return $this->buttonLink;
    }

    public function setButtonLink(?string $buttonLink): self
    {
        $this->buttonLink = $buttonLink;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;

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

    public function __toString(): string
    {
        return $this->title ?: sprintf('Diapositive #%d', $this->id ?? 0);
    }
}
