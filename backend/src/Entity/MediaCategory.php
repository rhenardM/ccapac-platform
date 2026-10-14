<?php

namespace App\Entity;

use App\Repository\MediaCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Catégorie de la bibliothèque média (Concert, Danse, Théâtre…).
 * Sert au filtrage de la médiathèque publique du site.
 */
#[ORM\Entity(repositoryClass: MediaCategoryRepository::class)]
#[ORM\Table(name: 'media_categories')]
#[ORM\UniqueConstraint(name: 'uniq_media_category_slug', columns: ['slug'])]
#[ORM\HasLifecycleCallbacks]
class MediaCategory
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

    #[ORM\Column]
    private int $position = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,MediaAsset> */
    #[ORM\OneToMany(mappedBy: 'category', targetEntity: MediaAsset::class)]
    private Collection $medias;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->medias = new ArrayCollection();
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

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
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

    /** @return Collection<int,MediaAsset> */
    public function getMedias(): Collection
    {
        return $this->medias;
    }

    public function __toString(): string
    {
        return $this->name ?: $this->slug;
    }
}
