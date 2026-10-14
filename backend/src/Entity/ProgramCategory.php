<?php

namespace App\Entity;

use App\Enum\ContentStatus;
use App\Repository\ProgramCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Rubrique de l'action culturelle (Arts, Dramathèque, Cinémathèque, Biblio…).
 * Chaque catégorie regroupe plusieurs programmes.
 */
#[ORM\Entity(repositoryClass: ProgramCategoryRepository::class)]
#[ORM\Table(name: 'program_categories')]
#[ORM\Index(name: 'idx_program_category_status', columns: ['status'])]
#[ORM\HasLifecycleCallbacks]
class ProgramCategory
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
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $coverImage = null;

    /** Dégradé Tailwind pour la carte (ex. « from-red-600 to-orange-600 »). */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $colorGradient = null;

    #[ORM\Column]
    private int $position = 0;

    #[ORM\Column(length: 20, enumType: ContentStatus::class)]
    private ContentStatus $status = ContentStatus::DRAFT;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,Program> */
    #[ORM\OneToMany(mappedBy: 'category', targetEntity: Program::class)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $programs;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->programs = new ArrayCollection();
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

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

    public function getColorGradient(): ?string
    {
        return $this->colorGradient;
    }

    public function setColorGradient(?string $colorGradient): self
    {
        $this->colorGradient = $colorGradient;

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

    /** @return Collection<int,Program> */
    public function getPrograms(): Collection
    {
        return $this->programs;
    }

    public function __toString(): string
    {
        return $this->title ?: $this->slug;
    }
}
